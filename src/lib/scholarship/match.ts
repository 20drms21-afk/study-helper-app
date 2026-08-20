import { prisma } from "@/lib/prisma";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  scholarshipMatchSchema,
  scholarshipMatchSystemPrompt,
  scholarshipMatchUserPrompt,
} from "@/lib/prompts/scholarshipMatch";
import { recordAiUsage, AiUsageFeature, AiUsageStatus, newOperationId, summarizeAiError } from "@/lib/ai/aiUsage";

// ScholarshipListing은 KOSAF 동기화마다 만료분을 정리하긴 하지만(현재 실측 20~30여 건),
// 프롬프트가 "모든 장학금에 대해 빠짐없이 결과를 반환"하도록 지시하고 있어 후보 수가
// 늘어나면 입력·출력 토큰이 함께 선형으로 늘어난다 — ActivityListing(getActivitiesForUser,
// MAX_DISPLAYED_ACTIVITIES=60)과 같은 이유로 상한을 둔다. 마감이 가까운 것부터 우선
// 포함되도록 정렬 후 자른다.
const MAX_SCHOLARSHIP_CANDIDATES = 150;

export interface ScholarshipMatchResult {
  listingId: string;
  provider: string;
  name: string;
  kind: string | null;
  amountText: string | null;
  applyPeriodText: string | null;
  applyUrl: string | null;
  reason: string;
}

export async function isScholarshipDataConfigured(): Promise<boolean> {
  const listingCount = await prisma.scholarshipListing.count();
  return listingCount > 0;
}

// 호출 전 isScholarshipDataConfigured()로 데이터 존재 여부를 먼저 확인할 것 —
// 이 함수는 항상 Claude를 호출하므로 할당량 체크는 호출부(route)에서 미리 해야 함.
export async function matchScholarships(
  userId: string,
  plan: string
): Promise<{ matches: ScholarshipMatchResult[] }> {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  const listings = await prisma.scholarshipListing.findMany({
    orderBy: [{ applyEndDate: { sort: "asc", nulls: "last" } }],
    take: MAX_SCHOLARSHIP_CANDIDATES,
  });

  const operationId = newOperationId("scholarship");
  const metadata = { scholarshipCandidateCount: listings.length };

  let message;
  try {
    message = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: scholarshipMatchSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: scholarshipMatchUserPrompt(
            {
              region: profile?.region ?? null,
              major: profile?.major ?? null,
              gradeLevel: profile?.gradeLevel ?? null,
              incomeBracket: profile?.incomeBracket ?? null,
              gpa: profile?.gpa ?? null,
            },
            listings.map((l) => ({
              listingId: l.id,
              provider: l.provider,
              name: l.name,
              eligibilityText: l.eligibilityText,
            }))
          ),
        },
      ],
      output_config: { format: zodOutputFormat(scholarshipMatchSchema) },
    });
  } catch (error) {
    await recordAiUsage({
      userId,
      plan,
      feature: AiUsageFeature.SCHOLARSHIP_MATCH,
      operationId,
      status: AiUsageStatus.FAILED,
      metadata: { ...metadata, ...summarizeAiError(error) },
    });
    throw error;
  }

  await recordAiUsage({
    userId,
    plan,
    feature: AiUsageFeature.SCHOLARSHIP_MATCH,
    operationId,
    usage: message.usage,
    metadata,
  });
  const parsed = message.parsed_output;
  if (!parsed) {
    return { matches: [] };
  }

  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const matches: ScholarshipMatchResult[] = parsed.results
    .filter((r) => r.eligible && listingMap.has(r.listingId))
    .map((r) => {
      const listing = listingMap.get(r.listingId)!;
      return {
        listingId: listing.id,
        provider: listing.provider,
        name: listing.name,
        kind: listing.kind,
        amountText: listing.amountText,
        applyPeriodText: listing.applyPeriodText,
        applyUrl: listing.applyUrl,
        reason: r.reason,
      };
    });

  return { matches };
}

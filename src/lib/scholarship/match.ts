import { prisma } from "@/lib/prisma";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  scholarshipMatchSchema,
  scholarshipMatchSystemPrompt,
  scholarshipMatchUserPrompt,
} from "@/lib/prompts/scholarshipMatch";

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
  userId: string
): Promise<{ matches: ScholarshipMatchResult[] }> {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  const listings = await prisma.scholarshipListing.findMany();

  const message = await anthropic.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: scholarshipMatchSystemPrompt(),
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

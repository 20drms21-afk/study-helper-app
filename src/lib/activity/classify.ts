import { anthropic, CLAUDE_BLUEPRINT_MODEL } from "@/lib/anthropic";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  activityFieldMatchSchema,
  activityFieldMatchSystemPrompt,
  activityFieldMatchUserPrompt,
} from "@/lib/prompts/activityFieldMatch";
import {
  recordAiUsage,
  AiUsageFeature,
  AiUsageStatus,
  newOperationId,
  summarizeAiError,
} from "@/lib/ai/aiUsage";

// major/interests 원문을 ACTIVITY_FIELD_TAG_CATEGORIES 중 0개 이상으로 분류한다.
// PUT /api/profile에서 major/interests가 바뀌었을 때만 호출된다 — 페이지 조회마다
// 호출하지 않음(결과는 StudentProfile.activityFieldTags에 캐싱).
// 쿼터초과/실패를 조용히 넘기는 soft-fail 정책은 호출부(프로필 라우트) 책임이다 — 이
// 함수 자체는 실패 시 AiUsageStatus.FAILED로 기록만 하고 그대로 throw한다(백필
// 스크립트처럼 실패 처리 정책이 다른 곳에서도 그대로 재사용하기 위함).
export async function classifyActivityFieldTags(
  userId: string,
  plan: string,
  major: string | null,
  interests: string | null
): Promise<string[]> {
  if (!major && !interests) return [];

  const operationId = newOperationId("activity");

  let message;
  try {
    message = await anthropic.messages.parse({
      model: CLAUDE_BLUEPRINT_MODEL,
      max_tokens: 1024,
      system: [
        { type: "text", text: activityFieldMatchSystemPrompt(), cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: activityFieldMatchUserPrompt(major, interests) }],
      output_config: { format: zodOutputFormat(activityFieldMatchSchema) },
    });
  } catch (error) {
    await recordAiUsage({
      userId,
      plan,
      feature: AiUsageFeature.ACTIVITY_FIELD_MATCH,
      operationId,
      model: CLAUDE_BLUEPRINT_MODEL,
      status: AiUsageStatus.FAILED,
      metadata: summarizeAiError(error),
    });
    throw error;
  }

  await recordAiUsage({
    userId,
    plan,
    feature: AiUsageFeature.ACTIVITY_FIELD_MATCH,
    operationId,
    model: CLAUDE_BLUEPRINT_MODEL,
    usage: message.usage,
  });

  return message.parsed_output?.categories ?? [];
}

import { randomUUID } from "crypto";
import type { Usage } from "@anthropic-ai/sdk/resources/messages";
import { prisma } from "@/lib/prisma";
import { CLAUDE_MODEL } from "@/lib/anthropic";
import { AiUsageFeature, AiUsageStatus } from "@/generated/prisma/client";
import { estimateClaudeCost, ZERO_CLAUDE_COST, type ClaudeTokenUsage } from "./pricing";

export { AiUsageFeature, AiUsageStatus };

/**
 * Claude 응답의 usage에서 토큰 값을 뽑는다. 전부 optional/nullable 필드라서
 * (특히 cache_creation_input_tokens/cache_read_input_tokens는 캐시를 안 쓰면
 * null로 온다) 하나씩 ?? 0으로 안전하게 처리한다.
 */
export function extractTokenUsage(usage: Usage | null | undefined): ClaudeTokenUsage {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheCreationInputTokens: usage?.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: usage?.cache_read_input_tokens ?? 0,
  };
}

/** `exam_${id}`처럼 operationId에 사람이 읽기 쉬운 prefix를 붙인다. */
export function newOperationId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

/**
 * 실패한 Claude 호출의 에러를 metadata에 넣을 수 있는 최소 정보로 요약한다.
 * 에러 메시지 원문은 넣지 않는다(요청 내용이 섞여 들어올 수 있음) — HTTP 상태 코드나
 * 에러 클래스 이름 정도의 구조적 정보만 남긴다.
 */
export function summarizeAiError(error: unknown): { errorType: string } {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") {
      return { errorType: `http_${status}` };
    }
  }
  if (error instanceof Error) {
    return { errorType: error.name || "Error" };
  }
  return { errorType: "unknown" };
}

export interface RecordAiUsageInput {
  userId: string;
  /** 호출 시점 User.plan 스냅샷 ("free" | "pro" | 추후 "master") */
  plan: string;
  feature: AiUsageFeature;
  /** 같은 사용자 작업에 속한 여러 Claude 호출을 묶는 키 (newOperationId로 생성) */
  operationId: string;
  /**
   * 실패(SUCCESS 아님)일 때는 생략하거나 명시적으로 "FAILED"를 넘긴다.
   * 기본값 SUCCESS.
   */
  status?: AiUsageStatus;
  /** 생략 시 CLAUDE_MODEL(현재 claude-sonnet-5) */
  model?: string;
  /**
   * Claude 응답의 usage. API 호출 자체가 실패해서 usage를 못 받은 경우 undefined/null로
   * 넘기면 토큰·비용을 전부 0으로 기록한다 — 실패 시 비용을 추정해서 채우지 않는다.
   */
  usage?: Usage | null;
  /**
   * 숫자/구조형 정보만. PDF 원문·채팅 전문·학생 답안·장학금 목록 원문 등 실제 콘텐츠는
   * 절대 넣지 않는다(pageCount, questionCount 같은 것만).
   */
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Claude API 호출 1건을 AiUsageEvent 1행으로 영구 저장한다. 이 함수가 실패해도
 * (DB 오류 등) 호출한 기능(노트 생성/채점 등) 자체는 절대 막지 않는다 — 내부에서
 * 에러를 잡아 로그만 남기고 삼킨다.
 */
export async function recordAiUsage(input: RecordAiUsageInput): Promise<void> {
  const {
    userId,
    plan,
    feature,
    operationId,
    status = AiUsageStatus.SUCCESS,
    model = CLAUDE_MODEL,
    usage,
    metadata,
  } = input;

  const tokens = extractTokenUsage(usage);
  // usage가 없다는 건 응답 자체를 못 받았다는 뜻(호출이 throw됨) — 이 경우 비용은
  // 추정하지 않고 0으로 남긴다. usage가 있으면(설령 결과 파싱은 실패했더라도)
  // Anthropic 쪽에는 실제 과금이 발생한 것이므로 정상 비용을 계산한다.
  const cost = usage ? estimateClaudeCost(model, tokens) : ZERO_CLAUDE_COST;

  console.log(
    `[ai-usage] ${feature} op=${operationId} status=${status} ` +
      `input=${tokens.inputTokens} output=${tokens.outputTokens} ` +
      `cache_write=${tokens.cacheCreationInputTokens} cache_read=${tokens.cacheReadInputTokens} ` +
      `cost=$${cost.totalCostUsd.toFixed(6)}`
  );

  try {
    await prisma.aiUsageEvent.create({
      data: {
        userId,
        plan,
        feature,
        operationId,
        status,
        model,
        inputTokens: tokens.inputTokens,
        outputTokens: tokens.outputTokens,
        cacheCreationInputTokens: tokens.cacheCreationInputTokens,
        cacheReadInputTokens: tokens.cacheReadInputTokens,
        apiCallCount: 1,
        estimatedInputCostUsd: cost.inputCostUsd,
        estimatedOutputCostUsd: cost.outputCostUsd,
        estimatedCacheCreationCostUsd: cost.cacheCreationCostUsd,
        estimatedCacheReadCostUsd: cost.cacheReadCostUsd,
        estimatedTotalCostUsd: cost.totalCostUsd,
        metadata: metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error("recordAiUsage failed (AI 원가 로그 저장 실패 — 기능 자체는 계속 진행)", err);
  }
}

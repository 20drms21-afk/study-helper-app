// Claude API 가격표(100만 토큰당 USD).
//
// 출처: Anthropic 공식 가격 기준(claude-api 스킬 레퍼런스, 2026-06-24 캐시 기준).
// Claude Sonnet 5 정가는 입력 $3.00 / 출력 $15.00 이지만, 2026-08-31까지는
// 인트로 가격 입력 $2.00 / 출력 $10.00 이 적용된다. 오늘(2026-08-09) 기준으로는
// 인트로 가격이 맞다.
//
// 캐시 쓰기/읽기 배율은 Anthropic이 전 모델 공통으로 적용하는 표준 공식이다:
//   - cache write, 5분 TTL(우리가 쓰는 기본값, cache_control: {type:"ephemeral"}) = 기본 입력가 × 1.25
//   - cache write, 1시간 TTL                                                    = 기본 입력가 × 2
//   - cache read                                                                 = 기본 입력가 × 0.1
// StudyBite 코드는 전부 TTL을 지정하지 않은 { type: "ephemeral" }(=5분 TTL)만 쓰므로
// 여기서는 5분 TTL 배율만 반영한다. 나중에 1시간 TTL을 쓰는 곳이 생기면 이 배율을
// 그대로 재사용하지 말고 별도 필드를 추가해야 한다.
//
// ⚠️ 2026-08-31 이후에는 STANDARD 가격으로 갈아끼워야 한다. 날짜를 보고 자동으로
// 전환하는 로직 대신 상수를 코드 리뷰로 직접 바꾸는 방식을 택했다 — 가격이 조용히
// 자동 전환되면 원가 리포트가 왜 갑자기 달라졌는지 나중에 추적하기 어렵다.
const CACHE_WRITE_5M_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

function derivePricing(inputPerMillionUsd: number, outputPerMillionUsd: number) {
  return {
    inputPerMillionUsd,
    outputPerMillionUsd,
    cacheCreationPerMillionUsd: inputPerMillionUsd * CACHE_WRITE_5M_MULTIPLIER,
    cacheReadPerMillionUsd: inputPerMillionUsd * CACHE_READ_MULTIPLIER,
  } as const;
}

// 현재 활성 가격 — claude-sonnet-5, 2026-08-31까지 적용되는 인트로 가격.
const CLAUDE_SONNET_5_PRICING = derivePricing(2.0, 10.0);

// 참고용: 2026-08-31 이후 정가로 돌아갈 때 CLAUDE_SONNET_5_PRICING을
// 이 값으로 교체하면 된다. (지금은 사용되지 않음 — 삭제하지 말 것)
export const CLAUDE_SONNET_5_STANDARD_PRICING = derivePricing(3.0, 15.0);

// claude-haiku-4-5 — Sonnet 5 인트로가의 절반 수준(인트로/정가 구분 없이 고정가).
// ⚠️ 캐시 최소 토큰 기준이 Sonnet 5(1024토큰)보다 훨씬 높은 4096토큰이다 — 짧은
// 시스템 프롬프트(예: examBlueprintSystemPrompt)는 Sonnet 5에서는 캐시가 잡혔어도
// Haiku 4.5로는 캐시가 전혀 안 잡힐 수 있다. estimateClaudeCost 자체는 실제
// cache_creation/cache_read 토큰이 0으로 오면 자동으로 0원 처리하므로 별도 분기 불필요.
const CLAUDE_HAIKU_4_5_PRICING = derivePricing(1.0, 5.0);

/** 모델 ID → 가격표. 새 모델을 쓰게 되면 여기에 추가하고, 없는 모델은 estimateClaudeCost가 에러로 알려준다. */
export const CLAUDE_PRICING = {
  "claude-sonnet-5": CLAUDE_SONNET_5_PRICING,
  "claude-haiku-4-5": CLAUDE_HAIKU_4_5_PRICING,
} as const;

export type PricedClaudeModel = keyof typeof CLAUDE_PRICING;

export interface ClaudeTokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

export interface EstimatedClaudeCost {
  inputCostUsd: number;
  outputCostUsd: number;
  cacheCreationCostUsd: number;
  cacheReadCostUsd: number;
  totalCostUsd: number;
}

export function isPricedClaudeModel(model: string): model is PricedClaudeModel {
  return model in CLAUDE_PRICING;
}

/**
 * 토큰 종류별로 실제 단가를 적용해 비용을 계산한다. 일반 입력/캐시 생성/캐시 읽기를
 * 전부 같은 입력 단가로 계산하면 안 되므로(캐시 생성은 1.25배, 캐시 읽기는 0.1배)
 * 반드시 이 함수를 거쳐서 계산한다.
 *
 * 가격 정보가 없는 모델이 들어오면(예: 아직 CLAUDE_PRICING에 등록 안 된 모델) 조용히
 * 0원으로 넘어가지 않고 에러를 던진다 — 원가 데이터가 틀리게 쌓이는 것보다 그 자리에서
 * 드러나는 게 낫다.
 */
export function estimateClaudeCost(model: string, usage: ClaudeTokenUsage): EstimatedClaudeCost {
  if (!isPricedClaudeModel(model)) {
    throw new Error(
      `[usageCost] 가격 정보가 없는 모델입니다: "${model}". src/lib/ai/pricing.ts의 CLAUDE_PRICING에 추가하세요.`
    );
  }
  const pricing = CLAUDE_PRICING[model];

  const inputCostUsd = (usage.inputTokens / 1_000_000) * pricing.inputPerMillionUsd;
  const outputCostUsd = (usage.outputTokens / 1_000_000) * pricing.outputPerMillionUsd;
  const cacheCreationCostUsd =
    (usage.cacheCreationInputTokens / 1_000_000) * pricing.cacheCreationPerMillionUsd;
  const cacheReadCostUsd = (usage.cacheReadInputTokens / 1_000_000) * pricing.cacheReadPerMillionUsd;

  return {
    inputCostUsd,
    outputCostUsd,
    cacheCreationCostUsd,
    cacheReadCostUsd,
    totalCostUsd: inputCostUsd + outputCostUsd + cacheCreationCostUsd + cacheReadCostUsd,
  };
}

export const ZERO_CLAUDE_COST: EstimatedClaudeCost = {
  inputCostUsd: 0,
  outputCostUsd: 0,
  cacheCreationCostUsd: 0,
  cacheReadCostUsd: 0,
  totalCostUsd: 0,
};

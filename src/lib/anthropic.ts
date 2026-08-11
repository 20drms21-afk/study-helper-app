import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.anthropic = anthropic;
}

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

// 예상문제 Blueprint(문항별 시간 배분만 정하는 단순 구조화 출력 작업)는 EXAM_GENERATE만큼의
// 추론력이 필요하지 않다고 판단해 실험적으로 Haiku로 내려서 원가/품질을 실측 비교한다.
// 결과가 안 좋으면 CLAUDE_MODEL로 되돌리면 됨 — 호출부(exams/route.ts)에서 이 상수 하나만 참조.
export const CLAUDE_BLUEPRINT_MODEL = process.env.CLAUDE_BLUEPRINT_MODEL || "claude-haiku-4-5";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { planLabel } from "@/lib/subscription";
import { CLAUDE_MODEL } from "@/lib/anthropic";
import { CLAUDE_PRICING, isPricedClaudeModel } from "@/lib/ai/pricing";

// 세 플랜 모두 한도는 "기능 호출 횟수"가 아니라 "토큰"이다 — 기능마다 실제로 소모하는 Claude
// 토큰 편차가 커서(짧은 채팅 한 턴 vs 페이지 많은 PPTX 시험 생성) 횟수 기준은 체감 사용량과
// 잘 안 맞았다. AiUsageEvent(Claude 호출 1건당 1행, 실제 토큰 수를 그대로 기록)를 그 달의
// 토큰 합으로 집계해서 쓴다 — 별도 카운터 테이블을 새로 만들 필요 없이 원가 로그 테이블
// 하나가 두 역할(원가 추적 + 쿼터 집계)을 겸한다.
//
// Pro/Master도 예전엔 완전 무제한이었지만, 무제한이면 헤비 유저 한 명이 월 구독료보다 훨씬
// 큰 Claude 비용을 낼 수 있어서 상한을 둔다. **주의**: 이 한도는 단순 토큰 "개수"가 아니라
// getMonthlyTokenUsage에서 원가 비율로 가중합산한 값이다 — 출력 토큰은 입력 토큰의 5배,
// 캐시읽기는 0.1배 비싸므로(src/lib/ai/pricing.ts), 가중치 없이 그냥 더하면 "한도를 전부
// 출력 토큰으로 채우는" 최악의 경우 실제 원가가 구독료를 넘어버리는 문제가 있다. 가중합산을
// 쓰면 한도를 다 채웠을 때의 실제 원가가 토큰 종류와 무관하게 `한도 × 현재 입력단가`로
// 고정되므로, Pro 기본값(55만)은 **원가율(최악의 경우 원가 ÷ 구독료) 30%를 목표로 역산**했다
// — 2026-08-31 이후 정가(입력 $3/M, 인트로가보다 비쌈)로 계산해야 그 이후에도 안전하다:
//   Pro: 한도 × $3/M = 목표원가($7,800÷1,380환율×30%≈$1.70) → 약 55만 토큰
// (Pro 요금은 접근성을 높이려고 ₩9,900→₩7,800으로 낮췄고, 한도도 낮아진 매출에 맞춰
// 70만→55만으로 같이 줄여서 원가율 30%를 유지함 — 가격만 낮추고 한도를 그대로 뒀다면
// 원가율이 37%로 올라갔을 것)
//
// Master(120만)는 같은 30% 원가율 산식(≈100만)을 그대로 쓰지 않았다 — 100만으로 두면
// 원당 토큰이 Pro(55만÷7,800≈70.5토큰/원)보다 오히려 낮아져서 "더 비싼데 원당 가치는
// 더 낮은" 역전이 생기고, 업그레이드 명분이 약해진다. 그래서 Master는 Pro보다 원당 토큰이
// 더 후하도록(볼륨 할인) 역산했다 — 120만÷13,800≈87토큰/원. 그 결과 원가율은
// 36%(120만×$3/M÷($13,800÷1,380환율)≈36%)로 Pro(30%)보다 조금 높지만 여전히 마진
// 64% 이상 남는 선. (Master 요금은 처음 ₩14,800이었다가 Pro/Master 가격 배수를
// 완화하려고 ₩13,800으로 낮춘 이력이 있다 — 원가는 요금과 무관하게 고정이라 토큰 한도는
// 그대로 두고 요금만 조정했다.)
// (환율은 근사치라 정확한 %가 아니라 근사값 — 정확한 원가율이 중요하면 실제 청구 시점
// 환율로 재계산할 것). 문서 위주 사용자(이 앱의 실제 주 사용 패턴 — 긴 PDF/PPTX를 입력으로,
// 짧은 JSON을 출력으로)는 입력 토큰이 압도적으로 많아서 가중치의 영향을 거의 안 받고 체감
// 한도는 숫자 그대로다. 무료 플랜은 구독료가 없어 이 원가율 로직이 적용되지 않고, 대신
// "무료 체험 1인당 감당 가능한 절대 비용"으로 따로 정함 — 처음엔 30만이었다가(정가 기준
// 최악 $0.9) 절감 효과 자체보다(30만→20만로 줄여도 유저 1명당 최대 절감액은 월 ₩400
// 수준) 무료 유저 규모가 커질 때의 총비용을 보수적으로 관리하고 싶어서 20만으로 낮춤
// (정가 기준 최악 $0.6≈₩830, 인트로가 기준 $0.4≈₩550). 너무 낮추면 체험판이 "제대로
// 써보기도 전에 막히는" 문제가 생겨 전환 퍼널을 해치므로, 이보다 더 낮출 땐 실사용
// 데이터(노트/시험 생성 1회가 실제로 토큰을 얼마나 쓰는지)를 먼저 확인하고 판단할 것.
export const FREE_MONTHLY_TOKEN_LIMIT = Number(process.env.FREE_PLAN_MONTHLY_TOKEN_LIMIT ?? 200_000);
export const PRO_MONTHLY_TOKEN_LIMIT = Number(process.env.PRO_PLAN_MONTHLY_TOKEN_LIMIT ?? 550_000);
export const MASTER_MONTHLY_TOKEN_LIMIT = Number(process.env.MASTER_PLAN_MONTHLY_TOKEN_LIMIT ?? 1_200_000);

export interface QuotaStatus {
  plan: "free" | "pro" | "master";
  limit: number | null;
  used: number;
  allowed: boolean;
}

function currentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

// CLAUDE_PRICING에 없는 모델(설정 실수 등)이 들어와도 쿼터 계산 자체가 죽으면 안 되므로
// claude-sonnet-5 가격을 안전한 기본값으로 폴백한다 — 원가 로그(recordAiUsage)는 별도로
// isPricedClaudeModel을 못 만족하면 에러를 던지므로 그쪽에서 이미 드러남.
function currentTokenWeights() {
  const pricing = isPricedClaudeModel(CLAUDE_MODEL)
    ? CLAUDE_PRICING[CLAUDE_MODEL]
    : CLAUDE_PRICING["claude-sonnet-5"];
  return {
    output: pricing.outputPerMillionUsd / pricing.inputPerMillionUsd,
    cacheCreation: pricing.cacheCreationPerMillionUsd / pricing.inputPerMillionUsd,
    cacheRead: pricing.cacheReadPerMillionUsd / pricing.inputPerMillionUsd,
  };
}

/**
 * 이번 달 누적 토큰 사용량 = 입력 토큰 1개를 기준(가중치 1)으로 출력/캐시생성/캐시읽기
 * 토큰을 실제 단가 비율로 가중합산한 값. 그냥 개수로 더하면 "한도를 전부 출력 토큰(입력의
 * 5배)으로 채우는" 최악의 경우 실제 원가가 한도를 훨씬 웃돌 수 있다 — 가중합산을 쓰면
 * 한도(limit)를 다 채웠을 때의 실제 원가가 토큰 종류와 무관하게 `limit × 현재 입력단가`로
 * 고정되므로, Pro/Master 한도가 구독료를 넘지 않게 보장하는 핵심 장치다(FREE_MONTHLY_TOKEN_LIMIT
 * 등 상수 옆 주석 참고). 가중치는 단가 "비율"이라 2026-08-31 인트로→정가 전환 때 절대
 * 단가($2→$3 등)가 바뀌어도 그대로 유효하다(출력/입력 비율이 인트로·정가 둘 다 정확히 5배).
 *
 * PDF 영어자료 변환(DeepL)은 Claude를 호출하지 않아 이 테이블에 행이 없으므로 이 합계에
 * 전혀 기여하지 않는다 — 그 기능은 자체 페이지 수 상한으로만 제한된다.
 */
export async function getMonthlyTokenUsage(userId: string, now = new Date()): Promise<number> {
  const { start, end } = currentMonthRange(now);
  const agg = await prisma.aiUsageEvent.aggregate({
    where: { userId, createdAt: { gte: start, lt: end } },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      cacheCreationInputTokens: true,
      cacheReadInputTokens: true,
    },
  });
  const weights = currentTokenWeights();
  const weighted =
    (agg._sum.inputTokens ?? 0) +
    (agg._sum.outputTokens ?? 0) * weights.output +
    (agg._sum.cacheCreationInputTokens ?? 0) * weights.cacheCreation +
    (agg._sum.cacheReadInputTokens ?? 0) * weights.cacheRead;
  return Math.round(weighted);
}

function tokenLimitFor(plan: "free" | "pro" | "master"): number {
  if (plan === "master") return MASTER_MONTHLY_TOKEN_LIMIT;
  if (plan === "pro") return PRO_MONTHLY_TOKEN_LIMIT;
  return FREE_MONTHLY_TOKEN_LIMIT;
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, email: true } });
  const plan: "free" | "pro" | "master" =
    user?.plan === "master" ? "master" : user?.plan === "pro" ? "pro" : "free";
  const used = await getMonthlyTokenUsage(userId);

  // 관리자 계정만 플랜과 무관하게 사용량 제한 없음.
  if (isAdmin(user?.email)) {
    return { plan, limit: null, used, allowed: true };
  }

  const limit = tokenLimitFor(plan);
  return { plan, limit, used, allowed: used < limit };
}

export function quotaExceededMessage(limit: number, plan: "free" | "pro" | "master" = "free"): string {
  const limitText = `${limit.toLocaleString("ko-KR")}토큰`;
  if (plan === "free") {
    return `이번 달 무료 토큰 사용량(${limitText})을 모두 사용했습니다. 요금제 페이지에서 업그레이드해주세요.`;
  }
  if (plan === "pro") {
    return `이번 달 ${planLabel(plan)} 플랜 토큰 사용량(${limitText})을 모두 사용했습니다. Master 플랜으로 업그레이드하거나 다음 달 초기화를 기다려주세요.`;
  }
  return `이번 달 ${planLabel(plan)} 플랜 토큰 사용량(${limitText})을 모두 사용했습니다. 다음 달 초기화를 기다려주세요.`;
}

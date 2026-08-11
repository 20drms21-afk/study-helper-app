// AiUsageEvent를 원가 리포트용 숫자로 집계하는 순수 조회 함수 모음.
// 관리자 대시보드 UI/라우트는 아직 없음 — 여기 함수들을 나중에 관리자 API나
// 스크립트에서 그대로 가져다 쓰면 된다.
import { prisma } from "@/lib/prisma";
import type { AiUsageFeature } from "@/generated/prisma/client";
import { CLAUDE_PRICING, isPricedClaudeModel } from "./pricing";

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  // Prisma.Decimal 인스턴스 — decimal.js 기반이라 toNumber()를 갖고 있다.
  if (typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: unknown }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

function currentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export interface FeatureCostSummary {
  feature: AiUsageFeature;
  callCount: number;
  avgTotalCostUsd: number;
  sumTotalCostUsd: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  avgCacheCreationTokens: number;
  avgCacheReadTokens: number;
}

/** 기능별 평균/합계 비용 — "예상문제 생성 1건 평균 비용" 같은 질문에 답한다. */
export async function getFeatureCostSummary(range?: { start: Date; end: Date }): Promise<FeatureCostSummary[]> {
  const where = range ? { createdAt: { gte: range.start, lt: range.end }, status: "SUCCESS" as const } : { status: "SUCCESS" as const };

  const grouped = await prisma.aiUsageEvent.groupBy({
    by: ["feature"],
    where,
    _count: { _all: true },
    _avg: {
      estimatedTotalCostUsd: true,
      inputTokens: true,
      outputTokens: true,
      cacheCreationInputTokens: true,
      cacheReadInputTokens: true,
    },
    _sum: { estimatedTotalCostUsd: true },
  });

  return grouped.map((g) => ({
    feature: g.feature,
    callCount: g._count._all,
    avgTotalCostUsd: toNumber(g._avg.estimatedTotalCostUsd),
    sumTotalCostUsd: toNumber(g._sum.estimatedTotalCostUsd),
    avgInputTokens: toNumber(g._avg.inputTokens),
    avgOutputTokens: toNumber(g._avg.outputTokens),
    avgCacheCreationTokens: toNumber(g._avg.cacheCreationInputTokens),
    avgCacheReadTokens: toNumber(g._avg.cacheReadInputTokens),
  }));
}

export interface PlanCostSummary {
  plan: string;
  callCount: number;
  distinctUserCount: number;
  sumTotalCostUsd: number;
  avgCostPerUserUsd: number;
}

/** 플랜별(Free/Pro/Master) 이번 달 총 원가와 유저당 평균 원가. */
export async function getPlanMonthlyCost(now = new Date()): Promise<PlanCostSummary[]> {
  const { start, end } = currentMonthRange(now);
  const rows = await prisma.aiUsageEvent.findMany({
    where: { createdAt: { gte: start, lt: end }, status: "SUCCESS" },
    select: { plan: true, userId: true, estimatedTotalCostUsd: true },
  });

  const byPlan = new Map<string, { cost: number; users: Set<string>; count: number }>();
  for (const row of rows) {
    const bucket = byPlan.get(row.plan) ?? { cost: 0, users: new Set<string>(), count: 0 };
    bucket.cost += toNumber(row.estimatedTotalCostUsd);
    bucket.users.add(row.userId);
    bucket.count += 1;
    byPlan.set(row.plan, bucket);
  }

  return Array.from(byPlan.entries()).map(([plan, bucket]) => ({
    plan,
    callCount: bucket.count,
    distinctUserCount: bucket.users.size,
    sumTotalCostUsd: bucket.cost,
    avgCostPerUserUsd: bucket.users.size > 0 ? bucket.cost / bucket.users.size : 0,
  }));
}

/** 사용자 1명의 이번 달 총 Claude API 원가. */
export async function getUserMonthlyCost(userId: string, now = new Date()): Promise<number> {
  const { start, end } = currentMonthRange(now);
  const result = await prisma.aiUsageEvent.aggregate({
    where: { userId, createdAt: { gte: start, lt: end }, status: "SUCCESS" },
    _sum: { estimatedTotalCostUsd: true },
  });
  return toNumber(result._sum.estimatedTotalCostUsd);
}

export interface OperationCostSummary {
  operationId: string;
  apiCallCount: number;
  sumInputTokens: number;
  sumOutputTokens: number;
  sumCacheCreationTokens: number;
  sumCacheReadTokens: number;
  sumTotalCostUsd: number;
}

/**
 * operationId 하나(=사용자 작업 1회)에 딸린 모든 Claude 호출을 합산한다.
 * 예상문제 생성(Blueprint + 실제 생성 2건), PDF 번역(페이지 수만큼) 처럼
 * 여러 Claude 호출로 이뤄진 작업 1건의 총 비용을 구할 때 쓴다.
 */
export async function getOperationCost(operationId: string): Promise<OperationCostSummary> {
  const rows = await prisma.aiUsageEvent.findMany({ where: { operationId } });
  return rows.reduce<OperationCostSummary>(
    (acc, row) => ({
      operationId,
      apiCallCount: acc.apiCallCount + row.apiCallCount,
      sumInputTokens: acc.sumInputTokens + row.inputTokens,
      sumOutputTokens: acc.sumOutputTokens + row.outputTokens,
      sumCacheCreationTokens: acc.sumCacheCreationTokens + row.cacheCreationInputTokens,
      sumCacheReadTokens: acc.sumCacheReadTokens + row.cacheReadInputTokens,
      sumTotalCostUsd: acc.sumTotalCostUsd + toNumber(row.estimatedTotalCostUsd),
    }),
    {
      operationId,
      apiCallCount: 0,
      sumInputTokens: 0,
      sumOutputTokens: 0,
      sumCacheCreationTokens: 0,
      sumCacheReadTokens: 0,
      sumTotalCostUsd: 0,
    }
  );
}

export interface CacheHitStats {
  feature: AiUsageFeature;
  callCount: number;
  cacheHitCallCount: number; // cacheReadInputTokens > 0인 호출 수
  cacheHitRate: number; // 0~1
  sumCacheReadTokens: number;
  /** 캐시로 절약된 추정 비용 — 캐시 읽기로 처리된 토큰을 만약 일반 input가로 계산했을 때와의 차액 */
  estimatedSavingsUsd: number;
}

/**
 * 기능별 캐시 적중률. system 프롬프트에 cache_control을 붙였는데도
 * cacheReadInputTokens가 계속 0이면(=최소 캐시 토큰 기준 미달이거나 프리픽스가
 * 매번 달라짐) 이 함수로 바로 드러난다 — 그런 기능은 cache_control을 유지할지
 * 재검토한다.
 */
export async function getCacheHitStats(range?: { start: Date; end: Date }): Promise<CacheHitStats[]> {
  const where = range
    ? { createdAt: { gte: range.start, lt: range.end }, status: "SUCCESS" as const }
    : { status: "SUCCESS" as const };
  const rows = await prisma.aiUsageEvent.findMany({
    where,
    select: {
      feature: true,
      model: true,
      cacheReadInputTokens: true,
      estimatedCacheReadCostUsd: true,
    },
  });

  const byFeature = new Map<
    AiUsageFeature,
    { callCount: number; cacheHitCallCount: number; cacheReadTokens: number; savings: number }
  >();

  for (const row of rows) {
    const bucket = byFeature.get(row.feature) ?? {
      callCount: 0,
      cacheHitCallCount: 0,
      cacheReadTokens: 0,
      savings: 0,
    };
    bucket.callCount += 1;
    if (row.cacheReadInputTokens > 0) {
      bucket.cacheHitCallCount += 1;
      bucket.cacheReadTokens += row.cacheReadInputTokens;
      // 캐시 읽기 토큰을 일반 input 단가로 계산했다면 냈을 비용 - 실제로 낸 캐시 읽기 비용.
      // 가격표가 없는(=이후 모델이 교체된) 행은 현재 단가로 비교할 수 없으므로 절감액
      // 계산에서 제외한다(0으로 취급) — 추측해서 채우지 않는다.
      if (isPricedClaudeModel(row.model)) {
        const inputRate = CLAUDE_PRICING[row.model].inputPerMillionUsd;
        const wouldHaveCost = (row.cacheReadInputTokens / 1_000_000) * inputRate;
        bucket.savings += wouldHaveCost - toNumber(row.estimatedCacheReadCostUsd);
      }
    }
    byFeature.set(row.feature, bucket);
  }

  return Array.from(byFeature.entries()).map(([feature, bucket]) => ({
    feature,
    callCount: bucket.callCount,
    cacheHitCallCount: bucket.cacheHitCallCount,
    cacheHitRate: bucket.callCount > 0 ? bucket.cacheHitCallCount / bucket.callCount : 0,
    sumCacheReadTokens: bucket.cacheReadTokens,
    estimatedSavingsUsd: bucket.savings,
  }));
}

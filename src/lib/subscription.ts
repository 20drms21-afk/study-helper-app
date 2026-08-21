import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PRO_PLAN_AMOUNT = Number(process.env.TOSS_PRO_PLAN_AMOUNT ?? 9900);
export const MASTER_PLAN_AMOUNT = Number(process.env.TOSS_MASTER_PLAN_AMOUNT ?? 14800);

// 유료 플랜은 "pro"/"master" 두 종류 — 매달 재청구(charge-due)나 카드 재시도(card-update)처럼
// 이미 구독 중인 유저의 plan 값만 보고 금액을 다시 계산해야 하는 자리가 여러 곳이라 헬퍼로 뽑음.
// 알 수 없는 값(예전 데이터, "free")이 들어오면 안전하게 Pro 금액으로 취급.
export function planAmount(plan: string): number {
  return plan === "master" ? MASTER_PLAN_AMOUNT : PRO_PLAN_AMOUNT;
}

export function planLabel(plan: string): string {
  return plan === "master" ? "Master" : "Pro";
}

export function addOneMonth(date: Date): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function periodKeyOf(date: Date): string {
  return date.toISOString();
}

/**
 * Reserves a charge attempt via the (userId, periodKey, attemptSeq) unique
 * constraint on SubscriptionCharge. Returns null if the attempt was already
 * reserved by a concurrent invocation (double cron fire, or a race with the
 * card-update recovery path) — the caller must skip calling Toss in that case.
 */
export async function reserveCharge(params: {
  userId: string;
  periodKey: string;
  attemptSeq: number;
  amount: number;
}): Promise<{ id: string; orderId: string } | null> {
  const orderId = `${params.userId}-${params.periodKey}-${params.attemptSeq}`;
  try {
    return await prisma.subscriptionCharge.create({
      data: {
        userId: params.userId,
        periodKey: params.periodKey,
        attemptSeq: params.attemptSeq,
        status: "pending",
        orderId,
        amount: params.amount,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}

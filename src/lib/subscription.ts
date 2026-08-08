import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PRO_PLAN_AMOUNT = Number(process.env.TOSS_PRO_PLAN_AMOUNT ?? 9900);

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

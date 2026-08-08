import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeBilling, TossApiError } from "@/lib/toss";
import { PRO_PLAN_AMOUNT, addDays, addOneMonth, periodKeyOf, reserveCharge } from "@/lib/subscription";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel Cron은 GET으로 호출하고 CRON_SECRET을 Authorization 헤더에 자동으로 실어 보낸다.
// 수동 curl 테스트나 다른 스케줄러(GitHub Actions 등)를 위해 POST도 동일하게 지원한다.
export async function GET(request: Request) {
  return handleChargeDue(request);
}

export async function POST(request: Request) {
  return handleChargeDue(request);
}

async function handleChargeDue(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const now = new Date();

  // 해지 유예 만료: 이미 결제한 기간이 끝난 canceled 유저를 무료로 전환
  const expired = await prisma.user.findMany({
    where: { subscriptionStatus: "canceled", currentPeriodEnd: { lte: now } },
  });
  for (const user of expired) {
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "free", subscriptionStatus: null, nextChargeAt: null },
    });
  }

  // 청구 대상: 정기 갱신(active) 또는 재시도(past_due) 시점이 된 유저
  const due = await prisma.user.findMany({
    where: {
      subscriptionStatus: { in: ["active", "past_due"] },
      nextChargeAt: { lte: now },
      tossBillingKey: { not: null },
    },
  });

  let charged = 0;
  let failed = 0;

  for (const user of due) {
    const attemptSeq = user.subscriptionStatus === "past_due" ? 2 : 1;
    const periodKey = periodKeyOf(user.currentPeriodEnd ?? now);

    const reservation = await reserveCharge({
      userId: user.id,
      periodKey,
      attemptSeq,
      amount: PRO_PLAN_AMOUNT,
    });
    if (!reservation) {
      // 이미 다른 실행(중복 크론 호출 또는 카드 변경 라우트)이 이 시도를 처리했음
      continue;
    }

    try {
      await chargeBilling(user.tossBillingKey!, {
        customerKey: user.tossCustomerKey ?? user.id,
        amount: PRO_PLAN_AMOUNT,
        orderId: reservation.orderId,
        orderName:
          attemptSeq === 1 ? "공부한입 Pro 플랜 (월 구독 갱신)" : "공부한입 Pro 플랜 (재시도 청구)",
      });

      const newPeriodEnd = addOneMonth(user.currentPeriodEnd ?? now);
      await prisma.$transaction([
        prisma.subscriptionCharge.update({
          where: { id: reservation.id },
          data: { status: "succeeded" },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "active",
            currentPeriodEnd: newPeriodEnd,
            nextChargeAt: newPeriodEnd,
          },
        }),
      ]);
      charged++;
    } catch (error) {
      const message = error instanceof TossApiError ? error.message : String(error);
      console.error("toss charge failed", user.id, attemptSeq, message);

      await prisma.subscriptionCharge.update({
        where: { id: reservation.id },
        data: { status: "failed", failureReason: message },
      });

      if (attemptSeq === 1) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "past_due", nextChargeAt: addDays(now, 3) },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "free",
            subscriptionStatus: "suspended",
            suspendedAt: now,
            nextChargeAt: null,
          },
        });
      }
      failed++;
    }
  }

  return NextResponse.json({ expired: expired.length, charged, failed });
}

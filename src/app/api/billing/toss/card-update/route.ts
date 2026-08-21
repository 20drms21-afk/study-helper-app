import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueBillingKey, chargeBilling, TossApiError } from "@/lib/toss";
import { addOneMonth, periodKeyOf, planAmount, planLabel, reserveCharge } from "@/lib/subscription";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const { searchParams } = new URL(request.url);
  const authKey = searchParams.get("authKey");
  const customerKey = searchParams.get("customerKey");

  if (!authKey || !customerKey || customerKey !== session.user.id) {
    return NextResponse.redirect(new URL("/billing?checkout=fail", baseUrl));
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.redirect(new URL("/billing?checkout=fail", baseUrl));
  }

  try {
    const { billingKey } = await issueBillingKey(authKey, customerKey);
    await prisma.user.update({ where: { id: user.id }, data: { tossBillingKey: billingKey } });

    if (user.subscriptionStatus === "past_due" && user.currentPeriodEnd) {
      // 재시도(attemptSeq 2)를 새 카드로 즉시 소진 시도 — 크론이 이미 처리했으면 스킵.
      // 여기서는 새 플랜을 고르는 게 아니라 원래 구독 중이던 플랜(user.plan)을 그대로 재청구함.
      const amount = planAmount(user.plan);
      const periodKey = periodKeyOf(user.currentPeriodEnd);
      const reservation = await reserveCharge({
        userId: user.id,
        periodKey,
        attemptSeq: 2,
        amount,
      });

      if (reservation) {
        try {
          await chargeBilling(billingKey, {
            customerKey,
            amount,
            orderId: reservation.orderId,
            orderName: `공부한입 ${planLabel(user.plan)} 플랜 (재시도 청구)`,
          });
          const newPeriodEnd = addOneMonth(user.currentPeriodEnd);
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
          return NextResponse.redirect(new URL("/billing?checkout=recovered", baseUrl));
        } catch (error) {
          console.error(
            "toss card-update recovery charge failed",
            error instanceof TossApiError ? error.message : error
          );
          await prisma.subscriptionCharge.update({
            where: { id: reservation.id },
            data: {
              status: "failed",
              failureReason: error instanceof TossApiError ? error.message : String(error),
            },
          });
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: "free",
              subscriptionStatus: "suspended",
              suspendedAt: new Date(),
              nextChargeAt: null,
            },
          });
          return NextResponse.redirect(new URL("/billing?checkout=fail", baseUrl));
        }
      }

      return NextResponse.redirect(new URL("/billing?checkout=success", baseUrl));
    }

    if (user.subscriptionStatus === "canceled" && user.currentPeriodEnd) {
      // 유예 기간 중 재구독 — 이미 그 기간까지 결제했으므로 새로 청구하지 않음
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "active",
          nextChargeAt: user.currentPeriodEnd,
        },
      });
      return NextResponse.redirect(new URL("/billing?checkout=resumed", baseUrl));
    }

    if (user.subscriptionStatus === "active") {
      // 정상 구독 중 카드만 교체
      return NextResponse.redirect(new URL("/billing?checkout=success", baseUrl));
    }

    // suspended 또는 무구독 상태 — 신규 구독으로 취급(즉시 청구 + 새 기간 시작). 이 라우트는
    // BillingActions에서 "카드 변경"으로만 연결되어 있어 targetPlan이 실려오지 않는 게 보통이고,
    // 이 분기 자체도 현재 UI에서는 거의 도달하지 않는 방어적 경로라 register와 동일하게
    // targetPlan 쿼리를 읽되 없으면 Pro로 취급.
    const targetPlanParam = searchParams.get("targetPlan");
    const targetPlan = targetPlanParam === "master" ? "master" : "pro";
    const amount = planAmount(targetPlan);

    const periodKey = periodKeyOf(new Date());
    const reservation = await reserveCharge({
      userId: user.id,
      periodKey,
      attemptSeq: 1,
      amount,
    });
    if (!reservation) {
      return NextResponse.redirect(new URL("/billing?checkout=success", baseUrl));
    }

    await chargeBilling(billingKey, {
      customerKey,
      amount,
      orderId: reservation.orderId,
      orderName: `공부한입 ${planLabel(targetPlan)} 플랜 (월 구독)`,
    });

    const currentPeriodEnd = addOneMonth(new Date());
    await prisma.$transaction([
      prisma.subscriptionCharge.update({
        where: { id: reservation.id },
        data: { status: "succeeded" },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          plan: targetPlan,
          subscriptionStatus: "active",
          currentPeriodEnd,
          nextChargeAt: currentPeriodEnd,
        },
      }),
    ]);
  } catch (error) {
    console.error("toss card-update error", error instanceof TossApiError ? error.message : error);
    return NextResponse.redirect(new URL("/billing?checkout=fail", baseUrl));
  }

  return NextResponse.redirect(new URL("/billing?checkout=success", baseUrl));
}

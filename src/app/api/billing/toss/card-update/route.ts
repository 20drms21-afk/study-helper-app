import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueBillingKey, chargeBilling, TossApiError } from "@/lib/toss";
import { PRO_PLAN_AMOUNT, addOneMonth, periodKeyOf, reserveCharge } from "@/lib/subscription";

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
      // 재시도(attemptSeq 2)를 새 카드로 즉시 소진 시도 — 크론이 이미 처리했으면 스킵
      const periodKey = periodKeyOf(user.currentPeriodEnd);
      const reservation = await reserveCharge({
        userId: user.id,
        periodKey,
        attemptSeq: 2,
        amount: PRO_PLAN_AMOUNT,
      });

      if (reservation) {
        try {
          await chargeBilling(billingKey, {
            customerKey,
            amount: PRO_PLAN_AMOUNT,
            orderId: reservation.orderId,
            orderName: "공부한입 Pro 플랜 (재시도 청구)",
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

    // suspended 또는 무구독 상태 — 신규 구독으로 취급(즉시 청구 + 새 기간 시작)
    const periodKey = periodKeyOf(new Date());
    const reservation = await reserveCharge({
      userId: user.id,
      periodKey,
      attemptSeq: 1,
      amount: PRO_PLAN_AMOUNT,
    });
    if (!reservation) {
      return NextResponse.redirect(new URL("/billing?checkout=success", baseUrl));
    }

    await chargeBilling(billingKey, {
      customerKey,
      amount: PRO_PLAN_AMOUNT,
      orderId: reservation.orderId,
      orderName: "공부한입 Pro 플랜 (월 구독)",
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
          plan: "pro",
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

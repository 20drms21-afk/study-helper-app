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

  try {
    const { billingKey } = await issueBillingKey(authKey, customerKey);

    const periodKey = periodKeyOf(new Date());
    const reservation = await reserveCharge({
      userId: customerKey,
      periodKey,
      attemptSeq: 1,
      amount: PRO_PLAN_AMOUNT,
    });
    if (!reservation) {
      // 동시에 두 번 리다이렉트된 경우(중복 제출) — 이미 처리 중이므로 재청구하지 않음
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
        where: { id: session.user.id },
        data: {
          plan: "pro",
          subscriptionStatus: "active",
          tossCustomerKey: customerKey,
          tossBillingKey: billingKey,
          currentPeriodEnd,
          nextChargeAt: currentPeriodEnd,
        },
      }),
    ]);
  } catch (error) {
    console.error("toss register error", error instanceof TossApiError ? error.message : error);
    return NextResponse.redirect(new URL("/billing?checkout=fail", baseUrl));
  }

  return NextResponse.redirect(new URL("/billing?checkout=success", baseUrl));
}

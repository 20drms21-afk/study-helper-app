import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["active", "past_due"].includes(user.subscriptionStatus ?? "")) {
    return NextResponse.json({ error: "구독 정보가 없습니다." }, { status: 400 });
  }

  // 즉시 다운그레이드하지 않음 — 이미 결제한 기간(currentPeriodEnd)까지는 이용 유지,
  // 이후 자동 청구만 멈춘다(청구 크론이 만료 시 free로 전환). 환불 없음.
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      subscriptionStatus: "canceled",
      canceledAt: new Date(),
      nextChargeAt: null,
    },
  });

  return NextResponse.json({ ok: true, currentPeriodEnd: user.currentPeriodEnd });
}

import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface TossWebhookPayload {
  eventType: string;
  createdAt: string;
  data?: { billingKey?: string; status?: string };
  billingKey?: string;
  reason?: string | null;
}

function verifySignature(rawBody: string, signatureHeader: string, transmissionTime: string): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET_KEY;
  if (!secret) return false;

  const expected = createHmac("sha256", secret)
    .update(`${rawBody}:${transmissionTime}`)
    .digest("base64");

  // Header format: one or more "v1:<base64>" tokens; a match against any is valid.
  const candidates = signatureHeader
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1:"))
    .map((part) => part.slice(3));

  const expectedBuf = Buffer.from(expected);
  return candidates.some((candidate) => {
    const candidateBuf = Buffer.from(candidate);
    return (
      candidateBuf.length === expectedBuf.length && timingSafeEqual(candidateBuf, expectedBuf)
    );
  });
}

export async function POST(request: Request) {
  const signatureHeader = request.headers.get("tosspayments-webhook-signature");
  const transmissionTime = request.headers.get("tosspayments-webhook-transmission-time");

  if (!signatureHeader || !transmissionTime) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  if (!verifySignature(rawBody, signatureHeader, transmissionTime)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as TossWebhookPayload;

  if (event.eventType === "BILLING_DELETED") {
    const billingKey = event.billingKey ?? event.data?.billingKey;
    if (billingKey) {
      await prisma.user.updateMany({
        where: { tossBillingKey: billingKey },
        data: {
          plan: "free",
          subscriptionStatus: "suspended",
          suspendedAt: new Date(),
          tossBillingKey: null,
          nextChargeAt: null,
        },
      });
    }
  } else {
    // PAYMENT_STATUS_CHANGED 등 나머지 이벤트는 관측용으로만 로깅.
    // 핵심 상태 변경은 register/charge-due 라우트의 동기 응답으로 이미 처리됨.
    console.log("toss webhook event", event.eventType);
  }

  return NextResponse.json({ received: true });
}

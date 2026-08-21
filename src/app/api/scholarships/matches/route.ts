import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getQuotaStatus, quotaExceededMessage } from "@/lib/usage";
import { isScholarshipDataConfigured, matchScholarships } from "@/lib/scholarship/match";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const configured = await isScholarshipDataConfigured();
  if (!configured) {
    return NextResponse.json({ configured: false, matches: [] });
  }

  const quota = await getQuotaStatus(session.user.id);
  if (!quota.allowed) {
    return NextResponse.json({ error: quotaExceededMessage(quota.limit!, quota.plan) }, { status: 402 });
  }

  const result = await matchScholarships(session.user.id, quota.plan);

  return NextResponse.json({ configured: true, ...result });
}

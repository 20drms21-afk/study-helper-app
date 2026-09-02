import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isScholarshipDataConfigured, matchScholarships } from "@/lib/scholarship/match";

// 예전엔 Claude에 후보를 보내 판단시켜서 maxDuration=60(Vercel Hobby 상한)까지 필요했고
// AI 토큰 쿼터 체크도 있었는데, 순수 DB 필터로 재작성한 뒤로는 둘 다 필요 없다 — match.ts
// 상단 주석 참고. getActivitiesForUser(대외활동 매칭)도 같은 이유로 쿼터 체크가 없다.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const configured = await isScholarshipDataConfigured();
  if (!configured) {
    return NextResponse.json({ configured: false, matches: [] });
  }

  const result = await matchScholarships(session.user.id);

  return NextResponse.json({ configured: true, ...result });
}

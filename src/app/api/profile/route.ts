import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotaStatus, recordUsage } from "@/lib/usage";
import { classifyActivityFieldTags } from "@/lib/activity/classify";

const profileSchema = z.object({
  region: z.string().max(50).optional(),
  major: z.string().max(100).optional(),
  gradeLevel: z.number().int().min(1).max(6).optional(),
  incomeBracket: z.number().int().min(0).max(10).optional(),
  gpa: z.number().min(0).max(4.5).optional(),
  interests: z.string().max(200).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = profileSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const data = parsedBody.data;

  // 원본 필드는 AI 분류 성공 여부와 무관하게 항상 저장한다 — 프로필 저장은 AI 기능이
  // 아니라 기본 설정 기능이므로, 아래 재분류 단계가 실패/쿼터초과로 건너뛰어도 이 upsert는
  // 절대 막히면 안 된다.
  let profile = await prisma.studentProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  // major/interests가 실제로 바뀐 경우에만 대외활동 매칭용 카테고리를 재분류한다 —
  // region/gradeLevel 등 다른 필드만 바꾸는 흔한 케이스에서 불필요한 Claude 호출을 피함.
  const currentSource = JSON.stringify({ major: profile.major ?? null, interests: profile.interests ?? null });
  const needsReclassification = currentSource !== profile.activityFieldTagsSource;

  if (needsReclassification) {
    // soft-fail: 쿼터 초과/Claude 실패 시 조용히 건너뛰고 기존 activityFieldTags 캐시를
    // 그대로 둔다. 이 요청의 본 목적(프로필 저장)은 이미 위에서 끝났으므로 여기서 무슨
    // 일이 있어도 응답 자체는 막지 않는다.
    const quota = await getQuotaStatus(session.user.id).catch(() => null);
    if (quota?.allowed) {
      try {
        const categories = await classifyActivityFieldTags(
          session.user.id,
          quota.plan,
          profile.major ?? null,
          profile.interests ?? null
        );
        profile = await prisma.studentProfile.update({
          where: { userId: session.user.id },
          data: {
            activityFieldTags: categories.join(","),
            activityFieldTagsSource: currentSource,
          },
        });
        await recordUsage(session.user.id, "activity_match").catch((err) => {
          console.error("usage record failed", err);
        });
      } catch (err) {
        console.error("activity field classification failed (soft-fail, profile save unaffected)", err);
      }
    }
  }

  return NextResponse.json(profile);
}

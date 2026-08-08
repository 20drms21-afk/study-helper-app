import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/calendar/date";

const MIN_DURATION_SECONDS = 60;
const MAX_DURATION_SECONDS = 24 * 60 * 60;

const createSessionSchema = z.object({
  subjectId: z.string().optional(),
  mode: z.enum(["simple", "immersive"]),
  roomId: z.string().optional(),
  startedAt: z.string(),
  endedAt: z.string(),
  durationSeconds: z.number().int().min(0),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createSessionSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { subjectId, mode, roomId, startedAt, endedAt, durationSeconds } = parsedBody.data;

  if (durationSeconds < MIN_DURATION_SECONDS) {
    return NextResponse.json({ error: "기록하기엔 너무 짧은 구간입니다." }, { status: 400 });
  }
  const clampedDuration = Math.min(durationSeconds, MAX_DURATION_SECONDS);

  if (subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: session.user.id },
    });
    if (!subject) {
      return NextResponse.json({ error: "과목을 찾을 수 없습니다." }, { status: 400 });
    }
  }

  const endedAtDate = new Date(endedAt);

  const studySession = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      subjectId: subjectId ?? null,
      roomId: roomId ?? null,
      mode,
      date: toDateKey(endedAtDate),
      durationSeconds: clampedDuration,
      startedAt: new Date(startedAt),
      endedAt: endedAtDate,
    },
  });

  return NextResponse.json(studySession, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/timer";

const createRoomSchema = z.object({
  mode: z.enum(["simple", "immersive"]),
  subjectId: z.string().optional(),
  studyMinutes: z.number().int().min(5).max(180).optional(),
  breakMinutes: z.number().int().min(1).max(60).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createRoomSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { mode, subjectId, studyMinutes, breakMinutes } = parsedBody.data;

  if (subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: session.user.id },
    });
    if (!subject) {
      return NextResponse.json({ error: "과목을 찾을 수 없습니다." }, { status: 400 });
    }
  }

  let code = generateRoomCode();
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.timerRoom.findUnique({ where: { code } });
    if (!existing) break;
    code = generateRoomCode();
  }

  const room = await prisma.timerRoom.create({
    data: {
      code,
      hostUserId: session.user.id,
      subjectId: subjectId ?? null,
      mode,
      studyMinutes: studyMinutes ?? 50,
      breakMinutes: breakMinutes ?? 10,
      participants: {
        create: { userId: session.user.id },
      },
    },
  });

  return NextResponse.json({ roomId: room.id, code: room.code }, { status: 201 });
}

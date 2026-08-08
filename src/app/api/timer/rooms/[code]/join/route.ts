import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/timer/rooms/[code]/join">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { code } = await ctx.params;
  const room = await prisma.timerRoom.findFirst({
    where: { code, status: { in: ["waiting", "running"] } },
  });
  if (!room) {
    return NextResponse.json({ error: "방을 찾을 수 없거나 종료되었습니다." }, { status: 404 });
  }

  await prisma.timerRoomParticipant.upsert({
    where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
    create: { roomId: room.id, userId: session.user.id },
    update: { status: "active", lastHeartbeatAt: new Date() },
  });

  return NextResponse.json({
    roomId: room.id,
    code: room.code,
    mode: room.mode,
    subjectId: room.subjectId,
    studyMinutes: room.studyMinutes,
    breakMinutes: room.breakMinutes,
    status: room.status,
    startedAt: room.startedAt,
  });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/timer/rooms/[code]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { code } = await ctx.params;
  const room = await prisma.timerRoom.findFirst({
    where: { code },
    include: { participants: { include: { user: { select: { name: true, email: true } } } } },
  });
  if (!room) {
    return NextResponse.json({ error: "방을 찾을 수 없습니다." }, { status: 404 });
  }

  const isParticipant = room.participants.some((p) => p.userId === session.user.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "이 방의 참가자가 아닙니다." }, { status: 403 });
  }

  return NextResponse.json({
    room: {
      mode: room.mode,
      studyMinutes: room.studyMinutes,
      breakMinutes: room.breakMinutes,
      startedAt: room.startedAt,
      status: room.status,
      subjectId: room.subjectId,
      hostUserId: room.hostUserId,
    },
    participants: room.participants.map((p) => ({
      userId: p.userId,
      name: p.user.name ?? p.user.email,
      elapsedSeconds: p.elapsedSeconds,
      completedSets: p.completedSets,
      status: p.status,
      lastHeartbeatAt: p.lastHeartbeatAt,
    })),
  });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/timer/rooms/[code]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { code } = await ctx.params;
  const room = await prisma.timerRoom.findFirst({ where: { code } });
  if (!room) {
    return NextResponse.json({ error: "방을 찾을 수 없습니다." }, { status: 404 });
  }
  if (room.hostUserId !== session.user.id) {
    return NextResponse.json({ error: "호스트만 종료할 수 있습니다." }, { status: 403 });
  }

  await prisma.timerRoom.update({
    where: { id: room.id },
    data: { status: "ended", endedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const heartbeatSchema = z.object({
  elapsedSeconds: z.number().int().min(0),
  completedSets: z.number().int().min(0),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/timer/rooms/[code]/heartbeat">
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

  const body = await request.json().catch(() => null);
  const parsedBody = heartbeatSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { count } = await prisma.timerRoomParticipant.updateMany({
    where: { roomId: room.id, userId: session.user.id },
    data: {
      elapsedSeconds: parsedBody.data.elapsedSeconds,
      completedSets: parsedBody.data.completedSets,
      lastHeartbeatAt: new Date(),
    },
  });
  if (count === 0) {
    return NextResponse.json({ error: "이 방의 참가자가 아닙니다." }, { status: 403 });
  }

  const participants = await prisma.timerRoomParticipant.findMany({
    where: { roomId: room.id },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({
    participants: participants.map((p) => ({
      userId: p.userId,
      name: p.user.name ?? p.user.email,
      elapsedSeconds: p.elapsedSeconds,
      completedSets: p.completedSets,
      status: p.status,
      lastHeartbeatAt: p.lastHeartbeatAt,
    })),
  });
}

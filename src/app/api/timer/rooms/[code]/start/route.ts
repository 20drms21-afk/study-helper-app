import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/timer/rooms/[code]/start">
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
    return NextResponse.json({ error: "호스트만 시작할 수 있습니다." }, { status: 403 });
  }

  const updated = await prisma.timerRoom.update({
    where: { id: room.id },
    data: { status: "running", startedAt: new Date() },
  });

  return NextResponse.json({ status: updated.status, startedAt: updated.startedAt });
}

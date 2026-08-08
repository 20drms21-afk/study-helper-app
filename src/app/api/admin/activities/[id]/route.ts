import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/activities/[id]">
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await ctx.params;
  await prisma.activityListing.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

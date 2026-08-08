import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/notes/[id]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const file = await prisma.uploadedFile.findFirst({
    where: { id, userId: session.user.id, purpose: "note" },
    include: { summaries: { orderBy: { createdAt: "desc" } } },
  });

  if (!file) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(file);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/notes/[id]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const file = await prisma.uploadedFile.findFirst({
    where: { id, userId: session.user.id, purpose: "note" },
  });
  if (!file) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !("subjectId" in body)) {
    return NextResponse.json({ error: "subjectId가 필요합니다." }, { status: 400 });
  }

  let subjectId: string | null = null;
  if (body.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: body.subjectId, userId: session.user.id },
      select: { id: true },
    });
    if (!subject) {
      return NextResponse.json({ error: "과목을 찾을 수 없습니다." }, { status: 400 });
    }
    subjectId = subject.id;
  }

  const updated = await prisma.uploadedFile.update({
    where: { id },
    data: { subjectId },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/notes/[id]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const file = await prisma.uploadedFile.findFirst({
    where: { id, userId: session.user.id, purpose: "note" },
  });

  if (!file) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.uploadedFile.delete({ where: { id } });
  await deleteStoredFile(file.storedPath);

  return NextResponse.json({ ok: true });
}

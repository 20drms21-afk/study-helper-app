import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/translate/[id]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const translation = await prisma.pdfTranslation.findFirst({
    where: { id, userId: session.user.id },
    include: { pages: { orderBy: { pageNumber: "asc" } } },
  });

  if (!translation) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(translation);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/translate/[id]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const translation = await prisma.pdfTranslation.findFirst({
    where: { id, userId: session.user.id },
    include: { pages: true },
  });

  if (!translation) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.pdfTranslation.delete({ where: { id } });

  await deleteStoredFile(translation.originalStoredPath).catch((error) =>
    console.error("translate original file delete error", error)
  );
  await Promise.all(
    translation.pages.map((p) =>
      deleteStoredFile(p.translatedImagePath).catch((error) =>
        console.error("translate page file delete error", p.id, error)
      )
    )
  );

  return NextResponse.json({ ok: true });
}

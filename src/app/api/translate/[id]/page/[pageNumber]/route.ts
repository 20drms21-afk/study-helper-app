import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";
import { renderPdfPage } from "@/lib/translate/render";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/translate/[id]/page/[pageNumber]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id, pageNumber: pageNumberParam } = await ctx.params;
  const pageNumber = Number(pageNumberParam);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "잘못된 페이지 번호입니다." }, { status: 400 });
  }

  const variant = new URL(request.url).searchParams.get("variant") === "original" ? "original" : "translated";

  const translation = await prisma.pdfTranslation.findFirst({
    where: { id, userId: session.user.id },
    include: { pages: variant === "translated" ? { where: { pageNumber } } : false },
  });
  if (!translation) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  let buffer: Buffer;
  if (variant === "original") {
    if (pageNumber > translation.pageCount) {
      return NextResponse.json({ error: "페이지 범위를 벗어났습니다." }, { status: 400 });
    }
    const pdfBuffer = await readStoredFile(translation.originalStoredPath);
    const rendered = await renderPdfPage(pdfBuffer, pageNumber);
    buffer = rendered.buffer;
  } else {
    const page = translation.pages?.[0];
    if (!page) {
      return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
    }
    buffer = await readStoredFile(page.translatedImagePath);
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=86400" },
  });
}

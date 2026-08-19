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
  });
  if (!translation) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  // 원본/번역본 둘 다 이제 저장된 PDF 전체에서 그때그때 페이지를 라스터화해서 보여준다 — DeepL이
  // 번역된 PDF를 페이지 이미지가 아니라 PDF 파일 하나로 통째로 돌려주므로, 예전처럼 페이지별 PNG를
  // 미리 만들어 저장해둘 필요가 없어졌다(원본이 이미 이렇게 하고 있던 방식과 동일하게 맞춤).
  const storedPath = variant === "original" ? translation.originalStoredPath : translation.translatedStoredPath;
  const maxPage = variant === "original" ? translation.pageCount : translation.translatedPageCount;

  if (!storedPath || pageNumber > maxPage) {
    return NextResponse.json({ error: "페이지 범위를 벗어났거나 아직 준비되지 않았습니다." }, { status: 400 });
  }

  const pdfBuffer = await readStoredFile(storedPath);
  const rendered = await renderPdfPage(pdfBuffer, pageNumber);

  return new NextResponse(new Uint8Array(rendered.buffer), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=86400" },
  });
}

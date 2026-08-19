import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/translate/[id]/download">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const translation = await prisma.pdfTranslation.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!translation) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }
  if (!translation.translatedStoredPath) {
    return NextResponse.json({ error: "아직 번역이 완료되지 않았습니다." }, { status: 400 });
  }

  const buffer = await readStoredFile(translation.translatedStoredPath);

  const baseName = translation.originalFileName.replace(/\.pdf$/i, "");
  const downloadName = `${baseName}_번역본.pdf`;
  const encodedName = encodeURIComponent(downloadName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="translated.pdf"; filename*=UTF-8''${encodedName}`,
    },
  });
}

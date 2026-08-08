import { createElement } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { SummaryNotePdf } from "@/lib/pdf/SummaryNotePdf";
import type { NoteContentType, SummaryContent, ExplanationContent } from "@/lib/prompts/summarize";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/summaries/[id]/pdf">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("인증이 필요합니다.", { status: 401 });
  }

  const { id } = await ctx.params;
  const note = await prisma.summaryNote.findFirst({
    where: { id, userId: session.user.id },
    include: { sourceFile: true },
  });

  if (!note) {
    return new Response("찾을 수 없습니다.", { status: 404 });
  }

  const type = note.type as NoteContentType;
  const content = JSON.parse(note.contentJson) as SummaryContent | ExplanationContent;

  const element = createElement(SummaryNotePdf, {
    title: note.title,
    type,
    content,
  }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);

  // 파일명은 노트 제목이 아니라 원본 업로드 파일명 기준 — 끝에 _요약/_설명을 붙여서
  // 사용자가 어떤 자료의 어떤 결과물인지 다운로드 폴더에서 바로 구분할 수 있게 함.
  const typeSuffix = type === "summary" ? "요약" : "설명";
  const baseName = note.sourceFile
    ? note.sourceFile.originalName.replace(/\.[^./\\]+$/, "")
    : note.title;
  const encodedTitle = encodeURIComponent(`${baseName}_${typeSuffix}`);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="note.pdf"; filename*=UTF-8''${encodedTitle}.pdf`,
    },
  });
}

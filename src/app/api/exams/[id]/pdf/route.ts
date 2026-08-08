import { createElement } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ExamPaperPdf } from "@/lib/pdf/ExamPaperPdf";
import { parseChoices } from "@/lib/exam/formatters";
import type { ExamPaperPublic } from "@/lib/exam/types";
import type { ExamQuestionType } from "@/lib/prompts/examGenerate";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/exams/[id]/pdf">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("인증이 필요합니다.", { status: 401 });
  }

  const { id } = await ctx.params;
  const paper = await prisma.examPaper.findFirst({
    where: { id, userId: session.user.id },
    include: {
      config: { select: { timeLimitMinutes: true } },
      questions: { orderBy: { order: "asc" } },
    },
  });

  if (!paper) {
    return new Response("찾을 수 없습니다.", { status: 404 });
  }

  const publicPaper: ExamPaperPublic = {
    id: paper.id,
    title: paper.title,
    totalPoints: paper.totalPoints,
    timeLimitMinutes: paper.config.timeLimitMinutes,
    questions: paper.questions.map((q) => ({
      id: q.id,
      order: q.order,
      type: q.type as ExamQuestionType,
      prompt: q.prompt,
      choices: parseChoices(q.choicesJson),
      points: q.points,
    })),
  };

  const element = createElement(ExamPaperPdf, { paper: publicPaper }) as Parameters<
    typeof renderToBuffer
  >[0];
  const buffer = await renderToBuffer(element);
  const encodedTitle = encodeURIComponent(paper.title);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="exam.pdf"; filename*=UTF-8''${encodedTitle}.pdf`,
    },
  });
}

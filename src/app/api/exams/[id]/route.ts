import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage";
import { parseChoices } from "@/lib/exam/formatters";
import type { ExamPaperPublic } from "@/lib/exam/types";
import type { ExamQuestionType } from "@/lib/prompts/examGenerate";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/exams/[id]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
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
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
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

  return NextResponse.json(publicPaper);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/exams/[id]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const paper = await prisma.examPaper.findFirst({
    where: { id, userId: session.user.id },
    include: { config: true },
  });

  if (!paper) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const sourceFileIds: string[] = JSON.parse(paper.config.sourceFileIdsJson || "[]");
  const referencedFileIds = paper.config.pastExamFileId
    ? [...sourceFileIds, paper.config.pastExamFileId]
    : sourceFileIds;

  const referencedFiles = await prisma.uploadedFile.findMany({
    where: { id: { in: referencedFileIds }, userId: session.user.id },
  });

  await prisma.examConfig.delete({ where: { id: paper.configId } });

  await Promise.all(referencedFiles.map((f) => deleteStoredFile(f.storedPath)));
  await prisma.uploadedFile.deleteMany({ where: { id: { in: referencedFileIds } } });

  return NextResponse.json({ ok: true });
}

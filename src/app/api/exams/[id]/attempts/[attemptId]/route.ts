import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseChoices } from "@/lib/exam/formatters";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/exams/[id]/attempts/[attemptId]">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id, attemptId } = await ctx.params;
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, examPaperId: id, userId: session.user.id },
    include: {
      examPaper: { include: { questions: { orderBy: { order: "asc" } } } },
      answers: true,
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const answerByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));

  const questions = attempt.examPaper.questions.map((q) => {
    const answer = answerByQuestion.get(q.id);
    return {
      id: q.id,
      order: q.order,
      type: q.type,
      prompt: q.prompt,
      choices: parseChoices(q.choicesJson),
      points: q.points,
      topicTag: q.topicTag,
      correctAnswer: q.correctAnswer,
      modelAnswer: q.modelAnswer,
      explanation: q.explanation,
      studentAnswer: answer?.studentAnswer ?? "",
      isCorrect: answer?.isCorrect ?? null,
      score: answer?.score ?? 0,
      maxScore: answer?.maxScore ?? q.points,
      feedback: answer?.feedback ?? null,
      gradedBy: answer?.gradedBy ?? "auto",
    };
  });

  const topicMap = new Map<string, { score: number; possible: number }>();
  for (const q of questions) {
    const entry = topicMap.get(q.topicTag) ?? { score: 0, possible: 0 };
    entry.score += q.score;
    entry.possible += q.maxScore;
    topicMap.set(q.topicTag, entry);
  }

  const topicBreakdown = Array.from(topicMap.entries())
    .map(([topicTag, v]) => ({
      topicTag,
      score: v.score,
      possible: v.possible,
      percentage: v.possible > 0 ? Math.round((v.score / v.possible) * 100) : 0,
    }))
    .sort((a, b) => a.percentage - b.percentage);

  return NextResponse.json({
    attemptId: attempt.id,
    examPaperId: id,
    title: attempt.examPaper.title,
    totalScore: attempt.totalScore ?? 0,
    totalPossible: attempt.totalPossible ?? 0,
    submittedAt: attempt.submittedAt,
    questions,
    topicBreakdown,
  });
}

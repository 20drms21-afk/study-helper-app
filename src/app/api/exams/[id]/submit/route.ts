import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  essayGradeSchema,
  gradeSystemPrompt,
  gradeUserPrompt,
  type EssayGradeItem,
} from "@/lib/prompts/grade";
import { gradeMcq, gradeShort } from "@/lib/grading";
import { getQuotaStatus, quotaExceededMessage } from "@/lib/usage";
import { upsertReviewItemsForWrongAnswers } from "@/lib/review";
import { recordAiUsage, AiUsageFeature, AiUsageStatus, newOperationId, summarizeAiError } from "@/lib/ai/aiUsage";

export const runtime = "nodejs";
export const maxDuration = 120;

const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      studentAnswer: z.string(),
    })
  ),
});

interface AnswerResult {
  questionId: string;
  studentAnswer: string;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
  feedback: string | null;
  gradedBy: "auto" | "claude";
  autoGradeConfidence: number | null;
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/exams/[id]/submit">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const paper = await prisma.examPaper.findFirst({
    where: { id, userId: session.user.id },
    include: {
      questions: { orderBy: { order: "asc" } },
      config: { select: { subjectId: true } },
    },
  });

  if (!paper) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = submitSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "답안 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const answerMap = new Map(
    parsedBody.data.answers.map((a) => [a.questionId, a.studentAnswer])
  );

  const results: AnswerResult[] = [];
  // Short answers that don't confidently auto-match (e.g. "m/s^2" vs "m/s²",
  // synonyms, spacing) are deferred to Claude alongside essays rather than
  // auto-failed — a fixed string-similarity threshold is too brittle for
  // free-text short answers.
  const aiGradeItems: EssayGradeItem[] = [];
  let essayItemCount = 0; // aiGradeItems 중 진짜 서술형(essay)만 센다 — 단답형 폴백과 구분

  for (const q of paper.questions) {
    const studentAnswer = answerMap.get(q.id) ?? "";

    if (q.type === "mcq") {
      const isCorrect = q.correctAnswer ? gradeMcq(studentAnswer, q.correctAnswer) : false;
      results.push({
        questionId: q.id,
        studentAnswer,
        isCorrect,
        score: isCorrect ? q.points : 0,
        maxScore: q.points,
        feedback: null,
        gradedBy: "auto",
        autoGradeConfidence: null,
      });
    } else if (q.type === "short") {
      const { isCorrect, confidence } = q.correctAnswer
        ? gradeShort(studentAnswer, q.correctAnswer)
        : { isCorrect: false, confidence: 0 };

      if (isCorrect || !studentAnswer.trim()) {
        results.push({
          questionId: q.id,
          studentAnswer,
          isCorrect,
          score: isCorrect ? q.points : 0,
          maxScore: q.points,
          feedback: null,
          gradedBy: "auto",
          autoGradeConfidence: confidence,
        });
      } else {
        aiGradeItems.push({
          questionId: q.id,
          prompt: q.prompt,
          modelAnswer: q.correctAnswer ?? "",
          maxPoints: q.points,
          studentAnswer,
        });
      }
    } else {
      essayItemCount += 1;
      aiGradeItems.push({
        questionId: q.id,
        prompt: q.prompt,
        modelAnswer: q.modelAnswer ?? "",
        maxPoints: q.points,
        studentAnswer,
      });
    }
  }

  if (aiGradeItems.length > 0) {
    const quota = await getQuotaStatus(session.user.id);
    if (!quota.allowed) {
      return NextResponse.json({ error: quotaExceededMessage(quota.limit!, quota.plan) }, { status: 402 });
    }

    const aiGrades = new Map<string, { score: number; feedback: string }>();
    const gradeOperationId = newOperationId("grade");
    const gradeMetadata = {
      questionCount: aiGradeItems.length,
      subjectiveQuestionCount: essayItemCount,
    };

    try {
      const message = await anthropic.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: gradeSystemPrompt(),
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: gradeUserPrompt(aiGradeItems) }],
        output_config: { format: zodOutputFormat(essayGradeSchema) },
      });
      await recordAiUsage({
        userId: session.user.id,
        plan: quota.plan,
        feature: AiUsageFeature.EXAM_GRADE,
        operationId: gradeOperationId,
        usage: message.usage,
        metadata: gradeMetadata,
      });
      const parsed = message.parsed_output;
      if (parsed) {
        for (const grade of parsed.grades) {
          aiGrades.set(grade.questionId, { score: grade.score, feedback: grade.feedback });
        }
      }
    } catch (error) {
      console.error("AI grading error", error);
      await recordAiUsage({
        userId: session.user.id,
        plan: quota.plan,
        feature: AiUsageFeature.EXAM_GRADE,
        operationId: gradeOperationId,
        status: AiUsageStatus.FAILED,
        metadata: { ...gradeMetadata, ...summarizeAiError(error) },
      });
    }

    for (const item of aiGradeItems) {
      const graded = aiGrades.get(item.questionId);
      const score = graded
        ? Math.max(0, Math.min(item.maxPoints, Math.round(graded.score)))
        : 0;
      results.push({
        questionId: item.questionId,
        studentAnswer: item.studentAnswer,
        isCorrect: null,
        score,
        maxScore: item.maxPoints,
        feedback: graded?.feedback ?? "채점 중 오류가 발생하여 0점으로 처리되었습니다.",
        gradedBy: "claude",
        autoGradeConfidence: null,
      });
    }
  }

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const totalPossible = results.reduce((sum, r) => sum + r.maxScore, 0);

  const attempt = await prisma.examAttempt.create({
    data: {
      examPaperId: paper.id,
      userId: session.user.id,
      submittedAt: new Date(),
      totalScore,
      totalPossible,
      answers: { create: results },
    },
  });

  try {
    await upsertReviewItemsForWrongAnswers(
      session.user.id,
      paper.config.subjectId,
      results,
      attempt.id
    );
  } catch (err) {
    console.error("review queue upsert failed", err);
  }

  return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
}

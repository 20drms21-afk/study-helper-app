import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeMcq, gradeShort } from "@/lib/grading";

const retrySchema = z.union([
  z.object({ studentAnswer: z.string() }),
  z.object({ selfReport: z.enum(["correct", "incorrect"]) }),
  z.object({ reveal: z.literal(true) }),
]);

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/review/[id]/retry">
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const item = await prisma.reviewItem.findFirst({
    where: { id, userId: session.user.id },
    include: { question: true },
  });
  if (!item) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = retrySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "답안 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { question } = item;

  if ("reveal" in parsedBody.data) {
    // 모범답안을 보여주기만 하고 채점/큐 상태는 건드리지 않는다 (서술형 자기평가 전 단계).
    return NextResponse.json({
      isCorrect: null,
      correctAnswer: question.correctAnswer,
      modelAnswer: question.modelAnswer,
      explanation: question.explanation,
    });
  }

  let isCorrect: boolean;

  if ("selfReport" in parsedBody.data) {
    isCorrect = parsedBody.data.selfReport === "correct";
  } else if (question.type === "mcq") {
    isCorrect = question.correctAnswer
      ? gradeMcq(parsedBody.data.studentAnswer, question.correctAnswer)
      : false;
  } else if (question.type === "short") {
    isCorrect = question.correctAnswer
      ? gradeShort(parsedBody.data.studentAnswer, question.correctAnswer).isCorrect
      : false;
  } else {
    return NextResponse.json(
      { error: "이 문제 유형은 자기평가(selfReport)로만 재시도할 수 있습니다." },
      { status: 400 }
    );
  }

  if (isCorrect) {
    // resolvedAt은 여기서 건드리지 않는다 — 사용자가 별도로 /resolve를 호출해야 큐에서 제거됨.
    return NextResponse.json({
      isCorrect: true,
      correctAnswer: question.correctAnswer,
      modelAnswer: question.modelAnswer,
      explanation: question.explanation,
    });
  }

  await prisma.reviewItem.update({
    where: { id: item.id },
    data: { wrongCount: { increment: 1 }, lastAnsweredAt: new Date() },
  });

  return NextResponse.json({
    isCorrect: false,
    correctAnswer: question.correctAnswer,
    modelAnswer: question.modelAnswer,
    explanation: question.explanation,
  });
}

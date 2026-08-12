import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseChoices, choiceLabel } from "@/lib/exam/formatters";
import { WeakAreaChart } from "@/components/exam/WeakAreaChart";

export default async function ExamResultPage({
  params,
}: PageProps<"/exams/[id]/result/[attemptId]">) {
  const { id, attemptId } = await params;
  const session = await getServerSession(authOptions);

  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, examPaperId: id, userId: session!.user.id },
    include: {
      examPaper: { include: { questions: { orderBy: { order: "asc" } } } },
      answers: true,
    },
  });

  if (!attempt) {
    notFound();
  }

  const answerByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));

  const questions = attempt.examPaper.questions.map((q) => {
    const answer = answerByQuestion.get(q.id);
    return {
      ...q,
      choices: parseChoices(q.choicesJson),
      studentAnswer: answer?.studentAnswer ?? "",
      isCorrect: answer?.isCorrect ?? null,
      score: answer?.score ?? 0,
      maxScore: answer?.maxScore ?? q.points,
      feedback: answer?.feedback ?? null,
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

  const totalScore = attempt.totalScore ?? 0;
  const totalPossible = attempt.totalPossible ?? 0;
  const totalPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

  return (
    <div>
      <Link href={`/exams/${id}`} className="text-sm text-gray-500 hover:text-gray-900">
        ← 시험으로 돌아가기
      </Link>

      <div className="mt-4 mb-8 rounded-md border border-gray-200 p-6 text-center">
        <h1 className="text-xl font-bold">{attempt.examPaper.title} - 채점 결과</h1>
        <p className="mt-2 text-3xl font-bold">
          {totalScore} / {totalPossible}점 ({totalPercentage}%)
        </p>
      </div>

      <div className="mb-8 rounded-md border border-gray-200 p-4">
        <WeakAreaChart topics={topicBreakdown} />
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold">문항별 결과</h2>
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-md border border-gray-200 p-4">
            <div className="mb-2 flex items-start justify-between gap-4">
              <p className="text-sm font-semibold">
                {i + 1}. {q.prompt}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  q.score >= q.maxScore
                    ? "bg-green-100 text-green-800"
                    : q.score > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {q.score}/{q.maxScore}점
              </span>
            </div>

            {q.choices && (
              <ul className="mb-2 space-y-1 pl-4 text-sm text-gray-600">
                {q.choices.map((choice, ci) => (
                  <li key={ci}>
                    {choiceLabel(ci)}. {choice}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-sm">
              <span className="font-medium text-gray-600">내 답안: </span>
              {q.studentAnswer || <span className="text-gray-400">(답안 없음)</span>}
            </p>

            {q.type !== "essay" && q.correctAnswer && (
              <p className="mt-1 text-sm">
                <span className="font-medium text-gray-600">정답: </span>
                {q.correctAnswer}
              </p>
            )}
            {q.type === "essay" && q.modelAnswer && (
              <p className="mt-1 text-sm">
                <span className="font-medium text-gray-600">모범답안: </span>
                {q.modelAnswer}
              </p>
            )}

            {q.feedback && (
              <p className="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-700">
                {q.feedback}
              </p>
            )}
            {q.explanation && (
              <p className="mt-2 text-sm text-gray-500">해설: {q.explanation}</p>
            )}
            {q.score < q.maxScore && q.sourceLocation && (
              <p className="mt-2 text-sm text-blue-700">
                📍 관련 개념 위치: {q.sourceLocation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

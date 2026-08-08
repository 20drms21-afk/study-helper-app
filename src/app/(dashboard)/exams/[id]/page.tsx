import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseChoices } from "@/lib/exam/formatters";
import { ExamPaperWeb } from "@/components/exam/ExamPaperWeb";
import { DeleteExamButton } from "@/components/exam/DeleteExamButton";
import type { ExamPaperPublic } from "@/lib/exam/types";
import type { ExamQuestionType } from "@/lib/prompts/examGenerate";

export default async function ExamDetailPage({ params }: PageProps<"/exams/[id]">) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const paper = await prisma.examPaper.findFirst({
    where: { id, userId: session!.user.id },
    include: {
      config: { select: { timeLimitMinutes: true } },
      questions: { orderBy: { order: "asc" } },
      attempts: {
        where: { submittedAt: { not: null } },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!paper) {
    notFound();
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/exams" className="text-sm text-gray-500 hover:text-gray-900">
          ← 목록으로
        </Link>
        <div className="flex items-center gap-4">
          <a
            href={`/api/exams/${paper.id}/pdf`}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            PDF 다운로드
          </a>
          <DeleteExamButton examId={paper.id} />
        </div>
      </div>

      {paper.attempts.length > 0 && (
        <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-sm font-medium">이전 응시 기록</p>
          <ul className="space-y-1">
            {paper.attempts.map((attempt) => (
              <li key={attempt.id}>
                <Link
                  href={`/exams/${paper.id}/result/${attempt.id}`}
                  className="text-sm text-gray-700 underline"
                >
                  {new Date(attempt.startedAt).toLocaleString("ko-KR")} - {attempt.totalScore}/
                  {attempt.totalPossible}점
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ExamPaperWeb paper={publicPaper} />
    </div>
  );
}

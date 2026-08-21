import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ExamsPage() {
  const session = await getServerSession(authOptions);

  const papers = await prisma.examPaper.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      attempts: {
        where: { submittedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">예상시험문제</h1>
        <Link
          href="/exams/new"
          className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5"
        >
          새 예상시험문제 만들기
        </Link>
      </div>

      {papers.length === 0 ? (
        <p className="mt-8 text-sm text-sb-mute">
          아직 생성한 예상시험문제가 없습니다. 먼저 노트를 업로드하고 요약을 만든 뒤 시험을 생성해보세요.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-white/10 rounded-md border border-white/10">
          {papers.map((paper) => {
            const lastAttempt = paper.attempts[0];
            return (
              <li key={paper.id}>
                <Link
                  href={`/exams/${paper.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-medium">{paper.title}</p>
                    <p className="text-xs text-sb-mute">
                      {new Date(paper.createdAt).toLocaleString("ko-KR")} · 총점 {paper.totalPoints}점
                    </p>
                  </div>
                  {lastAttempt && (
                    <span className="text-xs text-sb-mute">
                      최근 결과: {lastAttempt.totalScore}/{lastAttempt.totalPossible}점
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

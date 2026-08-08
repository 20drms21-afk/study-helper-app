import { prisma } from "@/lib/prisma";
import { todayKey, diffDays } from "@/lib/calendar/date";

interface AnswerResultForReview {
  questionId: string;
  isCorrect: boolean | null;
  score: number;
  maxScore: number;
}

export async function upsertReviewItemsForWrongAnswers(
  userId: string,
  subjectId: string,
  results: AnswerResultForReview[],
  attemptId: string
) {
  const wrongResults = results.filter(
    (r) => r.isCorrect === false || (r.isCorrect === null && r.score < r.maxScore)
  );

  for (const r of wrongResults) {
    await prisma.reviewItem.upsert({
      where: { userId_questionId: { userId, questionId: r.questionId } },
      create: {
        userId,
        subjectId,
        questionId: r.questionId,
        lastAttemptId: attemptId,
        wrongCount: 1,
        resolvedAt: null,
      },
      update: {
        wrongCount: { increment: 1 },
        lastAnsweredAt: new Date(),
        resolvedAt: null,
        lastAttemptId: attemptId,
      },
    });
  }
}

export function computeDday(examDateKey: string | null): number | null {
  if (!examDateKey) return null;
  return diffDays(todayKey(), examDateKey);
}

export interface ReviewQueueItem {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  wrongCount: number;
  lastAnsweredAt: Date;
  examDday: number | null;
  question: {
    id: string;
    type: string;
    prompt: string;
    choicesJson: string | null;
    topicTag: string;
  };
}

export async function getReviewQueueForUser(userId: string) {
  const items = await prisma.reviewItem.findMany({
    where: { userId, resolvedAt: null },
    include: {
      subject: { select: { name: true, color: true } },
      question: {
        select: { id: true, type: true, prompt: true, choicesJson: true, topicTag: true },
      },
    },
  });

  const today = todayKey();
  const upcomingExams = await prisma.calendarEvent.findMany({
    where: { userId, kind: "exam", date: { gte: today } },
    orderBy: { date: "asc" },
    select: { subjectId: true, date: true },
  });
  const nearestExamBySubject = new Map<string, string>();
  for (const e of upcomingExams) {
    if (!nearestExamBySubject.has(e.subjectId)) {
      nearestExamBySubject.set(e.subjectId, e.date);
    }
  }

  const enriched: ReviewQueueItem[] = items.map((item) => ({
    id: item.id,
    subjectId: item.subjectId,
    subjectName: item.subject.name,
    subjectColor: item.subject.color,
    wrongCount: item.wrongCount,
    lastAnsweredAt: item.lastAnsweredAt,
    examDday: computeDday(nearestExamBySubject.get(item.subjectId) ?? null),
    question: item.question,
  }));

  enriched.sort((a, b) => {
    const ddayA = a.examDday ?? Infinity;
    const ddayB = b.examDday ?? Infinity;
    if (ddayA !== ddayB) return ddayA - ddayB;
    if (a.wrongCount !== b.wrongCount) return b.wrongCount - a.wrongCount;
    return a.lastAnsweredAt.getTime() - b.lastAnsweredAt.getTime();
  });

  const bySubject = new Map<string, ReviewQueueItem[]>();
  for (const item of enriched) {
    if (!bySubject.has(item.subjectId)) bySubject.set(item.subjectId, []);
    bySubject.get(item.subjectId)!.push(item);
  }

  return {
    today: enriched.slice(0, 5),
    bySubject: [...bySubject.entries()].map(([subjectId, items]) => ({
      subjectId,
      subjectName: items[0].subjectName,
      items,
    })),
  };
}

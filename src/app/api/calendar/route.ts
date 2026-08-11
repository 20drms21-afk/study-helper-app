import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { daysInMonth, todayKey } from "@/lib/calendar/date";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    daysInMonth(year, month)
  ).padStart(2, "0")}`;

  const [sessions, events] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, subjectId: true, durationSeconds: true },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      orderBy: { date: "asc" },
    }),
  ]);

  const dayMap = new Map<
    string,
    { totalSeconds: number; bySubject: Map<string, number> }
  >();
  for (const s of sessions) {
    if (!dayMap.has(s.date)) {
      dayMap.set(s.date, { totalSeconds: 0, bySubject: new Map() });
    }
    const entry = dayMap.get(s.date)!;
    entry.totalSeconds += s.durationSeconds;
    if (s.subjectId) {
      entry.bySubject.set(s.subjectId, (entry.bySubject.get(s.subjectId) ?? 0) + s.durationSeconds);
    }
  }

  const subjectIds = [...new Set(sessions.map((s) => s.subjectId).filter((v): v is string => !!v))];
  const subjects = subjectIds.length
    ? await prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, color: true } })
    : [];
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const days = [...dayMap.entries()].map(([date, entry]) => ({
    date,
    totalSeconds: entry.totalSeconds,
    bySubject: [...entry.bySubject.entries()].map(([subjectId, seconds]) => ({
      subjectId,
      name: subjectMap.get(subjectId)?.name ?? "미분류",
      color: subjectMap.get(subjectId)?.color ?? "#6b7280",
      seconds,
    })),
  }));

  const monthTotalSeconds = days.reduce((sum, d) => sum + d.totalSeconds, 0);

  // 스트릭/다가오는 시험은 월과 무관하게 항상 "오늘" 기준
  const today = todayKey();
  const recentSessions = await prisma.studySession.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
    take: 400,
  });
  const studiedDates = new Set(recentSessions.map((s) => s.date));
  let streakDays = 0;
  const cursor = new Date();
  for (;;) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
      cursor.getDate()
    ).padStart(2, "0")}`;
    if (!studiedDates.has(key)) break;
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const upcomingExams = await prisma.calendarEvent.findMany({
    where: { userId, kind: "exam", date: { gte: today } },
    orderBy: { date: "asc" },
    take: 3,
  });

  return NextResponse.json({
    days,
    events: events.map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      date: e.date,
    })),
    summary: {
      monthTotalSeconds,
      streakDays,
      upcomingExams: upcomingExams.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
      })),
    },
  });
}

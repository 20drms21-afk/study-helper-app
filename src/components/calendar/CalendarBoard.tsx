"use client";

import { useEffect, useState } from "react";
import { startOfMonthGrid, todayKey } from "@/lib/calendar/date";
import { DayCell, type CalendarDayDto, type CalendarEventDto } from "@/components/calendar/DayCell";
import { DayPanel } from "@/components/calendar/DayPanel";

interface CalendarResponse {
  days: CalendarDayDto[];
  events: CalendarEventDto[];
  summary: {
    monthTotalSeconds: number;
    streakDays: number;
    upcomingExams: { id: string; title: string; date: string }[];
  };
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}시간 ${m}분`;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarBoard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/calendar?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  function goMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setLoading(true);
    setYear(newYear);
    setMonth(newMonth);
    setSelectedDate(null);
  }

  const grid = startOfMonthGrid(year, month);
  const today = todayKey();
  const dayByDate = new Map((data?.days ?? []).map((d) => [d.date, d]));
  const eventsByDate = new Map<string, CalendarEventDto[]>();
  for (const e of data?.events ?? []) {
    if (!eventsByDate.has(e.date)) eventsByDate.set(e.date, []);
    eventsByDate.get(e.date)!.push(e);
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-4 rounded-md border border-white/10 p-4">
        <div>
          <p className="text-xs text-sb-mute">이번 달 총 학습시간</p>
          <p className="text-lg font-bold">{formatHours(data?.summary.monthTotalSeconds ?? 0)}</p>
        </div>
        <div>
          <p className="text-xs text-sb-mute">연속 학습일</p>
          <p className="text-lg font-bold">{data?.summary.streakDays ?? 0}일</p>
        </div>
        <div>
          <p className="text-xs text-sb-mute">다가오는 시험</p>
          {data && data.summary.upcomingExams.length > 0 ? (
            <ul className="text-xs">
              {data.summary.upcomingExams.map((e) => (
                <li key={e.id}>
                  {e.title} ({e.date})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-sb-mute">없음</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => goMonth(-1)}
              className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              이전
            </button>
            <h2 className="text-lg font-bold">
              {year}년 {month}월
            </h2>
            <button
              onClick={() => goMonth(1)}
              className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
            >
              다음
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-sb-mute">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="pb-1">
                {w}
              </div>
            ))}
          </div>
          <div className={`grid grid-cols-7 gap-1 ${loading ? "opacity-50" : ""}`}>
            {grid.map((date) => (
              <DayCell
                key={date}
                date={date}
                inCurrentMonth={date.startsWith(`${year}-${String(month).padStart(2, "0")}`)}
                isToday={date === today}
                isSelected={date === selectedDate}
                day={dayByDate.get(date)}
                events={eventsByDate.get(date) ?? []}
                onClick={() => setSelectedDate(date)}
              />
            ))}
          </div>
        </div>

        {/* 날짜 선택 시 캘린더 옆(넓은 화면) / 아래(좁은 화면)에 바로 붙여서
            스크롤 없이 한 화면에서 등록까지 할 수 있게 함 */}
        <div className="w-full shrink-0 lg:w-80">
          {selectedDate ? (
            <DayPanel
              date={selectedDate}
              day={dayByDate.get(selectedDate)}
              events={eventsByDate.get(selectedDate) ?? []}
              onEventCreated={(event) => {
                setData((prev) =>
                  prev ? { ...prev, events: [...prev.events, event] } : prev
                );
              }}
              onEventDeleted={(id) => {
                setData((prev) =>
                  prev ? { ...prev, events: prev.events.filter((e) => e.id !== id) } : prev
                );
              }}
              onClose={() => setSelectedDate(null)}
            />
          ) : (
            <div className="rounded-md border border-dashed border-white/10 p-4 text-center text-sm text-sb-mute">
              날짜를 클릭하면 학습 기록과 일정을 여기서 확인·등록할 수 있어요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

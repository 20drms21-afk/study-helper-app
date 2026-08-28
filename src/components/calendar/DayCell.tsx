"use client";

import type { CSSProperties } from "react";
import { heatColor } from "@/lib/calendar/heat";
import { EVENT_KIND_COLOR, type CalendarEventKind } from "@/lib/calendar/kind";

export interface CalendarEventDto {
  id: string;
  kind: CalendarEventKind;
  title: string;
  date: string;
}

export interface CalendarDayDto {
  date: string;
  totalSeconds: number;
  bySubject: { subjectId: string; name: string; color: string; seconds: number }[];
}

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({
  date,
  inCurrentMonth,
  isToday,
  isSelected,
  day,
  events,
  onClick,
}: {
  date: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  day: CalendarDayDto | undefined;
  events: CalendarEventDto[];
  onClick: () => void;
}) {
  const { bg } = heatColor(day?.totalSeconds ?? 0);
  const dayNumber = Number(date.split("-")[2]);
  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
  const hiddenCount = events.length - visibleEvents.length;

  // 배경색을 인라인 style로 바로 주면 인라인 스타일이 항상 클래스보다 우선순위가 높아서
  // hover: 클래스가 절대 못 이긴다 — 대신 CSS 변수(--cell-bg)에 heat 색을 담아두고, 실제
  // 배경은 bg-[var(--cell-bg)] 클래스로 적용해서 hover:bg-[...]가 정상적으로 덮어쓰게 한다.
  // 이번 달이 아닌 날짜도 더 이상 opacity로 흐리게 하지 않고 같은 배경을 쓰되, 날짜 숫자
  // 텍스트 색만 보조 톤으로 낮춰서 구분한다.
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-24 w-full flex-col items-start gap-1 rounded-md border bg-[var(--cell-bg)] p-1.5 text-left hover:bg-[#D8DED1] ${
        isSelected ? "border-sb-accent" : "border-transparent"
      }`}
      style={{ "--cell-bg": bg } as CSSProperties}
    >
      <span
        className={`text-xs font-medium ${
          isToday
            ? "flex h-5 w-5 items-center justify-center rounded-full bg-sb-accent text-sb-accent-ink"
            : ""
        }`}
        style={isToday ? undefined : { color: inCurrentMonth ? "#263122" : "#9AA393" }}
      >
        {dayNumber}
      </span>
      {events.length > 0 && (
        <div className="flex w-full flex-col gap-0.5">
          {visibleEvents.map((e) => (
            <span
              key={e.id}
              title={e.title}
              className="block w-full truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white"
              style={{ backgroundColor: EVENT_KIND_COLOR[e.kind] }}
            >
              {e.title}
            </span>
          ))}
          {hiddenCount > 0 && <span className="text-[10px] text-[#9AA393]">+{hiddenCount}개 더보기</span>}
        </div>
      )}
    </button>
  );
}

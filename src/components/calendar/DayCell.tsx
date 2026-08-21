"use client";

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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-24 w-full flex-col items-start gap-1 rounded-md border p-1.5 text-left ${
        isSelected ? "border-sb-accent" : "border-transparent"
      } ${inCurrentMonth ? "" : "opacity-40"}`}
      style={{ backgroundColor: inCurrentMonth ? bg : "#171a10" }}
    >
      <span
        className={`text-xs font-medium ${
          isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-sb-accent text-sb-accent-ink" : "text-sb-text"
        }`}
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
          {hiddenCount > 0 && <span className="text-[10px] text-sb-mute">+{hiddenCount}개 더보기</span>}
        </div>
      )}
    </button>
  );
}

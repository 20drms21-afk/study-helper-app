"use client";

import { heatColor } from "@/lib/calendar/heat";

export interface CalendarEventDto {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  kind: "exam" | "assignment";
  title: string;
  date: string;
}

export interface CalendarDayDto {
  date: string;
  totalSeconds: number;
  bySubject: { subjectId: string; name: string; color: string; seconds: number }[];
}

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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-20 flex-col items-start gap-1 rounded-md border p-1.5 text-left ${
        isSelected ? "border-gray-900" : "border-transparent"
      } ${inCurrentMonth ? "" : "opacity-40"}`}
      style={{ backgroundColor: inCurrentMonth ? bg : "#f9fafb" }}
    >
      <span
        className={`text-xs font-medium ${
          isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white" : "text-gray-700"
        }`}
      >
        {dayNumber}
      </span>
      {events.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {events.slice(0, 3).map((e) => (
            <span
              key={e.id}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: e.subjectColor }}
              title={e.title}
            />
          ))}
          {events.length > 3 && <span className="text-[10px] text-gray-600">+{events.length - 3}</span>}
        </div>
      )}
    </button>
  );
}

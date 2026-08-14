export type CalendarEventKind = "exam" | "assignment" | "other" | "activity";

export const CALENDAR_EVENT_KINDS: CalendarEventKind[] = ["exam", "assignment", "other", "activity"];

export const EVENT_KIND_LABEL: Record<CalendarEventKind, string> = {
  exam: "시험",
  assignment: "과제",
  other: "기타",
  activity: "대외활동",
};

// 캘린더에 표시되는 일정 종류별 색상 (시험: 빨강, 과제: 파랑, 기타: 보라, 대외활동: 주황)
export const EVENT_KIND_COLOR: Record<CalendarEventKind, string> = {
  exam: "#dc2626",
  assignment: "#2563eb",
  other: "#9333ea",
  activity: "#d97706",
};

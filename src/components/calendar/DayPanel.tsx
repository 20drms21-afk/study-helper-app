"use client";

import { useState } from "react";
import { SubjectPicker, type SubjectRef } from "@/components/SubjectPicker";
import type { CalendarDayDto, CalendarEventDto } from "@/components/calendar/DayCell";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0 && m === 0) return "0분";
  if (h === 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

export function DayPanel({
  date,
  day,
  events,
  subjects,
  onSubjectsChange,
  onEventCreated,
  onEventDeleted,
  onClose,
}: {
  date: string;
  day: CalendarDayDto | undefined;
  events: CalendarEventDto[];
  subjects: SubjectRef[];
  onSubjectsChange: (subjects: SubjectRef[]) => void;
  onEventCreated: (event: CalendarEventDto) => void;
  onEventDeleted: (id: string) => void;
  onClose: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [kind, setKind] = useState<"exam" | "assignment">("exam");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !title.trim()) {
      setError("과목과 제목을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, kind, title: title.trim(), date }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "일정을 등록할 수 없습니다.");
      }
      const event = await res.json();
      onEventCreated({
        id: event.id,
        subjectId: event.subjectId,
        subjectName: event.subject.name,
        subjectColor: event.subject.color,
        kind: event.kind,
        title: event.title,
        date: event.date,
      });
      setTitle("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정을 등록할 수 없습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    onEventDeleted(id);
    await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
  }

  const maxSeconds = Math.max(1, ...(day?.bySubject.map((s) => s.seconds) ?? [0]));

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">{date}</h3>
        <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-900">
          닫기
        </button>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-gray-600">과목별 공부 시간</p>
        {day && day.bySubject.length > 0 ? (
          <div className="space-y-2">
            {day.bySubject.map((s) => (
              <div key={s.subjectId}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-gray-600">{formatDuration(s.seconds)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(s.seconds / maxSeconds) * 100}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">이 날의 학습 기록이 없습니다.</p>
        )}
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600">일정</p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs font-medium text-gray-900 hover:underline"
          >
            {showForm ? "취소" : "+ 일정 등록"}
          </button>
        </div>

        {events.length > 0 ? (
          <ul className="space-y-1">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 text-xs"
              >
                <span>
                  <span
                    className="mr-1.5 inline-block rounded px-1.5 py-0.5 text-white"
                    style={{ backgroundColor: e.subjectColor }}
                  >
                    {e.kind === "exam" ? "시험" : "과제"}
                  </span>
                  {e.subjectName} · {e.title}
                </span>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="ml-2 shrink-0 text-red-600 hover:text-red-700"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !showForm && <p className="text-xs text-gray-500">등록된 일정이 없습니다.</p>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-md border border-gray-200 p-3">
            <SubjectPicker
              subjects={subjects}
              value={subjectId}
              onChange={setSubjectId}
              onCreated={(s) => onSubjectsChange([...subjects, s])}
            />
            <div>
              <label className="mb-1 block text-xs font-medium">종류</label>
              <div className="flex gap-3 text-sm">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={kind === "exam"}
                    onChange={() => setKind("exam")}
                  />
                  시험
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={kind === "assignment"}
                    onChange={() => setKind("assignment")}
                  />
                  과제
                </label>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 중간고사"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              등록
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

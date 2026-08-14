"use client";

import { useState } from "react";

interface ActivityListingView {
  id: string;
  title: string;
  organizer: string | null;
  category: string;
  targetInfo: string | null;
  deadlineText: string | null;
  deadlineDate: string | null;
  sourceUrl: string;
  matchScore?: number;
}

const TITLE_SUFFIX = " 마감";
const MAX_EVENT_TITLE_LENGTH = 100; // /api/calendar/events의 title 상한과 맞춤

export function ActivityCard({ activity }: { activity: ActivityListingView }) {
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!activity.deadlineDate) return;
    setRegistering(true);
    setError(null);
    try {
      const title = `${activity.title}${TITLE_SUFFIX}`.slice(0, MAX_EVENT_TITLE_LENGTH);
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "activity", title, date: activity.deadlineDate }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "캘린더에 등록하지 못했습니다.");
      }
      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "캘린더에 등록하지 못했습니다.");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <li className="rounded-md border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {activity.category === "contest" ? "공모전" : "대외활동"}
          </span>
          {!!activity.matchScore && activity.matchScore > 0 && (
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              🎯 관심분야 일치
            </span>
          )}
          <p className="text-sm font-medium">{activity.title}</p>
        </div>
        <a
          href={activity.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          자세히 보기
        </a>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {activity.organizer || "주최기관 미상"}
        {activity.deadlineText && ` · ${activity.deadlineText}`}
      </p>
      {activity.targetInfo && <p className="mt-2 text-xs text-gray-600">{activity.targetInfo}</p>}

      <div className="mt-3 flex items-center gap-2">
        {activity.deadlineDate ? (
          <button
            type="button"
            onClick={handleRegister}
            disabled={registering || registered}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-default disabled:opacity-60"
          >
            {registered ? "✓ 캘린더에 등록됨" : registering ? "등록 중..." : "📅 캘린더에 마감일 등록"}
          </button>
        ) : (
          <span className="text-xs text-gray-400" title="마감일을 정확한 날짜로 인식하지 못해 등록할 수 없어요.">
            마감일 미인식 · 캘린더 등록 불가
          </span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </li>
  );
}

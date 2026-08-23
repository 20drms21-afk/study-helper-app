"use client";

import { useState } from "react";
import { ReviewCard } from "@/components/review/ReviewCard";
import type { ReviewQueueItem } from "@/lib/review";

interface SubjectGroup {
  subjectId: string;
  subjectName: string;
  items: ReviewQueueItem[];
}

export function ReviewBoard({
  initialToday,
  initialBySubject,
}: {
  initialToday: ReviewQueueItem[];
  initialBySubject: SubjectGroup[];
}) {
  const [today, setToday] = useState(initialToday);
  const [bySubject, setBySubject] = useState(initialBySubject);
  const [activeTab, setActiveTab] = useState<string>("all");

  function handleResolved(id: string) {
    setToday((prev) => prev.filter((i) => i.id !== id));
    setBySubject((prev) =>
      prev
        .map((g) => ({ ...g, items: g.items.filter((i) => i.id !== id) }))
        .filter((g) => g.items.length > 0)
    );
  }

  function handleWrongAgain(id: string) {
    const bump = (items: ReviewQueueItem[]) =>
      items.map((i) => (i.id === id ? { ...i, wrongCount: i.wrongCount + 1 } : i));
    setToday(bump);
    setBySubject((prev) => prev.map((g) => ({ ...g, items: bump(g.items) })));
  }

  const allItems = bySubject.flatMap((g) => g.items);
  const visibleItems = activeTab === "all" ? allItems : bySubject.find((g) => g.subjectId === activeTab)?.items ?? [];

  return (
    <div>
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">오늘 복습할 5문제</h2>
        {today.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {today.map((item) => (
              <ReviewCard
                key={item.id}
                item={item}
                large
                onResolved={handleResolved}
                onWrongAgain={handleWrongAgain}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-sb-mute">복습할 문제가 없습니다. 예상문제를 풀어보세요!</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">전체 복습 큐</h2>
        <div className="mb-4 flex gap-1 border-b border-sb-border">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "all"
                ? "border-b-2 border-sb-accent text-sb-text"
                : "text-sb-mute hover:text-sb-text"
            }`}
          >
            전체
          </button>
          {bySubject.map((g) => (
            <button
              key={g.subjectId}
              onClick={() => setActiveTab(g.subjectId)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === g.subjectId
                  ? "border-b-2 border-sb-accent text-sb-text"
                  : "text-sb-mute hover:text-sb-text"
              }`}
            >
              {g.subjectName} ({g.items.length})
            </button>
          ))}
        </div>

        {visibleItems.length > 0 ? (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <ReviewCard
                key={item.id}
                item={item}
                onResolved={handleResolved}
                onWrongAgain={handleWrongAgain}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-sb-mute">복습할 문제가 없습니다.</p>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { choiceLabel, parseChoices } from "@/lib/exam/formatters";
import type { ReviewQueueItem } from "@/lib/review";

function ddayStatus(dday: number | null): { label: string; color: string } {
  if (dday === null) return { label: "미정", color: "#6b7280" };
  if (dday < 0) return { label: "지남", color: "#6b7280" };
  if (dday <= 3) return { label: `D-${dday === 0 ? "day" : dday}`, color: "#d03b3b" };
  if (dday <= 7) return { label: `D-${dday}`, color: "#ec835a" };
  return { label: `D-${dday}`, color: "#6b7280" };
}

interface RetryResult {
  isCorrect: boolean | null;
  correctAnswer: string | null;
  modelAnswer: string | null;
  explanation: string | null;
}

export function ReviewCard({
  item,
  large,
  onResolved,
  onWrongAgain,
}: {
  item: ReviewQueueItem;
  large?: boolean;
  onResolved: (id: string) => void;
  onWrongAgain: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RetryResult | null>(null);
  const [resolving, setResolving] = useState(false);

  const status = ddayStatus(item.examDday);
  const choices = parseChoices(item.question.choicesJson);

  async function submitRetry(body: object) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/review/${item.id}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "채점에 실패했습니다.");
      setResult(data);
      if (data.isCorrect === false) {
        onWrongAgain(item.id);
      }
    } catch {
      // no-op: 에러는 result가 null인 채로 유지되어 재시도 가능
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(shouldResolve: boolean) {
    if (!shouldResolve) {
      setOpen(false);
      setResult(null);
      return;
    }
    setResolving(true);
    try {
      await fetch(`/api/review/${item.id}/resolve`, { method: "POST" });
      onResolved(item.id);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div
      className={`rounded-md border border-sb-border ${large ? "p-4" : "p-3"}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="rounded px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: status.color }}
        >
          {status.label}
        </span>
        <span className="text-xs text-sb-mute">누적 오답 {item.wrongCount}회</span>
      </div>
      <p className={`mb-1 text-xs text-sb-mute`}>{item.subjectName} · {item.question.topicTag}</p>
      <p className={`mb-3 ${large ? "text-sm" : "text-xs"} font-medium`}>
        {item.question.prompt}
      </p>

      {!open && !result && (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-sb-accent px-3 py-1.5 text-xs font-medium text-sb-accent-ink hover:-translate-y-0.5"
        >
          다시 풀기
        </button>
      )}

      {open && !result && (
        <div className="space-y-2">
          {item.question.type === "mcq" && choices && (
            <div className="space-y-1">
              {choices.map((c, i) => (
                <label key={i} className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name={`answer-${item.id}`}
                    value={choiceLabel(i)}
                    checked={studentAnswer === choiceLabel(i)}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                  />
                  {choiceLabel(i)}. {c}
                </label>
              ))}
            </div>
          )}
          {item.question.type === "short" && (
            <input
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              placeholder="답을 입력하세요"
              className="w-full rounded-md border border-sb-border px-3 py-1.5 text-xs"
            />
          )}
          {item.question.type === "essay" && (
            <p className="text-xs text-sb-mute">
              서술형 문제는 모범답안을 보고 스스로 채점합니다.
            </p>
          )}

          <div className="flex gap-2">
            {item.question.type === "essay" ? (
              <button
                onClick={() => submitRetry({ reveal: true })}
                disabled={submitting}
                className="rounded-md border border-sb-border px-3 py-1.5 text-xs font-medium hover:bg-sb-hover disabled:opacity-50"
              >
                모범답안 보기
              </button>
            ) : (
              <button
                onClick={() => submitRetry({ studentAnswer })}
                disabled={submitting || !studentAnswer}
                className="rounded-full bg-sb-accent px-3 py-1.5 text-xs font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
              >
                제출
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="rounded-md border border-sb-border px-3 py-1.5 text-xs font-medium hover:bg-sb-hover"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {result && item.question.type === "essay" && result.isCorrect === null && (
        <div className="space-y-2">
          <div className="rounded-md bg-sb-card p-2 text-xs">
            <p className="font-medium">모범답안</p>
            <p className="mt-1 whitespace-pre-wrap">{result.modelAnswer}</p>
            {result.explanation && <p className="mt-1 text-sb-mute">{result.explanation}</p>}
          </div>
          <p className="text-xs font-medium">이 문제를 맞혔나요?</p>
          <div className="flex gap-2">
            <button
              onClick={() => submitRetry({ selfReport: "correct" })}
              className="rounded-md border border-sb-border px-3 py-1.5 text-xs font-medium hover:bg-sb-hover"
            >
              맞았어요
            </button>
            <button
              onClick={() => submitRetry({ selfReport: "incorrect" })}
              className="rounded-md border border-sb-border px-3 py-1.5 text-xs font-medium hover:bg-sb-hover"
            >
              틀렸어요
            </button>
          </div>
        </div>
      )}

      {result && result.isCorrect !== null && (
        <div className="space-y-2">
          <p className={`text-xs font-medium ${result.isCorrect ? "text-sb-accent-deep" : "text-[#ff8a8a]"}`}>
            {result.isCorrect ? "정답입니다!" : "오답입니다."}
          </p>
          {!result.isCorrect && (
            <div className="rounded-md bg-sb-card p-2 text-xs">
              <p>{item.question.type === "essay" ? "모범답안" : "정답"}: {item.question.type === "essay" ? result.modelAnswer : result.correctAnswer}</p>
              {result.explanation && <p className="mt-1 text-sb-mute">{result.explanation}</p>}
            </div>
          )}
          {result.isCorrect ? (
            <div>
              <p className="mb-1 text-xs font-medium">이 문제를 복습 큐에서 제거할까요?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolve(true)}
                  disabled={resolving}
                  className="rounded-full bg-sb-accent px-3 py-1.5 text-xs font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
                >
                  제거
                </button>
                <button
                  onClick={() => handleResolve(false)}
                  className="rounded-md border border-sb-border px-3 py-1.5 text-xs font-medium hover:bg-sb-hover"
                >
                  유지
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setResult(null);
                setStudentAnswer("");
              }}
              className="rounded-md border border-sb-border px-3 py-1.5 text-xs font-medium hover:bg-sb-hover"
            >
              닫기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

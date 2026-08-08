"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamPaperPublic } from "@/lib/exam/types";
import { choiceLabel } from "@/lib/exam/formatters";

export function ExamPaperWeb({ paper }: { paper: ExamPaperPublic }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!confirm("답안을 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.")) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/exams/${paper.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, studentAnswer]) => ({
            questionId,
            studentAnswer,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "채점 중 오류가 발생했습니다.");
      }
      const { attemptId } = await res.json();
      router.push(`/exams/${paper.id}/result/${attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 border-b-2 border-gray-900 pb-4 text-center">
        <h1 className="text-2xl font-bold">{paper.title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          시험 시간: {paper.timeLimitMinutes}분 · 총점: {paper.totalPoints}점
        </p>
      </div>

      <div className="space-y-8">
        {paper.questions.map((q, i) => (
          <div key={q.id} className="border-b border-gray-200 pb-6">
            <p className="mb-3 text-sm font-semibold">
              {i + 1}. {q.prompt}
              <span className="ml-2 font-normal text-gray-500">[{q.points}점]</span>
            </p>

            {q.type === "mcq" && q.choices && (
              <div className="space-y-2 pl-4">
                {q.choices.map((choice, ci) => (
                  <label key={ci} className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      value={choice}
                      checked={answers[q.id] === choice}
                      onChange={() => setAnswer(q.id, choice)}
                      className="mt-1"
                    />
                    <span>
                      {choiceLabel(ci)}. {choice}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "short" && (
              <input
                type="text"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="답을 입력하세요"
              />
            )}

            {q.type === "essay" && (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="답안을 작성하세요"
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "채점 중..." : "답안 제출"}
        </button>
      </div>
    </div>
  );
}

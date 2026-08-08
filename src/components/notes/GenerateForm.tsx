"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NoteContentType } from "@/lib/prompts/summarize";

export function GenerateForm({
  fileId,
  type,
  hasContent,
}: {
  fileId: string;
  type: NoteContentType;
  hasContent: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/notes/${fileId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "생성에 실패했습니다.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const label = type === "summary" ? "요약" : "설명";

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading
          ? `${label} 생성 중... (최대 1~2분 정도 걸릴 수 있습니다)`
          : hasContent
            ? "다시 생성"
            : "생성하기"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

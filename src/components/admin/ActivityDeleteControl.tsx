"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActivityDeleteControl({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("이 공모전/대외활동을 삭제하시겠습니까?")) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activities/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "삭제에 실패했습니다.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        삭제
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

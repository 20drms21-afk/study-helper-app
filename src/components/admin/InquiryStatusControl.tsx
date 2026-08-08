"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "open", label: "접수됨" },
  { value: "answered", label: "답변완료" },
  { value: "closed", label: "종료" },
];

export function InquiryStatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "상태 변경에 실패했습니다.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이 문의를 삭제하시겠습니까?")) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
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
      <select
        defaultValue={status}
        onChange={handleChange}
        disabled={loading}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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

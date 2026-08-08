"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteNoteButton({ fileId }: { fileId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("이 노트와 요약을 삭제하시겠습니까?")) return;

    setLoading(true);
    const res = await fetch(`/api/notes/${fileId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/notes");
      router.refresh();
    } else {
      setLoading(false);
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}

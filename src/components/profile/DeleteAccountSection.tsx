"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DeleteAccountSection({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canDelete = confirmText === userEmail;

  async function handleDelete() {
    if (!canDelete) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "탈퇴 처리에 실패했습니다.");
      }
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-[rgba(255,138,138,0.3)] bg-[rgba(255,138,138,0.1)] p-4">
      <h3 className="text-sm font-semibold text-[#ff8a8a]">회원 탈퇴</h3>
      <p className="mt-1 text-xs text-[#ff8a8a]">
        탈퇴 시 노트, 시험 기록, 업로드한 파일 등 모든 데이터가 영구적으로 삭제되며 되돌릴 수
        없습니다.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-md border border-[rgba(255,138,138,0.4)] px-3 py-1.5 text-xs font-medium text-[#ff8a8a] hover:bg-[rgba(255,138,138,0.1)]"
        >
          회원 탈퇴
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-medium text-[#ff8a8a]">
            확인을 위해 이메일({userEmail})을 입력해주세요
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-md border border-[rgba(255,138,138,0.4)] px-3 py-2 text-sm focus:border-[#ff8a8a] focus:outline-none"
            placeholder={userEmail}
          />
          {error && <p className="text-xs text-[#ff8a8a]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || loading}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "탈퇴 처리 중..." : "탈퇴하기"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setError(null);
              }}
              className="rounded-md border border-sb-border px-3 py-1.5 text-xs font-medium text-sb-mute hover:bg-sb-hover"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

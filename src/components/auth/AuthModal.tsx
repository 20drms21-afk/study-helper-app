"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 랜딩페이지에서 로그인/회원가입을 눌렀을 때 뜨는 모달 껍데기 — src/app/@authModal의
 * 인터셉트 라우트((.)login, (.)signup)가 이걸로 감싼다. AuthShell(전체 페이지용)과 달리
 * 자체 배경(AmbientBackground 등)을 안 그리고, 그 자리에 있던 실제 페이지(랜딩페이지)가
 * 뒤에 그대로 남아있는 채로 그 위에 반투명 블러 오버레이 + 카드만 얹는다 — 이게 인터셉트
 * 라우트를 쓰는 핵심 이유(직접 URL로 들어오면 이 모달이 아니라 AuthShell 전체 페이지가 뜸).
 */
export function AuthModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function close() {
    router.back();
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    // 모달이 떠 있는 동안 뒤에 깔린 랜딩페이지가 스크롤되지 않게 막는다.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-5 py-16 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full max-w-[420px] rounded-3xl border border-sb-accent/10 bg-[rgba(13,14,9,0.95)] p-9 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-sb-mute transition-colors hover:bg-sb-accent/10 hover:text-sb-text"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

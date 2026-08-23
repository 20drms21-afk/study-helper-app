"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

const accountLinks = [
  { href: "/profile/account", label: "내 정보" },
  { href: "/profile", label: "마이페이지" },
  { href: "/billing", label: "구독/결제 관리" },
  { href: "/inquiries/mine", label: "문의 내역" },
];

const AVATAR_SIZE = 44; // 링(SVG) 기준 전체 크기
const RING_RADIUS = 19;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * 로그인 상태에서 헤더에 뜨는 아바타 + 드롭다운. DashboardNav와 랜딩페이지 헤더가 공유.
 *
 * `quotaPercent`(0~100, 이번 달 남은 토큰 비율)를 넘기면 아바타 테두리에 라임그린 링으로
 * 표시한다 — 12시 방향에서 시작해 시계방향으로 `quotaPercent`%만큼 그려지므로, 사용량이
 * 늘어(남은 비율이 줄어)들수록 링의 끝이 반시계방향으로 줄어드는 것처럼 보인다. 100%면
 * 링이 꽉 찬 원, 0%면 링이 전혀 안 보임. 무제한 플랜(관리자)처럼 비율 자체가 의미 없을
 * 땐 `null`을 넘기면 링 없이 아바타만 표시된다.
 */
export function UserMenu({
  userName,
  dark = false,
  quotaPercent = null,
}: {
  userName: string;
  dark?: boolean;
  quotaPercent?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const personIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div className="relative" ref={ref}>
      {dark ? (
        <div className="relative" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
          {quotaPercent !== null && (
            <svg
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              viewBox={`0 0 ${AVATAR_SIZE} ${AVATAR_SIZE}`}
              className="pointer-events-none absolute inset-0 -rotate-90"
              aria-hidden="true"
            >
              {/* 남은 토큰 비율만큼 12시 방향에서 시계방향으로 그려짐 — 사용량이 늘수록
                  (남은 비율이 줄수록) 끝 지점이 반시계방향으로 후퇴하며 링이 줄어든다. */}
              <circle
                cx={AVATAR_SIZE / 2}
                cy={AVATAR_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--color-sb-accent)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={
                  RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, quotaPercent)) / 100)
                }
              />
            </svg>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="계정 메뉴"
            className="absolute inset-[3px] flex items-center justify-center rounded-full border border-white/15 bg-white/10 text-sb-mute transition-colors hover:bg-white/15 hover:text-sb-text"
          >
            {personIcon}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="계정 메뉴"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900"
        >
          {personIcon}
        </button>
      )}
      {open && (
        <div
          className={
            dark
              ? "glass-menu absolute right-0 top-full z-10 mt-2 w-48 rounded-2xl p-2"
              : "absolute right-0 top-full z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          }
        >
          <p
            className={
              dark
                ? "truncate border-b border-white/10 px-3 py-2 font-body-kr text-sm font-bold text-sb-text"
                : "truncate border-b border-gray-100 px-3 py-2 text-sm text-gray-600"
            }
          >
            {userName}
          </p>
          {accountLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                dark
                  ? "block rounded-lg px-3 py-2 font-body-kr text-sm text-sb-text hover:bg-white/10"
                  : "block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className={dark ? "my-1 border-t border-white/10" : "border-t border-gray-100"} />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={
              dark
                ? "block w-full rounded-lg px-3 py-2 text-left font-body-kr text-sm text-sb-text hover:bg-white/10"
                : "block w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

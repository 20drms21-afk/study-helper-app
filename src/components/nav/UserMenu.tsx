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

/** 로그인 상태에서 헤더에 뜨는 아바타 + 드롭다운. DashboardNav와 랜딩페이지 헤더가 공유. */
export function UserMenu({ userName, dark = false }: { userName: string; dark?: boolean }) {
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="계정 메뉴"
        className={
          dark
            ? "flex h-10 w-10 items-center justify-center rounded-full bg-sb-accent text-base font-extrabold text-sb-accent-ink"
            : "flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900"
        }
      >
        {dark ? (
          "👤"
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      {open && (
        <div
          className={
            dark
              ? "glass absolute right-0 top-full z-10 mt-2 w-48 rounded-2xl p-2"
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

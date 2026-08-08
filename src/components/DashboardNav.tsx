"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { NavDropdown } from "@/components/nav/NavDropdown";

const studyLinks = [
  { href: "/notes", label: "노트/요약" },
  { href: "/exams", label: "예상문제출력" },
  { href: "/review", label: "오답노트" },
  { href: "/tutor", label: "AI선생님" },
  { href: "/translate", label: "PDF 영어자료 변환" },
  { href: "/calendar", label: "캘린더" },
  { href: "/timer", label: "포모도로" },
];

const infoLinks = [
  { href: "/scholarships", label: "장학금" },
  { href: "/activities", label: "대외활동/공모전" },
];

const adminLinks = [
  { href: "/admin/inquiries", label: "문의 관리" },
  { href: "/admin/activities", label: "공모전 관리" },
];

const accountLinks = [
  { href: "/profile/account", label: "내 정보" },
  { href: "/profile", label: "마이페이지" },
  { href: "/billing", label: "구독/결제 관리" },
  { href: "/inquiries/mine", label: "문의 내역" },
];

function MyPageMenu({ userName }: { userName: string }) {
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
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <p className="truncate border-b border-gray-100 px-3 py-2 text-sm text-gray-600">
            {userName}
          </p>
          {accountLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

export function DashboardNav({
  userName,
  isAdmin,
}: {
  userName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const billingActive = pathname === "/billing" || pathname.startsWith("/billing/");
  const inquiriesActive =
    pathname === "/inquiries" || pathname.startsWith("/inquiries/");

  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/notes" className="flex items-center gap-2 text-lg font-bold">
            <Logo size={24} />
            공부한입
          </Link>
          <nav className="flex items-center gap-5">
            <NavDropdown label="학습" items={studyLinks} />
            <NavDropdown label="정보" items={infoLinks} />
            <Link
              href="/billing"
              className={`text-sm font-medium ${
                billingActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              요금제
            </Link>
            <Link
              href="/inquiries"
              className={`text-sm font-medium ${
                inquiriesActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              문의하기
            </Link>
            {isAdmin && <NavDropdown label="관리자" items={adminLinks} />}
          </nav>
        </div>
        <MyPageMenu userName={userName} />
      </div>
    </header>
  );
}

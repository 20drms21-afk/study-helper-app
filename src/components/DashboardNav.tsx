"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/Logo";
import { NavDropdown } from "@/components/nav/NavDropdown";
import { UserMenu } from "@/components/nav/UserMenu";

const studyLinks = [
  { href: "/notes", label: "노트/요약" },
  { href: "/exams", label: "예상문제출력" },
  { href: "/review", label: "오답노트" },
  { href: "/tutor", label: "AI선생님" },
  { href: "/translate", label: "PDF 영어자료 변환" },
  { href: "/calendar", label: "캘린더" },
  { href: "/timer", label: "집중 타이머" },
];

const infoLinks = [
  { href: "/scholarships", label: "장학금" },
  { href: "/activities", label: "대외활동/공모전" },
];

const adminLinks = [
  { href: "/admin/inquiries", label: "문의 관리" },
  { href: "/admin/activities", label: "공모전 관리" },
];

// 랜딩페이지 헤더(landing/Header.tsx)와 바깥 레이아웃(전체 폭 헤더 + clamp 패딩, 로고 크기,
// 우측 min-w-[230px] 블록)을 그대로 맞춰서, 랜딩 드롭다운에서 기능 페이지로 들어갈 때
// 로고·"학습"/"정보" 메뉴 위치가 화면상에서 튀지 않게 한다 — 예전엔 여기만 mx-auto max-w-5xl로
// 좁게 가운데 정렬돼 있어서 화면이 넓을수록 랜딩보다 메뉴가 안쪽으로 밀려 보였다(사용자 신고).
export function DashboardNav({
  userName,
  isAdmin,
  quotaPercent = null,
}: {
  userName: string;
  isAdmin: boolean;
  quotaPercent?: number | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const billingActive = pathname === "/billing" || pathname.startsWith("/billing/");
  const inquiriesActive = pathname === "/inquiries" || pathname.startsWith("/inquiries/");

  return (
    <header className="sticky top-0 z-40 border-b border-sb-border bg-sb-bg/75 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-5 px-[clamp(20px,5vw,64px)] py-3">
        <Link href="/" className="flex items-center gap-3 text-sb-text">
          <Logo size={33} className="text-sb-accent" />
          <span className="font-display text-xl font-extrabold leading-none">공부한입</span>
          <span className="font-body-kr text-[11px] tracking-[0.08em] text-sb-mute">
            STUDYBITE
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <NavDropdown dark label="학습" items={studyLinks} />
          <NavDropdown dark label="정보" items={infoLinks} />
          <Link
            href="/billing"
            className={`text-sm font-medium ${
              billingActive ? "text-sb-text" : "text-sb-mute hover:text-sb-text"
            }`}
          >
            요금제
          </Link>
          <Link
            href="/inquiries"
            className={`text-sm font-medium ${
              inquiriesActive ? "text-sb-text" : "text-sb-mute hover:text-sb-text"
            }`}
          >
            문의하기
          </Link>
          {isAdmin && <NavDropdown dark label="관리자" items={adminLinks} />}
        </nav>

        <div className="hidden min-w-[230px] items-center justify-end gap-4 md:flex">
          <UserMenu userName={userName} dark quotaPercent={quotaPercent} />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴 열기"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center text-sb-text md:hidden"
        >
          {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-sb-border bg-sb-bg px-5 pb-5 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            <p className="pt-2 font-body-kr text-xs font-bold uppercase tracking-wide text-sb-mute">
              학습
            </p>
            {studyLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-body-kr py-2 text-[15px] font-medium text-sb-text/85"
              >
                {link.label}
              </Link>
            ))}
            <p className="pt-2 font-body-kr text-xs font-bold uppercase tracking-wide text-sb-mute">
              정보
            </p>
            {infoLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-body-kr py-2 text-[15px] font-medium text-sb-text/85"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/billing"
              onClick={() => setOpen(false)}
              className="font-body-kr py-2 text-[15px] font-medium text-sb-text/85"
            >
              요금제
            </Link>
            <Link
              href="/inquiries"
              onClick={() => setOpen(false)}
              className="font-body-kr py-2 text-[15px] font-medium text-sb-text/85"
            >
              문의하기
            </Link>
            {isAdmin && (
              <>
                <p className="pt-2 font-body-kr text-xs font-bold uppercase tracking-wide text-sb-mute">
                  관리자
                </p>
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-body-kr py-2 text-[15px] font-medium text-sb-text/85"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
          <div className="mt-3">
            <UserMenu userName={userName} dark quotaPercent={quotaPercent} />
          </div>
        </div>
      )}
    </header>
  );
}

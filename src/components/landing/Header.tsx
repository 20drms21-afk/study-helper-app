"use client";

import Link from "next/link";
import { useState } from "react";
import { List, X } from "@phosphor-icons/react/dist/ssr";
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

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sb-border bg-sb-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-sb-text">
          <Logo size={26} />
          <span className="font-display text-xl leading-none">공부한입</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <NavDropdown dark label="학습" items={studyLinks} />
          <NavDropdown dark label="정보" items={infoLinks} />
          <Link href="/billing" className="text-sm font-medium text-sb-mute hover:text-sb-text">
            요금제
          </Link>
          <Link
            href="/inquiries"
            className="text-sm font-medium text-sb-mute hover:text-sb-text"
          >
            문의하기
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="font-body-kr text-[15px] font-medium text-sb-mute transition-colors hover:text-sb-text"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-sb-accent px-5 py-2.5 font-body-kr text-[15px] font-bold text-sb-accent-ink transition-transform hover:-translate-y-0.5"
          >
            무료로 시작하기
          </Link>
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
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/login"
              className="rounded-full border border-sb-border py-2.5 text-center font-body-kr text-[15px] font-medium text-sb-text"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-sb-accent py-2.5 text-center font-body-kr text-[15px] font-bold text-sb-accent-ink"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

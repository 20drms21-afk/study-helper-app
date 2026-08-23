"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  const billingActive = pathname === "/billing" || pathname.startsWith("/billing/");
  const inquiriesActive =
    pathname === "/inquiries" || pathname.startsWith("/inquiries/");

  return (
    <header className="sticky top-0 z-40 border-b border-sb-border bg-sb-bg-soft/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-sb-text">
            <Logo size={24} className="text-sb-accent" />
            공부한입
          </Link>
          <nav className="flex items-center gap-5">
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
        </div>
        <UserMenu userName={userName} dark quotaPercent={quotaPercent} />
      </div>
    </header>
  );
}

import Link from "next/link";
import { Logo } from "@/components/Logo";

const columns = [
  {
    title: "제품",
    links: [
      { href: "/notes", label: "노트/요약" },
      { href: "/exams", label: "예상문제출력" },
      { href: "/tutor", label: "AI선생님" },
      { href: "/translate", label: "PDF 번역" },
      { href: "/billing", label: "요금제" },
    ],
  },
  {
    title: "지원",
    links: [{ href: "/inquiries", label: "문의하기" }],
  },
  {
    title: "계정",
    links: [
      { href: "/login", label: "로그인" },
      { href: "/signup", label: "회원가입" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-sb-border bg-sb-bg-soft px-5 py-14">
      <div className="mx-auto grid w-full max-w-6xl gap-10 sm:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-sb-text">
            <Logo size={22} />
            <span className="font-display text-lg">공부한입</span>
          </div>
          <p className="mt-3 max-w-xs font-body-kr text-sm leading-relaxed text-sb-mute">
            대학생을 위한 AI 학습 도우미. 강의자료를 한 입 크기로 정리해드려요.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="font-body-kr text-sm font-bold text-sb-text">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body-kr text-sm text-sb-mute transition-colors hover:text-sb-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 w-full max-w-6xl border-t border-sb-border pt-6">
        <p className="font-body-kr text-xs text-sb-mute/70">© 2026 공부한입</p>
      </div>
    </footer>
  );
}

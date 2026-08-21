import Link from "next/link";
import { Logo } from "@/components/Logo";

export function LandingFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4 border-t border-white/10 px-[clamp(20px,5vw,64px)] py-8">
      <div className="flex items-center gap-2.5">
        <Logo size={22} className="text-sb-text" />
        <span className="font-body-kr text-[13px] text-sb-mute">
          공부한입 (StudyBite) · Powered by Claude(Anthropic) · © 2026
        </span>
      </div>
      <div className="flex flex-wrap gap-5">
        <Link
          href="/terms"
          className="font-body-kr text-[13px] text-sb-mute hover:text-sb-text"
        >
          이용약관
        </Link>
        <Link
          href="/privacy"
          className="font-body-kr text-[13px] text-sb-mute hover:text-sb-text"
        >
          개인정보처리방침
        </Link>
        <Link
          href="/inquiries"
          className="font-body-kr text-[13px] text-sb-mute hover:text-sb-text"
        >
          문의하기
        </Link>
      </div>
    </footer>
  );
}

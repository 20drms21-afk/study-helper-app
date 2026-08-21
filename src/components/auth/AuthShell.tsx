import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AmbientBackground } from "@/components/landing/AmbientBackground";

// 로그인/회원가입/비밀번호 관련 페이지가 전부 공유하는 바깥 껍데기. 랜딩페이지와 같은
// 다크 팔레트 + 배경 블러(AmbientBackground)를 그대로 써서, 랜딩 → 로그인/가입으로
// 넘어갈 때 디자인이 갑자기 라이트 테마로 뚝 끊기지 않게 한다. 카드 자체는 목업의
// 회원가입 모달(rgba(13,14,9,0.95) + blur + rounded-24px) 스타일을 그대로 페이지에 옮김.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen bg-sb-bg font-body-kr"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 35%, rgba(194,255,61,0.08), transparent 40%)",
      }}
    >
      <AmbientBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-16">
        <Link href="/" className="mb-8 flex items-center gap-2 text-sb-text">
          <Logo size={28} className="text-sb-accent" />
          <span className="font-display text-lg font-extrabold leading-none">공부한입</span>
        </Link>
        <div className="w-full max-w-[420px] rounded-3xl border border-sb-accent/10 bg-[rgba(13,14,9,0.95)] p-9 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}

export const authInputClass =
  "w-full rounded-xl border border-sb-accent/10 bg-sb-bg px-3.5 py-3 font-body-kr text-sm text-sb-text outline-none placeholder:text-sb-mute/60 focus:border-sb-accent/40";

export const authLabelClass = "mb-1 block font-body-kr text-sm font-medium text-sb-text";

export const authPrimaryButtonClass =
  "w-full rounded-full bg-sb-accent py-3 font-body-kr text-sm font-bold text-sb-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0";

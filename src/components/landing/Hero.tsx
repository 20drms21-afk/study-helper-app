import Link from "next/link";
import { HeroOrb } from "@/components/landing/HeroOrb";

export function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section
      id="hero-section"
      className="relative mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-[900px] flex-col items-center justify-center px-[clamp(20px,5vw,64px)] py-[clamp(20px,5vw,64px)] text-center"
    >
      {/* 장식용 히어로 비주얼 — 클릭/조작 불가, 텍스트 우선순위를 넘지 않도록 은은하게 */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(70vw,820px)] w-[min(70vw,820px)] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <HeroOrb />
      </div>

      <div className="relative z-10">
        <span className="inline-block rounded-full border border-sb-accent/40 px-3.5 py-1.5 font-body-kr text-xs font-semibold text-sb-accent-deep">
          공부를 바꾸는 AI
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.15] tracking-tight text-sb-text sm:text-6xl">
          <span className="block">강의자료를</span>
          <span className="block text-sb-accent-deep">한입 크기로</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[50ch] font-body-kr text-[17px] leading-relaxed text-sb-mute">
          자료 정리부터 개념 이해, 문제 풀이, 시험 대비까지. <br />
          공부의 모든 과정을 한곳에서 해결하세요.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <Link
            href={loggedIn ? "/notes" : "/signup"}
            className="rounded-full bg-sb-accent px-7 py-3.5 font-body-kr text-[15px] font-bold text-sb-accent-ink transition-transform hover:-translate-y-0.5"
          >
            {loggedIn ? "내 학습 이어가기" : "무료로 시작하기"}
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center rounded-full bg-sb-bg-soft px-3 py-1.5 font-body-kr text-xs text-sb-text">
            Powered by Claude
          </span>
          <span className="font-body-kr text-[13px] text-sb-mute">
            Anthropic Claude 기반 AI 엔진으로 동작해요
          </span>
        </div>
      </div>
    </section>
  );
}

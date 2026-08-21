import Link from "next/link";
import { Reveal } from "@/components/landing/Reveal";

export function CtaBanner({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="mx-auto w-full max-w-[1200px] border-t border-white/10 px-[clamp(20px,5vw,64px)] pb-12 pt-[60px]">
      <Reveal>
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-sb-accent-deep sm:text-3xl">
          09 · 지금 시작하기
        </p>
        <h3 className="mt-2 font-display text-xl font-extrabold text-sb-text">
          강의 자료만 올리세요.
        </h3>
        <p className="mt-3 max-w-[60ch] font-body-kr text-[15px] leading-relaxed text-sb-mute">
          요약, 개념 설명, 예상문제, 복습까지 공부한입이 이어서 준비해드려요.
        </p>
        <div className="mt-6 flex max-w-[480px] flex-wrap items-stretch gap-3">
          <Link
            href={loggedIn ? "/notes" : "/signup"}
            className="flex h-12 items-center rounded-full bg-sb-accent px-6.5 font-body-kr text-sm font-bold text-sb-accent-ink transition-transform hover:-translate-y-0.5"
          >
            {loggedIn ? "내 학습 이어가기" : "내 강의자료로 시작하기"}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

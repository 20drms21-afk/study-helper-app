import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/landing/Reveal";

export function CtaBanner() {
  return (
    <section className="bg-sb-bg px-5 py-16 sm:py-20">
      <Reveal>
        <div className="bite-corner glass mx-auto flex w-full max-w-6xl flex-col items-center gap-6 rounded-2xl px-8 py-16 text-center sm:py-20">
          <Logo size={40} className="text-sb-text" />
          <h2 className="max-w-lg font-display text-3xl text-sb-text sm:text-4xl">
            지금, 한 입 베어물어보세요.
          </h2>
          <p className="font-body-kr text-sb-mute">가입은 금방 끝나요.</p>
          <Link
            href="/signup"
            className="mt-2 rounded-full bg-sb-accent px-8 py-3.5 font-body-kr text-base font-bold text-sb-accent-ink transition-transform hover:-translate-y-0.5"
          >
            무료로 시작하기
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

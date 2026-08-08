import Link from "next/link";
import { Reveal } from "@/components/landing/Reveal";

export function Hero() {
  return (
    <section className="relative flex min-h-[560px] w-full items-center justify-center overflow-hidden bg-sb-bg px-5 py-20 sm:min-h-[680px]">
      {/* 장식용 히어로 비주얼 — 클릭/조작 불가, 텍스트 우선순위를 넘지 않도록 은은하게 */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/hero-blob.webp"
          alt=""
          className="hero-orb w-[380px] max-w-none select-none opacity-80 sm:w-[520px] lg:w-[620px]"
        />
      </div>

      <Reveal className="relative z-10">
        <div className="hero-card mx-auto max-w-lg rounded-3xl px-8 py-10 text-center sm:px-12">
          <h1
            className="font-display text-4xl leading-[1.15] text-sb-text sm:text-6xl"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)" }}
          >
            공부를, 한 입 크기로.
          </h1>
          <Link
            href="/signup"
            className="mt-7 inline-block rounded-full bg-sb-accent px-7 py-3.5 font-body-kr text-base font-bold text-sb-accent-ink transition-transform hover:-translate-y-0.5"
          >
            무료로 시작하기
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

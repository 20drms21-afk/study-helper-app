"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/landing/Reveal";

function OriginalPanel() {
  return (
    <div className="flex flex-col items-center gap-3 bg-sb-bg-soft p-6">
      <p className="w-full max-w-[520px] font-body-kr text-sm font-bold uppercase tracking-wide text-sb-accent-deep">
        원문 · English
      </p>
      <div className="relative aspect-video w-full max-w-[520px] overflow-hidden rounded-lg bg-sb-bg">
        <Image
          src="/landing/demo-translate-original.png"
          alt="원문 이미지"
          fill
          sizes="(min-width: 1024px) 520px, 100vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}

function TranslatedPanel({ wide = false }: { wide?: boolean }) {
  // 듀얼뷰에서는 원문과 나란히 놓여서 520px로 제한하지만, "번역본만 보기"는 이 이미지 하나에
  // 집중하는 화면이라 카드 전체 폭을 그대로 씀 — 520px 그대로 두면 오히려 이 모드를 고른
  // 의미가 없어짐.
  const maxW = wide ? "max-w-none" : "max-w-[520px]";
  return (
    <div className="flex w-full flex-col items-center gap-3 bg-sb-bg-soft p-6">
      <p
        className={`w-full ${maxW} font-body-kr text-sm font-bold uppercase tracking-wide text-sb-accent-deep`}
      >
        번역본 · 한국어
      </p>
      <div className={`relative aspect-video w-full ${maxW} overflow-hidden rounded-lg bg-sb-bg`}>
        <Image
          src="/landing/demo-translate-translated.png"
          alt="번역본 이미지"
          fill
          sizes={wide ? "(min-width: 1024px) 1100px, 100vw" : "(min-width: 1024px) 520px, 100vw"}
          className="object-contain"
        />
      </div>
    </div>
  );
}

export function PdfTranslateSection() {
  const [view, setView] = useState<"dual" | "translated">("dual");

  return (
    <section
      id="pdf-translate"
      className="mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,64px)] py-[60px]"
    >
      <Reveal>
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-sb-accent-deep sm:text-3xl">
          04 · 영어자료도 한글로
        </p>
        <div className="mt-2 h-px bg-sb-border" />
        <p className="mt-3 font-body-kr text-sb-mute">
          원문과 번역본을 함께 보는 듀얼뷰, 번역본에만 집중하는 번역본 보기를 자유롭게 전환할
          수 있습니다. 완성된 번역본은 파일로 다운로드할 수도 있어요.
        </p>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-7 overflow-hidden rounded-3xl bg-sb-bg-soft shadow-[0_12px_28px_rgba(0,0,0,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-0">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView("dual")}
                className={`rounded-full px-4.5 py-2.5 font-body-kr text-[13px] font-semibold transition-colors ${
                  view === "dual"
                    ? "bg-sb-accent text-sb-accent-ink"
                    : "border border-sb-border bg-sb-bg text-sb-mute hover:text-sb-text"
                }`}
              >
                듀얼뷰
              </button>
              <button
                type="button"
                onClick={() => setView("translated")}
                className={`rounded-full px-4.5 py-2.5 font-body-kr text-[13px] font-semibold transition-colors ${
                  view === "translated"
                    ? "bg-sb-accent text-sb-accent-ink"
                    : "border border-sb-border bg-sb-bg text-sb-mute hover:text-sb-text"
                }`}
              >
                번역본만 보기
              </button>
            </div>
            <Link
              href="/translate"
              className="flex items-center gap-2 rounded-full bg-sb-accent px-5 py-2.5 font-body-kr text-[13px] font-bold text-sb-accent-ink"
            >
              <ArrowDown size={14} weight="bold" />내 자료 번역하기
            </Link>
          </div>

          {view === "dual" ? (
            <div className="mt-5 flex flex-col gap-px bg-sb-border">
              <OriginalPanel />
              <TranslatedPanel />
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center bg-sb-bg-soft p-6">
              <TranslatedPanel wide />
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

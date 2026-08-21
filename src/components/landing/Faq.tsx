"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/landing/Reveal";

const faqs = [
  {
    q: "회원가입 없이도 사용할 수 있나요?",
    a: "공부한입의 기능은 회원가입 후 이용할 수 있어요. 가입하면 무료 플랜부터 바로 시작할 수 있습니다.",
  },
  {
    q: "무료로 얼마나 사용할 수 있나요?",
    a: "무료 플랜에서도 주요 기능을 이용할 수 있어요. 기능별 사용량에는 제한이 있으며, 더 많은 사용량이 필요하다면 상위 플랜으로 업그레이드할 수 있습니다.",
  },
  {
    q: "업로드한 자료는 다른 사람이 볼 수 있나요?",
    a: "업로드한 자료는 계정별로 관리되며 다른 사용자에게 공개되지 않아요.",
  },
  {
    q: "AI가 잘못된 내용을 만들어낼 수도 있나요?",
    a: "AI가 생성한 내용은 부정확할 수 있어요. 중요한 내용은 업로드한 원본 자료와 함께 확인하는 것을 권장합니다.",
  },
  {
    q: "구독은 언제든지 해지할 수 있나요?",
    a: "구독은 언제든지 해지할 수 있으며, 이용 중인 결제 기간까지 서비스를 계속 사용할 수 있어요.",
  },
  {
    q: "회원 탈퇴하면 업로드한 자료도 삭제되나요?",
    a: "회원 탈퇴 시 계정과 함께 업로드한 학습자료도 삭제됩니다.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-sb-border py-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="font-body-kr text-base font-bold text-sb-text">{q}</span>
        <CaretDown
          size={18}
          weight="bold"
          className={`shrink-0 text-sb-mute transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="mt-3 font-body-kr text-sm leading-relaxed text-sb-mute">{a}</p>
      )}
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="py-[60px]">
      <div className="mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,64px)]">
        <Reveal>
          <p className="font-display text-2xl font-bold uppercase tracking-wide text-sb-accent-deep sm:text-3xl">
            08 · 자주 묻는 질문
          </p>
          <div className="mt-2 h-px bg-sb-border" />
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-8">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} {...faq} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

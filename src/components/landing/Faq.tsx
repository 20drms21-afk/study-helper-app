"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/landing/Reveal";

const faqs = [
  {
    q: "무료로 얼마나 쓸 수 있나요?",
    a: "매달 정해진 횟수까지 요약노트, 예상문제, AI선생님, PDF 번역을 무료로 이용할 수 있어요. 다 쓰면 요금제로 넘어가서 계속 쓸 수 있어요.",
  },
  {
    q: "어떤 파일을 올릴 수 있나요?",
    a: "PDF, 슬라이드, 문서 파일 등 강의자료 형태면 대부분 올릴 수 있어요. 스캔본 PDF도 그대로 인식해요.",
  },
  {
    q: "제 자료는 안전하게 보관되나요?",
    a: "업로드한 파일은 본인 계정에서만 볼 수 있고, 삭제하면 서버에서도 함께 지워져요.",
  },
  {
    q: "PDF 번역이랑 노트/요약은 같은 기능인가요?",
    a: "아니요, 별도 기능이에요. PDF 번역은 원본 레이아웃을 유지한 채 번역만 얹는 기능이라, 노트·시험·AI선생님과는 자료 목록이 따로 관리돼요.",
  },
  {
    q: "유료 전환은 어떻게 하나요?",
    a: "요금제 페이지에서 카드를 등록하면 그때부터 매달 자동으로 결제돼요. 해지는 언제든 할 수 있어요.",
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
        <p className="mt-3 max-w-2xl font-body-kr text-sm leading-relaxed text-sb-mute">
          {a}
        </p>
      )}
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="bg-sb-bg-soft py-20 sm:py-28">
      <div className="mx-auto w-full max-w-2xl px-5">
        <Reveal>
          <h2 className="font-display text-3xl text-sb-text sm:text-4xl">자주 묻는 질문</h2>
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

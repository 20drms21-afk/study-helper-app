"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, FilePdf, Question } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/landing/Reveal";

type Tab = "summary" | "lecture" | "exam" | "tutor";

const tabs: { key: Tab; label: string }[] = [
  { key: "summary", label: "AI요약" },
  { key: "lecture", label: "AI설명" },
  { key: "exam", label: "예상시험문제" },
  { key: "tutor", label: "AI선생님" },
];

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4.5 py-2.5 font-body-kr text-[13px] font-semibold transition-colors ${
        active
          ? "bg-sb-accent text-sb-accent-ink"
          : "border border-sb-border bg-sb-bg-soft text-sb-mute hover:text-sb-text"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryPreview() {
  return (
    <div>
      <div className="mb-1 font-body-kr text-[15px] font-bold uppercase tracking-wide text-sb-accent-deep">
        2단 레이아웃 요약
      </div>
      <p className="mb-4 font-body-kr text-[13.5px] leading-relaxed text-sb-mute">
        한눈에 더 많은 내용을 확인하고 빠르게 복습할 수 있어요.
      </p>
      <div className="max-h-[600px] overflow-y-auto rounded-lg">
        <Image
          src="/landing/demo-summary.png"
          alt="AI 요약 결과"
          width={1819}
          height={2573}
          sizes="(min-width: 1024px) 640px, 100vw"
          className="block w-full rounded-lg"
        />
      </div>
    </div>
  );
}

function LecturePreview() {
  return (
    <div>
      <div className="mb-1 font-body-kr text-[15px] font-bold uppercase tracking-wide text-sb-accent-deep">
        강의식 설명
      </div>
      <p className="mb-4 font-body-kr text-[13.5px] leading-relaxed text-sb-mute">
        요약이 아닌, 이해를 위한 설명. 원문을 교수님의 강의처럼 자연스러운 대본형 설명으로
        바꿔드려요.
      </p>
      <div className="flex max-h-[600px] flex-col gap-4 overflow-y-auto">
        <Image
          src="/landing/demo-lecture-1.png"
          alt="강의식 설명 결과 1페이지"
          width={1241}
          height={1754}
          sizes="(min-width: 1024px) 640px, 100vw"
          className="block w-full rounded-lg"
        />
        <Image
          src="/landing/demo-lecture-2.png"
          alt="강의식 설명 결과 2페이지"
          width={1241}
          height={1754}
          sizes="(min-width: 1024px) 640px, 100vw"
          className="block w-full rounded-lg"
        />
      </div>
    </div>
  );
}

function ExamPreview() {
  return (
    <div className="rounded-xl bg-sb-bg-soft p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sb-text">
          <Question size={16} weight="bold" className="text-sb-accent-deep" />
          <span className="font-body-kr text-sm font-bold">예상 시험문제 · 2주차</span>
        </div>
        <span className="rounded-full bg-sb-accent/20 px-3 py-1 font-body-kr text-xs font-bold text-sb-accent-deep">
          기출 반영 7/10
        </span>
      </div>
      <p className="font-body-kr text-[13.5px] font-semibold text-sb-text">
        Q1. (객관식) 엔트로피가 상태함수인 근거로 가장 적절한 것은?
      </p>
      <div className="mt-1.5 space-y-1 font-body-kr text-[13px] text-sb-mute">
        <p>① 항상 증가하기 때문 ② 경로와 무관하게 결정되기 때문</p>
        <p className="flex items-center gap-1.5 text-sb-accent-deep">
          <CheckCircle size={14} weight="fill" /> 정답 · ②
        </p>
      </div>
      <p className="mt-3 border-t border-sb-border pt-3 font-body-kr text-[13.5px] font-semibold text-sb-text">
        Q2. (서술형) 고립계에서 제2법칙의 부등식을 쓰고, 등호 조건을 설명하시오.
      </p>
    </div>
  );
}

function TutorPreview() {
  return (
    <div className="rounded-xl bg-sb-bg-soft p-5">
      <div className="mb-4 flex items-center gap-2 text-sb-text">
        <FilePdf size={16} weight="bold" className="text-sb-accent-deep" />
        <span className="font-body-kr text-sm font-bold">AI선생님과의 대화</span>
      </div>
      <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-white/10 px-4 py-2.5 font-body-kr text-[13.5px] text-sb-text">
        왜 실제 과정은 비가역적인데도 엔트로피 변화를 구할 수 있어요?
      </div>
      <div className="mr-auto mt-3 w-fit max-w-[90%] rounded-2xl rounded-tl-sm border border-sb-accent/25 bg-sb-accent/10 px-4 py-3 font-body-kr text-[13.5px] leading-relaxed text-sb-text">
        좋은 질문이에요! 엔트로피는 상태함수라서, 실제 경로가 비가역적이어도 같은 시작점과
        끝점을 잇는 가상의 가역 경로를 그려서 그 길을 따라 적분하면 돼요. 값 자체는 경로에
        의존하지 않거든요.
      </div>
    </div>
  );
}

export function Features() {
  const [tab, setTab] = useState<Tab>("summary");

  return (
    <section
      id="features"
      className="mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,64px)] py-[60px]"
    >
      <Reveal>
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-sb-accent-deep sm:text-3xl">
          01 · 핵심 기능
        </p>
        <div className="mt-2 h-px bg-sb-border" />
        <p className="mt-3 font-body-kr text-sb-mute">
          원본 자료가 기능에 따라 어떻게 바뀌는지 오른쪽 탭을 눌러 직접 확인해보세요.
        </p>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-7 grid gap-px overflow-hidden rounded-3xl bg-sb-border shadow-[0_12px_28px_rgba(0,0,0,0.25)] lg:grid-cols-[minmax(280px,1fr)_minmax(320px,1.2fr)]">
          <div className="flex flex-col gap-3 bg-sb-bg-soft p-6">
            <p className="font-body-kr text-sm font-bold uppercase tracking-wide text-sb-accent-deep">
              원본 자료 · thermodynamics_lecture04.pdf
            </p>
            <p className="font-body-kr text-[13.5px] leading-relaxed text-sb-mute">
              강의자료, 필기, 교재를 PDF, DOCX, PPTX, 이미지 형식으로 자유롭게 업로드해보세요.
            </p>
            <Image
              src="/landing/demo-source.png"
              alt="원본 PDF 문서"
              width={1489}
              height={2105}
              sizes="(min-width: 1024px) 400px, 100vw"
              className="block w-full rounded-lg"
            />
          </div>

          <div className="bg-sb-bg-soft p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <TabButton
                  key={t.key}
                  label={t.label}
                  active={tab === t.key}
                  onClick={() => setTab(t.key)}
                />
              ))}
            </div>
            <div className="mt-6">
              {tab === "summary" && <SummaryPreview />}
              {tab === "lecture" && <LecturePreview />}
              {tab === "exam" && <ExamPreview />}
              {tab === "tutor" && <TutorPreview />}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ChatCircleDots,
  PaperPlaneTilt,
  Question,
} from "@phosphor-icons/react/dist/ssr";
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

const EXAM_OPTIONS: { label: string; value: string; accent?: boolean }[] = [
  { label: "객관식", value: "5문항" },
  { label: "단답형", value: "3문항" },
  { label: "서술형", value: "2문항" },
  { label: "시험시간", value: "50분" },
  { label: "기출 반영 강도", value: "7/10", accent: true },
  { label: "난이도", value: "7/10", accent: true },
];

// 채점 결과가 아니라 "출제 옵션 → 생성된 시험지"로 이어지는 흐름을 보여주는 게 목적이라
// 응시 전 시험지를 그대로 재현한다 — 정답 표시는 의도적으로 넣지 않는다(실제 응시 화면도
// GET /api/exams/[id]에서 정답을 내려주지 않는 것과 같은 이유).
function ExamPreview() {
  return (
    <div>
      <div className="rounded-xl bg-sb-bg-soft p-5">
        <p className="mb-3 font-body-kr text-sm font-bold text-sb-text">
          예상 시험문제 생성 옵션
        </p>
        <div className="grid grid-cols-3 gap-2">
          {EXAM_OPTIONS.map((opt) => (
            <div
              key={opt.label}
              className="rounded-lg border border-sb-border bg-sb-bg px-2.5 py-2"
            >
              <p className="font-body-kr text-[10.5px] text-sb-mute">{opt.label}</p>
              <p
                className={`font-body-kr text-[13px] font-bold ${
                  opt.accent ? "text-sb-accent-deep" : "text-sb-text"
                }`}
              >
                {opt.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded-lg border border-sb-border bg-sb-bg px-3 py-2.5">
          <p className="font-body-kr text-[10.5px] font-semibold text-sb-mute">
            교수님 출제성향 / 특이사항
          </p>
          <p className="mt-1 font-body-kr text-[12.5px] leading-relaxed text-sb-text">
            개념 정의보다 근거와 도출 과정을 함께 묻는 서술형을 선호함
          </p>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-sb-border bg-sb-bg px-3 py-2.5">
            <p className="font-body-kr text-[10.5px] text-sb-mute">참고자료 파일</p>
            <p className="mt-0.5 truncate font-body-kr text-[12px] font-semibold text-sb-text">
              thermodynamics_lecture04.pdf
            </p>
          </div>
          <div className="rounded-lg border border-sb-border bg-sb-bg px-3 py-2.5">
            <p className="font-body-kr text-[10.5px] text-sb-mute">기출문제(족보)</p>
            <p className="mt-0.5 truncate font-body-kr text-[12px] font-semibold text-sb-text">
              2023-2학기_기출.pdf
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-1.5">
        <ArrowDown size={18} weight="bold" className="text-sb-accent/50" />
      </div>

      <div className="rounded-xl bg-sb-bg-soft p-5">
        <div className="mb-3 flex items-center gap-2">
          <Question size={16} weight="bold" className="text-sb-accent-deep" />
          <span className="font-body-kr text-sm font-bold text-sb-accent-deep">
            생성된 예상 시험지
          </span>
        </div>

        <p className="font-body-kr text-[13.5px] font-semibold text-sb-text">
          Q1. (객관식) 엔트로피가 상태함수인 근거로 가장 적절한 것은?
        </p>
        <div className="mt-1.5 space-y-1 font-body-kr text-[13px] text-sb-mute">
          <p>① 항상 증가하기 때문 ② 경로와 무관하게 상태로 결정되기 때문</p>
          <p>③ 온도에 비례하기 때문 ④ 열량과 같기 때문</p>
        </div>

        <p className="mt-3 border-t border-sb-border pt-3 font-body-kr text-[13.5px] font-semibold text-sb-text">
          Q2. (서술형) 고립계에서 제2법칙의 부등식을 쓰고, 등호가 성립하는 조건을 설명하시오.
        </p>

        <p className="mt-3 border-t border-sb-border pt-3 font-body-kr text-[13.5px] font-semibold text-sb-text">
          Q3. (단답형) 비가역 과정에서 엔트로피가 생성되는 원인을 3가지 이상 쓰시오.
        </p>
      </div>
    </div>
  );
}

const TUTOR_QUESTION = "왜 실제 과정은 비가역적인데도 엔트로피 변화를 구할 수 있어요?";
const TUTOR_ANSWER =
  "좋은 질문이에요! 엔트로피는 상태함수라서, 실제 경로가 비가역적이어도 같은 시작점과 " +
  "끝점을 잇는 가상의 가역 경로를 하나 그려서 그 길을 따라 적분하면 돼요. 값 자체는 " +
  "경로에 의존하지 않거든요.";

// 0 idle(입력창 placeholder) → 1 질문이 한 글자씩 타이핑 → 2 사용자 말풍선 등장 →
// 3 AI 쪽 "타이핑 중" 점 3개 인디케이터 → 4 답변 말풍선으로 교체 → 3초 뒤 0으로
// 리셋, 900ms 뒤 다시 1부터. 각 단계를 자기 완결적인 useEffect로 나눠서 타이머
// 정리(clearTimeout)가 단계 전환/언마운트 시 확실히 되도록 함.
type TutorStep = 0 | 1 | 2 | 3 | 4;

function TutorPreview() {
  const [motionOk] = useState(
    () =>
      typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [step, setStep] = useState<TutorStep>(motionOk ? 0 : 4);
  const [typedLength, setTypedLength] = useState(
    motionOk ? 0 : TUTOR_QUESTION.length
  );
  // 전송 버튼의 "눌림" 스케일 효과는 별도 상태 없이 step===2 구간(질문 타이핑이 끝나고
  // 말풍선으로 넘어가는 전환 순간)에서 파생시킨다 — 이펙트 안에서 setState를 동기 호출하는
  // 걸 피하기 위함.
  const sendPressed = step === 2;

  useEffect(() => {
    if (!motionOk || step !== 0) return;
    const t = setTimeout(() => setStep(1), 900);
    return () => clearTimeout(t);
  }, [motionOk, step]);

  useEffect(() => {
    if (!motionOk || step !== 1) return;
    if (typedLength >= TUTOR_QUESTION.length) {
      const t = setTimeout(() => setStep(2), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedLength((n) => n + 1), 45);
    return () => clearTimeout(t);
  }, [motionOk, step, typedLength]);

  useEffect(() => {
    if (!motionOk || step !== 2) return;
    const t = setTimeout(() => setStep(3), 400);
    return () => clearTimeout(t);
  }, [motionOk, step]);

  useEffect(() => {
    if (!motionOk || step !== 3) return;
    const t = setTimeout(() => setStep(4), 1400);
    return () => clearTimeout(t);
  }, [motionOk, step]);

  useEffect(() => {
    if (!motionOk || step !== 4) return;
    const t = setTimeout(() => {
      setStep(0);
      setTypedLength(0);
    }, 3000);
    return () => clearTimeout(t);
  }, [motionOk, step]);

  const typedText = TUTOR_QUESTION.slice(0, typedLength);

  return (
    <div className="flex flex-1 flex-col rounded-xl bg-sb-bg-soft p-5">
      <div className="mb-4 flex items-center gap-2 text-sb-text">
        <ChatCircleDots size={16} weight="bold" className="text-sb-accent-deep" />
        <span className="font-body-kr text-sm font-bold">AI선생님</span>
      </div>

      {/* flex-1로 남는 세로 공간을 다 차지해서, 말풍선이 몇 개 떠 있든 입력창이 항상 카드
          맨 아래에 붙어 있게 한다(안 그러면 답변 말풍선이 나타날 때마다 입력창이 아래로
          밀려 위치가 흔들림). min-h는 부모가 늘어날 공간이 없는 좁은 화면(그리드가 1열로
          접히는 구간)에서도 대화 영역이 찌그러지지 않게 하는 하한선. */}
      <div className="flex min-h-[168px] flex-1 flex-col justify-end gap-3 overflow-hidden">
        {step >= 2 && (
          <div className="ml-auto w-fit max-w-[85%] animate-[bubbleIn_0.25s_ease_both] rounded-2xl rounded-tr-sm bg-white/10 px-4 py-2.5 font-body-kr text-[13.5px] text-sb-text">
            {TUTOR_QUESTION}
          </div>
        )}
        {step === 3 && (
          <div className="mr-auto flex w-fit animate-[bubbleIn_0.3s_ease_both] items-center gap-1.5 rounded-2xl rounded-tl-sm border border-sb-accent/25 bg-sb-accent/10 px-4 py-3.5">
            <span className="h-1.5 w-1.5 animate-[typingBounce_1.2s_ease-in-out_infinite] rounded-full bg-sb-accent-deep [animation-delay:0s]" />
            <span className="h-1.5 w-1.5 animate-[typingBounce_1.2s_ease-in-out_infinite] rounded-full bg-sb-accent-deep [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 animate-[typingBounce_1.2s_ease-in-out_infinite] rounded-full bg-sb-accent-deep [animation-delay:0.4s]" />
          </div>
        )}
        {step === 4 && (
          <div className="mr-auto w-fit max-w-[90%] animate-[bubbleIn_0.4s_ease_both] rounded-2xl rounded-tl-sm border border-sb-accent/25 bg-sb-accent/10 px-4 py-3 font-body-kr text-[13.5px] leading-relaxed text-sb-text">
            {TUTOR_ANSWER}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-sb-border bg-sb-bg px-4 py-2.5">
        <span className="flex-1 truncate font-body-kr text-[13px]">
          {step === 1 ? (
            <span className="text-sb-text">
              {typedText}
              <span className="ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px] animate-[caretBlink_1s_steps(1)_infinite] bg-sb-accent-deep" />
            </span>
          ) : (
            <span className="text-sb-mute">질문을 입력해보세요…</span>
          )}
        </span>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sb-accent text-sb-accent-ink transition-transform duration-150 ease-out"
          style={{ transform: sendPressed ? "scale(0.85)" : "scale(1)" }}
        >
          <PaperPlaneTilt size={13} weight="fill" />
        </span>
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

          <div className="flex flex-col bg-sb-bg-soft p-6 sm:p-8">
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
            {/* CSS 그리드 기본 align-items:stretch 때문에 이 오른쪽 패널은 왼쪽 원본 자료
                컬럼(이미지 때문에 훨씬 김)만큼 늘어나 있다 — flex-1로 그 남는 세로 공간을
                내려받아야 AI선생님 탭의 입력창이 "패널의 진짜 맨 아래"에 붙는다(예전엔 이
                래퍼가 그냥 block이라 TutorPreview가 자기 콘텐츠 높이만큼만 차지하고 패널
                하단에는 빈 공간만 남았음). */}
            <div className="mt-6 flex flex-1 flex-col">
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

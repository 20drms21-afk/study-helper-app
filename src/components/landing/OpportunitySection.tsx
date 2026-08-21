"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/landing/Reveal";

function useCycle(steps: number, active: boolean) {
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!active) {
      clearTimeout(timerRef.current);
      return;
    }
    let cancelled = false;
    const delays = [800, 900, 2200, 3800];
    const loop = (i: number) => {
      if (cancelled) return;
      setStep(i % (steps + 1));
      timerRef.current = setTimeout(() => loop(i + 1), delays[i % delays.length]);
    };
    loop(0);
    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [active, steps]);

  return step;
}

function OpportunityCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const step = useCycle(3, inView);
  const showResults = step >= 2;

  return (
    <div
      ref={ref}
      id="opportunity-card"
      className="scroll-mt-24 rounded-3xl border border-[rgba(181,231,64,0.14)] bg-sb-card p-7 shadow-[0_16px_34px_rgba(0,0,0,0.32)]"
    >
      <p className="font-body-kr text-base font-bold text-sb-text">대외활동 · 공모전</p>
      <p className="mt-1 font-body-kr text-[13.5px] leading-relaxed text-sb-mute">
        전공과 관심 분야에 맞는 활동을 찾아 한눈에 확인해요. 마음에 드는 활동은 자세히 확인하고,
        마감일도 바로 캘린더에 추가할 수 있어요.
      </p>
      <div className="mt-4.5 rounded-2xl bg-sb-bg p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-body-kr text-[11px] text-sb-mute">전공</span>
          <span className="rounded-full bg-sb-bg-soft px-3 py-1.5 font-body-kr text-[12.5px] text-sb-text">
            경영학과
          </span>
          <span className="ml-2 font-body-kr text-[11px] text-sb-mute">관심 분야</span>
          {["AI", "스타트업", "콘텐츠"].map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-3 py-1.5 font-body-kr text-[12.5px] transition-colors duration-300 ${
                step >= 1 ? "bg-sb-accent/18 text-sb-accent-deep" : "bg-sb-bg-soft text-sb-text"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="my-4 flex justify-center text-sb-mute">↓</div>
        <div className="min-h-[132px]">
          {showResults && (
            <div className="grid animate-[bubbleIn_0.4s_ease_both] gap-3.5 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-sb-bg-soft p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-body-kr text-[13.5px] font-bold text-sb-text">
                    2026 대학생 AI 아이디어 공모전
                  </span>
                  <span className="ml-2 shrink-0 font-body-kr text-[11px] font-bold text-[#ff8a8a]">
                    D-12
                  </span>
                </div>
                <p className="mb-3.5 font-body-kr text-[11.5px] text-sb-mute">
                  AI · 기획 · 대학생
                </p>
                <div className="flex gap-2">
                  <span className="rounded-full bg-sb-bg px-3 py-1.5 font-body-kr text-[11.5px] text-sb-text">
                    자세히 보기
                  </span>
                  <span
                    className={`rounded-full px-3 py-1.5 font-body-kr text-[11.5px] transition-colors duration-300 ${
                      step >= 3 ? "bg-sb-accent text-sb-accent-ink" : "bg-sb-bg text-sb-text"
                    }`}
                  >
                    캘린더에 추가
                  </span>
                </div>
                {step >= 3 && (
                  <p className="mt-2.5 animate-[bubbleIn_0.3s_ease_both] font-body-kr text-[11.5px] text-sb-accent-deep">
                    ✓ 8월 27일 · AI 아이디어 공모전 마감이 캘린더에 추가되었습니다
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-white/10 bg-sb-bg-soft p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-body-kr text-[13.5px] font-bold text-sb-text">
                    스타트업 서포터즈 8기
                  </span>
                  <span className="ml-2 shrink-0 font-body-kr text-[11px] font-bold text-sb-mute">
                    D-20
                  </span>
                </div>
                <p className="mb-3.5 font-body-kr text-[11.5px] text-sb-mute">스타트업 · 마케팅</p>
                <div className="flex gap-2">
                  <span className="rounded-full bg-sb-bg px-3 py-1.5 font-body-kr text-[11.5px] text-sb-text">
                    자세히 보기
                  </span>
                  <span className="rounded-full bg-sb-bg px-3 py-1.5 font-body-kr text-[11.5px] text-sb-text">
                    캘린더에 추가
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Link
        href="/activities"
        className="mt-4 inline-block font-body-kr text-sm font-bold text-sb-text underline decoration-sb-accent decoration-4 underline-offset-4"
      >
        내 대외활동 찾아보기
      </Link>
    </div>
  );
}

function ScholarshipCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const step = useCycle(3, inView);

  const fields = [
    { label: "거주 지역", value: "경기도" },
    { label: "학과", value: "경영학과" },
    { label: "학번", value: "24학번" },
    { label: "소득 분위", value: "5구간" },
    { label: "직전 학기 성적", value: "3.8 / 4.5" },
  ];

  return (
    <div
      ref={ref}
      id="scholarship-card"
      className="scroll-mt-24 rounded-3xl border border-[rgba(181,231,64,0.14)] bg-sb-card p-7 shadow-[0_16px_34px_rgba(0,0,0,0.32)]"
    >
      <p className="font-body-kr text-base font-bold text-sb-text">맞춤 장학금</p>
      <p className="mt-1 font-body-kr text-[13.5px] leading-relaxed text-sb-mute">
        내 조건을 바탕으로 신청 가능한 장학금을 확인해요.
      </p>
      <div className="mt-4.5 rounded-2xl bg-sb-bg p-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {fields.map((f) => (
            <div key={f.label} className="rounded-lg bg-sb-bg-soft px-3 py-2.5">
              <p className="mb-0.5 font-body-kr text-[10.5px] text-sb-mute">{f.label}</p>
              <p
                className="font-body-kr text-[13px] font-semibold text-sb-text transition-opacity duration-300"
                style={{ opacity: step >= 1 ? 1 : 0.15 }}
              >
                {f.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <span
            className={`inline-flex items-center rounded-full px-5 py-2.5 font-body-kr text-[13px] font-bold transition-colors duration-300 ${
              step >= 2 ? "bg-sb-accent text-sb-accent-ink" : "bg-sb-bg-soft text-sb-text"
            }`}
          >
            {step === 2 && (
              <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-[rgba(18,16,12,0.3)] border-t-[#12100c]" />
            )}
            내 장학금 찾기
          </span>
        </div>
        <div className="mt-4 min-h-[96px]">
          {step >= 3 && (
            <div className="grid animate-[bubbleIn_0.4s_ease_both] gap-3.5 sm:grid-cols-2">
              {[
                { name: "국가우수장학금", cond: "성적 조건 충족 · 소득 조건 충족" },
                { name: "지역인재 장학금", cond: "거주 지역 조건 충족 · 학과 조건 충족" },
              ].map((row) => (
                <div key={row.name} className="rounded-xl border border-white/10 bg-sb-bg-soft p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-body-kr text-[13.5px] font-bold text-sb-text">
                      {row.name}
                    </span>
                    <span className="ml-2 shrink-0 font-body-kr text-[11px] font-bold text-sb-accent-deep">
                      신청 가능
                    </span>
                  </div>
                  <p className="mb-3.5 font-body-kr text-[11.5px] text-sb-mute">{row.cond}</p>
                  <span className="rounded-full bg-sb-bg px-3 py-1.5 font-body-kr text-[11.5px] text-sb-text">
                    자세히 보기
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Link
        href="/scholarships"
        className="mt-4 inline-block font-body-kr text-sm font-bold text-sb-text underline decoration-sb-accent decoration-4 underline-offset-4"
      >
        내 장학금 찾아보기
      </Link>
    </div>
  );
}

export function OpportunitySection() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,64px)] py-[60px]">
      <Reveal>
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-sb-accent-deep sm:text-3xl">
          06 · 나에게 맞는 기회까지
        </p>
        <div className="mt-2 h-px bg-sb-border" />
        <p className="mt-3 font-body-kr text-sb-mute">
          내 정보와 관심사를 바탕으로 대외활동부터 장학금까지 찾아볼 수 있어요.
        </p>
      </Reveal>
      <div className="mt-7 flex flex-col gap-6">
        <Reveal delay={100}>
          <OpportunityCard />
        </Reveal>
        <Reveal delay={200}>
          <ScholarshipCard />
        </Reveal>
      </div>
    </section>
  );
}

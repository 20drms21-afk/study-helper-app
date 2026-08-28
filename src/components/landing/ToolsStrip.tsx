import Link from "next/link";
import { Reveal } from "@/components/landing/Reveal";

function Card({
  href,
  title,
  body,
  children,
}: {
  href: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-3xl border border-[rgba(181,231,64,0.14)] bg-sb-card p-6 shadow-[0_16px_34px_rgba(0,0,0,0.32)] transition-transform hover:-translate-y-0.5"
    >
      <div className="rounded-xl bg-sb-bg p-4">{children}</div>
      <p className="mt-4.5 font-body-kr text-base font-bold text-sb-text">{title}</p>
      <p className="mt-2 font-body-kr text-[13.5px] leading-relaxed text-sb-mute">{body}</p>
    </Link>
  );
}

function ReviewPreview() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { q: "Q5 · 객관식", concept: "상태함수 정의" },
        { q: "Q7 · 단답형", concept: "비가역 과정" },
      ].map((row) => (
        <div key={row.q} className="flex flex-col gap-1 rounded-lg bg-sb-bg-soft px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="font-body-kr text-[12.5px] font-semibold text-sb-text">{row.q}</span>
            <span className="rounded-full bg-[rgba(255,138,138,0.15)] px-2 py-0.75 font-body-kr text-[10.5px] text-[#ff8a8a]">
              오답
            </span>
          </div>
          <span className="font-body-kr text-[11px] text-sb-mute">관련 개념 · {row.concept}</span>
        </div>
      ))}
    </div>
  );
}

function LibraryPreview() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border border-sb-accent/25 bg-sb-accent/10 px-3 py-2">
        <span className="font-body-kr text-[12.5px] font-bold text-sb-text">📂 거시경제학</span>
        <span className="font-body-kr text-[10.5px] text-sb-mute">6개 자료</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-sb-bg-soft px-3 py-2">
        <span className="font-body-kr text-[12.5px] text-sb-text">📁 대중 문화의 이해</span>
        <span className="font-body-kr text-[10.5px] text-sb-mute">4개 자료</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-sb-bg-soft px-3 py-2">
        <span className="font-body-kr text-[12.5px] text-sb-text">📁 호텔경영학개론</span>
        <span className="font-body-kr text-[10.5px] text-sb-mute">9개 자료</span>
      </div>
    </div>
  );
}

function CalendarPreview() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border border-[rgba(255,138,138,0.25)] bg-[rgba(255,138,138,0.1)] px-3 py-2">
        <span className="font-body-kr text-[12.5px] text-sb-text">12일 · 열역학 중간고사</span>
        <span className="font-body-kr text-[10.5px] font-bold text-[#ff8a8a]">D-3</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-sb-bg-soft px-3 py-2">
        <span className="font-body-kr text-[12.5px] text-sb-text">17일 · 물리화학 시험</span>
        <span className="font-body-kr text-[10.5px] font-bold text-sb-mute">D-8</span>
      </div>
    </div>
  );
}

function TimerPreview() {
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-sb-accent/35 border-t-sb-accent font-body-kr text-sm font-bold">
        25:00
      </div>
      <span className="font-body-kr text-xs text-sb-mute">열역학 5주차 공부 중</span>
    </div>
  );
}

export function ToolsStrip() {
  return (
    <section id="study-tools" className="py-[60px]">
      <div className="mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,64px)]">
        <Reveal>
          <p className="font-display text-2xl font-bold uppercase tracking-wide text-sb-accent-deep sm:text-3xl">
            05 · 학습관리도 이곳에서
          </p>
          <div className="mt-2 h-px bg-sb-border" />
          <p className="mt-3 font-body-kr text-sb-mute">
            공부한 자료부터 오답, 일정, 공부 시간까지 이곳에서 관리할 수 있어요.
          </p>
        </Reveal>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Reveal delay={0}>
            <Card href="/review" title="오답노트" body="틀린 문제를 모아두고, 부족한 개념을 다시 복습">
              <ReviewPreview />
            </Card>
          </Reveal>
          <Reveal delay={100}>
            <Card
              href="/profile"
              title="자료보관함"
              body="공부했던 자료와 AI 학습 내용을 한곳에 정리"
            >
              <LibraryPreview />
            </Card>
          </Reveal>
          <Reveal delay={200}>
            <Card href="/calendar" title="캘린더" body="시험과 공부 일정을 한눈에 확인">
              <CalendarPreview />
            </Card>
          </Reveal>
          <Reveal delay={300}>
            <Card href="/timer" title="집중 타이머" body="집중 시간을 기록하고 공부 흐름을 유지">
              <TimerPreview />
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

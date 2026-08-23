import { Reveal } from "@/components/landing/Reveal";

function GradingCard() {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-[rgba(181,231,64,0.14)] bg-sb-card p-7 shadow-[0_16px_34px_rgba(0,0,0,0.32)]">
      <div className="flex flex-col gap-2.5 rounded-xl bg-sb-bg p-4">
        {[
          { label: "Q1 · 상태함수 정의", ok: true, page: "p.12" },
          { label: "Q2 · 제2법칙 부등식", ok: false, page: "p.18" },
          { label: "Q3 · 엔트로피 생성 원인", ok: false, page: "p.24" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-2.5 rounded-lg bg-sb-bg-soft px-3 py-2"
          >
            <span
              className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                row.ok
                  ? "bg-sb-accent/20 text-sb-accent-deep"
                  : "bg-[rgba(255,138,138,0.2)] text-[#ff8a8a]"
              }`}
            >
              {row.ok ? "✓" : "✕"}
            </span>
            <span className="flex-1 font-body-kr text-[12.5px] text-sb-text">{row.label}</span>
            <span className="font-body-kr text-[10.5px] text-sb-mute">{row.page}</span>
          </div>
        ))}
        <div className="my-0.5 h-px bg-white/10" />
        <div className="flex flex-col gap-1.5">
          {[
            { label: "상태함수 개념", pct: 85, ok: true },
            { label: "비가역 과정 개념", pct: 40, ok: false },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between font-body-kr text-[11px] text-sb-mute">
                <span>{row.label}</span>
                <span>{row.pct}%</span>
              </div>
              <div className="h-[5px] overflow-hidden rounded-full bg-sb-bg-soft">
                <div
                  className={`h-full ${row.ok ? "bg-sb-accent" : "bg-[#ff8a8a]"}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4.5 font-body-kr text-base font-bold text-sb-text">채점 및 학습 피드백</p>
      <p className="mt-2 font-body-kr text-[13.5px] leading-relaxed text-sb-mute">
        문제를 풀면, 내 정답률과 부족한 개념을 바로 확인할 수 있습니다.
        <br />
        각 문항이 어떤 개념인지, 어디서 틀렸는지, 무엇을 다시 공부해야 하는지까지 알려드립니다.
      </p>
    </div>
  );
}

function ReviewNoteCard() {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-[rgba(181,231,64,0.14)] bg-sb-card p-7 shadow-[0_16px_34px_rgba(0,0,0,0.32)]">
      <div className="flex flex-col gap-2.5 rounded-xl bg-sb-bg p-4">
        {[
          { q: "Q2 · 서술형", tag: "엔트로피 정의 부족" },
          { q: "Q5 · 객관식", tag: "상태함수 개념 부족" },
          { q: "Q7 · 단답형", tag: "비가역 과정 개념 부족" },
        ].map((row) => (
          <div
            key={row.q}
            className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg bg-sb-bg-soft px-3 py-2"
          >
            <span className="font-body-kr text-[12.5px] text-sb-text">{row.q}</span>
            <span className="rounded-full bg-[rgba(255,138,138,0.15)] px-2 py-0.75 font-body-kr text-[10.5px] text-[#ff8a8a]">
              오답
            </span>
            <span className="rounded-full bg-sb-accent/15 px-2 py-0.75 font-body-kr text-[10.5px] text-sb-accent-deep">
              {row.tag}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4.5 font-body-kr text-base font-bold text-sb-text">오답노트</p>
      <p className="mt-2 font-body-kr text-[13.5px] leading-relaxed text-sb-mute">
        예상문제에서 틀린 문제들을 모두 모아 보여줘요. 어떤 개념이 부족해서 틀렸는지도 함께
        짚어드려서, 오답노트만 봐도 무엇을 다시 공부해야 하는지 바로 알 수 있어요.
      </p>
    </div>
  );
}

export function WeaknessSection() {
  return (
    <section id="more-features" className="py-[60px]">
      <div className="mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,64px)]">
        <Reveal>
          <p className="font-display text-2xl font-bold uppercase tracking-wide text-sb-accent-deep sm:text-3xl">
            02 · AI로 완성하는 약점 보완
          </p>
          <div className="mt-2 h-px bg-sb-border" />
          <p className="mt-3 font-body-kr text-sb-mute">
            AI가 내 실력을 분석하고, 다시 공부할 부분을 알려줍니다.
          </p>
        </Reveal>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Reveal delay={100}>
            <GradingCard />
          </Reveal>
          <Reveal delay={200}>
            <ReviewNoteCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

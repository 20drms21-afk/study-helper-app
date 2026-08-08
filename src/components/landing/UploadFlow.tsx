import { ArrowRight, Lightning, SlidersHorizontal, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/landing/Reveal";

const steps = [
  {
    icon: UploadSimple,
    title: "자료를 올려요",
    body: "강의 PDF, 슬라이드, 필기까지 형식 상관없이",
  },
  {
    icon: SlidersHorizontal,
    title: "원하는 걸 골라요",
    body: "요약노트, 예상문제, AI선생님 중에서",
  },
  {
    icon: Lightning,
    title: "바로 써먹어요",
    body: "시험 전 마지막 점검까지 한 번에",
  },
];

export function UploadFlow() {
  return (
    <section className="border-y border-sb-border bg-sb-bg-soft py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <Reveal>
          <h2 className="max-w-lg font-display text-3xl text-sb-text sm:text-4xl">
            세 걸음이면 끝나요.
          </h2>
        </Reveal>

        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-1 items-start sm:items-stretch">
              <Reveal delay={i * 100} className="flex-1">
                <div className="flex items-center gap-5 sm:block">
                  <div className="glass flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sb-accent-deep">
                    <step.icon size={26} weight="bold" />
                  </div>
                  <div className="sm:mt-5">
                    <p className="font-body-kr text-lg font-bold text-sb-text">{step.title}</p>
                    <p className="mt-1 font-body-kr text-sm leading-relaxed text-sb-mute">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Reveal>

              {i < steps.length - 1 && (
                <div className="hidden shrink-0 items-center justify-center px-2 pt-5 text-sb-border sm:flex">
                  <ArrowRight size={20} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

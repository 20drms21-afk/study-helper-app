import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/landing/Reveal";

const steps = [
  {
    n: "01",
    title: "자료 업로드",
    body: "PDF · DOCX · PPTX · 이미지 등 공부할 자료를 그대로 업로드",
  },
  {
    n: "02",
    title: "AI로 학습 자료 생성",
    body: "AI 요약 · 강의식 설명 · 예상시험문제 · AI 선생님 중 필요한 방식으로 학습",
  },
  {
    n: "03",
    title: "문제 풀이 & AI 분석",
    body: "예상문제를 풀면 AI가 문항별 개념 · 강점/약점 · 보완할 개념을 분석",
  },
  {
    n: "04",
    title: "부족한 부분 복습",
    body: "틀린 문제는 오답노트로 모으고 부족한 개념을 다시 학습",
  },
];

export function UploadFlow() {
  return (
    <section id="how" className="py-[60px]">
      <div className="mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,64px)]">
        <Reveal>
          <p className="font-display text-2xl font-bold uppercase tracking-wide text-sb-accent-deep sm:text-3xl">
            03 · 공부하는 과정은 더 간단하게
          </p>
          <div className="mt-2 h-px bg-sb-border" />
        </Reveal>

        <div className="mt-9 flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-1 items-start sm:items-stretch">
              <Reveal delay={i * 100} className="flex-1">
                <div>
                  <p className="font-display text-4xl font-extrabold text-sb-accent-deep">
                    {step.n}
                  </p>
                  <p className="mt-2 font-body-kr text-lg font-bold text-sb-text">{step.title}</p>
                  <p className="mt-2 font-body-kr text-sm leading-relaxed text-sb-mute">
                    {step.body}
                  </p>
                </div>
              </Reveal>

              {i < steps.length - 1 && (
                <div className="hidden shrink-0 items-center justify-center px-2 pt-2 text-sb-mute sm:flex">
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

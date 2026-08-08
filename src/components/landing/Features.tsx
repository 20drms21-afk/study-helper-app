import Link from "next/link";
import {
  CheckCircle,
  ClipboardText,
  NotePencil,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/landing/Reveal";

function LearnMore({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-6 inline-block font-body-kr text-sm font-bold text-sb-text underline decoration-sb-accent decoration-4 underline-offset-4"
    >
      자세히 보기
    </Link>
  );
}

function NotesVisual() {
  return (
    <div className="bite-corner glass rounded-2xl p-6">
      <div className="flex items-center gap-2 text-sb-text">
        <NotePencil size={18} weight="bold" />
        <span className="font-body-kr text-sm font-bold">열역학 제1법칙 · 요약형</span>
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-body-kr text-[13px]">
        <span className="font-bold text-sb-mute">정의</span>
        <span className="text-sb-text/80">에너지 총량은 변하지 않고 형태만 바뀐다</span>
        <span className="font-bold text-sb-mute">식</span>
        <span className="text-sb-text/80">ΔU = Q - W</span>
        <span className="font-bold text-sb-mute">함정</span>
        <span className="text-sb-text/80">부호 규약, 계와 주변 헷갈리지 않기</span>
      </div>
    </div>
  );
}

function ExamVisual() {
  return (
    <div className="bite-corner glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sb-text">
          <ClipboardText size={18} weight="bold" />
          <span className="font-body-kr text-sm font-bold">2주차 예상문제</span>
        </div>
        <span className="rounded-full bg-sb-accent/25 px-3 py-1 font-body-kr text-xs font-bold text-sb-accent-deep">
          채점 완료
        </span>
      </div>
      <p className="mt-4 font-body-kr text-[13px] text-sb-text/80">
        Q3. 소비자잉여가 커지는 경우로 옳은 것은?
      </p>
      <div className="mt-2 space-y-1.5 font-body-kr text-[13px] text-sb-mute">
        <p>① 시장가격이 상승할 때</p>
        <p className="flex items-center gap-1.5 text-sb-accent-deep">
          <CheckCircle size={15} weight="fill" /> ② 시장가격이 하락할 때
        </p>
        <p>③ 공급이 감소할 때</p>
      </div>
    </div>
  );
}

function TutorVisual() {
  return (
    <div className="mx-auto max-w-lg space-y-3">
      <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-tr-sm bg-sb-accent px-4 py-2.5 font-body-kr text-sm text-sb-accent-ink">
        소비자잉여랑 생산자잉여 차이가 뭐야?
      </div>
      <div className="bite-corner glass mr-auto w-fit max-w-[85%] rounded-2xl px-4 py-3 font-body-kr text-sm text-sb-text/85">
        <p>
          소비자잉여는 소비자가 지불할 용의보다 싸게 산 이득, 생산자잉여는 판매자가 받으려던
          가격보다 비싸게 판 이득이에요.
        </p>
        <p className="mt-2 font-body-kr text-xs text-sb-mute">
          출처: 미시경제학_3주차.pdf, 12페이지
        </p>
      </div>
    </div>
  );
}

function TranslateVisual() {
  return (
    <div className="mx-auto grid max-w-lg grid-cols-2 gap-3">
      <div className="glass rounded-2xl p-4">
        <p className="font-body-kr text-xs font-bold text-sb-mute">원문</p>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-full rounded bg-sb-border" />
          <div className="h-2 w-5/6 rounded bg-sb-border" />
          <div className="h-2 w-full rounded bg-sb-border" />
          <div className="mt-3 h-10 w-2/3 rounded bg-sb-border" />
          <div className="h-2 w-4/6 rounded bg-sb-border" />
        </div>
      </div>
      <div className="bite-corner rounded-2xl bg-sb-accent p-4">
        <p className="font-body-kr text-xs font-bold text-sb-accent-ink">번역본</p>
        <div className="mt-3 space-y-2 font-body-kr text-[11px] leading-relaxed text-sb-accent-ink/85">
          <p>반응은 두 방향 모두로</p>
          <p>자유롭게 진행될 수 있다.</p>
          <div className="mt-3 h-10 w-2/3 rounded bg-sb-accent-ink/10" />
          <p>가역성이란 이런 성질을</p>
          <p>가리키는 말이다.</p>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <>
      <section id="notes" className="bg-sb-bg py-20 sm:py-28">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="max-w-md font-display text-3xl text-sb-text sm:text-4xl">
              요약과 설명, 두 가지로 정리해요
            </h2>
            <p className="mt-4 max-w-md font-body-kr leading-relaxed text-sb-mute">
              요약형은 표로 한눈에, 설명형은 강의처럼 풀어서. 같은 자료로 둘 다 만들 수 있어요.
            </p>
            <LearnMore href="/notes" />
          </Reveal>
          <Reveal delay={150}>
            <NotesVisual />
          </Reveal>
        </div>
      </section>

      <section id="exams" className="bg-sb-bg-soft py-20 sm:py-28">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16">
          <Reveal delay={150} className="lg:order-2">
            <h2 className="max-w-md font-display text-3xl text-sb-text sm:text-4xl">
              기출 스타일 그대로, 예상문제
            </h2>
            <p className="mt-4 max-w-md font-body-kr leading-relaxed text-sb-mute">
              참고자료와 기출문제를 함께 올리면 교수님 출제 스타일에 맞춰 문제를 만들어요.
              채점 후엔 취약점까지 짚어드려요.
            </p>
            <LearnMore href="/exams" />
          </Reveal>
          <Reveal className="lg:order-1">
            <ExamVisual />
          </Reveal>
        </div>
      </section>

      <section id="tutor" className="bg-sb-bg py-20 sm:py-28">
        <div className="mx-auto w-full max-w-3xl px-5 text-center">
          <Reveal>
            <h2 className="font-display text-3xl text-sb-text sm:text-4xl">
              모르는 부분, 바로 물어봐요
            </h2>
            <p className="mx-auto mt-4 max-w-md font-body-kr leading-relaxed text-sb-mute">
              업로드한 자료를 근거로 답하는 AI선생님이라 엉뚱한 대답을 하지 않아요.
            </p>
          </Reveal>
        </div>
        <Reveal delay={150} className="mt-10 px-5">
          <TutorVisual />
        </Reveal>
        <div className="mt-8 text-center">
          <Link
            href="/tutor"
            className="font-body-kr text-sm font-bold text-sb-text underline decoration-sb-accent decoration-4 underline-offset-4"
          >
            자세히 보기
          </Link>
        </div>
      </section>

      <section id="translate" className="bg-sb-bg-soft py-20 sm:py-28">
        <div className="mx-auto w-full max-w-3xl px-5 text-center">
          <Reveal>
            <h2 className="font-display text-3xl text-sb-text sm:text-4xl">
              영어자료도, 원래 모양 그대로
            </h2>
            <p className="mx-auto mt-4 max-w-md font-body-kr leading-relaxed text-sb-mute">
              레이아웃은 그대로 두고 번역만 얹어요. 그림, 화살표, 수식은 손대지 않아요.
            </p>
          </Reveal>
        </div>
        <Reveal delay={150} className="mt-10 px-5">
          <TranslateVisual />
        </Reveal>
        <div className="mt-8 text-center">
          <Link
            href="/translate"
            className="font-body-kr text-sm font-bold text-sb-text underline decoration-sb-accent decoration-4 underline-offset-4"
          >
            자세히 보기
          </Link>
        </div>
      </section>
    </>
  );
}

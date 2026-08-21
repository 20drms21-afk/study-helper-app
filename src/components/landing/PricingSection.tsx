import Link from "next/link";
import { FREE_MONTHLY_LIMIT } from "@/lib/usage";
import { PRO_PLAN_AMOUNT, MASTER_PLAN_AMOUNT } from "@/lib/subscription";
import {
  FREE_PLAN_TRANSLATE_MAX_PAGES,
  PRO_PLAN_TRANSLATE_MAX_PAGES,
  MASTER_PLAN_TRANSLATE_MAX_PAGES,
} from "@/lib/translate/pipeline";
import { Reveal } from "@/components/landing/Reveal";

// 무료/Pro/Master 3단. 숫자를 여기 하드코딩하지 않고 실제 과금/사용량 로직이 쓰는 상수를
// 그대로 import — 값이 바뀌어도 이 카드가 실제 동작과 어긋나지 않게.
export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto w-full max-w-[1200px] px-[clamp(20px,5vw,64px)] py-[60px]">
      <Reveal>
        <p className="font-display text-2xl font-bold uppercase tracking-wide text-sb-accent-deep sm:text-3xl">
          07 · 요금제
        </p>
        <div className="mt-2 h-px bg-sb-border" />
      </Reveal>

      <div className="mx-auto mt-9 grid max-w-[1140px] gap-7 sm:grid-cols-3">
        <Reveal delay={0}>
          <div className="flex h-full min-h-[520px] flex-col gap-4.5 rounded-3xl bg-sb-bg-soft px-9 py-12">
            <p className="font-body-kr text-[17px] font-bold uppercase tracking-wide text-sb-mute">
              무료
            </p>
            <p className="font-display text-[34px] font-extrabold text-sb-text">₩0</p>
            <ul className="flex flex-1 flex-col gap-4 font-body-kr text-sm text-sb-text">
              <li>기능 생성 월 {FREE_MONTHLY_LIMIT}회</li>
              <li>PDF 영어자료 최대 {FREE_PLAN_TRANSLATE_MAX_PAGES}페이지 변환</li>
              <li>오답노트 · 취약점 분석 포함</li>
            </ul>
            <Link
              href="/signup"
              className="rounded-full border border-sb-border py-3 text-center font-body-kr text-[15px] font-semibold text-sb-text"
            >
              무료로 시작
            </Link>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="flex h-full min-h-[520px] flex-col gap-4.5 rounded-3xl border border-sb-accent/50 bg-sb-accent/8 px-9 py-12 shadow-[0_0_40px_rgba(194,255,61,0.12)]">
            <div className="flex items-center justify-between">
              <span className="font-body-kr text-[17px] font-bold uppercase tracking-wide text-sb-accent-deep">
                Pro
              </span>
              <span className="rounded-full bg-sb-accent px-2.5 py-1 font-body-kr text-[11px] font-bold text-sb-accent-ink">
                추천
              </span>
            </div>
            <p className="font-display text-[34px] font-extrabold text-sb-text">
              ₩{PRO_PLAN_AMOUNT.toLocaleString("ko-KR")}
              <span className="font-body-kr text-sm font-normal text-sb-mute">/월</span>
            </p>
            <ul className="flex flex-1 flex-col gap-4 font-body-kr text-sm text-sb-text">
              <li>기능 생성 무제한</li>
              <li>PDF 영어자료 최대 {PRO_PLAN_TRANSLATE_MAX_PAGES}페이지 변환</li>
              <li>오답노트 · 취약점 분석 포함</li>
            </ul>
            <Link
              href="/billing"
              className="rounded-full bg-sb-accent py-3 text-center font-body-kr text-[15px] font-bold text-sb-accent-ink"
            >
              Pro 시작하기
            </Link>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="flex h-full min-h-[520px] flex-col gap-4.5 rounded-3xl border border-[#e63462]/50 bg-[#e63462]/8 px-9 py-12 shadow-[0_0_40px_rgba(230,52,98,0.14)]">
            <p className="font-body-kr text-[17px] font-bold uppercase tracking-wide text-[#e63462]">
              Master
            </p>
            <p className="font-display text-[34px] font-extrabold text-sb-text">
              ₩{MASTER_PLAN_AMOUNT.toLocaleString("ko-KR")}
              <span className="font-body-kr text-sm font-normal text-sb-mute">/월</span>
            </p>
            <ul className="flex flex-1 flex-col gap-4 font-body-kr text-sm text-sb-text">
              <li>기능 생성 무제한</li>
              <li>PDF 영어자료 최대 {MASTER_PLAN_TRANSLATE_MAX_PAGES}페이지 변환</li>
              <li>오답노트 · 취약점 분석 포함</li>
            </ul>
            <Link
              href="/billing"
              className="rounded-full bg-[#e63462] py-3 text-center font-body-kr text-[15px] font-bold text-sb-accent-ink"
            >
              Master 시작하기
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

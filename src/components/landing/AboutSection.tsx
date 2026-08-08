import { FileDoc, FilePdf, Image as ImageIcon, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/landing/Reveal";

const formats = [
  { icon: FilePdf, label: "PDF", caption: "슬라이드, 스캔본까지" },
  { icon: FileDoc, label: "워드 (.docx)", caption: "리포트, 정리한 문서 그대로" },
  { icon: ImageIcon, label: "이미지", caption: "사진 찍은 필기, 칠판까지" },
];

export function AboutSection() {
  return (
    <section className="bg-sb-bg px-5 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl text-center">
        <Reveal>
          <h2 className="font-display text-3xl leading-snug text-sb-text sm:text-4xl">
            자료를 그대로 올리면
            <br />
            <span className="text-sb-accent-deep">Claude AI</span>가 읽어요.
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-body-kr leading-relaxed text-sb-mute">
            따로 타이핑하거나 정리할 필요 없어요. PDF든 워드든 사진이든, 형식 그대로 이해해요.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {formats.map((format) => (
              <div
                key={format.label}
                className="glass flex items-center gap-3 rounded-2xl px-5 py-4 text-left sm:flex-col sm:items-center sm:text-center"
              >
                <format.icon size={28} weight="bold" className="shrink-0 text-sb-accent-deep" />
                <div>
                  <p className="font-body-kr text-sm font-bold text-sb-text">{format.label}</p>
                  <p className="mt-0.5 font-body-kr text-xs text-sb-mute">{format.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="glass mt-6 inline-flex flex-col items-center gap-2 rounded-2xl px-6 py-5 sm:flex-row sm:gap-4 sm:text-left">
            <div className="flex items-center gap-2 text-sb-accent-deep">
              <Sparkle size={20} weight="fill" />
              <span className="font-body-kr text-sm font-bold text-sb-text">
                Anthropic Claude AI 기반
              </span>
            </div>
            <p className="font-body-kr text-xs leading-relaxed text-sb-mute sm:max-w-xs">
              이미지 속 손글씨나 표까지 실제로 읽어내는 이유예요.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

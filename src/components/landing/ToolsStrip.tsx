import Link from "next/link";
import {
  BookBookmark,
  CalendarBlank,
  Coins,
  Megaphone,
  Timer,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/landing/Reveal";

const tools = [
  { href: "/review", icon: BookBookmark, label: "오답노트" },
  { href: "/calendar", icon: CalendarBlank, label: "캘린더" },
  { href: "/timer", icon: Timer, label: "포모도로" },
  { href: "/scholarships", icon: Coins, label: "장학금" },
  { href: "/activities", icon: Megaphone, label: "대외활동·공모전" },
];

export function ToolsStrip() {
  return (
    <section className="bg-sb-bg py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <Reveal>
          <h2 className="font-display text-2xl text-sb-text sm:text-3xl">
            공부 말고 다른 것도 챙겨드려요
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-6 flex flex-wrap gap-3">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="glass flex items-center gap-2 rounded-full px-5 py-3 font-body-kr text-sm font-medium text-sb-text transition-colors hover:text-sb-accent-deep"
              >
                <tool.icon size={18} weight="bold" />
                {tool.label}
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

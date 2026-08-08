import type { Metadata } from "next";
import { Geist, Geist_Mono, Do_Hyeon, Gothic_A1 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 랜딩페이지 전용 브랜드 서체 — 나머지 앱 화면(대시보드)은 기존 서체를 그대로 씀
const doHyeon = Do_Hyeon({
  variable: "--font-do-hyeon",
  weight: "400",
  subsets: ["latin"],
});

const gothicA1 = Gothic_A1({
  variable: "--font-gothic-a1",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "공부한입 | StudyBite",
  description: "대학생을 위한 AI 학습 도우미 공부한입(StudyBite) — 요약노트와 예상문제를 만들어드립니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${doHyeon.variable} ${gothicA1.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

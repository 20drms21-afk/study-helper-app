import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
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

// 랜딩페이지 전용 브랜드 서체 — 나머지 앱 화면(대시보드)은 기존 서체를 그대로 씀.
// Pretendard는 Google Fonts 목록에 없어 next/font/google로 못 받아옴 — 가변폰트 파일을
// public/fonts/에 직접 두고 next/font/local로 로드(런타임 CDN 요청 없이 자체 호스팅).
const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "공부한입 | StudyBite",
  description: "대학생을 위한 AI 학습 도우미 공부한입(StudyBite) — 요약노트와 예상문제를 만들어드립니다.",
};

export default function RootLayout({
  children,
  authModal,
}: Readonly<{
  children: React.ReactNode;
  authModal: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          {authModal}
        </Providers>
      </body>
    </html>
  );
}

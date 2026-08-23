"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { authInputClass, authLabelClass, authPrimaryButtonClass } from "@/components/auth/AuthShell";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthEmailExists: "이미 이메일/비밀번호로 가입된 계정입니다. 이메일/비밀번호로 로그인해주세요.",
};

// 로그인 폼 내용만 담당(카드 바깥 껍데기는 AuthShell(전체 페이지)/AuthModal(모달)이 각자
// 다르게 감쌈) — 전체 페이지 라우트(/login)와 랜딩페이지에서 뜨는 인터셉트 모달이 이 컴포넌트
// 하나를 그대로 공유한다.
function LoginCardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    const oauthError = searchParams.get("error");
    return oauthError ? OAUTH_ERROR_MESSAGES[oauthError] ?? "로그인 중 오류가 발생했습니다." : null;
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <>
      <h1 className="mb-8 text-center font-display text-2xl font-extrabold text-sb-text">
        로그인
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={authLabelClass}>
            이메일
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block font-body-kr text-sm font-medium text-sb-text">
              비밀번호
            </label>
            <Link href="/forgot-password" className="font-body-kr text-xs text-sb-mute hover:text-sb-text">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </div>
        {error && <p className="font-body-kr text-sm text-[#ff8a8a]">{error}</p>}
        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
      <SocialLoginButtons callbackUrl={callbackUrl} />
      <p className="mt-6 text-center font-body-kr text-sm text-sb-mute">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium text-sb-accent-deep underline">
          회원가입
        </Link>
      </p>
    </>
  );
}

export function LoginCard() {
  return (
    <Suspense fallback={null}>
      <LoginCardInner />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { AuthShell, authInputClass, authLabelClass, authPrimaryButtonClass } from "@/components/auth/AuthShell";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || undefined, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "회원가입에 실패했습니다.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="mb-8 text-center font-display text-2xl font-extrabold text-sb-text">
        회원가입
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className={authLabelClass}>
            이름 (선택)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputClass}
          />
        </div>
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
          <label htmlFor="password" className={authLabelClass}>
            비밀번호 (8자 이상)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </div>
        {error && <p className="font-body-kr text-sm text-[#ff8a8a]">{error}</p>}
        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>
      <SocialLoginButtons callbackUrl="/" />
      <p className="mt-6 text-center font-body-kr text-sm text-sb-mute">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-sb-accent-deep underline">
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}

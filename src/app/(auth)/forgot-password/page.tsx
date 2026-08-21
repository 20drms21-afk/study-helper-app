"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, authInputClass, authLabelClass, authPrimaryButtonClass } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청에 실패했습니다.");
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-2 text-center font-display text-2xl font-extrabold text-sb-text">
        비밀번호 찾기
      </h1>
      <p className="mb-8 text-center font-body-kr text-sm text-sb-mute">
        가입하신 이메일을 입력하면 재설정 링크를 보내드립니다.
      </p>
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
        {error && <p className="font-body-kr text-sm text-[#ff8a8a]">{error}</p>}
        {message && <p className="font-body-kr text-sm text-sb-accent-deep">{message}</p>}
        <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
          {loading ? "전송 중..." : "재설정 링크 받기"}
        </button>
      </form>
      <p className="mt-6 text-center font-body-kr text-sm text-sb-mute">
        <Link href="/login" className="font-medium text-sb-accent-deep underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </AuthShell>
  );
}

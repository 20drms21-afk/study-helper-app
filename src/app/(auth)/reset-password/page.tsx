"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell, authInputClass, authLabelClass, authPrimaryButtonClass } from "@/components/auth/AuthShell";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "재설정에 실패했습니다.");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <div className="text-center">
          <p className="font-body-kr text-sm text-[#ff8a8a]">유효하지 않은 링크입니다.</p>
          <p className="mt-4 font-body-kr text-sm">
            <Link href="/forgot-password" className="font-medium text-sb-accent-deep underline">
              다시 요청하기
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="mb-8 text-center font-display text-2xl font-extrabold text-sb-text">
        새 비밀번호 설정
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className={authLabelClass}>
            새 비밀번호
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
        <div>
          <label htmlFor="confirmPassword" className={authLabelClass}>
            새 비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={authInputClass}
          />
        </div>
        {error && <p className="font-body-kr text-sm text-[#ff8a8a]">{error}</p>}
        {success && (
          <p className="font-body-kr text-sm text-sb-accent-deep">
            변경되었습니다. 로그인 화면으로 이동합니다...
          </p>
        )}
        <button type="submit" disabled={loading || success} className={authPrimaryButtonClass}>
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

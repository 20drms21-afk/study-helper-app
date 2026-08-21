"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function BillingActions({
  plan,
  subscriptionStatus,
}: {
  plan: "free" | "pro" | "master";
  subscriptionStatus: string | null;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCardAuth(
    successPath: "register" | "card-update",
    targetPlan?: "pro" | "master"
  ) {
    if (!session?.user?.id) return;

    setError(null);
    setLoading(true);
    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("결제 설정이 완료되지 않았습니다.");
      }

      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: session.user.id });

      // 신규 구독(register)일 때만 어떤 플랜을 고른 건지 successUrl에 실어 보냄 — 서버(register
      // 라우트)가 이 값을 읽어서 Pro/Master 금액 중 뭘 청구할지 결정함.
      const successUrl = new URL(`/api/billing/toss/${successPath}`, window.location.origin);
      if (targetPlan) successUrl.searchParams.set("targetPlan", targetPlan);

      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: successUrl.toString(),
        failUrl: `${window.location.origin}/billing?checkout=fail`,
        customerEmail: session.user.email ?? undefined,
        customerName: session.user.name ?? undefined,
      });
      // requestBillingAuth navigates the browser away on success, so no
      // further action is needed here.
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("구독을 취소하시겠습니까? 이미 결제한 기간까지는 계속 이용할 수 있고, 이후 무료 플랜으로 전환됩니다.")) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/toss/cancel", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "취소에 실패했습니다.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const canCancel = subscriptionStatus === "active" || subscriptionStatus === "past_due";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {subscriptionStatus === "active" && (
          <button
            onClick={() => requestCardAuth("card-update")}
            disabled={loading}
            className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5 disabled:opacity-50"
          >
            카드 변경
          </button>
        )}
        {subscriptionStatus === "past_due" && (
          <button
            onClick={() => requestCardAuth("card-update")}
            disabled={loading}
            className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? "처리 중..." : "카드 확인하고 재결제"}
          </button>
        )}
        {subscriptionStatus === "canceled" && (
          <button
            onClick={() => requestCardAuth("card-update")}
            disabled={loading}
            className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? "처리 중..." : "재구독하기"}
          </button>
        )}
        {(subscriptionStatus === null || subscriptionStatus === "suspended") && plan === "free" && (
          <>
            <button
              onClick={() => requestCardAuth("register", "pro")}
              disabled={loading}
              className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? "처리 중..." : "Pro로 업그레이드"}
            </button>
            <button
              onClick={() => requestCardAuth("register", "master")}
              disabled={loading}
              className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? "처리 중..." : "Master로 업그레이드"}
            </button>
          </>
        )}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-sb-mute hover:bg-white/5 disabled:opacity-50"
          >
            구독 취소
          </button>
        )}
      </div>
      {error && <p className="text-sm text-[#ff8a8a]">{error}</p>}
    </div>
  );
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotaStatus } from "@/lib/usage";
import { planLabel } from "@/lib/subscription";
import { BillingActions } from "@/components/BillingActions";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const [quota, user] = await Promise.all([
    getQuotaStatus(session!.user.id),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { subscriptionStatus: true, currentPeriodEnd: true },
    }),
  ]);
  const { checkout } = await searchParams;

  const subscriptionStatus = user?.subscriptionStatus ?? null;
  const periodEndText = user?.currentPeriodEnd
    ? new Date(user.currentPeriodEnd).toLocaleDateString("ko-KR")
    : null;

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-bold">요금제</h1>

      {checkout === "success" && (
        <p className="rounded-md bg-sb-accent/10 px-3 py-2 text-sm text-sb-accent-deep">
          처리가 완료되었습니다!
        </p>
      )}
      {checkout === "recovered" && (
        <p className="rounded-md bg-sb-accent/10 px-3 py-2 text-sm text-sb-accent-deep">
          결제가 정상 처리되어 {planLabel(quota.plan)} 플랜이 계속 유지됩니다.
        </p>
      )}
      {checkout === "resumed" && (
        <p className="rounded-md bg-sb-accent/10 px-3 py-2 text-sm text-sb-accent-deep">
          구독이 재개되었습니다.
        </p>
      )}
      {checkout === "fail" && (
        <p className="rounded-md bg-[rgba(255,138,138,0.1)] px-3 py-2 text-sm text-[#ff8a8a]">
          결제에 실패했습니다. 다시 시도해주세요.
        </p>
      )}

      {subscriptionStatus === "past_due" && (
        <p className="rounded-md bg-[rgba(232,182,77,0.12)] px-3 py-2 text-sm text-[#e8b64d]">
          등록된 카드로 결제할 수 없습니다. 새로운 카드를 등록해주세요.
        </p>
      )}
      {subscriptionStatus === "canceled" && periodEndText && (
        <p className="rounded-md bg-[rgba(232,182,77,0.12)] px-3 py-2 text-sm text-[#e8b64d]">
          {periodEndText}까지 {planLabel(quota.plan)} 플랜을 이용할 수 있고, 이후 자동으로 무료
          플랜으로 전환됩니다.
        </p>
      )}

      <div className="space-y-2 rounded-md border border-white/15 p-4">
        <p className="text-sm">
          현재 플랜: <strong>{quota.plan === "free" ? "무료" : planLabel(quota.plan)}</strong>
        </p>
        <p className="text-sm text-sb-mute">
          이번 달 사용량: {quota.used}
          {quota.limit === null ? " / 무제한" : ` / ${quota.limit}회`}
        </p>
      </div>
      <BillingActions plan={quota.plan} subscriptionStatus={subscriptionStatus} />
    </div>
  );
}

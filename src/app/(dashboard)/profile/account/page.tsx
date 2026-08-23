import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQuotaStatus } from "@/lib/usage";
import { planLabel } from "@/lib/subscription";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountSection } from "@/components/profile/DeleteAccountSection";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [user, quota] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, passwordHash: true, subscriptionStatus: true, currentPeriodEnd: true },
    }),
    getQuotaStatus(userId),
  ]);

  const hasPassword = !!user?.passwordHash;
  const periodEndText = user?.currentPeriodEnd
    ? new Date(user.currentPeriodEnd).toLocaleDateString("ko-KR")
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-xl font-bold">내 정보</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-sb-text">계정 정보</h2>
        <div className="rounded-md border border-sb-border p-4 text-sm">
          <p>이메일: {user?.email}</p>
          <p className="mt-1 text-sb-mute">
            로그인 방식: {hasPassword ? "이메일/비밀번호" : "소셜 로그인 (Google/카카오)"}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-sb-text">비밀번호 변경</h2>
        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <p className="rounded-md border border-sb-border p-4 text-sm text-sb-mute">
            소셜 로그인으로 가입된 계정입니다. 비밀번호를 설정하지 않았어요.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-sb-text">구독/결제</h2>
        <div className="space-y-2 rounded-md border border-sb-border p-4 text-sm">
          <p>
            현재 플랜: <strong>{quota.plan === "free" ? "무료" : planLabel(quota.plan)}</strong>
          </p>
          <p className="text-sb-mute">
            이번 달 사용량: {quota.used.toLocaleString("ko-KR")}
            {quota.limit === null ? " / 무제한" : ` / ${quota.limit.toLocaleString("ko-KR")}토큰`}
          </p>
          {periodEndText && (
            <p className="text-sb-mute">
              {user?.subscriptionStatus === "canceled" ? "이용 종료일" : "다음 결제일"}:{" "}
              {periodEndText}
            </p>
          )}
          <Link href="/billing" className="inline-block text-sm font-medium text-sb-text underline">
            요금제 페이지로 이동
          </Link>
        </div>
      </section>

      <section>
        <DeleteAccountSection userEmail={user!.email} />
      </section>
    </div>
  );
}

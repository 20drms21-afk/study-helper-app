import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getQuotaStatus, quotaRemainingPercent } from "@/lib/usage";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const quota = await getQuotaStatus(session.user.id);
  const quotaPercent = quotaRemainingPercent(quota);

  return (
    <div
      className="app-shell flex min-h-screen flex-col bg-sb-bg-soft font-body-kr text-sb-text"
      style={{
        // 랜딩 히어로와 같은 라임그린 radial-gradient 글로우 — 다만 어두운 배경만 있으면
        // 청록/검정에 가깝게 읽힌다는 피드백을 받아서, 노트/시험/캘린더 등 모든 기능 페이지의
        // 공통 wrapper인 이 자리에 은은하게 얹어 페이지 전체가 초록빛을 띠게 했다. 랜딩 히어로
        // (0.08)보다 살짝만 진하게(0.1), 화면 위쪽에서 옅게 번지고 본문까지는 안 내려오게
        // transparent 55%로 빨리 사그라들게 해서 콘텐츠 가독성은 그대로 유지한다.
        backgroundImage:
          "radial-gradient(circle at 50% -10%, rgba(194,255,61,0.1), transparent 55%)",
      }}
    >
      <DashboardNav
        userName={session.user.name ?? session.user.email ?? ""}
        isAdmin={isAdmin(session.user.email)}
        quotaPercent={quotaPercent}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

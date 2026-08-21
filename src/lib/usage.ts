import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

export const FREE_MONTHLY_LIMIT = Number(process.env.FREE_PLAN_MONTHLY_LIMIT ?? 20);

export type UsageKind =
  | "note_generate"
  | "exam_generate"
  | "exam_grade"
  | "tutor_chat"
  | "scholarship_match"
  | "pdf_translate"
  | "activity_match";

export interface QuotaStatus {
  plan: "free" | "pro" | "master";
  limit: number | null;
  used: number;
  allowed: boolean;
}

function currentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export async function getMonthlyUsageCount(userId: string, now = new Date()): Promise<number> {
  const { start, end } = currentMonthRange(now);
  return prisma.usageEvent.count({
    where: { userId, createdAt: { gte: start, lt: end } },
  });
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, email: true } });
  const plan: "free" | "pro" | "master" =
    user?.plan === "master" ? "master" : user?.plan === "pro" ? "pro" : "free";
  const used = await getMonthlyUsageCount(userId);

  // 관리자 계정은 플랜과 무관하게 사용량 제한 없음. Pro/Master 둘 다 무제한(차이는 PDF 번역
  // 페이지 상한에서만 남 — src/lib/translate/pipeline.ts).
  if (plan !== "free" || isAdmin(user?.email)) {
    return { plan, limit: null, used, allowed: true };
  }

  return { plan, limit: FREE_MONTHLY_LIMIT, used, allowed: used < FREE_MONTHLY_LIMIT };
}

export async function recordUsage(userId: string, kind: UsageKind): Promise<void> {
  await prisma.usageEvent.create({ data: { userId, kind } });
}

export function quotaExceededMessage(limit: number): string {
  return `이번 달 무료 사용량(${limit}회)을 모두 사용했습니다. 요금제 페이지에서 업그레이드해주세요.`;
}

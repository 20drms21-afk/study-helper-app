import { prisma } from "@/lib/prisma";

export const FREE_MONTHLY_LIMIT = Number(process.env.FREE_PLAN_MONTHLY_LIMIT ?? 20);

export type UsageKind =
  | "note_generate"
  | "exam_generate"
  | "exam_grade"
  | "tutor_chat"
  | "scholarship_match"
  | "pdf_translate";

export interface QuotaStatus {
  plan: "free" | "pro";
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
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const plan: "free" | "pro" = user?.plan === "pro" ? "pro" : "free";
  const used = await getMonthlyUsageCount(userId);

  if (plan === "pro") {
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

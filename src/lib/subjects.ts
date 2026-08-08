import { prisma } from "@/lib/prisma";

export const DEFAULT_SUBJECT_NAME = "미분류";

const SUBJECT_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

export async function getOrCreateSubject(userId: string, rawName: string) {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (!name) {
    throw new Error("과목 이름을 입력해주세요.");
  }

  const existing = await prisma.subject.findFirst({ where: { userId, name } });
  if (existing) return existing;

  const count = await prisma.subject.count({ where: { userId } });
  return prisma.subject.create({
    data: {
      userId,
      name,
      color: SUBJECT_COLORS[count % SUBJECT_COLORS.length],
    },
  });
}

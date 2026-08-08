import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSubject } from "@/lib/subjects";

const createSubjectSchema = z.object({
  name: z.string().min(1).max(50),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const subjects = await prisma.subject.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(subjects);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = createSubjectSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "과목 이름을 입력해주세요." }, { status: 400 });
  }

  try {
    const subject = await getOrCreateSubject(session.user.id, parsedBody.data.name);
    return NextResponse.json(subject, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "과목을 생성할 수 없습니다." },
      { status: 400 }
    );
  }
}

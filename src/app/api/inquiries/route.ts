import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const inquirySchema = z.object({
  subject: z.string().trim().min(1, "제목을 입력해주세요.").max(200),
  message: z.string().trim().min(1, "내용을 입력해주세요.").max(4000),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // Board is anonymous — every logged-in user sees all inquiries, but never
  // who wrote them (userId intentionally omitted from the select).
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, subject: true, message: true, status: true, createdAt: true },
  });

  return NextResponse.json(inquiries);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const inquiry = await prisma.inquiry.create({
    data: { userId: session.user.id, subject: parsed.data.subject, message: parsed.data.message },
  });

  return NextResponse.json(inquiry, { status: 201 });
}

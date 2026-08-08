import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1시간

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const GENERIC_MESSAGE = "해당 이메일로 계정이 있다면 비밀번호 재설정 링크를 보내드렸습니다.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "이메일 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // 이메일 존재 여부를 노출하지 않기 위해 사용자가 없어도 동일한 성공 메시지를 반환한다.
  if (!user) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (error) {
    console.error("password reset email failed", error);
    return NextResponse.json(
      { error: "이메일 발송이 설정되지 않았거나 실패했습니다. 관리자에게 문의해주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}

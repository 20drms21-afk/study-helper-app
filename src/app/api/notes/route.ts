import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUploadedFile } from "@/lib/upload";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const files = await prisma.uploadedFile.findMany({
    where: { userId: session.user.id, purpose: "note" },
    orderBy: { createdAt: "desc" },
    include: { summaries: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(files);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const subjectIdInput = formData?.get("subjectId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }

  const subjectId = typeof subjectIdInput === "string" && subjectIdInput ? subjectIdInput : undefined;

  const result = await createUploadedFile(session.user.id, file, { subjectId });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.file, { status: 201 });
}

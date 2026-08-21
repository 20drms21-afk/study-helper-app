import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, getPdfPageCount } from "@/lib/fileKind";
import { getQuotaStatus, recordUsage, quotaExceededMessage } from "@/lib/usage";
import {
  translateDocument,
  FREE_PLAN_TRANSLATE_MAX_PAGES,
  PRO_PLAN_TRANSLATE_MAX_PAGES,
  MASTER_PLAN_TRANSLATE_MAX_PAGES,
} from "@/lib/translate/pipeline";

export const runtime = "nodejs";
export const maxDuration = 280;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const translations = await prisma.pdfTranslation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(translations);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const quota = await getQuotaStatus(session.user.id);
  if (!quota.allowed) {
    return NextResponse.json({ error: quotaExceededMessage(quota.limit!) }, { status: 402 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const subjectNameInput = formData?.get("subjectName");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }
  const subjectName = typeof subjectNameInput === "string" ? subjectNameInput.trim() : "";
  if (!subjectName) {
    return NextResponse.json({ error: "과목명을 입력해주세요." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDF 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "빈 파일입니다." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "파일 크기는 20MB 이하여야 합니다." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let pageCount: number;
  try {
    pageCount = await getPdfPageCount(buffer);
  } catch {
    return NextResponse.json({ error: "PDF 파일을 읽지 못했습니다." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const planLimit =
    user?.plan === "master"
      ? MASTER_PLAN_TRANSLATE_MAX_PAGES
      : user?.plan === "pro"
        ? PRO_PLAN_TRANSLATE_MAX_PAGES
        : FREE_PLAN_TRANSLATE_MAX_PAGES;
  const pagesToTranslate = Math.min(pageCount, planLimit);

  const { storedPath } = await saveUploadedFile(session.user.id, file.name, buffer, file.type);

  const translation = await prisma.pdfTranslation.create({
    data: {
      userId: session.user.id,
      subjectName,
      originalFileName: file.name,
      originalStoredPath: storedPath,
      pageCount,
      translatedPageCount: pagesToTranslate,
      status: "processing",
    },
  });

  try {
    const { translatedBuffer, translatedPageCount } = await translateDocument(
      buffer,
      file.name,
      pagesToTranslate
    );

    const saved = await saveUploadedFile(
      session.user.id,
      `translated-${file.name}`,
      translatedBuffer,
      "application/pdf"
    );

    await prisma.pdfTranslation.update({
      where: { id: translation.id },
      data: {
        status: "done",
        translatedStoredPath: saved.storedPath,
        translatedPageCount,
      },
    });

    try {
      await recordUsage(session.user.id, "pdf_translate");
    } catch (err) {
      console.error("usage record failed", err);
    }
  } catch (error) {
    console.error("pdf translate failed", error);
    await prisma.pdfTranslation.update({
      where: { id: translation.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
    });
  }

  const result = await prisma.pdfTranslation.findUnique({ where: { id: translation.id } });
  return NextResponse.json(result, { status: 201 });
}

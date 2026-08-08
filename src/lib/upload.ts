import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteStoredFile } from "@/lib/storage";
import { classifyFileKind, getPdfPageCount, MAX_UPLOAD_BYTES, FREE_PLAN_MAX_PDF_PAGES } from "@/lib/fileKind";
import { extractDocxText } from "@/lib/extract/docx";
import type { UploadedFile } from "@/generated/prisma/client";

type UploadResult =
  | { ok: true; file: UploadedFile }
  | { ok: false; status: number; error: string };

export async function createUploadedFile(
  userId: string,
  file: File,
  opts: { subjectId?: string | null } = {}
): Promise<UploadResult> {
  if (file.size === 0) {
    return { ok: false, status: 400, error: "빈 파일입니다." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, status: 400, error: "파일 크기는 20MB 이하여야 합니다." };
  }

  const fileKind = classifyFileKind(file.type);
  if (!fileKind) {
    return {
      ok: false,
      status: 400,
      error: "지원하지 않는 파일 형식입니다. (PDF, DOCX, 이미지만 업로드 가능)",
    };
  }

  let subjectId: string | null = null;
  if (opts.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: opts.subjectId, userId },
      select: { id: true },
    });
    if (!subject) {
      return { ok: false, status: 400, error: "과목을 찾을 수 없습니다." };
    }
    subjectId = subject.id;
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (fileKind === "pdf") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (user?.plan !== "pro") {
      const pageCount = await getPdfPageCount(buffer);
      if (pageCount > FREE_PLAN_MAX_PDF_PAGES) {
        return {
          ok: false,
          status: 400,
          error: `무료 플랜은 PDF 최대 ${FREE_PLAN_MAX_PDF_PAGES}페이지까지 업로드할 수 있습니다. Pro 플랜에서는 제한이 없습니다.`,
        };
      }
    }
  }

  const { storedPath } = await saveUploadedFile(userId, file.name, buffer, file.type);

  let extractedText: string | null = null;
  let needsVision = false;

  if (fileKind === "docx") {
    try {
      extractedText = await extractDocxText(buffer);
    } catch {
      await deleteStoredFile(storedPath);
      return { ok: false, status: 400, error: "문서에서 텍스트를 추출하지 못했습니다." };
    }
  } else {
    needsVision = true;
  }

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      userId,
      subjectId,
      originalName: file.name,
      storedPath,
      mimeType: file.type,
      fileKind,
      sizeBytes: file.size,
      extractedText,
      needsVision,
      purpose: "note",
    },
  });

  return { ok: true, file: uploadedFile };
}

import { PDFDocument } from "pdf-lib";

export type FileKind = "pdf" | "docx" | "image";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

export function classifyFileKind(mimeType: string): FileKind | null {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === DOCX_TYPE) return "docx";
  if (IMAGE_TYPES.has(mimeType)) return "image";
  return null;
}

type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export function imageMediaType(mimeType: string): ImageMediaType | null {
  return IMAGE_TYPES.has(mimeType) ? (mimeType as ImageMediaType) : null;
}

export const FREE_PLAN_MAX_PDF_PAGES = Number(process.env.FREE_PLAN_MAX_PDF_PAGES ?? 40);

export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const doc = await PDFDocument.load(buffer, { updateMetadata: false });
  return doc.getPageCount();
}

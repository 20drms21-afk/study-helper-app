import { PDFDocument } from "pdf-lib";

export type FileKind = "pdf" | "docx" | "pptx" | "image";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

export function classifyFileKind(mimeType: string): FileKind | null {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === DOCX_TYPE) return "docx";
  if (mimeType === PPTX_TYPE) return "pptx";
  if (IMAGE_TYPES.has(mimeType)) return "image";
  return null;
}

// 브라우저가 .hwp/.hwpx에 실어 보내는 MIME 타입은 제각각이라(빈 문자열이거나
// application/octet-stream인 경우가 흔함) MIME으로는 못 걸러내고 파일명 확장자로 감지해서
// "PDF로 내보내 주세요" 안내를 보여준다 — hwp는 순수 JS로 신뢰성 있게 파싱할 방법이 없음
// (구버전은 한컴 독점 바이너리 포맷, 변환하려면 유료 API나 네이티브 바이너리가 필요한데
// 후자는 서버리스 배포와 안 맞고 전자는 사용자 자료를 제3자에 보내는 별도 문제가 생김).
export function isHwpFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".hwp") || lower.endsWith(".hwpx");
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

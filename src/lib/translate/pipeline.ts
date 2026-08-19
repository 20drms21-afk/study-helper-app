import { PDFDocument } from "pdf-lib";
import { translatePdfWithDeepL } from "./deepl";

export const FREE_PLAN_TRANSLATE_MAX_PAGES = 5;
export const PRO_PLAN_TRANSLATE_MAX_PAGES = 60;

export interface TranslateResult {
  translatedBuffer: Buffer;
  translatedPageCount: number;
}

// DeepL Document Translation은 업로드한 문서 전체를 번역한다(페이지 범위를 지정하는 파라미터가
// 없음) — 무료/Pro 플랜별 페이지 상한(FREE_PLAN_TRANSLATE_MAX_PAGES/PRO_PLAN_TRANSLATE_MAX_PAGES)을
// 그대로 지키려면, DeepL에 보내기 전에 원본 PDF에서 앞쪽 maxPages장만 잘라낸 새 PDF를 만들어야
// 한다. pdf-lib(이미 getPdfPageCount에서 쓰고 있는 라이브러리)로 페이지를 복사해서 새 문서를
// 구성한다.
async function subsetPdfPages(pdfBuffer: Buffer, maxPages: number): Promise<{ buffer: Buffer; pageCount: number }> {
  const source = await PDFDocument.load(pdfBuffer, { updateMetadata: false });
  const totalPages = source.getPageCount();
  const pageCount = Math.min(totalPages, maxPages);

  if (pageCount === totalPages) {
    return { buffer: pdfBuffer, pageCount };
  }

  const subset = await PDFDocument.create();
  const copiedPages = await subset.copyPages(source, Array.from({ length: pageCount }, (_, i) => i));
  for (const page of copiedPages) subset.addPage(page);
  const bytes = await subset.save();
  return { buffer: Buffer.from(bytes), pageCount };
}

export async function translateDocument(
  pdfBuffer: Buffer,
  originalFileName: string,
  maxPages: number
): Promise<TranslateResult> {
  const { buffer: subsetBuffer, pageCount } = await subsetPdfPages(pdfBuffer, maxPages);
  const translatedBuffer = await translatePdfWithDeepL(subsetBuffer, originalFileName);
  return { translatedBuffer, translatedPageCount: pageCount };
}

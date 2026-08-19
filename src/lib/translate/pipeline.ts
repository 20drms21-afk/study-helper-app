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
  const { buffer: subsetBuffer } = await subsetPdfPages(pdfBuffer, maxPages);
  const translatedBuffer = await translatePdfWithDeepL(subsetBuffer, originalFileName);

  // 번역문(한글)이 원문(영어)보다 길어지면, DeepL이 고정폭 텍스트 상자 안에 다 못 넣고 그 내용을
  // 다음 페이지로 넘겨서(원본엔 없던 페이지를 새로 만들어서) 번역된 PDF의 총 페이지 수가 업로드한
  // 페이지 수보다 늘어날 수 있다(실측 확인됨). "번역 요청한 페이지 수 = 번역 결과 페이지 수"라고
  // 가정하면, 이렇게 새로 생긴 페이지가 뷰어의 최대 페이지 수(translatedPageCount)에 반영되지 않아
  // 접근 불가능해진다 — 번역이 안 된 게 아니라 저장은 됐는데 못 보여주는 상태가 됨. 그래서
  // 업로드 전 페이지 수를 그대로 쓰지 않고, 실제로 돌려받은 PDF의 페이지 수를 다시 센다.
  const translatedPageCount = await PDFDocument.load(translatedBuffer, { updateMetadata: false }).then((doc) =>
    doc.getPageCount()
  );

  return { translatedBuffer, translatedPageCount };
}

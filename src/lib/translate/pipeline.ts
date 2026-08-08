import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { mapWithConcurrency } from "@/lib/concurrency";
import { renderPdfPages } from "./render";
import { overlayTranslation, type RegionTranslationResult } from "./overlay";
import { createOcrPool, type OcrRegion } from "./ocr";
import {
  pdfRegionTranslationSchema,
  pdfTranslateSystemPrompt,
  pdfTranslateUserPrompt,
} from "@/lib/prompts/pdfTranslate";

export const FREE_PLAN_TRANSLATE_MAX_PAGES = 5;
export const PRO_PLAN_TRANSLATE_MAX_PAGES = 60;

const TRANSLATE_CONCURRENCY = 6;
const OCR_CONCURRENCY = 3;

export interface TranslatedPage {
  pageNumber: number;
  buffer: Buffer;
}

async function translateRegions(
  regions: OcrRegion[],
  subjectName: string
): Promise<RegionTranslationResult[]> {
  if (regions.length === 0) return [];

  // 문단 단위로 묶던 이전 방식보다 줄 단위 번역은 페이지당 결과 항목 수가 훨씬 많다(예: 텍스트가
  // 빽빽한 페이지는 줄이 30~40개) — 4096으로는 구조화 출력이 중간에 잘려 JSON 파싱이 실패하는
  // 경우가 실측 확인되어 여유 있게 올림.
  const message = await anthropic.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: pdfTranslateSystemPrompt(),
    messages: [
      {
        role: "user",
        content: pdfTranslateUserPrompt(
          subjectName,
          regions.map((region, index) => ({ index, text: region.text }))
        ),
      },
    ],
    output_config: { format: zodOutputFormat(pdfRegionTranslationSchema) },
  });

  return message.parsed_output?.results ?? [];
}

export async function translateDocument(
  pdfBuffer: Buffer,
  subjectName: string,
  maxPages: number
): Promise<TranslatedPage[]> {
  const pageNumbers = Array.from({ length: maxPages }, (_, i) => i + 1);
  const rendered = await renderPdfPages(pdfBuffer, pageNumbers);

  const ocrPool = await createOcrPool(OCR_CONCURRENCY);
  try {
    const regionsByPage = await mapWithConcurrency(rendered, OCR_CONCURRENCY, async (page) => ({
      pageNumber: page.pageNumber,
      regions: await ocrPool.extractPageRegions(page.buffer),
    }));
    const regionMap = new Map(regionsByPage.map((r) => [r.pageNumber, r.regions]));

    const translationsByPage = await mapWithConcurrency(rendered, TRANSLATE_CONCURRENCY, async (page) => ({
      pageNumber: page.pageNumber,
      results: await translateRegions(regionMap.get(page.pageNumber) ?? [], subjectName),
    }));
    const translationMap = new Map(translationsByPage.map((t) => [t.pageNumber, t.results]));

    const results: TranslatedPage[] = [];
    for (const page of rendered) {
      const regions = regionMap.get(page.pageNumber) ?? [];
      const translationResults = translationMap.get(page.pageNumber) ?? [];
      const overlaid = await overlayTranslation(
        page.buffer,
        page.width,
        page.height,
        regions,
        translationResults
      );
      results.push({ pageNumber: page.pageNumber, buffer: overlaid });
    }
    return results;
  } finally {
    await ocrPool.terminate();
  }
}

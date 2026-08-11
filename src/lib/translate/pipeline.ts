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
import { recordAiUsage, AiUsageFeature, AiUsageStatus, summarizeAiError } from "@/lib/ai/aiUsage";

/** 문서 1건에 딸린 페이지별 Claude 호출을 같은 operationId로 묶기 위한 컨텍스트. */
export interface TranslateUsageContext {
  userId: string;
  plan: string;
  operationId: string;
}

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
  subjectName: string,
  pageNumber: number,
  totalPages: number,
  usage: TranslateUsageContext
): Promise<RegionTranslationResult[]> {
  if (regions.length === 0) return [];

  // 페이지별로 Claude 호출 1건씩 발생 — 같은 operationId(문서 1건)로 묶어서
  // 나중에 "PDF 문서 1건 총 비용"/"페이지당 평균 비용"을 계산할 수 있게 한다.
  const metadata = {
    page: pageNumber,
    totalPages,
    sourceTextLength: regions.reduce((sum, r) => sum + r.text.length, 0),
  };

  try {
    // 문단 단위로 묶던 이전 방식보다 줄 단위 번역은 페이지당 결과 항목 수가 훨씬 많다(예: 텍스트가
    // 빽빽한 페이지는 줄이 30~40개) — 4096으로는 구조화 출력이 중간에 잘려 JSON 파싱이 실패하는
    // 경우가 실측 확인되어 여유 있게 올림.
    const message = await anthropic.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: pdfTranslateSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
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

    await recordAiUsage({
      userId: usage.userId,
      plan: usage.plan,
      feature: AiUsageFeature.PDF_TRANSLATE,
      operationId: usage.operationId,
      usage: message.usage,
      metadata,
    });
    return message.parsed_output?.results ?? [];
  } catch (error) {
    await recordAiUsage({
      userId: usage.userId,
      plan: usage.plan,
      feature: AiUsageFeature.PDF_TRANSLATE,
      operationId: usage.operationId,
      status: AiUsageStatus.FAILED,
      metadata: { ...metadata, ...summarizeAiError(error) },
    });
    throw error; // 페이지 1개 실패 시 문서 전체를 실패 처리하는 기존 동작은 그대로 유지
  }
}

export async function translateDocument(
  pdfBuffer: Buffer,
  subjectName: string,
  maxPages: number,
  usage: TranslateUsageContext
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
      results: await translateRegions(
        regionMap.get(page.pageNumber) ?? [],
        subjectName,
        page.pageNumber,
        maxPages,
        usage
      ),
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

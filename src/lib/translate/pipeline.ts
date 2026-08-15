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

interface RegionInput {
  index: number;
  text: string;
}

// translateRegions()의 최초 호출과, 누락 인덱스 재시도 호출이 공유하는 실제 Claude 호출부.
async function callClaudeTranslate(
  subjectName: string,
  regionInputs: RegionInput[],
  usage: TranslateUsageContext,
  metadata: Record<string, string | number | boolean | null>
): Promise<RegionTranslationResult[]> {
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
          content: pdfTranslateUserPrompt(subjectName, regionInputs),
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
    throw error;
  }
}

// 응답 누락분에 재시도를 걸어도 소용없을 만큼 비율이 크면(절반 초과) 부분 누락이 아니라 더 근본적인
// 문제(스키마 불일치 등)일 가능성이 크다고 보고 재시도를 생략한다 — 반복 실패로 비용만 낭비하는 것 방지.
const MAX_RETRY_MISSING_RATIO = 0.5;

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

  const regionInputs: RegionInput[] = regions.map((region, index) => ({ index, text: region.text }));
  // 최초 호출이 그대로 던지는 에러는 여기서 잡지 않는다 — "페이지 1개 실패 시 문서 전체를 실패
  // 처리"하는 기존 동작을 그대로 유지(호출자인 translateDocument -> mapWithConcurrency가 처리).
  const results = await callClaudeTranslate(subjectName, regionInputs, usage, metadata);

  // Claude가 반환한 결과 배열이 입력 줄 개수와 정확히 일치한다는 보장이 없다 — 스키마상 배열
  // 길이가 강제되지 않아서, 누락된 인덱스는 조용히 "번역 안 함(skip)"으로 처리되며 원문이 그대로
  // 남는 버그로 이어졌다. 딱 1회만, 누락된 부분만 다시 요청한다(재귀 재시도는 하지 않음 — 무한
  // 루프/비용 폭주 방지).
  const returnedIndices = new Set(results.map((r) => r.index));
  const missing = regionInputs.filter((r) => !returnedIndices.has(r.index));

  if (missing.length > 0 && missing.length / regionInputs.length <= MAX_RETRY_MISSING_RATIO) {
    const retryMetadata = { ...metadata, isMissingIndexRetry: true, missingIndexCount: missing.length };
    try {
      const retryResults = await callClaudeTranslate(subjectName, missing, usage, retryMetadata);
      results.push(...retryResults);
    } catch (error) {
      // 재시도 자체가 실패해도 이미 확보한 results는 살려서 반환한다 — 보완 목적의 재시도 실패로
      // 페이지/문서 전체를 새로 실패시키지 않는다(실패 사실 자체는 callClaudeTranslate 안에서
      // 이미 AiUsageEvent로 FAILED 기록됨).
      console.error(`pdf translate missing-index retry failed (page ${pageNumber})`, error);
    }
  }

  const stillMissingCount = regionInputs.filter(
    (r) => !new Set(results.map((res) => res.index)).has(r.index)
  ).length;
  if (stillMissingCount > 0) {
    console.warn(
      `pdf translate: page ${pageNumber} left ${stillMissingCount}/${regionInputs.length} lines untranslated after retry`
    );
  }

  return results;
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

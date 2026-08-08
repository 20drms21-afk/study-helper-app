import { createScheduler, createWorker, PSM, type Worker } from "tesseract.js";

// 번역/오버레이 단위는 OCR이 인식한 "줄(line)" 그대로 하나씩이다 — 여러 줄을 하나의 문단으로
// 묶어서 번역하면(예: "Ch. 1 Chemicals to electric" + "Ch. 2 Electrochemical cells"를 하나로
// 합쳐 다시 줄바꿈) 원본에서는 각자 독립된 자리에 놓여 있던 줄들이 하나의 흐르는 문장처럼
// 재배치되어 원본 레이아웃/줄 구조를 그대로 따라가지 못하는 문제가 실측 확인됨(사용자 피드백:
// "원본의 원래 위치에 놓여있었으면 좋겠다", "원본 구조를 무시하는 부분이 보인다"). 줄 단위를
// 유지하면 번역문이 항상 원문 그 줄의 정확한 위치·크기에만 놓이므로 원본 레이아웃을 그대로
// 보존한다. 같은 페이지의 다른 줄들도 Claude 프롬프트에 순서대로 함께 전달되므로(한 번의 호출
// 안에서 페이지 전체 줄 목록을 보고 번역) 문장이 여러 줄에 걸쳐 있어도 문맥은 참고할 수 있다.
const MIN_LINE_CONFIDENCE = 30;
const MIN_TEXT_LENGTH = 2;
// 그림 요소(화살표, 도형 등)가 텍스트로 오인식되면 신뢰도는 애매하게 통과해도(30~70대) 실제
// 글자 수에 비해 bbox가 비정상적으로 거대하게 잡히는 경우가 실측 확인됨(예: 화살표를 "4"로
// 오인식하면서 세로 122px짜리 bbox가 잡힘 — 이 페이지의 진짜 글줄은 25~47px). 페이지의 실제
// 글줄 높이 중앙값 대비 이상치인 줄은 제거한다.
const HIGH_CONFIDENCE_SAMPLE = 80;
const HEIGHT_OUTLIER_MULTIPLIER = 3;
const MIN_SAMPLE_SIZE = 3;

export interface OcrRegion {
  bbox: { left: number; top: number; right: number; bottom: number };
  text: string;
  confidence: number;
  lineHeight: number; // 이 줄의 실측 픽셀 높이 — 번역 폰트 크기 산정에 사용
}

interface FlatLine {
  bbox: { x0: number; y0: number; x1: number; y1: number };
  text: string;
  confidence: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function filterLines(lines: FlatLine[]): OcrRegion[] {
  const byConfidenceAndText = lines.filter(
    (l) => l.text.trim().length > 0 && l.confidence >= MIN_LINE_CONFIDENCE
  );

  const highConfidenceHeights = byConfidenceAndText
    .filter((l) => l.confidence >= HIGH_CONFIDENCE_SAMPLE)
    .map((l) => l.bbox.y1 - l.bbox.y0);
  const referenceHeight =
    highConfidenceHeights.length >= MIN_SAMPLE_SIZE ? median(highConfidenceHeights) : null;

  const regions: OcrRegion[] = [];
  for (const line of byConfidenceAndText) {
    const text = line.text.trim();
    if (text.replace(/\s+/g, "").length < MIN_TEXT_LENGTH) continue;

    const height = line.bbox.y1 - line.bbox.y0;
    if (referenceHeight !== null && height > referenceHeight * HEIGHT_OUTLIER_MULTIPLIER) continue;

    regions.push({
      bbox: { left: line.bbox.x0, top: line.bbox.y0, right: line.bbox.x1, bottom: line.bbox.y1 },
      text,
      confidence: line.confidence,
      lineHeight: height,
    });
  }
  return regions;
}

export interface OcrPool {
  extractPageRegions(pageImageBuffer: Buffer): Promise<OcrRegion[]>;
  terminate(): Promise<void>;
}

// Tesseract 워커는 생성 비용이 커서 페이지마다 새로 만들지 않는다 — 워커 풀을 하나 만들고
// tesseract.js 내장 Scheduler로 여러 페이지의 OCR 작업을 분산 처리한 뒤 마지막에 한 번에 정리한다.
export async function createOcrPool(size: number): Promise<OcrPool> {
  const scheduler = createScheduler();
  const workers: Worker[] = [];
  for (let i = 0; i < size; i++) {
    // 영어 자료라도 원문 PDF에 이미 한국어 설명/주석이 섞여 있는 경우가 실측 확인됨. 'eng'
    // 언어팩만 쓰면 그 한글을 엉뚱한 라틴 문자 비슷한 기호로 오인식하고, 그 결과 바로 옆의
    // 진짜 영어 문장과 한 줄로 합쳐버려서(스크립트 경계를 못 알아봄) 번역 상자가 원본 한글까지
    // 덮어버리는 버그가 있었다(원본에 이미 있던 한글이 가려짐). 'kor'를 함께 로드하면 그 부분을
    // 정확한 한국어로 인식해서 별도 줄로 분리되고, 시스템 프롬프트의 "이미 한국어인 텍스트는
    // skip" 규칙에 따라 건드리지 않고 그대로 둔다.
    const worker = await createWorker(["eng", "kor"]);
    // 기본 PSM(AUTO)은 일반 문서용이라 슬라이드처럼 텍스트가 여기저기 흩어진 레이아웃에서
    // 같은 줄 높이에 나란히 놓인 서로 다른 텍스트박스를 하나의 줄로 합쳐버리는 문제가 실측
    // 확인됨(예: 2단 레이아웃에서 좌우 칸 텍스트가 한 줄로 합쳐짐). SPARSE_TEXT는 흩어진
    // 텍스트 조각을 순서 가정 없이 각각 찾아내므로 슬라이드/PPT 변환 PDF에 훨씬 적합하다.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    workers.push(worker);
    scheduler.addWorker(worker);
  }

  return {
    async extractPageRegions(pageImageBuffer: Buffer): Promise<OcrRegion[]> {
      const result = await scheduler.addJob("recognize", pageImageBuffer, {}, { blocks: true });
      const lines: FlatLine[] = [];

      for (const block of result.data.blocks ?? []) {
        for (const paragraph of block.paragraphs) {
          for (const line of paragraph.lines) {
            lines.push({ bbox: line.bbox, text: line.text, confidence: line.confidence });
          }
        }
      }

      return filterLines(lines);
    },
    async terminate() {
      await scheduler.terminate();
    },
  };
}

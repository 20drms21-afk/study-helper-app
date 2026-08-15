import {
  createScheduler,
  createWorker,
  PSM,
  type Worker,
  type Line,
} from "tesseract.js";
import sharp from "sharp";

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
// 이상치 높이인데도 걸러내지 않아야 하는 경우(진짜 큰 제목/헤딩)와, 걸러내야 하는 경우(화살표가
// "4"로 오인식된 것 같은 노이즈)를 구분하는 기준 — 실제 헤딩은 거의 항상 이보다 길다.
const OUTLIER_TEXT_LENGTH_THRESHOLD = 3;

// 글머리기호/화살표/번호 마커 — 줄 맨 앞에 이 패턴이 오면 번역 대상에서 분리해서 원본 그대로 보존한다
// (Claude에게 번역을 맡기면 문장/구만 옮기고 마커 자체는 누락시키거나, 심지어 Claude가 임의로 다른
// 기호로 바꿔 쓰는 경우까지 실측 확인됨 — 원본 글머리기호/화살표 아이콘을 Tesseract가 "=", ">"처럼
// 전혀 다른 문자로 잘못 읽는 경우가 흔한데, 그 잘못 읽힌 문자가 그대로 Claude 입력에 들어가면 번역
// 결과에 엉뚱한 문자로 다시 나타남). 특정 기호 몇 개만 나열하는 대신, "알파벳/숫자가 하나도 없는
// 순수 기호 조합"이면 전부 마커로 간주한다 — 실제 영어 단어는 항상 알파벳을 포함하므로 오탐 위험이
// 없고, Tesseract가 아이콘을 어떤 문자로 잘못 읽든(=, >, ~, 임의의 특수문자 등) 안전하게 걸러진다.
const MARKER_REGEX = /^(?:[^\p{L}\p{N}\s]+|\(?[A-Za-z0-9]{1,2}[.)]\)?)$/u;
// 공백 없이 텍스트에 붙어있는 마커(예: "•Text")를 심볼 단위로 스캔할 때 쓰는, 기호 계열만의 문자셋
// (번호/문자 마커는 원래 뒤에 마침표·괄호가 붙어야 구분되는데 심볼 단위로 쪼개면 그 구분이 애매해져서
// 제외 — 기호 계열만 심볼 레벨 폴백 대상으로 한정).
const MARKER_CHAR_REGEX = /^[^\p{L}\p{N}\s]$/u;

export interface OcrRegion {
  bbox: { left: number; top: number; right: number; bottom: number };
  text: string;
  confidence: number;
  lineHeight: number; // 이 줄의 실측 픽셀 높이 — 번역 폰트 크기 산정에 사용
  marker?: { text: string; bbox: { left: number; top: number; right: number; bottom: number } }; // 줄 맨 앞에서 분리해낸 글머리기호/화살표 — 있으면 원본 그대로 보존됨(overlay.ts가 이 영역을 건드리지 않음)
}

interface FlatLine {
  bbox: { x0: number; y0: number; x1: number; y1: number };
  text: string;
  confidence: number;
  marker?: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };
}

// Tesseract가 인식한 줄(Line)에서 맨 앞의 글머리기호/화살표/번호 마커를 분리한다. 분리에 성공하면
// 마커는 자기 bbox를 그대로 유지한 채 번역 대상에서 빠지고, 나머지("rest")만 번역용 텍스트/bbox로
// 쓰인다 — overlay.ts가 이 축소된 bbox만 배경색으로 덮으므로 마커의 원본 픽셀은 자동으로 보존된다.
function splitLeadingMarker(line: Line): {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  marker?: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };
} {
  const words = line.words ?? [];
  if (words.length === 0) return { text: line.text, bbox: line.bbox };

  const first = words[0];
  const firstText = first.text.trim();

  // Case A: 첫 단어 전체가 마커(공백으로 분리되어 있는 경우, 예: "• Text")
  if (firstText.length > 0 && MARKER_REGEX.test(firstText)) {
    const rest = words.slice(1);
    if (rest.length === 0) {
      // 줄 전체가 마커뿐 — 번역할 내용이 없으므로 빈 텍스트로 반환(뒤에서 길이 필터에 걸려 자동 드롭됨)
      return { text: "", bbox: line.bbox, marker: { text: firstText, bbox: first.bbox } };
    }
    return {
      text: rest.map((w) => w.text).join(" "),
      bbox: { x0: rest[0].bbox.x0, y0: line.bbox.y0, x1: line.bbox.x1, y1: line.bbox.y1 },
      marker: { text: firstText, bbox: first.bbox },
    };
  }

  // Case B: 공백 없이 붙어있는 경우(예: "•Text") — 첫 단어의 심볼을 앞에서부터 훑어 마커 문자만 분리
  const symbols = first.symbols ?? [];
  let markerCount = 0;
  while (markerCount < symbols.length && MARKER_CHAR_REGEX.test(symbols[markerCount].text.trim())) {
    markerCount++;
  }
  if (markerCount > 0 && markerCount < symbols.length) {
    const markerSymbols = symbols.slice(0, markerCount);
    const restSymbols = symbols.slice(markerCount);
    const markerBbox = {
      x0: markerSymbols[0].bbox.x0,
      y0: Math.min(...markerSymbols.map((s) => s.bbox.y0)),
      x1: markerSymbols[markerSymbols.length - 1].bbox.x1,
      y1: Math.max(...markerSymbols.map((s) => s.bbox.y1)),
    };
    const restText = [restSymbols.map((s) => s.text).join(""), ...words.slice(1).map((w) => w.text)]
      .join(" ")
      .trim();
    return {
      text: restText,
      bbox: { x0: restSymbols[0].bbox.x0, y0: line.bbox.y0, x1: line.bbox.x1, y1: line.bbox.y1 },
      marker: { text: markerSymbols.map((s) => s.text).join(""), bbox: markerBbox },
    };
  }

  return { text: line.text, bbox: line.bbox };
}

// 두 bbox가 겹치는 넓이가 a 넓이 대비 얼마나 되는지(0~1) — 반전 패스 중복 제거에 사용.
function bboxOverlapRatio(a: OcrRegion["bbox"], b: OcrRegion["bbox"]): number {
  const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (overlapWidth <= 0 || overlapHeight <= 0) return 0;
  const aArea = Math.max(1, (a.right - a.left) * (a.bottom - a.top));
  return (overlapWidth * overlapHeight) / aArea;
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
    // 높이만 보고 걸러내면 진짜 큰 제목/헤딩까지 오인식 노이즈로 오판할 수 있다 — 글자 수까지 짧을
    // 때만(원래 코드 주석의 예시처럼 화살표가 "4"로 오인식된 경우 등) 걸러낸다.
    const isHeightOutlier = referenceHeight !== null && height > referenceHeight * HEIGHT_OUTLIER_MULTIPLIER;
    const looksLikeMisrecognizedGlyph =
      text.replace(/\s+/g, "").length <= OUTLIER_TEXT_LENGTH_THRESHOLD;
    if (isHeightOutlier && looksLikeMisrecognizedGlyph) continue;

    regions.push({
      bbox: { left: line.bbox.x0, top: line.bbox.y0, right: line.bbox.x1, bottom: line.bbox.y1 },
      text,
      confidence: line.confidence,
      lineHeight: height,
      marker: line.marker
        ? {
            text: line.marker.text,
            bbox: {
              left: line.marker.bbox.x0,
              top: line.marker.bbox.y0,
              right: line.marker.bbox.x1,
              bottom: line.marker.bbox.y1,
            },
          }
        : undefined,
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

  async function recognizeOnce(buffer: Buffer): Promise<OcrRegion[]> {
    const result = await scheduler.addJob("recognize", buffer, {}, { blocks: true });
    const lines: FlatLine[] = [];

    for (const block of result.data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          const split = splitLeadingMarker(line);
          lines.push({
            bbox: split.bbox,
            text: split.text,
            confidence: line.confidence,
            marker: split.marker,
          });
        }
      }
    }

    return filterLines(lines);
  }

  return {
    async extractPageRegions(pageImageBuffer: Buffer): Promise<OcrRegion[]> {
      const normalRegions = await recognizeOnce(pageImageBuffer);

      // 진한 색 배경 위 흰 글씨(강조 색 박스 안 제목 등)는 일반 패스에서 거의 인식되지 않는다 —
      // Tesseract 자체의 한계(README에도 기록된 알려진 한계). 페이지를 색반전한 사본으로 한 번 더
      // OCR을 돌려서(흰 글씨/진한 배경 → 검은 글씨/밝은 배경이 되어 인식률이 올라감) 놓친 글자를
      // 보완한다. 일반 패스에서 이미 잡힌 영역과 겹치는 반전 패스 결과는 버린다 — 일반 텍스트는
      // 원래 패스 쪽이 더 정확하므로 덮어쓰지 않고, 새로 잡힌 영역만 추가한다. 페이지당 OCR을
      // 두 번 돌리는 셈이라 처리 시간이 늘지만(대략 2배), 이 트레이드오프는 감수하기로 함.
      const invertedBuffer = await sharp(pageImageBuffer).negate({ alpha: false }).png().toBuffer();
      const invertedRegions = await recognizeOnce(invertedBuffer);
      const newFromInverted = invertedRegions.filter(
        (inv) => !normalRegions.some((norm) => bboxOverlapRatio(inv.bbox, norm.bbox) > 0.5)
      );

      return [...normalRegions, ...newFromInverted];
    },
    async terminate() {
      await scheduler.terminate();
    },
  };
}

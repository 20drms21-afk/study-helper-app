import sharp from "sharp";
import type { OcrRegion } from "./ocr";

const MIN_FONT_SIZE = 7;
const MAX_FONT_SIZE = 40;
const AVG_CHAR_WIDTH_FACTOR = 0.95; // 한글 완성형 글자는 대체로 정사각형에 가까움
const LINE_HEIGHT_FACTOR = 1.3;
const MEASURED_FONT_FLOOR = 13; // OCR 측정치가 비정상적으로 작게 나올 경우의 최소 가독성 바닥값
const MIN_FONT_RATIO = 0.5; // 그래도 안 맞을 때 줄일 수 있는 최저 한도 = 원본 측정 폰트 크기의 50%(고정 7px 대신 상대값 — 원본이 큰 제목이었으면 번역본도 그에 비례해 어느 정도 크기를 유지해야 함)
const GROWTH_MARGIN = 4; // 아래쪽 영역까지 확장할 때 남겨두는 여백(px)
const MAX_GROWTH_MULTIPLIER = 4; // 원본 줄 높이 대비 최대 몇 배까지 아래로 확장을 허용할지(근처에 아무것도 없다고 페이지 절반을 다 차지하지 않게)
// 실제 샘플 문서로 검증하는 과정에서 1.35배는 한글 음절 사이 간격이 눈에 띄게 벌어져 보였다
// (라틴 문자와 달리 완성형 한글은 음절 하나하나가 이미 꽉 찬 네모틀이라 자간을 조금만 늘려도
// 훨씬 두드러짐) — 두 배율 모두 좁혀서 "약간의 미세 조정" 수준으로만 적용되게 한다.
const MIN_STRETCH_RATIO = 0.85; // textLength로 압축을 허용하는 최소 배율
const MAX_STRETCH_RATIO = 1.15; // textLength로 늘리는 걸 허용하는 최대 배율

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  const charWidth = fontSize * AVG_CHAR_WIDTH_FACTOR;
  const maxChars = Math.max(1, Math.floor(maxWidth / charWidth));
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    // 단어 하나가 그 자체로 너무 길면(긴 합성어 등) 강제로 잘라서 여러 줄에 나눠 담는다.
    if (word.length > maxChars) {
      let rest = word;
      while (rest.length > maxChars) {
        lines.push(rest.slice(0, maxChars));
        rest = rest.slice(maxChars);
      }
      current = rest;
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// 번역 텍스트는 주어진 박스(=OCR이 측정한 원문의 실제 잉크 범위, 필요하면 아래로 확장된 높이 —
// computeGrowthCeiling 참고) 안에 반드시 들어가야 한다. 그래도 안 맞으면 글자 크기를 줄이되,
// 고정 최소값이 아니라 이 영역의 원본 측정 폰트 크기 대비 비율(minFontSize)까지만 줄인다.
function fitTextInBox(
  text: string,
  boxWidth: number,
  boxHeight: number,
  preferredFontSize?: number,
  minFontSize: number = MIN_FONT_SIZE
): { lines: string[]; fontSize: number } {
  let fontSize =
    preferredFontSize ?? Math.min(MAX_FONT_SIZE, Math.max(minFontSize, boxHeight));

  while (fontSize > minFontSize) {
    const lines = wrapText(text, fontSize, boxWidth);
    const totalHeight = lines.length * fontSize * LINE_HEIGHT_FACTOR;
    if (totalHeight <= boxHeight || fontSize <= minFontSize) {
      return { lines, fontSize };
    }
    fontSize = Math.max(minFontSize, fontSize * 0.9);
  }

  return { lines: wrapText(text, minFontSize, boxWidth), fontSize: minFontSize };
}

// 이 영역 아래쪽으로 번역 텍스트가 몇 px까지 더 들어갈 수 있는지를, 페이지의 다른 영역과 겹치지
// 않는 선에서 계산한다. 가로로 30% 이상 겹치면서 바로 아래에 있는 가장 가까운 영역을 만나면 그
// 직전까지, 없으면 페이지 하단까지 — 단 원본 줄 높이의 MAX_GROWTH_MULTIPLIER배는 넘지 않는다.
function computeGrowthCeiling(region: OcrRegion, allRegions: OcrRegion[], pageHeight: number): number {
  let nearestBelowTop = pageHeight;

  for (const other of allRegions) {
    if (other === region) continue;
    if (other.bbox.top < region.bbox.bottom) continue; // 아래쪽에 있는 것만 본다

    const overlapWidth =
      Math.min(region.bbox.right, other.bbox.right) - Math.max(region.bbox.left, other.bbox.left);
    const regionWidth = region.bbox.right - region.bbox.left;
    if (regionWidth <= 0 || overlapWidth / regionWidth < 0.3) continue; // 가로로 충분히 겹칠 때만 "같은 컬럼 아래"로 본다

    nearestBelowTop = Math.min(nearestBelowTop, other.bbox.top);
  }

  const ceiling = Math.max(region.bbox.bottom, nearestBelowTop - GROWTH_MARGIN);
  const maxCeiling = region.bbox.top + Math.max(1, region.lineHeight) * MAX_GROWTH_MULTIPLIER;
  return Math.min(ceiling, maxCeiling);
}

// wrapText가 쓰는 것과 같은 문자 폭 모델로 자연 렌더링 폭을 추정 — textLength 적용 여부/배율을
// 판단할 때 wrapText의 줄바꿈 판단과 어긋나지 않게 하기 위함.
function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * AVG_CHAR_WIDTH_FACTOR;
}

async function extractRaw(
  image: sharp.Sharp,
  imageWidth: number,
  imageHeight: number,
  region: { left: number; top: number; width: number; height: number }
): Promise<{ data: Buffer; width: number; height: number; channels: number } | null> {
  const left = Math.max(0, Math.min(imageWidth - 1, region.left));
  const top = Math.max(0, Math.min(imageHeight - 1, region.top));
  const width = Math.max(1, Math.min(imageWidth - left, region.width));
  const height = Math.max(1, Math.min(imageHeight - top, region.height));

  try {
    const raw = await image.clone().extract({ left, top, width, height }).raw().toBuffer({
      resolveWithObject: true,
    });
    return { data: raw.data, width, height, channels: raw.info.channels };
  } catch {
    return null;
  }
}

// 블록 바로 위쪽 여백에서 로컬 배경색을 샘플링한다 — 페이지 전체가 흰색이라고 가정하지
// 않고, 색깔 있는 박스/헤더 안에 있는 블록이면 그 박스 자체의 색을 잡아낸다.
async function sampleLocalBackground(
  image: sharp.Sharp,
  imageWidth: number,
  imageHeight: number,
  box: { left: number; top: number; width: number }
): Promise<{ color: string }> {
  const sampleHeight = 6;
  const top = Math.max(0, box.top - sampleHeight - 2);
  const region = await extractRaw(image, imageWidth, imageHeight, {
    left: box.left,
    top,
    width: box.width,
    height: sampleHeight,
  });
  if (!region) return { color: "rgb(255, 255, 255)" };

  const { data, width, height, channels } = region;
  let r = 0;
  let g = 0;
  let b = 0;
  const count = width * height;
  for (let i = 0; i < count; i++) {
    const idx = i * channels;
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
  }
  r /= count;
  g /= count;
  b /= count;
  return { color: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})` };
}

export interface RegionTranslationResult {
  index: number;
  skip: boolean;
  translatedText?: string;
}

// 박스 위치/크기는 더 이상 추측하거나 픽셀 스캔으로 보정하지 않는다 — OCR(tesseract.js)이
// 문단 단위로 실측한 바운딩박스를 그대로 커버 사각형으로 쓰고, 폰트 크기도 OCR이 실측한
// 줄 높이에서 직접 도출한다. Claude는 이 박스들에 대해 번역/스킵 판단만 내린다.
export async function overlayTranslation(
  pageImageBuffer: Buffer,
  width: number,
  height: number,
  regions: OcrRegion[],
  results: RegionTranslationResult[]
): Promise<Buffer> {
  const base = sharp(pageImageBuffer);
  const resultByIndex = new Map(results.map((r) => [r.index, r]));

  const svgParts: string[] = [];
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const result = resultByIndex.get(i);
    const translatedText = result?.translatedText?.trim();
    if (!result || result.skip || !translatedText) continue;

    const boxLeft = region.bbox.left;
    const boxTop = region.bbox.top;
    const boxWidth = Math.max(1, region.bbox.right - region.bbox.left);
    const originalRegionHeight = Math.max(1, region.bbox.bottom - region.bbox.top);

    // 박스 높이는 원본 한 줄 높이로 고정하지 않는다 — 번역문이 2줄 이상으로 줄바꿈되면, 페이지의
    // 다른 영역과 겹치지 않는 선에서 아래로 확장할 수 있는 만큼 확장한다(computeGrowthCeiling).
    // "번역이 길어지면 무조건 글자를 작게 줄인다"는 이전 방식 대신, 여백이 있으면 그 여백을 먼저
    // 쓰고 정말 자리가 없을 때만 글자를 줄인다.
    const growthCeiling = computeGrowthCeiling(region, regions, height);
    const boxHeight = Math.max(originalRegionHeight, growthCeiling - boxTop);

    const { color: bgColor } = await sampleLocalBackground(base, width, height, {
      left: boxLeft,
      top: boxTop,
      width: boxWidth,
    });

    // 0.85배로 축소하던 이전 계수는 번역본 글자가 원본보다 눈에 띄게 작아 보인다는 피드백을
    // 받아 제거함 — OCR이 잰 줄 높이를 그대로 폰트 크기로 써서 원문 글자 크기에 맞춘다.
    const preferredFontSize =
      region.lineHeight > 0
        ? Math.min(MAX_FONT_SIZE, Math.max(MEASURED_FONT_FLOOR, Math.round(region.lineHeight)))
        : undefined;

    // 그래도 안 맞아서 줄여야 할 때도 원본 측정 폰트 크기의 절반 밑으로는 내려가지 않는다
    // (고정 7px 바닥은 원본이 큰 제목이었을 때 형평에 안 맞음).
    const minFontSize =
      preferredFontSize != null
        ? Math.max(MIN_FONT_SIZE, Math.round(preferredFontSize * MIN_FONT_RATIO))
        : MIN_FONT_SIZE;

    const { lines, fontSize } = fitTextInBox(
      translatedText,
      boxWidth,
      boxHeight,
      preferredFontSize,
      minFontSize
    );
    const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
    const textStartY = boxTop + fontSize;
    // 배경 사각형은 원본 잉크 영역은 항상 덮되(원문이 항상 지워지도록), 확장 필요분만큼만 더 키운다
    // — growthCeiling까지 무조건 다 덮어버리면 아래쪽 다른 텍스트 위까지 배경색을 씌울 수 있다.
    const renderedHeight = Math.max(originalRegionHeight, Math.min(boxHeight, lines.length * lineHeight));

    svgParts.push(
      `<rect x="${boxLeft}" y="${boxTop}" width="${boxWidth}" height="${renderedHeight}" fill="${bgColor}" />`
    );

    // 한 줄로 끝나는 번역은 원본 박스 폭에 맞춰 textLength로 늘리거나 줄인다 — 번역문이 원문보다
    // 짧아서 생기는 어색한 빈 공간(특히 바로 옆에 손대지 않은 한글이 있을 때)을 줄이기 위함.
    // 배율이 너무 크거나 작으면(0.7~1.35배 밖) 오히려 자간이 부자연스러워 보이므로 적용하지 않고
    // 자연 폭 그대로 둔다. 2줄 이상 줄바꿈된 경우는 문단 전체를 양쪽정렬하면 부자연스러우므로
    // 적용하지 않는다.
    let stretchAttr = "";
    if (lines.length === 1) {
      const naturalWidth = estimateTextWidth(lines[0], fontSize);
      const stretchRatio = naturalWidth > 0 ? boxWidth / naturalWidth : 1;
      if (stretchRatio >= MIN_STRETCH_RATIO && stretchRatio <= MAX_STRETCH_RATIO) {
        stretchAttr = ` textLength="${boxWidth}" lengthAdjust="spacingAndGlyphs"`;
      }
    }

    const tspans = lines
      .map(
        (line, li) =>
          `<tspan x="${boxLeft}" y="${textStartY + li * lineHeight}"${stretchAttr}>${escapeXml(line)}</tspan>`
      )
      .join("");
    svgParts.push(
      `<text font-family="sans-serif" font-size="${fontSize}" fill="#111111">${tspans}</text>`
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svgParts.join("")}</svg>`;

  return base
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

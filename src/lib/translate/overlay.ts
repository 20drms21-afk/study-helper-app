import sharp from "sharp";
import type { OcrRegion } from "./ocr";

const MIN_FONT_SIZE = 7;
const MAX_FONT_SIZE = 40;
const AVG_CHAR_WIDTH_FACTOR = 0.95; // 한글 완성형 글자는 대체로 정사각형에 가까움
const LINE_HEIGHT_FACTOR = 1.3;
const MEASURED_FONT_FLOOR = 13; // OCR 측정치가 비정상적으로 작게 나올 경우의 최소 가독성 바닥값

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

// 번역 텍스트는 주어진 박스(=OCR이 측정한 원문의 실제 잉크 범위) 안에 반드시 들어가야 한다 —
// 안 맞으면 박스를 키우는 게 아니라 글자 크기를 계속 줄인다(최후에는 MIN_FONT_SIZE까지).
function fitTextInBox(
  text: string,
  boxWidth: number,
  boxHeight: number,
  preferredFontSize?: number
): { lines: string[]; fontSize: number } {
  let fontSize =
    preferredFontSize ?? Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, boxHeight));

  while (fontSize > MIN_FONT_SIZE) {
    const lines = wrapText(text, fontSize, boxWidth);
    const totalHeight = lines.length * fontSize * LINE_HEIGHT_FACTOR;
    if (totalHeight <= boxHeight || fontSize <= MIN_FONT_SIZE) {
      return { lines, fontSize };
    }
    fontSize = Math.max(MIN_FONT_SIZE, fontSize * 0.9);
  }

  return { lines: wrapText(text, MIN_FONT_SIZE, boxWidth), fontSize: MIN_FONT_SIZE };
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
    const boxHeight = Math.max(1, region.bbox.bottom - region.bbox.top);

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

    // 박스는 OCR이 측정한 원문의 실제 범위로 고정 — 번역 텍스트가 안 맞으면 박스를 키우는
    // 게 아니라 fitTextInBox 안에서 글자 크기를 계속 줄인다.
    const { lines, fontSize } = fitTextInBox(translatedText, boxWidth, boxHeight, preferredFontSize);
    const lineHeight = fontSize * LINE_HEIGHT_FACTOR;
    const textStartY = boxTop + fontSize;

    svgParts.push(
      `<rect x="${boxLeft}" y="${boxTop}" width="${boxWidth}" height="${boxHeight}" fill="${bgColor}" />`
    );
    const tspans = lines
      .map(
        (line, li) =>
          `<tspan x="${boxLeft}" y="${textStartY + li * lineHeight}">${escapeXml(line)}</tspan>`
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

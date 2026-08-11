import path from "path";
import { openSync, type Font } from "fontkit";
import type { SummaryContent } from "@/lib/prompts/summarize";

// SummaryNotePdf.tsx의 2단 레이아웃 치수와 반드시 맞춰야 함(styles 변경 시 이 상수들도 갱신할 것).
const PAGE_WIDTH = 595.28; // A4, pt
const PAGE_HEIGHT = 841.89;
const PAGE_PADDING = 40;
const TITLE_HEIGHT = 18 * 1.3 + 20; // fontSize 18 + marginBottom 20의 대략치
const COLUMN_GAP = 16;
const BOX_PADDING = 10;
const BULLET_DOT_WIDTH = 10;

const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2;
const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2;
const INNER_WIDTH = COLUMN_WIDTH - BOX_PADDING * 2;
const BULLET_TEXT_WIDTH = INNER_WIDTH - BULLET_DOT_WIDTH;
const COLUMN_HEIGHT_BUDGET = PAGE_HEIGHT - PAGE_PADDING * 2 - TITLE_HEIGHT;

type FontWeight = "normal" | "bold";

let regularFont: Font | null = null;
let boldFont: Font | null = null;

function getFont(weight: FontWeight): Font {
  if (weight === "bold") {
    if (!boldFont) {
      boldFont = openSync(
        path.join(process.cwd(), "public", "fonts", "NanumGothic-Bold.ttf")
      ) as Font;
    }
    return boldFont;
  }
  if (!regularFont) {
    regularFont = openSync(
      path.join(process.cwd(), "public", "fonts", "NanumGothic-Regular.ttf")
    ) as Font;
  }
  return regularFont;
}

// NanumGothic 실제 글리프 폭으로 렌더링 폭을 재서(고정폭 문자수 어림짐작이 아니라)
// 줄바꿈 라인 수를 추정한다 — 한/영 혼용 텍스트라 문자당 폭 편차가 커서 대략치로는
// 좌/우 단 배분이 쉽게 틀어짐.
function textWidth(text: string, fontSize: number, weight: FontWeight): number {
  const font = getFont(weight);
  return (font.layout(text).advanceWidth / font.unitsPerEm) * fontSize;
}

function countWrappedLines(
  text: string,
  fontSize: number,
  maxWidth: number,
  weight: FontWeight = "normal"
): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const words = trimmed.split(/\s+/);
  const spaceWidth = textWidth(" ", fontSize, weight);
  let lines = 1;
  let lineWidth = 0;

  for (const word of words) {
    const wordWidth = textWidth(word, fontSize, weight);

    if (wordWidth > maxWidth) {
      // 공백 없이 한 줄 폭을 넘는 토큰(긴 URL, 붙어있는 한글 구절 등) — 글자 단위로 강제 개행.
      let chunk = "";
      for (const ch of word) {
        if (chunk && textWidth(chunk + ch, fontSize, weight) > maxWidth) {
          lines += 1;
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      lineWidth = textWidth(chunk, fontSize, weight);
      continue;
    }

    const nextWidth = lineWidth === 0 ? wordWidth : lineWidth + spaceWidth + wordWidth;
    if (nextWidth > maxWidth) {
      lines += 1;
      lineWidth = wordWidth;
    } else {
      lineWidth = nextWidth;
    }
  }

  return lines;
}

function estimateSectionHeight(section: SummaryContent["sections"][number]): number {
  let height = BOX_PADDING * 2; // sectionBox 상하 padding

  const headingLines = countWrappedLines(section.heading, 11, INNER_WIDTH, "bold");
  height += headingLines * (11 * 1.2) + 6; // heading 줄 + marginBottom

  for (const bullet of section.bullets) {
    const lines = countWrappedLines(bullet, 9, BULLET_TEXT_WIDTH, "normal");
    height += lines * (9 * 1.4) + 3; // bulletRow marginBottom
  }

  if (section.body) {
    const lines = countWrappedLines(section.body, 9, INNER_WIDTH, "normal");
    height += lines * (9 * 1.4) + 4; // bodyText marginTop
  }

  height += 12; // sectionBox marginBottom
  return height;
}

/**
 * 왼쪽 단을 실제 페이지 높이만큼 위→아래로 꽉 채우고, 거기서 넘치는 섹션만 오른쪽
 * 단으로 보낸다(균등 반으로 자르지 않음). 전체 내용이 왼쪽 단 하나에 다 들어가면
 * 오른쪽 단은 비워둔 채로 끝 — 억지로 두 단에 나눠 채우지 않는다.
 */
export function splitSectionsIntoColumns(sections: SummaryContent["sections"]) {
  const left: SummaryContent["sections"] = [];
  const right: SummaryContent["sections"] = [];
  let leftHeight = 0;
  let overflowed = false;

  for (const section of sections) {
    const height = estimateSectionHeight(section);
    if (!overflowed && (left.length === 0 || leftHeight + height <= COLUMN_HEIGHT_BUDGET)) {
      left.push(section);
      leftHeight += height;
    } else {
      overflowed = true;
      right.push(section);
    }
  }

  return { left, right };
}

import path from "path";
import { openSync, type Font } from "fontkit";
import type { SummaryContent } from "@/lib/prompts/summarize";

// SummaryNotePdf.tsx의 2단 레이아웃 치수와 반드시 맞춰야 함(styles 변경 시 이 상수들도 갱신할 것).
const PAGE_WIDTH = 595.28; // A4, pt
const PAGE_HEIGHT = 841.89;
// 페이지 상하좌우 여백 — 좁게(구 40). 페이지 크기는 항상 A4로 고정하고 이 여백만 줄인다.
const PAGE_PADDING = 24;
const TITLE_HEIGHT = 18 * 1.3 + 20; // fontSize 18 + marginBottom 20의 대략치
const COLUMN_GAP = 16;
const BOX_PADDING = 10;
const BULLET_DOT_WIDTH = 10;

const CONTENT_WIDTH = PAGE_WIDTH - PAGE_PADDING * 2;
const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2;
const INNER_WIDTH = COLUMN_WIDTH - BOX_PADDING * 2;
const BULLET_TEXT_WIDTH = INNER_WIDTH - BULLET_DOT_WIDTH;

// 높이 추정 오차로 단이 실제로 넘쳐서 react-pdf가 "왼쪽 단이 빈" 페이지를 새로
// 만들어버리지 않도록 두는 여유분.
const COLUMN_HEIGHT_SAFETY = 24;
// 1페이지는 상단 제목이 두 단 위를 차지하므로 단 높이 예산이 그만큼 작다.
const FIRST_PAGE_COLUMN_BUDGET =
  PAGE_HEIGHT - PAGE_PADDING * 2 - TITLE_HEIGHT - COLUMN_HEIGHT_SAFETY;
// 2페이지부터는 제목이 없어 예산이 더 크다.
const REST_PAGE_COLUMN_BUDGET = PAGE_HEIGHT - PAGE_PADDING * 2 - COLUMN_HEIGHT_SAFETY;

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

export type SummaryColumnPage = {
  left: SummaryContent["sections"];
  right: SummaryContent["sections"];
};

/**
 * 섹션을 A4 페이지들에 신문 단 흐름으로 배치한다:
 * 1페이지 왼쪽 단을 페이지 높이만큼 채움 → 1페이지 오른쪽 단 → 2페이지 왼쪽 단 →
 * 2페이지 오른쪽 단 → … 섹션이 떨어질 때까지 반복. 페이지 크기(A4)는 절대 줄이지
 * 않고, 한 단이 차면 항상 다음 단/다음 페이지로 넘긴다(균등 반으로 자르지 않음).
 * 내용이 1페이지 왼쪽 단에 다 들어가면 페이지 하나에 오른쪽 단이 빈 채로 끝난다.
 */
export function splitSectionsIntoColumns(
  sections: SummaryContent["sections"]
): SummaryColumnPage[] {
  const pages: SummaryColumnPage[] = [{ left: [], right: [] }];
  let col: "left" | "right" = "left";
  let colHeight = 0;

  for (const section of sections) {
    const height = estimateSectionHeight(section);
    let page = pages[pages.length - 1];
    const budget =
      pages.length === 1 ? FIRST_PAGE_COLUMN_BUDGET : REST_PAGE_COLUMN_BUDGET;

    // 빈 단에는 (한 섹션이 예산보다 커도) 무조건 하나는 넣는다 — 안 그러면 무한 루프.
    const fits = page[col].length === 0 || colHeight + height <= budget;
    if (!fits) {
      if (col === "left") {
        col = "right";
      } else {
        pages.push({ left: [], right: [] });
        page = pages[pages.length - 1];
        col = "left";
      }
      colHeight = 0;
    }

    page[col].push(section);
    colHeight += height;
  }

  return pages;
}

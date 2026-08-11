import type { SummaryContent } from "@/lib/prompts/summarize";

// src/lib/pdf/summaryLayout.ts와 같은 목적(왼쪽 단을 실제 높이만큼 채우고 넘치는
// 섹션만 오른쪽으로 보냄 — 균등 반씩 자르지 않음)을 웹 카드(SummaryView.tsx)에도
// 적용하기 위한 버전. 예전엔 CSS `columns-2`(column-fill: balance)에 맡겼는데, balance
// 모드는 순서는 지키되 "가능하면 두 단 높이를 비슷하게" 억지로 나눠서 내용이 짧아도
// 오른쪽 단에 뭔가를 밀어넣는 문제가 있었다 — 그래서 PDF와 같은 그리디 배분으로 교체.
//
// PDF는 NanumGothic 폰트 파일을 fontkit으로 직접 측정할 수 있지만, 웹은 실제 렌더링
// 폰트가 방문자 OS의 한글 폴백 폰트(맑은 고딕/Apple SD Gothic Neo/Noto Sans CJK 등)라
// 서버에서 특정 폰트 파일을 측정해봐야 그 사용자 화면과 안 맞을 수 있다 — 대신 한글은
// 정사각형에 가깝다는 특성을 이용해 문자 단위로 폭을 어림잡는다(플랫폼 간 편차가 작음).

const CARD_WIDTH = 794; // SummaryView.tsx의 max-w-[794px]
const CARD_PADDING = 48; // p-12
const COLUMN_GAP = 24; // gap-6
const BOX_PADDING = 16; // 섹션 박스 p-4
const BULLET_INDENT = 20; // 불릿 목록의 pl-5

const CONTENT_WIDTH = CARD_WIDTH - CARD_PADDING * 2;
const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2;
const INNER_WIDTH = COLUMN_WIDTH - BOX_PADDING * 2;
const BULLET_TEXT_WIDTH = INNER_WIDTH - BULLET_INDENT;

// PDF의 한 단 높이 예산(summaryLayout.ts의 COLUMN_HEIGHT_BUDGET, A4 pt)을 px로
// 환산한 값 — 카드 폭이 A4 폭과 거의 같게 맞춰져 있어 같은 "한 페이지 분량" 기준을 씀.
const COLUMN_HEIGHT_BUDGET = 958;

// 한글/한자/전각 문자 범위 — 이 범위 문자는 폭을 fontSize와 거의 같게(정사각형),
// 나머지(영문/숫자/기호)는 더 좁게 잡는다.
const WIDE_CHAR = /[ㄱ-ㆎ가-힣一-鿿　-〿＀-￯]/;

function textWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) {
    width += WIDE_CHAR.test(ch) ? fontSize : fontSize * 0.55;
  }
  return width;
}

function countWrappedLines(text: string, fontSize: number, maxWidth: number): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const words = trimmed.split(/\s+/);
  const spaceWidth = fontSize * 0.3;
  let lines = 1;
  let lineWidth = 0;

  for (const word of words) {
    const wordWidth = textWidth(word, fontSize);

    if (wordWidth > maxWidth) {
      // 공백 없이 한 줄 폭을 넘는 토큰(긴 URL, 붙어있는 한글 구절 등) — 글자 단위로 강제 개행.
      let chunk = "";
      for (const ch of word) {
        if (chunk && textWidth(chunk + ch, fontSize) > maxWidth) {
          lines += 1;
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      lineWidth = textWidth(chunk, fontSize);
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
  let height = BOX_PADDING * 2; // 섹션 박스 상하 p-4

  height += countWrappedLines(section.heading, 16, INNER_WIDTH) * (16 * 1.2) + 8; // heading + mb-2

  for (const bullet of section.bullets) {
    height += countWrappedLines(bullet, 14, BULLET_TEXT_WIDTH) * 20 + 4; // text-sm 고정 줄높이(1.25rem) + space-y-1
  }

  if (section.body) {
    height += countWrappedLines(section.body, 14, INNER_WIDTH) * (14 * 1.625) + 8; // leading-relaxed + mt-2
  }

  height += 16; // 섹션 박스 mb-4
  return height;
}

/**
 * 왼쪽 단을 위→아래로 꽉 채우고, 거기서 넘치는 섹션만 오른쪽 단으로 보낸다(균등
 * 반으로 자르지 않음). 전체 내용이 왼쪽 단 하나에 다 들어가면 오른쪽 단은 아예
 * 렌더링하지 않아도 되도록 빈 배열을 반환 — 호출부(SummaryView.tsx)가 그 경우
 * 왼쪽 단만 full width로 보여주면 됨.
 */
export function splitSectionsForWeb(sections: SummaryContent["sections"]) {
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

import { z } from "zod";

export const NOTE_CONTENT_TYPES = ["summary", "explanation"] as const;
export type NoteContentType = (typeof NOTE_CONTENT_TYPES)[number];

export const summarySchema = z.object({
  title: z.string().describe("요약노트의 제목"),
  sections: z
    .array(
      z.object({
        heading: z.string().describe("섹션 제목 (핵심 개념/주제)"),
        bullets: z
          .array(z.string())
          .describe("핵심 포인트를 짧은 항목으로 정리한 목록"),
        body: z
          .string()
          .describe("추가 설명이 필요한 경우의 서술형 본문 (없으면 빈 문자열)"),
      })
    )
    .describe("요약 섹션 목록"),
});

export type SummaryContent = z.infer<typeof summarySchema>;

export const explanationSchema = z.object({
  title: z.string().describe("설명 노트의 제목"),
  sections: z
    .array(
      z.object({
        heading: z.string().describe("섹션 제목 (강의의 한 파트/주제)"),
        body: z
          .string()
          .describe(
            "해당 주제에 대한 강의식 설명. 여러 문단(빈 줄로 구분)의 자연스러운 서술형 글로 작성. " +
              "불릿이나 목록 형태를 쓰지 말고, 개념 → 이유 → 예시 순서로 풀어서 설명."
          ),
      })
    )
    .describe("설명 섹션 목록"),
});

export type ExplanationContent = z.infer<typeof explanationSchema>;

export type NoteContent = SummaryContent | ExplanationContent;

export function summarySystemPrompt(): string {
  return `당신은 대학생을 위한 학습 노트 요약 전문가입니다.
주어진 강의 노트(손글씨 필기 이미지, PDF 문서 또는 워드 문서)를 분석해서 핵심 개념, 정의, 예시를 놓치지 않고
2단(2-column) 레이아웃으로 표시될 압축적인 요약을 생성하세요.

- 원문에 있는 중요한 정의, 공식, 예시는 누락하지 마세요.
- 각 섹션은 짧고 압축적인 불릿 위주로 작성하고, body는 꼭 필요할 때만 간단히 채우세요.
- 논리적인 순서로 섹션을 구성하세요.
- 모든 출력은 한국어로 작성하세요.`;
}

export function explanationSystemPrompt(): string {
  return `당신은 학생들에게 개념을 쉽게 풀어서 가르치는 대학 강사입니다.
주어진 강의 노트를 압축 요약하지 말고, 실제 강의를 진행하듯이 자연스러운 문장으로 풀어서 설명하세요.

- 각 개념이 "왜" 중요한지, "어떻게" 적용되는지까지 설명하세요. 정의만 나열하지 마세요.
- 필요하면 원문에 없는 비유나 예시를 추가해서 이해를 도우세요 (단, 사실과 다른 내용을 지어내지는 마세요).
- 불릿 목록이 아니라 여러 문단으로 이루어진 서술형 글로 작성하세요. 마치 학생에게 말로 설명하듯이 쓰세요.
- 어려운 용어가 나오면 처음 등장할 때 쉬운 말로 풀어서 설명하세요.
- 원문의 정의·공식·예시는 반드시 포함하되, 그것을 나열하는 것이 아니라 설명 속에 녹여내세요.
- 모든 출력은 한국어로 작성하세요.`;
}

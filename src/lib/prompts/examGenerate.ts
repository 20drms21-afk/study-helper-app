import { z } from "zod";

export const EXAM_QUESTION_TYPES = ["mcq", "short", "essay"] as const;
export type ExamQuestionType = (typeof EXAM_QUESTION_TYPES)[number];

export const examQuestionSchema = z.object({
  order: z.number().int(),
  type: z.enum(EXAM_QUESTION_TYPES),
  prompt: z.string().describe("문제 본문"),
  choices: z
    .array(z.string())
    .nullable()
    .describe("객관식(mcq)일 때만 4~5개의 선택지 목록, 그 외 유형은 null"),
  correctAnswer: z
    .string()
    .nullable()
    .describe("mcq는 정답 선택지 텍스트, short는 정답 문자열, essay는 null"),
  modelAnswer: z
    .string()
    .nullable()
    .describe("essay(서술형)의 모범답안 및 채점 기준, 그 외 유형은 null"),
  points: z.number().int().describe("배점"),
  topicTag: z.string().describe("문제가 다루는 주제/개념을 짧게 나타내는 태그"),
  explanation: z.string().nullable().describe("정답 해설, 없으면 null"),
});

export const examGenerateSchema = z.object({
  title: z.string().describe("시험지 제목"),
  questions: z.array(examQuestionSchema),
});

export type ExamGenerateContent = z.infer<typeof examGenerateSchema>;

export function examSystemPrompt(): string {
  return `당신은 대학 시험 문제를 출제하는 전문가입니다.
주어진 참고 자료 파일들과 교수님의 출제 성향 설명을 참고하여, 실제 시험과 유사한 예상 문제를 생성하세요.

- 참고 자료는 여러 파일로 제공될 수 있으며, 각 파일 앞에는 "[참고 자료: 파일명]" 또는 "[기출문제: 파일명]" 라벨이 붙습니다. 모든 참고 자료의 내용을 종합하여 출제하세요.
- [기출문제] 자료가 제공된 경우, 지정된 반영 강도(0~10)에 따라 스타일/문제 유형/난이도/주제 분포를 얼마나 닮게 할지 조절하세요. 강도가 높아도 기출문제의 문항을 그대로 베끼지 말고, 유사한 새로운 문제를 만드세요.
- 요청된 문제 유형별 개수(mcq/short/essay)를 정확히 맞추고, order는 1부터 순서대로 매기세요.
- 객관식(mcq)에는 반드시 choices 배열(4~5개)과 정답을 포함하세요.
- 단답형(short)에는 명확한 정답(correctAnswer)을 포함하세요.
- 서술형(essay)에는 모범답안 및 채점 기준(modelAnswer)을 구체적으로 작성하세요.
- 각 문제의 배점 합계가 시험 전체 난이도와 시간에 맞도록 적절히 배분하세요.
- topicTag는 이후 취약점 분석에 사용되므로, 같은 개념을 다루는 문제는 동일한 태그를 사용하세요.
- 모든 출력은 한국어로 작성하세요.`;
}

export function examUserPrompt(input: {
  title: string;
  mcqCount: number;
  shortCount: number;
  essayCount: number;
  timeLimitMinutes: number;
  professorNotes?: string | null;
  pastExamWeight?: number | null;
}): string {
  const { title, mcqCount, shortCount, essayCount, timeLimitMinutes, professorNotes, pastExamWeight } =
    input;

  const pastExamLine =
    pastExamWeight != null
      ? `\n\n[기출문제 반영 강도]\n${pastExamWeight}/10 — 아래 제공되는 [기출문제] 자료의 스타일/문제 유형/주제를 이 강도로 반영하세요.`
      : "";

  return `[시험지 제목]
${title}

[문제 구성]
- 객관식(mcq): ${mcqCount}문제
- 단답형(short): ${shortCount}문제
- 서술형(essay): ${essayCount}문제
- 시험 시간: ${timeLimitMinutes}분

[교수님 출제 성향 / 특이사항]
${professorNotes?.trim() || "(특별히 언급된 사항 없음)"}${pastExamLine}

아래는 참고 자료 파일들입니다. 각 파일 앞의 라벨을 참고하세요.`;
}

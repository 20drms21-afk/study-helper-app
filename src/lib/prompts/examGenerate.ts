import { z } from "zod";

export const EXAM_QUESTION_TYPES = ["mcq", "short", "essay"] as const;
export type ExamQuestionType = (typeof EXAM_QUESTION_TYPES)[number];

const QUESTION_TYPE_LABEL: Record<ExamQuestionType, string> = {
  mcq: "객관식",
  short: "단답형",
  essay: "서술형",
};

// ── 난이도(인지적 난이도)와 기출 반영도는 같은 0~10 스케일을 쓰지만 서로 완전히 다른 축이다.
// 둘 다 숫자만 AI에 넘기면 모델마다/호출마다 숫자 해석이 흔들리므로, 구간별 구체적인 기준
// (rubric)을 텍스트로 명시해서 UI 설명과 프롬프트가 항상 같은 기준을 쓰도록 한다.
export const EXAM_DIFFICULTY_MIN = 0;
export const EXAM_DIFFICULTY_MAX = 10;
export const EXAM_DIFFICULTY_DEFAULT = 5;

export interface DifficultyBand {
  min: number;
  max: number;
  label: string;
  rubric: string;
}

export const DIFFICULTY_BANDS: DifficultyBand[] = [
  {
    min: 0,
    max: 2,
    label: "매우 쉬움",
    rubric:
      "개념·정의·용어를 직접 확인하는 문제 중심. 공식이나 정의를 그대로 대입하면 풀리며, 별도의 해석이나 추론 없이 바로 답을 찾을 수 있어야 한다.",
  },
  {
    min: 3,
    max: 4,
    label: "기본",
    rubric:
      "기본 개념을 단순한 상황에 적용하는 문제 중심. 개념을 그대로 적용하되 약간의 계산이나 치환 정도는 필요할 수 있다.",
  },
  {
    min: 5,
    max: 6,
    label: "보통",
    rubric:
      "개념을 새로운 상황에 응용하는 문제 중심. 조건을 해석해서 어떤 개념을 적용할지 스스로 판단해야 하며, 단순 대입만으로는 풀리지 않는다.",
  },
  {
    min: 7,
    max: 8,
    label: "어려움",
    rubric:
      "단순 암기나 직접적인 공식 대입으로 해결되지 않으며, 2개 이상의 개념을 연결하거나 여러 단계의 추론이 필요한 문제 중심으로 출제한다.",
  },
  {
    min: 9,
    max: 10,
    label: "최상위",
    rubric:
      "정해진 풀이 절차가 주어지지 않아 해결 전략 자체를 스스로 설계해야 하는 고난도 통합·변형 문제 중심. 여러 단원/개념을 통합적으로 연결해야 한다.",
  },
];

export function describeDifficulty(value: number): DifficultyBand {
  return (
    DIFFICULTY_BANDS.find((band) => value >= band.min && value <= band.max) ??
    DIFFICULTY_BANDS[2]
  );
}

interface WeightBand {
  min: number;
  max: number;
  description: string;
}

const PAST_EXAM_WEIGHT_BANDS: WeightBand[] = [
  { min: 0, max: 0, description: "기출문제를 사실상 반영하지 않습니다 — 참고만 하고 문제 스타일에 영향을 주지 마세요." },
  { min: 1, max: 2, description: "시험 범위나 전반적인 형식 정도만 참고하세요." },
  { min: 3, max: 4, description: "일부 문제 유형과 빈출 개념 정도만 참고하세요." },
  { min: 5, max: 6, description: "문제 구조, 빈출 개념, 출제 경향을 중간 수준으로 반영하세요." },
  { min: 7, max: 8, description: "교수님의 반복적인 문제 유형, 문제 구성 방식, 빈출 개념을 적극 반영하세요." },
  {
    min: 9,
    max: 10,
    description:
      "기출의 출제 철학, 문제 구조, 문체, 사고방식을 최대한 재현하되, 문제 자체는 새롭게 생성하고 그대로 복제하지 마세요.",
  },
];

export function describePastExamWeight(value: number): string {
  return (
    PAST_EXAM_WEIGHT_BANDS.find((band) => value >= band.min && value <= band.max) ??
    PAST_EXAM_WEIGHT_BANDS[3]
  ).description;
}

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
  explanation: z
    .string()
    .nullable()
    .describe(
      "정답 해설. 이 문제가 검증하는 핵심 개념이 무엇인지 짚어주고, 계산이 필요한 문제라면 어느 단계에서 실수하기 쉬운지도 함께 언급하세요(오답 시 학생에게 그대로 피드백으로 노출됩니다). 해설이 꼭 필요하지 않으면 null."
    ),
  sourceLocation: z
    .string()
    .nullable()
    .describe(
      "이 문제가 다루는 개념이 참고 자료의 어느 파일 몇 페이지에 나오는지. 실제로 문서에서 페이지 번호를 확인할 수 있을 때만 '파일명 N페이지' 형식으로 작성하세요. 페이지 번호를 확신할 수 없으면 파일명만 적고, 그것도 불확실하면 반드시 null로 두세요 — 페이지 번호를 추측해서 지어내지 마세요."
    ),
});

export const examGenerateSchema = z.object({
  title: z.string().describe("시험지 제목"),
  questions: z.array(examQuestionSchema),
});

export type ExamGenerateContent = z.infer<typeof examGenerateSchema>;

// ── Exam Blueprint ──────────────────────────────────────────────────────────
// 문제를 바로 생성하지 않고, 먼저 "문제별로 시험 시간을 어떻게 배분할지"만 설계하는 1단계.
// 여기서 정하는 건 난이도가 아니라 각 문제의 예상 풀이 시간(=요구되는 풀이량/깊이)이다 —
// 시험시간이 길다고 난이도를 올리는 대신, 같은 난이도 안에서 문제 하나의 분량을 조절하기
// 위한 명시적인 축으로 분리했다.
export const examBlueprintItemSchema = z.object({
  order: z.number().int().describe("문제 순서 (1부터, 유형 구분 없이 전체 통틀어서)"),
  type: z.enum(EXAM_QUESTION_TYPES),
  estimatedMinutes: z.number().describe("이 문제에 배정하는 예상 풀이 시간(분), 소수점 가능"),
  focus: z.string().describe("이 문제가 다뤄야 할 범위나 역할에 대한 한 줄 메모"),
});
export type ExamBlueprintItem = z.infer<typeof examBlueprintItemSchema>;

export const examBlueprintSchema = z.object({
  items: z.array(examBlueprintItemSchema),
});
export type ExamBlueprint = z.infer<typeof examBlueprintSchema>;

// AI 블루프린트 호출이 실패하거나(네트워크 오류 등) 요청한 문제 유형별 개수와 맞지 않게
// 나왔을 때 쓰는 결정론적 폴백 — 유형별 가중치로 시험 시간을 배분한다(서술형이 보통 더
// 오래 걸리는 경향을 반영한 대략치일 뿐, 실제로는 AI가 기출 자료 등을 보고 더 정교하게 배분함).
const FALLBACK_TYPE_WEIGHT: Record<ExamQuestionType, number> = { mcq: 1, short: 1.5, essay: 3 };

export function buildFallbackBlueprint(
  mcqCount: number,
  shortCount: number,
  essayCount: number,
  timeLimitMinutes: number
): ExamBlueprintItem[] {
  const counts: [ExamQuestionType, number][] = [
    ["mcq", mcqCount],
    ["short", shortCount],
    ["essay", essayCount],
  ];
  const totalWeight = counts.reduce(
    (sum, [type, count]) => sum + FALLBACK_TYPE_WEIGHT[type] * count,
    0
  );

  const items: ExamBlueprintItem[] = [];
  let order = 1;
  let allocated = 0;

  for (const [type, count] of counts) {
    for (let i = 0; i < count; i++) {
      const raw = totalWeight > 0 ? (timeLimitMinutes * FALLBACK_TYPE_WEIGHT[type]) / totalWeight : 0;
      const minutes = Math.round(raw * 10) / 10;
      items.push({ order, type, estimatedMinutes: minutes, focus: "" });
      allocated += minutes;
      order += 1;
    }
  }

  // 반올림 오차를 마지막 문제에서 보정해서 합계를 시험 시간과 정확히 맞춘다.
  if (items.length > 0) {
    const diff = Math.round((timeLimitMinutes - allocated) * 10) / 10;
    const last = items[items.length - 1];
    last.estimatedMinutes = Math.max(1, Math.round((last.estimatedMinutes + diff) * 10) / 10);
  }

  return items;
}

export function blueprintMatchesCounts(
  blueprint: ExamBlueprintItem[],
  mcqCount: number,
  shortCount: number,
  essayCount: number
): boolean {
  const actual = { mcq: 0, short: 0, essay: 0 };
  for (const item of blueprint) actual[item.type] += 1;
  return actual.mcq === mcqCount && actual.short === shortCount && actual.essay === essayCount;
}

export function examBlueprintSystemPrompt(): string {
  return `당신은 대학 시험의 출제 계획(Blueprint)을 설계하는 전문가입니다.
아직 실제 문제를 만들지 말고, 각 문제에 시험 시간을 어떻게 배분할지와 각 문제가 맡을 역할만 설계하세요.

- 요청된 문제 유형별 개수(mcq/short/essay)와 정확히 같은 개수의 항목을 만드세요. order는 유형 구분 없이 1부터 전체를 통틀어 순서대로 매기세요.
- 항목별 estimatedMinutes의 합은 전체 시험 시간과 (반올림 오차 이내로) 일치해야 합니다.
- 모든 문제를 똑같은 시간으로 나눌 필요는 없습니다 — 실제 시험처럼 문제의 역할/비중에 따라 시간을 다르게 배분하세요. 일반적으로 mcq는 짧게, essay는 길게 배정되는 경향이 있지만 절대적인 규칙은 아닙니다.
- [기출문제] 자료가 제공된 경우, 그 자료에서 문제별 배점·분량·구성 방식이 드러난다면 최대한 분석해서 시간 배분에 참고하세요.
- 이 단계에서는 문제의 난이도를 바꾸지 않습니다 — estimatedMinutes는 "얼마나 깊고 길게 풀어야 하는가"를 정하는 것이지 "얼마나 어려운가"를 정하는 것이 아닙니다. 난이도는 다음 단계에서 사용자가 지정한 값 그대로 고정됩니다.
- focus는 한 줄로 간단히 적으세요 (예: "핵심 정의 확인", "두 개념을 연결하는 응용 계산", "기출 3번과 유사한 구조의 증명형").`;
}

export function examBlueprintUserPrompt(input: {
  mcqCount: number;
  shortCount: number;
  essayCount: number;
  timeLimitMinutes: number;
  difficulty: number;
  professorNotes?: string | null;
  pastExamWeight?: number | null;
}): string {
  const { mcqCount, shortCount, essayCount, timeLimitMinutes, difficulty, professorNotes, pastExamWeight } =
    input;
  const band = describeDifficulty(difficulty);

  const pastExamLine =
    pastExamWeight != null
      ? `\n\n[기출문제 반영 강도]\n${pastExamWeight}/10 — ${describePastExamWeight(pastExamWeight)} 아래 제공되는 [기출문제] 자료가 있다면 문제별 시간/비중 배분에 참고하세요.`
      : "";

  return `[문제 구성]
- 객관식(mcq): ${mcqCount}문제
- 단답형(short): ${shortCount}문제
- 서술형(essay): ${essayCount}문제
- 전체 시험 시간: ${timeLimitMinutes}분

[난이도 (참고용 — 이 단계에서는 바꾸지 않음)]
${difficulty}/10 (${band.label}) — ${band.rubric}

[교수님 출제 성향 / 특이사항]
${professorNotes?.trim() || "(특별히 언급된 사항 없음)"}${pastExamLine}`;
}

// ── 실제 문제 생성 (2단계) ────────────────────────────────────────────────────
export function examSystemPrompt(): string {
  return `당신은 대학 시험 문제를 출제하는 전문가입니다.
주어진 참고 자료 파일들, 교수님의 출제 성향 설명, 그리고 미리 설계된 출제 계획(Blueprint)을 바탕으로 실제 시험과 유사한 예상 문제를 생성하세요.

- 참고 자료는 여러 파일로 제공될 수 있으며, 각 파일 앞에는 "[참고 자료: 파일명]" 또는 "[기출문제: 파일명]" 라벨이 붙습니다. 모든 참고 자료의 내용을 종합하여 출제하세요.
- [기출문제] 자료가 제공된 경우, 지정된 반영 강도(0~10)에 따라 스타일/문제 유형/주제 분포를 얼마나 닮게 할지 조절하세요. 강도가 높아도 기출문제의 문항을 그대로 베끼지 말고, 유사한 새로운 문제를 만드세요. 기출 반영도는 문제의 스타일·구조를 결정할 뿐, 난이도를 바꾸지 않습니다.
- [문제별 Blueprint]에 명시된 항목과 정확히 1:1로 대응하는 문제를 생성하세요 — 문제 개수, order, type을 Blueprint와 다르게 만들지 마세요.
- 각 문제는 Blueprint에 배정된 예상 풀이 시간만큼 학생이 실제로 시간을 들여야 풀리도록 사고 단계·계산 과정의 길이·서술량·소문항 개수·요구되는 작업량을 조절하세요. 이것은 "난이도"가 아니라 "문제의 깊이/분량"입니다.
- [난이도]에 지정된 인지적 난이도는 반드시 그대로 유지하세요. 시험 시간이 길다고 난이도를 올리거나, 짧다고 난이도를 낮추지 마세요 — 시험 시간과 문제 수는 난이도를 바꾸는 요소가 아니라 문제의 풀이량/분량을 결정하는 요소입니다.
  예) 난이도는 낮은데 배정 시간이 길다 → 쉬운 개념을 확인하는 절차를 여러 단계·소문항으로 나눠 시간을 채우되, 요구하는 개념 연결·추론 수준(=난이도)은 올리지 않는다.
  예) 난이도는 높은데 배정 시간이 짧다 → 하나의 문제에 요구하는 계산·서술량은 줄여서 시간 안에 풀리게 하되, 개념을 연결하고 추론해야 하는 인지적 난이도 자체는 낮추지 않는다.
- 객관식(mcq)에는 반드시 choices 배열(4~5개)과 정답을 포함하세요.
- 단답형(short)에는 명확한 정답(correctAnswer)을 포함하세요.
- 서술형(essay)에는 모범답안 및 채점 기준(modelAnswer)을 구체적으로 작성하세요.
- 각 문제의 배점은 Blueprint의 예상 풀이 시간 비중에 대략 비례하게 배분하세요.
- topicTag는 이후 취약점 분석에 사용되므로, 같은 개념을 다루는 문제는 동일한 태그를 사용하세요.
- sourceLocation을 채우세요 — 채점 후 오답 화면에서 "이 개념은 자료 어디에 있는지"를 알려주는 데 쓰입니다. 참고 자료에서 실제로 페이지를 확인할 수 있을 때만 채우고, 확신할 수 없는 페이지 번호는 절대 지어내지 마세요(모르면 null).
- explanation(해설)도 정답 근거만 나열하지 말고 핵심 개념과, 계산 문제라면 흔한 실수 지점까지 포함해서 오답 피드백으로 쓸모 있게 작성하세요.
- 변수/기호를 첨자로 표기할 때 P_ideal, x_1처럼 프로그래밍 스타일 밑줄(_)을 쓰지 마세요 — 수식 렌더러 없이 일반 텍스트로 그대로 노출돼서 가독성이 떨어집니다. 숫자 첨자는 P1, O2처럼 그냥 옆에 붙여 쓰지 말고 반드시 유니코드 아래첨자 숫자(₀₁₂₃₄₅₆₇₈₉)로 표기하세요 — 화학식(H2O→H₂O, CO2→CO₂, O2→O₂)과 변수의 숫자 첨자(x1→x₁, P1→P₁) 모두 예외 없이 적용합니다. 단어로 된 첨자는 밑줄로 붙이지 말고 "이상 기체의 압력 P"처럼 자연스러운 한글 설명으로 풀어 쓰세요.
- 모든 출력은 한국어로 작성하세요.`;
}

export function examUserPrompt(input: {
  title: string;
  difficulty: number;
  blueprint: ExamBlueprintItem[];
  professorNotes?: string | null;
  pastExamWeight?: number | null;
}): string {
  const { title, difficulty, blueprint, professorNotes, pastExamWeight } = input;
  const band = describeDifficulty(difficulty);

  const pastExamLine =
    pastExamWeight != null
      ? `\n\n[기출문제 반영 강도]\n${pastExamWeight}/10 — ${describePastExamWeight(pastExamWeight)}`
      : "";

  const totalMinutes = blueprint.reduce((sum, item) => sum + item.estimatedMinutes, 0);
  const blueprintLines = blueprint
    .map(
      (item) =>
        `${item.order}. [${QUESTION_TYPE_LABEL[item.type]}] 예상 풀이시간 ${item.estimatedMinutes}분 — ${item.focus || "(특이사항 없음)"}`
    )
    .join("\n");

  return `[시험지 제목]
${title}

[난이도]
${difficulty}/10 (${band.label}) — ${band.rubric}
이 난이도는 시험 시간이나 문제별 배정 시간과 무관하게 그대로 유지하세요.

[문제별 Blueprint] (총 ${blueprint.length}문제, 총 ${totalMinutes}분)
${blueprintLines}
위 순서(order)·유형(type)·예상 풀이시간을 그대로 따라 문제를 생성하세요. 예상 풀이시간은 문제의 분량/깊이를 정하는 기준이며, 난이도를 바꾸는 기준이 아닙니다.

[교수님 출제 성향 / 특이사항]
${professorNotes?.trim() || "(특별히 언급된 사항 없음)"}${pastExamLine}

아래는 참고 자료 파일들입니다. 각 파일 앞의 라벨을 참고하세요.`;
}

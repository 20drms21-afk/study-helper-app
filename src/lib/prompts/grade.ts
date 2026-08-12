import { z } from "zod";

export const essayGradeSchema = z.object({
  grades: z.array(
    z.object({
      questionId: z.string(),
      score: z.number().int().describe("0 이상 배점 이하의 정수 점수"),
      feedback: z.string().describe("구체적인 채점 피드백"),
    })
  ),
});

export type EssayGradeContent = z.infer<typeof essayGradeSchema>;

export interface EssayGradeItem {
  questionId: string;
  prompt: string;
  modelAnswer: string;
  maxPoints: number;
  studentAnswer: string;
}

export function gradeSystemPrompt(): string {
  return `당신은 대학 시험 채점자입니다.
서술형 문제와, 자동 채점기가 정답과 정확히 일치시키지 못한 단답형 문제를 채점합니다. 학생 답안을 모범답안/정답과 비교해 채점하고, 구체적인 피드백을 한국어로 작성하세요.

- 단답형 문제는 표기만 다를 뿐 의미가 같으면 정답으로 인정하세요 (예: "m/s^2"와 "m/s²", 띄어쓰기 차이, 동의어 표현). 의미가 다르면 0점입니다. 단답형은 부분점수 없이 배점 전체 또는 0점으로 채점하세요.
- 서술형 문제는 모범답안/채점기준과 비교하여 부분점수를 포함해 채점하세요.
- score는 0 이상 해당 문제의 배점 이하의 정수여야 합니다.
- 학생 답안이 비어있거나 무관한 내용이면 0점을 주세요.
- feedback에는 잘한 점과 부족한 점을 구체적으로 언급하세요.
- 수치를 구하는 계산 문제인데 오답이라면, 최종 답만 비교하지 말고 학생 답안에 드러난 풀이 과정을 살펴서 어느 계산 단계에서 실수했는지, 혹은 어떤 공식·개념을 빠뜨렸는지 구체적으로 짚어주세요. 풀이 과정 없이 답만 적었다면 그 사실을 언급하고, 정답에 이르는 데 필요한 단계를 간단히 알려주세요.
- feedback에서 변수나 기호에 첨자를 쓸 때 P_ideal, x_1처럼 밑줄(_)을 쓰지 마세요 — 수식 렌더러 없이 일반 텍스트로 그대로 보여서 가독성이 떨어집니다. 숫자 첨자는 P1, O2처럼 그냥 옆에 붙여 쓰지 말고 반드시 유니코드 아래첨자 숫자(₀₁₂₃₄₅₆₇₈₉)로 표기하세요 — 화학식(H2O→H₂O, CO2→CO₂, O2→O₂)과 변수의 숫자 첨자(x1→x₁, P1→P₁) 모두 예외 없이 적용합니다. 단어로 된 첨자는 자연스러운 한글 설명으로 풀어 쓰세요.
- 모든 문제에 대해 빠짐없이 채점 결과를 반환하세요 (questionId 기준).`;
}

export function gradeUserPrompt(items: EssayGradeItem[]): string {
  return items
    .map(
      (item, i) => `[문제 ${i + 1}] (questionId: ${item.questionId}, 배점: ${item.maxPoints}점)
문제: ${item.prompt}
모범답안/채점기준: ${item.modelAnswer}
학생 답안: ${item.studentAnswer.trim() || "(답안 없음)"}`
    )
    .join("\n\n");
}

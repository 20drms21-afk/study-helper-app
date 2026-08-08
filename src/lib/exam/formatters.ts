import type { ExamQuestionType } from "@/lib/prompts/examGenerate";

export function choiceLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

export function totalPointsOf(questions: { points: number }[]): number {
  return questions.reduce((sum, q) => sum + q.points, 0);
}

export function answerBlankLines(type: ExamQuestionType, points: number): number {
  if (type === "mcq") return 0;
  if (type === "short") return 1;
  return Math.max(3, Math.min(8, Math.round(points / 5)));
}

export function parseChoices(choicesJson: string | null): string[] | null {
  if (!choicesJson) return null;
  try {
    const parsed = JSON.parse(choicesJson);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

import type { ExamQuestionType } from "@/lib/prompts/examGenerate";

export interface ExamQuestionPublic {
  id: string;
  order: number;
  type: ExamQuestionType;
  prompt: string;
  choices: string[] | null;
  points: number;
}

export interface ExamPaperPublic {
  id: string;
  title: string;
  totalPoints: number;
  timeLimitMinutes: number;
  questions: ExamQuestionPublic[];
}

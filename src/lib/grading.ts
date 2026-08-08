import { distance } from "fastest-levenshtein";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

export function gradeMcq(studentAnswer: string, correctAnswer: string): boolean {
  return normalize(studentAnswer) === normalize(correctAnswer);
}

export interface ShortGradeResult {
  isCorrect: boolean;
  confidence: number;
}

const SHORT_ANSWER_THRESHOLD = 0.85;

export function gradeShort(studentAnswer: string, correctAnswer: string): ShortGradeResult {
  const a = normalize(studentAnswer);
  const b = normalize(correctAnswer);

  if (!a) return { isCorrect: false, confidence: 0 };
  if (a === b) return { isCorrect: true, confidence: 1 };

  const maxLen = Math.max(a.length, b.length);
  const confidence = maxLen === 0 ? 0 : 1 - distance(a, b) / maxLen;

  return { isCorrect: confidence >= SHORT_ANSWER_THRESHOLD, confidence };
}

import { randomBytes } from "crypto";

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 0/O/1/I 제외

export function generateRoomCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export const HEARTBEAT_INTERVAL_MS = 5000;

export interface TimerPhase {
  phase: "study" | "break";
  completedSets: number;
  remainingInPhaseSeconds: number;
  phaseTotalSeconds: number;
}

export function computeTimerPhase(
  startedAt: Date,
  studyMinutes: number,
  breakMinutes: number,
  now: Date = new Date()
): TimerPhase {
  const elapsed = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
  const studySeconds = studyMinutes * 60;
  const breakSeconds = breakMinutes * 60;
  const cycleLen = studySeconds + breakSeconds;

  const completedSets = Math.floor(elapsed / cycleLen);
  const pos = elapsed % cycleLen;

  if (pos < studySeconds) {
    return {
      phase: "study",
      completedSets,
      remainingInPhaseSeconds: studySeconds - pos,
      phaseTotalSeconds: studySeconds,
    };
  }
  return {
    phase: "break",
    completedSets,
    remainingInPhaseSeconds: cycleLen - pos,
    phaseTotalSeconds: breakSeconds,
  };
}

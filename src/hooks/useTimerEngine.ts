"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { computeTimerPhase, type TimerPhase } from "@/lib/timer";

async function logSession(params: {
  subjectId: string | null;
  mode: "simple" | "immersive";
  roomId: string | null;
  startedAt: Date;
  endedAt: Date;
}) {
  const durationSeconds = Math.floor((params.endedAt.getTime() - params.startedAt.getTime()) / 1000);
  if (durationSeconds < 60) return;
  try {
    await fetch("/api/timer/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: params.subjectId ?? undefined,
        mode: params.mode,
        roomId: params.roomId ?? undefined,
        startedAt: params.startedAt.toISOString(),
        endedAt: params.endedAt.toISOString(),
        durationSeconds,
      }),
    });
  } catch {
    // 세션 기록 실패는 조용히 무시 (다음 세트에서 다시 시도됨)
  }
}

export function useTimerEngine({
  startedAt,
  studyMinutes,
  breakMinutes,
  subjectId,
  mode,
  roomId,
  allowPause,
}: {
  startedAt: Date;
  studyMinutes: number;
  breakMinutes: number;
  subjectId: string | null;
  mode: "simple" | "immersive";
  roomId: string | null;
  allowPause: boolean;
}) {
  const virtualStartedAtRef = useRef(startedAt);
  const pausedAtRef = useRef<Date | null>(null);
  const prevPhaseRef = useRef<"study" | "break">("study");
  const studyPhaseStartRef = useRef<Date>(startedAt);

  const [paused, setPaused] = useState(false);
  const [phaseState, setPhaseState] = useState<TimerPhase>(() =>
    computeTimerPhase(startedAt, studyMinutes, breakMinutes)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = pausedAtRef.current ?? new Date();
      const phase = computeTimerPhase(virtualStartedAtRef.current, studyMinutes, breakMinutes, now);
      setPhaseState(phase);

      if (prevPhaseRef.current === "study" && phase.phase === "break") {
        const endedAt = new Date();
        logSession({
          subjectId,
          mode,
          roomId,
          startedAt: studyPhaseStartRef.current,
          endedAt,
        });
      }
      if (prevPhaseRef.current !== phase.phase && phase.phase === "study") {
        studyPhaseStartRef.current = new Date();
      }
      prevPhaseRef.current = phase.phase;
    }, 1000);
    return () => clearInterval(interval);
  }, [studyMinutes, breakMinutes, subjectId, mode, roomId]);

  const togglePause = useCallback(() => {
    if (!allowPause) return;
    if (pausedAtRef.current) {
      const pausedDuration = Date.now() - pausedAtRef.current.getTime();
      virtualStartedAtRef.current = new Date(virtualStartedAtRef.current.getTime() + pausedDuration);
      pausedAtRef.current = null;
      setPaused(false);
    } else {
      pausedAtRef.current = new Date();
      setPaused(true);
    }
  }, [allowPause]);

  const getElapsedForHeartbeat = useCallback(() => {
    const now = new Date();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - virtualStartedAtRef.current.getTime()) / 1000)
    );
    return { elapsedSeconds, completedSets: phaseState.completedSets };
  }, [phaseState.completedSets]);

  const stop = useCallback(() => {
    if (prevPhaseRef.current === "study") {
      logSession({
        subjectId,
        mode,
        roomId,
        startedAt: studyPhaseStartRef.current,
        endedAt: new Date(),
      });
    }
  }, [subjectId, mode, roomId]);

  return { ...phaseState, paused, togglePause, getElapsedForHeartbeat, stop };
}

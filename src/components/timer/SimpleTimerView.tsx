"use client";

import { useTimerEngine } from "@/hooks/useTimerEngine";
import { useRoomPolling } from "@/hooks/useRoomPolling";

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SimpleTimerView({
  startedAt,
  studyMinutes,
  breakMinutes,
  subjectId,
  roomId,
  code,
  allowPause,
  onExit,
}: {
  startedAt: Date;
  studyMinutes: number;
  breakMinutes: number;
  subjectId: string | null;
  roomId: string | null;
  code: string | null;
  allowPause: boolean;
  onExit: () => void;
}) {
  const engine = useTimerEngine({
    startedAt,
    studyMinutes,
    breakMinutes,
    subjectId,
    mode: "simple",
    roomId,
    allowPause,
  });
  const participants = useRoomPolling(code, engine.getElapsedForHeartbeat);

  const progress = 1 - engine.remainingInPhaseSeconds / engine.phaseTotalSeconds;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg width={220} height={220} viewBox="0 0 220 220">
          <circle cx={110} cy={110} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={12} />
          <circle
            cx={110}
            cy={110}
            r={radius}
            fill="none"
            stroke={engine.phase === "study" ? "#111827" : "#16a34a"}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 110 110)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500">{engine.phase === "study" ? "공부 중" : "휴식 중"}</span>
          <span className="text-2xl font-bold">{formatClock(engine.remainingInPhaseSeconds)}</span>
          <span className="text-xs text-gray-500">{studyMinutes}min / {breakMinutes}min</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span>완료 세트: {engine.completedSets}</span>
        {allowPause && (
          <button
            onClick={engine.togglePause}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            {engine.paused ? "재개" : "일시정지"}
          </button>
        )}
        <button
          onClick={() => {
            engine.stop();
            onExit();
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          종료
        </button>
      </div>

      {code && (
        <div className="w-full max-w-xs rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-medium text-gray-600">참가자</p>
          <ul className="space-y-1 text-sm">
            {participants.map((p) => (
              <li key={p.userId} className="flex items-center justify-between">
                <span>{p.name}</span>
                <span className="text-xs text-gray-500">{formatClock(p.elapsedSeconds)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

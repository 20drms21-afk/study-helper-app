"use client";

import { useTimerEngine } from "@/hooks/useTimerEngine";
import { useRoomPolling } from "@/hooks/useRoomPolling";

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 완료 세트 수 기준 낮 -> 노을 -> 밤 배경 전환 (누적 공부 시간이 늘수록 어두워짐).
function backgroundFor(completedSets: number): string {
  if (completedSets === 0) return "linear-gradient(180deg, #aee1f9 0%, #eaf6ff 100%)";
  if (completedSets === 1) return "linear-gradient(180deg, #f7b267 0%, #f4845f 60%, #6a4c93 100%)";
  return "linear-gradient(180deg, #0f1035 0%, #1a1a4a 60%, #2b2b5e 100%)";
}

function Desk({ dark }: { dark: boolean }) {
  const wallColor = dark ? "#1c1c3a" : "#f5ede1";
  const deskColor = dark ? "#5a4632" : "#c8a375";
  const skinColor = "#eab892";
  const hairColor = dark ? "#2b2b2b" : "#3b2a1e";

  return (
    <svg viewBox="0 0 300 200" className="w-full max-w-sm">
      <rect x={0} y={0} width={300} height={140} fill={wallColor} />
      <rect x={0} y={140} width={300} height={60} fill={deskColor} />
      {/* 캐릭터 */}
      <circle cx={150} cy={110} r={22} fill={skinColor} />
      <path d="M128 100 a22 22 0 0 1 44 0 v-6 a22 14 0 0 0 -44 0 z" fill={hairColor} />
      <rect x={130} y={130} width={40} height={30} rx={8} fill="#4b6ea8" />
      {/* 책 */}
      <rect x={120} y={150} width={60} height={10} rx={2} fill="#e2725b" />
    </svg>
  );
}

export function ImmersiveTimerView({
  startedAt,
  studyMinutes,
  breakMinutes,
  subjectId,
  roomId,
  code,
  allowPause,
  currentUserId,
  onExit,
}: {
  startedAt: Date;
  studyMinutes: number;
  breakMinutes: number;
  subjectId: string | null;
  roomId: string | null;
  code: string | null;
  allowPause: boolean;
  currentUserId: string;
  onExit: () => void;
}) {
  const engine = useTimerEngine({
    startedAt,
    studyMinutes,
    breakMinutes,
    subjectId,
    mode: "immersive",
    roomId,
    allowPause,
  });
  const participants = useRoomPolling(code, engine.getElapsedForHeartbeat);
  const dark = engine.completedSets >= 2;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-full max-w-lg rounded-md p-6"
        style={{ background: backgroundFor(engine.completedSets) }}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Desk dark={dark} />
          {participants
            .filter((p) => p.status === "active" && p.userId !== currentUserId)
            .map((p) => (
              <div key={p.userId} className="scale-75 opacity-90">
                <Desk dark={dark} />
              </div>
            ))}
        </div>
        <div className="mt-2 text-center text-sm font-medium text-white drop-shadow">
          {engine.phase === "study" ? "공부 중" : "휴식 중"} · {formatClock(engine.remainingInPhaseSeconds)}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span>완료 세트: {engine.completedSets}</span>
        {allowPause && (
          <button
            onClick={engine.togglePause}
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/5"
          >
            {engine.paused ? "재개" : "일시정지"}
          </button>
        )}
        <button
          onClick={() => {
            engine.stop();
            onExit();
          }}
          className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/5"
        >
          종료
        </button>
      </div>

      {code && (
        <div className="w-full max-w-xs rounded-md border border-white/10 p-3">
          <p className="mb-2 text-xs font-medium text-sb-mute">참가자</p>
          <ul className="space-y-1 text-sm">
            {participants.map((p) => (
              <li key={p.userId} className="flex items-center justify-between">
                <span>{p.name}</span>
                <span className="text-xs text-sb-mute">{formatClock(p.elapsedSeconds)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useTimerEngine } from "@/hooks/useTimerEngine";
import { useRoomPolling } from "@/hooks/useRoomPolling";

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 실제 실행 중 화면과, /timer 설정 화면의 모드 미리보기가 같은 원형 타이머 그래픽을 써야
// 해서(둘이 갈라지면 미리보기만 안 고치고 지나치기 쉬움) SVG 그리기 로직을 분리해뒀다.
export function SimpleTimerGraphic({
  progress,
  phase,
  timeLabel,
  subLabel,
}: {
  progress: number;
  phase: "study" | "break";
  timeLabel: string;
  subLabel: string;
}) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative">
      <svg width={220} height={220} viewBox="0 0 220 220">
        {/* 다크 배경 위에서 보여야 해서 트랙은 옅은 흰색 반투명, 진행 스트로크는 브랜드
            라임(공부)/보조 블루(휴식)로 구분한다 — 예전엔 라이트 테마 전제 색(#e5e7eb 등)이라
            어두운 페이지 위에서 진행 스트로크가 거의 안 보였다. */}
        <circle cx={110} cy={110} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
        <circle
          cx={110}
          cy={110}
          r={radius}
          fill="none"
          stroke={phase === "study" ? "#c2ff3d" : "#7db8ff"}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 110 110)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-sb-mute">{phase === "study" ? "공부 중" : "휴식 중"}</span>
        <span className="text-2xl font-bold text-sb-text">{timeLabel}</span>
        <span className="text-xs text-sb-mute">{subLabel}</span>
      </div>
    </div>
  );
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

  return (
    <div className="flex flex-col items-center gap-6">
      <SimpleTimerGraphic
        progress={progress}
        phase={engine.phase}
        timeLabel={formatClock(engine.remainingInPhaseSeconds)}
        subLabel={`${studyMinutes}min / ${breakMinutes}min`}
      />

      <div className="flex items-center gap-4 text-sm">
        <span>완료 세트: {engine.completedSets}</span>
        {allowPause && (
          <button
            onClick={engine.togglePause}
            className="rounded-md border border-sb-border px-3 py-1.5 text-sm font-medium hover:bg-sb-hover"
          >
            {engine.paused ? "재개" : "일시정지"}
          </button>
        )}
        <button
          onClick={() => {
            engine.stop();
            onExit();
          }}
          className="rounded-md border border-sb-border px-3 py-1.5 text-sm font-medium hover:bg-sb-hover"
        >
          종료
        </button>
      </div>

      {code && (
        <div className="w-full max-w-xs rounded-md border border-sb-border p-3">
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

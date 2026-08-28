"use client";

import { useEffect, useState } from "react";
import { SubjectPicker, type SubjectRef } from "@/components/SubjectPicker";
import { SimpleTimerView, SimpleTimerGraphic } from "@/components/timer/SimpleTimerView";
import { ImmersiveTimerView, ImmersiveTimerGraphic, Desk } from "@/components/timer/ImmersiveTimerView";
import { HEARTBEAT_INTERVAL_MS } from "@/lib/timer";

type Mode = "simple" | "immersive";

type Stage =
  | { kind: "setup" }
  | {
      kind: "lobby";
      code: string;
      isHost: boolean;
      mode: Mode;
      subjectId: string | null;
      studyMinutes: number;
      breakMinutes: number;
    }
  | {
      kind: "running";
      mode: Mode;
      subjectId: string | null;
      studyMinutes: number;
      breakMinutes: number;
      startedAt: Date;
      roomId: string | null;
      code: string | null;
      allowPause: boolean;
    };

const STUDY_MINUTES = 50;
const BREAK_MINUTES = 10;

export function TimerSetup({
  subjects: initialSubjects,
  currentUserId,
}: {
  subjects: SubjectRef[];
  currentUserId: string;
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [mode, setMode] = useState<Mode>("simple");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: "setup" });

  useEffect(() => {
    if (stage.kind !== "lobby") return;
    let cancelled = false;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/timer/rooms/${stage.code}`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (data.room.status === "running" && data.room.startedAt) {
        setStage({
          kind: "running",
          mode: stage.mode,
          subjectId: stage.subjectId,
          studyMinutes: stage.studyMinutes,
          breakMinutes: stage.breakMinutes,
          startedAt: new Date(data.room.startedAt),
          roomId: null,
          code: stage.code,
          allowPause: false,
        });
      }
    }, HEARTBEAT_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stage]);

  async function handleSolo() {
    setStage({
      kind: "running",
      mode,
      subjectId,
      studyMinutes: STUDY_MINUTES,
      breakMinutes: BREAK_MINUTES,
      startedAt: new Date(),
      roomId: null,
      code: null,
      allowPause: true,
    });
  }

  async function handleCreateRoom() {
    setError(null);
    const res = await fetch("/api/timer/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        subjectId: subjectId ?? undefined,
        studyMinutes: STUDY_MINUTES,
        breakMinutes: BREAK_MINUTES,
      }),
    });
    if (!res.ok) {
      setError("방을 만들 수 없습니다.");
      return;
    }
    const data = await res.json();
    setStage({
      kind: "lobby",
      code: data.code,
      isHost: true,
      mode,
      subjectId,
      studyMinutes: STUDY_MINUTES,
      breakMinutes: BREAK_MINUTES,
    });
  }

  async function handleJoin() {
    setError(null);
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    const res = await fetch(`/api/timer/rooms/${code}/join`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "방에 참가할 수 없습니다.");
      return;
    }
    const data = await res.json();
    if (data.status === "running" && data.startedAt) {
      setStage({
        kind: "running",
        mode: data.mode,
        subjectId: data.subjectId,
        studyMinutes: data.studyMinutes,
        breakMinutes: data.breakMinutes,
        startedAt: new Date(data.startedAt),
        roomId: null,
        code: data.code,
        allowPause: false,
      });
    } else {
      setStage({
        kind: "lobby",
        code: data.code,
        isHost: false,
        mode: data.mode,
        subjectId: data.subjectId,
        studyMinutes: data.studyMinutes,
        breakMinutes: data.breakMinutes,
      });
    }
  }

  async function handleStartRoom() {
    if (stage.kind !== "lobby") return;
    const res = await fetch(`/api/timer/rooms/${stage.code}/start`, { method: "POST" });
    if (!res.ok) {
      setError("시작할 수 없습니다.");
      return;
    }
    const data = await res.json();
    setStage({
      kind: "running",
      mode: stage.mode,
      subjectId: stage.subjectId,
      studyMinutes: stage.studyMinutes,
      breakMinutes: stage.breakMinutes,
      startedAt: new Date(data.startedAt),
      roomId: null,
      code: stage.code,
      allowPause: false,
    });
  }

  if (stage.kind === "running") {
    if (stage.mode === "simple") {
      return (
        <SimpleTimerView
          startedAt={stage.startedAt}
          studyMinutes={stage.studyMinutes}
          breakMinutes={stage.breakMinutes}
          subjectId={stage.subjectId}
          roomId={stage.roomId}
          code={stage.code}
          allowPause={stage.allowPause}
          onExit={() => setStage({ kind: "setup" })}
        />
      );
    }
    return (
      <ImmersiveTimerView
        startedAt={stage.startedAt}
        studyMinutes={stage.studyMinutes}
        breakMinutes={stage.breakMinutes}
        subjectId={stage.subjectId}
        roomId={stage.roomId}
        code={stage.code}
        allowPause={stage.allowPause}
        currentUserId={currentUserId}
        onExit={() => setStage({ kind: "setup" })}
      />
    );
  }

  if (stage.kind === "lobby") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-sb-mute">친구에게 이 코드를 공유하세요</p>
        <p className="text-3xl font-bold tracking-widest">{stage.code}</p>
        <p className="text-xs text-sb-mute">
          {stage.isHost ? "친구가 참가하면 시작 버튼을 눌러주세요." : "호스트가 시작하기를 기다리는 중..."}
        </p>
        {stage.isHost && (
          <button
            onClick={handleStartRoom}
            className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5"
          >
            시작
          </button>
        )}
        <button
          onClick={() => setStage({ kind: "setup" })}
          className="text-xs text-sb-mute hover:text-sb-text"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 모드를 고르기 전에도 그 모드가 실제로 어떻게 보이는지 먼저 보여주기 위해, 실행
          화면과 동일한 그래픽(SimpleTimerGraphic/ImmersiveTimerGraphic)을 정적인 값으로
          미리보기만 한다 — 진짜 타이머는 시작하지 않음. */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full max-w-lg items-center justify-center rounded-2xl border border-sb-border bg-sb-card p-6">
          {mode === "simple" ? (
            <SimpleTimerGraphic
              progress={0.35}
              phase="study"
              timeLabel={`${STUDY_MINUTES}:00`}
              subLabel={`${STUDY_MINUTES}min / ${BREAK_MINUTES}min`}
            />
          ) : (
            <ImmersiveTimerGraphic completedSets={0} statusLabel={`공부 중 · ${STUDY_MINUTES}:00`}>
              <Desk dark={false} />
            </ImmersiveTimerGraphic>
          )}
        </div>

        <div className="grid w-full max-w-xs grid-cols-2 gap-3">
          <button
            onClick={() => setMode("simple")}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === "simple"
                ? "bg-sb-accent text-sb-accent-ink"
                : "border border-sb-border bg-sb-bg-soft text-sb-mute hover:text-sb-text"
            }`}
          >
            심플 모드
          </button>
          <button
            onClick={() => setMode("immersive")}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === "immersive"
                ? "bg-sb-accent text-sb-accent-ink"
                : "border border-sb-border bg-sb-bg-soft text-sb-mute hover:text-sb-text"
            }`}
          >
            몰입 모드
          </button>
        </div>
      </div>

      <SubjectPicker
        subjects={subjects}
        value={subjectId}
        onChange={setSubjectId}
        onCreated={(s) => setSubjects((prev) => [...prev, s])}
        allowNone
        label="공부할 과목 (선택)"
      />

      <p className="text-xs text-sb-mute">{STUDY_MINUTES}분 공부 / {BREAK_MINUTES}분 휴식 자동 반복</p>

      {error && <p className="text-sm text-[#ff8a8a]">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSolo}
          className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5"
        >
          바로 시작
        </button>
        <button
          onClick={handleCreateRoom}
          className="rounded-md border border-sb-border px-4 py-2 text-sm font-medium hover:bg-sb-hover"
        >
          친구 초대
        </button>
        <button
          onClick={() => setShowJoin((v) => !v)}
          className="rounded-md border border-sb-border px-4 py-2 text-sm font-medium hover:bg-sb-hover"
        >
          코드로 참가
        </button>
      </div>

      {showJoin && (
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="초대 코드 입력"
            className="rounded-md border border-sb-border px-3 py-2 text-sm uppercase"
          />
          <button
            onClick={handleJoin}
            className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5"
          >
            참가
          </button>
        </div>
      )}
    </div>
  );
}

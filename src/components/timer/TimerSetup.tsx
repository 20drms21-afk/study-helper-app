"use client";

import { useEffect, useState } from "react";
import { SubjectPicker, type SubjectRef } from "@/components/SubjectPicker";
import { SimpleTimerView } from "@/components/timer/SimpleTimerView";
import { ImmersiveTimerView } from "@/components/timer/ImmersiveTimerView";
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
        <p className="text-sm text-gray-600">친구에게 이 코드를 공유하세요</p>
        <p className="text-3xl font-bold tracking-widest">{stage.code}</p>
        <p className="text-xs text-gray-500">
          {stage.isHost ? "친구가 참가하면 시작 버튼을 눌러주세요." : "호스트가 시작하기를 기다리는 중..."}
        </p>
        {stage.isHost && (
          <button
            onClick={handleStartRoom}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            시작
          </button>
        )}
        <button
          onClick={() => setStage({ kind: "setup" })}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium">모드 선택</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("simple")}
            className={`rounded-md border p-4 text-left ${
              mode === "simple" ? "border-gray-900" : "border-gray-200"
            }`}
          >
            <p className="text-sm font-medium">심플 모드</p>
            <p className="mt-1 text-xs text-gray-500">원형 타이머로 집중 시간을 확인</p>
          </button>
          <button
            onClick={() => setMode("immersive")}
            className={`rounded-md border p-4 text-left ${
              mode === "immersive" ? "border-gray-900" : "border-gray-200"
            }`}
          >
            <p className="text-sm font-medium">몰입 모드</p>
            <p className="mt-1 text-xs text-gray-500">책상 일러스트와 함께 공부</p>
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

      <p className="text-xs text-gray-500">{STUDY_MINUTES}분 공부 / {BREAK_MINUTES}분 휴식 자동 반복</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSolo}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          바로 시작
        </button>
        <button
          onClick={handleCreateRoom}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          친구 초대
        </button>
        <button
          onClick={() => setShowJoin((v) => !v)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
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
            className="rounded-md border border-gray-300 px-3 py-2 text-sm uppercase"
          />
          <button
            onClick={handleJoin}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            참가
          </button>
        </div>
      )}
    </div>
  );
}

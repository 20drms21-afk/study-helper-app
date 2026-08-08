"use client";

import { useEffect, useRef, useState } from "react";
import { HEARTBEAT_INTERVAL_MS } from "@/lib/timer";

export interface RoomParticipant {
  userId: string;
  name: string;
  elapsedSeconds: number;
  completedSets: number;
  status: string;
  lastHeartbeatAt: string;
}

export function useRoomPolling(
  code: string | null,
  getElapsed: () => { elapsedSeconds: number; completedSets: number }
) {
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const getElapsedRef = useRef(getElapsed);

  useEffect(() => {
    getElapsedRef.current = getElapsed;
  }, [getElapsed]);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    async function tick() {
      const { elapsedSeconds, completedSets } = getElapsedRef.current();
      try {
        const res = await fetch(`/api/timer/rooms/${code}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ elapsedSeconds, completedSets }),
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setParticipants(data.participants);
        }
      } catch {
        // 폴링 실패는 조용히 무시하고 다음 tick에서 재시도
      }
    }

    tick();
    const interval = setInterval(tick, HEARTBEAT_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [code]);

  return participants;
}

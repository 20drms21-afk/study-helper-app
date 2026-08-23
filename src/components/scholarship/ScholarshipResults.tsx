"use client";

import { useState } from "react";

interface ScholarshipMatch {
  listingId: string;
  provider: string;
  name: string;
  kind: string | null;
  amountText: string | null;
  applyPeriodText: string | null;
  applyUrl: string | null;
  reason: string;
}

export function ScholarshipResults() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<ScholarshipMatch[] | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scholarships/matches");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "장학금 조회에 실패했습니다.");
      setConfigured(data.configured);
      setMatches(data.matches ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "장학금 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleSearch}
        disabled={loading}
        className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? "찾는 중..." : "장학금 찾기"}
      </button>

      {error && <p className="mt-3 text-sm text-[#ff8a8a]">{error}</p>}

      {configured === false && (
        <p className="mt-4 text-sm text-sb-mute">
          아직 장학금 데이터가 연동되지 않았습니다. 관리자가 데이터 연동을 설정하면 표시됩니다.
        </p>
      )}

      {configured === true && matches && matches.length === 0 && (
        <p className="mt-4 text-sm text-sb-mute">현재 입력한 정보로 신청 가능한 장학금을 찾지 못했습니다.</p>
      )}

      {configured === true && matches && matches.length > 0 && (
        <ul className="mt-4 space-y-3">
          {matches.map((m) => (
            <li key={m.listingId} className="rounded-md border border-sb-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-sb-body">{m.name}</p>
                {m.applyUrl && (
                  <a
                    href={m.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-sb-mute hover:text-sb-text"
                  >
                    자세히 보기
                  </a>
                )}
              </div>
              <p className="mt-1 text-xs text-sb-mute">
                {m.provider}
                {m.kind ? ` · ${m.kind}` : ""}
                {m.amountText ? ` · ${m.amountText}` : ""}
              </p>
              {m.applyPeriodText && <p className="mt-1 text-xs text-sb-mute">신청기간: {m.applyPeriodText}</p>}
              <p className="mt-2 text-xs text-sb-mute">{m.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

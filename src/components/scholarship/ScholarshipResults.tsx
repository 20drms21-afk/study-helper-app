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
  departmentTags: string | null;
  universityTags: string | null;
  gradeCriteriaText: string | null;
  incomeCriteriaText: string | null;
  residencyText: string | null;
  qualificationText: string | null;
  restrictionText: string | null;
  recommendationText: string | null;
}

// 거주지역/특정자격/자격제한처럼 규칙으로 걸러내지 않고 그대로 보여주는 항목들 — 자유서술이라
// 시스템이 대신 판단하지 않고 사용자가 직접 읽고 확인하도록 라벨 그대로 노출한다
// (src/lib/scholarship/match.ts 상단 주석 참고).
const DISPLAY_TEXT_FIELDS: { key: keyof ScholarshipMatch; label: string }[] = [
  { key: "residencyText", label: "지역거주여부" },
  { key: "qualificationText", label: "특정자격" },
  { key: "restrictionText", label: "자격제한" },
  { key: "recommendationText", label: "추천필요여부" },
];

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
          {matches.map((m) => {
            const departmentTags = m.departmentTags?.split(",").filter(Boolean) ?? [];
            const universityTags = m.universityTags?.split(",").filter(Boolean) ?? [];
            const textFields = DISPLAY_TEXT_FIELDS.filter((f) => m[f.key]);

            return (
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

                {(departmentTags.length > 0 || universityTags.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {[...departmentTags, ...universityTags].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-sb-accent/10 px-2 py-0.5 text-[11px] text-sb-accent-deep"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {m.incomeCriteriaText && (
                  <p className="mt-2 text-xs text-sb-mute">소득기준: {m.incomeCriteriaText}</p>
                )}
                {m.gradeCriteriaText && (
                  <p className="mt-1 text-xs text-sb-mute">성적기준: {m.gradeCriteriaText}</p>
                )}

                {textFields.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-sb-border pt-2">
                    <p className="text-[11px] text-sb-mute">
                      아래 조건은 자동으로 걸러내지 않았어요 — 신청 전 직접 확인해주세요.
                    </p>
                    {textFields.map((f) => (
                      <p key={f.key} className="text-xs text-sb-mute">
                        {f.label}: {m[f.key]}
                      </p>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

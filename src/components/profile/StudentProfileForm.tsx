"use client";

import { useState } from "react";

const REGIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

export interface StudentProfileValue {
  region: string | null;
  major: string | null;
  gradeLevel: number | null;
  incomeBracket: number | null;
  gpa: number | null;
  interests: string | null;
}

export type StudentProfileField =
  | "region"
  | "major"
  | "gradeLevel"
  | "incomeBracket"
  | "gpa"
  | "interests";

const ALL_FIELDS: StudentProfileField[] = [
  "region",
  "major",
  "gradeLevel",
  "incomeBracket",
  "gpa",
  "interests",
];

export function StudentProfileForm({
  initialValue,
  fields = ALL_FIELDS,
  title = "내 정보",
  onSaved,
}: {
  initialValue: StudentProfileValue;
  fields?: StudentProfileField[];
  title?: string;
  onSaved?: (value: StudentProfileValue) => void;
}) {
  const [region, setRegion] = useState(initialValue.region ?? "");
  const [major, setMajor] = useState(initialValue.major ?? "");
  const [gradeLevel, setGradeLevel] = useState(initialValue.gradeLevel ?? 0);
  const [incomeBracket, setIncomeBracket] = useState(initialValue.incomeBracket ?? 0);
  const [gpa, setGpa] = useState(initialValue.gpa != null ? String(initialValue.gpa) : "");
  const [interests, setInterests] = useState(initialValue.interests ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = (f: StudentProfileField) => fields.includes(f);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {};
      if (show("region")) payload.region = region || undefined;
      if (show("major")) payload.major = major || undefined;
      if (show("gradeLevel")) payload.gradeLevel = gradeLevel || undefined;
      if (show("incomeBracket")) payload.incomeBracket = incomeBracket || 0;
      if (show("gpa")) payload.gpa = gpa === "" ? undefined : Number(gpa);
      if (show("interests")) payload.interests = interests || undefined;

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
      const data = await res.json();
      setSaved(true);
      onSaved?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-gray-200 p-4">
      <h2 className="text-sm font-bold">{title}</h2>

      <div className="grid grid-cols-2 gap-4">
        {show("region") && (
          <div>
            <label className="mb-1 block text-sm font-medium">거주 지역</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">선택 안 함</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}
        {show("major") && (
          <div>
            <label className="mb-1 block text-sm font-medium">전공/학과</label>
            <input
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="예: 경영학과"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        {show("gradeLevel") && (
          <div>
            <label className="mb-1 block text-sm font-medium">학년</label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value={0}>선택 안 함</option>
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <option key={g} value={g}>
                  {g}학년
                </option>
              ))}
            </select>
          </div>
        )}
        {show("incomeBracket") && (
          <div>
            <label className="mb-1 block text-sm font-medium">소득분위</label>
            <select
              value={incomeBracket}
              onChange={(e) => setIncomeBracket(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value={0}>해당없음/모름</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((b) => (
                <option key={b} value={b}>
                  {b}구간
                </option>
              ))}
            </select>
          </div>
        )}
        {show("gpa") && (
          <div>
            <label className="mb-1 block text-sm font-medium">직전 학기 성적 (4.5 만점)</label>
            <input
              type="number"
              step={0.01}
              min={0}
              max={4.5}
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              placeholder="예: 3.75"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      {show("interests") && (
        <div>
          <label className="mb-1 block text-sm font-medium">관심분야 (대외활동/공모전 추천에 사용)</label>
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="예: 마케팅, 데이터 분석, 디자인"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">저장되었습니다.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

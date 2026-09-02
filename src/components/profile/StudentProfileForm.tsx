"use client";

import { useState } from "react";
import { Select, SELECT_NONE_VALUE as NONE } from "@/components/ui/Select";

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

// 장학금 학과구분 매칭용 — KOSAF 원본 데이터의 학과계열 분류가 이 8개(제한없음 제외 7개)뿐이라
// 자유 텍스트 major와 별개로 이 고정된 값 중에서 고르게 한다(src/lib/scholarship/match.ts 참고).
const DEPARTMENT_FIELDS = [
  "인문계열",
  "사회계열",
  "교육계열",
  "공학계열",
  "자연계열",
  "의약계열",
  "예체능계열",
];

export interface StudentProfileValue {
  region: string | null;
  major: string | null;
  departmentField: string | null;
  gradeLevel: number | null;
  incomeBracket: number | null;
  gpa: number | null;
  interests: string | null;
}

export type StudentProfileField =
  | "region"
  | "major"
  | "departmentField"
  | "gradeLevel"
  | "incomeBracket"
  | "gpa"
  | "interests";

const ALL_FIELDS: StudentProfileField[] = [
  "region",
  "major",
  "departmentField",
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
  const [departmentField, setDepartmentField] = useState(initialValue.departmentField ?? "");
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
      if (show("departmentField")) payload.departmentField = departmentField || undefined;
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-sb-border p-4">
      <h2 className="text-sm font-bold">{title}</h2>

      <div className="grid grid-cols-2 gap-4">
        {show("region") && (
          <div>
            <label className="mb-1 block text-sm font-medium">거주 지역</label>
            <Select
              value={region || NONE}
              onValueChange={(v) => setRegion(v === NONE ? "" : v)}
              options={[
                { value: NONE, label: "선택 안 함" },
                ...REGIONS.map((r) => ({ value: r, label: r })),
              ]}
            />
          </div>
        )}
        {show("major") && (
          <div>
            <label className="mb-1 block text-sm font-medium">전공/학과</label>
            <input
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="예: 경영학과"
              className="w-full rounded-md border border-sb-border px-3 py-2 text-sm"
            />
          </div>
        )}
        {show("departmentField") && (
          <div>
            <label className="mb-1 block text-sm font-medium">학과 계열 (장학금 매칭용)</label>
            <Select
              value={departmentField || NONE}
              onValueChange={(v) => setDepartmentField(v === NONE ? "" : v)}
              options={[
                { value: NONE, label: "선택 안 함" },
                ...DEPARTMENT_FIELDS.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
        )}
        {show("gradeLevel") && (
          <div>
            <label className="mb-1 block text-sm font-medium">학년</label>
            <Select
              value={String(gradeLevel)}
              onValueChange={(v) => setGradeLevel(Number(v))}
              options={[
                { value: "0", label: "선택 안 함" },
                ...[1, 2, 3, 4, 5, 6].map((g) => ({ value: String(g), label: `${g}학년` })),
              ]}
            />
          </div>
        )}
        {show("incomeBracket") && (
          <div>
            <label className="mb-1 block text-sm font-medium">소득분위</label>
            <Select
              value={String(incomeBracket)}
              onValueChange={(v) => setIncomeBracket(Number(v))}
              options={[
                { value: "0", label: "해당없음/모름" },
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((b) => ({
                  value: String(b),
                  label: `${b}구간`,
                })),
              ]}
            />
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
              className="w-full rounded-md border border-sb-border px-3 py-2 text-sm"
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
            className="w-full rounded-md border border-sb-border px-3 py-2 text-sm"
          />
        </div>
      )}

      {error && <p className="text-sm text-[#ff8a8a]">{error}</p>}
      {saved && <p className="text-sm text-sb-accent-deep">저장되었습니다.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

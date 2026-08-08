"use client";

import { useState } from "react";

export interface SubjectRef {
  id: string;
  name: string;
  color: string;
}

export function SubjectPicker({
  subjects,
  value,
  onChange,
  onCreated,
  allowNone,
  label = "과목",
}: {
  subjects: SubjectRef[];
  value: string | null;
  onChange: (subjectId: string | null) => void;
  onCreated?: (subject: SubjectRef) => void;
  allowNone?: boolean;
  label?: string;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "과목을 만들 수 없습니다.");
      }
      const subject = await res.json();
      onCreated?.(subject);
      onChange(subject.id);
      setNewName("");
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "과목을 만들 수 없습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (creating) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium">{label}</label>
        <div className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="새 과목 이름"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="shrink-0 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            추가
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewName("");
              setError(null);
            }}
            className="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            취소
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {allowNone && <option value="">선택 안 함</option>}
          {!allowNone && <option value="" disabled>과목을 선택하세요</option>}
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          새 과목...
        </button>
      </div>
    </div>
  );
}

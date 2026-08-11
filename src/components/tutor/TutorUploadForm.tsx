"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubjectPicker, type SubjectRef } from "@/components/SubjectPicker";

export function TutorUploadForm({ subjects: initialSubjects }: { subjects: SubjectRef[] }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectRef[]>(initialSubjects);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (subjectId) formData.append("subjectId", subjectId);

      const uploadRes = await fetch("/api/notes", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error ?? "업로드에 실패했습니다.");
      }
      const uploaded = await uploadRes.json();

      router.push(`/tutor/${uploaded.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-gray-200 p-4">
      <label className="block text-sm font-medium">
        새 파일로 바로 질문하기 (PDF, DOCX, PPTX, 이미지 - 최대 20MB)
      </label>
      <SubjectPicker
        subjects={subjects}
        value={subjectId}
        onChange={setSubjectId}
        onCreated={(s) => setSubjects((prev) => [...prev, s])}
        allowNone
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".pdf,.docx,.pptx,image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block flex-1 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
        />
        <button
          type="submit"
          disabled={loading || !file}
          className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "업로드 중..." : "업로드하고 질문하기"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubjectPicker, type SubjectRef } from "@/components/SubjectPicker";

export function UploadForm({ subjects: initialSubjects }: { subjects: SubjectRef[] }) {
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

      router.push(`/notes/${uploaded.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SubjectPicker
        subjects={subjects}
        value={subjectId}
        onChange={setSubjectId}
        onCreated={(s) => setSubjects((prev) => [...prev, s])}
        allowNone
      />

      <div>
        <label className="mb-1 block text-sm font-medium">
          노트 파일 (PDF, DOCX, PPTX, 이미지 - 최대 20MB)
        </label>
        <input
          type="file"
          accept=".pdf,.docx,.pptx,image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
          required
        />
        <p className="mt-2 text-xs text-gray-500">
          업로드 후 상세 페이지에서 요약, 설명, 질문하기 중 원하는 걸 만들 수 있어요.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !file}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? "업로드 중..." : "업로드"}
      </button>
    </form>
  );
}

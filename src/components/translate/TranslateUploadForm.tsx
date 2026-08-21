"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TranslateUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !subjectName.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectName", subjectName.trim());

      const res = await fetch("/api/translate", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "변환에 실패했습니다.");
      }
      const translation = await res.json();

      router.push(`/translate/${translation.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium">과목명</label>
        <input
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="예: 유기화학, 거시경제학"
          required
          className="w-full rounded-md border border-white/15 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-sb-mute">
          입력한 과목명은 전공 용어를 더 정확히 번역하는 데 참고자료로 쓰여요.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">영어 PDF 파일 (최대 20MB)</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-white/5 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-white/10"
          required
        />
      </div>

      {error && <p className="text-sm text-[#ff8a8a]">{error}</p>}

      <button
        type="submit"
        disabled={loading || !file || !subjectName.trim()}
        className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? "변환 중... (페이지 수에 따라 몇 분 걸릴 수 있어요)" : "변환하기"}
      </button>
    </form>
  );
}

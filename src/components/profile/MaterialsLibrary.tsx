"use client";

import { useState } from "react";
import Link from "next/link";
import { SubjectPicker, type SubjectRef } from "@/components/SubjectPicker";

interface LibraryFile {
  id: string;
  originalName: string;
  subjectId: string | null;
  sizeBytes: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function MaterialsLibrary({
  initialSubjects,
  initialFiles,
}: {
  initialSubjects: SubjectRef[];
  initialFiles: LibraryFile[];
}) {
  const [subjects, setSubjects] = useState<SubjectRef[]>(initialSubjects);
  const [files, setFiles] = useState<LibraryFile[]>(initialFiles);

  const [uploadSubjectId, setUploadSubjectId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (uploadSubjectId) formData.append("subjectId", uploadSubjectId);

      const res = await fetch("/api/notes", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "업로드에 실패했습니다.");
      }
      const uploaded = await res.json();
      setFiles((prev) => [uploaded, ...prev]);
      setUploadFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function handleReassign(fileId: string, subjectId: string | null) {
    const prevFiles = files;
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, subjectId } : f)));
    const res = await fetch(`/api/notes/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId }),
    });
    if (!res.ok) {
      setFiles(prevFiles);
      alert("과목 변경에 실패했습니다.");
    }
  }

  async function handleDelete(fileId: string) {
    if (!confirm("이 자료를 삭제하시겠습니까? 연결된 노트/요약도 함께 삭제됩니다.")) return;
    const res = await fetch(`/api/notes/${fileId}`, { method: "DELETE" });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } else {
      alert("삭제에 실패했습니다.");
    }
  }

  const groups: { subject: SubjectRef | null; files: LibraryFile[] }[] = [
    ...subjects.map((s) => ({ subject: s, files: files.filter((f) => f.subjectId === s.id) })),
    { subject: null, files: files.filter((f) => f.subjectId === null) },
  ].filter((g) => g.files.length > 0);

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleUpload}
        className="space-y-3 rounded-md border border-gray-200 p-4"
      >
        <SubjectPicker
          subjects={subjects}
          value={uploadSubjectId}
          onChange={setUploadSubjectId}
          onCreated={(s) => setSubjects((prev) => [...prev, s])}
          allowNone
          label="자료를 추가할 과목"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".pdf,.docx,.pptx,image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            className="block flex-1 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
          />
          <button
            type="submit"
            disabled={uploading || !uploadFile}
            className="shrink-0 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {groups.length === 0 ? (
        <p className="text-sm text-gray-600">아직 업로드한 자료가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.subject?.id ?? "unclassified"}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
                {group.subject && (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: group.subject.color }}
                  />
                )}
                {group.subject?.name ?? "미분류"}
              </h3>
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                {group.files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {formatSize(file.sizeBytes)} ·{" "}
                        {new Date(file.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                      <div className="mt-1 flex gap-3 text-xs">
                        <Link href={`/notes/${file.id}`} className="text-gray-600 underline">
                          노트에서 열기
                        </Link>
                        <Link href={`/tutor/${file.id}`} className="text-gray-600 underline">
                          AI선생님에게 질문
                        </Link>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={file.subjectId ?? ""}
                        onChange={(e) => handleReassign(file.id, e.target.value || null)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="">미분류</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDelete(file.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

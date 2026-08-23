"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SubjectPicker, type SubjectRef } from "@/components/SubjectPicker";

interface LibraryFile {
  id: string;
  originalName: string;
  subjectId: string | null;
  sizeBytes: number;
  createdAt: string;
  fileKind: string;
}

// "미분류" 폴더는 실제 Subject 레코드가 아니라서(과목 삭제 시 subjectId가 SetNull로 빠지는
// 파일들을 담는 가상 그룹) 폴더 그리드에서 다른 과목과 똑같이 다루기 위한 placeholder id.
const UNCLASSIFIED_ID = "__unclassified__";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function fileKindIcon(kind: string): string {
  switch (kind) {
    case "pdf":
      return "📄";
    case "docx":
      return "📝";
    case "pptx":
      return "📊";
    case "image":
      return "🖼️";
    default:
      return "📄";
  }
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

  // 폴더 그리드(null) ↔ 특정 과목 폴더 안(subjectId) 두 화면을 오간다.
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);

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

  // 폴더 그리드에 띄울 항목: 파일이 1개 이상 있는 과목 + (미분류 파일이 있으면) 미분류.
  const folders = useMemo(() => {
    const bySubject = subjects
      .map((s) => ({ id: s.id, name: s.name, color: s.color, count: files.filter((f) => f.subjectId === s.id).length }))
      .filter((f) => f.count > 0);
    const unclassifiedCount = files.filter((f) => f.subjectId === null).length;
    return unclassifiedCount > 0
      ? [...bySubject, { id: UNCLASSIFIED_ID, name: "미분류", color: "#9ca3af", count: unclassifiedCount }]
      : bySubject;
  }, [subjects, files]);

  const openFolder = folders.find((f) => f.id === openFolderId) ?? null;
  const openFolderFiles = openFolder
    ? files.filter((f) => (openFolder.id === UNCLASSIFIED_ID ? f.subjectId === null : f.subjectId === openFolder.id))
    : [];

  function openFolderAndPreselect(id: string) {
    setOpenFolderId(id);
    setUploadSubjectId(id === UNCLASSIFIED_ID ? null : id);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleUpload}
        className="space-y-3 rounded-md border border-sb-border p-4"
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
            className="block flex-1 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-sb-card file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-sb-hover"
          />
          <button
            type="submit"
            disabled={uploading || !uploadFile}
            className="shrink-0 rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        </div>
        {error && <p className="text-sm text-[#ff8a8a]">{error}</p>}
      </form>

      {folders.length === 0 ? (
        <p className="text-sm text-sb-mute">아직 업로드한 자료가 없습니다.</p>
      ) : !openFolder ? (
        // 폴더 그리드 화면
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => openFolderAndPreselect(folder.id)}
              className="relative flex flex-col items-center gap-1.5 rounded-lg border border-sb-border px-3 py-4 text-center hover:bg-sb-hover"
            >
              <span
                className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
              <span className="text-3xl">📁</span>
              <span className="truncate text-sm font-medium text-sb-text">{folder.name}</span>
              <span className="text-xs text-sb-mute">{folder.count}개</span>
            </button>
          ))}
        </div>
      ) : (
        // 과목 폴더 내부 화면
        <div>
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenFolderId(null)}
              className="text-sm text-sb-mute hover:text-sb-text"
            >
              ← 뒤로
            </button>
            <h3 className="flex items-center gap-2 text-sm font-medium text-sb-text">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: openFolder.color }}
              />
              📁 {openFolder.name} ({openFolder.count}개)
            </h3>
          </div>
          <ul className="divide-y divide-sb-border rounded-md border border-sb-border">
            {openFolderFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-lg">{fileKindIcon(file.fileKind)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-sb-body">{file.originalName}</p>
                    <p className="text-xs text-sb-mute">
                      {formatSize(file.sizeBytes)} ·{" "}
                      {new Date(file.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                    <div className="mt-1 flex gap-3 text-xs">
                      <Link href={`/notes/${file.id}`} className="text-sb-mute underline">
                        노트에서 열기
                      </Link>
                      <Link href={`/tutor/${file.id}`} className="text-sb-mute underline">
                        AI선생님에게 질문
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={file.subjectId ?? ""}
                    onChange={(e) => handleReassign(file.id, e.target.value || null)}
                    className="rounded-md border border-sb-border px-2 py-1 text-xs"
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
                    className="text-xs font-medium text-[#ff8a8a] hover:text-[#ff8a8a]"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

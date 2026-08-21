"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SubjectPicker, type SubjectRef } from "@/components/SubjectPicker";
import {
  EXAM_DIFFICULTY_MIN,
  EXAM_DIFFICULTY_MAX,
  EXAM_DIFFICULTY_DEFAULT,
  describeDifficulty,
  describePastExamWeight,
} from "@/lib/prompts/examGenerate";

interface LibraryFile {
  id: string;
  originalName: string;
  subjectId: string | null;
  createdAt: string;
}

async function uploadLibraryFile(file: File, subjectId: string | null): Promise<LibraryFile> {
  const formData = new FormData();
  formData.append("file", file);
  if (subjectId) formData.append("subjectId", subjectId);

  const res = await fetch("/api/notes", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "파일 업로드에 실패했습니다.");
  }
  return res.json();
}

function sortForSubject(files: LibraryFile[], subjectId: string | null): LibraryFile[] {
  return [...files].sort((a, b) => {
    const aMatch = a.subjectId === subjectId ? 0 : 1;
    const bMatch = b.subjectId === subjectId ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function ExamConfigForm({
  subjects: initialSubjects,
  libraryFiles: initialLibraryFiles,
}: {
  subjects: SubjectRef[];
  libraryFiles: LibraryFile[];
}) {
  const router = useRouter();

  const [subjects, setSubjects] = useState<SubjectRef[]>(initialSubjects);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [mcqCount, setMcqCount] = useState(5);
  const [shortCount, setShortCount] = useState(3);
  const [essayCount, setEssayCount] = useState(1);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(50);
  const [difficulty, setDifficulty] = useState(EXAM_DIFFICULTY_DEFAULT);
  const [professorNotes, setProfessorNotes] = useState("");

  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>(initialLibraryFiles);
  const [referenceFileIds, setReferenceFileIds] = useState<string[]>([]);
  const [referenceUploading, setReferenceUploading] = useState(false);

  const [pastExamFileId, setPastExamFileId] = useState<string | null>(null);
  const [pastExamUploading, setPastExamUploading] = useState(false);
  const [pastExamWeight, setPastExamWeight] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedFiles = useMemo(() => sortForSubject(libraryFiles, subjectId), [libraryFiles, subjectId]);

  function toggleReferenceFile(id: string) {
    setReferenceFileIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  async function handleReferenceFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setReferenceUploading(true);
    try {
      for (const file of files) {
        const uploaded = await uploadLibraryFile(file, subjectId);
        setLibraryFiles((prev) => [uploaded, ...prev]);
        setReferenceFileIds((prev) => [...prev, uploaded.id]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "참고자료 업로드에 실패했습니다.");
    } finally {
      setReferenceUploading(false);
    }
  }

  async function handlePastExamFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setPastExamUploading(true);
    try {
      const uploaded = await uploadLibraryFile(file, subjectId);
      setLibraryFiles((prev) => [uploaded, ...prev]);
      setPastExamFileId(uploaded.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "기출문제 업로드에 실패했습니다.");
    } finally {
      setPastExamUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!subjectId) {
      setError("과목을 선택해주세요.");
      return;
    }
    if (referenceFileIds.length === 0) {
      setError("참고자료 파일을 하나 이상 선택해주세요.");
      return;
    }
    if (mcqCount + shortCount + essayCount === 0) {
      setError("문제를 최소 1개 이상 구성해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          title: title.trim() || "예상시험문제",
          mcqCount,
          shortCount,
          essayCount,
          timeLimitMinutes,
          difficulty,
          professorNotes: professorNotes.trim() || undefined,
          sourceFileIds: referenceFileIds,
          pastExamFileId: pastExamFileId ?? undefined,
          pastExamWeight: pastExamFileId ? pastExamWeight : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "시험 생성에 실패했습니다.");
      }
      const paper = await res.json();
      router.push(`/exams/${paper.id}`);
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
      />

      <div>
        <label className="mb-1 block text-sm font-medium">시험 제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 중간고사 대비 예상문제"
          className="w-full rounded-md border border-white/15 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium">객관식</label>
          <input
            type="number"
            min={0}
            max={30}
            value={mcqCount}
            onChange={(e) => setMcqCount(Number(e.target.value))}
            className="w-full rounded-md border border-white/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">단답형</label>
          <input
            type="number"
            min={0}
            max={30}
            value={shortCount}
            onChange={(e) => setShortCount(Number(e.target.value))}
            className="w-full rounded-md border border-white/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">서술형</label>
          <input
            type="number"
            min={0}
            max={15}
            value={essayCount}
            onChange={(e) => setEssayCount(Number(e.target.value))}
            className="w-full rounded-md border border-white/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">시험 시간(분)</label>
          <input
            type="number"
            min={5}
            max={300}
            value={timeLimitMinutes}
            onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
            className="w-full rounded-md border border-white/15 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 flex items-center justify-between text-sm font-medium">
          <span>난이도</span>
          <span className="text-sb-mute">{difficulty}/10</span>
        </label>
        <input
          type="range"
          min={EXAM_DIFFICULTY_MIN}
          max={EXAM_DIFFICULTY_MAX}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="w-full"
        />
        <div className="mt-1 flex justify-between text-[10px] text-sb-mute/70">
          <span>0 매우 쉬움</span>
          <span>3 기본</span>
          <span>5 보통</span>
          <span>7 어려움</span>
          <span>10 최상위</span>
        </div>
        <p className="mt-1 text-xs text-sb-mute">
          난이도 {difficulty} — {describeDifficulty(difficulty).label}: {describeDifficulty(difficulty).rubric}
        </p>
        <p className="mt-1 text-xs text-sb-mute/70">
          시험 시간은 난이도를 바꾸지 않습니다. 문제 개수에 비해 시험 시간이 넉넉하면, AI가 이
          난이도를 유지한 채 문제 하나하나의 풀이 단계·서술량·소문항을 늘려 시간을 채웁니다.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          교수님 출제 성향 / 특이사항 (선택)
        </label>
        <textarea
          value={professorNotes}
          onChange={(e) => setProfessorNotes(e.target.value)}
          rows={4}
          placeholder="예: 암기보다는 개념 이해를 묻는 문제 위주. 계산 문제 비중이 높았음."
          className="w-full rounded-md border border-white/15 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">참고자료 파일</label>
        {sortedFiles.length === 0 ? (
          <p className="mb-2 text-xs text-sb-mute">
            아직 업로드한 자료가 없습니다. 아래에서 새로 업로드해주세요.
          </p>
        ) : (
          <div className="mb-2 max-h-56 space-y-1 overflow-y-auto rounded-md border border-white/10 p-2">
            {sortedFiles.map((f) => (
              <label
                key={f.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={referenceFileIds.includes(f.id)}
                  onChange={() => toggleReferenceFile(f.id)}
                />
                <span className="truncate">{f.originalName}</span>
              </label>
            ))}
          </div>
        )}
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,image/png,image/jpeg,image/webp,image/gif"
          onChange={handleReferenceFilesChange}
          disabled={referenceUploading}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-white/5 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-white/10"
        />
        {referenceUploading && <p className="mt-2 text-xs text-sb-mute">업로드 중...</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">기출문제 (족보, 선택)</label>
        {sortedFiles.length > 0 && (
          <div className="mb-2 max-h-56 space-y-1 overflow-y-auto rounded-md border border-white/10 p-2">
            <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/5">
              <input
                type="radio"
                name="pastExamFile"
                checked={pastExamFileId === null}
                onChange={() => setPastExamFileId(null)}
              />
              <span>선택 안 함</span>
            </label>
            {sortedFiles.map((f) => (
              <label
                key={f.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/5"
              >
                <input
                  type="radio"
                  name="pastExamFile"
                  checked={pastExamFileId === f.id}
                  onChange={() => setPastExamFileId(f.id)}
                />
                <span className="truncate">{f.originalName}</span>
              </label>
            ))}
          </div>
        )}
        <input
          type="file"
          accept=".pdf,.docx,.pptx,image/png,image/jpeg,image/webp,image/gif"
          onChange={handlePastExamFileChange}
          disabled={pastExamUploading}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-white/5 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-white/10"
        />
        {pastExamUploading && <p className="mt-2 text-xs text-sb-mute">업로드 중...</p>}

        <div className="mt-3">
          <label className="mb-1 flex items-center justify-between text-sm font-medium">
            <span>기출문제 반영 강도</span>
            <span className="text-sb-mute">{pastExamWeight}/10</span>
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={pastExamWeight}
            onChange={(e) => setPastExamWeight(Number(e.target.value))}
            disabled={!pastExamFileId}
            className="w-full disabled:opacity-40"
          />
          <p className="mt-1 text-xs text-sb-mute">
            반영도 {pastExamWeight} — {describePastExamWeight(pastExamWeight)}
          </p>
          <p className="mt-1 text-xs text-sb-mute/70">
            기출 반영도는 문제의 스타일·구조만 결정하며, 위에서 정한 난이도는 그대로 유지됩니다.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-[#ff8a8a]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-sb-accent px-4 py-2 text-sm font-medium text-sb-accent-ink hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? "AI가 시험을 만드는 중... (최대 1~2분)" : "예상시험문제 생성"}
      </button>
    </form>
  );
}

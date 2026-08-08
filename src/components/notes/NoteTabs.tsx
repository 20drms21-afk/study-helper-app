"use client";

import { useState } from "react";
import { SummaryView } from "@/components/notes/SummaryView";
import { GenerateForm } from "@/components/notes/GenerateForm";
import type { SummaryContent, ExplanationContent } from "@/lib/prompts/summarize";

interface NoteEntry<T> {
  id: string;
  title: string;
  content: T;
}

type Tab = "summary" | "explanation";

export function NoteTabs({
  fileId,
  summary,
  explanation,
}: {
  fileId: string;
  summary: NoteEntry<SummaryContent> | null;
  explanation: NoteEntry<ExplanationContent> | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const tabs: { key: Tab; label: string }[] = [
    { key: "summary", label: "요약" },
    { key: "explanation", label: "설명" },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.key
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <NoteContentTab fileId={fileId} type="summary" entry={summary} />
      )}
      {activeTab === "explanation" && (
        <NoteContentTab fileId={fileId} type="explanation" entry={explanation} />
      )}
    </div>
  );
}

function NoteContentTab<T extends SummaryContent | ExplanationContent>({
  fileId,
  type,
  entry,
}: {
  fileId: string;
  type: "summary" | "explanation";
  entry: NoteEntry<T> | null;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <GenerateForm fileId={fileId} type={type} hasContent={entry !== null} />
        {entry && (
          <a
            href={`/api/summaries/${entry.id}/pdf`}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            PDF로 다운로드
          </a>
        )}
      </div>

      {entry ? (
        <SummaryView content={entry.content} type={type} />
      ) : (
        <p className="text-sm text-gray-600">
          아직 생성된 {type === "summary" ? "요약" : "설명"}이 없습니다.
        </p>
      )}
    </div>
  );
}

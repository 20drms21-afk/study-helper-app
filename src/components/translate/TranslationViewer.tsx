"use client";

import { useState } from "react";

function PageNav({
  page,
  maxPage,
  onChange,
}: {
  page: number;
  maxPage: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-white/15 px-2 py-1 text-xs font-medium hover:bg-white/5 disabled:opacity-40"
      >
        이전
      </button>
      <span className="text-xs text-sb-mute">
        {page} / {maxPage}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= maxPage}
        className="rounded-md border border-white/15 px-2 py-1 text-xs font-medium hover:bg-white/5 disabled:opacity-40"
      >
        다음
      </button>
    </div>
  );
}

export function TranslationViewer({
  translationId,
  pageCount,
  translatedPageCount,
}: {
  translationId: string;
  pageCount: number;
  translatedPageCount: number;
}) {
  const [singleView, setSingleView] = useState(false);
  const [originalPage, setOriginalPage] = useState(1);
  const [translatedPage, setTranslatedPage] = useState(1);

  function clamp(page: number, max: number) {
    return Math.min(Math.max(1, page), max);
  }

  return (
    <div>
      {translatedPageCount < pageCount && (
        <p className="mb-4 rounded-md border border-[rgba(232,182,77,0.3)] bg-[rgba(232,182,77,0.12)] p-3 text-xs text-[#e8b64d]">
          전체 {pageCount}페이지 중 {translatedPageCount}페이지만 변환되었습니다. 무료 플랜은
          5페이지, Pro 플랜은 60페이지까지 변환됩니다.
        </p>
      )}

      <div className="mb-3 flex justify-end gap-2">
        <a
          href={`/api/translate/${translationId}/download`}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/5"
        >
          번역본 PDF 다운로드
        </a>
        <button
          type="button"
          onClick={() => setSingleView((v) => !v)}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/5"
        >
          {singleView ? "듀얼뷰로 보기" : "번역본만 보기"}
        </button>
      </div>

      <div className={`grid gap-4 ${singleView ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        {!singleView && (
          <div className="rounded-md border border-white/10 p-2">
            <p className="mb-1 text-center text-xs font-medium text-sb-mute">원본</p>
            <img
              src={`/api/translate/${translationId}/page/${originalPage}?variant=original`}
              alt={`원본 ${originalPage}페이지`}
              className="w-full rounded-sm border border-white/10"
            />
            <PageNav
              page={originalPage}
              maxPage={pageCount}
              onChange={(p) => setOriginalPage(clamp(p, pageCount))}
            />
          </div>
        )}

        <div className="rounded-md border border-white/10 p-2">
          <p className="mb-1 text-center text-xs font-medium text-sb-mute">번역본</p>
          <img
            src={`/api/translate/${translationId}/page/${translatedPage}?variant=translated`}
            alt={`번역본 ${translatedPage}페이지`}
            className="w-full rounded-sm border border-white/10"
          />
          <PageNav
            page={translatedPage}
            maxPage={translatedPageCount}
            onChange={(p) => setTranslatedPage(clamp(p, translatedPageCount))}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-[#ff8a8a]">문제가 발생했습니다.</p>
      <p className="mt-1 max-w-md text-sm text-sb-mute">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-sb-text hover:bg-white/5"
      >
        다시 시도
      </button>
    </div>
  );
}

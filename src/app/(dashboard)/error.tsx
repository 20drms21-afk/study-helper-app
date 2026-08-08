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
      <p className="text-sm font-medium text-red-600">문제가 발생했습니다.</p>
      <p className="mt-1 max-w-md text-sm text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        다시 시도
      </button>
    </div>
  );
}

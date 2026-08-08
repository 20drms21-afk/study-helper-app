interface ActivityListingView {
  id: string;
  title: string;
  organizer: string | null;
  category: string;
  targetInfo: string | null;
  deadlineText: string | null;
  sourceUrl: string;
  matchScore?: number;
}

export function ActivityCard({ activity }: { activity: ActivityListingView }) {
  return (
    <li className="rounded-md border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {activity.category === "contest" ? "공모전" : "대외활동"}
          </span>
          {!!activity.matchScore && activity.matchScore > 0 && (
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              🎯 관심분야 일치
            </span>
          )}
          <p className="text-sm font-medium">{activity.title}</p>
        </div>
        <a
          href={activity.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          자세히 보기
        </a>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {activity.organizer || "주최기관 미상"}
        {activity.deadlineText && ` · ${activity.deadlineText}`}
      </p>
      {activity.targetInfo && <p className="mt-2 text-xs text-gray-600">{activity.targetInfo}</p>}
    </li>
  );
}

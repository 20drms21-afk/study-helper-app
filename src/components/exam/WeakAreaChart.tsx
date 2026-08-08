interface TopicBreakdown {
  topicTag: string;
  score: number;
  possible: number;
  percentage: number;
}

function statusFor(percentage: number): { color: string; label: string } {
  if (percentage >= 80) return { color: "#0ca30c", label: "양호" };
  if (percentage >= 60) return { color: "#fab219", label: "주의" };
  if (percentage >= 40) return { color: "#ec835a", label: "취약" };
  return { color: "#d03b3b", label: "매우 취약" };
}

export function WeakAreaChart({ topics }: { topics: TopicBreakdown[] }) {
  if (topics.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">주제별 취약점 분석</h2>
      <div className="space-y-3">
        {topics.map((topic) => {
          const status = statusFor(topic.percentage);
          return (
            <div key={topic.topicTag}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{topic.topicTag}</span>
                <span className="text-gray-600">
                  {topic.score}/{topic.possible}점 ({topic.percentage}%) ·{" "}
                  <span style={{ color: status.color }}>{status.label}</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(topic.percentage, 2)}%`,
                    backgroundColor: status.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

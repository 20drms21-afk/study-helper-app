export function heatColor(totalSeconds: number): { bg: string; label: string } {
  const minutes = totalSeconds / 60;
  if (minutes <= 0) return { bg: "#f3f4f6", label: "기록 없음" };
  if (minutes < 30) return { bg: "#c6e6c6", label: "30분 미만" };
  if (minutes < 60) return { bg: "#8fd18f", label: "1시간 미만" };
  if (minutes < 120) return { bg: "#4caf50", label: "2시간 미만" };
  return { bg: "#1b7a1b", label: "2시간 이상" };
}

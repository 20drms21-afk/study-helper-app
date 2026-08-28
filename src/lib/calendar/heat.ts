// 날짜 칸을 담는 큰 카드를 (페이지는 다크 브랜드톤을 유지한 채) 흰 종이 카드 스타일로
// 바꾸면서, 히트맵도 어두운 색 계열에서 옅은 회백색→브랜드 라임(sb-accent)으로 짙어지는
// 밝은 계열로 다시 잡음 — 기존 값은 흰 카드 위에서 거의 안 보였다.
export function heatColor(totalSeconds: number): { bg: string; label: string } {
  const minutes = totalSeconds / 60;
  if (minutes <= 0) return { bg: "#E2E6DC", label: "기록 없음" };
  if (minutes < 30) return { bg: "#e2ecd0", label: "30분 미만" };
  if (minutes < 60) return { bg: "#c7dfa0", label: "1시간 미만" };
  if (minutes < 120) return { bg: "#a0cc5f", label: "2시간 미만" };
  return { bg: "#c2ff3d", label: "2시간 이상" };
}

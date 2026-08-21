// 다크 테마 기준 히트맵 — "기록 없음"이 밝은 회색(라이트 테마 전제)이면 어두운 배경 위에서
// 혼자 튀어 보여서, 카드 배경(sb-bg-soft)에서 시작해 브랜드 라임(sb-accent)으로 짙어지게 바꿈.
export function heatColor(totalSeconds: number): { bg: string; label: string } {
  const minutes = totalSeconds / 60;
  if (minutes <= 0) return { bg: "#20231a", label: "기록 없음" };
  if (minutes < 30) return { bg: "#2c3a1f", label: "30분 미만" };
  if (minutes < 60) return { bg: "#3d5527", label: "1시간 미만" };
  if (minutes < 120) return { bg: "#5e8a2f", label: "2시간 미만" };
  return { bg: "#c2ff3d", label: "2시간 이상" };
}

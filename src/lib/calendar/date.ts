// 날짜는 전부 "YYYY-MM-DD" 문자열(date key)로 다룬다. 이 앱은 타임존 처리가
// 전혀 없어서(new Date()를 서버 로컬 시간 기준으로만 사용) DateTime/UTC 왕복을
// 피하고, 서버에서 한 번 계산한 날짜 키를 그대로 저장/비교한다.
// 주의: 이 계산은 서버 머신의 로컬 타임존이 KST라는 전제를 깔고 있다 —
// 향후 Vercel 등 UTC 기본 환경에 배포할 때는 TZ=Asia/Seoul을 명시하거나
// 아래 함수들을 명시적으로 KST-aware하게 고쳐야 한다.

export function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key: string, n: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

export function diffDays(fromKey: string, toKey: string): number {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export function daysInMonth(year: number, month: number): number {
  // month: 1-12
  return new Date(year, month, 0).getDate();
}

// 일요일 시작 6x7 그리드(이전/다음 달의 걸친 날짜 포함), 각 칸은 date key.
export function startOfMonthGrid(year: number, month: number): string[] {
  const first = new Date(year, month - 1, 1);
  const firstWeekday = first.getDay(); // 0 = 일요일
  const gridStart = new Date(year, month - 1, 1 - firstWeekday);

  const cells: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(toDateKey(d));
  }
  return cells;
}

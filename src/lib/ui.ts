// 로그인 이후 화면(대시보드) 전체가 공유하는 다크 테마 클래스 모음. 랜딩페이지의 sb-* 토큰을
// 그대로 재사용해서 로그인 전/후 디자인이 끊기지 않게 한다. 색만 바꾸는 목적이라 페이지마다
// 클래스를 따로 손으로 맞추지 않고 여기서 가져다 쓴다.
export const cardClass = "rounded-2xl border border-white/10 bg-sb-bg-soft";
export const cardPadClass = `${cardClass} p-4`;

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-sb-bg px-3.5 py-2.5 text-sm text-sb-text outline-none placeholder:text-sb-mute/50 focus:border-sb-accent/40";

export const labelClass = "mb-1 block text-sm font-medium text-sb-text";

export const primaryButtonClass =
  "rounded-full bg-sb-accent px-4 py-2 text-sm font-bold text-sb-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0";

export const secondaryButtonClass =
  "rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-sb-text hover:bg-white/5 disabled:opacity-50";

export const dangerButtonClass =
  "rounded-full border border-[#ff8a8a]/40 px-4 py-2 text-sm font-medium text-[#ff8a8a] hover:bg-[#ff8a8a]/10 disabled:opacity-50";

export const errorTextClass = "text-sm text-[#ff8a8a]";
export const successTextClass = "text-sm text-sb-accent-deep";
export const mutedTextClass = "text-sb-mute";

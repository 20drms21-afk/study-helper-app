// 새로고침/초기 로드 등 하드 네비게이션 때 이 슬롯이 매칭되는 라우트가 없으면 이걸
// 렌더링한다 — 평소엔 모달이 안 떠 있어야 하므로 아무것도 안 그림.
export default function Default() {
  return null;
}

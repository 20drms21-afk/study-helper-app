// 모달이 열린 상태에서 "/"(홈)으로 소프트 네비게이션했을 때(로고 클릭 등) 이 슬롯이 매칭돼서
// 항상 모달을 닫는다. 그 외 다른 경로는 [...catchAll]/page.tsx가 담당.
export default function AuthModalRoot() {
  return null;
}

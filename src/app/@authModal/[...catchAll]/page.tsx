// 모달이 열린 상태에서(예: /login) 인터셉트 대상이 아닌 다른 경로로 소프트 네비게이션하면
// (예: 다른 메뉴 클릭 등) 이 슬롯이 최신 상태를 유지하려는 Next.js 기본 동작 때문에 모달이
// 그대로 남아있을 수 있다 — required catch-all로 "/" 이외의 모든 경로를 여기서 받아 null을
// 반환해서 그런 경우 항상 모달이 닫히게 한다. "/" 자체는 같은 폴더의 page.tsx가 담당.
export default function AuthModalCatchAll() {
  return null;
}

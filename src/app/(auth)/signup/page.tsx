import { AuthShell } from "@/components/auth/AuthShell";
import { SignupCard } from "@/components/auth/SignupCard";

// 직접 URL로 들어오거나(공유 링크) 새로고침했을 때 뜨는 전체 페이지 버전. 랜딩페이지에서
// 클릭해서 들어올 땐 대신 src/app/@authModal/(.)signup/page.tsx가 가로채서 모달로 띄운다.
export default function SignupPage() {
  return (
    <AuthShell>
      <SignupCard />
    </AuthShell>
  );
}

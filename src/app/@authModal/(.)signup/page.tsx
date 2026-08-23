import { AuthModal } from "@/components/auth/AuthModal";
import { SignupCard } from "@/components/auth/SignupCard";

// 랜딩페이지 등에서 <Link href="/signup">을 클릭(소프트 네비게이션)하면 실제 /signup
// 페이지로 이동하는 대신 이게 가로채서 현재 화면 위에 모달로 띄운다. 직접 URL로 들어오거나
// 새로고침하면 인터셉트가 안 걸려서 src/app/(auth)/signup/page.tsx(전체 페이지)가 대신 뜬다.
export default function InterceptedSignupModal() {
  return (
    <AuthModal>
      <SignupCard />
    </AuthModal>
  );
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { LandingHeader } from "@/components/landing/Header";
import { LandingFooter } from "@/components/landing/Footer";

export const metadata = {
  title: "이용약관 | 공부한입",
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 mb-3 text-lg font-bold text-sb-text">{children}</h2>;
}

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mb-3 text-[13px] leading-relaxed text-sb-mute ${className}`}>{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-sb-mute">{children}</ul>;
}

export default async function TermsPage() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session?.user;
  const userName = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <div className="relative bg-sb-bg font-body-kr">
      <AmbientBackground />
      <div className="relative z-10">
        <LandingHeader loggedIn={loggedIn} userName={userName} />
        <main className="mx-auto w-full max-w-[840px] px-[clamp(20px,5vw,64px)] py-16">
          <div className="mb-8 rounded-md border border-[rgba(232,182,77,0.35)] bg-[rgba(232,182,77,0.08)] p-4 text-[12px] leading-relaxed text-[#e8b64d]">
            ⚠️ 이 문서는 서비스에 실제로 구현된 기능(구독 결제, 회원 탈퇴, AI 기능 등)을 기준으로 작성된{" "}
            <strong>초안</strong>입니다. 법적 효력을 갖는 최종본으로 게시하기 전 반드시 법률 전문가의 검토를
            받으시기 바랍니다. 대괄호(<code>[ ]</code>)로 표시된 항목은 실제 정보로 채워 넣어야 합니다.
          </div>

          <h1 className="mb-2 text-2xl font-bold text-sb-text">이용약관</h1>

          <H2>제1조 (목적)</H2>
          <P>
            이 약관은 공부한입(StudyBite, 이하 &ldquo;회사&rdquo;)이 제공하는 AI 학습 도우미 서비스(이하
            &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항, 기타 필요한
            사항을 규정함을 목적으로 합니다.
          </P>

          <H2>제2조 (정의)</H2>
          <Ul>
            <li>&ldquo;서비스&rdquo;란 노트/요약, 예상문제출력, AI선생님, PDF 영어자료 변환, 문의하기, 학습 캘린더·타이머, 장학금/대외활동 추천 등 회사가 제공하는 일체의 기능을 말합니다.</li>
            <li>&ldquo;이용자&rdquo;란 이 약관에 따라 회사와 이용계약을 체결하고 서비스를 이용하는 회원을 말합니다.</li>
            <li>&ldquo;업로드 자료&rdquo;란 이용자가 서비스 이용을 위해 직접 업로드하는 강의자료·시험자료 등 파일(PDF·DOCX·PPTX·이미지)을 말합니다.</li>
            <li>&ldquo;구독&rdquo;이란 Pro/Master 등 유료 플랜을 결제하여 이용 한도를 확장하는 것을 말합니다.</li>
          </Ul>

          <H2>제3조 (약관의 게시와 개정)</H2>
          <Ul>
            <li>회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면 또는 연결화면에 게시합니다.</li>
            <li>
              회사는 관계 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며, 개정 시 적용일자 및
              개정사유를 명시하여 적용일자 7일 전(이용자에게 불리한 변경의 경우 30일 전)부터 공지합니다.
            </li>
            <li>이용자가 개정 약관에 동의하지 않는 경우 회원 탈퇴를 요청할 수 있으며, 공지 후 적용일까지 별도의 거부 의사를 표시하지 않으면 개정 약관에 동의한 것으로 봅니다.</li>
          </Ul>

          <H2>제4조 (회원가입)</H2>
          <Ul>
            <li>이용자는 이메일·비밀번호를 입력하거나 Google/Kakao 소셜 로그인을 통해 회원가입을 신청합니다.</li>
            <li>회사는 신청에 대하여 특별한 사정이 없는 한 가입을 승낙합니다. 다만 이미 가입된 이메일이거나 관계 법령을 위반한 경우 승낙을 유보 또는 거절할 수 있습니다.</li>
            <li>이 서비스는 대학생을 주 대상으로 하며, 만 14세 미만은 회원가입을 할 수 없습니다.</li>
          </Ul>

          <H2>제5조 (회원 탈퇴 및 자격 상실)</H2>
          <Ul>
            <li>이용자는 마이페이지 &gt; 내 정보 &gt; 회원 탈퇴 기능을 통해 언제든지 탈퇴를 요청할 수 있으며, 요청 즉시 처리됩니다.</li>
            <li>탈퇴 시 업로드 파일, 노트/시험/채팅 기록 등 계정에 연결된 데이터는 즉시 삭제되며 복구할 수 없습니다. 진행 중인 유료 구독이 있는 경우 자동으로 해지 처리되며, 이미 청구된 금액에 대한 환불은 제9조를 따릅니다.</li>
            <li>이용자가 타인의 정보를 도용하거나 서비스 운영을 방해하는 등 이 약관을 위반한 경우, 회사는 사전 통지 후 이용을 제한하거나 계약을 해지할 수 있습니다.</li>
          </Ul>

          <H2>제6조 (서비스의 제공 및 변경)</H2>
          <Ul>
            <li>회사는 연중무휴, 1일 24시간 서비스 제공을 원칙으로 하되, 시스템 점검 등 필요한 경우 서비스의 전부 또는 일부를 일시 중단할 수 있습니다.</li>
            <li>회사는 운영상·기술상 필요에 따라 제공하는 서비스의 내용을 변경할 수 있으며, 이 경우 변경 내용 및 적용일자를 명시하여 사전에 공지합니다.</li>
            <li>
              무료 플랜은 월별 AI 기능 이용 횟수에 한도가 있으며, 한도 초과 시 추가 이용을 위해서는 유료
              구독(Pro/Master)이 필요합니다. 구체적인 한도는 서비스 내 안내를 따릅니다.
            </li>
          </Ul>

          <H2>제7조 (AI 생성 콘텐츠에 관한 유의사항)</H2>
          <Ul>
            <li>
              노트 요약/설명, 예상문제 및 정답·해설, AI선생님 챗봇 답변, PDF 번역 결과 등은 Anthropic Claude
              API 또는 DeepL API 등 인공지능 모델이 생성한 결과물로, 부정확하거나 실제 시험·강의 내용과 다를
              수 있습니다.
            </li>
            <li>AI가 생성한 콘텐츠는 학습 보조 참고 자료이며, 최종적인 학습·시험 대비 판단과 책임은 이용자 본인에게 있습니다.</li>
            <li>PDF 영어자료 번역은 원문 레이아웃을 유지하는 과정에서 일부 서식(색상·굵기 등)이 유실될 수 있으며, 텍스트 내용 자체는 보존됩니다.</li>
          </Ul>

          <H2>제8조 (이용자의 의무 — 업로드 자료)</H2>
          <Ul>
            <li>
              이용자는 저작권 등 제3자의 권리를 침해하지 않는 범위에서만 자료를 업로드해야 하며, 업로드한
              자료의 적법한 이용 권한은 이용자 본인에게 있음을 보증합니다.
            </li>
            <li>이용자는 업로드 자료에 타인의 개인정보(성명, 학번, 연락처 등)가 불필요하게 포함되지 않도록 유의해야 합니다.</li>
            <li>업로드 자료는 노트/시험/AI선생님 기능이 공유하는 저장 공간에 보관되며, 시험 문제의 정답/모범답안은 채점 완료 전까지 이용자에게 노출되지 않습니다.</li>
            <li>이용자는 계정 정보를 제3자와 공유하거나 부정한 방법으로 무료 이용 한도를 우회하는 행위를 해서는 안 됩니다.</li>
          </Ul>

          <H2>제9조 (유료 구독, 결제 및 해지·환불)</H2>
          <Ul>
            <li>유료 구독(Pro/Master)은 토스페이먼츠를 통한 카드 자동결제(빌링키 방식)로 매월 정기 청구됩니다.</li>
            <li>구독 해지는 마이페이지 &gt; 구독/결제 관리에서 즉시 처리되며, 해지 시점부터 다음 결제가 청구되지 않고 즉시 무료(Free) 플랜으로 전환됩니다. 별도의 유예기간은 제공되지 않습니다.</li>
            <li>
              「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 결제일로부터 7일 이내에는 청약철회가
              가능합니다. 다만 서비스(AI 기능 등)를 이미 이용한 경우 관계 법령이 정하는 범위 내에서 환불
              금액이 조정될 수 있습니다. 환불 문의는 문의하기(<code>/inquiries</code>)를 통해 접수합니다.
            </li>
            <li>결제 실패가 반복되는 경우 구독은 자동으로 해지되고 무료 플랜으로 전환될 수 있습니다.</li>
            <li>구독 요금, 플랜별 혜택은 서비스 내 요금제(<code>/billing</code>) 안내를 따르며, 변경 시 사전 공지합니다.</li>
          </Ul>

          <H2>제10조 (게시물 관리 — 문의하기)</H2>
          <Ul>
            <li>문의하기 게시판에 등록한 문의는 다른 이용자에게 익명으로 노출되며, 작성자 식별 정보는 관리자만 열람할 수 있습니다.</li>
            <li>
              회사는 게시물이 관계 법령이나 이 약관을 위반하거나 타인의 권리를 침해한다고 판단되는 경우
              사전 통지 없이 삭제할 수 있습니다.
            </li>
          </Ul>

          <H2>제11조 (지식재산권)</H2>
          <Ul>
            <li>서비스에 관한 저작권 및 지식재산권은 회사에 귀속됩니다. 다만 이용자가 업로드한 자료 및 그 원저작물의 권리는 이용자(또는 원저작권자)에게 있습니다.</li>
            <li>회사는 서비스 제공(AI 처리 등) 목적에 한하여 업로드 자료를 이용할 수 있으며, 이 목적 외로 자료를 이용하지 않습니다.</li>
          </Ul>

          <H2>제12조 (회사의 면책)</H2>
          <Ul>
            <li>회사는 천재지변, 외부 API(Anthropic, DeepL, 토스페이먼츠 등) 장애 등 회사의 귀책사유 없는 사유로 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.</li>
            <li>회사는 이용자가 서비스를 이용하여 기대하는 학습 성과(시험 합격, 성적 향상 등)에 대해 보증하지 않습니다.</li>
            <li>회사는 이용자 상호간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다.</li>
          </Ul>

          <H2>제13조 (준거법 및 재판관할)</H2>
          <P>
            이 약관과 관련한 분쟁에 대해서는 대한민국 법을 준거법으로 하며, 회사와 이용자 간 발생한 분쟁에
            관한 소송은 민사소송법상의 관할법원에 제기합니다.
          </P>

          <H2>부칙</H2>
          <P>이 약관은 2026년 8월 22일부터 시행합니다.</P>
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}

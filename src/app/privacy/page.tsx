import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { LandingHeader } from "@/components/landing/Header";
import { LandingFooter } from "@/components/landing/Footer";

export const metadata = {
  title: "개인정보처리방침 | 공부한입",
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 mb-3 text-lg font-bold text-sb-text">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 mb-2 text-sm font-semibold text-sb-text">{children}</h3>;
}

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mb-3 text-[13px] leading-relaxed text-sb-mute ${className}`}>{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-sb-mute">{children}</ul>;
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="mb-4 overflow-x-auto rounded-md border border-white/10">
      <table className="w-full min-w-[520px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-white/10 bg-sb-card">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-sb-text">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top text-sb-mute">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PrivacyPolicyPage() {
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
            ⚠️ 이 문서는 서비스에 실제로 적용된 데이터 처리 방식을 기준으로 작성된 <strong>초안</strong>입니다.
            법적 효력을 갖는 최종본으로 게시하기 전 반드시 법률 전문가의 검토를 받으시기 바랍니다. 특히{" "}
            <strong>운영자 정보, 사업자등록번호, 개인정보보호책임자 연락처</strong> 등 대괄호(
            <code>[ ]</code>)로 표시된 항목은 실제 정보로 채워 넣어야 합니다.
          </div>

          <h1 className="mb-2 text-2xl font-bold text-sb-text">개인정보처리방침</h1>
          <P>
            공부한입(StudyBite, 이하 &ldquo;회사&rdquo;)은 「개인정보 보호법」 등 관계 법령을 준수하며,
            이용자의 개인정보를 안전하게 처리하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </P>

          <H2>1. 수집하는 개인정보 항목 및 수집 방법</H2>
          <H3>1-1. 회원가입 (이메일/비밀번호)</H3>
          <Ul>
            <li>필수: 이메일, 비밀번호(bcrypt로 해시 처리하여 저장, 평문 보관하지 않음)</li>
            <li>선택: 이름</li>
          </Ul>
          <H3>1-2. 소셜 로그인 (Google, Kakao)</H3>
          <Ul>
            <li>해당 사업자로부터 이메일, 이름을 제공받아 회원가입·로그인에 사용합니다.</li>
            <li>
              동일한 이메일로 이미 비밀번호 계정이 존재하는 경우, 계정 탈취 방지를 위해 자동 연동하지 않고
              로그인을 거부합니다.
            </li>
          </Ul>
          <H3>1-3. 서비스 이용 과정에서 생성·수집되는 정보</H3>
          <Ul>
            <li>업로드한 학습자료 원문(PDF·DOCX·PPTX·이미지) 및 그로부터 추출된 텍스트</li>
            <li>AI 기능(노트 요약/설명, 예상문제 생성·채점, AI선생님 챗봇, PDF 영어자료 번역) 이용 과정에서 생성되는 결과물 및 대화 내용</li>
            <li>학습 캘린더·집중 타이머 기록, 오답노트(복습 큐) 기록</li>
            <li>문의하기 게시판에 등록한 문의 제목·내용</li>
            <li>서비스 이용 통계(기능별 이용 횟수, AI 호출 횟수·비용 — 문서 원문이나 대화 전문은 통계에 포함되지 않음)</li>
            <li>접속 로그, 접속 IP, 쿠키, 서비스 이용기록(자동 수집)</li>
          </Ul>
          <H3>1-4. 선택 입력 — 학습 프로필 (장학금/대외활동 맞춤 추천용)</H3>
          <Ul>
            <li>거주 지역, 전공/학과, 학년, 소득분위, 직전 학기 평균 학점, 관심분야</li>
            <li>
              이 항목은 전부 선택 입력이며, 입력하지 않아도 노트/시험/AI선생님/PDF 번역 등 핵심 기능 이용에는
              제한이 없습니다. 마이페이지에서 언제든 수정·삭제할 수 있습니다.
            </li>
          </Ul>
          <H3>1-5. 결제(구독) 관련 정보</H3>
          <Ul>
            <li>
              카드번호 등 결제수단 정보 자체는 결제대행사인 토스페이먼츠(주)가 직접 수집·보관하며,
              회사는 이를 저장하지 않습니다.
            </li>
            <li>
              회사는 토스페이먼츠가 발급하는 빌링키(재사용 가능한 결제 토큰)와 고객키, 구독 상태, 결제 금액·일시·
              성공/실패 이력만을 보관합니다.
            </li>
          </Ul>

          <H2>2. 개인정보의 수집 및 이용 목적</H2>
          <Ul>
            <li>회원 식별·인증, 부정이용 방지, 회원제 서비스 제공</li>
            <li>노트/예상문제/AI선생님/PDF 번역 등 핵심 기능 제공(업로드 자료 등을 AI 처리를 위해 Anthropic·DeepL로 전송)</li>
            <li>유료 구독(Pro/Master)의 결제, 자동 갱신 청구, 해지, 환불 처리</li>
            <li>입력한 학습 프로필을 바탕으로 한 장학금·대외활동 맞춤 추천</li>
            <li>문의 접수 및 답변, 공지사항 전달</li>
            <li>서비스 개선을 위한 통계 분석(무료 이용 한도 집계, AI 호출 비용 관리 등)</li>
            <li>관계 법령에 따른 의무 이행</li>
          </Ul>

          <H2>3. 개인정보의 보유 및 이용 기간</H2>
          <P>
            원칙적으로 회원 탈퇴 시 지체 없이 파기합니다. 실제로 회원 탈퇴(마이페이지 &gt; 내 정보 &gt; 회원
            탈퇴) 요청 시, 업로드 파일 원본, 번역 결과물 등 저장소에 보관된 파일과 계정에 연결된 모든 학습
            데이터(노트, 시험, 채팅, 캘린더, 타이머 기록 등)가 즉시 삭제되며 복구되지 않습니다.
          </P>
          <P>다만 다음의 경우에는 예외로 하여 명시한 기간 동안 별도 분리 보관 후 파기합니다.</P>
          <Table
            head={["보관 정보", "보관 근거", "보관 기간"]}
            rows={[
              ["계약 또는 청약철회 등에 관한 기록", "전자상거래 등에서의 소비자보호에 관한 법률", "5년"],
              ["대금결제 및 재화 등의 공급에 관한 기록", "전자상거래 등에서의 소비자보호에 관한 법률", "5년"],
              ["소비자의 불만 또는 분쟁처리에 관한 기록", "전자상거래 등에서의 소비자보호에 관한 법률", "3년"],
              ["로그인 기록", "통신비밀보호법", "3개월"],
            ]}
          />

          <H2>4. 개인정보의 파기절차 및 방법</H2>
          <Ul>
            <li>전자적 파일 형태로 저장된 개인정보는 복구·재생이 불가능한 방법으로 영구 삭제합니다.</li>
            <li>회원 탈퇴 시 데이터베이스 레코드와 스토리지에 저장된 파일을 함께 삭제하여 고아 파일이 남지 않도록 처리합니다.</li>
            <li>법령에 따라 별도 보관하는 정보는 보관 기간 종료 후 지체 없이 파기합니다.</li>
          </Ul>

          <H2>5. 개인정보의 제3자 제공</H2>
          <P>
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 법령에 근거가 있거나 수사
            목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.
          </P>

          <H2>6. 개인정보 처리 위탁 및 국외 이전</H2>
          <P>
            회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 외부 업체에 위탁하고 있으며,
            이 중 일부는 국외 사업자로 개인정보가 국외로 이전됩니다. 위탁 계약 시 개인정보가 안전하게
            관리될 수 있도록 필요한 사항을 규정하고 있습니다.
          </P>
          <Table
            head={["수탁업체", "이전 국가", "위탁 업무 / 이전 항목", "보유·이용 기간"]}
            rows={[
              [
                "Anthropic, PBC",
                "미국",
                "AI 기능(요약/설명, 예상문제 생성·채점, AI선생님 챗봇, 활동·장학금 매칭) 처리를 위해 업로드 문서·채팅 내용 등을 전송",
                "회원 탈퇴 또는 위탁계약 종료 시까지",
              ],
              [
                "DeepL SE",
                "독일(EU)",
                "PDF 영어자료 한글 번역을 위해 문서 파일 전송",
                "회원 탈퇴 또는 위탁계약 종료 시까지",
              ],
              [
                "Supabase, Inc.",
                "해외(리전 설정에 따름)",
                "데이터베이스(회원정보 등) 및 업로드 파일 저장소 호스팅",
                "회원 탈퇴 또는 위탁계약 종료 시까지",
              ],
              [
                "Vercel Inc.",
                "미국",
                "애플리케이션 호스팅·배포 인프라 제공",
                "위탁계약 종료 시까지",
              ],
              [
                "토스페이먼츠(주)",
                "국내",
                "구독 결제·정기 청구 대행",
                "관계 법령에 따른 보관 기간",
              ],
              [
                "Google LLC / Kakao Corp.",
                "해당 사업자 소재국",
                "소셜 로그인(OAuth) 인증",
                "회원 탈퇴 시까지",
              ],
              [
                "Google LLC (Gmail SMTP)",
                "미국",
                "비밀번호 재설정 등 안내 메일 발송",
                "발송 목적 달성 즉시",
              ],
            ]}
          />
          <P>
            국외 이전되는 항목은 위탁 업무 수행에 필요한 최소한의 정보(예: 문서 원문, 이메일 등)이며, 각
            수탁업체는 자체 개인정보 보호정책 및 계약에 따라 이를 처리합니다. 국외 이전을 거부하고자 하는
            경우 회원 탈퇴 또는 문의하기를 통해 요청할 수 있으나, 해당 기능(AI 서비스 등) 이용이 제한될 수
            있습니다.
          </P>
          <P>
            참고: 대외활동/공모전 정보(링커리어) 및 장학금 정보(한국장학재단 공공데이터)는 공개된 데이터를
            수집하는 것으로, 이 과정에서 이용자의 개인정보가 외부로 전송되지 않습니다.
          </P>

          <H2>7. 정보주체의 권리·의무 및 행사 방법</H2>
          <Ul>
            <li>이용자는 마이페이지(&ldquo;내 정보&rdquo;, &ldquo;마이페이지&rdquo;)에서 언제든 자신의 개인정보를 열람·수정할 수 있습니다.</li>
            <li>회원 탈퇴를 통해 개인정보의 삭제를 요청할 수 있으며, 요청 즉시 처리됩니다.</li>
            <li>
              그 밖의 열람·정정·처리정지 요구는 문의하기(<code>/inquiries</code>) 게시판 또는 아래 개인정보
              보호책임자 연락처를 통해 요청할 수 있으며, 회사는 관계 법령이 정한 기간 내에 조치합니다.
            </li>
            <li>만 14세 미만 아동을 대상으로 하지 않는 서비스이며, 만 14세 미만의 회원가입은 제한됩니다.</li>
          </Ul>

          <H2>8. 개인정보 자동 수집 장치 (쿠키)</H2>
          <P>
            회사는 로그인 상태 유지를 위해 세션 쿠키(NextAuth 인증 토큰)를 사용합니다. 이용자는 브라우저
            설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 로그인이 필요한 기능 이용에 제한이 있을 수
            있습니다.
          </P>

          <H2>9. 개인정보의 안전성 확보조치</H2>
          <Ul>
            <li>비밀번호는 bcrypt 해시 알고리즘으로 암호화하여 저장하며, 평문으로 보관하지 않습니다.</li>
            <li>모든 통신 구간은 HTTPS(TLS)로 암호화합니다.</li>
            <li>관리자 기능(문의 관리 등)은 사전에 지정된 관리자 계정만 접근할 수 있도록 제한합니다.</li>
            <li>데이터베이스 및 파일 저장소는 관리형 클라우드 인프라(Supabase)를 통해 운영·관리됩니다.</li>
            <li>결제 관련 라우트, 웹훅 등은 별도의 인증·서명 검증 절차를 거칩니다.</li>
          </Ul>

          <H2>10. 개인정보 보호책임자</H2>
          <P>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 이용자의 불만 처리 및 피해 구제 등을 위하여
            아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </P>
          <Ul>
            <li>성명: [개인정보 보호책임자 성명]</li>
            <li>연락 방법: 서비스 내 문의하기(<code>/inquiries</code>) 또는 [이메일 주소]</li>
          </Ul>

          <H2>11. 권익침해 구제방법</H2>
          <P>
            개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의할 수 있습니다.
          </P>
          <Ul>
            <li>개인정보분쟁조정위원회 (privacy.kr / 국번없이 1833-6972)</li>
            <li>개인정보침해신고센터 (privacy.kr / 국번없이 118)</li>
            <li>대검찰청 사이버범죄수사단 (spo.go.kr / 국번없이 1301)</li>
            <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)</li>
          </Ul>

          <H2>12. 개인정보처리방침의 변경</H2>
          <P>
            이 개인정보처리방침은 법령·정책 또는 서비스 변경에 따라 내용의 추가·삭제 및 수정이 있을 수
            있으며, 변경 시 시행일 7일 전(중요한 변경의 경우 30일 전)부터 서비스 내 공지사항을 통해
            고지합니다.
          </P>
          <P className="text-sb-mute">공고일자: 2026년 8월 22일 / 시행일자: 2026년 8월 22일</P>
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}

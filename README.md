# 공부한입 (StudyBite)

대학생을 위한 AI 학습 도우미 웹앱입니다. 강의 자료를 한입 크기로 요약해준다는 뜻에서 "공부한입" — 로고도 책을 한입 베어문 모양입니다.

- **노트/요약**: PDF/DOCX/PPTX 문서나 필기 사진을 업로드하면 (1) 2단 레이아웃 압축 요약, (2) 실제 강의처럼 풀어서 설명하는 줄글 버전을 각각 독립적으로 만들 수 있습니다. A4 문서 형태로 보여지며 PDF로 다운로드할 수 있습니다.
- **예상문제출력**: 참고자료 파일과 (선택) 기출문제 파일을 업로드하고 문제 구성, 난이도(0~10), 교수님 출제 성향, 기출문제 반영 강도(0~10)를 입력하면 AI가 예상 시험지를 생성하고, 웹에서 바로 응시하거나 PDF로 인쇄할 수 있습니다. 제출 후에는 자동/AI 채점과 주제별 취약점 분석을 제공합니다. 난이도와 시험시간·문항 수는 서로 독립적인 축으로 설계되어 있어, 문항 수가 적고 시험시간이 길다고 문제가 저절로 어려워지지 않습니다.
- **오답노트**: 시험에서 틀린 문제를 과목별로 자동 수집해 복습 큐로 관리합니다.
- **AI선생님**: 업로드한 노트를 선택해서 그 자료 내용에 근거한 질문-답변 대화를 나눌 수 있습니다.
- **PDF 영어자료 변환**: 영어 PDF를 DeepL Document Translation API로 번역합니다. PDF의 실제 텍스트 레이어를 직접 읽어 문서를 재구성해서 돌려주는 방식이라, 이미지 위에 번역 텍스트 좌표를 추정해서 겹쳐 그리는 방식과 달리 레이아웃이 어긋나지 않습니다.
- **캘린더 / 포모도로**: 시험·과제 일정을 종류별(시험/과제/기타)로 관리하는 캘린더와, 과목별로 집중 시간을 기록하는 포모도로 타이머를 제공합니다.
- **장학금 / 대외활동·공모전**: 프로필(지역/전공/학년/소득분위/학점 등)을 입력하면 조건에 맞는 장학금과, 링커리어(linkareer.com)에서 수집한 모집중인 대외활동·공모전을 매칭해 보여줍니다.
- **요금제 / 사용량 제한**: 무료 플랜은 월간 AI 요청 횟수 제한이 있고, 토스페이먼츠 자동결제(빌링)로 Pro 플랜(무제한)으로 업그레이드할 수 있습니다.
- **문의하기**: 모든 로그인 사용자가 서로의 문의를 익명으로 볼 수 있는 게시판입니다. 관리자 페이지(`/admin/inquiries`, `/admin/activities`)에서는 작성자를 포함해 문의·공모전 데이터를 전체 관리하고 상태 변경/삭제할 수 있습니다.

## 시작하기

### 1. Anthropic API 키 발급

1. [console.anthropic.com](https://console.anthropic.com)에서 가입/로그인합니다. (claude.ai 구독과는 별개의 개발자 콘솔이며, API는 사용량 기반 별도 과금입니다.)
2. **Settings → Billing**에서 결제수단을 등록합니다.
3. **Settings → API Keys → Create Key**로 키를 생성합니다 (`sk-ant-...` 형식).
4. 프로젝트 루트의 `.env.local` 파일에서 `ANTHROPIC_API_KEY` 값을 채워 넣습니다.

### 2. 토스페이먼츠 결제 연동 설정 (선택 — 유료 플랜 사용 시)

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com)에서 가입/로그인합니다. **회원가입만 하면 심사 없이 바로 테스트 키를 쓸 수 있습니다** (자동결제/웹훅 포함).
2. **개발자센터 → API 키** 메뉴에서 "API 개별 연동 키"(빌링/결제창용, 결제위젯 키 아님)의 **테스트 클라이언트 키**(`test_ck_...`)와 **테스트 시크릿 키**(`test_sk_...`)를 확인합니다.
   - 클라이언트 키 → `.env.local`의 `NEXT_PUBLIC_TOSS_CLIENT_KEY`
   - 시크릿 키 → `TOSS_SECRET_KEY`
3. **개발자센터 → 웹훅** 메뉴에서 웹훅을 등록하고(엔드포인트: 배포 후 `https://your-domain/api/billing/toss/webhook`, 로컬 테스트는 ngrok 등 터널링 도구 필요), 웹훅 서명 검증에 쓰이는 키를 `TOSS_WEBHOOK_SECRET_KEY`에 넣습니다.
4. `TOSS_PRO_PLAN_AMOUNT`(Pro 플랜 월 요금, 원 단위 정수)와 `CRON_SECRET`(임의의 랜덤 문자열)을 채워 넣습니다.
5. **중요 — 자동결제(빌링)는 기본 계약과 별도로 추가 계약이 필요합니다.** 실제 운영(라이브 키)으로 전환하려면 사업자등록번호로 가맹심사를 받고(1~2일), 자동결제 이용을 위해 토스페이먼츠 고객센터(1544-7772, support@tosspayments.com)에 별도로 문의해야 합니다(카드사 심사까지 최대 14일). 테스트 키로 개발/테스트하는 동안은 이 절차가 필요 없습니다.
6. **반복 청구는 스스로 스케줄링해야 합니다.** 토스페이먼츠는 Stripe처럼 구독을 자동으로 관리해주지 않고, "빌링키"(재사용 가능한 카드 토큰)만 발급해줍니다. 매달 실제 청구가 일어나려면 `charge-due` 라우트가 주기적으로 호출되어야 합니다. **Vercel에 배포하면 `vercel.json`에 이미 등록된 Cron(매일 UTC 18:00 = KST 03:00)이 자동으로 호출**하며, Vercel이 `CRON_SECRET` 환경변수를 자동으로 `Authorization: Bearer` 헤더에 실어 보냅니다. 로컬 개발 중 수동 테스트는:
   ```bash
   curl -X POST http://localhost:3000/api/billing/toss/charge-due \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
   청구 로직은 `(userId, 결제기간, 시도번호)` 조합에 DB 유니크 제약을 걸어 멱등하게 처리하므로, 같은 날 두 번 호출되어도 이중 청구되지 않습니다. 정책: 1차 청구 실패 시 3일 뒤 1회 재시도 → 그것도 실패하면 즉시 무료 플랜으로 전환(`subscriptionStatus: "suspended"`). 해지(`/api/billing/toss/cancel`)는 즉시 다운그레이드가 아니라 이미 결제한 기간(`currentPeriodEnd`)까지 이용 후 자동 전환되며 환불은 없습니다. 카드가 만료/재발급된 경우 `/billing` 페이지의 "카드 변경"으로 재등록할 수 있습니다.

### 2-1. 장학금 / 대외활동 데이터 동기화

같은 `CRON_SECRET`으로 보호되는 배치 라우트가 두 개 더 있습니다.

**대외활동/공모전**(`/api/activities/sync`)은 `charge-due`와 마찬가지로 `vercel.json`에 Cron이 등록되어 있어(매일 UTC 19:00 = KST 04:00) Vercel 배포 시 자동으로 호출됩니다. AI 웹검색이 아니라 **링커리어(linkareer.com)를 직접 스크래핑**합니다(`src/lib/activity/linkareer.ts`) — 링커리어 목록/상세 페이지 HTML에 박혀있는 Next.js `__NEXT_DATA__` 구조화 데이터를 그대로 읽어오는 방식이라 `ANTHROPIC_API_KEY`도 필요 없고, "모집중"인 것 전부(현재 기준 대외활동+공모전 합쳐 약 1,500건)를 정확한 마감일과 함께 가져옵니다. 마감일이 지난 항목은 다음 동기화 때 자동으로 삭제됩니다. 로컬 수동 테스트:

```bash
curl -X POST http://localhost:3000/api/activities/sync \
  -H "Authorization: Bearer $CRON_SECRET"
```

**장학금**(`/api/scholarships/sync`)은 공공데이터포털 API 연동이 필요한데 `src/lib/scholarship/kosaf.ts`가 아직 스텁 상태라 `KOSAF_API_KEY`를 발급받아 해당 파일을 채우기 전까지는 500을 반환합니다 — 그래서 아직 `vercel.json`에 등록하지 않았습니다(Vercel Hobby 플랜은 Cron을 2개까지만 허용하는데 실제로 동작하지 않는 라우트를 등록해봐야 자리만 차지함). 실제 KOSAF 연동을 완료하면 `charge-due`/`activities/sync`와 같은 방식으로 `vercel.json`에 추가하면 됩니다. 로컬 수동 테스트(구현 전에는 500):

```bash
curl -X POST http://localhost:3000/api/scholarships/sync \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 2-2. 비밀번호 재설정 이메일 발송 설정 (Gmail SMTP)

로그인 화면의 "비밀번호를 잊으셨나요?"는 Gmail 계정으로 이메일을 발송합니다. 아래 설정이 없으면 재설정 링크 요청 시 500 에러가 납니다.

1. 발송에 사용할 Gmail 계정에서 [Google 계정 → 보안](https://myaccount.google.com/security)으로 이동해 **2단계 인증을 켭니다** (앱 비밀번호는 2단계 인증이 켜져 있어야 발급 가능).
2. [Google 계정 → 보안 → 앱 비밀번호](https://myaccount.google.com/apppasswords)에서 새 앱 비밀번호를 생성합니다 (앱 이름은 아무거나 가능, 예: "공부한입").
3. 발급된 16자리 비밀번호를 `.env.local`의 `GMAIL_APP_PASSWORD`에 넣고, `GMAIL_USER`에는 그 Gmail 주소를 넣습니다. **일반 Gmail 로그인 비밀번호가 아니라 이 앱 비밀번호를 써야 합니다.**

### 2-3. 데이터베이스 설정 (Supabase Postgres)

DB는 SQLite가 아니라 **Postgres**(로컬 개발도 포함)를 사용하며, [Supabase](https://supabase.com)의 무료 플랜으로 바로 시작할 수 있습니다.

1. Supabase에서 프로젝트를 생성합니다.
2. **Project Settings → Database**에서 연결 문자열 두 가지를 복사합니다: Transaction pooler(6543 포트, `DATABASE_URL`용)와 Direct connection(5432 포트, `DIRECT_URL`용).
3. 프로젝트 루트의 **`.env`**(⚠️ `.env.local`이 아닙니다 — `prisma.config.ts`가 `.env`를 따로 로드합니다) 파일에 `DATABASE_URL`, `DIRECT_URL`을 채워 넣습니다.
4. Supabase Storage도 함께 쓰는 경우(배포 시 파일 업로드 저장용) `.env.local`의 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`도 채웁니다. 로컬 개발만 한다면 비워두면 `STORAGE_DIR`(로컬 디스크)로 대체됩니다.
5. Supabase 무료 플랜은 **7일간 요청이 없으면 DB가 자동으로 일시정지**됩니다 — 갑자기 쿼리가 멈추거나 응답이 없으면 Supabase 대시보드에서 "Restore"를 눌러 깨워야 합니다.

### 3. 의존성 설치 및 DB 초기화

```bash
npm install
npx prisma migrate dev
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## 환경 변수 (`.env.local` / `.env`)

대부분은 `.env.local`에 넣지만, `DATABASE_URL`/`DIRECT_URL`만 예외적으로 `.env`에 넣습니다(`prisma.config.ts`가 `.env`를 명시적으로 로드하기 때문).

| 변수 | 설명 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API 키 (필수) |
| `CLAUDE_MODEL` | 사용할 Claude 모델 (기본값: `claude-sonnet-5`) |
| `NEXTAUTH_SECRET` | NextAuth 세션 암호화 키 |
| `NEXTAUTH_URL` | 앱 URL (로컬: `http://localhost:3000`) |
| `STORAGE_DIR` | 업로드 파일 저장 경로 (기본값: `./storage`) |
| `FREE_PLAN_MONTHLY_LIMIT` | 무료 플랜 월간 AI 요청 한도 (기본값: 20) |
| `ADMIN_EMAIL` | 관리자 페이지(`/admin`) 접근을 허용할 이메일 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스페이먼츠 클라이언트 키 (브라우저에 노출됨) — 결제 기능 사용 시 필요 |
| `TOSS_SECRET_KEY` | 토스페이먼츠 서버 전용 시크릿 키 — 결제 기능 사용 시 필요 |
| `TOSS_WEBHOOK_SECRET_KEY` | 웹훅 서명 검증용 키 — 결제 기능 사용 시 필요 |
| `TOSS_PRO_PLAN_AMOUNT` | Pro 플랜 월 요금(원, 정수). 기본값: 9900 |
| `CRON_SECRET` | `charge-due`(정기 청구)/`activities/sync`(대외활동 수집)/`scholarships/sync`(장학금 수집) 라우트 보호용 임의의 랜덤 문자열 |
| `KOSAF_API_KEY` | 한국장학재단 학자금지원정보 오픈API 키 (공공데이터포털 활용신청 후 발급). 없으면 `scholarships/sync`는 500 반환, 나머지 기능은 정상 동작 |
| `GMAIL_USER` | 비밀번호 재설정 이메일을 발송할 Gmail 주소 |
| `GMAIL_APP_PASSWORD` | 위 Gmail 계정의 앱 비밀번호(일반 로그인 비밀번호 아님) — 발급 방법은 위 "2-2" 참고. 없으면 비밀번호 찾기는 500 반환, 나머지 기능은 정상 동작 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트(Google Cloud Console 발급). 없으면 로그인 화면에 "Google로 계속하기" 버튼이 표시되지 않음(나머지 기능은 정상 동작) |
| `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` | 카카오 로그인 앱 키(Kakao Developers 발급). 없으면 "카카오로 계속하기" 버튼이 표시되지 않음(나머지 기능은 정상 동작) |
| `FREE_PLAN_MAX_PDF_PAGES` | 무료 플랜 PDF 업로드 최대 페이지 수 (기본값: 40). Pro 플랜은 제한 없음 |
| `DEEPL_API_KEY` | PDF 영어자료 변환(DeepL Document Translation) API 키. [deepl.com](https://www.deepl.com/ko/your-account/keys)에서 발급. Free 계정 키는 끝이 `:fx`로 끝남. 없으면 이 기능만 실패(나머지 기능은 정상 동작) |
| `DEEPL_API_URL` | Free 계정: `https://api-free.deepl.com/v2`(기본값). Pro/Developer/Growth 등 유료 계정: `https://api.deepl.com/v2` |
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres 연결 문자열(pooled/direct) — **`.env`**(⚠️ `.env.local` 아님)에 설정, 로컬/배포 공통으로 사용 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` | Supabase Storage 연동용(파일 업로드 저장). 비워두면 `STORAGE_DIR`(로컬 디스크)로 대체됨 |

## 기술 스택

Next.js 16 (App Router, Turbopack) · TypeScript · Prisma 6 + PostgreSQL(Supabase) · NextAuth (Credentials) · Anthropic SDK · DeepL API(PDF 문서 번역) · Tailwind CSS · @react-pdf/renderer · @hyzyla/pdfium(PDF 라스터화) · pdf-lib(PDF 페이지 서브셋) · jszip(PPTX 파싱) · mammoth(DOCX 파싱) · 토스페이먼츠(Toss Payments) · Nodemailer(Gmail SMTP)

## 참고 사항

- 업로드 지원 형식: PDF, DOCX(.docx만 지원, 구버전 .doc 미지원), PPTX, 이미지(JPEG/PNG/WEBP/GIF), 최대 20MB. **HWP(한글)는 지원하지 않습니다** — PDF로 내보내서 업로드해야 합니다.
- 노트/시험/AI선생님 업로드는 하나의 파일 풀을 공유합니다. 한 메뉴에서 올린 파일은 재업로드 없이 다른 메뉴에서도 바로 선택해서 쓸 수 있습니다. PDF 영어자료 변환은 이 풀과 완전히 분리된 별도 파일 풀을 사용합니다.
- 시험지 PDF에는 한글 폰트(Nanum Gothic, OFL 라이선스)가 임베딩되어 있습니다 (`public/fonts/`).
- 무료 플랜은 월간 AI 요청 횟수 제한(`FREE_PLAN_MONTHLY_LIMIT`) 외에도 업로드 가능한 PDF 페이지 수 제한(`FREE_PLAN_MAX_PDF_PAGES`)이 있습니다. Pro 플랜은 두 제한 모두 없음.
- 토스페이먼츠 반복 청구, 대외활동/공모전 동기화는 자동으로 일어나지 않고 `vercel.json`에 등록된 Cron(또는 수동 curl 호출)이 주기적으로 실행해줘야 합니다 — 위 "2." 항목 참고.
- 현재는 로컬 개발 버전이며, 실제 배포(Vercel 등)는 별도 단계로 진행해야 합니다.

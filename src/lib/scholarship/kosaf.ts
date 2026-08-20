// 한국장학재단(KOSAF)이 공공데이터포털(data.go.kr)에 공개한
// "학자금지원정보(대학생)" 연동부.
//
// 처음엔 "오픈API"로 오해해서 공공데이터포털 활용신청(승인 대기 필요)을 전제로 스텁을
// 남겨뒀었지만, 실제로는 "파일데이터"로 등록되어 있어 활용신청/API키 없이 CSV를 그냥
// 다운로드할 수 있다(https://www.data.go.kr/data/15028252/fileData.do, "파일데이터는
// 로그인 없이 다운로드를 통해 이용하실 수 있습니다"). 무료, 이용허락범위 제한 없음,
// 월간 갱신, 1,850여 행. 컬럼 구조/인코딩(CP949)/CSV 이스케이프 규칙은 실제 파일을
// 받아 직접 검증함.
//
// 다운로드 자체는 버튼 클릭 한 번처럼 보이지만 내부적으로 2단계 요청이다
// (data.go.kr의 /js/biz/datset/script_fileDetail.js, /js/biz/cmm/cmm/script_cmmFunction.js
// 를 읽어서 확인함):
//   1) POST /tcs/dss/selectFileDataDownload.do — publicDataPk 등 고정 파라미터로 요청하면
//      JSON으로 { status: true, atchFileId, fileDetailSn, dataSetFileDetailInfo: {...} }를
//      돌려준다. atchFileId는 서버가 그 자리에서 조회해 채워주는 값이라 요청 시점엔 빈
//      문자열로 보내는 게 정상(실제 브라우저 요청도 그렇게 보냄).
//   2) GET /cmm/cmm/fileDownload.do?atchFileId=...&fileDetailSn=...&dataNm=... — 1)에서
//      받은 값으로 실제 CSV 바이트를 받는다.
// 브라우저 UI는 2) 전에 /cmm/cmm/check-limit.json으로 다운로드 횟수 제한(캡차 필요 여부)을
// 체크하지만, 이건 사람이 반복 클릭하는 걸 막기 위한 UX용 체크라 서버 사이드에서 그
// 호출 없이 바로 2)를 불러도 정상적으로 파일을 받을 수 있음을 확인함(월 1회 배치 정도로는
// 문제될 수준이 아님). publicDataPk/publicDataDetailPk는 이 데이터셋 자체의 고유 식별자라
// KOSAF가 데이터셋을 새로 등록하지 않는 한 바뀌지 않는 값 — 하드코딩한다.
//
// publicDataDetailPk/publicDataPk/publicDataTyCode/fileDetailSn 자체는 비공개 정보가
// 아니라 이 공개 데이터셋 페이지의 다운로드 버튼 onclick 속성에 그대로 노출돼 있는 값이다.
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const PUBLIC_DATA_PK = "15028252";
const PUBLIC_DATA_DETAIL_PK = "uddi:93ea274e-c626-40b9-8963-bbfadccc22ab";
const PUBLIC_DATA_TY_CODE = "PR0051";
const FILE_DETAIL_SN = "1";
const DETAIL_PAGE_URL = `https://www.data.go.kr/data/${PUBLIC_DATA_PK}/fileData.do`;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface RawScholarshipListing {
  externalId: string;
  provider: string;
  name: string;
  kind?: string;
  amountText?: string;
  eligibilityText: string;
  applyPeriodText?: string;
  applyUrl?: string;
  applyStartDate?: string; // "YYYY-MM-DD"
  applyEndDate?: string; // "YYYY-MM-DD"
}

function extractSessionCookie(res: Response): string {
  // Node의 fetch는 Set-Cookie를 여러 개 받아도 헤더 하나로 합쳐버릴 수 있어
  // getSetCookie()가 있으면 그걸 우선 쓰고, 없는 런타임을 대비해 폴백한다.
  const list =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : (() => {
          const raw = res.headers.get("set-cookie");
          return raw ? [raw] : [];
        })();
  return list.map((c) => c.split(";")[0]).join("; ");
}

async function downloadKosafCsv(): Promise<ArrayBuffer> {
  // 1) 세션 쿠키 확보 (파일데이터 상세 페이지 방문)
  const pageRes = await fetch(DETAIL_PAGE_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!pageRes.ok) {
    throw new Error(`data.go.kr 상세 페이지 요청 실패 (status ${pageRes.status})`);
  }
  const cookie = extractSessionCookie(pageRes);

  // 2) 다운로드 가능 여부 확인 + 실제 다운로드에 필요한 atchFileId/fileDetailSn 조회
  const body = new URLSearchParams({
    publicDataDetailPk: PUBLIC_DATA_DETAIL_PK,
    publicDataPk: PUBLIC_DATA_PK,
    publicDataTyCode: PUBLIC_DATA_TY_CODE,
    fileDetailSn: FILE_DETAIL_SN,
    atchFileId: "",
    url: "/tcs/dss/selectFileDataDownload.do",
  });
  const infoRes = await fetch("https://www.data.go.kr/tcs/dss/selectFileDataDownload.do", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: DETAIL_PAGE_URL,
      Cookie: cookie,
      "User-Agent": USER_AGENT,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: body.toString(),
  });
  if (!infoRes.ok) {
    throw new Error(`한국장학재단 파일 정보 조회 실패 (status ${infoRes.status})`);
  }
  const info = (await infoRes.json()) as {
    status: boolean;
    atchFileId?: string;
    fileDetailSn?: string;
    error?: string;
    dataSetFileDetailInfo?: { dataNm?: string; publicDataSj?: string };
  };
  if (info.status !== true || !info.atchFileId || !info.fileDetailSn) {
    throw new Error(info.error ?? "한국장학재단 파일 다운로드 정보를 받지 못했습니다.");
  }
  const dataNm =
    info.dataSetFileDetailInfo?.dataNm ?? info.dataSetFileDetailInfo?.publicDataSj ?? "kosaf";

  // 3) 실제 CSV 다운로드
  const downloadUrl = `https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${encodeURIComponent(
    info.atchFileId
  )}&fileDetailSn=${encodeURIComponent(info.fileDetailSn)}&dataNm=${encodeURIComponent(dataNm)}`;
  const fileRes = await fetch(downloadUrl, {
    headers: { Referer: DETAIL_PAGE_URL, Cookie: cookie, "User-Agent": USER_AGENT },
  });
  if (!fileRes.ok) {
    throw new Error(`한국장학재단 CSV 다운로드 실패 (status ${fileRes.status})`);
  }
  return fileRes.arrayBuffer();
}

// data.go.kr이 내려주는 CSV는 CP949(EUC-KR) 인코딩 + RFC4180 quoted 형식(필드 안에 콤마가
// 많아 전부 큰따옴표로 감쌈, ""로 이스케이프)이다. csv-parse 등 별도 패키지를 추가하는 대신
// PPTX 파싱 때처럼 필요한 만큼만 직접 구현한다 — 실제 파일 1,850행 전부 파싱해 컬럼 수
// 불일치 없음을 검증함. Node 18+ 내장 TextDecoder가 "euc-kr" 라벨을 지원해서 별도
// iconv 패키지도 필요 없다.
function parseKosafCsv(buf: ArrayBuffer): string[][] {
  const text = new TextDecoder("euc-kr").decode(buf);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // skip
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanDate(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v && DATE_RE.test(v) ? v : undefined;
}

function cleanText(value: string | undefined): string {
  const v = value?.trim();
  return v && v !== "해당없음" ? v : "";
}

function cleanUrl(value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v || v === "해당없음") return undefined;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function rowsToListings(rows: string[][]): RawScholarshipListing[] {
  if (rows.length === 0) return [];
  const header = rows[0];
  const idx = (name: string) => header.indexOf(name);

  const col = {
    provider: idx("운영기관명"),
    name: idx("상품명"),
    orgKind: idx("운영기관구분"),
    productKind: idx("상품구분"),
    fundType: idx("학자금유형구분"),
    university: idx("대학구분"),
    grade: idx("학년구분"),
    department: idx("학과구분"),
    gradeCriteria: idx("성적기준 상세내용"),
    incomeCriteria: idx("소득기준 상세내용"),
    support: idx("지원내역 상세내용"),
    qualification: idx("특정자격 상세내용"),
    residency: idx("지역거주여부 상세내용"),
    restriction: idx("자격제한 상세내용"),
    recommendation: idx("추천필요여부 상세내용"),
    homepage: idx("홈페이지 주소"),
    startDate: idx("모집시작일"),
    endDate: idx("모집종료일"),
  };

  const listings: RawScholarshipListing[] = [];
  for (const r of rows.slice(1)) {
    if (r.length < header.length) continue; // 파싱 실패한 마지막 빈 줄 등 방어
    const provider = r[col.provider]?.trim() ?? "";
    const name = r[col.name]?.trim() ?? "";
    if (!provider || !name) continue;

    const applyStartDate = cleanDate(r[col.startDate]);
    const applyEndDate = cleanDate(r[col.endDate]);
    const kind = [r[col.orgKind]?.trim(), r[col.productKind]?.trim()].filter(Boolean).join(" · ");

    const eligibilityParts = [
      ["학자금유형", cleanText(r[col.fundType])],
      ["대학구분", cleanText(r[col.university])],
      ["학년구분", cleanText(r[col.grade])],
      ["학과구분", cleanText(r[col.department])],
      ["성적기준", cleanText(r[col.gradeCriteria])],
      ["소득기준", cleanText(r[col.incomeCriteria])],
      ["특정자격", cleanText(r[col.qualification])],
      ["지역거주여부", cleanText(r[col.residency])],
      ["자격제한", cleanText(r[col.restriction])],
      ["추천필요여부", cleanText(r[col.recommendation])],
    ].filter(([, v]) => v);
    const eligibilityText = eligibilityParts.map(([label, v]) => `[${label}] ${v}`).join("\n");

    listings.push({
      externalId: `${provider}::${name}::${applyStartDate ?? ""}`,
      provider,
      name,
      kind: kind || undefined,
      amountText: cleanText(r[col.support]) || undefined,
      eligibilityText: eligibilityText || "상세 내용 없음",
      applyPeriodText:
        applyStartDate && applyEndDate
          ? `${applyStartDate} ~ ${applyEndDate}`
          : (applyStartDate ?? applyEndDate),
      applyUrl: cleanUrl(r[col.homepage]),
      applyStartDate,
      applyEndDate,
    });
  }
  return listings;
}

export async function fetchScholarshipListings(): Promise<RawScholarshipListing[]> {
  const buf = await downloadKosafCsv();
  const rows = parseKosafCsv(buf);
  return rowsToListings(rows);
}

// 행마다 prisma.scholarshipListing.upsert()를 호출하면(=DB 왕복 1,850번) 실측 97초가
// 걸려서 라우트의 maxDuration(60초, Vercel Hobby 상한)을 넘겨버림 — 매달 이 배치 자체가
// 타임아웃으로 실패하게 됨. ON CONFLICT DO UPDATE 기반 다건 INSERT로 왕복 횟수를
// 배치 개수(10개 안팎)로 줄인다. 배치당 12개 컬럼 × 200행 = 2,400개 파라미터로
// Postgres 파라미터 상한(65,535)에 여유 있게 못 미침.
const UPSERT_BATCH_SIZE = 200;

async function upsertListingsBatch(listings: RawScholarshipListing[]): Promise<void> {
  if (listings.length === 0) return;
  const now = new Date();
  const rows = listings.map(
    (l) =>
      Prisma.sql`(${randomUUID()}, ${l.externalId}, ${l.provider}, ${l.name}, ${l.kind ?? null}, ${
        l.amountText ?? null
      }, ${l.eligibilityText}, ${l.applyPeriodText ?? null}, ${l.applyUrl ?? null}, ${
        l.applyStartDate ?? null
      }, ${l.applyEndDate ?? null}, ${now})`
  );

  await prisma.$executeRaw`
    INSERT INTO "ScholarshipListing"
      ("id", "externalId", "provider", "name", "kind", "amountText", "eligibilityText",
       "applyPeriodText", "applyUrl", "applyStartDate", "applyEndDate", "fetchedAt")
    VALUES ${Prisma.join(rows)}
    ON CONFLICT ("externalId") DO UPDATE SET
      "provider" = EXCLUDED."provider",
      "name" = EXCLUDED."name",
      "kind" = EXCLUDED."kind",
      "amountText" = EXCLUDED."amountText",
      "eligibilityText" = EXCLUDED."eligibilityText",
      "applyPeriodText" = EXCLUDED."applyPeriodText",
      "applyUrl" = EXCLUDED."applyUrl",
      "applyStartDate" = EXCLUDED."applyStartDate",
      "applyEndDate" = EXCLUDED."applyEndDate",
      "fetchedAt" = EXCLUDED."fetchedAt"
  `;
}

export async function syncScholarshipListings(): Promise<{ upserted: number; expired: number }> {
  const listings = await fetchScholarshipListings();

  for (let i = 0; i < listings.length; i += UPSERT_BATCH_SIZE) {
    await upsertListingsBatch(listings.slice(i, i + UPSERT_BATCH_SIZE));
  }

  // 소스 파일 자체가 월 1회만 갱신되므로 이번 동기화에 없는 항목이라고 해서 반드시
  // 마감된 건 아니지만, 모집종료일이 지난 건 확실히 만료된 것 — 동기화 주기와 무관하게
  // 매번 정리한다 (ActivityListing 쪽 syncActivityListings와 동일 패턴).
  const today = new Date().toISOString().slice(0, 10);
  const { count: expired } = await prisma.scholarshipListing.deleteMany({
    where: { applyEndDate: { lt: today } },
  });

  return { upserted: listings.length, expired };
}

// 한국장학재단(KOSAF)이 공공데이터포털(data.go.kr)에 공개한
// "학자금지원정보(대학생)" 오픈API 연동부.
//
// 공공데이터포털 활용신청(사용자가 직접 가입/신청해야 함, 승인까지 시간 소요)이
// 완료되면 발급되는 API 명세서(정확한 엔드포인트 URL, 서비스키 파라미터명,
// 응답 포맷)를 보고 아래 TODO 부분만 채우면 된다. 지금은 명세서가 없어
// 엔드포인트/파라미터를 임의로 추측하지 않고 스텁으로 남겨둔다.
import { prisma } from "@/lib/prisma";

export interface RawScholarshipListing {
  externalId: string;
  provider: string;
  name: string;
  kind?: string;
  amountText?: string;
  eligibilityText: string;
  applyPeriodText?: string;
  applyUrl?: string;
}

export async function fetchScholarshipListings(): Promise<RawScholarshipListing[]> {
  const apiKey = process.env.KOSAF_API_KEY;
  if (!apiKey) {
    throw new Error("KOSAF_API_KEY가 설정되지 않았습니다.");
  }

  // TODO: 공공데이터포털 활용신청 승인 후 발급되는 API 명세서를 참고해
  // 실제 엔드포인트 호출 + 응답 파싱을 구현할 것. 예: 서비스키 쿼리 파라미터명,
  // XML/JSON 응답 포맷, 페이지네이션 방식 등이 명세서에 명시됨.
  throw new Error("fetchScholarshipListings가 아직 구현되지 않았습니다. API 명세서를 참고해 구현하세요.");
}

export async function syncScholarshipListings(): Promise<{ synced: number }> {
  const listings = await fetchScholarshipListings();

  for (const listing of listings) {
    await prisma.scholarshipListing.upsert({
      where: { externalId: listing.externalId },
      create: { ...listing, fetchedAt: new Date() },
      update: { ...listing, fetchedAt: new Date() },
    });
  }

  return { synced: listings.length };
}

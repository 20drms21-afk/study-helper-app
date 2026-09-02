import { prisma } from "@/lib/prisma";

// 예전엔 후보를 Claude에 전부 보내 자격 여부/사유를 판단시켰는데, 후보가 몇십 건뿐이어도
// "모든 장학금에 대해 빠짐없이 결과를 반환"시키는 구조상 출력이 길어지면 Vercel Hobby의
// maxDuration(60초)를 실측으로 넘겨 504로 실패하는 문제가 있었다(2026-09-01 실제 재현·확인).
// KOSAF 데이터를 뜯어보니 학과구분/대학구분/학년구분은 사실 자유서술이 아니라 고정된 체크박스
// 값이 구분자 없이 이어붙은 것뿐이라(src/lib/scholarship/kosaf.ts 참고) 애초에 AI 판단이
// 필요 없었다 — 소득기준/성적기준도 대부분 뚜렷한 숫자 패턴이라 정규식으로 충분하다. 그래서
// 이 매칭을 Claude 호출 없는 순수 DB 필터로 전면 재작성했다: 응답이 SQL 쿼리 하나로 끝나서
// 60초는커녕 밀리초 단위로 끝나고, 토큰 비용도 전혀 안 든다(getActivitiesForUser와 동일 패턴).
//
// 지역거주여부/특정자격/자격제한은 여전히 진짜 자유서술이라(시/군/구 단위 제한이 많은데
// 프로필은 시/도만 있어 세밀도도 안 맞음) 필터링하지 않고 원문 그대로 + 신청 링크를 결과에
// 실어서 사용자가 직접 확인하게 한다.
const MAX_DISPLAYED_SCHOLARSHIPS = 60; // ActivityListing과 동일한 이유로 상한을 둠(getActivitiesForUser 참고)

export interface ScholarshipMatchResult {
  listingId: string;
  provider: string;
  name: string;
  kind: string | null;
  amountText: string | null;
  applyPeriodText: string | null;
  applyUrl: string | null;
  departmentTags: string | null;
  universityTags: string | null;
  gradeCriteriaText: string | null;
  incomeCriteriaText: string | null;
  residencyText: string | null;
  qualificationText: string | null;
  restrictionText: string | null;
  recommendationText: string | null;
}

export async function isScholarshipDataConfigured(): Promise<boolean> {
  const listingCount = await prisma.scholarshipListing.count();
  return listingCount > 0;
}

export async function matchScholarships(userId: string): Promise<{ matches: ScholarshipMatchResult[] }> {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });

  // 대학원 전용(석/박사만) 장학금만 DB에서 미리 걸러낸다 — 나머지(학과/소득/성적)는 프로필의
  // 값 유무에 따라 조건부로 스킵해야 하는 항목이 여러 개라 Prisma where에 욱여넣는 것보다
  // JS에서 거르는 게 명확하다. 실제 후보가 수십~수백 건 수준이라 비용도 무시할 만하다.
  const listings = await prisma.scholarshipListing.findMany({ where: { gradOnly: false } });

  const filtered = listings.filter((l) => {
    // 학과구분: null(학과 무관/조건 불명)이면 무조건 통과. 조건이 있는데 사용자가
    // departmentField를 아직 선택 안 했으면(null) — 정보 부족으로 숨기지 않고 통과시킨다.
    // 선택했다면 그 계열이 태그 목록에 포함된 경우만 통과.
    if (l.departmentTags != null && profile?.departmentField) {
      const tags = l.departmentTags.split(",");
      if (!tags.includes(profile.departmentField)) return false;
    }
    if (l.maxIncomeBracket != null && profile?.incomeBracket && profile.incomeBracket > l.maxIncomeBracket) {
      return false;
    }
    if (l.minGpa != null && profile?.gpa != null && profile.gpa < l.minGpa) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (!a.applyEndDate) return 1;
    if (!b.applyEndDate) return -1;
    return a.applyEndDate.localeCompare(b.applyEndDate);
  });

  return {
    matches: filtered.slice(0, MAX_DISPLAYED_SCHOLARSHIPS).map((l) => ({
      listingId: l.id,
      provider: l.provider,
      name: l.name,
      kind: l.kind,
      amountText: l.amountText,
      applyPeriodText: l.applyPeriodText,
      applyUrl: l.applyUrl,
      departmentTags: l.departmentTags,
      universityTags: l.universityTags,
      gradeCriteriaText: l.gradeCriteriaText,
      incomeCriteriaText: l.incomeCriteriaText,
      residencyText: l.residencyText,
      qualificationText: l.qualificationText,
      restrictionText: l.restrictionText,
      recommendationText: l.recommendationText,
    })),
  };
}

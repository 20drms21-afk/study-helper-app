import { prisma } from "@/lib/prisma";

// 링커리어 전체 스크래핑 이후 DB에 1,000건 넘게 쌓일 수 있어서, 화면에는 매칭 점수가
// 높은 상위 항목만 잘라서 보여준다(DB에는 전부 저장 — 나중에 검색/필터 기능 확장 여지).
const MAX_DISPLAYED_ACTIVITIES = 60;

// 전공/관심분야 → fieldTags 카테고리 분류는 여기서 실시간으로 하지 않는다. 예전엔 사람이
// 짠 키워드 사전(FIELD_TAG_KEYWORDS)으로 부분일치시켰는데, 새 전공이 입력될 때마다
// 오탐/누락이 반복되어(예: "공학"이 너무 넓어서 "설비소방공학과"까지 과학/공학/기술/IT로
// 오분류) Claude(Haiku) 분류로 대체했다 — PUT /api/profile 저장 시 major/interests가
// 바뀐 경우에만 1회 분류해 StudentProfile.activityFieldTags에 캐싱해둔 값을 그대로 읽는다.
// 자세한 배경은 src/lib/activity/classify.ts, 카테고리 목록/검증 히스토리는
// src/lib/activity/fieldTags.ts 참고.
export async function getActivitiesForUser(userId: string) {
  const [profile, listings] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.activityListing.findMany(),
  ]);

  const profileCategories = new Set(
    (profile?.activityFieldTags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  );

  // 카테고리 매칭(전공/관심분야에서 분류된 fieldTags와 listing의 fieldTags가 정확히 일치)
  // 하나만 쓴다. 예전에는 title/targetInfo에 대한 느슨한 부분일치 보조 점수도 있었는데,
  // 다양한 전공/관심분야 조합으로 시뮬레이션해보니 "대학"/"일반"처럼 흔한 단어가 targetInfo
  // ("대학생", "직장인/일반인")와 우연히 겹쳐서 관련성과 무관하게 거의 모든 항목이 매칭되는
  // 문제가 재현됐다 — 정상 케이스에서 좋은 결과를 만든 건 전부 카테고리 매칭이었고 이
  // 보조 매칭이 상위 결과에 기여한 적은 한 번도 없어서 제거함.
  const scored = listings.map((listing) => {
    let score = 0;
    const listingCategories = new Set(
      listing.fieldTags.split(",").map((t) => t.trim()).filter(Boolean)
    );
    for (const category of profileCategories) {
      if (listingCategories.has(category)) score += 1;
    }
    return { listing, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // 동점이면 마감 임박한 것부터(마감일 없는 항목은 뒤로)
    if (!a.listing.deadlineDate) return 1;
    if (!b.listing.deadlineDate) return -1;
    return a.listing.deadlineDate.localeCompare(b.listing.deadlineDate);
  });

  return {
    profileComplete: Boolean(profile?.interests || profile?.major),
    activities: scored
      .slice(0, MAX_DISPLAYED_ACTIVITIES)
      .map((s) => ({ ...s.listing, matchScore: s.score })),
  };
}

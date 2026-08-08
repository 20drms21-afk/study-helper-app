import { prisma } from "@/lib/prisma";

// 링커리어 전체 스크래핑 이후 DB에 1,000건 넘게 쌓일 수 있어서, 화면에는 매칭 점수가
// 높은 상위 항목만 잘라서 보여준다(DB에는 전부 저장 — 나중에 검색/필터 기능 확장 여지).
const MAX_DISPLAYED_ACTIVITIES = 60;

function splitKeywords(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/[,\s]+/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

export async function getActivitiesForUser(userId: string) {
  const [profile, listings] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.activityListing.findMany(),
  ]);

  const profileKeywords = new Set([
    ...splitKeywords(profile?.interests ?? null),
    ...splitKeywords(profile?.major ?? null),
  ]);

  const scored = listings.map((listing) => {
    const listingKeywords = new Set([
      ...splitKeywords(listing.fieldTags),
      ...splitKeywords(listing.targetInfo),
      ...splitKeywords(listing.title),
    ]);
    let score = 0;
    for (const kw of profileKeywords) {
      for (const lkw of listingKeywords) {
        if (lkw.includes(kw) || kw.includes(lkw)) {
          score++;
          break;
        }
      }
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

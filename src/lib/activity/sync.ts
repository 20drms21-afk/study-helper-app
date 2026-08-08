import { prisma } from "@/lib/prisma";
import { scrapeLinkareer, type KnownEnrichment } from "./linkareer";

export async function syncActivityListings(): Promise<{
  upserted: number;
  expired: number;
}> {
  const existing = await prisma.activityListing.findMany({
    select: { sourceUrl: true, fieldTags: true, targetInfo: true },
  });
  const knownEnrichment = new Map<string, KnownEnrichment>(
    existing.map((e) => [e.sourceUrl, { fieldTags: e.fieldTags, targetInfo: e.targetInfo }])
  );

  const listings = await scrapeLinkareer(knownEnrichment);

  let upserted = 0;
  for (const listing of listings) {
    // compound unique 인덱스는 nullable 필드를 where에 그대로 못 받으므로
    // organizer 미상은 빈 문자열로 통일해서 저장/조회 모두에 일관되게 사용한다.
    const organizer = listing.organizer ?? "";

    await prisma.activityListing.upsert({
      where: {
        title_organizer: {
          title: listing.title,
          organizer,
        },
      },
      create: {
        title: listing.title,
        organizer,
        category: listing.category,
        fieldTags: listing.fieldTags,
        targetInfo: listing.targetInfo,
        deadlineText: listing.deadlineText,
        deadlineDate: listing.deadlineDate,
        sourceUrl: listing.sourceUrl,
        fetchedAt: new Date(),
      },
      update: {
        category: listing.category,
        fieldTags: listing.fieldTags,
        targetInfo: listing.targetInfo,
        deadlineText: listing.deadlineText,
        deadlineDate: listing.deadlineDate,
        sourceUrl: listing.sourceUrl,
        fetchedAt: new Date(),
      },
    });
    upserted++;
  }

  // 링커리어가 이미 모집중(OPEN)인 것만 내려주지만, 예전에 저장해둔 뒤 마감된 항목은
  // 이번에 안 나왔을 수 있으므로 마감일 기준으로 직접 정리한다.
  const today = new Date().toISOString().slice(0, 10);
  const { count: expired } = await prisma.activityListing.deleteMany({
    where: { deadlineDate: { lt: today } },
  });

  return { upserted, expired };
}

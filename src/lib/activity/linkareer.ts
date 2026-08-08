// 링커리어(linkareer.com)는 Next.js + Apollo GraphQL로 만들어져 있어서, 목록/상세 페이지
// HTML에 <script id="__NEXT_DATA__">로 완전한 구조화 데이터가 그대로 박혀 있다(자바스크립트
// 실행 없이 일반 fetch로 읽힘). robots.txt도 이 경로들을 막지 않는다. AI 웹검색과 달리
// "지금 모집중인 것 전부"를 정확히, 무료로, 매일 가져올 수 있어서 이 방식으로 수집한다.

import { mapWithConcurrency } from "@/lib/concurrency";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const REQUEST_TIMEOUT_MS = 20_000;
const LIST_PAGE_SIZE = 20;
const LIST_CONCURRENCY = 5;
const DETAIL_CONCURRENCY = 8;

interface LinkareerType {
  activityTypeID: number;
  slug: "activity" | "contest";
  category: "activity" | "contest";
}

const LINKAREER_TYPES: LinkareerType[] = [
  { activityTypeID: 1, slug: "activity", category: "activity" },
  { activityTypeID: 3, slug: "contest", category: "contest" },
];

interface BasicActivity {
  id: string;
  title: string;
  organizationName: string | null;
  recruitCloseAt: number | null;
}

interface DetailInfo {
  interests: string[];
  targets: string[];
}

// 링커리어 Apollo 캐시는 GraphQL 엔티티마다 필드가 제각각인 임의의 JSON이라
// 정확한 타입을 미리 정의할 수 없다 — 꼭 필요한 필드만 사용처에서 좁혀 쓴다.
type ApolloEntity = Record<string, unknown>;
type ApolloState = Record<string, ApolloEntity>;

interface NextData {
  props: {
    pageProps: {
      __APOLLO_STATE__: ApolloState;
    };
  };
}

function asRef(value: unknown): { __ref: string } | null {
  if (value && typeof value === "object" && typeof (value as { __ref?: unknown }).__ref === "string") {
    return value as { __ref: string };
  }
  return null;
}

export interface ScrapedListing {
  title: string;
  organizer: string | null;
  category: "contest" | "activity";
  fieldTags: string;
  targetInfo: string | null;
  deadlineText: string | null;
  deadlineDate: string | null;
  sourceUrl: string;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`fetch failed (${res.status}): ${url}`);
  }
  return res.text();
}

function extractNextData(html: string): NextData {
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error("__NEXT_DATA__ script not found");
  }
  const contentStart = start + marker.length;
  const end = html.indexOf("</script>", contentStart);
  return JSON.parse(html.slice(contentStart, end)) as NextData;
}

async function fetchListPage(
  type: LinkareerType,
  page: number
): Promise<{ totalCount: number; items: BasicActivity[] }> {
  const html = await fetchHtml(`https://linkareer.com/list/${type.slug}?page=${page}`);
  const data = extractNextData(html);
  const apollo = data.props.pageProps.__APOLLO_STATE__;
  const rootQuery = apollo.ROOT_QUERY;

  const key = Object.keys(rootQuery).find(
    (k) => k.startsWith("activities(") && k.includes(`"activityTypeID":"${type.activityTypeID}"`)
  );
  if (!key) {
    return { totalCount: 0, items: [] };
  }

  const connection = rootQuery[key] as { totalCount?: number; nodes?: unknown[] };
  const items: BasicActivity[] = (connection.nodes ?? [])
    .map((ref) => asRef(ref))
    .filter((ref): ref is { __ref: string } => ref !== null)
    .map((ref) => apollo[ref.__ref])
    .filter((a): a is ApolloEntity => Boolean(a))
    .map((a) => ({
      id: a.id as string,
      title: a.title as string,
      organizationName: (a.organizationName as string | null) ?? null,
      recruitCloseAt: (a.recruitCloseAt as number | null) ?? null,
    }));

  return { totalCount: connection.totalCount ?? items.length, items };
}

async function fetchDetail(id: string): Promise<DetailInfo | null> {
  try {
    const html = await fetchHtml(`https://linkareer.com/activity/${id}`);
    const data = extractNextData(html);
    const apollo = data.props.pageProps.__APOLLO_STATE__;
    const activity = apollo[`Activity:${id}`];
    if (!activity) return null;

    const resolveNames = (refs: unknown) =>
      (Array.isArray(refs) ? refs : [])
        .map((ref) => asRef(ref))
        .filter((ref): ref is { __ref: string } => ref !== null)
        .map((ref) => apollo[ref.__ref]?.name)
        .filter((name): name is string => typeof name === "string" && name.length > 0);

    return {
      interests: resolveNames(activity.interests),
      targets: resolveNames(activity.targets),
    };
  } catch (error) {
    console.error(`linkareer detail fetch failed for activity ${id}`, error);
    return null;
  }
}

function formatDeadline(ms: number | null): { deadlineDate: string | null; deadlineText: string | null } {
  if (!ms) return { deadlineDate: null, deadlineText: null };
  // KST(UTC+9) 기준 날짜로 변환
  const kst = new Date(ms + 9 * 60 * 60 * 1000);
  const dateStr = kst.toISOString().slice(0, 10);
  return { deadlineDate: dateStr, deadlineText: `${dateStr} 마감` };
}

export interface KnownEnrichment {
  fieldTags: string;
  targetInfo: string | null;
}

// 키: sourceUrl(= https://linkareer.com/activity/{id}). 관심분야/지원대상은 게시글이
// 열려있는 동안 바뀔 일이 거의 없으므로, 이미 상세페이지를 읽어서 저장해둔 항목은
// 매일 다시 안 읽고 기존 값을 그대로 재사용한다(첫 실행만 전체 상세 크롤링이 필요하고,
// 이후로는 그날 새로 올라온 항목만 상세 fetch — 안 그러면 매일 1,500개 넘는 상세페이지를
// 전부 다시 읽어야 해서 라우트 maxDuration을 넘김, 실측: 전체 재크롤링 시 약 4분 18초).
export async function scrapeLinkareer(
  knownEnrichment: Map<string, KnownEnrichment> = new Map()
): Promise<ScrapedListing[]> {
  const allBasic: (BasicActivity & { category: "activity" | "contest" })[] = [];

  for (const type of LINKAREER_TYPES) {
    const first = await fetchListPage(type, 1);
    allBasic.push(...first.items.map((it) => ({ ...it, category: type.category })));

    const totalPages = Math.ceil(first.totalCount / LIST_PAGE_SIZE);
    const remainingPages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 2);

    const rest = await mapWithConcurrency(remainingPages, LIST_CONCURRENCY, async (page) => {
      try {
        return await fetchListPage(type, page);
      } catch (error) {
        console.error(`linkareer list page fetch failed: ${type.slug} page=${page}`, error);
        return { totalCount: 0, items: [] as BasicActivity[] };
      }
    });
    for (const r of rest) {
      allBasic.push(...r.items.map((it) => ({ ...it, category: type.category })));
    }
  }

  const toEnrich = allBasic.filter(
    (item) => !knownEnrichment.has(`https://linkareer.com/activity/${item.id}`)
  );
  const freshDetails = await mapWithConcurrency(toEnrich, DETAIL_CONCURRENCY, (item) =>
    fetchDetail(item.id)
  );
  const freshDetailById = new Map(toEnrich.map((item, i) => [item.id, freshDetails[i]]));

  return allBasic.map((item) => {
    const sourceUrl = `https://linkareer.com/activity/${item.id}`;
    const categoryLabel = item.category === "contest" ? "공모전" : "대외활동";
    const known = knownEnrichment.get(sourceUrl);

    let fieldTags: string;
    let targetInfo: string | null;
    if (known) {
      fieldTags = known.fieldTags;
      targetInfo = known.targetInfo;
    } else {
      const detail = freshDetailById.get(item.id) ?? null;
      fieldTags =
        detail && detail.interests.length > 0
          ? detail.interests.join(", ")
          : [categoryLabel, item.organizationName].filter(Boolean).join(", ");
      targetInfo = detail && detail.targets.length > 0 ? detail.targets.join(", ") : null;
    }

    const { deadlineDate, deadlineText } = formatDeadline(item.recruitCloseAt);

    return {
      title: item.title,
      organizer: item.organizationName,
      category: item.category,
      fieldTags,
      targetInfo,
      deadlineText,
      deadlineDate,
      sourceUrl,
    };
  });
}

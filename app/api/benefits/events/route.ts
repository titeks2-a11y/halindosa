import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import {
  buildFreeBenefitEvents,
  buildFreeBenefitEventCategoryCounts,
  buildFreeBenefitEventDeadlineCategoryCounts,
  buildFreeBenefitEventRuntimeReadiness,
  buildFreeBenefitEventSourceSummary,
  freeBenefitEventCategories,
  getFreeBenefitEventScore,
  isPublishableFreeBenefitEvent,
  sanitizeBenefitText
} from "@/lib/freeBenefitEvents";
import type { FreeBenefitEvent, FreeBenefitEventType } from "@/types/freeBenefitEvent";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const benefitTypeIds = new Set<FreeBenefitEventType>(freeBenefitEventCategories.map((category) => category.id));

function parseLimit(value: string | null) {
  const limit = Number(value ?? 24);
  if (!Number.isFinite(limit)) return 24;
  return Math.min(Math.max(Math.floor(limit), 1), 128);
}

function parseBoolean(value: string | null) {
  if (value === null) return null;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function parseSort(value: string | null) {
  if (value === "endingSoon" || value === "latest" || value === "noPurchase" || value === "quality") return value;
  return "recommended";
}

function parseDeadline(value: string | null) {
  if (value === "today" || value === "week" || value === "soon") return value;
  return "all";
}

function getDeadlineWindowMs(deadline: ReturnType<typeof parseDeadline>, endingSoonOnly: boolean) {
  if (deadline === "today") return 24 * 60 * 60 * 1000;
  if (deadline === "week") return 7 * 24 * 60 * 60 * 1000;
  if (deadline === "soon") return 3 * 24 * 60 * 60 * 1000;
  if (endingSoonOnly) return 7 * 24 * 60 * 60 * 1000;
  return null;
}

function includesQuery(event: FreeBenefitEvent, query: string) {
  if (!query) return true;
  const haystack = [
    event.title,
    event.brandName,
    event.sourceName,
    event.rewardText,
    event.participationCondition,
    event.tags.join(" ")
  ]
    .join(" ")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "");
  const needle = query.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
  return haystack.includes(needle);
}

function filterEvents(events: FreeBenefitEvent[], request: Request, referenceNow: number) {
  const { searchParams } = new URL(request.url);
  const type = sanitizeBenefitText(searchParams.get("type") ?? "all", 32) as FreeBenefitEventType;
  const q = sanitizeBenefitText(searchParams.get("q") ?? "", 80);
  const includePublic = type === "publicFree" || searchParams.get("includePublic") === "true";
  const requiresPurchase = parseBoolean(searchParams.get("requiresPurchase"));
  const requiresLogin = parseBoolean(searchParams.get("requiresLogin"));
  const endingSoonOnly = searchParams.get("endingSoonOnly") === "true";
  const deadline = parseDeadline(searchParams.get("deadline"));
  const deadlineWindowMs = getDeadlineWindowMs(deadline, endingSoonOnly);
  const noPurchaseOnly = searchParams.get("noPurchaseOnly") === "true";

  return events.filter((event) => {
    if (!isPublishableFreeBenefitEvent(event, referenceNow)) return false;
    if (!includePublic && event.benefitType === "publicFree") return false;
    if (benefitTypeIds.has(type) && type !== "all" && event.benefitType !== type) return false;
    if (requiresPurchase !== null && event.requiresPurchase !== requiresPurchase) return false;
    if (requiresLogin !== null && event.requiresLogin !== requiresLogin) return false;
    if (noPurchaseOnly && event.requiresPurchase) return false;
    if (deadlineWindowMs !== null) {
      const endAt = Date.parse(event.endAt);
      if (!Number.isFinite(endAt)) return false;
      const timeLeft = endAt - referenceNow;
      if (timeLeft < 0 || timeLeft > deadlineWindowMs) return false;
    }
    return includesQuery(event, q);
  });
}

function sortEvents(events: FreeBenefitEvent[], sort: ReturnType<typeof parseSort>, referenceNow: number) {
  return [...events].sort((a, b) => {
    if (sort === "endingSoon") return Date.parse(a.endAt) - Date.parse(b.endAt);
    if (sort === "latest") return Date.parse(b.updatedAt || b.collectedAt) - Date.parse(a.updatedAt || a.collectedAt);
    if (sort === "noPurchase") return Number(a.requiresPurchase) - Number(b.requiresPurchase) || getFreeBenefitEventScore(b, referenceNow) - getFreeBenefitEventScore(a, referenceNow);
    if (sort === "quality") return b.qualityScore - a.qualityScore || b.priorityScore - a.priorityScore;
    return getFreeBenefitEventScore(b, referenceNow) - getFreeBenefitEventScore(a, referenceNow);
  });
}

function summarizeEvents(events: FreeBenefitEvent[], referenceNow = Date.now()) {
  const todayMs = 24 * 60 * 60 * 1000;
  const endingSoonMs = 3 * 24 * 60 * 60 * 1000;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return {
    total: events.length,
    noPurchase: events.filter((event) => !event.requiresPurchase).length,
    purchaseRequired: events.filter((event) => event.requiresPurchase).length,
    loginRequired: events.filter((event) => event.requiresLogin).length,
    everyone: events.filter((event) => event.isEveryoneReward).length,
    firstCome: events.filter((event) => event.isFirstComeFirstServed).length,
    endingToday: events.filter((event) => {
      const endAt = Date.parse(event.endAt);
      return Number.isFinite(endAt) && endAt >= referenceNow && endAt - referenceNow <= todayMs;
    }).length,
    endingSoon: events.filter((event) => {
      const endAt = Date.parse(event.endAt);
      return Number.isFinite(endAt) && endAt >= referenceNow && endAt - referenceNow <= endingSoonMs;
    }).length,
    endingThisWeek: events.filter((event) => {
      const endAt = Date.parse(event.endAt);
      return Number.isFinite(endAt) && endAt >= referenceNow && endAt - referenceNow <= weekMs;
    }).length,
    byType: events.reduce<Record<string, number>>((counts, event) => {
      counts[event.benefitType] = (counts[event.benefitType] ?? 0) + 1;
      return counts;
    }, {}),
    ...buildFreeBenefitEventSourceSummary(events, referenceNow)
  };
}

export function OPTIONS() {
  return noStoreOptions();
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const generatedAt = new Date().toISOString();
  const referenceNow = Date.parse(generatedAt);
  const limitResult = rateLimit({
    key: getClientKey(request, "benefit-events"),
    limit: 120,
    windowMs: 60_000
  });

  if (!limitResult.allowed) {
    return noStoreJson(
      {
        ok: false,
        requestId,
        events: [],
        count: 0,
        totalCount: 0,
        updatedAt: generatedAt,
        source: "rate_limited",
        message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limitResult, requestId) }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));
    const sort = parseSort(searchParams.get("sort"));
    const deadline = parseDeadline(searchParams.get("deadline"));
    const includePublicPolicy = searchParams.get("type") === "publicFree" || searchParams.get("includePublic") === "true";
    const news = getVisibleNewsDeals({
      limit: 0,
      q: searchParams.get("q")?.trim(),
      sort: "priority",
      includePublicPolicy
    });
    const allEvents = buildFreeBenefitEvents(news.deals, referenceNow);
    const publishableEvents = allEvents.filter((event) => isPublishableFreeBenefitEvent(event, referenceNow));
    const filteredEvents = sortEvents(filterEvents(allEvents, request, referenceNow), sort, referenceNow);
    const events = filteredEvents.slice(0, limit);
    const categoryCounts = buildFreeBenefitEventCategoryCounts(publishableEvents);
    const filteredCategoryCounts = buildFreeBenefitEventCategoryCounts(filteredEvents);
    const deadlineCategoryCounts = buildFreeBenefitEventDeadlineCategoryCounts(publishableEvents, referenceNow);
    const filteredDeadlineCategoryCounts = buildFreeBenefitEventDeadlineCategoryCounts(filteredEvents, referenceNow);
    const runtimeReadiness = buildFreeBenefitEventRuntimeReadiness(filteredEvents, referenceNow);

    return noStoreJson(
      {
        ok: true,
        requestId,
        events,
        count: events.length,
        totalCount: filteredEvents.length,
        sourceTotalCount: allEvents.length,
        publishableTotalCount: publishableEvents.length,
        categories: categoryCounts,
        categoryCounts,
        filteredCategoryCounts,
        deadlineCategoryCounts,
        filteredDeadlineCategoryCounts,
        summary: summarizeEvents(filteredEvents, referenceNow),
        runtimeReadiness,
        filters: {
          type: searchParams.get("type") ?? "all",
          q: searchParams.get("q") ?? "",
          sort,
          deadline,
          requiresPurchase: parseBoolean(searchParams.get("requiresPurchase")),
          requiresLogin: parseBoolean(searchParams.get("requiresLogin")),
          noPurchaseOnly: searchParams.get("noPurchaseOnly") === "true",
          endingSoonOnly: searchParams.get("endingSoonOnly") === "true"
        },
        rankingPolicy: {
          primary: "recommended",
          prioritizes: ["전원증정", "구매 조건 낮음", "공식 검증 링크", "마감 임박", "높은 품질 점수"],
          scoreFields: ["qualityScore", "freshnessScore", "officialScore", "urgencyScore", "rewardScore", "claimAccessLevel"],
          demotes: ["구매 필요", "로그인 필요", "낮은 품질 점수"],
          ctaField: "claimCtaLabel",
          accessField: "claimAccessLabel",
          trustField: "trustBadges"
        },
        updatedAt: generatedAt,
        sourceUpdatedAt: news.updatedAt,
        source: news.source,
        freshnessStatus: news.freshnessStatus,
        freshnessLabel: news.freshnessLabel,
        freshnessAgeMinutes: news.freshnessAgeMinutes,
        nextRefreshAt: news.nextRefreshAt,
        cachePolicy: {
          mode: "no-store",
          generatedAt
        },
        policy: {
          publishableOnly: true,
          defaultConsumerFirst: searchParams.get("type") !== "publicFree" && searchParams.get("includePublic") !== "true",
          publicPolicyBenefits: searchParams.get("type") === "publicFree" || searchParams.get("includePublic") === "true" ? "included_by_request" : "excluded_from_default",
          allowedStatuses: ["active"],
          allowedValidationStatuses: ["passed"],
          blocked: ["search_link", "homepage_link", "community_link", "expired", "sold_out", "unapproved_host"]
        },
        message: "검증된 공식 무료혜택 이벤트를 성공적으로 불러왔습니다."
      },
      { headers: rateLimitHeaders(limitResult, requestId) }
    );
  } catch {
    return noStoreJson(
      {
        ok: false,
        requestId,
        events: [],
        count: 0,
        totalCount: 0,
        updatedAt: generatedAt,
        source: "fallback",
        cachePolicy: {
          mode: "no-store",
          generatedAt
        },
        message: "무료혜택 이벤트 데이터를 불러오지 못했습니다.",
        error: "BENEFIT_EVENTS_LOAD_FAILED"
      },
      { status: 200, headers: rateLimitHeaders(limitResult, requestId) }
    );
  }
}

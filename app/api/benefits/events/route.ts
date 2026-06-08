import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import {
  buildFreeBenefitEvents,
  freeBenefitEventCategories,
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
  return Math.min(Math.max(Math.floor(limit), 1), 80);
}

function parseBoolean(value: string | null) {
  if (value === null) return null;
  if (value === "true") return true;
  if (value === "false") return false;
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
  const requiresPurchase = parseBoolean(searchParams.get("requiresPurchase"));
  const requiresLogin = parseBoolean(searchParams.get("requiresLogin"));
  const endingSoonOnly = searchParams.get("endingSoonOnly") === "true";
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  return events.filter((event) => {
    if (!isPublishableFreeBenefitEvent(event, referenceNow)) return false;
    if (benefitTypeIds.has(type) && type !== "all" && event.benefitType !== type) return false;
    if (requiresPurchase !== null && event.requiresPurchase !== requiresPurchase) return false;
    if (requiresLogin !== null && event.requiresLogin !== requiresLogin) return false;
    if (endingSoonOnly) {
      const endAt = Date.parse(event.endAt);
      if (!Number.isFinite(endAt) || endAt - referenceNow > sevenDaysMs) return false;
    }
    return includesQuery(event, q);
  });
}

function summarizeEvents(events: FreeBenefitEvent[]) {
  return {
    total: events.length,
    noPurchase: events.filter((event) => !event.requiresPurchase).length,
    purchaseRequired: events.filter((event) => event.requiresPurchase).length,
    loginRequired: events.filter((event) => event.requiresLogin).length,
    everyone: events.filter((event) => event.isEveryoneReward).length,
    firstCome: events.filter((event) => event.isFirstComeFirstServed).length,
    byType: events.reduce<Record<string, number>>((counts, event) => {
      counts[event.benefitType] = (counts[event.benefitType] ?? 0) + 1;
      return counts;
    }, {})
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
    const news = getVisibleNewsDeals({
      limit: 0,
      q: searchParams.get("q")?.trim(),
      sort: "priority"
    });
    const allEvents = buildFreeBenefitEvents(news.deals, referenceNow);
    const filteredEvents = filterEvents(allEvents, request, referenceNow);
    const events = filteredEvents.slice(0, limit);

    return noStoreJson(
      {
        ok: true,
        requestId,
        events,
        count: events.length,
        totalCount: filteredEvents.length,
        sourceTotalCount: allEvents.length,
        categories: freeBenefitEventCategories,
        summary: summarizeEvents(filteredEvents),
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

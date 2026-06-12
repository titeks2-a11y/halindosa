import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import {
  buildFreeBenefitEventCategoryCounts,
  buildFreeBenefitEventDeadlineCategoryCounts,
  buildFreeBenefitEventRuntimeReadiness,
  buildFreeBenefitEventSourceSummary,
  selectPublishableFreeBenefitEvents
} from "@/lib/freeBenefitEvents";
import { buildHomeFreebieSummary, selectHomeFreebies } from "@/lib/homeFreebies";
import { buildFreeBenefitCategoryCoverageReport } from "@/lib/operations/freeBenefitCategoryCoverage";
import type { FreeBenefitClaimAccessLevel, FreeBenefitEvent, FreeBenefitEventType } from "@/types/freeBenefitEvent";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const claimAccessLevels = new Set<FreeBenefitClaimAccessLevel>(["instant", "login_required", "purchase_required", "condition_check"]);
const benefitEventTypes = new Set<FreeBenefitEventType>([
  "all",
  "everyone",
  "firstCome",
  "coupon",
  "sample",
  "freeTrial",
  "gifticon",
  "pointCashback",
  "checkIn",
  "roulette",
  "signup",
  "publicFree",
  "experiencePanel",
  "freeShipping",
  "brandEvent"
]);

function parseClaimAccess(value: string | null) {
  return value && claimAccessLevels.has(value as FreeBenefitClaimAccessLevel) ? (value as FreeBenefitClaimAccessLevel) : "all";
}

function parseEventType(value: string | null) {
  return value && benefitEventTypes.has(value as FreeBenefitEventType) ? (value as FreeBenefitEventType) : "all";
}

function parseDeadline(value: string | null) {
  if (value === "today" || value === "week" || value === "soon") return value;
  return "all";
}

function getDeadlineWindowMs(deadline: ReturnType<typeof parseDeadline>) {
  if (deadline === "today") return 24 * 60 * 60 * 1000;
  if (deadline === "week") return 7 * 24 * 60 * 60 * 1000;
  if (deadline === "soon") return 3 * 24 * 60 * 60 * 1000;
  return null;
}

function filterFreeBenefitEvents(events: FreeBenefitEvent[], request: Request, referenceNow: number) {
  const { searchParams } = new URL(request.url);
  const claimAccess = parseClaimAccess(searchParams.get("claimAccess"));
  const eventType = parseEventType(searchParams.get("eventType") ?? searchParams.get("type"));
  const deadline = parseDeadline(searchParams.get("deadline"));
  const noPurchaseOnly = searchParams.get("noPurchaseOnly") === "true";
  const deadlineWindowMs = getDeadlineWindowMs(deadline);

  return events.filter((event) => {
    if (claimAccess !== "all" && event.claimAccessLevel !== claimAccess) return false;
    if (eventType !== "all" && event.benefitType !== eventType) return false;
    if (noPurchaseOnly && event.requiresPurchase) return false;
    if (deadlineWindowMs !== null) {
      const endAt = Date.parse(event.endAt);
      if (!Number.isFinite(endAt)) return false;
      const timeLeft = endAt - referenceNow;
      if (timeLeft < 0 || timeLeft > deadlineWindowMs) return false;
    }
    return true;
  });
}

export function OPTIONS() {
  return noStoreOptions();
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const generatedAt = new Date().toISOString();
  const limitResult = rateLimit({
    key: getClientKey(request, "freebies"),
    limit: 120,
    windowMs: 60_000
  });

  if (!limitResult.allowed) {
    return noStoreJson(
      {
        ok: false,
        requestId,
        freebies: [],
        deals: [],
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
    const limit = Number(searchParams.get("limit") ?? 16);
    const q = searchParams.get("q")?.trim();
    const includePublic = searchParams.get("includePublic") === "true";
    const safeLimit = Math.min(Math.max(limit, 1), 128);
    const news = getVisibleNewsDeals({
      limit: 0,
      q,
      sort: searchParams.get("sort") ?? "priority",
      includePublicPolicy: includePublic
    });
    const defaultDeals = news.deals;
    const referenceNow = Date.parse(generatedAt);
    const freebies = selectHomeFreebies(defaultDeals, Math.min(safeLimit, 80), referenceNow);
    const allEvents = selectPublishableFreeBenefitEvents(defaultDeals, 160, referenceNow, {
      includePublic
    });
    const filteredEvents = filterFreeBenefitEvents(allEvents, request, referenceNow);
    const events = filteredEvents.slice(0, safeLimit);
    const summary = buildHomeFreebieSummary(defaultDeals, referenceNow);
    const categoryCounts = buildFreeBenefitEventCategoryCounts(allEvents);
    const deadlineCategoryCounts = buildFreeBenefitEventDeadlineCategoryCounts(allEvents, referenceNow);
    const filteredCategoryCounts = buildFreeBenefitEventCategoryCounts(filteredEvents);
    const filteredDeadlineCategoryCounts = buildFreeBenefitEventDeadlineCategoryCounts(filteredEvents, referenceNow);
    const eventSummary = buildFreeBenefitEventSourceSummary(filteredEvents, referenceNow);
    const runtimeReadiness = buildFreeBenefitEventRuntimeReadiness(filteredEvents, referenceNow);
    const requiredCategoryCoverage = buildFreeBenefitCategoryCoverageReport(referenceNow);

    return noStoreJson({
      ok: true,
      requestId,
      freebies,
      deals: freebies,
      events,
      count: freebies.length,
      eventCount: filteredEvents.length,
      publishableEventCount: allEvents.length,
      totalCount: summary.total,
      updatedAt: generatedAt,
      sourceUpdatedAt: news.updatedAt,
      source: news.source,
      freshnessStatus: news.freshnessStatus,
      freshnessLabel: news.freshnessLabel,
      freshnessAgeMinutes: news.freshnessAgeMinutes,
      nextRefreshAt: news.nextRefreshAt,
      categoryCounts,
      filteredCategoryCounts,
      deadlineCategoryCounts,
      filteredDeadlineCategoryCounts,
      summary,
      eventSummary,
      runtimeReadiness,
      requiredCategoryCoverage: {
        ok: requiredCategoryCoverage.ok,
        visibleActiveBenefits: requiredCategoryCoverage.visibleActiveBenefits,
        noPurchaseVisibleBenefits: requiredCategoryCoverage.noPurchaseVisibleBenefits,
        todayEndingBenefits: requiredCategoryCoverage.todayEndingBenefits,
        weekEndingBenefits: requiredCategoryCoverage.weekEndingBenefits,
        officialHostCount: requiredCategoryCoverage.officialHostCount,
        categories: requiredCategoryCoverage.categoryCoverage,
        categoryCandidateGroups: requiredCategoryCoverage.categoryCandidateGroups
      },
      cachePolicy: {
        mode: "no-store",
        generatedAt
      },
      exposurePolicy: {
        defaultConsumerFirst: !includePublic,
        publicPolicyBenefits: includePublic ? "included_by_request" : "excluded_from_default"
      },
      filters: {
        q: q ?? "",
        sort: searchParams.get("sort") ?? "priority",
        includePublic,
        eventType: parseEventType(searchParams.get("eventType") ?? searchParams.get("type")),
        deadline: parseDeadline(searchParams.get("deadline")),
        noPurchaseOnly: searchParams.get("noPurchaseOnly") === "true",
        claimAccess: parseClaimAccess(searchParams.get("claimAccess"))
      },
      message: "검증된 무료혜택, 쿠폰, 0원딜, 무료배송 혜택을 성공적으로 불러왔습니다."
    }, { headers: rateLimitHeaders(limitResult, requestId) });
  } catch (error) {
    void error;
    return noStoreJson(
      {
        ok: false,
        requestId,
        freebies: [],
        deals: [],
        events: [],
        count: 0,
        eventCount: 0,
        totalCount: 0,
        updatedAt: generatedAt,
        source: "fallback",
        cachePolicy: {
          mode: "no-store",
          generatedAt
        },
        message: "무료혜택 데이터를 불러오지 못했습니다.",
        error: "FREEBIES_LOAD_FAILED"
      },
      { status: 200, headers: rateLimitHeaders(limitResult, requestId) }
    );
  }
}

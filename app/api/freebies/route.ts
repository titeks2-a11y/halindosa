import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import { buildFreeBenefitEventCategoryCounts, selectPublishableFreeBenefitEvents } from "@/lib/freeBenefitEvents";
import { buildHomeFreebieSummary, selectHomeFreebies } from "@/lib/homeFreebies";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
    const safeLimit = Math.min(Math.max(limit, 1), 96);
    const news = getVisibleNewsDeals({
      limit: 0,
      q,
      sort: searchParams.get("sort") ?? "priority",
      includePublicPolicy: includePublic
    });
    const defaultDeals = news.deals;
    const freebies = selectHomeFreebies(defaultDeals, Math.min(safeLimit, 64), Date.parse(generatedAt));
    const events = selectPublishableFreeBenefitEvents(defaultDeals, safeLimit, Date.parse(generatedAt), {
      includePublic
    });
    const summary = buildHomeFreebieSummary(defaultDeals, Date.parse(generatedAt));
    const categoryCounts = buildFreeBenefitEventCategoryCounts(events);

    return noStoreJson({
      ok: true,
      requestId,
      freebies,
      deals: freebies,
      events,
      count: freebies.length,
      eventCount: events.length,
      totalCount: summary.total,
      updatedAt: generatedAt,
      sourceUpdatedAt: news.updatedAt,
      source: news.source,
      freshnessStatus: news.freshnessStatus,
      freshnessLabel: news.freshnessLabel,
      freshnessAgeMinutes: news.freshnessAgeMinutes,
      nextRefreshAt: news.nextRefreshAt,
      categoryCounts,
      summary,
      cachePolicy: {
        mode: "no-store",
        generatedAt
      },
      exposurePolicy: {
        defaultConsumerFirst: !includePublic,
        publicPolicyBenefits: includePublic ? "included_by_request" : "excluded_from_default"
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

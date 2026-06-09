import { mockDeals } from "@/data/mockDeals";
import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDeals, normalizeSort } from "@/lib/dealService";
import { normalizeDeals } from "@/lib/deals/normalizer";
import { isPubliclyVisibleDeal, summarizeDealQuality } from "@/lib/deals/quality";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function OPTIONS() {
  return noStoreOptions();
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limitResult = rateLimit({
    key: getClientKey(request, "deals"),
    limit: 160,
    windowMs: 60_000
  });
  const rateHeaders = rateLimitHeaders(limitResult, requestId);

  if (!limitResult.allowed) {
    return noStoreJson(
      {
        ok: false,
        requestId,
        deals: [],
        count: 0,
        quality: summarizeDealQuality([]),
        updatedAt: new Date().toISOString(),
        source: "rate_limited",
        message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateHeaders }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 0);
    const minPrice = Number(searchParams.get("minPrice") ?? Number.NaN);
    const maxPrice = Number(searchParams.get("maxPrice") ?? Number.NaN);
    const result = await getDeals({
      category: searchParams.get("category")?.trim(),
      q: searchParams.get("q")?.trim(),
      sort: normalizeSort(searchParams.get("sort")),
      limit,
      priceBand: searchParams.get("priceBand")?.trim(),
      minPrice,
      maxPrice,
      freeShippingOnly: searchParams.get("freeShippingOnly") === "true",
      hotOnly: searchParams.get("hotOnly") === "true",
      endingSoonOnly: searchParams.get("endingSoonOnly") === "true",
      verifiedOnly: searchParams.get("verifiedOnly") !== "false",
      mall: searchParams.get("mall")?.trim(),
      dealType: searchParams.get("dealType")?.trim()
    });

    return noStoreJson({
      ok: true,
      requestId,
      deals: result.deals,
      count: result.deals.length,
      quality: summarizeDealQuality(result.deals),
      updatedAt: result.updatedAt,
      source: result.source,
      message: "할인도사 특가 데이터를 성공적으로 불러왔습니다."
    }, { headers: rateHeaders });
  } catch {
    const fallbackDeals = normalizeDeals(mockDeals, "mock").filter(isPubliclyVisibleDeal);

    return noStoreJson(
      {
        ok: false,
        requestId,
        deals: fallbackDeals,
        count: fallbackDeals.length,
        quality: summarizeDealQuality(fallbackDeals),
        updatedAt: new Date().toISOString(),
        source: "mock",
        message: "특가 데이터를 불러오는 중 문제가 발생해 기본 큐레이션 데이터로 대체했습니다.",
        error: "DEALS_LOAD_FAILED"
      },
      { status: 200, headers: rateHeaders }
    );
  }
}

import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function OPTIONS() {
  return noStoreOptions();
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limitResult = rateLimit({
    key: getClientKey(request, "news-deals"),
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
    const result = getVisibleNewsDeals({
      limit,
      category: searchParams.get("category") ?? undefined,
      benefitType: searchParams.get("benefitType") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      includePublicPolicy: searchParams.get("includePublic") === "true" || searchParams.get("category") === "정부/공공혜택"
    });

    return noStoreJson({
      ok: true,
      requestId,
      ...result,
      message: "검증된 공식 할인뉴스와 이벤트 혜택을 성공적으로 불러왔습니다."
    }, { headers: rateHeaders });
  } catch {
    return noStoreJson(
      {
        ok: false,
        requestId,
        deals: [],
        count: 0,
        updatedAt: new Date().toISOString(),
        source: "fallback",
        message: "공식 혜택 뉴스를 불러오지 못했습니다.",
        error: "NEWS_DEALS_LOAD_FAILED"
      },
      { status: 200, headers: rateHeaders }
    );
  }
}

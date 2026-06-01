import { NextResponse } from "next/server";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDeals } from "@/lib/dealService";
import { buildPersonalizedBenefitQueue } from "@/lib/deals/personalizedBenefitQueue";

function readList(searchParams: URLSearchParams, key: string) {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "benefit-personalized"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "개인화 혜택 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const url = new URL(request.url);
  const size = Number(url.searchParams.get("limit") ?? 6);
  const itemLimit = Number.isFinite(size) ? Math.max(1, Math.min(12, Math.floor(size))) : 6;
  const { deals, updatedAt, source } = await getDeals({ sort: "hot" });
  const recommendations = buildPersonalizedBenefitQueue(deals, {
    interests: readList(url.searchParams, "interest"),
    favoriteIds: readList(url.searchParams, "favoriteId"),
    recentIds: readList(url.searchParams, "recentId"),
    limit: itemLimit
  });

  return NextResponse.json(
    {
      ok: true,
      requestId,
      source,
      updatedAt,
      recommendations,
      message: "할인도사 관심 혜택 추천을 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

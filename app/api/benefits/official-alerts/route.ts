import { NextResponse } from "next/server";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { buildOfficialBenefitAlertQueue } from "@/lib/deals/officialBenefitAlertQueue";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";

function readList(searchParams: URLSearchParams, key: string) {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "official-benefit-alerts"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 혜택 알림 후보 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const url = new URL(request.url);
  const size = Number(url.searchParams.get("limit") ?? 6);
  const itemLimit = Number.isFinite(size) ? Math.max(1, Math.min(12, Math.floor(size))) : 6;
  const officialBenefits = getVisibleNewsDeals({ limit: 70 });
  const recommendations = buildOfficialBenefitAlertQueue(officialBenefits.deals, {
    interests: readList(url.searchParams, "interest"),
    recentNewsIds: readList(url.searchParams, "recentNewsId"),
    limit: itemLimit
  });

  return NextResponse.json(
    {
      ok: true,
      requestId,
      source: officialBenefits.source,
      updatedAt: officialBenefits.updatedAt,
      recommendations,
      message: "공식 혜택 알림 후보를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

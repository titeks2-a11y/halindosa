import { NextResponse } from "next/server";
import { createAnalyticsEvent } from "@/lib/analytics";
import { buildOutboundUrl, isAffiliateEligible } from "@/lib/affiliate";
import { createRequestId, getClientKey, jsonHeaders, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { findDealByIdLive } from "@/lib/dealService";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "redirect"),
    limit: 180,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "이동 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const { id } = await context.params;
  const deal = await findDealByIdLive(id);

  if (!deal) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "존재하지 않는 특가입니다."
      },
      { status: 404, headers: jsonHeaders(requestId) }
    );
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "unknown";
  const analyticsGranted = url.searchParams.get("analytics") === "granted";
  const affiliateGranted = url.searchParams.get("affiliate") === "granted";

  if (analyticsGranted) {
    const event = createAnalyticsEvent({
      eventType: "redirect_click",
      dealId: deal.id,
      page: from,
      metadata: {
        mall: deal.mall,
        mallName: deal.mallName,
        category: deal.category,
        source: deal.source,
        affiliateEligible: isAffiliateEligible(deal),
        affiliateGranted
      }
    });

    // Commercial extension point:
    // Persist event to analytics storage before redirecting in production.
    void event;
  }

  return NextResponse.redirect(buildOutboundUrl(deal, from, affiliateGranted), {
    status: 302,
    headers: rateLimitHeaders(limit, requestId)
  });
}

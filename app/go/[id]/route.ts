import { NextResponse } from "next/server";
import { buildOutboundUrl, isAffiliateEligible } from "@/lib/affiliate";
import { createAnalyticsEvent } from "@/lib/analytics";
import { createRequestId, getClientKey, jsonHeaders, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { recordDealClick } from "@/lib/clickStore";
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
    key: getClientKey(request, "go"),
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
  const affiliateGranted = url.searchParams.get("affiliate") === "granted";
  const analyticsGranted = url.searchParams.get("analytics") === "granted";
  const outboundUrl = buildOutboundUrl(deal, from, affiliateGranted);

  recordDealClick({
    dealId: deal.id,
    from,
    finalPurchaseUrl: outboundUrl
  });

  if (analyticsGranted) {
    const event = createAnalyticsEvent({
      eventType: "redirect_click",
      dealId: deal.id,
      page: from,
      metadata: {
        mallName: deal.mallName,
        category: deal.category,
        affiliateEligible: isAffiliateEligible(deal),
        linkVerified: deal.linkVerified,
        purchaseConfidence: deal.purchaseConfidence
      }
    });

    // Persist event to analytics storage in production.
    void event;
  }

  return NextResponse.redirect(outboundUrl, {
    status: 302,
    headers: rateLimitHeaders(limit, requestId)
  });
}

import { NextResponse } from "next/server";
import { createAnalyticsEvent } from "@/lib/analytics";
import { buildOutboundUrl, canOpenDealLink, isAffiliateEligible } from "@/lib/affiliate";
import { noStoreHeaders } from "@/lib/api/noStore";
import { createRequestId, getClientKey, jsonHeaders, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { recordDealClick } from "@/lib/clickStore";
import { findDealByIdLive } from "@/lib/dealService";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function createRedirectClickLog(input: {
  requestId: string;
  dealId: string;
  source: string;
  from: string;
  affiliateGranted: boolean;
}) {
  return {
    clickId: input.requestId,
    dealId: input.dealId,
    source: input.source,
    from: input.from,
    affiliateGranted: input.affiliateGranted,
    createdAt: new Date().toISOString()
  };
}

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

  if (!canOpenDealLink(deal)) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "현재 노출 가능한 구매 링크가 아닙니다."
      },
      { status: 410, headers: jsonHeaders(requestId) }
    );
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "unknown";
  const analyticsGranted = url.searchParams.get("analytics") === "granted";
  const affiliateGranted = url.searchParams.get("affiliate") === "granted";

  if (analyticsGranted) {
    const redirectLog = createRedirectClickLog({
      requestId,
      dealId: deal.id,
      source: deal.source,
      from,
      affiliateGranted
    });
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
    // Persist redirectLog and event to analytics storage before redirecting in production.
    void redirectLog;
    void event;
  }

  const outboundUrl = buildOutboundUrl(deal, from, affiliateGranted);
  if (!outboundUrl) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "안전하게 이동할 수 있는 판매처 URL이 없습니다."
      },
      { status: 410, headers: jsonHeaders(requestId) }
    );
  }
  recordDealClick({
    dealId: deal.id,
    from,
    finalPurchaseUrl: outboundUrl
  });

  return NextResponse.redirect(outboundUrl, {
    status: 302,
    headers: {
      ...noStoreHeaders,
      ...rateLimitHeaders(limit, requestId)
    }
  });
}

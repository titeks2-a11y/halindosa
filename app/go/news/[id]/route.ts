import { NextResponse } from "next/server";
import { createAnalyticsEvent } from "@/lib/analytics";
import { createRequestId, getClientKey, jsonHeaders, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { recordDealClick } from "@/lib/clickStore";
import { findVisibleNewsDealById } from "@/lib/deals/newsDeals";
import { resolveNewsDealDestinationUrl } from "@/lib/deals/newsLinkPolicy";

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
    key: getClientKey(request, "go-news"),
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
  const newsDeal = findVisibleNewsDealById(id);

  if (!newsDeal) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "존재하지 않거나 노출이 중단된 공식 혜택입니다."
      },
      { status: 404, headers: jsonHeaders(requestId) }
    );
  }

  const outboundUrl = resolveNewsDealDestinationUrl(newsDeal);

  if (!outboundUrl) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 페이지 검증을 통과하지 못한 혜택입니다."
      },
      { status: 410, headers: jsonHeaders(requestId) }
    );
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "official-benefit";

  recordDealClick({
    dealId: newsDeal.id,
    from,
    finalPurchaseUrl: outboundUrl
  });

  const event = createAnalyticsEvent({
    eventType: "redirect_click",
    dealId: newsDeal.id,
    page: from,
    metadata: {
      category: newsDeal.category,
      source: newsDeal.sourceName,
      benefitType: newsDeal.benefitType,
      officialUrl: true
    }
  });

  // Production extension point: persist this event to analytics storage before redirecting.
  void event;

  return NextResponse.redirect(outboundUrl, {
    status: 302,
    headers: rateLimitHeaders(limit, requestId)
  });
}

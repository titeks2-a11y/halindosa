import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDeals } from "@/lib/dealService";
import { isPubliclyVisibleDeal } from "@/lib/deals/quality";
import { buildNotificationCampaigns, summarizeNotificationCampaigns, toPushQueueRows } from "@/lib/notificationCampaigns";
import { getPushReadiness } from "@/lib/pushNotifications";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-notification-campaigns"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  const url = new URL(request.url);
  if (!canAccessAdmin(url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, requestId, message: "관리자 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  const { deals, updatedAt, source } = await getDeals();
  const push = getPushReadiness();
  const visibleVerifiedDeals = deals.filter(isPubliclyVisibleDeal).length;
  const campaigns = buildNotificationCampaigns(deals, { fcmConfigured: push.configured });
  const summary = summarizeNotificationCampaigns(campaigns, visibleVerifiedDeals);
  const includeRows = url.searchParams.get("includeRows") === "true";

  return NextResponse.json(
    {
      ok: true,
      requestId,
      updatedAt,
      source,
      push,
      summary,
      campaigns,
      queueRows: includeRows ? toPushQueueRows(campaigns) : [],
      message: "할인도사 알림 캠페인 후보를 성공적으로 생성했습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

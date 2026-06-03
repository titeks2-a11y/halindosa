import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDeals } from "@/lib/dealService";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import { buildNotificationCampaigns, buildOfficialBenefitNotificationCampaigns } from "@/lib/notificationCampaigns";
import { buildPushSubscriptionReadiness } from "@/lib/pushReadiness";
import { getPushReadiness } from "@/lib/pushNotifications";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-push-readiness"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, requestId, message: "푸시 준비도 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const url = new URL(request.url);

  if (!canAccessAdmin(url.searchParams.get("token"))) {
    return NextResponse.json(
      { ok: false, requestId, message: "푸시 준비도 접근 권한이 없습니다." },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const { deals, updatedAt, source } = await getDeals();
  const officialBenefits = getVisibleNewsDeals({ limit: 30 });
  const push = getPushReadiness();
  const campaigns = [
    ...buildNotificationCampaigns(deals, { fcmConfigured: push.configured }),
    ...buildOfficialBenefitNotificationCampaigns(officialBenefits.deals, { fcmConfigured: push.configured })
  ];
  const report = buildPushSubscriptionReadiness(campaigns);

  return NextResponse.json(
    {
      ok: report.ok,
      requestId,
      updatedAt,
      source,
      report,
      message: "할인도사 푸시 구독·동의 준비도 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

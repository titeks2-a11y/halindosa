import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import type { NotificationCampaignPriority } from "@/lib/notificationCampaigns";
import { getPushReadiness, type PushAlertType, sendPushNotification } from "@/lib/pushNotifications";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-push-readiness"),
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

  return NextResponse.json({ ok: true, requestId, push: getPushReadiness() }, { headers: rateLimitHeaders(limit, requestId) });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-push-send"),
    limit: 20,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  const url = new URL(request.url);
  if (!canAccessAdmin(url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, requestId, message: "관리자 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    tokens?: string[];
    dealId?: string;
    benefitId?: string;
    campaignId?: string;
    sourceKind?: "product_deal" | "official_benefit";
    alertType?: PushAlertType;
    priority?: NotificationCampaignPriority;
    scheduledAt?: string;
    confirmedConsent?: boolean;
    dryRun?: boolean;
  };

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ ok: false, requestId, message: "알림 제목과 본문이 필요합니다." }, { status: 400, headers: rateLimitHeaders(limit, requestId) });
  }

  const result = await sendPushNotification({
    title: body.title.trim(),
    body: body.body.trim(),
    tokens: Array.isArray(body.tokens) ? body.tokens : [],
    dealId: body.dealId,
    benefitId: body.benefitId,
    campaignId: body.campaignId,
    sourceKind: body.sourceKind,
    alertType: body.alertType,
    priority: body.priority,
    scheduledAt: body.scheduledAt,
    confirmedConsent: Boolean(body.confirmedConsent),
    dryRun: body.dryRun
  });
  const status = result.configured || body.dryRun ? 200 : 503;

  return NextResponse.json(
    {
      ok: status === 200,
      requestId,
      result
    },
    { status, headers: rateLimitHeaders(limit, requestId) }
  );
}

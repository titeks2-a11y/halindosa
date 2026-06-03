import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getRefreshDealsReport } from "@/lib/deals/refreshReport";

const operationStore = globalThis as typeof globalThis & {
  __halindosaManualHiddenDeals?: Set<string>;
};

function getHiddenStore() {
  if (!operationStore.__halindosaManualHiddenDeals) {
    operationStore.__halindosaManualHiddenDeals = new Set<string>();
  }

  return operationStore.__halindosaManualHiddenDeals;
}

function getPayload() {
  const report = getRefreshDealsReport();
  return {
    report,
    manualHiddenDealIds: Array.from(getHiddenStore()).sort(),
    message: "운영 품질 리포트를 불러왔습니다. 실제 데이터 반영은 Supabase/Admin DB 연결 후 영구 저장됩니다."
  };
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-deal-quality"),
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

  return NextResponse.json({ ok: true, requestId, ...getPayload() }, { headers: rateLimitHeaders(limit, requestId) });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-deal-quality-update"),
    limit: 30,
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
    action?: string;
    dealId?: string;
  };
  const hiddenStore = getHiddenStore();
  const dealId = body.dealId?.trim();

  if (body.action === "hide" && dealId) {
    hiddenStore.add(dealId);
  } else if (body.action === "restore" && dealId) {
    hiddenStore.delete(dealId);
  } else if (body.action !== "revalidate") {
    return NextResponse.json({ ok: false, requestId, message: "지원하지 않는 운영 액션입니다." }, { status: 400, headers: rateLimitHeaders(limit, requestId) });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      action: body.action,
      ...getPayload()
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

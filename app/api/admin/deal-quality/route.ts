import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getRefreshDealsReport } from "@/lib/deals/refreshReport";
import { toCsv } from "@/lib/csv";
import { hideDealManually, listManualHiddenDealIds, restoreDealManually } from "@/lib/deals/operationOverrides";

function getPayload() {
  const report = getRefreshDealsReport();
  return {
    report,
    manualHiddenDealIds: listManualHiddenDealIds(),
    message: "운영 품질 리포트를 불러왔습니다. 수동 숨김은 현재 런타임의 목록, 상세, 구매 이동에 즉시 반영됩니다."
  };
}

function buildDealQualityCsv(payload: ReturnType<typeof getPayload>) {
  const reportRecord = payload.report as typeof payload.report & {
    liveProbe?: Record<string, number>;
    reports?: {
      linkValidation?: Record<string, number>;
    };
  };
  const rows = [
    {
      section: "summary",
      key: "fetched",
      label: "전체 수집",
      status: payload.report.ok ? "pass" : "review",
      count: payload.report.fetchedCount,
      reason: "",
      action: "refresh:deals 결과 확인",
      generatedAt: payload.report.generatedAt
    },
    {
      section: "summary",
      key: "visible",
      label: "노출 가능",
      status: "pass",
      count: payload.report.visibleCount,
      reason: "",
      action: "사용자 노출 조건 유지",
      generatedAt: payload.report.generatedAt
    },
    {
      section: "summary",
      key: "hidden",
      label: "숨김",
      status: payload.report.hiddenCount > 0 ? "watch" : "pass",
      count: payload.report.hiddenCount,
      reason: "",
      action: "숨김 사유와 대체 상품 확인",
      generatedAt: payload.report.generatedAt
    },
    ...payload.report.providerStats.map((stat) => ({
      section: "provider",
      key: stat.provider,
      label: stat.configured ? "configured" : "fallback",
      status: (stat.failedCount ?? 0) > 0 || (stat.errorCount ?? 0) > 0 ? "review" : "pass",
      count: stat.fetchedCount,
      reason: stat.errors?.join(" | ") ?? "",
      action: "공식 API/RSS/제휴 feed 연결 및 실패 로그 확인",
      generatedAt: payload.report.generatedAt
    })),
    ...(Object.entries(payload.report.failureReasons).length
      ? Object.entries(payload.report.failureReasons).map(([reason, count]) => ({
          section: "failure_reason",
          key: reason,
          label: `${count}건`,
          status: "review",
          count,
          reason,
          action: "상품 URL/품절/검색 링크 정책에 맞춰 보강",
          generatedAt: payload.report.generatedAt
        }))
      : [
          {
            section: "failure_reason",
            key: "none",
            label: "0건",
            status: "pass",
            count: 0,
            reason: "",
            action: "현재 실패 사유 없음",
            generatedAt: payload.report.generatedAt
          }
        ]),
    ...payload.manualHiddenDealIds.map((id) => ({
      section: "manual_hidden",
      key: id,
      label: "수동 숨김",
      status: "hidden",
      count: 1,
      reason: "admin_manual_hidden",
      action: "복구 전 판매처/품절/종료 여부 재검증",
      generatedAt: payload.report.generatedAt
    })),
    ...Object.entries(reportRecord.liveProbe ?? {}).map(([key, count]) => ({
      section: "live_probe",
      key,
      label: `${count}건`,
      status: key.includes("failed") || key.includes("timeout") ? "review" : "pass",
      count,
      reason: key,
      action: "HTTP/redirect probe 결과 확인",
      generatedAt: payload.report.generatedAt
    })),
    ...Object.entries(reportRecord.reports?.linkValidation ?? {}).map(([key, count]) => ({
      section: "link_validation",
      key,
      label: `${count}건`,
      status: count > 0 && (key.includes("search") || key.includes("soldOut")) ? "review" : "pass",
      count,
      reason: key,
      action: "검색/품절/종료 링크 노출 0건 유지",
      generatedAt: payload.report.generatedAt
    }))
  ];

  return toCsv(rows);
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
  if (!canAccessAdminRequest(request, url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, requestId, message: "관리자 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  const payload = getPayload();

  if (url.searchParams.get("format") === "csv") {
    return new Response(buildDealQualityCsv(payload), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-deal-quality-${new Date().toISOString().slice(0, 10)}.csv"`,
        ...rateLimitHeaders(limit, requestId)
      }
    });
  }

  return NextResponse.json({ ok: true, requestId, ...payload }, { headers: rateLimitHeaders(limit, requestId) });
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
  if (!canAccessAdminRequest(request, url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, requestId, message: "관리자 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    dealId?: string;
  };
  const dealId = body.dealId?.trim();

  if (body.action === "hide" && dealId) {
    hideDealManually(dealId);
  } else if (body.action === "restore" && dealId) {
    restoreDealManually(dealId);
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

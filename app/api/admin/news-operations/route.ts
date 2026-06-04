import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getNewsOperationsReport } from "@/lib/deals/newsOperations";
import { recordNewsOverrideAction, type NewsOverrideAction } from "@/lib/deals/newsOverrides";

export const runtime = "nodejs";

const allowedActions = new Set<NewsOverrideAction>(["hide", "restore", "revalidate"]);

type NewsOperationsReport = ReturnType<typeof getNewsOperationsReport>;

function assertAdmin(request: Request, requestId: string) {
  const url = new URL(request.url);
  if (!canAccessAdminRequest(request, url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, requestId, message: "관리자 권한이 없습니다." }, { status: 401 });
  }
  return null;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: Array<Array<unknown>>) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function getCsvField(item: unknown, key: string) {
  if (!item || typeof item !== "object") return "";
  const value = (item as Record<string, unknown>)[key];
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : "";
}

function buildNewsOperationsCsv(report: NewsOperationsReport) {
  const rows: Array<Array<unknown>> = [
    [
      "section",
      "id_or_provider",
      "title_or_label",
      "status",
      "reason",
      "action",
      "visible_count",
      "issue_count",
      "final_url",
      "checked_at"
    ]
  ];

  report.providerRisks.forEach((risk) => {
    rows.push([
      "provider_risk",
      risk.provider,
      risk.label,
      risk.severity,
      risk.reason,
      risk.action,
      risk.visibleCount,
      risk.issueCount,
      "",
      report.generatedAt
    ]);
  });

  report.feedTransitionReadiness.providers.forEach((provider) => {
    rows.push([
      "feed_transition",
      provider.provider,
      provider.label,
      provider.modeLabel,
      provider.acceptedSources,
      provider.nextAction,
      provider.visibleCount,
      provider.issueCount,
      provider.envKeys.join("|"),
      report.generatedAt
    ]);
  });

  report.freshnessQueues.renewalQueue.forEach((deal) => {
    const replacementCandidates = deal.replacementCandidates ?? [];
    rows.push([
      "renewal_queue",
      deal.id,
      deal.title,
      "expires_within_14_days",
      `${deal.category ?? ""} · D-${deal.daysLeft ?? ""} · ${replacementCandidates.map((candidate) => candidate.label).join("|")}`,
      replacementCandidates[0]?.nextAction || deal.action || "prepare_replacement_official_benefit",
      report.visibleCount,
      report.freshnessQueues.expiringWithin14DaysCount,
      replacementCandidates.map((candidate) => candidate.officialUrl).join("|"),
      deal.endDate ?? ""
    ]);
  });

  report.freshnessQueues.watchQueue.forEach((deal) => {
    const replacementCandidates = deal.replacementCandidates ?? [];
    rows.push([
      "watch_queue",
      deal.id,
      deal.title,
      "expires_within_30_days",
      `${deal.category ?? ""} · D-${deal.daysLeft ?? ""} · ${replacementCandidates.map((candidate) => candidate.label).join("|")}`,
      replacementCandidates[0]?.nextAction || "watch_end_date_and_source_replacement",
      report.visibleCount,
      report.freshnessQueues.expiringWithin30DaysCount,
      replacementCandidates.map((candidate) => candidate.officialUrl).join("|"),
      deal.endDate ?? ""
    ]);
  });

  report.hiddenDeals.forEach((deal) => {
    rows.push([
      "hidden_deal",
      getCsvField(deal, "id"),
      getCsvField(deal, "title"),
      getCsvField(deal, "validationStatus") || "hidden",
      getCsvField(deal, "hiddenReason"),
      "hide/restore/revalidate",
      "",
      "",
      getCsvField(deal, "finalUrl"),
      getCsvField(deal, "lastCheckedAt")
    ]);
  });

  report.expiredDeals.forEach((deal) => {
    rows.push([
      "expired_deal",
      getCsvField(deal, "id"),
      getCsvField(deal, "title"),
      getCsvField(deal, "validationStatus") || "expired",
      getCsvField(deal, "hiddenReason") || "expired",
      "replace_with_active_official_benefit",
      "",
      "",
      getCsvField(deal, "finalUrl"),
      getCsvField(deal, "lastCheckedAt")
    ]);
  });

  report.officialMissingDeals.forEach((deal) => {
    rows.push([
      "official_missing",
      getCsvField(deal, "id"),
      getCsvField(deal, "title"),
      getCsvField(deal, "validationStatus") || "official_missing",
      getCsvField(deal, "hiddenReason") || "official_final_url_required",
      "add_verified_official_url",
      "",
      "",
      getCsvField(deal, "finalUrl"),
      getCsvField(deal, "lastCheckedAt")
    ]);
  });

  const failureReasons = report.failureReasonTop10.length ? report.failureReasonTop10 : [{ reason: "none", count: 0 }];
  failureReasons.forEach((item) => {
    rows.push(["failure_reason", item.reason, `${item.count}건`, item.count > 0 ? "watch" : "clear", item.reason, "review_provider_feed", "", item.count, "", report.generatedAt]);
  });

  report.recentLogs.forEach((log) => {
    rows.push(["recent_log", log.dealId, log.title, log.status, log.reason, log.provider, "", "", log.finalUrl, log.checkedAt]);
  });

  return toCsv(rows);
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-news-operations"),
    limit: 80,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  const auth = assertAdmin(request, requestId);
  if (auth) return auth;

  const url = new URL(request.url);
  const report = getNewsOperationsReport();

  if (url.searchParams.get("format") === "csv") {
    return new Response(buildNewsOperationsCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-news-operations-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report,
      message: "공식 할인뉴스 운영 리포트를 성공적으로 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-news-operations-write"),
    limit: 30,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  const auth = assertAdmin(request, requestId);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const action = body.action as NewsOverrideAction;
  const id = String(body.id ?? "").trim();
  const reason = String(body.reason ?? "admin_operation").trim().slice(0, 120);

  if (!allowedActions.has(action) || !id) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "action은 hide, restore, revalidate 중 하나여야 하고 id가 필요합니다."
      },
      { status: 400, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const overrides = recordNewsOverrideAction(action, id, reason || "admin_operation");

  return NextResponse.json(
    {
      ok: true,
      requestId,
      action,
      id,
      overrides: {
        hiddenCount: Object.keys(overrides.hidden).length,
        recentAudit: overrides.auditLog.slice(0, 10)
      },
      report: getNewsOperationsReport(),
      message: action === "revalidate" ? "재검증 요청이 기록되었습니다. refresh:all 실행으로 전체 링크 상태를 갱신하세요." : "공식 할인뉴스 운영 액션이 기록되었습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

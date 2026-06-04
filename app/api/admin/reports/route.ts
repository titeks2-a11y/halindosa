import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { recordDealOperationActionWithPersistence } from "@/lib/deals/operationOverrides";
import { buildReportSlaSummary } from "@/lib/reportSla";
import { getReportStorageStatus, getReportSummaryLive, listDealReportsLive, updateDealReportStatusWithPersistence } from "@/lib/reports";
import type { DealOperationAction } from "@/lib/deals/operationOverrides";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-reports"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "신고 큐 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!canAccessAdminRequest(request, token)) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "신고 큐 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const status = url.searchParams.get("status");
  const [filteredReports, allReports] = await Promise.all([
    listDealReportsLive(status),
    status && status !== "all" ? listDealReportsLive() : Promise.resolve(null)
  ]);
  const sourceReports = allReports ?? filteredReports;
  const reports = filteredReports.slice(0, 50);

  return NextResponse.json(
    {
      ok: true,
      requestId,
      reports,
      summary: await getReportSummaryLive(),
      sla: buildReportSlaSummary(sourceReports),
      storage: getReportStorageStatus(),
      message: "신고 큐를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

export async function PATCH(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-reports-update"),
    limit: 30,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "신고 상태 변경 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!canAccessAdminRequest(request, token)) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "신고 상태 변경 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const body = (await request.json()) as {
    reportId?: string;
    status?: string;
    operationAction?: DealOperationAction;
    operationReason?: string;
  };
  const report = body.reportId && body.status ? await updateDealReportStatusWithPersistence(body.reportId, body.status) : null;

  if (!report) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "신고를 찾을 수 없거나 유효하지 않은 상태입니다."
      },
      { status: 400, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  let operation: { action: DealOperationAction; dealId: string; reason: string } | null = null;
  if (body.operationAction) {
    const allowedActions = new Set<DealOperationAction>(["hide", "restore", "revalidate"]);
    if (!allowedActions.has(body.operationAction)) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          message: "지원하지 않는 상품 운영 액션입니다."
        },
        { status: 400, headers: rateLimitHeaders(limit, requestId) }
      );
    }

    const reason = (body.operationReason || `report_${report.reason}_${body.status}`).trim().slice(0, 120);
    await recordDealOperationActionWithPersistence(body.operationAction, report.dealId, reason);
    operation = {
      action: body.operationAction,
      dealId: report.dealId,
      reason
    };
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report,
      operation,
      summary: await getReportSummaryLive(),
      sla: buildReportSlaSummary(await listDealReportsLive()),
      storage: getReportStorageStatus(),
      message: operation ? "신고 상태와 상품 노출 운영 액션이 함께 반영되었습니다." : "신고 상태가 변경되었습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

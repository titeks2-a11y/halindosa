import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getReportSummary, listDealReports, updateDealReportStatus } from "@/lib/reports";

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

  if (!canAccessAdmin(token)) {
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
  const reports = listDealReports(status).slice(0, 50);

  return NextResponse.json(
    {
      ok: true,
      requestId,
      reports,
      summary: getReportSummary(),
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

  if (!canAccessAdmin(token)) {
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
  };
  const report = body.reportId && body.status ? updateDealReportStatus(body.reportId, body.status) : null;

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

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report,
      summary: getReportSummary(),
      message: "신고 상태가 변경되었습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

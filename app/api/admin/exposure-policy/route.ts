import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { buildExposurePolicyCsv, getExposurePolicyReport } from "@/lib/operations/exposurePolicy";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-exposure-policy"),
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

  const report = getExposurePolicyReport();

  if (url.searchParams.get("format") === "csv") {
    return new Response(buildExposurePolicyCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-exposure-policy-${new Date().toISOString().slice(0, 10)}.csv"`,
        ...rateLimitHeaders(limit, requestId)
      }
    });
  }

  return NextResponse.json(
    {
      ok: report.ok,
      requestId,
      report,
      message: report.ok ? "노출 정책 감사 리포트를 불러왔습니다." : "노출 정책 감사 리포트 점검이 필요합니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

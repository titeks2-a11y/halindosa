import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { buildLinkLaunchGateCsv, getLinkLaunchGateReport } from "@/lib/operations/linkLaunchGate";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-link-launch-gate"),
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

  const report = getLinkLaunchGateReport();

  if (url.searchParams.get("format") === "csv") {
    return new Response(buildLinkLaunchGateCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-link-launch-gate-${new Date().toISOString().slice(0, 10)}.csv"`,
        ...rateLimitHeaders(limit, requestId)
      }
    });
  }

  return NextResponse.json(
    {
      ok: report.ok,
      requestId,
      report,
      message: report.ok ? "최종 링크 출시 게이트를 통과했습니다." : "최종 링크 출시 게이트 점검이 필요합니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

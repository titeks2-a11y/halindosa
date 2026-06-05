import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { buildLinkRevalidationPriorityCsv, getLinkRevalidationPriorityReport } from "@/lib/operations/linkRevalidationPriority";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-link-revalidation-priority"),
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

  const report = getLinkRevalidationPriorityReport();

  if (url.searchParams.get("format") === "csv") {
    return new Response(buildLinkRevalidationPriorityCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-link-revalidation-priority-${new Date().toISOString().slice(0, 10)}.csv"`,
        ...rateLimitHeaders(limit, requestId)
      }
    });
  }

  return NextResponse.json(
    {
      ok: report.ok,
      requestId,
      report,
      message: report.ok ? "링크 재검증 우선순위 리포트를 불러왔습니다." : "재검증 차단 항목이 있습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

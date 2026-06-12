import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { buildFreeBenefitCategoryCoverageCsv, buildFreeBenefitCategoryCoverageReport } from "@/lib/operations/freeBenefitCategoryCoverage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-free-benefit-category-coverage"),
    limit: 80,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "무료혜택 카테고리 커버리지 요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  const url = new URL(request.url);
  if (!canAccessAdminRequest(request, url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, requestId, message: "관리자 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  const report = buildFreeBenefitCategoryCoverageReport();
  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(buildFreeBenefitCategoryCoverageCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-free-benefit-category-coverage-${report.generatedAt.slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json(
    {
      ok: report.ok,
      requestId,
      report,
      message: "무료혜택 필수 카테고리 커버리지 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

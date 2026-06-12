import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { buildFreeBenefitSourceBreadthCsv, getFreeBenefitSourceBreadthReport } from "@/lib/operations/sourceBreadth";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-source-breadth"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "무료혜택 소스 축 커버리지 리포트 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "무료혜택 소스 축 커버리지 리포트 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const report = getFreeBenefitSourceBreadthReport();

  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(buildFreeBenefitSourceBreadthCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-source-breadth-${(report.generatedAt || new Date().toISOString()).slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report,
      message: "무료혜택 소스 축 커버리지 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

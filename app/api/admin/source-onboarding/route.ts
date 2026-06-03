import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getOfficialSourceOnboardingPlan } from "@/lib/operations/sourceOnboardingPlan";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-source-onboarding"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 소스 온보딩 리포트 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "공식 소스 온보딩 리포트 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const format = url.searchParams.get("format")?.toLowerCase();

  if (format === "csv") {
    const csvPath = join(process.cwd(), "reports", "source-onboarding-plan.csv");
    const csv = existsSync(csvPath) ? readFileSync(csvPath, "utf8") : "\uFEFFrank,id,label,status,nextAction\n0,missing_report,Run npm run source:onboarding:plan,missing_report,Generate source onboarding report\n";
    return new NextResponse(csv, {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"halindosa-source-onboarding-plan.csv\"",
        "Cache-Control": "no-store"
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report: getOfficialSourceOnboardingPlan(),
      message: "공식 소스 온보딩 우선순위 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

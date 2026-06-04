import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDailyOperationsReport, type DailyOperationsReport } from "@/lib/operations/dailyOperations";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

function buildDailyOperationsCsv(report: DailyOperationsReport) {
  const rows: string[][] = [["section", "name", "status", "value", "detail", "action"]];

  rows.push(["summary", "readiness", report.ok ? "passed" : "failed", report.readinessLabel, "오늘 운영 가능 여부", "npm run daily:operations:report"]);
  rows.push(["summary", "verifiedProductLinks", "count", `${report.summary.verifiedProductLinks}/${report.summary.productDealsCount}`, "검증 구매 링크", "npm run verify:links"]);
  rows.push(["summary", "visibleOfficialBenefits", "count", String(report.summary.visibleOfficialBenefits), "공식 혜택 노출", "npm run verify:news"]);
  rows.push(["summary", "exposedSearchLinks", report.summary.exposedSearchLinks === 0 ? "passed" : "failed", String(report.summary.exposedSearchLinks), "검색 링크 노출", "npm run exposure:doctor"]);

  for (const gate of report.gates) {
    rows.push(["gate", gate.name, gate.ok ? "passed" : "failed", gate.detail, "일일 운영 게이트", gate.action]);
  }

  for (const card of report.cards) {
    rows.push(["card", card.title, card.tone, card.value, card.description, card.command]);
  }

  for (const item of report.priorityQueue) {
    rows.push(["priority_queue", item.title, item.priority, item.area, item.reason, item.action]);
  }

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-daily-operations"),
    limit: 80,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  const url = new URL(request.url);
  if (!canAccessAdminRequest(request, url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, requestId, message: "관리자 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  const report = getDailyOperationsReport();

  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(buildDailyOperationsCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-daily-operations-${(report.generatedAt || new Date().toISOString()).slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report,
      message: "일일 운영 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

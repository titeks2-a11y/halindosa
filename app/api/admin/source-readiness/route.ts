import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getOfficialSourceReadiness, type SourceReadinessReport } from "@/lib/operations/sourceReadiness";

function csvCell(value: unknown) {
  const text = String(value ?? "").replaceAll("\"", "\"\"");
  return `"${text}"`;
}

function buildSourceReadinessCsv(report: SourceReadinessReport) {
  const rows: string[][] = [
    ["section", "name", "status", "value", "detail", "action"]
  ];

  rows.push(["summary", "launchGateStatus", report.launchGateStatus, report.readinessLabel, "공식 소스 통합 준비도", "npm run source:readiness:report"]);
  rows.push(["summary", "officialSourceCandidates", "count", String(report.summary.officialSourceCandidates), "공식 소스 후보", "source:catalog:report"]);
  rows.push(["summary", "visibleOfficialBenefits", "count", String(report.summary.visibleOfficialBenefits), "사용자 노출 가능 공식 혜택", "refresh:news && verify:news"]);
  rows.push(["summary", "feedEnvFailedCount", report.summary.feedEnvFailedCount === 0 ? "passed" : "failed", String(report.summary.feedEnvFailedCount), "운영 feed env 차단 URL", "source:feed-env:doctor"]);

  for (const gate of report.gates) {
    rows.push(["gate", gate.name, gate.status, gate.ok ? "passed" : "failed", gate.detail, gate.action]);
  }

  for (const plan of report.envPlan) {
    rows.push([
      "env_plan",
      plan.envKey,
      plan.status,
      `candidate=${plan.candidateCount};reachable=${plan.reachableCandidates};guarded=${plan.guardedCandidates};configured=${plan.configuredFeedUrls}`,
      "공식 API/RSS/제휴 feed 연결 후보",
      plan.nextAction
    ]);
  }

  for (const source of report.riskySources) {
    rows.push(["guarded_source", source.id, source.status, source.provider, source.label, source.operatorAction]);
  }

  for (const action of report.operatorNextActions) {
    rows.push(["next_action", "operator", "todo", "", action, "검색 결과, 커뮤니티 원문, HTML 랜딩 페이지 차단 유지"]);
  }

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-source-readiness"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 소스 통합 준비도 리포트 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "공식 소스 통합 준비도 리포트 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const report = getOfficialSourceReadiness();
  const format = url.searchParams.get("format");

  if (format === "csv") {
    const csv = buildSourceReadinessCsv(report);
    return new NextResponse(csv, {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-source-readiness-${(report.generatedAt || new Date().toISOString()).slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report,
      message: "공식 소스 통합 준비도 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

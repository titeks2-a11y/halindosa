import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";

export const runtime = "nodejs";

interface OfficialBenefitAlertReport {
  ok?: boolean;
  generatedAt?: string;
  totals?: {
    newsDeals?: number;
    activeOfficialBenefits?: number;
    hiddenBenefits?: number;
    failedBenefits?: number;
    expiredBenefits?: number;
    officialHosts?: number;
    categories?: number;
    benefitTypes?: number;
  };
  redirectSafety?: {
    ok?: boolean;
    checkedItems?: number;
    expectedInternalPrefix?: string;
    issues?: string[];
  };
  defaultQueue?: {
    recommendedBenefits?: number;
    interestMatchedBenefits?: number;
    totalActiveBenefits?: number;
    items?: Array<{
      id: string;
      title: string;
      sourceName: string;
      category: string;
      benefitType: string;
      officialHost: string;
      redirectUrl: string;
      reason: string;
      matchedInterests?: string[];
    }>;
  };
  recentScenario?: {
    recommendedBenefits?: number;
    recentNewsIds?: string[];
    items?: Array<{
      id: string;
      title: string;
      sourceName: string;
      category: string;
      benefitType: string;
      officialHost: string;
      redirectUrl: string;
      reason: string;
      matchedInterests?: string[];
    }>;
  };
  interestCoverage?: Array<{
    interest: string;
    matchedCount: number;
    sampleItems?: Array<{ id: string; title: string; sourceName: string; officialHost: string }>;
  }>;
  issues?: Array<{ id: string; detail: string; action: string }>;
}

const reportPath = join(process.cwd(), "reports", "official-benefit-alerts.json");

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

function readReport(): OfficialBenefitAlertReport | null {
  if (!existsSync(reportPath)) return null;

  try {
    return JSON.parse(readFileSync(reportPath, "utf8")) as OfficialBenefitAlertReport;
  } catch {
    return null;
  }
}

function buildOfficialAlertsCsv(report: OfficialBenefitAlertReport) {
  const rows: string[][] = [["section", "name", "status", "value", "detail", "action"]];

  rows.push(["summary", "readiness", report.ok ? "passed" : "failed", report.ok ? "ready" : "check", "공식 혜택 알림 후보 운영 가능 여부", "npm run official:alerts:report"]);
  rows.push(["summary", "activeOfficialBenefits", "count", String(report.totals?.activeOfficialBenefits ?? 0), "공식 페이지 이동 검증 혜택 후보", "npm run verify:news"]);
  rows.push(["summary", "recommendedBenefits", "count", String(report.defaultQueue?.recommendedBenefits ?? 0), "기본 관심 카테고리 추천 후보", "/api/benefits/official-alerts"]);
  rows.push(["summary", "redirectSafety", report.redirectSafety?.ok ? "passed" : "failed", String(report.redirectSafety?.checkedItems ?? 0), "외부 URL 직접 노출 없이 /go/news/[id] 경유", "npm run official:alerts:report"]);

  for (const item of report.interestCoverage ?? []) {
    rows.push(["interest", item.interest, item.matchedCount > 0 ? "ready" : "needs_candidates", String(item.matchedCount), item.sampleItems?.map((sample) => sample.title).join(" | ") ?? "", "공식 혜택 seed/feed 보강"]);
  }

  for (const item of report.defaultQueue?.items ?? []) {
    rows.push(["recommendation", item.id, "ready", item.title, `${item.sourceName} · ${item.category} · ${item.officialHost}`, item.redirectUrl]);
  }

  for (const issue of report.issues ?? []) {
    rows.push(["issue", issue.id, "failed", issue.detail, "운영 이슈", issue.action]);
  }

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-official-alerts"),
    limit: 80,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "공식 혜택 알림 리포트 요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  const url = new URL(request.url);
  if (!canAccessAdminRequest(request, url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, requestId, message: "공식 혜택 알림 리포트 접근 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  const report = readReport();
  if (!report) {
    return NextResponse.json(
      { ok: false, requestId, message: "공식 혜택 알림 리포트가 없습니다. npm run official:alerts:report를 먼저 실행하세요." },
      { status: 404, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(buildOfficialAlertsCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-official-benefit-alerts-${(report.generatedAt || new Date().toISOString()).slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json(
    {
      ok: report.ok === true,
      requestId,
      report,
      message: "공식 혜택 알림 후보 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

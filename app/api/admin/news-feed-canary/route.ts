import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getNewsOperationsReport } from "@/lib/deals/newsOperations";

export const runtime = "nodejs";

type FeedCanaryReport = ReturnType<typeof getNewsOperationsReport>["feedCanary"];

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: Array<Array<unknown>>) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function buildFeedCanaryCsv(report: FeedCanaryReport) {
  const rows: Array<Array<unknown>> = [
    ["section", "name", "status", "value", "detail", "action", "generated_at"],
    [
      "summary",
      "official_feed_canary",
      report.status,
      report.ok ? "passed" : "needs_attention",
      `freshness=${report.freshnessStatus};age=${report.ageHours ?? "unknown"}h;configured=${report.configuredFeedUrls};visible=${report.visibleCandidateCount};hidden=${report.hiddenCandidateCount};empty=${report.configuredEmptyFeedCount};errors=${report.errorCount}`,
      "npm run news:feed:canary",
      report.generatedAt
    ],
    [
      "summary",
      "official_link_promotions",
      "count",
      report.officialLinkPromotedCount,
      "뉴스/RSS 본문 안 공식 링크가 finalUrl로 승격된 후보 수",
      "본문 공식 링크가 없으면 feed 계약을 보강",
      report.generatedAt
    ]
  ];

  for (const provider of report.failedProviders) {
    rows.push([
      "failed_provider",
      provider.provider,
      provider.status,
      "",
      "설정된 공식 feed가 사용자 노출 후보를 만들지 못했습니다.",
      provider.action,
      report.generatedAt
    ]);
  }

  for (const action of report.nextActions) {
    rows.push(["next_action", "operator", report.status, "", action, "공식 API/RSS/승인 JSON feed만 연결", report.generatedAt]);
  }

  return toCsv(rows);
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-news-feed-canary"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 feed canary 리포트 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const url = new URL(request.url);
  if (!canAccessAdminRequest(request, url.searchParams.get("token"))) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 feed canary 리포트 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const report = getNewsOperationsReport().feedCanary;

  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(buildFeedCanaryCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-news-feed-canary-${(report.generatedAt || new Date().toISOString()).slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report,
      message: "공식 feed canary 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

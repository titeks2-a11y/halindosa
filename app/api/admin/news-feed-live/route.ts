import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";

export const runtime = "nodejs";

type LivePipelineReport = {
  ok?: boolean;
  generatedAt?: string;
  status?: string;
  configuredUrlCount?: number;
  failedConfiguredFeedCount?: number;
  canary?: {
    status?: string;
    freshnessStatus?: string;
    ageHours?: number | null;
    visibleCandidateCount?: number;
    errorCount?: number;
  };
  officialBenefits?: {
    visibleCount?: number;
    hiddenCount?: number;
    expiredCount?: number;
    failedCount?: number;
    exposedSearchLinkCount?: number;
    exposedNonOfficialLinkCount?: number;
    providerStats?: Array<{ provider?: string; visibleCount?: number; feedItemCount?: number; seedCount?: number; errorCount?: number }>;
  };
  refreshAll?: { productDealsCount?: number; newsDealsCount?: number; failedCount?: number };
  healthReadiness?: { ok?: boolean; passedCount?: number; totalCount?: number };
  steps?: Array<{ name?: string; ok?: boolean; purpose?: string; startedAt?: string; finishedAt?: string }>;
  nextActions?: string[];
};

function readLivePipelineReport(): LivePipelineReport {
  const path = join(process.cwd(), "reports", "news-feed-live-pipeline.json");
  if (!existsSync(path)) {
    return {
      ok: false,
      generatedAt: "",
      status: "missing",
      configuredUrlCount: 0,
      failedConfiguredFeedCount: 0,
      canary: { status: "missing", freshnessStatus: "missing", ageHours: null, visibleCandidateCount: 0, errorCount: 0 },
      officialBenefits: {
        visibleCount: 0,
        hiddenCount: 0,
        expiredCount: 0,
        failedCount: 0,
        exposedSearchLinkCount: 0,
        exposedNonOfficialLinkCount: 0,
        providerStats: []
      },
      refreshAll: { productDealsCount: 0, newsDealsCount: 0, failedCount: 0 },
      healthReadiness: { ok: false, passedCount: 0, totalCount: 0 },
      steps: [],
      nextActions: ["npm run news:feed:live를 실행해 공식 feed 운영 파이프라인 리포트를 생성하세요."]
    };
  }

  try {
    return JSON.parse(readFileSync(path, "utf8")) as LivePipelineReport;
  } catch {
    return {
      ok: false,
      generatedAt: "",
      status: "unreadable",
      nextActions: ["reports/news-feed-live-pipeline.json 형식을 확인한 뒤 npm run news:feed:live를 다시 실행하세요."]
    };
  }
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: Array<Array<unknown>>) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function buildLivePipelineCsv(report: LivePipelineReport) {
  const rows: Array<Array<unknown>> = [
    ["section", "name", "status", "value", "detail", "action", "generated_at"],
    [
      "summary",
      "news_feed_live_pipeline",
      report.status ?? "missing",
      report.ok ? "passed" : "needs_attention",
      `configured=${report.configuredUrlCount ?? 0};failedFeed=${report.failedConfiguredFeedCount ?? 0};visible=${report.officialBenefits?.visibleCount ?? 0};search=${report.officialBenefits?.exposedSearchLinkCount ?? 0};nonOfficial=${report.officialBenefits?.exposedNonOfficialLinkCount ?? 0};expired=${report.officialBenefits?.expiredCount ?? 0}`,
      "npm run news:feed:live",
      report.generatedAt
    ],
    [
      "summary",
      "canary",
      report.canary?.status ?? "missing",
      report.canary?.freshnessStatus ?? "missing",
      `age=${report.canary?.ageHours ?? "unknown"}h;visibleCandidate=${report.canary?.visibleCandidateCount ?? 0};errors=${report.canary?.errorCount ?? 0}`,
      "공식 feed 연결 직후 canary 후보와 오류 확인",
      report.generatedAt
    ],
    [
      "summary",
      "health_readiness",
      report.healthReadiness?.ok ? "passed" : "needs_attention",
      `${report.healthReadiness?.passedCount ?? 0}/${report.healthReadiness?.totalCount ?? 0}`,
      `product=${report.refreshAll?.productDealsCount ?? 0};news=${report.refreshAll?.newsDealsCount ?? 0};failed=${report.refreshAll?.failedCount ?? 0}`,
      "npm run health:readiness",
      report.generatedAt
    ]
  ];

  for (const step of report.steps ?? []) {
    rows.push(["step", step.name, step.ok ? "passed" : "failed", "", step.purpose, "실패 step부터 수정 후 재실행", step.finishedAt ?? report.generatedAt]);
  }

  for (const provider of report.officialBenefits?.providerStats ?? []) {
    rows.push([
      "provider",
      provider.provider,
      Number(provider.errorCount ?? 0) === 0 ? "passed" : "needs_attention",
      `visible=${provider.visibleCount ?? 0}`,
      `feedItem=${provider.feedItemCount ?? 0};seed=${provider.seedCount ?? 0};errors=${provider.errorCount ?? 0}`,
      "공식 API/RSS/승인 JSON feed만 연결",
      report.generatedAt
    ]);
  }

  for (const action of report.nextActions ?? []) {
    rows.push(["next_action", "operator", report.status ?? "missing", "", action, "news:feed:live 재실행", report.generatedAt]);
  }

  return toCsv(rows);
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-news-feed-live"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "실시간 feed 운영 리포트 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "실시간 feed 운영 리포트 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const report = readLivePipelineReport();

  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(buildLivePipelineCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-news-feed-live-${(report.generatedAt || new Date().toISOString()).slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json(
    {
      ok: report.ok === true,
      requestId,
      report,
      message: "실시간 공식 feed 운영 파이프라인 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

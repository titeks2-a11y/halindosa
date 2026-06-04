import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { dryRunNewsFeedPreview } from "@/lib/operations/newsFeedDryRun";
import { getNewsFeedPreviewReport, type NewsFeedPreviewReport } from "@/lib/operations/newsFeedPreview";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function toCsv(rows: Array<Array<unknown>>) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function buildPreviewCsv(report: NewsFeedPreviewReport) {
  const rows: Array<Array<unknown>> = [
    ["section", "provider_or_id", "label_or_title", "status", "value", "detail", "action_or_url"]
  ];

  rows.push(["summary", "mode", "preview mode", report.ok ? "passed" : "failed", report.mode, "공식 feed dry-run 모드", "npm run news:preview"]);
  rows.push(["summary", "visible", "노출 가능", report.visibleCount > 0 ? "passed" : "watch", report.visibleCount, "사용자에게 노출 가능한 공식 혜택 후보", "npm run refresh:news"]);
  rows.push(["summary", "hidden", "숨김 후보", report.hiddenCount === 0 ? "passed" : "watch", report.hiddenCount, "노출 전 보강이 필요한 후보", "review hidden reasons"]);
  rows.push(["summary", "official_promotions", "뉴스 본문 공식 링크 승격", report.officialLinkPromotedCount > 0 ? "passed" : "watch", report.officialLinkPromotedCount, "기사 링크는 sourceUrl, 공식 링크는 finalUrl로 승격", "review RSS body official links"]);

  for (const gate of report.gates) {
    rows.push(["gate", gate.name, gate.name, gate.ok ? "passed" : "failed", gate.ok, gate.detail, gate.action]);
  }

  for (const provider of report.providerResults) {
    rows.push([
      "provider",
      provider.provider,
      provider.label,
      provider.errorCount === 0 ? "passed" : "failed",
      `fetched=${provider.fetchedCount};visible=${provider.visibleCount};hidden=${provider.hiddenCount};promoted=${provider.officialLinkPromotedCount}`,
      provider.errors.join("|") || provider.sourceMode,
      "npm run news:preview"
    ]);

    for (const deal of provider.sampleVisible) {
      rows.push([
        "sample_visible",
        deal.id,
        deal.title,
        "visible",
        deal.merchant ?? "",
        `${deal.linkType ?? ""}; priority=${deal.priorityScore ?? ""}`,
        deal.finalUrl ?? ""
      ]);
    }

    for (const deal of provider.sampleHidden) {
      rows.push([
        "sample_hidden",
        deal.id,
        deal.title,
        "hidden",
        deal.hiddenReason ?? "",
        deal.linkType ?? "",
        deal.finalUrl ?? ""
      ]);
    }
  }

  for (const action of report.nextActions) {
    rows.push(["next_action", "operator", "운영 액션", "todo", "", action, "docs/NEWS_FEED_PREVIEW_REPORT.md"]);
  }

  return toCsv(rows);
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-news-feed-preview"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 feed preview 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "공식 feed preview 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const report = getNewsFeedPreviewReport();

  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(buildPreviewCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-news-feed-preview-${(report.generatedAt || new Date().toISOString()).slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report,
      message: "공식 feed preview 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-news-feed-preview-dry-run"),
    limit: 30,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 feed dry-run 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "공식 feed dry-run 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const body = await request.json().catch(() => ({}));
  const rawText = typeof body.text === "string" ? body.text : "";
  if (rawText.length > 300_000) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 feed dry-run 원문이 너무 큽니다. 300KB 이하로 나누어 검증해주세요.",
        reason: "source too large"
      },
      { status: 413, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const text = rawText;
  const source = typeof body.source === "string" ? body.source.slice(0, 80) : "admin_news_feed_paste";
  const provider = ["news", "event_news", "official_event", "public_coupon"].includes(String(body.provider))
    ? (body.provider as "news" | "event_news" | "official_event" | "public_coupon")
    : "official_event";
  const result = dryRunNewsFeedPreview({
    source,
    provider,
    text,
    items: body.items
  });

  return NextResponse.json(
    {
      ok: result.ok,
      requestId,
      result,
      message: result.message
    },
    { status: result.received > 0 ? 200 : 400, headers: rateLimitHeaders(limit, requestId) }
  );
}

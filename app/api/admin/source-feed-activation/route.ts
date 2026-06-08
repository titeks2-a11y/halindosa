import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getFreeBenefitSourceFeedActivation } from "@/lib/operations/sourceFeedActivation";

function toCsv(report: ReturnType<typeof getFreeBenefitSourceFeedActivation>) {
  const headers = ["name", "ok", "detail", "action"];
  const rows = report.checks.map((check) => ({
    name: check.name,
    ok: check.ok ? "passed" : "failed",
    detail: check.detail,
    action: check.action
  }));

  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [`\uFEFF${headers.join(",")}`, ...rows.map((row) => headers.map((header) => escape(row[header as keyof typeof row])).join(","))].join("\n");
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-source-feed-activation"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "무료혜택 feed activation 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "무료혜택 feed activation 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const report = getFreeBenefitSourceFeedActivation();
  const format = url.searchParams.get("format")?.toLowerCase();

  if (format === "md" || format === "markdown") {
    return new NextResponse(`${report.markdown.trim()}\n`, {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"halindosa-free-benefit-feed-activation.md\"",
        "Cache-Control": "no-store"
      }
    });
  }

  if (format === "csv") {
    return new NextResponse(toCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"halindosa-free-benefit-feed-activation.csv\"",
        "Cache-Control": "no-store"
      }
    });
  }

  return NextResponse.json(
    {
      ok: report.ok,
      requestId,
      report,
      message: "무료혜택 feed activation 리포트를 불러왔습니다."
    },
    {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Cache-Control": "no-store"
      }
    }
  );
}

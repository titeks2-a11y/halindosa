import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getFreeBenefitSourceFeedHandoff } from "@/lib/operations/sourceFeedHandoff";

function toCsv(report: ReturnType<typeof getFreeBenefitSourceFeedHandoff>) {
  const headers = [
    "lane",
    "envKeys",
    "candidateCount",
    "reachableCount",
    "guardedCount",
    "firstAction",
    "firstCandidate",
    "firstCandidateUrl"
  ];
  const rows = report.lanes.map((lane) => {
    const firstCandidate = lane.firstReachableCandidates?.[0];
    return {
      lane: lane.label,
      envKeys: lane.envKeys.join(" | "),
      candidateCount: lane.candidateCount,
      reachableCount: lane.reachableCount,
      guardedCount: lane.guardedCount,
      firstAction: lane.firstAction,
      firstCandidate: firstCandidate?.label ?? "",
      firstCandidateUrl: firstCandidate?.officialUrl ?? ""
    };
  });

  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [`\uFEFF${headers.join(",")}`, ...rows.map((row) => headers.map((header) => escape(row[header as keyof typeof row])).join(","))].join("\n");
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-source-feed-handoff"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "무료혜택 feed handoff 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "무료혜택 feed handoff 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const report = getFreeBenefitSourceFeedHandoff();
  const format = url.searchParams.get("format")?.toLowerCase();

  if (format === "md" || format === "markdown") {
    return new NextResponse(`${report.markdown.trim()}\n`, {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"halindosa-free-benefit-feed-handoff.md\"",
        "Cache-Control": "no-store"
      }
    });
  }

  if (format === "csv") {
    return new NextResponse(toCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"halindosa-free-benefit-feed-handoff.csv\"",
        "Cache-Control": "no-store"
      }
    });
  }

  return NextResponse.json(
    {
      ok: report.ok,
      requestId,
      report,
      message: "무료혜택 feed 운영 핸드오프를 불러왔습니다."
    },
    {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Cache-Control": "no-store"
      }
    }
  );
}

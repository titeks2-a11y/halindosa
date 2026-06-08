import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getFreeBenefitSourceStarterPack } from "@/lib/operations/sourceStarterPack";

function toCsv(report: ReturnType<typeof getFreeBenefitSourceStarterPack>) {
  const headers = [
    "lane",
    "rank",
    "id",
    "label",
    "provider",
    "liveStatus",
    "score",
    "envKeys",
    "officialUrl",
    "feedConnectionAction",
    "guardrail"
  ];
  const rows = report.packs.flatMap((pack) =>
    pack.candidates.map((candidate, index) => ({
      lane: pack.label,
      rank: index + 1,
      id: candidate.id,
      label: candidate.label,
      provider: candidate.provider,
      liveStatus: candidate.liveStatus,
      score: candidate.score,
      envKeys: pack.envKeys.join(" | "),
      officialUrl: candidate.officialUrl,
      feedConnectionAction: candidate.feedConnectionAction,
      guardrail: candidate.guardrail
    }))
  );

  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [`\uFEFF${headers.join(",")}`, ...rows.map((row) => headers.map((header) => escape(row[header as keyof typeof row])).join(","))].join("\n");
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-source-starter-pack"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "무료혜택 starter pack 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "무료혜택 starter pack 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const report = getFreeBenefitSourceStarterPack();
  const format = url.searchParams.get("format")?.toLowerCase();

  if (format === "env") {
    return new NextResponse(`${report.envTemplate.trim()}\n`, {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"halindosa-free-benefit-feed-starter-pack.env\"",
        "Cache-Control": "no-store"
      }
    });
  }

  if (format === "csv") {
    return new NextResponse(toCsv(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"halindosa-free-benefit-feed-starter-pack.csv\"",
        "Cache-Control": "no-store"
      }
    });
  }

  return NextResponse.json(
    {
      ok: report.ok,
      requestId,
      report,
      message: "무료혜택 운영 feed starter pack을 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

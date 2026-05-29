import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { dryRunPartnerFeedImport, PartnerFeedItem, samplePartnerFeed } from "@/lib/feedImport";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!canAccessAdmin(token)) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "피드 샘플 조회 권한이 없습니다."
      },
      { status: 401, headers: { "X-Request-Id": requestId } }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      sampleFeed: samplePartnerFeed,
      message: "파트너 피드 dry-run 샘플입니다."
    },
    { headers: { "X-Request-Id": requestId } }
  );
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-import"),
    limit: 20,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "피드 검증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "피드 검증 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const body = (await request.json()) as {
    source?: string;
    items?: PartnerFeedItem[];
  };
  const result = dryRunPartnerFeedImport(body.items ?? [], body.source ?? "partner_feed");

  return NextResponse.json(
    {
      ...result,
      requestId,
      message: result.ok
        ? "파트너 피드 dry-run 검증을 통과했습니다."
        : "파트너 피드에 수정이 필요한 항목이 있습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

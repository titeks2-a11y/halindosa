import { NextResponse } from "next/server";
import { AnalyticsEventInput, createAnalyticsEvent, validateAnalyticsEvent } from "@/lib/analytics";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "track"),
    limit: 120,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  try {
    const body = (await request.json()) as AnalyticsEventInput;
    const validation = validateAnalyticsEvent(body);

    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          message: validation.message
        },
        { status: validation.status, headers: rateLimitHeaders(limit, requestId) }
      );
    }

    const event = createAnalyticsEvent(body);

    // Commercial extension point:
    // Send this event to an analytics warehouse, Supabase table, or partner attribution pipeline.
    return NextResponse.json({
      ok: true,
      requestId,
      event,
      message: "이벤트가 기록되었습니다."
    }, { headers: rateLimitHeaders(limit, requestId) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "이벤트 기록 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200, headers: rateLimitHeaders(limit, requestId) }
    );
  }
}

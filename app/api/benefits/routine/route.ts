import { NextResponse } from "next/server";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDeals } from "@/lib/dealService";
import { buildDailyRoutinePlan } from "@/lib/deals/dailyRoutinePlan";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "benefit-routine"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "혜택 루틴 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const url = new URL(request.url);
  const size = Number(url.searchParams.get("limit") ?? 3);
  const itemLimit = Number.isFinite(size) ? Math.max(1, Math.min(6, Math.floor(size))) : 3;
  const { deals, updatedAt, source } = await getDeals({ sort: "hot" });
  const routine = buildDailyRoutinePlan(deals, itemLimit);

  return NextResponse.json(
    {
      ok: true,
      requestId,
      source,
      updatedAt,
      routine,
      message: "할인도사 오늘 3분 혜택 루틴을 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

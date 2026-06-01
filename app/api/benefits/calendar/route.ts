import { NextResponse } from "next/server";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDeals } from "@/lib/dealService";
import { buildWeeklyBenefitCalendar } from "@/lib/deals/weeklyBenefitCalendar";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "benefit-calendar"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "혜택 캘린더 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const { deals, updatedAt, source } = await getDeals({ sort: "hot" });
  const calendar = buildWeeklyBenefitCalendar(deals);

  return NextResponse.json(
    {
      ok: true,
      requestId,
      source,
      updatedAt,
      audience: "guest",
      loginRequiredFor: ["찜 동기화", "가격 알림 저장", "관심 카테고리 개인화"],
      calendar,
      summary: {
        totalDays: calendar.length,
        totalRoutineDeals: calendar.reduce((total, item) => total + item.count, 0),
        activeDays: calendar.filter((item) => item.count > 0).length
      },
      notice: "비회원도 전체 혜택 캘린더를 볼 수 있습니다. 최종 조건은 판매처 화면에서 확인하세요.",
      message: "할인도사 주간 혜택 캘린더를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

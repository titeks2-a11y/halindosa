import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDeals } from "@/lib/dealService";
import { buildTodayBenefitQueue } from "@/lib/deals/todayBenefitQueue";

const operationActions = {
  "free-first": "무료 혜택 조건, 수량, 수령 버튼을 먼저 확인하세요.",
  "coupon-before-pay": "쿠폰 적용 조건, 최소 주문금액, 중복 적용 여부를 보강하세요.",
  "apptech-point": "출석체크, 적립 주기, 가입 필요 여부를 오늘 기준으로 확인하세요.",
  "mart-convenience": "행사 기간, 지점 제한, 배송 조건을 사용자 문구로 정리하세요.",
  "ending-soon": "마감 전 품절, 종료, 가격 변동 가능성을 우선 점검하세요.",
  "verified-purchase": "구매 상세 이동, 가격 기준 시간, 판매처 도메인을 최종 확인하세요."
} as const;

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-daily-queue"),
    limit: 30,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "오늘 혜택 큐 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "오늘 혜택 큐 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const size = Number(url.searchParams.get("limit") ?? 6);
  const sectionLimit = Number.isFinite(size) ? Math.max(1, Math.min(20, Math.floor(size))) : 6;
  const { deals, updatedAt, source } = await getDeals({ sort: "hot" });
  const queue = buildTodayBenefitQueue(deals, sectionLimit);

  return NextResponse.json(
    {
      ok: true,
      requestId,
      source,
      updatedAt,
      audience: queue.audience,
      loginRequiredFor: queue.loginRequiredFor,
      summary: queue.summary,
      sections: queue.sections.map((section) => ({
        ...section,
        operationAction: operationActions[section.key]
      })),
      message: "할인도사 오늘 혜택 운영 큐를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

import { NextResponse } from "next/server";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDeals } from "@/lib/dealService";
import { toCsv } from "@/lib/csv";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { getLinkReviewActionLabel, getLinkReviewPriority, getLinkReviewReason, getLinkStatusLabel, getLinkTypeLabel } from "@/lib/deals/quality";
import { buildTodayBenefitQueue } from "@/lib/deals/todayBenefitQueue";

const dailyQueueActions = {
  "free-first": "무료 혜택 조건과 수령 버튼 우선 검수",
  "coupon-before-pay": "결제 전 쿠폰 조건과 중복 적용 가능 여부 확인",
  "apptech-point": "매일 반복 적립 가능성과 가입 조건 확인",
  "mart-convenience": "마트·편의점 행사 기간과 지점 제한 확인",
  "ending-soon": "마감 전 재고·종료 여부 우선 점검",
  "verified-purchase": "구매처 상세 이동과 가격 변동 최종 확인"
} as const;

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-export"),
    limit: 10,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "내보내기 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
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
        message: "내보내기 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const { deals, updatedAt, source } = await getDeals({ sort: "hot" });
  const todayQueue = buildTodayBenefitQueue(deals, deals.length);
  const dailyQueueByDeal = new Map<
    string,
    {
      labels: string[];
      actions: string[];
      bestRank: number;
    }
  >();

  todayQueue.sections.forEach((section) => {
    section.items.forEach((item, itemIndex) => {
      const current = dailyQueueByDeal.get(item.id) ?? { labels: [], actions: [], bestRank: Number.POSITIVE_INFINITY };
      current.labels.push(section.title);
      current.actions.push(dailyQueueActions[section.key]);
      current.bestRank = Math.min(current.bestRank, itemIndex + 1);
      dailyQueueByDeal.set(item.id, current);
    });
  });

  const csv = toCsv(
    deals.map((deal) => {
      const queue = dailyQueueByDeal.get(deal.id);
      const dailyQueueRank = queue && Number.isFinite(queue.bestRank) ? queue.bestRank : "";

      return {
        id: deal.id,
        mall: deal.mall,
        title: deal.title,
        category: deal.category,
        originalPrice: deal.originalPrice,
        salePrice: deal.salePrice,
        discountRate: deal.discountRate,
        discountAmount: deal.discountAmount,
        isHot: deal.isHot,
        isNew: deal.isNew,
        isEndingSoon: deal.isEndingSoon,
        popularityScore: deal.popularityScore,
        tags: deal.tags.join("|"),
        dailyQueueSections: queue?.labels.join("|") ?? "",
        dailyQueueRank,
        dailyQueueAction: queue?.actions[0] ?? "",
        linkStatus: getLinkStatusLabel(deal.linkStatus),
        linkType: getLinkTypeLabel(deal.linkType),
        linkLabel: deal.linkLabel,
        reviewPriority: getLinkReviewPriority(deal),
        reviewAction: getLinkReviewActionLabel(deal),
        reviewReason: getLinkReviewReason(deal),
        purchaseConfidence: deal.purchaseConfidence,
        checkedAt: deal.checkedAt,
        finalPurchaseUrl: deal.finalPurchaseUrl,
        source,
        exportedAt: updatedAt
      };
    })
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="halindosa-deals-${new Date().toISOString().slice(0, 10)}.csv"`,
      ...rateLimitHeaders(limit, requestId)
    }
  });
}

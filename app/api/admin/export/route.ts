import { NextResponse } from "next/server";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getDeals } from "@/lib/dealService";
import { toCsv } from "@/lib/csv";
import { canAccessAdmin } from "@/lib/adminAuth";

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

  if (!canAccessAdmin(token)) {
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
  const csv = toCsv(
    deals.map((deal) => ({
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
      source,
      exportedAt: updatedAt
    }))
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="halindosa-deals-${new Date().toISOString().slice(0, 10)}.csv"`,
      ...rateLimitHeaders(limit, requestId)
    }
  });
}

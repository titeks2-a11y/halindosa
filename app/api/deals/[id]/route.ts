import { NextResponse } from "next/server";
import { findDealByIdLive, getRelatedDeals } from "@/lib/dealService";
import { getPriceHistory, getPriceInsight } from "@/lib/priceHistory";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await context.params;
  const deal = await findDealByIdLive(id);

  if (!deal) {
    return NextResponse.json(
      {
        ok: false,
        deal: null,
        relatedDeals: [],
        message: "존재하지 않는 특가입니다."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    deal,
    relatedDeals: getRelatedDeals(id),
    priceHistory: getPriceHistory(deal),
    priceInsight: getPriceInsight(deal),
    updatedAt: new Date().toISOString(),
    source: deal.source,
    message: "특가 상세 데이터를 성공적으로 불러왔습니다."
  });
}

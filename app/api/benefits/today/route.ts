import { NextRequest, NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { buildTodayBenefitQueue } from "@/lib/deals/todayBenefitQueue";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(12, Math.max(3, Number(searchParams.get("limit") ?? 6) || 6));
    const { deals, updatedAt, source } = await getDeals();
    const queue = buildTodayBenefitQueue(deals, limit);

    return NextResponse.json({
      ok: true,
      updatedAt,
      source,
      ...queue,
      message: "오늘 확인할 할인도사 혜택 큐를 불러왔습니다."
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        sections: [],
        message: "오늘 혜택 큐를 불러오는 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

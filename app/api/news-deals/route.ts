import { NextResponse } from "next/server";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 0);
    const result = getVisibleNewsDeals({
      limit,
      category: searchParams.get("category") ?? undefined,
      benefitType: searchParams.get("benefitType") ?? undefined
    });

    return NextResponse.json({
      ok: true,
      ...result,
      message: "검증된 공식 할인뉴스와 이벤트 혜택을 성공적으로 불러왔습니다."
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        deals: [],
        count: 0,
        updatedAt: new Date().toISOString(),
        source: "fallback",
        message: "공식 혜택 뉴스를 불러오지 못했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

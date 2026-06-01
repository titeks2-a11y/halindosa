import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { buildBenefitDecisionGuide } from "@/lib/deals/benefitDecisionGuide";

export async function GET() {
  try {
    const { deals, updatedAt, source } = await getDeals();
    const items = buildBenefitDecisionGuide(deals);

    return NextResponse.json({
      ok: true,
      audience: "guest",
      updatedAt,
      source,
      items,
      summary: {
        totalDecisionCards: items.length,
        actionableBenefits: items.reduce((total, item) => total + item.count, 0)
      },
      loginRequiredFor: ["찜 동기화", "가격 알림 저장", "관심 카테고리 계정 저장"],
      notice: "비회원도 모든 혜택을 볼 수 있고, 저장과 알림 동기화만 선택 로그인이 필요합니다.",
      message: "오늘 먼저 확인할 혜택 판단표를 불러왔습니다."
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        audience: "guest",
        items: [],
        summary: {
          totalDecisionCards: 0,
          actionableBenefits: 0
        },
        message: "혜택 판단표를 불러오는 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

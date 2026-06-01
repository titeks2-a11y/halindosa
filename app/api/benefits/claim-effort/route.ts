import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { buildClaimEffortSummary } from "@/lib/deals/claimEffort";

export async function GET() {
  try {
    const { deals, updatedAt, source } = await getDeals();
    const summary = buildClaimEffortSummary(deals);

    return NextResponse.json({
      ok: true,
      audience: "guest",
      updatedAt,
      source,
      ...summary,
      loginRequiredFor: ["찜 동기화", "가격 알림 저장", "관심 카테고리 계정 저장"],
      message: "혜택 수령 난이도 큐를 성공적으로 불러왔습니다."
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        audience: "guest",
        totalActiveBenefits: 0,
        groups: [],
        recommendedOrder: [],
        message: "혜택 수령 난이도 큐를 불러오는 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { getDealSourceReadiness, listDealSourceProfiles } from "@/lib/deals/trust";

export async function GET() {
  const { deals, source, updatedAt } = await getDeals();
  const profiles = listDealSourceProfiles();
  const readiness = getDealSourceReadiness(deals);
  const counts = new Map<string, number>();

  for (const deal of deals) {
    counts.set(deal.source, (counts.get(deal.source) ?? 0) + 1);
  }

  return NextResponse.json({
    ok: true,
    activeMode: process.env.DEAL_DATA_MODE ?? process.env.DEAL_PROVIDER ?? "mock",
    currentSource: source,
    updatedAt,
    sources: profiles.map((profile) => ({
      ...profile,
      dealCount: counts.get(profile.key) ?? 0,
      readiness: readiness.find((item) => item.key === profile.key) ?? null
    })),
    readiness,
    operationPolicy: {
      allowedSources: ["공식 API", "RSS", "제휴 피드", "허용된 파트너 JSON"],
      blockedSources: ["약관이 불명확한 크롤링", "커뮤니티 원문 단독 구매 링크", "검색 결과를 상세 링크처럼 표시"],
      nextStep: "신규 피드는 dry-run 검증 후 linkStatus, benefitSummary, expireAt, sourceUrl을 확인한 항목만 노출합니다."
    },
    message: "할인도사 데이터 공급원 상태를 불러왔습니다."
  });
}

import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { getNewsOperationsReport } from "@/lib/deals/newsOperations";
import { getConfiguredProductionFeedUrls } from "@/lib/deals/providers/productionProvider";
import { getDealSourceReadiness, listDealSourceProfiles } from "@/lib/deals/trust";

export async function GET() {
  const { deals, source, updatedAt } = await getDeals();
  const profiles = listDealSourceProfiles();
  const readiness = getDealSourceReadiness(deals);
  const newsOperations = getNewsOperationsReport();
  const counts = new Map<string, number>();
  const configuredProductionFeeds = getConfiguredProductionFeedUrls().length;

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
    officialBenefitProviderReadiness: {
      summary: newsOperations.providerRiskSummary,
      providers: newsOperations.providerRisks.map((risk) => ({
        provider: risk.provider,
        source: risk.source,
        severity: risk.severity,
        label: risk.label,
        reason: risk.reason,
        action: risk.action,
        visibleCount: risk.visibleCount,
        issueCount: risk.issueCount
      })),
      nextActions: newsOperations.providerRisks
        .filter((risk) => risk.severity !== "healthy")
        .slice(0, 5)
        .map((risk) => ({
          provider: risk.provider,
          severity: risk.severity,
          action: risk.action
        }))
    },
    operationPolicy: {
      configuredProductionFeeds,
      allowedSources: ["공식 API", "RSS", "제휴 피드", "허용된 파트너 JSON"],
      blockedSources: ["약관이 불명확한 크롤링", "커뮤니티 원문 단독 구매 링크", "검색 결과를 상세 링크처럼 표시"],
      officialBenefitProviderRiskOk: newsOperations.providerRiskSummary.danger === 0,
      nextStep: configuredProductionFeeds
        ? "production 피드는 dry-run 검증 후 유효한 상품·혜택 상세 URL만 노출합니다."
        : "DEAL_PRODUCTION_FEED_URLS에 공식 API, RSS 변환 JSON, 제휴 피드 URL을 연결한 뒤 dry-run 검증을 실행하세요."
    },
    message: "할인도사 데이터 공급원 상태를 불러왔습니다."
  });
}

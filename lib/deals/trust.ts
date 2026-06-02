import { Deal } from "@/types/deal";

export interface DealSourceProfile {
  key: string;
  label: string;
  status: "active" | "ready" | "planned";
  reliability: number;
  disclosure: string;
}

export interface DealSourceReadiness {
  key: string;
  label: string;
  status: DealSourceProfile["status"];
  dealCount: number;
  verifiedCount: number;
  verifiedRate: number;
  benefitCount: number;
  conditionReadyCount: number;
  reportCount: number;
  readinessLabel: string;
  nextAction: string;
}

const sourceProfiles: DealSourceProfile[] = [
  {
    key: "mock",
    label: "할인도사 큐레이션",
    status: "active",
    reliability: 82,
    disclosure: "할인도사가 정리한 기본 특가 정보"
  },
  {
    key: "halindosa_live",
    label: "실시간 특가 감지",
    status: "ready",
    reliability: 78,
    disclosure: "공개 특가 신호를 정규화한 데이터"
  },
  {
    key: "naver_shopping",
    label: "가격 비교 신호",
    status: "ready",
    reliability: 76,
    disclosure: "검색 기반 가격 비교 후보"
  },
  {
    key: "staging",
    label: "스테이징 피드",
    status: "ready",
    reliability: 74,
    disclosure: "사전 확인 중인 특가 정보"
  },
  {
    key: "production",
    label: "운영 피드",
    status: "planned",
    reliability: 88,
    disclosure: "공식 API, RSS, 제휴 피드 연결 예정"
  },
  {
    key: "partner_feed",
    label: "파트너 피드",
    status: "ready",
    reliability: 80,
    disclosure: "제휴사 제공 데이터 검증 경로"
  }
];

export function listDealSourceProfiles() {
  return sourceProfiles;
}

export function getDealSourceProfile(source?: string) {
  return sourceProfiles.find((profile) => profile.key === source) ?? sourceProfiles[0];
}

export function getDealTrustScore(deal: Deal) {
  const source = getDealSourceProfile(deal.source);
  const expiryHours = Math.max(0, (new Date(deal.expireAt).getTime() - Date.now()) / (60 * 60 * 1000));
  const score =
    source.reliability +
    Math.min(10, deal.discountRate / 8) +
    (deal.isHot ? 4 : 0) +
    (deal.isFreeShipping ? 3 : 0) +
    (expiryHours > 0 ? 3 : -12);

  return Math.max(0, Math.min(99, Math.round(score)));
}

export function getDealTrustLabel(score: number) {
  if (score >= 90) return "정보 확인 높음";
  if (score >= 80) return "정보 확인 양호";
  if (score >= 70) return "조건 확인";
  return "판매처 확인";
}

function getReadinessLabel(rate: number, dealCount: number) {
  if (!dealCount) return "연결 대기";
  if (rate >= 90) return "운영 노출 가능";
  if (rate >= 70) return "검수 후 노출";
  return "보강 필요";
}

function getNextSourceAction(rate: number, dealCount: number, reportCount: number) {
  if (!dealCount) return "공식 API, RSS, 제휴 피드 연결 후 dry-run 검증";
  if (reportCount > 0) return "사용자 신고가 있는 링크와 종료 여부 우선 확인";
  if (rate < 70) return "상품·혜택 상세 URL 보강";
  if (rate < 90) return "무료/쿠폰 조건과 만료일을 운영 검수 큐에서 확인";
  return "현재 기준 유지, 신규 피드만 샘플 검수 후 반영";
}

export function getDealSourceReadiness(deals: Deal[]): DealSourceReadiness[] {
  return sourceProfiles.map((profile) => {
    const scopedDeals = deals.filter((deal) => deal.source === profile.key);
    const verifiedCount = scopedDeals.filter((deal) => deal.linkStatus === "verified" && Boolean(deal.finalPurchaseUrl)).length;
    const benefitCount = scopedDeals.filter((deal) =>
      ["freebie", "coupon", "freeShipping", "experience", "point", "convenienceStore", "mart", "foodDelivery"].includes(deal.dealType)
    ).length;
    const conditionReadyCount = scopedDeals.filter((deal) =>
      Boolean(deal.benefitSummary && deal.shippingFee && (deal.couponCondition || deal.minimumOrderAmount || deal.claimCta))
    ).length;
    const reportCount = scopedDeals.reduce((total, deal) => total + deal.reportCount, 0);
    const verifiedRate = scopedDeals.length ? Math.round((verifiedCount / scopedDeals.length) * 100) : 0;

    return {
      key: profile.key,
      label: profile.label,
      status: profile.status,
      dealCount: scopedDeals.length,
      verifiedCount,
      verifiedRate,
      benefitCount,
      conditionReadyCount,
      reportCount,
      readinessLabel: getReadinessLabel(verifiedRate, scopedDeals.length),
      nextAction: getNextSourceAction(verifiedRate, scopedDeals.length, reportCount)
    };
  });
}

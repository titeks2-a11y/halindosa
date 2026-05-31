import { Deal } from "@/types/deal";

export interface DealSourceProfile {
  key: string;
  label: string;
  status: "active" | "ready" | "planned";
  reliability: number;
  disclosure: string;
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

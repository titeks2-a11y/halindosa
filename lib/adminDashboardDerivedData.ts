import type { buildClaimEffortSummary } from "@/lib/deals/claimEffort";
import type { Deal } from "@/types/deal";

export const adminSampleNewsFeedText =
  '<rss><channel><item><guid>admin-news-sample-001</guid><title>공식 이벤트 링크가 포함된 할인 뉴스 샘플</title><link>https://news.naver.com/example/halindosa-benefit-context</link><description><![CDATA[맥도날드 공식 행사 페이지 <a href="https://www.mcdonalds.co.kr/kor/promotion/detail.do?seq=593">바로가기</a>]]></description><category>외식/배달</category><benefitType>coupon</benefitType><merchant>맥도날드</merchant><endDate>2026-12-31T14:59:59.000Z</endDate></item></channel></rss>';

type BenefitQualitySummary = {
  freeBenefitCount: number;
  activeCount: number;
  verifiedCount: number;
  total: number;
  needsReviewCount: number;
};

type BenefitRetentionSummary = {
  activeRoutineSlots: number;
};

type ClaimEffortSummary = ReturnType<typeof buildClaimEffortSummary>;

export function countDealsBySource(deals: Deal[]) {
  const sourceCounts = new Map<string, number>();
  for (const deal of deals) {
    sourceCounts.set(deal.source, (sourceCounts.get(deal.source) ?? 0) + 1);
  }
  return sourceCounts;
}

export function buildLinkReviewSummary(linkReviewDeals: Array<{ reviewPriority: "high" | "medium" | "low" }>) {
  return [
    {
      priority: "high",
      title: "오늘 먼저 처리",
      count: linkReviewDeals.filter((deal) => deal.reviewPriority === "high").length,
      description: "인기·마감 상품 또는 오류/품절 가능성이 있어 우선 확인"
    },
    {
      priority: "medium",
      title: "상품 URL 보강",
      count: linkReviewDeals.filter((deal) => deal.reviewPriority === "medium").length,
      description: "판매처 검색 이동 상품을 실제 상품 상세 URL로 보강"
    },
    {
      priority: "low",
      title: "대기 검수",
      count: linkReviewDeals.filter((deal) => deal.reviewPriority === "low").length,
      description: "노출 우선순위는 낮지만 출시 전 순차 확인"
    }
  ] as const;
}

export function buildBenefitOperationSummary(benefitQuality: BenefitQualitySummary) {
  return [
    {
      title: "혜택형 콘텐츠",
      value: `${benefitQuality.freeBenefitCount}개`,
      description: "무료, 쿠폰, 포인트, 체험단, 생활 혜택 큐"
    },
    {
      title: "활성 노출 가능",
      value: `${benefitQuality.activeCount}개`,
      description: "종료 전 상태로 사용자에게 보여줄 수 있는 혜택"
    },
    {
      title: "구매처 확인",
      value: `${benefitQuality.verifiedCount}/${benefitQuality.total}`,
      description: "판매처 이동 전 링크 확인이 끝난 항목"
    },
    {
      title: "점검 우선",
      value: `${benefitQuality.needsReviewCount}개`,
      description: "신고, 종료, 품절, 링크 보강을 먼저 확인할 항목"
    }
  ];
}

export function buildDailyOperationCheckIn(params: {
  benefitQuality: BenefitQualitySummary;
  benefitRetention: BenefitRetentionSummary;
  needsReviewLinks: number;
  openReportCount: number;
  urgentBenefitActions: number;
  adminExportHref: string;
}) {
  return [
    {
      title: "무료 혜택 보강",
      value: `${params.benefitQuality.freeBenefitCount}개`,
      description: "무료 샘플, 쿠폰, 포인트, 체험 혜택이 매일 볼 만큼 충분한지 확인",
      href: "/free-benefits"
    },
    {
      title: "링크 검수",
      value: `${params.needsReviewLinks}개`,
      description: "검색 이동이나 확인 필요 링크를 실제 상품/혜택 상세 URL로 보강",
      href: params.adminExportHref
    },
    {
      title: "신고·종료 정리",
      value: `${params.openReportCount + params.urgentBenefitActions}건`,
      description: "사용자 신고, 종료 임박, 품절 가능성이 있는 혜택을 먼저 정리",
      href: "#report-queue"
    },
    {
      title: "재방문 루틴",
      value: `${params.benefitRetention.activeRoutineSlots}/5`,
      description: "무료·쿠폰·포인트·마트·마감 혜택 슬롯이 매일 갱신되는지 확인",
      href: "/notifications"
    }
  ];
}

export function buildClaimEffortOperationQueue(groups: ClaimEffortSummary["groups"]) {
  return groups.map((group) => {
    const sample = group.items[0];
    const operationAction =
      group.effort === "easy"
        ? "앱 첫 화면과 무료혜택 탭에 우선 노출"
        : group.effort === "condition"
          ? "가입·배송비·쿠폰 조건을 카드와 상세에 보강"
          : "마감·선착순·종료 신고를 당일 점검";

    return {
      ...group,
      sampleTitle: sample?.title ?? "노출 후보 없음",
      operationAction
    };
  });
}

export function buildProviderVolume(sourceCounts: Map<string, number>) {
  return Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
}

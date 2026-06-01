import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { buildTodayBenefitQueue, getDailyBenefitSectionDeals, toDailyBenefitItem } from "@/lib/deals/todayBenefitQueue";
import type { Deal } from "@/types/deal";

export type DailyRoutineStepId = "free" | "coupon" | "point" | "ending" | "verified";

const routineStepCopy: Record<
  DailyRoutineStepId,
  {
    title: string;
    description: string;
    href: string;
    primaryAction: string;
  }
> = {
  free: {
    title: "무료 혜택 1개 먼저 확인",
    description: "무료 샘플, 체험단, 초대권처럼 결제 부담이 낮은 혜택을 먼저 엽니다.",
    href: "/free-benefits?mission=free",
    primaryAction: "무료 혜택 보기"
  },
  coupon: {
    title: "결제 전 쿠폰 챙기기",
    description: "쇼핑, 배달, 브랜드 쿠폰처럼 결제 직전에 조건을 확인할 혜택입니다.",
    href: "/free-benefits?mission=coupon",
    primaryAction: "쿠폰 후보 보기"
  },
  point: {
    title: "앱테크·포인트 루틴",
    description: "출석, 페이 리워드, 멤버십 적립처럼 매일 반복 확인할 혜택입니다.",
    href: "/free-benefits?mission=point",
    primaryAction: "포인트 보기"
  },
  ending: {
    title: "마감 전 마지막 확인",
    description: "선착순, 기간 한정, 종료 가능성이 있는 혜택을 먼저 점검합니다.",
    href: "/?sort=endingSoon",
    primaryAction: "마감 임박 보기"
  },
  verified: {
    title: "실제 구매처 확인 특가",
    description: "검색 결과가 아니라 상품·혜택 상세 이동이 확인된 링크를 우선 확인합니다.",
    href: "/?verifiedOnly=true",
    primaryAction: "검증 링크 보기"
  }
};

function getRoutineDeals(stepId: DailyRoutineStepId, deals: Deal[]) {
  if (stepId === "free") return getDailyBenefitSectionDeals("free-first", deals);
  if (stepId === "coupon") return getDailyBenefitSectionDeals("coupon-before-pay", deals);
  if (stepId === "point") return getDailyBenefitSectionDeals("apptech-point", deals);
  if (stepId === "ending") return getDailyBenefitSectionDeals("ending-soon", deals);
  return getDailyBenefitSectionDeals("verified-purchase", deals);
}

export function buildDailyRoutinePlan(deals: Deal[], limit = 3) {
  const queue = buildTodayBenefitQueue(deals, limit);
  const activeDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken");
  const stepIds: DailyRoutineStepId[] = ["free", "coupon", "point", "ending", "verified"];
  const steps = stepIds.map((stepId) => {
    const scopedDeals = getRoutineDeals(stepId, activeDeals);
    const items = scopedDeals.slice(0, limit).map(toDailyBenefitItem);
    const leadingType = scopedDeals[0] ? getBenefitTypeLabel(scopedDeals[0].dealType) : "혜택";

    return {
      id: stepId,
      ...routineStepCopy[stepId],
      count: scopedDeals.length,
      leadingType,
      items,
      doneSignal: stepId === "free" ? "챙김 기록" : stepId === "coupon" ? "찜 또는 쿠폰 확인" : stepId === "ending" ? "마감 전 열람" : "오늘 확인"
    };
  });

  return {
    audience: "guest",
    loginRequiredFor: queue.loginRequiredFor,
    title: "오늘 3분 혜택 루틴",
    description: "비회원도 바로 실행할 수 있는 무료, 쿠폰, 포인트, 마감, 검증 링크 순서입니다.",
    summary: {
      activeDeals: queue.summary.activeDeals,
      actionableSteps: steps.filter((step) => step.count > 0).length,
      freeBenefitDeals: queue.summary.freeBenefitDeals,
      couponDeals: queue.summary.couponDeals,
      verifiedPurchaseDeals: queue.summary.verifiedPurchaseDeals
    },
    steps,
    notice: "찜, 가격 알림, 관심 카테고리 저장만 선택 로그인이 필요합니다. 최종 수령 조건은 판매처에서 다시 확인하세요."
  };
}

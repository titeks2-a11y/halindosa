import { buildTodayBenefitQueue } from "@/lib/deals/todayBenefitQueue";
import { buildWeeklyBenefitCalendar } from "@/lib/deals/weeklyBenefitCalendar";
import type { Deal } from "@/types/deal";

const dayOrder = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function getKoreanDayLabel(date = new Date()) {
  return dayOrder[date.getDay()];
}

export function buildDailyBenefitBriefing(deals: Deal[], date = new Date(), limit = 3) {
  const todayQueue = buildTodayBenefitQueue(deals, limit);
  const weeklyCalendar = buildWeeklyBenefitCalendar(deals, date.getTime());
  const todayLabel = getKoreanDayLabel(date);
  const todayCalendar = weeklyCalendar.find((item) => item.day === todayLabel) ?? weeklyCalendar[0];
  const primarySection = todayQueue.sections.find((section) => section.items.length > 0) ?? todayQueue.sections[0];

  return {
    audience: "guest",
    loginRequiredFor: todayQueue.loginRequiredFor,
    todayLabel,
    headline: `${todayLabel}요일 먼저 볼 혜택`,
    summary: {
      activeDeals: todayQueue.summary.activeDeals,
      freeBenefitDeals: todayQueue.summary.freeBenefitDeals,
      couponDeals: todayQueue.summary.couponDeals,
      verifiedPurchaseDeals: todayQueue.summary.verifiedPurchaseDeals,
      weeklyRoutineDeals: weeklyCalendar.reduce((total, item) => total + item.count, 0)
    },
    todayCalendar,
    primarySection,
    quickActions: [
      {
        label: "오늘 루틴 보기",
        href: todayCalendar.recommendedSurface,
        description: todayCalendar.copy
      },
      {
        label: "무료 혜택 먼저",
        href: "/free-benefits",
        description: "무료 샘플, 체험단, 무료배송, 포인트 적립 혜택을 먼저 확인합니다."
      },
      {
        label: "검증 구매처 확인",
        href: "/?verifiedOnly=true",
        description: "검색 결과가 아니라 상품·혜택 상세 이동이 확인된 특가를 우선 확인합니다."
      }
    ],
    notice: "비회원도 모든 혜택을 볼 수 있습니다. 찜, 가격 알림, 관심 카테고리 저장만 선택 로그인이 필요합니다."
  };
}

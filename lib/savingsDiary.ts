import type { ClaimedBenefitRecord } from "@/lib/claimedBenefits";
import type { Deal } from "@/types/deal";

export interface SavingsDiaryAction {
  title: string;
  description: string;
  href: string;
  count: number;
}

export function buildSavingsDiarySummary(records: ClaimedBenefitRecord[], deals: Deal[] = []) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const dealById = new Map(deals.map((deal) => [deal.id, deal]));
  const claimedIds = new Set(records.map((record) => record.dealId));
  const todayRecords = records.filter((record) => record.claimedAt.slice(0, 10) === todayKey);
  const weeklyRecords = records.filter((record) => new Date(record.claimedAt).getTime() >= sevenDaysAgo);
  const totalSavings = records.reduce((sum, record) => sum + Math.max(0, record.savingsAmount), 0);
  const weeklySavings = weeklyRecords.reduce((sum, record) => sum + Math.max(0, record.savingsAmount), 0);
  const providerCounts = new Map<string, number>();

  for (const record of records) {
    const provider = record.mallName || dealById.get(record.dealId)?.mallName || "제공처";
    providerCounts.set(provider, (providerCounts.get(provider) ?? 0) + 1);
  }

  const topProvider =
    Array.from(providerCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "아직 없음";
  const activeDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken" && !claimedIds.has(deal.id));
  const freeQueue = activeDeals.filter((deal) => deal.dealType === "freebie" || deal.dealType === "experience");
  const couponQueue = activeDeals.filter((deal) => ["coupon", "foodDelivery", "point"].includes(deal.dealType));
  const endingQueue = activeDeals.filter((deal) => deal.isEndingSoon || new Date(deal.expireAt).getTime() - Date.now() < 24 * 60 * 60 * 1000);
  const nextActions: SavingsDiaryAction[] = [
    {
      title: "무료 혜택 1개 더 챙기기",
      description: "오늘 아직 기록하지 않은 샘플, 체험, 초대권 후보입니다.",
      href: "/free-benefits?dealType=freebie&sort=recommended",
      count: freeQueue.length
    },
    {
      title: "결제 전 쿠폰 확인",
      description: "구매하기 전 적용 가능한 쿠폰, 포인트, 외식 혜택입니다.",
      href: "/free-benefits?dealType=coupon&sort=popular",
      count: couponQueue.length
    },
    {
      title: "마감 전 놓친 혜택 보기",
      description: "오늘 안에 조건을 다시 확인하면 좋은 마감 임박 혜택입니다.",
      href: "/free-benefits?sort=endingSoon&activeOnly=true",
      count: endingQueue.length
    }
  ];

  return {
    todayCount: todayRecords.length,
    weeklyCount: weeklyRecords.length,
    totalCount: records.length,
    weeklySavings,
    totalSavings,
    topProvider,
    recentRecords: records.slice(0, 4),
    nextActions
  };
}

import type { NewsDeadlineBucket, NewsDeadlineSummary, NewsDeal } from "@/types/newsDeal";

function hoursUntil(endDate: string, now: number) {
  const endsAt = Date.parse(endDate);
  if (!Number.isFinite(endsAt)) return Number.POSITIVE_INFINITY;
  return (endsAt - now) / (60 * 60 * 1000);
}

export function buildNewsDeadlineSummary(deals: NewsDeal[] = [], now = Date.now()): NewsDeadlineSummary {
  const activeDeals = deals.filter((deal) => {
    const hoursLeft = hoursUntil(deal.endDate, now);
    return hoursLeft >= 0 && Number.isFinite(hoursLeft);
  });
  const expiringTodayCount = activeDeals.filter((deal) => hoursUntil(deal.endDate, now) <= 24).length;
  const expiringThreeDaysCount = activeDeals.filter((deal) => hoursUntil(deal.endDate, now) <= 72).length;
  const expiringSevenDaysCount = activeDeals.filter((deal) => hoursUntil(deal.endDate, now) <= 168).length;
  const laterCount = activeDeals.filter((deal) => hoursUntil(deal.endDate, now) > 168).length;
  const nearestEndDate =
    activeDeals
      .map((deal) => deal.endDate)
      .filter((value) => Number.isFinite(Date.parse(value)))
      .sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? "";
  const buckets: NewsDeadlineBucket[] = [
    { id: "today", label: "오늘 종료", count: expiringTodayCount, maxHours: 24 },
    { id: "threeDays", label: "3일 내", count: expiringThreeDaysCount, maxHours: 72 },
    { id: "sevenDays", label: "7일 내", count: expiringSevenDaysCount, maxHours: 168 },
    { id: "later", label: "여유 있음", count: laterCount, maxHours: null }
  ];

  return {
    expiringTodayCount,
    expiringThreeDaysCount,
    expiringSevenDaysCount,
    laterCount,
    nearestEndDate,
    buckets
  };
}

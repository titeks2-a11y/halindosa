import Link from "next/link";
import { CalendarClock, ExternalLink, Gift, RefreshCw, ShieldCheck } from "lucide-react";
import { CommerceBadge } from "@/components/ui/CommerceBadge";
import { getRelativeTime, getTimeLeft } from "@/lib/format";
import type { NewsDeal } from "@/types/newsDeal";

const benefitLabels: Record<NewsDeal["benefitType"], string> = {
  discount: "할인",
  coupon: "쿠폰",
  freebie: "무료",
  freeShipping: "무배",
  event: "이벤트",
  membership: "멤버십",
  card: "카드",
  culture: "문화",
  travel: "여행",
  public: "공공",
  point: "포인트",
  foodDelivery: "배달",
  convenienceStore: "편의점",
  mart: "마트"
};

interface HomeLiveBenefitStripProps {
  deals: NewsDeal[];
  totalCount: number;
  updatedAt: string;
  freshnessLabel?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onOpenNewsDeal?: (deal: NewsDeal) => void;
}

function isFreeBenefit(deal: NewsDeal) {
  return ["freebie", "coupon", "freeShipping", "point", "event"].includes(deal.benefitType) || deal.category === "무료혜택";
}

function isEndingSoon(deal: NewsDeal) {
  const endTime = Date.parse(deal.expiresAt || deal.endDate);
  if (!Number.isFinite(endTime)) return false;
  const hoursLeft = (endTime - Date.now()) / 3_600_000;
  return hoursLeft >= 0 && hoursLeft <= 72;
}

function getVisibleBenefitDeals(deals: NewsDeal[]) {
  return deals
    .filter(
      (deal) =>
        deal.finalUrl &&
        !deal.isHidden &&
        deal.availability === "active" &&
        deal.validationStatus === "passed" &&
        !["search", "community", "invalid", "news_only"].includes(deal.linkType)
    )
    .sort((a, b) => b.qualityScore - a.qualityScore || b.priorityScore - a.priorityScore)
    .slice(0, 3);
}

export function HomeLiveBenefitStrip({
  deals,
  totalCount,
  updatedAt,
  freshnessLabel,
  isRefreshing = false,
  onRefresh,
  onOpenNewsDeal
}: HomeLiveBenefitStripProps) {
  const visibleDeals = getVisibleBenefitDeals(deals);
  const freeCount = deals.filter(isFreeBenefit).length;
  const endingSoonCount = deals.filter(isEndingSoon).length;
  const checkedLabel = isRefreshing ? "검증 중" : freshnessLabel || (updatedAt ? getRelativeTime(updatedAt) : "확인 대기");

  return (
    <div
      data-home-live-benefit-strip="true"
      className="mt-1.5 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 via-white to-orange-50 px-2 py-2 sm:hidden"
      aria-label="모바일 공식 혜택 실시간 요약"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[11px] font-black text-dossa-red">
            <Gift size={13} />
            방금 검증한 무료혜택
          </p>
          <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500">
            공식 링크 {totalCount.toLocaleString("ko-KR")}개 · 무료/쿠폰 {freeCount.toLocaleString("ko-KR")}개 · {checkedLabel}
          </p>
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-full bg-white px-2.5 text-[10px] font-black text-dossa-red shadow-sm disabled:cursor-wait disabled:opacity-60"
            aria-label="공식 무료혜택 다시 확인"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        ) : null}
      </div>

      <div className="mt-1.5 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="검증된 공식 혜택 바로가기">
        {visibleDeals.length ? (
          visibleDeals.map((deal) => (
            <Link
              key={deal.id}
              href={`/go/news/${encodeURIComponent(deal.id)}?from=home-live-benefit-strip`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpenNewsDeal?.(deal)}
              className="inline-flex min-h-9 w-[74%] shrink-0 items-center justify-between gap-2 rounded-xl border border-white bg-white px-2.5 text-left shadow-sm"
              aria-label={`${deal.title} 공식 혜택 새 탭으로 열기`}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1">
                  <CommerceBadge tone={isFreeBenefit(deal) ? "gold" : "neutral"} className="px-1.5 py-0.5 text-[9px]">
                    {benefitLabels[deal.benefitType]}
                  </CommerceBadge>
                  {isEndingSoon(deal) ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-700">
                      <CalendarClock size={10} />
                      {getTimeLeft(deal.expiresAt || deal.endDate)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                      <ShieldCheck size={10} />
                      공식
                    </span>
                  )}
                </span>
                <span className="mt-0.5 line-clamp-1 text-[11px] font-black leading-4 text-slate-950">{deal.title}</span>
              </span>
              <ExternalLink size={12} className="shrink-0 text-dossa-red" />
            </Link>
          ))
        ) : (
          <p className="rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-slate-500">현재 검증된 무료혜택을 불러오는 중입니다.</p>
        )}
      </div>

      {endingSoonCount ? (
        <p className="mt-1 text-[10px] font-bold text-amber-700">마감 임박 공식 혜택 {endingSoonCount.toLocaleString("ko-KR")}개를 우선 확인하세요.</p>
      ) : null}
    </div>
  );
}

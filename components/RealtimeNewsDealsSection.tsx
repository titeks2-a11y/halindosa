"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarClock, ExternalLink, RefreshCw, ShieldCheck, TicketPercent } from "lucide-react";
import { getRelativeTime, getTimeLeft } from "@/lib/format";
import { rememberRecentNewsBenefitId } from "@/lib/recentNewsBenefits";
import { CommerceBadge } from "@/components/ui/CommerceBadge";
import { commerceButtonClassName } from "@/components/ui/CommerceButton";
import { CommerceCard } from "@/components/ui/CommerceCard";
import { CommerceSectionHeader } from "@/components/ui/CommerceSectionHeader";
import { StatePanel } from "@/components/ui/StatePanel";
import type { NewsDeal } from "@/types/newsDeal";

const benefitLabels: Record<NewsDeal["benefitType"], string> = {
  discount: "할인",
  coupon: "쿠폰",
  freebie: "무료",
  membership: "멤버십",
  card: "카드",
  culture: "문화",
  travel: "여행",
  public: "공공혜택",
  point: "포인트",
  foodDelivery: "배달"
};

const categoryHighlights = [
  { key: "free-coupon", label: "무료/쿠폰 혜택", matches: (deal: NewsDeal) => deal.category === "무료혜택" || deal.benefitType === "coupon" || deal.benefitType === "freebie" || deal.benefitType === "point" },
  { key: "card", label: "카드·멤버십 할인", matches: (deal: NewsDeal) => deal.category === "카드/멤버십" || deal.benefitType === "card" || deal.benefitType === "membership" },
  { key: "culture", label: "영화·문화 할인", matches: (deal: NewsDeal) => deal.category === "영화/문화" || deal.benefitType === "culture" },
  { key: "mart", label: "마트·편의점 행사", matches: (deal: NewsDeal) => deal.category === "마트/편의점" },
  { key: "public", label: "정부·공공혜택", matches: (deal: NewsDeal) => deal.category === "정부/공공혜택" || deal.benefitType === "public" },
  { key: "delivery", label: "외식·배달 쿠폰", matches: (deal: NewsDeal) => deal.category === "외식/배달" || deal.benefitType === "foodDelivery" }
];

export function RealtimeNewsDealsSection({
  deals,
  updatedAt,
  isRefreshing = false,
  refreshError = "",
  onRefresh,
  onOpenNewsDeal
}: {
  deals: NewsDeal[];
  updatedAt: string;
  isRefreshing?: boolean;
  refreshError?: string;
  onRefresh?: () => void;
  onOpenNewsDeal?: (deal: NewsDeal) => void;
}) {
  const highlightCounts = useMemo(
    () =>
      categoryHighlights
        .map((item) => ({
          ...item,
          count: deals.filter(item.matches).length
        }))
        .filter((item) => item.count > 0),
    [deals]
  );

  if (!deals.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 shadow-sm" aria-label="오늘의 실시간 할인뉴스">
        <StatePanel
          tone="retry"
          title="공식 링크가 확인된 혜택만 준비 중입니다"
          description="검색 결과, 커뮤니티 원문, 종료 이벤트는 노출하지 않습니다. 공식 이벤트 페이지가 검증되면 이 영역에 표시됩니다."
        />
      </section>
    );
  }

  return (
    <CommerceCard tone="surface" className="p-3 sm:rounded-[28px] sm:p-4" aria-label="오늘의 실시간 할인뉴스">
      <CommerceSectionHeader
        eyebrow="오늘의 실시간 할인뉴스"
        title="공식 혜택 페이지로 바로 이동"
        compact
        trailing={
          <div className="hidden items-center gap-1.5 sm:flex">
            <CommerceBadge tone={refreshError ? "gold" : "neutral"}>
              {isRefreshing ? "갱신 중" : updatedAt ? getRelativeTime(updatedAt) : "방금 확인"}
            </CommerceBadge>
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-red hover:text-brand-red disabled:cursor-wait disabled:opacity-60"
                aria-label="공식 혜택 다시 확인"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            ) : null}
          </div>
        }
      />
      <div className="mt-2 flex items-center justify-between gap-2 sm:hidden">
        <CommerceBadge tone={refreshError ? "gold" : "neutral"}>
          {isRefreshing ? "갱신 중" : updatedAt ? getRelativeTime(updatedAt) : "방금 확인"}
        </CommerceBadge>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 disabled:cursor-wait disabled:opacity-60"
            aria-label="공식 혜택 다시 확인"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            새로고침
          </button>
        ) : null}
      </div>
      {refreshError ? <p className="mt-2 text-[11px] font-bold text-amber-700">{refreshError}</p> : null}
      {highlightCounts.length ? (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="공식 혜택 카테고리 요약">
          {highlightCounts.map((item) => (
            <CommerceBadge key={item.key} tone={item.key === "card" ? "navy" : item.key === "free-coupon" ? "gold" : "neutral"} className="shrink-0">
              {item.label} {item.count}
            </CommerceBadge>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {deals.slice(0, 8).map((deal) => (
          <CommerceCard
            key={deal.id}
            data-news-deal-card="true"
            tone="gold"
            className="min-h-[166px] w-[250px] shrink-0 snap-start rounded-2xl p-4 sm:w-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-red shadow-sm">
                <TicketPercent size={19} />
              </span>
              <CommerceBadge tone="navy">
                {benefitLabels[deal.benefitType]}
              </CommerceBadge>
            </div>
            <p className="mt-3 line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950">{deal.title}</p>
            <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{deal.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <CommerceBadge tone="success" className="bg-white shadow-sm">
                <ShieldCheck size={12} />
                공식 링크
              </CommerceBadge>
              <CommerceBadge tone="neutral" className="bg-white shadow-sm">
                <CalendarClock size={12} />
                {getTimeLeft(deal.endDate)}
              </CommerceBadge>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[11px] font-black text-slate-500">{deal.sourceName}</p>
              <Link
                href={`/go/news/${encodeURIComponent(deal.id)}?from=home-news`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  rememberRecentNewsBenefitId(deal.id);
                  onOpenNewsDeal?.(deal);
                }}
                className={commerceButtonClassName({ tone: "primary", size: "sm", className: "min-h-9 shrink-0 rounded-full px-3" })}
                aria-label={`${deal.title} 공식 페이지 새 탭으로 열기`}
              >
                공식 페이지
                <ExternalLink size={13} />
              </Link>
            </div>
          </CommerceCard>
        ))}
      </div>
    </CommerceCard>
  );
}

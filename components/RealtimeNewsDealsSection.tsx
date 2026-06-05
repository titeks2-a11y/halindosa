"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarClock, ExternalLink, RefreshCw, Search, ShieldCheck, TicketPercent } from "lucide-react";
import { getRelativeTime, getTimeLeft } from "@/lib/format";
import { rememberRecentNewsBenefitId } from "@/lib/recentNewsBenefits";
import { OfficialBenefitIntentGroups } from "@/components/OfficialBenefitIntentGroups";
import { CommerceBadge } from "@/components/ui/CommerceBadge";
import { commerceButtonClassName } from "@/components/ui/CommerceButton";
import { CommerceCard } from "@/components/ui/CommerceCard";
import { CommerceSectionHeader } from "@/components/ui/CommerceSectionHeader";
import { StatePanel } from "@/components/ui/StatePanel";
import {
  buildNewsSourceTrustMap,
  buildNewsSourceTrustScores,
  getNewsDealSourceTrust,
  sortNewsDealsBySourceTrust
} from "@/lib/deals/newsSourceTrust";
import { customerIntentNewsQuerySet } from "@/lib/deals/newsRecommendedQueries";
import { buildNewsDeadlineSummary } from "@/lib/deals/newsDeadlineInsights";
import type { NewsDeadlineSummary, NewsDeal, NewsDealSourceTrust, NewsIntentGroup, NewsTargetSection } from "@/types/newsDeal";

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
  public: "공공혜택",
  point: "포인트",
  foodDelivery: "배달",
  convenienceStore: "편의점",
  mart: "마트"
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
  totalCount,
  recommendedQueries = [],
  targetSections = [],
  intentGroups = [],
  sourceTrustScores = [],
  deadlineSummary,
  updatedAt,
  activeQuery = "",
  freshnessStatus = "fresh",
  freshnessLabel = "",
  freshnessAgeMinutes = null,
  nextRefreshAt = "",
  isRefreshing = false,
  refreshError = "",
  onRefresh,
  onOpenNewsDeal,
  onSelectQuery
}: {
  deals: NewsDeal[];
  totalCount?: number;
  recommendedQueries?: Array<{ query: string; count: number }>;
  targetSections?: NewsTargetSection[];
  intentGroups?: NewsIntentGroup[];
  sourceTrustScores?: NewsDealSourceTrust[];
  deadlineSummary?: NewsDeadlineSummary;
  updatedAt: string;
  activeQuery?: string;
  freshnessStatus?: "fresh" | "due" | "stale" | "seed" | string;
  freshnessLabel?: string;
  freshnessAgeMinutes?: number | null;
  nextRefreshAt?: string;
  isRefreshing?: boolean;
  refreshError?: string;
  onRefresh?: () => void;
  onOpenNewsDeal?: (deal: NewsDeal) => void;
  onSelectQuery?: (query: string) => void;
}) {
  const trimmedQuery = activeQuery.trim();
  const visibleResultCount = typeof totalCount === "number" && totalCount >= deals.length ? totalCount : deals.length;
  const visibleRecommendedQueries = recommendedQueries.filter((item) => item.query && item.query !== trimmedQuery).slice(0, 8);
  const visibleTargetSections = targetSections.filter((item) => item.label && item.query && item.count > 0).slice(0, 8);
  const intentRecommendedQueries = visibleRecommendedQueries.filter((item) => customerIntentNewsQuerySet.has(item.query)).slice(0, 6);
  const quickRecommendedQueries = (intentRecommendedQueries.length ? intentRecommendedQueries : visibleRecommendedQueries).slice(0, 6);
  const secondaryRecommendedQueries = visibleRecommendedQueries
    .filter((item) => !quickRecommendedQueries.some((quickItem) => quickItem.query === item.query))
    .slice(0, 4);
  const effectiveSourceTrustScores = useMemo(
    () => buildNewsSourceTrustScores(deals, sourceTrustScores),
    [deals, sourceTrustScores]
  );
  const visibleSourceTrustScores = effectiveSourceTrustScores
    .filter((item) => item.sourceName && item.trustScore >= 75)
    .slice(0, 5);
  const sourceTrustByKey = useMemo(() => buildNewsSourceTrustMap(effectiveSourceTrustScores), [effectiveSourceTrustScores]);
  const effectiveDeadlineSummary = useMemo(() => deadlineSummary ?? buildNewsDeadlineSummary(deals), [deadlineSummary, deals]);
  const visibleDeadlineBuckets = effectiveDeadlineSummary.buckets.filter((bucket) => bucket.count > 0).slice(0, 3);
  const hasUrgentNewsBenefits = effectiveDeadlineSummary.expiringSevenDaysCount > 0;
  const trustedDeals = useMemo(
    () => sortNewsDealsBySourceTrust(deals, sourceTrustByKey),
    [deals, sourceTrustByKey]
  );
  const freshnessTone = refreshError || freshnessStatus === "stale" ? "warning" : freshnessStatus === "fresh" ? "success" : "neutral";
  const freshnessText = isRefreshing ? "갱신 중" : freshnessLabel || (updatedAt ? getRelativeTime(updatedAt) : "seed 기준");
  const freshnessDetail =
    typeof freshnessAgeMinutes === "number"
      ? freshnessAgeMinutes < 60
        ? `${freshnessAgeMinutes}분 전 확인`
        : `${Math.floor(freshnessAgeMinutes / 60)}시간 전 확인`
      : nextRefreshAt
        ? `다음 확인 ${getRelativeTime(nextRefreshAt)}`
        : "공식 링크 기준";
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
          title={trimmedQuery ? `"${trimmedQuery}" 관련 공식 혜택을 확인 중입니다` : "공식 링크가 확인된 혜택만 준비 중입니다"}
          description={
            trimmedQuery
              ? "상품 검색어와 맞는 공식 혜택만 함께 보여주며, 검색 결과·커뮤니티 원문·종료 이벤트는 제외합니다."
              : "검색 결과, 커뮤니티 원문, 종료 이벤트는 노출하지 않습니다. 공식 이벤트 페이지가 검증되면 이 영역에 표시됩니다."
          }
        />
      </section>
    );
  }

  return (
    <CommerceCard tone="surface" className="p-3 sm:rounded-[28px] sm:p-4" aria-label="오늘의 실시간 할인뉴스">
      <CommerceSectionHeader
        eyebrow="오늘의 실시간 할인뉴스"
        title={trimmedQuery ? `"${trimmedQuery}" 관련 공식 혜택 ${visibleResultCount}개` : "공식 혜택 페이지로 바로 이동"}
        compact
        trailing={
          <div className="hidden items-center gap-1.5 sm:flex">
            <CommerceBadge tone={refreshError ? "gold" : "neutral"}>
              {updatedAt ? getRelativeTime(updatedAt) : freshnessText}
            </CommerceBadge>
            <CommerceBadge tone={freshnessTone}>
              {freshnessText}
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
          {updatedAt ? getRelativeTime(updatedAt) : freshnessText}
        </CommerceBadge>
        <CommerceBadge tone={freshnessTone}>
          {freshnessText}
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
      <p className="mt-2 text-[11px] font-bold text-slate-500" aria-label="공식 혜택 신선도 안내">
        {freshnessDetail} · 검색 결과와 커뮤니티 원문은 제외하고 공식 혜택 링크만 유지합니다.
      </p>
      <OfficialBenefitIntentGroups groups={intentGroups} onSelectQuery={onSelectQuery} />
      {visibleTargetSections.length ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm" aria-label="운영 추천 혜택 지도">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black text-slate-950">운영 추천 혜택 지도</p>
            <span className="text-[10px] font-black text-slate-400">공식 소스 기준</span>
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleTargetSections.map((item, index) => (
              <button
                key={`${item.label}-${item.query}`}
                type="button"
                onClick={() => onSelectQuery?.(item.query)}
                className={`inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[11px] font-black shadow-sm transition ${
                  index === 0 ? "bg-slate-950 text-white hover:bg-brand-red" : "bg-slate-50 text-slate-700 hover:bg-red-50 hover:text-brand-red"
                }`}
                aria-label={`${item.label} 공식 혜택 ${item.count}개 검색`}
              >
                {item.label}
                <span className={index === 0 ? "text-[10px] text-white/75" : "text-[10px] text-slate-400"}>{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {visibleDeadlineBuckets.length ? (
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-3 py-2" aria-label="마감 전 공식 혜택 우선확인">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-800">
              <CalendarClock size={13} />
              마감 전 우선확인
            </p>
            {effectiveDeadlineSummary.nearestEndDate && hasUrgentNewsBenefits ? (
              <button
                type="button"
                onClick={() => onSelectQuery?.("마감임박")}
                className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-amber-700 shadow-sm transition hover:text-brand-red"
                aria-label="마감임박 공식 혜택 검색"
              >
                {getTimeLeft(effectiveDeadlineSummary.nearestEndDate)}
              </button>
            ) : effectiveDeadlineSummary.nearestEndDate ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-amber-700 shadow-sm">
                가장 빠른 마감 {getTimeLeft(effectiveDeadlineSummary.nearestEndDate)}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleDeadlineBuckets.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={() => {
                  if (bucket.id !== "later") onSelectQuery?.("마감임박");
                }}
                className={`inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[11px] font-black text-slate-700 shadow-sm transition ${bucket.id === "later" ? "cursor-default" : "hover:text-brand-red"}`}
                aria-label={`${bucket.label} 공식 혜택 ${bucket.count}개 보기`}
              >
                {bucket.label}
                <span className="text-[10px] text-amber-600">{bucket.count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {quickRecommendedQueries.length ? (
        <div className="mt-3 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 via-white to-orange-50 p-2.5" aria-label="혜택 목적별 추천 검색어">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black text-brand-red">
              <Search size={13} />
              혜택 바로찾기
            </p>
            <span className="text-[10px] font-black text-slate-400">공식 링크만</span>
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickRecommendedQueries.map((item, index) => (
              <button
                key={item.query}
                type="button"
                onClick={() => onSelectQuery?.(item.query)}
                className={`inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-[11px] font-black shadow-sm transition ${
                  index === 0
                    ? "border-brand-red bg-brand-red text-white hover:bg-red-600"
                    : "border-white bg-white text-slate-700 hover:border-brand-red hover:text-brand-red"
                }`}
                aria-label={`${item.query} 공식 혜택 검색`}
              >
                {item.query}
                {item.count > 0 ? <span className={index === 0 ? "text-[10px] text-white/80" : "text-[10px] text-slate-400"}>{item.count}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {visibleSourceTrustScores.length ? (
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2" aria-label="신뢰 공식출처 우선 노출">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black text-emerald-800">신뢰 공식출처 우선</p>
            <CommerceBadge tone="success" className="bg-white">
              {visibleSourceTrustScores.filter((item) => item.status === "trusted").length}개 신뢰
            </CommerceBadge>
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleSourceTrustScores.map((source) => (
              <span key={`${source.sourceName}-${source.officialHost}`} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700 shadow-sm">
                <ShieldCheck size={12} />
                {source.sourceName}
                <span className="text-[10px] text-emerald-500">{source.trustScore}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {trimmedQuery ? (
        <div className="mt-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-black text-brand-red" aria-label="공식 혜택 검색 결과 요약">
          상품 검색어 기준으로 공식 혜택도 함께 좁혔습니다. 검색 결과·커뮤니티 원문은 제외됩니다.
          {visibleResultCount > deals.length ? ` 먼저 볼 ${deals.length}개를 보여드립니다.` : ""}
        </div>
      ) : null}
      {secondaryRecommendedQueries.length ? (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="공식 혜택 추천 검색어">
          {secondaryRecommendedQueries.map((item) => (
            <button
              key={item.query}
              type="button"
              onClick={() => onSelectQuery?.(item.query)}
              className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 shadow-sm transition hover:border-brand-red hover:text-brand-red"
              aria-label={`${item.query} 공식 혜택 검색`}
            >
              {item.query}
              {item.count > 0 ? <span className="text-[10px] text-slate-400">{item.count}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
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
        {trustedDeals.slice(0, 8).map((deal) => {
          const sourceTrust = getNewsDealSourceTrust(deal, sourceTrustByKey);

          return (
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
                {sourceTrust?.status === "trusted" ? "신뢰 출처" : "공식 링크"}
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
          );
        })}
      </div>
    </CommerceCard>
  );
}

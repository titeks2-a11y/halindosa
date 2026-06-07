"use client";

import Link from "next/link";
import { CalendarClock, ExternalLink, Gift, RefreshCw, ShieldCheck, TicketPercent, Truck } from "lucide-react";
import { getRelativeTime, getTimeLeft } from "@/lib/format";
import { getDealImageSrc } from "@/lib/imageSrc";
import { getHomeFreebieBenefitLabel } from "@/lib/homeFreebies";
import type { NewsDeal } from "@/types/newsDeal";

const benefitToneClassNames: Record<string, string> = {
  freebie: "bg-emerald-50 text-emerald-700",
  coupon: "bg-yellow-50 text-yellow-700",
  freeShipping: "bg-sky-50 text-sky-700",
  event: "bg-orange-50 text-orange-700",
  point: "bg-violet-50 text-violet-700",
  public: "bg-blue-50 text-blue-700",
  culture: "bg-purple-50 text-purple-700",
  card: "bg-rose-50 text-rose-700",
  membership: "bg-indigo-50 text-indigo-700",
  mart: "bg-lime-50 text-lime-700",
  convenienceStore: "bg-teal-50 text-teal-700",
  foodDelivery: "bg-amber-50 text-amber-700"
};

function getBenefitTone(type: NewsDeal["benefitType"]) {
  return benefitToneClassNames[type] ?? "bg-slate-100 text-slate-700";
}

function isEndingSoon(deal: NewsDeal, referenceNow?: number) {
  const endTime = Date.parse(deal.expiresAt || deal.endDate);
  if (!Number.isFinite(endTime)) return false;
  const hoursLeft = (endTime - (referenceNow ?? Date.now())) / 3_600_000;
  return hoursLeft >= 0 && hoursLeft <= 24;
}

interface HomeFreebieHeroProps {
  deals: NewsDeal[];
  totalCount: number;
  updatedAt: string;
  freshnessLabel?: string;
  summary?: {
    zeroCost?: number;
    coupon?: number;
    freeShipping?: number;
    endingToday?: number;
    sourceCount?: number;
    averageQualityScore?: number;
  };
  isRefreshing?: boolean;
  referenceNow?: number;
  onRefresh?: () => void;
  onOpenNewsDeal?: (deal: NewsDeal) => void;
}

export function HomeFreebieHero({
  deals,
  totalCount,
  updatedAt,
  freshnessLabel,
  summary,
  isRefreshing = false,
  referenceNow,
  onRefresh,
  onOpenNewsDeal
}: HomeFreebieHeroProps) {
  const visibleDeals = deals.slice(0, 4);
  const checkedLabel = isRefreshing ? "검증 중" : freshnessLabel || (updatedAt ? getRelativeTime(updatedAt, referenceNow) : "확인 대기");
  const quickStats = [
    { label: "무료/0원", value: summary?.zeroCost ?? visibleDeals.filter((deal) => deal.benefitType === "freebie" || deal.price === 0).length, className: "bg-emerald-50 text-emerald-700" },
    { label: "쿠폰", value: summary?.coupon ?? visibleDeals.filter((deal) => deal.benefitType === "coupon").length, className: "bg-yellow-50 text-yellow-700" },
    { label: "무배", value: summary?.freeShipping ?? visibleDeals.filter((deal) => deal.benefitType === "freeShipping").length, className: "bg-sky-50 text-sky-700" },
    { label: "오늘마감", value: summary?.endingToday ?? visibleDeals.filter((deal) => isEndingSoon(deal, referenceNow)).length, className: "bg-orange-50 text-orange-700" }
  ];

  return (
    <section
      data-home-freebie-hero="true"
      className="rounded-[22px] border border-emerald-100 bg-white p-2.5 shadow-sm sm:rounded-[28px] sm:p-4"
      aria-label="오늘의 무료혜택과 쿠폰"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 sm:text-xs">
            <Gift size={13} />
            무료혜택 먼저 보기
          </p>
          <h2 className="mt-1 text-[17px] font-black leading-5 text-slate-950 sm:text-2xl">
            오늘 챙길 쿠폰·0원딜
          </h2>
          <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-500 sm:text-xs">
            공식 링크 {totalCount.toLocaleString("ko-KR")}개 · {checkedLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/free-benefits"
            className="hidden min-h-9 items-center rounded-full bg-slate-950 px-3 text-xs font-black text-white sm:inline-flex"
          >
            전체
          </Link>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 disabled:cursor-wait disabled:opacity-60"
              aria-label="무료혜택 다시 확인"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5" aria-label="무료혜택 요약">
        {quickStats.map((item) => (
          <div key={item.label} className={`rounded-2xl px-2 py-1.5 text-center ${item.className}`}>
            <p className="text-[10px] font-black">{item.label}</p>
            <p className="text-xs font-black sm:text-sm">{Number(item.value ?? 0).toLocaleString("ko-KR")}</p>
          </div>
        ))}
      </div>

      {visibleDeals.length ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-4" aria-label="공식 무료혜택 카드">
          {visibleDeals.map((deal) => (
            <article key={deal.id} data-home-freebie-card="true" className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-2">
              <div className="flex items-start gap-2 sm:block">
                <span className="relative inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white text-emerald-700 sm:h-20 sm:w-full">
                  {deal.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getDealImageSrc(deal.imageUrl)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <TicketPercent size={18} />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1 sm:mt-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${getBenefitTone(deal.benefitType)}`}>
                      {getHomeFreebieBenefitLabel(deal.benefitType)}
                    </span>
                    <span className="truncate text-[9px] font-black text-slate-400">{deal.sourceName}</span>
                  </div>
                  <h3 className="mt-1 line-clamp-2 min-h-[2.1rem] text-[12px] font-black leading-[17px] text-slate-950 sm:text-[13px]">
                    {deal.title}
                  </h3>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[9px] font-black text-slate-500">
                <span className="inline-flex items-center gap-0.5">
                  <ShieldCheck size={10} />
                  공식
                </span>
                <span className="inline-flex items-center gap-0.5">
                  {deal.benefitType === "freeShipping" ? <Truck size={10} /> : <CalendarClock size={10} />}
                  {getTimeLeft(deal.expiresAt || deal.endDate, referenceNow)}
                </span>
              </div>
              <Link
                href={`/go/news/${encodeURIComponent(deal.id)}?from=home-freebie-hero`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenNewsDeal?.(deal)}
                className="mt-2 inline-flex min-h-8 w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#ff2b2b] to-[#ff6a3d] px-2 text-[11px] font-black text-white"
                aria-label={`${deal.title} 공식 혜택 페이지 새 탭으로 열기`}
              >
                바로 받기
                <ExternalLink size={12} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-2 rounded-2xl border border-dashed border-emerald-100 bg-emerald-50 px-3 py-4 text-center">
          <p className="text-sm font-black text-slate-950">검증 가능한 혜택 수집 중</p>
          <p className="mt-1 text-xs font-bold text-slate-500">공식 신청·쿠폰·이벤트 상세 URL이 확인된 항목만 보여드립니다.</p>
        </div>
      )}
    </section>
  );
}

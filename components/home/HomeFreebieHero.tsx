"use client";

import Link from "next/link";
import { CalendarClock, ExternalLink, Gift, RefreshCw, ShieldCheck, TicketPercent, Truck } from "lucide-react";
import { getRelativeTime, getTimeLeft } from "@/lib/format";
import { getFreeBenefitEventLabel } from "@/lib/freeBenefitEvents";
import { getDealImageSrc } from "@/lib/imageSrc";
import { getHomeFreebieBenefitLabel } from "@/lib/homeFreebies";
import type { FreeBenefitEventCategoryCount } from "@/lib/freeBenefitEvents";
import type { FreeBenefitEvent, FreeBenefitEventType } from "@/types/freeBenefitEvent";
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

const eventToneClassNames: Record<FreeBenefitEventType, string> = {
  all: "bg-slate-100 text-slate-700",
  everyone: "bg-emerald-50 text-emerald-700",
  firstCome: "bg-orange-50 text-orange-700",
  coupon: "bg-yellow-50 text-yellow-700",
  sample: "bg-teal-50 text-teal-700",
  freeTrial: "bg-sky-50 text-sky-700",
  gifticon: "bg-pink-50 text-pink-700",
  pointCashback: "bg-violet-50 text-violet-700",
  checkIn: "bg-indigo-50 text-indigo-700",
  roulette: "bg-fuchsia-50 text-fuchsia-700",
  signup: "bg-rose-50 text-rose-700",
  publicFree: "bg-blue-50 text-blue-700",
  experiencePanel: "bg-purple-50 text-purple-700",
  freeShipping: "bg-cyan-50 text-cyan-700",
  brandEvent: "bg-red-50 text-dossa-red"
};

const heroQuickFilters: Array<{
  label: string;
  href: string;
  eventType?: FreeBenefitEventType;
  className: string;
}> = [
  { label: "전원증정", href: "/free-benefits?eventType=everyone", eventType: "everyone", className: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  { label: "선착순", href: "/free-benefits?eventType=firstCome&firstComeOnly=true", eventType: "firstCome", className: "border-orange-100 bg-orange-50 text-orange-700" },
  { label: "쿠폰", href: "/free-benefits?eventType=coupon", eventType: "coupon", className: "border-yellow-100 bg-yellow-50 text-yellow-700" },
  { label: "무료체험", href: "/free-benefits?eventType=freeTrial", eventType: "freeTrial", className: "border-sky-100 bg-sky-50 text-sky-700" },
  { label: "샘플", href: "/free-benefits?eventType=sample", eventType: "sample", className: "border-teal-100 bg-teal-50 text-teal-700" },
  { label: "기프티콘", href: "/free-benefits?eventType=gifticon", eventType: "gifticon", className: "border-pink-100 bg-pink-50 text-pink-700" },
  { label: "포인트", href: "/free-benefits?eventType=pointCashback", eventType: "pointCashback", className: "border-violet-100 bg-violet-50 text-violet-700" },
  { label: "출석체크", href: "/free-benefits?eventType=checkIn", eventType: "checkIn", className: "border-indigo-100 bg-indigo-50 text-indigo-700" },
  { label: "룰렛", href: "/free-benefits?eventType=roulette", eventType: "roulette", className: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700" },
  { label: "신규가입", href: "/free-benefits?eventType=signup", eventType: "signup", className: "border-rose-100 bg-rose-50 text-rose-700" },
  { label: "공공무료", href: "/free-benefits?eventType=publicFree", eventType: "publicFree", className: "border-blue-100 bg-blue-50 text-blue-700" },
  { label: "체험단", href: "/free-benefits?eventType=experiencePanel", eventType: "experiencePanel", className: "border-purple-100 bg-purple-50 text-purple-700" },
  { label: "마감임박", href: "/free-benefits?endingSoon=true", className: "border-amber-100 bg-amber-50 text-amber-800" }
];

function isEndingSoon(deal: NewsDeal, referenceNow?: number) {
  const endTime = Date.parse(deal.expiresAt || deal.endDate);
  if (!Number.isFinite(endTime)) return false;
  const hoursLeft = (endTime - (referenceNow ?? Date.now())) / 3_600_000;
  return hoursLeft >= 0 && hoursLeft <= 24;
}

function isEventEndingSoon(event: FreeBenefitEvent, referenceNow?: number) {
  const endTime = Date.parse(event.endAt);
  if (!Number.isFinite(endTime)) return false;
  const hoursLeft = (endTime - (referenceNow ?? Date.now())) / 3_600_000;
  return hoursLeft >= 0 && hoursLeft <= 24;
}

function getEventConditionBadges(event: FreeBenefitEvent) {
  return [
    event.isEveryoneReward ? "전원증정" : "",
    event.isFirstComeFirstServed ? "선착순" : "",
    event.requiresLogin ? "로그인 필요" : "비회원 확인",
    event.requiresPurchase ? "구매 필요" : "구매조건 낮음",
    event.validationStatus === "passed" ? "검증 완료" : ""
  ].filter(Boolean);
}

interface HomeFreebieHeroProps {
  deals: NewsDeal[];
  events?: FreeBenefitEvent[];
  eventCategoryCounts?: FreeBenefitEventCategoryCount[];
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
  events = [],
  eventCategoryCounts = [],
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
  const visibleEvents = events.slice(0, 4);
  const checkedLabel = isRefreshing ? "검증 중" : freshnessLabel || (updatedAt ? getRelativeTime(updatedAt, referenceNow) : "확인 대기");
  const quickStats = visibleEvents.length
    ? [
        { label: "전원", value: events.filter((event) => event.isEveryoneReward).length, className: "bg-emerald-50 text-emerald-700" },
        { label: "선착순", value: events.filter((event) => event.isFirstComeFirstServed).length, className: "bg-orange-50 text-orange-700" },
        { label: "쿠폰", value: events.filter((event) => event.benefitType === "coupon").length, className: "bg-yellow-50 text-yellow-700" },
        { label: "오늘마감", value: events.filter((event) => isEventEndingSoon(event, referenceNow)).length, className: "bg-rose-50 text-rose-700" }
      ]
    : [
        { label: "무료/0원", value: summary?.zeroCost ?? visibleDeals.filter((deal) => deal.benefitType === "freebie" || deal.price === 0).length, className: "bg-emerald-50 text-emerald-700" },
        { label: "쿠폰", value: summary?.coupon ?? visibleDeals.filter((deal) => deal.benefitType === "coupon").length, className: "bg-yellow-50 text-yellow-700" },
        { label: "무배", value: summary?.freeShipping ?? visibleDeals.filter((deal) => deal.benefitType === "freeShipping").length, className: "bg-sky-50 text-sky-700" },
        { label: "오늘마감", value: summary?.endingToday ?? visibleDeals.filter((deal) => isEndingSoon(deal, referenceNow)).length, className: "bg-orange-50 text-orange-700" }
      ];
  const getHeroQuickFilterCount = (filter: (typeof heroQuickFilters)[number]) => {
    if (!visibleEvents.length) return null;
    if (filter.label === "마감임박") return events.filter((event) => isEventEndingSoon(event, referenceNow)).length;
    if (!filter.eventType) return null;
    return eventCategoryCounts.find((category) => category.id === filter.eventType)?.count ?? events.filter((event) => event.benefitType === filter.eventType).length;
  };

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

      <nav
        data-home-free-benefit-quick-filters="true"
        className="-mx-2 mt-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="무료혜택 빠른 필터"
      >
        <div className="flex snap-x gap-1.5 pb-1">
          {heroQuickFilters.map((filter) => {
            const count = getHeroQuickFilterCount(filter);
            const isEmptyFilter = count === 0;
            const chipClassName = `inline-flex min-h-8 shrink-0 snap-start items-center gap-1 rounded-full border px-2.5 text-[10px] font-black sm:text-[11px] ${
              isEmptyFilter ? "border-slate-100 bg-slate-50 text-slate-300" : filter.className
            }`;
            const chipContent = (
              <>
                {filter.label}
                {count !== null ? (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${isEmptyFilter ? "bg-white text-slate-300" : "bg-white/70 text-slate-600"}`}>
                    {count.toLocaleString("ko-KR")}
                  </span>
                ) : null}
              </>
            );

            if (isEmptyFilter) {
              return (
                <span
                  key={filter.label}
                  className={chipClassName}
                  aria-disabled="true"
                  aria-label={`${filter.label} 무료혜택은 현재 검증된 항목이 없습니다`}
                  title="현재 검증된 혜택이 없습니다"
                >
                  {chipContent}
                </span>
              );
            }

            return (
              <Link
                key={filter.label}
                href={filter.href}
                className={chipClassName}
                aria-label={`${filter.label} 무료혜택 바로 보기`}
              >
                {chipContent}
              </Link>
            );
          })}
        </div>
      </nav>

      {visibleEvents.length ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-4" aria-label="공식 무료혜택 이벤트 카드">
          {visibleEvents.map((event) => (
            <article key={event.id} data-home-free-benefit-event-card="true" className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-2">
              <div className="flex items-start gap-2 sm:block">
                <span className="relative inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white text-emerald-700 sm:h-20 sm:w-full">
                  {event.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getDealImageSrc(event.imageUrl)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Gift size={18} />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1 sm:mt-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${eventToneClassNames[event.benefitType]}`}>
                      {getFreeBenefitEventLabel(event.benefitType)}
                    </span>
                    <span className="truncate text-[9px] font-black text-slate-400">{event.brandName}</span>
                  </div>
                  <h3 className="mt-1 line-clamp-2 min-h-[2.1rem] text-[12px] font-black leading-[17px] text-slate-950 sm:text-[13px]">
                    {event.title}
                  </h3>
                </div>
              </div>
              <p className="mt-1 line-clamp-1 text-[10px] font-black text-emerald-700">{event.rewardText}</p>
              <p className="mt-0.5 line-clamp-1 text-[9px] font-bold text-slate-500">{event.participationCondition}</p>
              <p className="mt-0.5 line-clamp-1 text-[9px] font-bold text-slate-500">{event.rankingReason}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px] font-black text-slate-500">
                <span className="inline-flex items-center gap-0.5">
                  <ShieldCheck size={10} />
                  공식
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <CalendarClock size={10} />
                  {event.urgencyLabel || getTimeLeft(event.endAt, referenceNow)}
                </span>
                {event.trustBadges.slice(1, 3).map((badge) => (
                  <span key={badge} className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-500">
                    {badge}
                  </span>
                ))}
                {getEventConditionBadges(event)
                  .slice(0, 3)
                  .map((badge) => (
                    <span key={badge} className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-500">
                      {badge}
                    </span>
                  ))}
              </div>
              <Link
                href={`/go/news/${encodeURIComponent(event.id)}?from=home-free-benefit-event`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-8 w-full items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-[#ff2b2b] to-[#ff6a3d] px-2 text-[11px] font-black text-white"
                aria-label={`${event.title} 공식 혜택 페이지 새 탭으로 열기`}
              >
                {event.claimCtaLabel || "무료 혜택 받기"}
                <ExternalLink size={12} />
              </Link>
            </article>
          ))}
        </div>
      ) : visibleDeals.length ? (
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

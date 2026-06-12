"use client";

import Link from "next/link";
import { CalendarClock, ExternalLink, Gift, RefreshCw, ShieldCheck, TicketPercent, Truck } from "lucide-react";
import { getRelativeTime, getTimeLeft } from "@/lib/format";
import { getFreeBenefitEventLabel } from "@/lib/freeBenefitEvents";
import { getDealImageSrc } from "@/lib/imageSrc";
import { getHomeFreebieBenefitLabel } from "@/lib/homeFreebies";
import type { FreeBenefitDeadlineCategoryCount, FreeBenefitEventCategoryCount, FreeBenefitEventCollectionLane, FreeBenefitEventSourceSummary } from "@/lib/freeBenefitEvents";
import type { FreeBenefitRuntimeReadinessSummary, RequiredFreeBenefitCategoryCoverage } from "@/lib/homeApi";
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
  { label: "즉시수령", href: "/free-benefits?claimAccess=instant", className: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  { label: "선착순", href: "/free-benefits?eventType=firstCome&firstComeOnly=true", eventType: "firstCome", className: "border-orange-100 bg-orange-50 text-orange-700" },
  { label: "쿠폰", href: "/free-benefits?eventType=coupon", eventType: "coupon", className: "border-yellow-100 bg-yellow-50 text-yellow-700" },
  { label: "무료체험", href: "/free-benefits?eventType=freeTrial", eventType: "freeTrial", className: "border-sky-100 bg-sky-50 text-sky-700" },
  { label: "샘플", href: "/free-benefits?eventType=sample", eventType: "sample", className: "border-teal-100 bg-teal-50 text-teal-700" },
  { label: "기프티콘", href: "/free-benefits?eventType=gifticon", eventType: "gifticon", className: "border-pink-100 bg-pink-50 text-pink-700" },
  { label: "포인트", href: "/free-benefits?eventType=pointCashback", eventType: "pointCashback", className: "border-violet-100 bg-violet-50 text-violet-700" },
  { label: "출석체크", href: "/free-benefits?eventType=checkIn", eventType: "checkIn", className: "border-indigo-100 bg-indigo-50 text-indigo-700" },
  { label: "룰렛", href: "/free-benefits?eventType=roulette", eventType: "roulette", className: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700" },
  { label: "신규가입", href: "/free-benefits?eventType=signup", eventType: "signup", className: "border-rose-100 bg-rose-50 text-rose-700" },
  { label: "무료배송", href: "/free-benefits?eventType=freeShipping", eventType: "freeShipping", className: "border-cyan-100 bg-cyan-50 text-cyan-700" },
  { label: "브랜드", href: "/free-benefits?eventType=brandEvent", eventType: "brandEvent", className: "border-red-100 bg-red-50 text-dossa-red" },
  { label: "체험단", href: "/free-benefits?eventType=experiencePanel", eventType: "experiencePanel", className: "border-purple-100 bg-purple-50 text-purple-700" },
  { label: "오늘마감", href: "/free-benefits?deadline=today", className: "border-red-100 bg-red-50 text-red-700" },
  { label: "이번주마감", href: "/free-benefits?deadline=week", className: "border-orange-100 bg-orange-50 text-orange-700" },
  { label: "마감임박", href: "/free-benefits?deadline=soon", className: "border-amber-100 bg-amber-50 text-amber-800" }
];

const claimLaneConfigs: Array<{
  label: string;
  copy: string;
  href: string;
  className: string;
  matches: (event: FreeBenefitEvent) => boolean;
}> = [
  {
    label: "구매 없이",
    copy: "조건 쉬운 무료혜택",
    href: "/free-benefits?sort=noPurchase",
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    matches: (event) => !event.requiresPurchase
  },
  {
    label: "쿠폰 즉시",
    copy: "받아서 바로 쓰는 혜택",
    href: "/free-benefits?eventType=coupon",
    className: "border-yellow-100 bg-yellow-50 text-yellow-700",
    matches: (event) => event.benefitType === "coupon" || event.benefitType === "signup"
  },
  {
    label: "샘플·체험",
    copy: "무료 체험과 증정",
    href: "/free-benefits?eventType=sample",
    className: "border-teal-100 bg-teal-50 text-teal-700",
    matches: (event) => event.benefitType === "sample" || event.benefitType === "freeTrial" || event.benefitType === "experiencePanel"
  }
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
  return hoursLeft >= 0 && hoursLeft <= 14 * 24;
}

function isEventEndingToday(event: FreeBenefitEvent, referenceNow?: number) {
  const endTime = Date.parse(event.endAt);
  if (!Number.isFinite(endTime)) return false;
  const hoursLeft = (endTime - (referenceNow ?? Date.now())) / 3_600_000;
  return hoursLeft >= 0 && hoursLeft <= 24;
}

function isEventEndingThisWeek(event: FreeBenefitEvent, referenceNow?: number) {
  const endTime = Date.parse(event.endAt);
  if (!Number.isFinite(endTime)) return false;
  const hoursLeft = (endTime - (referenceNow ?? Date.now())) / 3_600_000;
  return hoursLeft >= 0 && hoursLeft <= 7 * 24;
}

function getEventConditionBadges(event: FreeBenefitEvent) {
  return [
    event.isEveryoneReward ? "전원증정" : "",
    event.isFirstComeFirstServed ? "선착순" : "",
    event.claimAccessLabel || "",
    event.requiresLogin ? "로그인 필요" : "비회원 확인",
    event.requiresPurchase ? "구매 필요" : "구매조건 낮음",
    event.validationStatus === "passed" ? "검증 완료" : ""
  ].filter(Boolean);
}

function getClaimAccessTone(event: FreeBenefitEvent) {
  if (event.claimAccessLevel === "instant") return "bg-emerald-50 text-emerald-700";
  if (event.claimAccessLevel === "login_required") return "bg-indigo-50 text-indigo-700";
  if (event.claimAccessLevel === "purchase_required") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function normalizeEventBrandKey(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, "").replace(/코리아|공식|이벤트|혜택/g, "");
  if (/royalcanin|로얄캐닌/.test(normalized)) return "royalcanin";
  if (/oliveyoung|올리브영/.test(normalized)) return "oliveyoung";
  if (/starbucks|스타벅스/.test(normalized)) return "starbucks";
  if (/yogiyo|요기요/.test(normalized)) return "yogiyo";
  if (/baemin|배민|배달의민족/.test(normalized)) return "baemin";
  if (/musinsa|무신사/.test(normalized)) return "musinsa";
  if (/daiso|다이소/.test(normalized)) return "daiso";
  if (/cjthemarket|cj더마켓/.test(normalized)) return "cjthemarket";
  return normalized || "unknown";
}

function selectDiverseQuickClaimEvents(events: FreeBenefitEvent[], limit = 6) {
  const selected: FreeBenefitEvent[] = [];
  const brandCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const sorted = [...events].sort(
    (a, b) =>
      Number(a.requiresPurchase) - Number(b.requiresPurchase) ||
      Number(a.requiresLogin) - Number(b.requiresLogin) ||
      Number(b.isEveryoneReward) - Number(a.isEveryoneReward) ||
      Number(b.isFirstComeFirstServed) - Number(a.isFirstComeFirstServed) ||
      b.priorityScore - a.priorityScore
  );

  for (const event of sorted) {
    const brandKey = normalizeEventBrandKey(event.brandName || event.sourceName || event.sourceDomain);
    const brandRepeat = brandCounts.get(brandKey) ?? 0;
    const typeRepeat = typeCounts.get(event.benefitType) ?? 0;
    if (selected.length < 4 && (brandRepeat > 0 || typeRepeat >= 2)) continue;
    selected.push(event);
    brandCounts.set(brandKey, brandRepeat + 1);
    typeCounts.set(event.benefitType, typeRepeat + 1);
    if (selected.length >= limit) return selected;
  }

  for (const event of sorted) {
    if (selected.some((item) => item.id === event.id)) continue;
    selected.push(event);
    if (selected.length >= limit) break;
  }

  return selected;
}

interface HomeFreebieHeroProps {
  deals: NewsDeal[];
  events?: FreeBenefitEvent[];
  eventCategoryCounts?: FreeBenefitEventCategoryCount[];
  deadlineCategoryCounts?: FreeBenefitDeadlineCategoryCount[];
  collectionLanes?: FreeBenefitEventCollectionLane[];
  runtimeReadiness?: FreeBenefitRuntimeReadinessSummary;
  requiredCategoryCoverage?: RequiredFreeBenefitCategoryCoverage | null;
  eventSourceSummary?: FreeBenefitEventSourceSummary;
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
  deadlineCategoryCounts = [],
  collectionLanes = [],
  runtimeReadiness,
  requiredCategoryCoverage,
  eventSourceSummary,
  totalCount,
  updatedAt,
  freshnessLabel,
  summary,
  isRefreshing = false,
  referenceNow,
  onRefresh,
  onOpenNewsDeal
}: HomeFreebieHeroProps) {
  const visibleDeals = deals.slice(0, 8);
  const visibleEvents = events.slice(0, 16);
  const officialTotalCount = Math.max(totalCount, events.length || 0);
  const sourceDomainCount = eventSourceSummary?.sourceDomainCount ?? new Set(events.map((event) => event.sourceDomain).filter(Boolean)).size;
  const priorityBrands = Array.from(
    new Set(
      visibleEvents
        .map((event) => event.brandName)
        .filter(Boolean)
        .slice(0, 5)
    )
  );
  const checkedLabel = isRefreshing ? "검증 중" : freshnessLabel || (updatedAt ? getRelativeTime(updatedAt, referenceNow) : "확인 대기");
  const lowFrictionEventCount = eventSourceSummary?.noPurchaseCount ?? events.filter((event) => !event.requiresPurchase && event.status === "active").length;
  const instantClaimEventCount =
    runtimeReadiness?.instantClaimCount ??
    runtimeReadiness?.claimAccessLevelCounts?.instant ??
    events.filter((event) => event.claimAccessLevel === "instant" && event.isInstantClaim).length;
  const verifiedOfficialEventCount = eventSourceSummary?.officialSourceCount ?? events.filter((event) => event.validationStatus === "passed" && event.finalUrl).length;
  const everyoneRewardCount = eventSourceSummary?.everyoneRewardCount ?? events.filter((event) => event.isEveryoneReward).length;
  const firstComeCount = eventSourceSummary?.firstComeCount ?? events.filter((event) => event.isFirstComeFirstServed).length;
  const getDeadlineCategoryCount = (id: FreeBenefitDeadlineCategoryCount["id"]) => deadlineCategoryCounts.find((category) => category.id === id)?.count;
  const endingTodayEventCount = getDeadlineCategoryCount("today") ?? events.filter((event) => isEventEndingToday(event, referenceNow)).length;
  const endingThisWeekEventCount = getDeadlineCategoryCount("week") ?? events.filter((event) => isEventEndingThisWeek(event, referenceNow)).length;
  const endingSoonEventCount = getDeadlineCategoryCount("soon") ?? eventSourceSummary?.endingSoonCount ?? events.filter((event) => isEventEndingSoon(event, referenceNow)).length;
  const topSourceDomains = eventSourceSummary?.topSourceDomains?.slice(0, 5) ?? [];
  const quickClaimEvents = selectDiverseQuickClaimEvents(
    events.filter((event) => event.status === "active" && event.validationStatus === "passed" && event.finalUrl),
    8
  ).slice(0, 8);
  const benefitPromiseCards = [
    {
      label: "구매 없이",
      value: lowFrictionEventCount,
      copy: "먼저 받을 혜택",
      className: "border-emerald-100 bg-emerald-50 text-emerald-700"
    },
    {
      label: "즉시수령",
      value: instantClaimEventCount,
      copy: "바로 받을 후보",
      className: "border-sky-100 bg-sky-50 text-sky-700"
    },
    {
      label: "오늘 우선",
      value: endingSoonEventCount,
      copy: "마감 임박",
      className: "border-orange-100 bg-orange-50 text-orange-700"
    },
    {
      label: "공식 검증",
      value: verifiedOfficialEventCount,
      copy: "안전한 링크",
      className: "border-blue-100 bg-blue-50 text-blue-700"
    }
  ];
  const getConditionLabel = (event: FreeBenefitEvent) => {
    if (event.freeConditionScore >= 90) return "조건 매우 쉬움";
    if (event.freeConditionScore >= 75) return "조건 쉬움";
    if (!event.requiresPurchase) return "구매 없이 확인";
    return "조건 확인";
  };
  const getPreClaimChecklist = (event: FreeBenefitEvent) =>
    [
      event.validationStatus === "passed" && event.finalUrl ? "공식 링크 확인" : "",
      event.requiresLogin ? "로그인 필요" : "비회원 확인",
      event.requiresPurchase ? "구매 조건 확인" : "구매 없이 확인",
      event.isFirstComeFirstServed ? "선착순" : "",
      event.urgencyLabel?.includes("마감") ? event.urgencyLabel : ""
    ]
      .filter(Boolean)
      .slice(0, 4);
  const claimLanes = claimLaneConfigs.map((lane) => {
    const matchedEvents = events.filter((event) => event.status === "active" && event.validationStatus === "passed" && lane.matches(event));
    const firstEvent = matchedEvents[0];
    return {
      ...lane,
      count: matchedEvents.length,
      brandName: firstEvent?.brandName || "공식 혜택"
    };
  });
  const discoveryLanes = [
    {
      label: "전원증정",
      href: "/free-benefits?eventType=everyone",
      className: "border-emerald-100 bg-emerald-50 text-emerald-700",
      matches: (event: FreeBenefitEvent) => event.isEveryoneReward || event.benefitType === "everyone"
    },
    {
      label: "쿠폰",
      href: "/free-benefits?eventType=coupon",
      className: "border-yellow-100 bg-yellow-50 text-yellow-700",
      matches: (event: FreeBenefitEvent) => event.benefitType === "coupon" || event.benefitType === "signup"
    },
    {
      label: "샘플·체험",
      href: "/free-benefits?eventType=sample",
      className: "border-teal-100 bg-teal-50 text-teal-700",
      matches: (event: FreeBenefitEvent) => event.benefitType === "sample" || event.benefitType === "freeTrial" || event.benefitType === "experiencePanel"
    },
    {
      label: "포인트",
      href: "/free-benefits?eventType=pointCashback",
      className: "border-violet-100 bg-violet-50 text-violet-700",
      matches: (event: FreeBenefitEvent) => event.benefitType === "pointCashback" || event.benefitType === "checkIn" || event.benefitType === "roulette"
    }
  ]
    .map((lane) => {
      const matchedEvents = events.filter((event) => event.status === "active" && event.validationStatus === "passed" && lane.matches(event));
      const firstEvent = matchedEvents[0];
      return {
        ...lane,
        count: matchedEvents.length,
        brandName: firstEvent?.brandName || "공식 혜택",
        ctaLabel: firstEvent?.claimCtaLabel || "바로 확인"
      };
    })
    .filter((lane) => lane.count > 0);
  const deadlineQuickStat =
    endingTodayEventCount > 0
      ? { label: "오늘마감", value: endingTodayEventCount, className: "bg-rose-50 text-rose-700" }
      : endingThisWeekEventCount > 0
        ? { label: "이번주마감", value: endingThisWeekEventCount, className: "bg-orange-50 text-orange-700" }
        : { label: "마감임박", value: endingSoonEventCount, className: "bg-orange-50 text-orange-700" };
  const quickStats = visibleEvents.length
    ? [
        { label: "전원", value: everyoneRewardCount, className: "bg-emerald-50 text-emerald-700" },
        { label: "선착순", value: firstComeCount, className: "bg-orange-50 text-orange-700" },
        { label: "쿠폰", value: events.filter((event) => event.benefitType === "coupon").length, className: "bg-yellow-50 text-yellow-700" },
        deadlineQuickStat
      ]
    : [
        { label: "무료/0원", value: summary?.zeroCost ?? visibleDeals.filter((deal) => deal.benefitType === "freebie" || deal.price === 0).length, className: "bg-emerald-50 text-emerald-700" },
        { label: "쿠폰", value: summary?.coupon ?? visibleDeals.filter((deal) => deal.benefitType === "coupon").length, className: "bg-yellow-50 text-yellow-700" },
        { label: "무배", value: summary?.freeShipping ?? visibleDeals.filter((deal) => deal.benefitType === "freeShipping").length, className: "bg-sky-50 text-sky-700" },
        { label: "마감임박", value: summary?.endingToday ?? visibleDeals.filter((deal) => isEndingSoon(deal, referenceNow)).length, className: "bg-orange-50 text-orange-700" }
      ];
  const visibleCollectionLanes = collectionLanes
    .filter((lane) => lane.count > 0)
    .sort((a, b) => {
      const statusRank = { healthy: 0, thin: 1, empty: 2 } as const;
      return statusRank[a.status] - statusRank[b.status] || b.count - a.count || a.label.localeCompare(b.label);
    })
    .slice(0, 5);
  const deadlineFilterChips = (
    deadlineCategoryCounts.length
      ? deadlineCategoryCounts
      : [
          { id: "today" as const, label: "오늘마감", count: endingTodayEventCount, href: "/free-benefits?deadline=today", maxHours: 24 },
          { id: "week" as const, label: "이번주마감", count: endingThisWeekEventCount, href: "/free-benefits?deadline=week", maxHours: 7 * 24 },
          { id: "soon" as const, label: "마감임박", count: endingSoonEventCount, href: "/free-benefits?deadline=soon", maxHours: 3 * 24 }
        ]
  ).map((category) => ({
    ...category,
    className:
      category.id === "today"
        ? "border-rose-100 bg-rose-50 text-rose-700"
        : category.id === "week"
          ? "border-orange-100 bg-orange-50 text-orange-700"
          : "border-amber-100 bg-amber-50 text-amber-800"
  }));
  const getHeroQuickFilterCount = (filter: (typeof heroQuickFilters)[number]) => {
    if (!visibleEvents.length) return null;
    if (filter.label === "오늘마감") return endingTodayEventCount;
    if (filter.label === "이번주마감") return endingThisWeekEventCount;
    if (filter.label === "마감임박") return endingSoonEventCount;
    if (!filter.eventType) return null;
    return eventCategoryCounts.find((category) => category.id === filter.eventType)?.count ?? events.filter((event) => event.benefitType === filter.eventType).length;
  };
  const requiredCategoryChips = (requiredCategoryCoverage?.categories ?? [])
    .filter((category) => category.count > 0 || !category.ok)
    .slice(0, 10);
  const fallbackRequiredCategoryChips = requiredCategoryChips.length
    ? []
    : heroQuickFilters
        .map((filter) => {
          const count = getHeroQuickFilterCount(filter);
          return {
            id: filter.eventType ?? filter.label,
            label: filter.label,
            count: Number(count ?? 0),
            ok: true,
            href: filter.href
          };
        })
        .filter((category) => category.count > 0)
        .slice(0, 10);
  const visibleRequiredCategoryChips = requiredCategoryChips.length ? requiredCategoryChips : fallbackRequiredCategoryChips;
  const categoryRepresentativeBenefits = (requiredCategoryCoverage?.categoryCandidateGroups ?? [])
    .flatMap((group) =>
      group.candidates.slice(0, 1).map((candidate) => ({
        ...candidate,
        groupId: group.id,
        groupLabel: group.label,
        groupHref: group.href,
        groupCount: group.count
      }))
    )
    .filter((candidate) => candidate.finalUrl?.startsWith("https://") && candidate.title && candidate.sourceName)
    .slice(0, 10);

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
            무료혜택 메인
          </p>
          <h2 className="mt-1 text-[17px] font-black leading-5 text-slate-950 sm:text-2xl">
            오늘 받을 무료 혜택
          </h2>
          <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-500 sm:text-xs">
            공식 혜택 {officialTotalCount.toLocaleString("ko-KR")}개 · 쿠폰·샘플·무료체험·포인트 · 가입 부담 낮음 · 공식 출처 {sourceDomainCount.toLocaleString("ko-KR")}곳 · {checkedLabel}
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

      {deadlineFilterChips.length ? (
        <div
          data-home-free-benefit-deadline-categories="true"
          className="mt-2 grid grid-cols-3 gap-1.5"
          aria-label="마감 기준 무료혜택 바로가기"
        >
          {deadlineFilterChips.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className={`rounded-2xl border px-2 py-1.5 text-center transition hover:bg-white ${category.className}`}
              aria-label={`${category.label} 무료혜택 ${category.count.toLocaleString("ko-KR")}개 보기`}
            >
              <span className="block text-[10px] font-black">{category.label}</span>
              <span className="mt-0.5 block text-xs font-black sm:text-sm">{category.count.toLocaleString("ko-KR")}개</span>
            </Link>
          ))}
        </div>
      ) : null}

      {visibleCollectionLanes.length ? (
        <div
          data-home-free-benefit-collection-lanes="true"
          className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="실시간 무료혜택 수집축 상태"
        >
          {visibleCollectionLanes.map((lane) => (
            <span
              key={lane.id}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${
                lane.status === "healthy"
                  ? "border-blue-100 bg-blue-50 text-blue-700"
                  : lane.status === "thin"
                    ? "border-amber-100 bg-amber-50 text-amber-800"
                    : "border-slate-100 bg-slate-50 text-slate-500"
              }`}
              title={`${lane.action} · ${lane.envKey}`}
            >
              {lane.label} {lane.count.toLocaleString("ko-KR")}
            </span>
          ))}
        </div>
      ) : null}

      {visibleRequiredCategoryChips.length ? (
        <div
          data-home-required-free-benefit-categories="true"
          className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="필수 무료혜택 카테고리"
        >
          {visibleRequiredCategoryChips.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black transition ${
                category.ok
                  ? "border-slate-100 bg-white text-slate-700 shadow-sm hover:bg-sky-50"
                  : "border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
              }`}
              aria-label={`${category.label} 무료혜택 ${category.count.toLocaleString("ko-KR")}개 보기`}
            >
              {category.label} {category.count.toLocaleString("ko-KR")}
            </Link>
          ))}
        </div>
      ) : null}

      {categoryRepresentativeBenefits.length ? (
        <div
          data-home-free-benefit-category-representatives="true"
          className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 p-2"
          aria-label="카테고리별 대표 무료혜택"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black text-slate-950">카테고리별 대표 혜택</p>
            <Link href="/free-benefits" className="shrink-0 text-[10px] font-black text-dossa-red">
              전체 보기
            </Link>
          </div>
          <div className="mt-1.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryRepresentativeBenefits.map((candidate) => (
              <Link
                key={`${candidate.groupId}-${candidate.id}`}
                href={`/go/news/${encodeURIComponent(candidate.id)}?from=home-free-benefit-category-representative`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-16 w-[10.5rem] shrink-0 rounded-2xl border border-white bg-white p-2 shadow-sm transition hover:border-red-100"
                aria-label={`${candidate.groupLabel} 대표 혜택 ${candidate.title} 공식 페이지 열기, 받기 쉬움 ${candidate.claimEaseScore}점`}
              >
                <div className="flex min-w-0 items-center justify-between gap-1">
                  <span className="truncate rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-black text-dossa-red">
                    {candidate.groupLabel}
                  </span>
                  <span className="shrink-0 text-[9px] font-black text-slate-400">{candidate.groupCount.toLocaleString("ko-KR")}개</span>
                </div>
                <p className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] font-black leading-4 text-slate-950">{candidate.title}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                    쉬움 {candidate.claimEaseScore}
                  </span>
                  <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-black text-orange-700">
                    {candidate.claimUrgencyLabel}
                  </span>
                </div>
                <p className="mt-1 truncate text-[9px] font-bold text-slate-500">{candidate.sourceName || candidate.host}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {quickClaimEvents.length ? (
        <div
          data-home-free-benefit-instant-board="true"
          className="mt-2 grid grid-cols-2 gap-1.5"
          aria-label="오늘 바로 받을 무료혜택"
        >
          <div className="col-span-2 flex items-center justify-between rounded-2xl bg-slate-950 px-2.5 py-1.5 text-white">
            <span className="text-[10px] font-black">오늘 바로 받을 무료혜택</span>
            <span className="text-[9px] font-bold text-white/70">검색·종료 링크 제외</span>
          </div>
          {quickClaimEvents.slice(0, 4).map((event, index) => (
            <Link
              key={event.id}
              href={`/go/news/${encodeURIComponent(event.id)}?from=home-free-benefit-instant`}
              target="_blank"
              rel="noopener noreferrer"
              className={`min-w-0 rounded-2xl border p-2 shadow-sm transition hover:border-red-100 ${
                index === 0
                  ? "border-red-100 bg-gradient-to-br from-red-50 via-white to-emerald-50"
                  : "border-slate-100 bg-slate-50"
              }`}
              aria-label={`${event.title} ${event.claimCtaLabel || "무료 혜택 받기"} 새 탭으로 열기`}
            >
              <div className="flex min-w-0 items-center justify-between gap-1">
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${eventToneClassNames[event.benefitType]}`}>
                  {getFreeBenefitEventLabel(event.benefitType)}
                </span>
                <span className="truncate text-[9px] font-black text-slate-400">{event.urgencyLabel || getTimeLeft(event.endAt, referenceNow)}</span>
              </div>
              <p className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] font-black leading-4 text-slate-950">{event.title}</p>
              <div className="mt-1 flex min-w-0 items-center justify-between gap-1">
                <span className="truncate text-[9px] font-black text-slate-500">{event.brandName}</span>
                <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                  {getConditionLabel(event)}
                </span>
              </div>
              <div className="mt-1 flex min-w-0 gap-1 overflow-hidden" data-home-free-benefit-preclaim="true">
                {getPreClaimChecklist(event)
                  .slice(0, 2)
                  .map((item) => (
                    <span key={item} className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black text-slate-500">
                      {item}
                    </span>
                  ))}
              </div>
              <p className="mt-1 truncate text-[10px] font-black text-dossa-red">{event.claimCtaLabel || "무료 혜택 받기"}</p>
              <p className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-black ${getClaimAccessTone(event)}`}>{event.claimAccessLabel}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {visibleEvents.length ? (
        <div
          data-home-free-benefit-claim-lanes="true"
          className="mt-2 grid grid-cols-3 gap-1.5"
          aria-label="오늘 바로 챙길 무료혜택 유형"
        >
          {claimLanes.map((lane) => (
            <Link
              key={lane.label}
              href={lane.href}
              className={`min-w-0 rounded-2xl border px-2 py-1.5 ${lane.className}`}
              aria-label={`${lane.label} 무료혜택 ${lane.count.toLocaleString("ko-KR")}개 바로 보기`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="truncate text-[10px] font-black">{lane.label}</span>
                <span className="text-xs font-black">{lane.count.toLocaleString("ko-KR")}</span>
              </div>
              <p className="mt-0.5 truncate text-[9px] font-bold opacity-80">{lane.copy}</p>
              <p className="mt-0.5 truncate text-[9px] font-black opacity-90">{lane.brandName}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {priorityBrands.length ? (
        <div
          data-home-free-benefit-priority-strip="true"
          className="mt-2 flex min-h-9 items-center gap-1 overflow-x-auto rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-orange-50 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="오늘 먼저 볼 무료혜택 브랜드"
        >
          <span className="shrink-0 text-[10px] font-black text-emerald-700">오늘 우선</span>
          {priorityBrands.map((brand) => (
            <span key={brand} className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-700 shadow-sm">
              {brand}
            </span>
          ))}
        </div>
      ) : null}

      {discoveryLanes.length ? (
        <div
          data-home-free-benefit-discovery-lanes="true"
          className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4"
          aria-label="무료혜택 유형별 빠른 발견"
        >
          {discoveryLanes.map((lane) => (
            <Link
              key={lane.label}
              href={lane.href}
              className={`min-w-0 rounded-2xl border px-2 py-1.5 ${lane.className}`}
              aria-label={`${lane.label} 무료혜택 ${lane.count.toLocaleString("ko-KR")}개 보기`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="truncate text-[10px] font-black">{lane.label}</span>
                <span className="text-xs font-black">{lane.count.toLocaleString("ko-KR")}</span>
              </div>
              <p className="mt-0.5 truncate text-[9px] font-bold opacity-80">{lane.brandName}</p>
              <p className="mt-0.5 truncate text-[9px] font-black opacity-90">{lane.ctaLabel}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {visibleEvents.length ? (
        <div
          data-home-free-benefit-promise-strip="true"
          className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4"
          aria-label="무료혜택 우선순위 신호"
        >
          {benefitPromiseCards.map((item) => (
            <div key={item.label} className={`rounded-2xl border px-2 py-1.5 ${item.className}`}>
              <div className="flex items-baseline justify-between gap-1">
                <span className="truncate text-[10px] font-black">{item.label}</span>
                <span className="text-xs font-black">{item.value.toLocaleString("ko-KR")}</span>
              </div>
              <p className="mt-0.5 truncate text-[9px] font-bold opacity-80">{item.copy}</p>
            </div>
          ))}
        </div>
      ) : null}

      {topSourceDomains.length ? (
        <div
          data-home-free-benefit-source-strip="true"
          className="mt-2 flex min-h-8 items-center gap-1 overflow-x-auto rounded-2xl border border-blue-100 bg-blue-50 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="검증된 무료혜택 공식 출처"
        >
          <span className="shrink-0 text-[10px] font-black text-blue-700">공식 출처</span>
          {topSourceDomains.map((source) => (
            <span key={source.domain} className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-700 shadow-sm">
              {source.domain}
              <span className="ml-1 text-blue-600">{source.count.toLocaleString("ko-KR")}</span>
            </span>
          ))}
        </div>
      ) : null}

      {quickClaimEvents.length ? (
        <div
          data-home-free-benefit-claim-rail="true"
          className="mt-2 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 via-white to-emerald-50 p-2"
          aria-label="지금 바로 받을 무료혜택"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-dossa-red">지금 바로 받기</p>
              <p className="line-clamp-1 text-[11px] font-bold text-slate-500">구매조건 낮고 공식 링크가 확인된 혜택만 먼저 보여드립니다.</p>
            </div>
            <Link href="/free-benefits?sort=noPurchase" className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-dossa-red shadow-sm">
              더보기
            </Link>
          </div>
          <div className="mt-2 flex snap-x gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickClaimEvents.map((event) => (
              <Link
                key={event.id}
                href={`/go/news/${encodeURIComponent(event.id)}?from=home-free-benefit-quick-claim`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-16 w-[9.65rem] shrink-0 snap-start rounded-2xl border border-white bg-white p-2 shadow-sm transition hover:border-red-100"
                aria-label={`${event.title} ${event.claimCtaLabel || "무료 혜택 받기"}`}
              >
                <div className="flex items-center gap-1">
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${eventToneClassNames[event.benefitType]}`}>
                    {getFreeBenefitEventLabel(event.benefitType)}
                  </span>
                  <span className="truncate text-[9px] font-black text-slate-400">{event.brandName}</span>
                </div>
                <p className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] font-black leading-4 text-slate-950">{event.title}</p>
                <div className="mt-1 flex items-center justify-between gap-1 text-[9px] font-black">
                  <span className="truncate text-emerald-700">{event.claimCtaLabel || "무료 혜택 받기"}</span>
                  <span className="shrink-0 text-slate-400">{event.urgencyLabel || getTimeLeft(event.endAt, referenceNow)}</span>
                </div>
                <p className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-black ${getClaimAccessTone(event)}`}>{event.claimAccessLabel}</p>
                <p className="mt-0.5 truncate text-[8px] font-black text-slate-400" data-home-free-benefit-preclaim="true">
                  {getPreClaimChecklist(event).slice(0, 3).join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

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
        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-4 xl:grid-cols-6" aria-label="공식 무료혜택 이벤트 카드">
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
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                  {getConditionLabel(event)}
                </span>
                {event.sourceDomain ? (
                  <span className="max-w-[7rem] truncate rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-blue-700">
                    {event.sourceDomain}
                  </span>
                ) : null}
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
              <div
                className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-white/80 p-1 text-[9px] font-black text-slate-500"
                data-home-free-benefit-preclaim="true"
                aria-label={`${event.title} 혜택 받기 전 확인 조건`}
              >
                {getPreClaimChecklist(event).map((item) => (
                  <span key={item} className="truncate rounded-lg bg-slate-50 px-1.5 py-1">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className={`truncate rounded-full px-2 py-1 text-[10px] font-black ${getClaimAccessTone(event)}`}>{event.claimAccessLabel}</span>
                <span className="shrink-0 text-[9px] font-bold text-slate-400">공식 검증</span>
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
        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-4 xl:grid-cols-8" aria-label="공식 무료혜택 카드">
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
          <p className="mt-1 text-xs font-bold text-slate-500">공식 신청·쿠폰·샘플·무료체험 URL이 확인된 항목만 보여드립니다.</p>
        </div>
      )}
    </section>
  );
}

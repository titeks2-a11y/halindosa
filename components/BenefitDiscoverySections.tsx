import { AlertTriangle, BadgePercent, Clock3, Gift, Heart, Sparkles, TicketPercent, TrendingUp, Truck } from "lucide-react";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { Deal, DealBenefitType } from "@/types/deal";
import { formatPrice, getTimeLeft } from "@/lib/format";

interface BenefitDiscoverySectionsProps {
  deals: Deal[];
  recentDeals: Deal[];
  favoriteCount: number;
  onSelectBenefit: (type: DealBenefitType) => void;
  onSelectCategory: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  referenceNow?: number;
}

interface DailyClaimPlanItem {
  label: string;
  title: string;
  helper: string;
  deal: Deal;
  icon: typeof Gift;
}

interface BenefitMissionItem {
  label: string;
  title: string;
  helper: string;
  metric: string;
  deal: Deal;
  icon: typeof Gift;
}

interface DailyActionQueueItem {
  label: string;
  title: string;
  helper: string;
  actionLabel: string;
  checklist: string;
  deal: Deal;
  icon: typeof Gift;
}

interface SavingsReceiptItem {
  label: string;
  value: string;
  helper: string;
  deal?: Deal;
  type?: DealBenefitType;
  icon: typeof Gift;
}

const benefitCards: Array<{
  type: DealBenefitType;
  title: string;
  description: string;
  icon: typeof Gift;
}> = [
  { type: "freebie", title: "무료로 받을 수 있는 혜택", description: "0원딜, 무료 샘플, 교환권", icon: Gift },
  { type: "coupon", title: "쿠폰과 이벤트", description: "1+1, 2+1, 카드 혜택", icon: TicketPercent },
  { type: "freeShipping", title: "무료배송/무배 특가", description: "생활비 체감 절약", icon: Truck },
  { type: "point", title: "포인트 적립", description: "앱테크와 페이 혜택", icon: Sparkles },
  { type: "convenienceStore", title: "편의점 1+1 / 2+1", description: "간식, 도시락, 쿠폰 행사", icon: TicketPercent },
  { type: "mart", title: "마트 행사", description: "장보기 전 확인", icon: BadgePercent },
  { type: "foodDelivery", title: "배달/외식 쿠폰", description: "식비 절약 쿠폰", icon: Gift }
];

const quickBenefitEntries: Array<{
  label: string;
  title: string;
  helper: string;
  type: DealBenefitType;
  icon: typeof Gift;
}> = [
  { label: "0원", title: "무료 샘플", helper: "돈 쓰기 전 받을 수 있는 혜택", type: "freebie", icon: Gift },
  { label: "쿠폰", title: "결제 전 쿠폰", helper: "첫 구매, 카드, 브랜드 쿠폰", type: "coupon", icon: TicketPercent },
  { label: "적립", title: "앱테크 포인트", helper: "출석체크와 페이 리워드", type: "point", icon: Sparkles },
  { label: "생활", title: "편의점·마트", helper: "1+1, 2+1, 장보기 행사", type: "convenienceStore", icon: BadgePercent }
];

function sortByBenefitScore(deals: Deal[]) {
  return [...deals].sort(
    (a, b) =>
      Number(b.isHot) - Number(a.isHot) ||
      b.reliabilityScore - a.reliabilityScore ||
      b.clickCount - a.clickCount ||
      b.savingsAmount - a.savingsAmount
  );
}

function sortByFavoriteSignal(deals: Deal[]) {
  return [...deals].sort(
    (a, b) =>
      b.likeCount - a.likeCount ||
      Number(b.isVerified) - Number(a.isVerified) ||
      b.reliabilityScore - a.reliabilityScore ||
      b.savingsAmount - a.savingsAmount
  );
}

function getDailyBenefitRankings(deals: Deal[]) {
  const activeDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut);
  const freeTop = sortByBenefitScore(
    activeDeals.filter((deal) => ["freebie", "experience", "freeShipping"].includes(deal.dealType) || deal.salePrice <= 1000)
  ).slice(0, 5);
  const couponTop = sortByBenefitScore(
    activeDeals.filter((deal) => ["coupon", "point", "foodDelivery", "convenienceStore", "mart"].includes(deal.dealType))
  ).slice(0, 5);

  return { freeTop, couponTop };
}

function getBenefitSummaryStats(deals: Deal[]) {
  const activeDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut);
  const freeBenefitCount = activeDeals.filter((deal) => ["freebie", "experience", "freeShipping"].includes(deal.dealType) || deal.isFreeShipping).length;
  const couponCount = activeDeals.filter((deal) => ["coupon", "point", "foodDelivery", "convenienceStore", "mart"].includes(deal.dealType)).length;
  const endingSoonCount = activeDeals.filter((deal) => deal.isEndingSoon).length;
  const expectedSavings = activeDeals.reduce((total, deal) => total + Math.max(0, deal.savingsAmount), 0);

  return {
    expectedSavings,
    freeBenefitCount,
    couponCount,
    endingSoonCount
  };
}

function getHomeBenefitRiskReview(deals: Deal[]) {
  const activeDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut);

  return [
    {
      title: "숨은 비용 먼저 보기",
      value: `${activeDeals.filter((deal) => !deal.isFreeShipping && deal.shippingFee !== "무료배송" && deal.salePrice > 0).length}개`,
      helper: "무료처럼 보여도 배송비, 옵션가, 최소 주문 금액이 붙을 수 있는 혜택",
      type: "freeShipping" as DealBenefitType
    },
    {
      title: "가입 조건 있는 혜택",
      value: `${activeDeals.filter((deal) => deal.requiresSignup).length}개`,
      helper: "판매처 회원가입, 앱 설치, 신규 가입 조건을 먼저 확인할 혜택",
      type: "coupon" as DealBenefitType
    },
    {
      title: "선착순·마감 주의",
      value: `${activeDeals.filter((deal) => deal.isFirstComeFirstServed || deal.isEndingSoon).length}개`,
      helper: "수량 제한, 마감 시간, 조기 종료 가능성이 있는 혜택",
      type: "event" as DealBenefitType
    },
    {
      title: "신고 상태 확인",
      value: `${activeDeals.filter((deal) => deal.reportCount > 0 || deal.linkStatus !== "verified").length}개`,
      helper: "신고 누적, 링크 확인 필요, 판매처 상태 재확인이 필요한 혜택",
      type: "discount" as DealBenefitType
    }
  ];
}

function getTodaySavingsReceipt(deals: Deal[]) {
  const activeDeals = sortByBenefitScore(deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken"));
  const freeDeal = activeDeals.find((deal) => ["freebie", "experience"].includes(deal.dealType) || deal.salePrice <= 1000);
  const couponDeal = activeDeals.find((deal) => ["coupon", "foodDelivery", "point"].includes(deal.dealType));
  const shippingDeal = activeDeals.find((deal) => deal.isFreeShipping || deal.dealType === "freeShipping");
  const savingsDeal = [...activeDeals].sort((a, b) => b.savingsAmount - a.savingsAmount || b.discountRate - a.discountRate)[0];

  return [
    {
      label: "무료 혜택",
      value: freeDeal ? freeDeal.claimCta : "무료 탭 열기",
      helper: freeDeal ? freeDeal.title : "무료 샘플과 체험단을 먼저 확인",
      deal: freeDeal,
      type: "freebie",
      icon: Gift
    },
    {
      label: "쿠폰 절약",
      value: couponDeal ? couponDeal.couponCondition || getBenefitTypeLabel(couponDeal.dealType) : "쿠폰 찾기",
      helper: couponDeal ? couponDeal.title : "결제 전 쿠폰과 포인트 확인",
      deal: couponDeal,
      type: "coupon",
      icon: TicketPercent
    },
    {
      label: "배송비 절약",
      value: shippingDeal ? shippingDeal.shippingFee || shippingDeal.shipping : "무배 보기",
      helper: shippingDeal ? shippingDeal.title : "무료배송 조건을 먼저 확인",
      deal: shippingDeal,
      type: "freeShipping",
      icon: Truck
    },
    {
      label: "큰 절약 후보",
      value: savingsDeal ? formatPrice(savingsDeal.savingsAmount) : "추천 보기",
      helper: savingsDeal ? savingsDeal.title : "절약액이 큰 혜택을 확인",
      deal: savingsDeal,
      type: "discount",
      icon: BadgePercent
    }
  ] satisfies SavingsReceiptItem[];
}

function getDailyClaimPlan(deals: Deal[]) {
  const activeDeals = sortByBenefitScore(deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken"));
  const pickedIds = new Set<string>();

  const pick = (predicate: (deal: Deal) => boolean) => {
    const deal = activeDeals.find((item) => predicate(item) && !pickedIds.has(item.id));
    if (deal) pickedIds.add(deal.id);
    return deal;
  };

  return [
    {
      label: "1분",
      title: "무료 혜택 받기",
      helper: "샘플, 체험, 0원 혜택부터 확인",
      deal: pick((deal) => ["freebie", "experience"].includes(deal.dealType) || deal.salePrice <= 1000),
      icon: Gift
    },
    {
      label: "2분",
      title: "쿠폰 조건 챙기기",
      helper: "결제 전 쓸 수 있는 쿠폰 확인",
      deal: pick((deal) => ["coupon", "foodDelivery", "convenienceStore"].includes(deal.dealType)),
      icon: TicketPercent
    },
    {
      label: "3분",
      title: "포인트 적립하기",
      helper: "출석체크와 페이 적립 확인",
      deal: pick((deal) => deal.dealType === "point"),
      icon: Sparkles
    },
    {
      label: "마감",
      title: "끝나기 전 확인",
      helper: "마감 임박 혜택만 빠르게 점검",
      deal: pick((deal) => deal.isEndingSoon),
      icon: Clock3
    }
  ].filter((item): item is DailyClaimPlanItem => Boolean(item.deal));
}

function getTodayBenefitMissions(deals: Deal[]) {
  const activeDeals = sortByBenefitScore(deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken"));
  const pickedIds = new Set<string>();

  const pick = (predicate: (deal: Deal) => boolean) => {
    const deal = activeDeals.find((item) => predicate(item) && !pickedIds.has(item.id));
    if (deal) pickedIds.add(deal.id);
    return deal;
  };

  return [
    {
      label: "0원부터",
      title: "돈 쓰기 전 무료 혜택",
      helper: "무료 샘플, 체험단, 초대권처럼 바로 챙길 수 있는 혜택입니다.",
      metric: "신청/수령 조건 확인",
      deal: pick((deal) => ["freebie", "experience"].includes(deal.dealType) || deal.salePrice <= 1000),
      icon: Gift
    },
    {
      label: "결제 전",
      title: "쿠폰·포인트 먼저 적용",
      helper: "구매하기 전에 쿠폰 조건과 포인트 적립을 먼저 확인하세요.",
      metric: "최소금액·중복 여부 확인",
      deal: pick((deal) => ["coupon", "point", "foodDelivery"].includes(deal.dealType)),
      icon: TicketPercent
    },
    {
      label: "마감 체크",
      title: "오늘 끝날 수 있는 혜택",
      helper: "가격, 재고, 이벤트 기간이 빠르게 바뀔 수 있어 먼저 보는 묶음입니다.",
      metric: "마감 전 판매처 확인",
      deal: pick((deal) => deal.isEndingSoon),
      icon: Clock3
    }
  ].filter((item): item is BenefitMissionItem => Boolean(item.deal));
}

function getDailyActionQueue(deals: Deal[]) {
  const activeDeals = sortByBenefitScore(deals.filter((deal) => !deal.isExpired && !deal.isSoldOut && deal.linkStatus !== "broken"));
  const pickedIds = new Set<string>();

  const pick = (predicate: (deal: Deal) => boolean) => {
    const deal = activeDeals.find((item) => predicate(item) && !pickedIds.has(item.id));
    if (deal) pickedIds.add(deal.id);
    return deal;
  };

  return [
    {
      label: "무료 먼저",
      title: "돈 쓰기 전 받을 것",
      helper: "샘플, 체험, 0원 혜택을 먼저 열어 실제 수령 조건을 확인합니다.",
      actionLabel: "무료 혜택 받기",
      checklist: "가입 필요 · 배송비 · 선착순 확인",
      deal: pick((deal) => ["freebie", "experience"].includes(deal.dealType) || deal.salePrice <= 1000),
      icon: Gift
    },
    {
      label: "결제 전",
      title: "쿠폰·포인트 적용",
      helper: "구매하기 전에 적용 가능한 쿠폰, 페이 적립, 배달/외식 혜택을 먼저 봅니다.",
      actionLabel: "쿠폰 조건 보기",
      checklist: "최소금액 · 중복 가능 · 만료일 확인",
      deal: pick((deal) => ["coupon", "point", "foodDelivery"].includes(deal.dealType)),
      icon: TicketPercent
    },
    {
      label: "생활비",
      title: "장보기·편의점 행사",
      helper: "편의점 1+1, 마트 행사, 무료배송 조건처럼 오늘 바로 체감되는 혜택입니다.",
      actionLabel: "생활 혜택 보기",
      checklist: "지점/앱 조건 · 배송비 · 행사 기간 확인",
      deal: pick((deal) => ["convenienceStore", "mart", "freeShipping"].includes(deal.dealType) || deal.category === "편의점/마트"),
      icon: BadgePercent
    },
    {
      label: "마감 전",
      title: "오늘 끝날 혜택 점검",
      helper: "종료 시간이 가까운 혜택을 먼저 열어 가격과 재고를 마지막으로 확인합니다.",
      actionLabel: "마감 혜택 확인",
      checklist: "가격 변동 · 품절 · 링크 오류 신고 가능",
      deal: pick((deal) => deal.isEndingSoon),
      icon: Clock3
    }
  ].filter((item): item is DailyActionQueueItem => Boolean(item.deal));
}

function BenefitTopList({
  title,
  description,
  deals,
  accent,
  onOpenDeal,
  referenceNow
}: {
  title: string;
  description: string;
  deals: Deal[];
  accent: "red" | "slate";
  onOpenDeal: (deal: Deal) => void;
  referenceNow?: number;
}) {
  const accentClasses =
    accent === "red"
      ? {
          panel: "border-red-100 bg-red-50",
          badge: "bg-white text-dossa-red",
          rank: "bg-dossa-red text-white",
          cta: "text-dossa-red"
        }
      : {
          panel: "border-slate-200 bg-slate-50",
          badge: "bg-white text-slate-700",
          rank: "bg-slate-950 text-white",
          cta: "text-slate-950"
        };

  return (
    <div className={`rounded-[28px] border p-4 shadow-sm sm:p-5 ${accentClasses.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-dossa-red">오늘 바로 챙길 TOP</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{description}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black shadow-sm ${accentClasses.badge}`}>{deals.length}개</span>
      </div>
      <div className="mt-4 space-y-2">
        {deals.map((deal, index) => (
          <button
            key={deal.id}
            type="button"
            onClick={() => onOpenDeal(deal)}
            className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            aria-label={`${deal.title} 바로 확인`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${accentClasses.rank}`}>{index + 1}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
              <span className="mt-0.5 block truncate text-xs font-bold text-slate-500">
                {deal.mallName} · {getBenefitTypeLabel(deal.dealType)} · {getTimeLeft(deal.expireAt, referenceNow)}
              </span>
            </span>
            <span className={`shrink-0 text-xs font-black ${accentClasses.cta}`}>{deal.claimCta}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function BenefitDiscoverySections({
  deals,
  recentDeals,
  favoriteCount,
  onSelectBenefit,
  onSelectCategory,
  onOpenDeal,
  referenceNow
}: BenefitDiscoverySectionsProps) {
  const source = deals.length ? deals : [];
  const freeDeals = sortByBenefitScore(source.filter((deal) => ["freebie", "coupon", "freeShipping", "point", "experience", "convenienceStore", "mart", "foodDelivery"].includes(deal.dealType))).slice(0, 6);
  const urgentDeals = sortByBenefitScore(source.filter((deal) => deal.isEndingSoon && !deal.isExpired)).slice(0, 4);
  const risingDeals = sortByBenefitScore(source).slice(0, 5);
  const favoriteSignalDeals = sortByFavoriteSignal(source.filter((deal) => !deal.isExpired && !deal.isSoldOut)).slice(0, 4);
  const martDeals = sortByBenefitScore(source.filter((deal) => deal.category === "편의점/마트" || /마트|gs25|편의점|교환권|1\+1|2\+1/.test([deal.title, ...deal.tags].join(" ").toLowerCase()))).slice(0, 4);
  const appTechHomeDeals = sortByBenefitScore(
    source.filter(
      (deal) =>
        !deal.isExpired &&
        !deal.isSoldOut &&
        (deal.dealType === "point" || /출석|포인트|적립|페이|멤버십|리워드|카드/.test(`${deal.title} ${deal.tags.join(" ")} ${deal.benefitSummary}`))
    )
  ).slice(0, 4);
  const { freeTop, couponTop } = getDailyBenefitRankings(source);
  const summaryStats = getBenefitSummaryStats(source);
  const dailyClaimPlan = getDailyClaimPlan(source);
  const todayBenefitMissions = getTodayBenefitMissions(source);
  const todaySavingsReceipt = getTodaySavingsReceipt(source);
  const dailyActionQueue = getDailyActionQueue(source);
  const homeBenefitRiskReview = getHomeBenefitRiskReview(source);

  return (
    <div className="space-y-4" aria-label="할인도사 VER 2.0 혜택 탐색">
      <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">오늘 놓치면 아쉬운 혜택</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">무료, 쿠폰, 무배부터 먼저 확인하세요</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              비회원도 모든 혜택을 볼 수 있고, 찜과 알림 저장만 로그인으로 이어집니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-black sm:min-w-64">
            <span className="rounded-2xl bg-red-50 px-3 py-2 text-dossa-red">{source.filter((deal) => deal.isVerified).length}개 링크 확인</span>
            <span className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-700">찜 {favoriteCount}개</span>
          </div>
        </div>

        {dailyActionQueue.length ? (
          <div className="mt-4 rounded-[24px] border border-red-100 bg-dossa-red p-3 text-white shadow-sm" aria-label="오늘 혜택 1분 시작">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-red-100">오늘 혜택 1분 시작</p>
                <h4 className="text-lg font-black">앱을 열자마자 무료, 쿠폰, 생활비, 마감 순서로 바로 갑니다</h4>
              </div>
              <p className="text-xs font-bold leading-5 text-red-50">첫 화면에서 가장 체감이 큰 혜택만 먼저 압축했습니다.</p>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {dailyActionQueue.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={`quick-${item.title}`}
                    type="button"
                    onClick={() => onOpenDeal(item.deal)}
                    className="min-h-[126px] rounded-3xl bg-white p-3 text-left text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    aria-label={`${item.label} ${item.deal.title} 빠르게 확인`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                        <Icon size={19} />
                      </span>
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">{item.label}</span>
                    </span>
                    <span className="mt-3 block text-sm font-black">{item.actionLabel}</span>
                    <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.deal.title}</span>
                    <span className="mt-2 block truncate text-[11px] font-black text-dossa-red">{item.checklist}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-3" aria-label="10초 혜택 바로가기">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">10초 혜택 바로가기</p>
              <h4 className="text-lg font-black text-slate-950">오늘 받을 혜택을 바로 고르세요</h4>
            </div>
            <p className="text-xs font-bold leading-5 text-slate-500">무료, 쿠폰, 포인트, 생활 행사로 즉시 좁혀봅니다.</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {quickBenefitEntries.map((entry) => {
              const Icon = entry.icon;
              const count = source.filter((deal) => deal.dealType === entry.type).length;

              return (
                <button
                  key={entry.title}
                  type="button"
                  onClick={() => onSelectBenefit(entry.type)}
                  className="min-h-[102px] rounded-3xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md"
                  aria-label={`${entry.title} ${count}개 바로 보기`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                      <Icon size={19} />
                    </span>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">{entry.label}</span>
                  </span>
                  <span className="mt-3 block text-sm font-black text-slate-950">{entry.title}</span>
                  <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{entry.helper} · {count}개</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-7">
          {benefitCards.map((card) => {
            const Icon = card.icon;
            const count = source.filter((deal) => deal.dealType === card.type).length;

            return (
              <button
                key={card.type}
                type="button"
                onClick={() => onSelectBenefit(card.type)}
                className="min-h-[116px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                aria-label={`${card.title} ${count}개 보기`}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                  <Icon size={20} />
                </span>
                <span className="mt-3 block text-sm font-black text-slate-950">{card.title}</span>
                <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{card.description}</span>
                <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red">{count}개</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-2 rounded-[24px] border border-red-100 bg-red-50 p-3 sm:grid-cols-4" aria-label="오늘 절약 요약">
          {[
            ["오늘 절약 후보", formatPrice(summaryStats.expectedSavings), "표시된 혜택 절약액 합계"],
            ["무료·무배", `${summaryStats.freeBenefitCount}개`, "비용 부담 낮은 혜택"],
            ["쿠폰·포인트", `${summaryStats.couponCount}개`, "결제 전 챙길 혜택"],
            ["마감 임박", `${summaryStats.endingSoonCount}개`, "먼저 확인할 혜택"]
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-2xl bg-white px-3 py-3 shadow-sm">
              <span className="block text-[11px] font-black text-slate-500">{label}</span>
              <span className="mt-1 block text-base font-black text-dossa-red">{value}</span>
              <span className="mt-1 block text-[11px] font-bold leading-4 text-slate-500">{helper}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[24px] border border-amber-100 bg-white p-3 shadow-sm" aria-label="홈 혜택 헛걸음 방지">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">홈 혜택 헛걸음 방지</p>
              <h4 className="text-lg font-black text-slate-950">누르기 전 놓치기 쉬운 조건을 먼저 봅니다</h4>
            </div>
            <p className="text-xs font-bold leading-5 text-slate-500">배송비, 가입, 선착순, 신고 신호를 첫 화면에서 바로 점검합니다.</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {homeBenefitRiskReview.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onSelectBenefit(item.type)}
                className="min-h-[132px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50"
                aria-label={`${item.title} ${item.value} 점검`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
                    <AlertTriangle size={18} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-amber-700 shadow-sm">{item.value}</span>
                </span>
                <span className="mt-3 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.helper}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
            조건 점검은 혜택을 숨기지 않고 사용자가 먼저 판단하도록 돕는 안내입니다. 비회원도 전체 혜택을 계속 볼 수 있습니다.
          </p>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm" aria-label="오늘 절약 영수증">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">오늘 절약 영수증</p>
              <h4 className="text-lg font-black text-slate-950">무료, 쿠폰, 배송비, 큰 절약을 한 번에 챙기세요</h4>
            </div>
            <p className="text-xs font-bold leading-5 text-slate-500">눌러서 바로 판매처 확인 또는 혜택 필터로 이동합니다.</p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {todaySavingsReceipt.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.deal) {
                      onOpenDeal(item.deal);
                    } else if (item.type) {
                      onSelectBenefit(item.type);
                    }
                  }}
                  className="min-h-[142px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                  aria-label={`${item.label} ${item.value} 확인`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                      <Icon size={19} />
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.label}</span>
                  </span>
                  <span className="mt-3 block line-clamp-1 text-sm font-black text-slate-950">{item.value}</span>
                  <span className="mt-1 line-clamp-3 block text-xs font-bold leading-5 text-slate-500">{item.helper}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
            영수증은 예상 절약 흐름을 정리한 안내입니다. 최종 가격, 쿠폰 적용, 배송비는 판매처에서 다시 확인하세요.
          </p>
        </div>

        {todayBenefitMissions.length ? (
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-950 p-3 text-white" aria-label="오늘 혜택 미션 보드">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-red-200">오늘 혜택 미션 보드</p>
                <h4 className="text-lg font-black">처음 들어왔다면 이 3가지만 먼저 보세요</h4>
              </div>
              <p className="text-xs font-bold leading-5 text-slate-300">무료, 쿠폰, 마감 혜택을 실제 카드로 연결합니다.</p>
            </div>
            <div className="mt-3 grid gap-2 lg:grid-cols-3">
              {todayBenefitMissions.map((mission) => {
                const Icon = mission.icon;

                return (
                  <button
                    key={mission.title}
                    type="button"
                    onClick={() => onOpenDeal(mission.deal)}
                    className="min-h-[162px] rounded-3xl bg-white p-3 text-left text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    aria-label={`${mission.title} ${mission.deal.title} 확인`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                        <Icon size={19} />
                      </span>
                      <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">{mission.label}</span>
                    </span>
                    <span className="mt-3 block text-sm font-black">{mission.title}</span>
                    <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{mission.helper}</span>
                    <span className="mt-2 line-clamp-1 block text-xs font-black text-dossa-red">{mission.deal.title}</span>
                    <span className="mt-1 block text-[11px] font-bold text-slate-500">{mission.metric}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {dailyActionQueue.length ? (
          <div className="mt-4 rounded-[24px] border border-red-100 bg-white p-3 shadow-sm" aria-label="오늘 바로 실행할 혜택 액션 큐">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-dossa-red">오늘 바로 실행할 혜택 액션 큐</p>
                <h4 className="text-lg font-black text-slate-950">무료 수령, 쿠폰 적용, 생활 혜택, 마감 확인 순서로 봅니다</h4>
              </div>
              <p className="text-xs font-bold leading-5 text-slate-500">비회원도 열람 가능 · 저장과 알림만 로그인으로 이어집니다.</p>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {dailyActionQueue.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onOpenDeal(item.deal)}
                    className="min-h-[176px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                    aria-label={`${item.title} ${item.deal.title} 확인`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                        <Icon size={19} />
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.label}</span>
                    </span>
                    <span className="mt-3 block text-sm font-black text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{item.helper}</span>
                    <span className="mt-2 line-clamp-1 block text-xs font-black text-dossa-red">{item.deal.title}</span>
                    <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 shadow-sm">{item.actionLabel}</span>
                    <span className="mt-2 block text-[11px] font-bold leading-4 text-slate-500">{item.checklist}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {dailyClaimPlan.length ? (
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-3" aria-label="오늘 받을 수 있는 혜택 루틴">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-dossa-red">3분 혜택 루틴</p>
                <h4 className="text-lg font-black text-slate-950">앱을 열자마자 이 순서로 받으세요</h4>
              </div>
              <p className="text-xs font-bold leading-5 text-slate-500">비회원도 바로 확인 가능 · 저장만 로그인</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {dailyClaimPlan.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onOpenDeal(item.deal)}
                    className="group min-h-[132px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                    aria-label={`${item.title} ${item.deal.title} 바로 확인`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                        <Icon size={19} />
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.label}</span>
                    </span>
                    <span className="mt-3 block text-sm font-black text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{item.helper}</span>
                    <span className="mt-2 line-clamp-1 block text-xs font-black text-slate-900 group-hover:text-dossa-red">{item.deal.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="무료 쿠폰 오늘 TOP 랭킹">
        <BenefitTopList
          title="무료혜택 TOP 5"
          description="비용 부담이 적은 무료 샘플, 체험, 무료배송 혜택을 먼저 보여드립니다."
          deals={freeTop}
          accent="red"
          onOpenDeal={onOpenDeal}
          referenceNow={referenceNow}
        />
        <BenefitTopList
          title="쿠폰·앱테크 TOP 5"
          description="결제 전 챙기기 좋은 쿠폰, 포인트, 배달·외식 혜택을 모았습니다."
          deals={couponTop}
          accent="slate"
          onOpenDeal={onOpenDeal}
          referenceNow={referenceNow}
        />
      </section>

      {appTechHomeDeals.length ? (
        <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="홈 앱테크 페이 멤버십 루틴">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">앱테크·페이·멤버십</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">오늘 눌러둘 적립 혜택</h3>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                출석체크, 페이 리워드, 통신사 멤버십처럼 매일 확인할수록 놓칠 가능성이 줄어드는 혜택입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectBenefit("point")}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-dossa-red px-4 text-sm font-black text-white"
            >
              포인트 루틴 보기
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {appTechHomeDeals.map((deal) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => onOpenDeal(deal)}
                className="min-h-[154px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
                aria-label={`${deal.title} 앱테크 적립 혜택 확인`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <Sparkles size={19} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                    {deal.requiresSignup ? "가입 조건" : "간편 확인"}
                  </span>
                </span>
                <span className="mt-3 line-clamp-2 block text-sm font-black leading-5 text-slate-950">{deal.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{deal.mallName} · {deal.benefitSummary}</span>
                <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 shadow-sm">
                  예상 적립 {formatPrice(deal.savingsAmount)}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-dossa-deep">
            적립 예정일, 결제수단, 신규/기존 회원 조건은 제공처 화면에서 최종 확인하세요. 비회원도 전체 혜택을 볼 수 있습니다.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-dossa-red">무료혜택/쿠폰</p>
              <h3 className="text-xl font-black text-slate-950">돈 안 쓰고 챙기는 혜택</h3>
            </div>
            <button type="button" onClick={() => onSelectBenefit("freebie")} className="text-sm font-black text-dossa-red">
              무료 탭
            </button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {freeDeals.map((deal) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => onOpenDeal(deal)}
                className="min-w-0 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-red-50"
              >
                <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                  {getBenefitTypeLabel(deal.dealType)}
                </span>
                <span className="mt-2 line-clamp-2 block text-sm font-black leading-5 text-slate-950">{deal.title}</span>
                <span className="mt-1 block text-xs font-bold text-slate-500">{deal.mallName} · {deal.benefitSummary}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-dossa-red">마감 임박</p>
              <h3 className="text-xl font-black text-slate-950">지금 확인해야 하는 혜택</h3>
            </div>
            <Clock3 size={22} className="text-dossa-red" />
          </div>
          <div className="mt-4 space-y-2">
            {urgentDeals.map((deal) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => onOpenDeal(deal)}
                className="flex w-full items-center gap-3 rounded-2xl bg-red-50 p-3 text-left transition hover:bg-red-100"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red">
                  <BadgePercent size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                  <span className="block text-xs font-bold text-dossa-red">{getTimeLeft(deal.expireAt, referenceNow)} · {formatPrice(deal.savingsAmount)} 절약</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-black text-dossa-red">편의점/마트</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">오늘 장보기 전에 보는 행사</h3>
          <div className="mt-4 space-y-2">
            {martDeals.map((deal) => (
              <button key={deal.id} type="button" onClick={() => onOpenDeal(deal)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-left hover:bg-red-50">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                  <span className="block text-xs font-bold text-slate-500">{deal.mallName} · {deal.shipping}</span>
                </span>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red">{deal.discountRate}%</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onSelectCategory("mart")} className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-dossa-red">
            편의점/마트 더 보기
          </button>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-dossa-red">클릭 급상승</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">사람들이 많이 확인하는 혜택</h3>
            </div>
            <TrendingUp size={22} className="text-dossa-red" />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {risingDeals.map((deal, index) => (
              <button key={deal.id} type="button" onClick={() => onOpenDeal(deal)} className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left hover:bg-red-50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dossa-red text-sm font-black text-white">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                  <span className="block truncate text-xs font-bold text-slate-500">{deal.mallName} · {deal.clickCount.toLocaleString("ko-KR")}회 확인</span>
                </span>
              </button>
            ))}
          </div>
          {recentDeals.length ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-dossa-red">
                <Heart size={16} />
                최근 본 혜택 이어보기
              </div>
              <button type="button" onClick={() => onOpenDeal(recentDeals[0])} className="line-clamp-1 text-left text-sm font-black text-slate-950">
                {recentDeals[0].title}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="회원들이 많이 찜한 혜택">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">인기 찜</p>
            <h3 className="mt-1 text-xl font-black text-slate-950">회원들이 많이 찜한 혜택</h3>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
              비회원도 모두 볼 수 있고, 저장하면 이 기기 또는 계정에서 이어볼 수 있습니다.
            </p>
          </div>
          <span className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-dossa-red">
            내 찜 {favoriteCount}개
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {favoriteSignalDeals.map((deal) => (
            <button
              key={deal.id}
              type="button"
              onClick={() => onOpenDeal(deal)}
              className="min-h-[138px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
              aria-label={`${deal.title} 회원들이 많이 찜한 혜택 확인`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                  <Heart size={19} fill="currentColor" />
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                  찜 {deal.likeCount.toLocaleString("ko-KR")}
                </span>
              </span>
              <span className="mt-3 line-clamp-2 block text-sm font-black leading-5 text-slate-950">{deal.title}</span>
              <span className="mt-1 block text-xs font-bold text-slate-500">{deal.mallName} · {getBenefitTypeLabel(deal.dealType)}</span>
              <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 shadow-sm">{deal.claimCta}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

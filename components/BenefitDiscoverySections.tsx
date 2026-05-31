import { BadgePercent, Clock3, Gift, Heart, Sparkles, TicketPercent, TrendingUp, Truck } from "lucide-react";
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

function sortByBenefitScore(deals: Deal[]) {
  return [...deals].sort(
    (a, b) =>
      Number(b.isHot) - Number(a.isHot) ||
      b.reliabilityScore - a.reliabilityScore ||
      b.clickCount - a.clickCount ||
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

function BenefitTopList({
  title,
  description,
  deals,
  accent,
  onOpenDeal
}: {
  title: string;
  description: string;
  deals: Deal[];
  accent: "red" | "slate";
  onOpenDeal: (deal: Deal) => void;
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
                {deal.mallName} · {getBenefitTypeLabel(deal.dealType)} · {getTimeLeft(deal.expireAt)}
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
  onOpenDeal
}: BenefitDiscoverySectionsProps) {
  const source = deals.length ? deals : [];
  const freeDeals = sortByBenefitScore(source.filter((deal) => ["freebie", "coupon", "freeShipping", "point", "experience", "convenienceStore", "mart", "foodDelivery"].includes(deal.dealType))).slice(0, 6);
  const urgentDeals = sortByBenefitScore(source.filter((deal) => deal.isEndingSoon && !deal.isExpired)).slice(0, 4);
  const risingDeals = sortByBenefitScore(source).slice(0, 5);
  const martDeals = sortByBenefitScore(source.filter((deal) => deal.category === "편의점/마트" || /마트|gs25|편의점|교환권|1\+1|2\+1/.test([deal.title, ...deal.tags].join(" ").toLowerCase()))).slice(0, 4);
  const { freeTop, couponTop } = getDailyBenefitRankings(source);

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
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="무료 쿠폰 오늘 TOP 랭킹">
        <BenefitTopList
          title="무료혜택 TOP 5"
          description="비용 부담이 적은 무료 샘플, 체험, 무료배송 혜택을 먼저 보여드립니다."
          deals={freeTop}
          accent="red"
          onOpenDeal={onOpenDeal}
        />
        <BenefitTopList
          title="쿠폰·앱테크 TOP 5"
          description="결제 전 챙기기 좋은 쿠폰, 포인트, 배달·외식 혜택을 모았습니다."
          deals={couponTop}
          accent="slate"
          onOpenDeal={onOpenDeal}
        />
      </section>

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
                  <span className="block text-xs font-bold text-dossa-red">{getTimeLeft(deal.expireAt)} · {formatPrice(deal.savingsAmount)} 절약</span>
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
    </div>
  );
}

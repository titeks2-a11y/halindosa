import { CheckCircle2, ExternalLink, Heart, Share2, ShieldCheck, Sparkles, Timer, Truck } from "lucide-react";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { getDealImageSrc, getGeneratedDealImageSrc } from "@/lib/imageSrc";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import type { Deal } from "@/types/deal";

interface TrueDealSpotlightProps {
  deals: Deal[];
  favorites: string[];
  onOpenDeal: (deal: Deal) => void;
  onToggleFavorite: (id: string) => void;
  onShareDeal: (deal: Deal) => void;
  onShowVerified: () => void;
}

function scoreDeal(deal: Deal) {
  return (
    deal.reliabilityScore * 2 +
    deal.discountRate * 1.5 +
    deal.savingsAmount / 1000 +
    deal.likeCount * 0.08 +
    deal.clickCount * 0.04 +
    (deal.isHot ? 35 : 0) +
    (deal.isFreeShipping ? 12 : 0) +
    (isVerifiedPurchaseLink(deal) ? 30 : 0) +
    (deal.isEndingSoon ? 10 : 0)
  );
}

function pickTrueDeals(deals: Deal[]) {
  return [...deals]
    .filter((deal) => !deal.isExpired && !deal.isSoldOut)
    .sort((a, b) => scoreDeal(b) - scoreDeal(a))
    .slice(0, 4);
}

export function TrueDealSpotlight({
  deals,
  favorites,
  onOpenDeal,
  onToggleFavorite,
  onShareDeal,
  onShowVerified
}: TrueDealSpotlightProps) {
  const spotlightDeals = pickTrueDeals(deals);
  const lead = spotlightDeals[0];
  const rest = spotlightDeals.slice(1);

  if (!lead) return null;

  return (
    <section className="overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-brand" aria-label="오늘의 진짜 특가">
      <div className="border-b border-red-100 bg-red-50 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">오늘의 진짜 특가</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">가격, 혜택, 링크까지 먼저 확인한 추천</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              할인율만 보지 않고 절약액, 무료배송, 마감, 실제 구매 링크 상태를 함께 보고 고릅니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onShowVerified}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dossa-red px-4 text-sm font-black text-white transition hover:bg-dossa-deep"
          >
            구매 링크 확인 특가
            <ShieldCheck size={17} />
          </button>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="grid min-w-0 gap-0 md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[260px] bg-red-50">
            {lead.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getDealImageSrc(lead.thumbnail)}
                alt={`${lead.title} 상품 이미지`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  const image = event.currentTarget;
                  if (image.dataset.fallbackApplied === "true") return;
                  image.dataset.fallbackApplied = "true";
                  image.src = getGeneratedDealImageSrc(lead.category);
                }}
                className="h-full min-h-[260px] w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center text-6xl font-black text-dossa-red/20">SALE</div>
            )}
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              {lead.isHot ? <span className="rounded-full bg-dossa-red px-3 py-1 text-xs font-black text-white">핫딜</span> : null}
              {lead.isFreeShipping ? <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-dossa-red shadow-sm">무료배송</span> : null}
              {lead.isEndingSoon ? <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950">마감임박</span> : null}
            </div>
            <button
              type="button"
              onClick={() => onToggleFavorite(lead.id)}
              aria-label={`${lead.title} ${favorites.includes(lead.id) ? "찜 해제" : "찜하기"}`}
              aria-pressed={favorites.includes(lead.id)}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-dossa-red shadow-md"
            >
              <Heart size={21} fill={favorites.includes(lead.id) ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                <span className="rounded-full bg-red-50 px-3 py-1 text-dossa-red">{getBenefitTypeLabel(lead.dealType)}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{lead.mallName}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  <CheckCircle2 size={13} />
                  {isVerifiedPurchaseLink(lead) ? "실제 구매 링크" : "판매처 확인"}
                </span>
              </div>
              <h4 className="mt-3 line-clamp-2 text-2xl font-black leading-tight text-slate-950">{lead.title}</h4>
              <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-slate-600">{lead.benefitSummary}</p>

              <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-400 line-through">{formatPrice(lead.originalPrice)}</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{formatPrice(lead.salePrice)}</p>
                  </div>
                  <span className="rounded-2xl bg-dossa-red px-3 py-2 text-2xl font-black text-white">{lead.discountRate}%</span>
                </div>
                <p className="mt-2 text-sm font-black text-dossa-red">{formatPrice(lead.savingsAmount || lead.discountAmount)} 절약 예상</p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-black text-slate-600">
                <span className="rounded-2xl bg-red-50 px-3 py-2 text-dossa-red">마감 {getTimeLeft(lead.expireAt)}</span>
                <span className="rounded-2xl bg-slate-50 px-3 py-2">가격 {getRelativeTime(lead.priceCheckedAt)}</span>
                <span className="rounded-2xl bg-slate-50 px-3 py-2">{lead.shipping}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
              <button
                type="button"
                onClick={() => onOpenDeal(lead)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-dossa-red"
              >
                판매처 확인
                <ExternalLink size={17} />
              </button>
              <button
                type="button"
                onClick={() => onShareDeal(lead)}
                className="inline-flex min-h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-red-100 hover:text-dossa-red"
                aria-label={`${lead.title} 공유하기`}
              >
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(lead.id)}
                className="inline-flex min-h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-dossa-red transition hover:border-red-100"
                aria-label={`${lead.title} 찜하기`}
              >
                <Heart size={18} fill={favorites.includes(lead.id) ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </article>

        <aside className="border-t border-red-100 bg-white p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">같이 보면 좋은 특가</p>
            <Sparkles size={18} className="text-dossa-red" />
          </div>
          <div className="mt-3 space-y-2">
            {rest.map((deal) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => onOpenDeal(deal)}
                className="flex w-full min-w-0 gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-red-50"
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-red-50">
                  {deal.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getDealImageSrc(deal.thumbnail)}
                      alt={`${deal.title} 상품 이미지`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        const image = event.currentTarget;
                        if (image.dataset.fallbackApplied === "true") return;
                        image.dataset.fallbackApplied = "true";
                        image.src = getGeneratedDealImageSrc(deal.category);
                      }}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black text-dossa-red">{deal.mallName} · {getBenefitTypeLabel(deal.dealType)}</span>
                  <span className="mt-1 line-clamp-2 block text-sm font-black leading-5 text-slate-950">{deal.title}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs font-black text-slate-500">
                    <span className="text-dossa-red">{deal.discountRate}%</span>
                    <Truck size={12} />
                    {deal.shipping}
                    <Timer size={12} />
                    {getTimeLeft(deal.expireAt)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

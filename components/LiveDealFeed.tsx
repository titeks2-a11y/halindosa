import { Clock, ExternalLink, Heart, Radio, Share2, ShoppingBag, Zap } from "lucide-react";
import { canOpenDealLink, getDealLinkTrustLabel } from "@/lib/affiliate";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import { getDealImageSrc } from "@/lib/imageSrc";
import { Deal } from "@/types/deal";

interface LiveDealFeedProps {
  deals: Deal[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  onShareDeal: (deal: Deal) => void;
}

interface LiveDealRowProps {
  deal: Deal;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  onShareDeal: (deal: Deal) => void;
}

function LiveDealRow({ deal, isFavorite, onToggleFavorite, onOpenDeal, onShareDeal }: LiveDealRowProps) {
  const linkAvailable = canOpenDealLink(deal);

  return (
    <article className="relative grid gap-3 bg-white p-3 pr-24 transition hover:bg-slate-50 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:pr-28">
      <div className="flex items-center gap-3">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-dossa-red">
          {deal.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getDealImageSrc(deal.imageUrl)} alt="" className="h-full w-full object-cover" />
          ) : (
            <ShoppingBag size={24} />
          )}
          <span className="absolute bottom-1 left-1 rounded-full bg-dossa-red px-1.5 py-0.5 text-[10px] font-black text-white">
            {deal.discountRate}%
          </span>
        </div>
        <div className="min-w-0 sm:hidden">
          <p className="line-clamp-2 text-base font-black leading-snug text-slate-950">{deal.title}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {deal.mall} · {deal.category}
          </p>
          <p className="mt-1 text-[11px] font-black text-emerald-700">{getDealLinkTrustLabel(deal)}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Clock size={12} />
            {getRelativeTime(deal.createdAt)} · {getTimeLeft(deal.expiresAt)}
          </p>
        </div>
      </div>

      <div className="hidden min-w-0 sm:block">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-black text-dossa-red">{deal.discountRate}% 할인</span>
          {deal.isHot ? <span className="rounded-full bg-dossa-red px-2 py-0.5 text-[11px] font-black text-white">HOT</span> : null}
          {deal.isEndingSoon ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">마감임박</span> : null}
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700">{getDealLinkTrustLabel(deal)}</span>
          <span className="text-xs font-bold text-slate-500">
            {deal.mall} · {deal.category}
          </span>
        </div>
        <p className="mt-1 truncate text-base font-black text-slate-950">{deal.title}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
          <Clock size={13} />
          {getRelativeTime(deal.createdAt)} 등록 · {getTimeLeft(deal.expiresAt)}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
        <div className="min-w-0 text-right">
          <p className="text-xs font-semibold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</p>
          <p className="truncate text-xl font-black text-dossa-red">{formatPrice(deal.salePrice)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggleFavorite(deal.id)}
        aria-label={`${deal.title} ${isFavorite ? "찜 해제" : "찜하기"}`}
        aria-pressed={isFavorite}
        className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl border bg-white/95 shadow-sm transition ${
          isFavorite ? "border-red-100 text-dossa-red" : "border-slate-200 text-slate-400 hover:text-dossa-red"
        }`}
      >
        <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          type="button"
          onClick={() => onShareDeal(deal)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-100 hover:text-dossa-red"
          aria-label={`${deal.title} 공유하기`}
        >
          <Share2 size={17} />
        </button>
        <button
          type="button"
          onClick={() => linkAvailable && onOpenDeal(deal)}
          disabled={!linkAvailable}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm transition hover:bg-dossa-red disabled:cursor-not-allowed disabled:bg-slate-300"
          aria-label={linkAvailable ? `${deal.title} 판매처 이동 전 확인` : `${deal.title} 링크 확인 필요`}
        >
          <ExternalLink size={17} />
        </button>
      </div>
    </article>
  );
}

export function LiveDealFeed({
  deals,
  favorites,
  onToggleFavorite,
  onOpenDeal,
  onShareDeal
}: LiveDealFeedProps) {
  const leadDeals = [...deals]
    .sort((a, b) => Number(b.linkStatus === "verified") - Number(a.linkStatus === "verified") || Number(b.isHot) - Number(a.isHot))
    .slice(0, 10);
  const hotCount = leadDeals.filter((deal) => deal.isHot).length;
  const endingCount = leadDeals.filter((deal) => deal.isEndingSoon).length;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-dossa-red">
            <Radio size={14} />
            쇼핑몰별 특가
          </div>
          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">쇼핑몰 특가 모아보기</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            쿠팡, 네이버, G마켓, 11번가 등 쇼핑몰 특가는 채널별로 빠르게 확인하세요.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-slate-400">특가</p>
            <p className="mt-1 text-lg text-slate-950">{leadDeals.length}</p>
          </div>
          <div className="rounded-2xl bg-red-50 px-3 py-2">
            <p className="text-red-400">HOT</p>
            <p className="mt-1 text-lg text-dossa-red">{hotCount}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-3 py-2">
            <p className="text-amber-500">마감</p>
            <p className="mt-1 text-lg text-amber-700">{endingCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100">
        {leadDeals.map((deal) => (
          <LiveDealRow
            key={deal.id}
            deal={deal}
            isFavorite={favorites.includes(deal.id)}
            onToggleFavorite={onToggleFavorite}
            onOpenDeal={onOpenDeal}
            onShareDeal={onShareDeal}
          />
        ))}
      </div>

      <a
        href="#all-deals"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-dossa-red"
      >
        계속 특가 보기
        <Zap size={16} />
      </a>
    </section>
  );
}

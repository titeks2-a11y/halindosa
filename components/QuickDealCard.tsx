import Link from "next/link";
import { CheckCircle2, Clock, ExternalLink, Heart, Share2, ShoppingBag, Truck } from "lucide-react";
import { canOpenDealLink } from "@/lib/affiliate";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { getDealImageSrc } from "@/lib/imageSrc";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import { Deal } from "@/types/deal";

interface QuickDealCardProps {
  deal: Deal;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  onShareDeal: (deal: Deal) => void;
}

export function QuickDealCard({ deal, isFavorite, onToggleFavorite, onOpenDeal, onShareDeal }: QuickDealCardProps) {
  const linkAvailable = canOpenDealLink(deal);
  const verified = isVerifiedPurchaseLink(deal);
  const checkedAt = getRelativeTime(deal.priceCheckedAt);
  const timeLeft = getTimeLeft(deal.expiresAt);

  return (
    <article
      aria-label={`${deal.mallName} ${deal.title} 특가`}
      className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-100 hover:shadow-deal"
    >
      <Link href={`/deals/${deal.id}`} target="_blank" rel="noopener noreferrer" className="block" aria-label={`${deal.title} 상세 정보 새 탭으로 보기`}>
        <span className="relative block aspect-square overflow-hidden bg-gradient-to-br from-red-50 via-rose-50 to-orange-50">
          {deal.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getDealImageSrc(deal.imageUrl)}
              alt={`${deal.title} 상품 이미지`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center px-4 text-center text-dossa-red">
              <ShoppingBag size={32} />
              <span className="mt-2 line-clamp-2 text-sm font-black">{deal.title}</span>
            </span>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-dossa-red px-2.5 py-1 text-xs font-black text-white shadow-sm">
            {deal.discountRate}%
          </span>
          {deal.isHot ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white shadow-sm">HOT</span>
          ) : null}
          {deal.isFreeShipping ? (
            <span className="absolute bottom-2 right-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">무료배송</span>
          ) : null}
        </span>
      </Link>

      <div className="space-y-2.5 p-3">
        <div className="flex items-center justify-between gap-2 text-[11px] font-black">
          <span className="min-w-0 truncate text-dossa-red">{deal.mallName}</span>
          <span className="shrink-0 text-slate-400">{checkedAt}</span>
        </div>

        <Link href={`/deals/${deal.id}`} target="_blank" rel="noopener noreferrer" className="block" aria-label={`${deal.title} 상세 정보 새 탭으로 보기`}>
          <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950 transition hover:text-dossa-red sm:text-[15px]">
            {deal.title}
          </h3>
        </Link>

        <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_8px_22px_rgba(15,23,42,0.035)]" aria-label={`${deal.title} 구매 전 한눈에`}>
          <p className="mb-1.5 text-[11px] font-black text-slate-500">구매 전 한눈에</p>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-black">
            <span className={verified ? "rounded-xl bg-emerald-50 px-1.5 py-1.5 text-emerald-700" : "rounded-xl bg-amber-50 px-1.5 py-1.5 text-amber-700"}>
              {verified ? "링크 확인" : "확인 필요"}
            </span>
            <span className="rounded-xl bg-slate-50 px-1.5 py-1.5 text-slate-600">{checkedAt}</span>
            <span className="rounded-xl bg-slate-50 px-1.5 py-1.5 text-slate-600">{timeLeft}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
              <CheckCircle2 size={12} />
              구매처 확인
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
            <Truck size={12} />
            {deal.shipping}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
            <Clock size={12} />
            {timeLeft}
          </span>
        </div>

        <div
          className="rounded-2xl border border-red-50 bg-gradient-to-br from-red-50 via-white to-white px-3 py-2.5"
          aria-label={`${deal.title} 가격 요약`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex shrink-0 rounded-full bg-dossa-red px-2 py-1 text-[11px] font-black text-white shadow-sm">
              {deal.discountRate}% 할인
            </span>
            <span className="min-w-0 truncate text-[11px] font-bold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</span>
          </div>
          <div className="mt-1 flex items-end justify-between gap-2">
            <strong className="min-w-0 truncate text-xl font-black text-slate-950 sm:text-2xl">{formatPrice(deal.salePrice)}</strong>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
              {formatPrice(deal.discountAmount)} 아낌
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[44px_44px_1fr] gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(deal.id)}
            className={`inline-flex min-h-11 items-center justify-center rounded-2xl border transition ${
              isFavorite ? "border-red-100 bg-red-50 text-dossa-red" : "border-slate-200 bg-white text-slate-500 hover:text-dossa-red"
            }`}
            aria-label={`${deal.title} ${isFavorite ? "찜 해제" : "찜하기"}`}
            aria-pressed={isFavorite}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={() => onShareDeal(deal)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-dossa-red"
            aria-label={`${deal.title} 공유하기`}
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => linkAvailable && onOpenDeal(deal)}
            disabled={!linkAvailable}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-dossa-red disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label={linkAvailable ? `${deal.title} 판매처 이동 전 확인` : `${deal.title} 링크 확인 필요`}
          >
            구매하기
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

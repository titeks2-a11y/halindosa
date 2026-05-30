import Link from "next/link";
import { Clock, ExternalLink, Heart, Share2, ShoppingBag, Store, Tag, Truck } from "lucide-react";
import { getAffiliateDisclosure } from "@/lib/affiliate";
import { getDealImageSrc } from "@/lib/imageSrc";
import { Deal } from "@/types/deal";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import { DealTrustBadge } from "@/components/DealTrustBadge";

interface DealCardProps {
  deal: Deal;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  onShareDeal: (deal: Deal) => void;
}

export function DealCard({ deal, isFavorite, onToggleFavorite, onOpenDeal, onShareDeal }: DealCardProps) {
  return (
    <article className="group flex overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-red-100 hover:shadow-deal sm:block">
      <div className="relative flex min-h-[150px] w-[38%] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-red-50 via-rose-100 to-red-200 sm:aspect-[16/10] sm:min-h-0 sm:w-full">
        {deal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getDealImageSrc(deal.imageUrl)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="px-6 text-center">
            <ShoppingBag className="mx-auto mb-2 text-dossa-red" size={38} />
            <p className="text-sm font-black text-dossa-deep">{deal.mall}</p>
            <p className="mt-1 line-clamp-2 text-lg font-black text-slate-950">{deal.title}</p>
          </div>
        )}
        <button
          type="button"
          aria-label="찜하기"
          onClick={() => onToggleFavorite(deal.id)}
          className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition sm:right-3 sm:top-3 sm:h-10 sm:w-10 ${
            isFavorite ? "text-dossa-red" : "text-slate-400 hover:text-dossa-red"
          }`}
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {deal.isHot ? <span className="rounded-full bg-dossa-red px-2.5 py-1 text-xs font-black text-white">핫딜</span> : null}
          {deal.isNew ? <span className="hidden rounded-full bg-slate-950 px-2.5 py-1 text-xs font-black text-white sm:inline-flex">신규</span> : null}
          {deal.isEndingSoon ? <span className="hidden rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-slate-950 sm:inline-flex">마감임박</span> : null}
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1.5 sm:bottom-3 sm:right-3 sm:gap-2">
          <button
            type="button"
            onClick={() => onShareDeal(deal)}
            aria-label="특가 공유하기"
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/95 text-slate-600 shadow-md transition hover:text-dossa-red sm:h-10 sm:w-10"
          >
            <Share2 size={17} />
          </button>
          <button
            type="button"
            onClick={() => onOpenDeal(deal)}
            aria-label="특가 보러가기"
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-md transition hover:bg-dossa-red sm:h-10 sm:w-10"
          >
            <ExternalLink size={17} />
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2 p-3 sm:space-y-3 sm:p-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Store size={13} className="shrink-0 text-dossa-red" />
              <span className="truncate">{deal.mall}</span>
            </span>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-slate-600">{deal.category}</span>
          </div>
          <Link href={`/deals/${deal.id}`} className="block">
            <h3 className="line-clamp-2 text-[14px] font-black leading-snug text-slate-950 hover:text-dossa-red sm:min-h-[2.75rem] sm:text-base">
              {deal.title}
            </h3>
          </Link>
        </div>

        <div className="rounded-2xl bg-slate-50 p-2.5 sm:p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</p>
              <strong className="mt-0.5 block truncate text-lg font-black text-slate-950 sm:text-2xl">{formatPrice(deal.salePrice)}</strong>
            </div>
            <span className="shrink-0 rounded-xl bg-dossa-red px-2 py-1.5 text-sm font-black leading-none text-white sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xl">
              {deal.discountRate}%
            </span>
          </div>
          <p className="mt-1 text-xs font-black text-dossa-red sm:mt-2">{formatPrice(deal.discountAmount)} 절약</p>
        </div>

        <div className="hidden flex-wrap gap-1.5 sm:flex">
          <DealTrustBadge deal={deal} compact />
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            <Truck size={12} />
            {deal.shipping}
          </span>
          {deal.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-dossa-deep">
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-1 text-[11px] font-semibold text-slate-500 sm:grid-cols-2 sm:gap-2 sm:text-xs">
          <span>{getRelativeTime(deal.createdAt)} 등록</span>
          <span className="inline-flex items-center justify-end gap-1 text-right">
            <Clock size={13} />
            {getTimeLeft(deal.expiresAt)}
          </span>
        </div>

        <p className="hidden line-clamp-2 rounded-2xl bg-white px-0 py-0 text-xs font-bold leading-5 text-slate-500 sm:block">
          {getAffiliateDisclosure(deal)}
        </p>

        <Link href={`/deals/${deal.id}`} className="block text-center text-xs font-black text-slate-500 hover:text-dossa-red">
          상세 정보와 가격 신고
        </Link>
      </div>
    </article>
  );
}

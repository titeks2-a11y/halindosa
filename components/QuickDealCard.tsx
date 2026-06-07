import Link from "next/link";
import { CheckCircle2, Clock, ExternalLink, Heart, Share2, ShoppingBag, Truck } from "lucide-react";
import { canOpenDealLink } from "@/lib/affiliate";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { getDealImageSrc, getGeneratedDealImageSrc } from "@/lib/imageSrc";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import { Deal } from "@/types/deal";
import { CommerceBadge } from "@/components/ui/CommerceBadge";

interface QuickDealCardProps {
  deal: Deal;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  onShareDeal: (deal: Deal) => void;
  referenceNow?: number;
}

export function QuickDealCard({ deal, isFavorite, onToggleFavorite, onOpenDeal, onShareDeal, referenceNow }: QuickDealCardProps) {
  const linkAvailable = canOpenDealLink(deal);
  const verified = isVerifiedPurchaseLink(deal);
  const checkedAt = getRelativeTime(deal.priceCheckedAt, referenceNow);
  const timeLeft = getTimeLeft(deal.expiresAt, referenceNow);
  const benefitLabel = getBenefitTypeLabel(deal.dealType);
  const isBenefitFocused = ["freebie", "coupon", "experience", "event", "point", "foodDelivery", "convenienceStore", "mart"].includes(deal.dealType);
  const customerClaimCta = deal.claimCta && !/(판매처|확인)/.test(deal.claimCta) ? deal.claimCta : "";
  const primaryBadge = isBenefitFocused ? benefitLabel : `${deal.discountRate}%`;
  const primaryCta = isBenefitFocused ? customerClaimCta || "혜택 받기" : "구매하기";

  return (
    <article
      aria-label={`${deal.mallName} ${deal.title} 특가`}
      className="group flex min-h-[92px] overflow-hidden rounded-2xl border border-brand-line bg-brand-surface shadow-lift transition hover:-translate-y-0.5 hover:border-orange-100 hover:shadow-commerce sm:block sm:min-h-0 sm:rounded-[20px]"
    >
      <Link
        href={`/deals/${deal.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-[26%] max-w-[76px] shrink-0 sm:w-full sm:max-w-none"
        aria-label={`${deal.title} 상세 정보 새 탭으로 보기`}
      >
        <span className="relative block h-full min-h-[92px] overflow-hidden bg-gradient-to-br from-brand-warm via-white to-orange-50 sm:aspect-[4/3] sm:h-auto sm:min-h-0">
          {deal.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getDealImageSrc(deal.imageUrl)}
              alt={`${deal.title} 상품 이미지`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(event) => {
                const image = event.currentTarget;
                if (image.dataset.fallbackApplied === "true") return;
                image.dataset.fallbackApplied = "true";
                image.src = getGeneratedDealImageSrc(deal.category, deal.dealType);
              }}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center px-4 text-center text-dossa-red">
              <ShoppingBag size={32} />
              <span className="mt-2 line-clamp-2 text-sm font-black">{deal.title}</span>
            </span>
          )}
          <span
            className={`absolute left-1.5 top-1.5 max-w-[82%] truncate rounded-full px-2 py-0.5 text-[11px] font-black text-white shadow-sm sm:left-2 sm:top-2 sm:px-2.5 sm:py-1 ${
              isBenefitFocused ? "bg-brand-navy" : "commerce-gradient"
            }`}
          >
            {primaryBadge}
          </span>
          {deal.isHot ? (
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-black text-white shadow-sm sm:bottom-2 sm:left-2 sm:px-2.5 sm:py-1 sm:text-[11px]">HOT</span>
          ) : null}
          {deal.isFreeShipping ? (
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-dossa-red shadow-sm sm:bottom-2 sm:right-2 sm:px-2.5 sm:py-1 sm:text-[11px]">무료배송</span>
          ) : null}
        </span>
      </Link>

      <div className="min-w-0 flex-1 space-y-0.5 p-1.5 sm:space-y-2 sm:p-3">
        <div className="flex items-center justify-between gap-2 text-[11px] font-black">
          <span className="min-w-0 truncate text-dossa-red">{deal.mallName}</span>
          <span className="shrink-0 text-slate-400" suppressHydrationWarning>
            {checkedAt}
          </span>
        </div>

        <Link href={`/deals/${deal.id}`} target="_blank" rel="noopener noreferrer" className="block" aria-label={`${deal.title} 상세 정보 새 탭으로 보기`}>
          <h3 className="line-clamp-2 min-h-[1.55rem] text-[12px] font-black leading-[0.82rem] text-slate-950 transition hover:text-dossa-red sm:min-h-[2.35rem] sm:text-[15px] sm:leading-5">
            {deal.title}
          </h3>
        </Link>

        <div className="hidden rounded-2xl border border-brand-line bg-white/75 p-1.5 sm:block" aria-label={`${deal.title} 구매 전 한눈에`}>
          <div className="mb-1 flex items-center justify-between gap-2 px-1">
            <p className="text-[10px] font-black text-slate-500">구매 전 한눈에</p>
            <p className="truncate text-[10px] font-bold text-slate-400">{deal.category}</p>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-black">
            <span className={verified ? "rounded-xl bg-emerald-50 px-1.5 py-1.5 text-emerald-700" : "rounded-xl bg-amber-50 px-1.5 py-1.5 text-amber-700"}>
              {verified ? "직접링크" : "확인 필요"}
            </span>
            <span className="rounded-xl bg-white px-1.5 py-1.5 text-slate-600">{deal.shipping}</span>
            <span className="rounded-xl bg-white px-1.5 py-1.5 text-slate-600" suppressHydrationWarning>
              {timeLeft}
            </span>
          </div>
        </div>

        <div className="hidden flex-wrap gap-1 sm:flex">
          {verified ? (
            <CommerceBadge tone="success" className="px-2 py-0.5 text-[10px]">
              <CheckCircle2 size={12} />
              직접 링크 확인
            </CommerceBadge>
          ) : null}
          {isBenefitFocused ? (
            <CommerceBadge tone="primary" className="px-2 py-0.5 text-[10px]">
              {benefitLabel}
            </CommerceBadge>
          ) : null}
          <CommerceBadge tone="neutral" className="px-2 py-0.5 text-[10px]">
            <Truck size={12} />
            {deal.shipping}
          </CommerceBadge>
          <CommerceBadge tone={deal.isEndingSoon ? "warning" : "neutral"} className="px-2 py-0.5 text-[10px]">
            <Clock size={12} />
            <span suppressHydrationWarning>{timeLeft}</span>
          </CommerceBadge>
        </div>

        <div
          className="rounded-xl border border-brand-line bg-gradient-to-br from-white via-white to-orange-50 px-2 py-0.5 sm:rounded-2xl sm:px-2.5 sm:py-2"
          aria-label={`${deal.title} 가격 요약`}
        >
          <p className="sr-only">압축 가격 카드</p>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex shrink-0 rounded-full commerce-gradient px-2 py-0.5 text-[10px] font-black text-white shadow-sm sm:py-1 sm:text-[11px]">
              {isBenefitFocused ? benefitLabel : `${deal.discountRate}% 할인`}
            </span>
            <span className="min-w-0 truncate text-[10px] font-bold text-slate-400 line-through sm:text-[11px]">{formatPrice(deal.originalPrice)}</span>
          </div>
          <div className="mt-0.5 flex items-end justify-between gap-2 sm:mt-1">
            <strong className="min-w-0 truncate text-[13px] font-black text-slate-950 sm:text-[19px] md:text-2xl">{formatPrice(deal.salePrice)}</strong>
            <span className="hidden shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-dossa-red shadow-sm sm:inline-flex">
              {formatPrice(deal.discountAmount)} 아낌
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[30px_30px_1fr] gap-1 sm:grid-cols-[40px_40px_1fr] sm:gap-1.5">
          <button
            type="button"
            onClick={() => onToggleFavorite(deal.id)}
            className={`inline-flex min-h-9 items-center justify-center rounded-xl border transition sm:min-h-10 sm:rounded-2xl ${
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
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-dossa-red sm:min-h-10 sm:rounded-2xl"
            aria-label={`${deal.title} 공유하기`}
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => linkAvailable && onOpenDeal(deal)}
            disabled={!linkAvailable}
            className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-brand-navy px-2 text-[11px] font-black text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:bg-slate-300 sm:min-h-10 sm:gap-1.5 sm:rounded-2xl sm:px-3 sm:text-xs"
            aria-label={linkAvailable ? `${deal.title} 판매처 이동 전 확인` : `${deal.title} 링크 확인 필요`}
          >
            <span className="truncate">{primaryCta}</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

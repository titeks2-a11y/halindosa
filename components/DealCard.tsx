import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Heart, Share2, ShoppingBag, Store, Tag, Truck } from "lucide-react";
import { canOpenDealLink, getAffiliateDisclosure, getDealLinkTrustLabel } from "@/lib/affiliate";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { getDealQualityNotice, isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { getDealPurchaseConfidenceLabel } from "@/lib/deals/linkValidator";
import { getDealImageSrc, getGeneratedDealImageSrc } from "@/lib/imageSrc";
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
  const linkAvailable = canOpenDealLink(deal);
  const linkVerified = isVerifiedPurchaseLink(deal);
  const qualityNotice = getDealQualityNotice(deal);
  const LinkTrustIcon = linkVerified ? CheckCircle2 : AlertTriangle;
  const purchaseCheckItems = [
    { label: "링크", value: getDealLinkTrustLabel(deal) },
    { label: "가격", value: getRelativeTime(deal.priceCheckedAt) },
    { label: "마감", value: getTimeLeft(deal.expiresAt) }
  ];
  const benefitConditionItems = [
    {
      label: "회원가입",
      value: deal.requiresSignup ? "필요 가능" : "불필요"
    },
    {
      label: "선착순",
      value: deal.isFirstComeFirstServed ? "먼저 확인" : "표시 없음"
    },
    {
      label: "배송비",
      value: deal.shippingFee || deal.shipping
    },
    {
      label: "쿠폰 조건",
      value: deal.couponCondition || (deal.minimumOrderAmount ? `${formatPrice(deal.minimumOrderAmount)} 이상` : "별도 없음")
    }
  ];
  const sourceLabel = deal.sourceName || deal.mallName;
  const reportLabel = deal.reportCount > 0 ? `신고 ${deal.reportCount}건 검토` : "신고 없음";
  const reportReviewItems = [
    deal.linkStatus === "verified" ? "실제 링크 확인" : "판매처 확인 필요",
    deal.reportCount > 0 ? "신고 우선 검토" : "신고 낮음",
    deal.isExpired || deal.isSoldOut ? "종료 가능" : "진행 확인"
  ];

  return (
    <article
      aria-label={`${deal.mallName} ${deal.title} 특가`}
      className="group flex overflow-hidden rounded-[22px] border border-brand-line bg-brand-surface shadow-lift transition hover:-translate-y-1 hover:border-red-100 hover:shadow-commerce sm:block"
    >
      <div className="relative flex min-h-[150px] w-[38%] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-warm via-white to-orange-50 sm:aspect-[16/10] sm:min-h-0 sm:w-full">
        {deal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getDealImageSrc(deal.imageUrl)}
            alt={deal.title}
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
          <div className="px-6 text-center">
            <ShoppingBag className="mx-auto mb-2 text-dossa-red" size={38} />
            <p className="text-sm font-black text-dossa-deep">{deal.mall}</p>
            <p className="mt-1 line-clamp-2 text-lg font-black text-slate-950">{deal.title}</p>
          </div>
        )}
        <button
          type="button"
          aria-label={`${deal.title} ${isFavorite ? "찜 해제" : "찜하기"}`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(deal.id)}
          className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition sm:right-3 sm:top-3 sm:h-10 sm:w-10 ${
            isFavorite ? "text-dossa-red" : "text-slate-400 hover:text-dossa-red"
          }`}
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {deal.isHot ? <span className="rounded-full commerce-gradient px-2.5 py-1 text-xs font-black text-white">핫딜</span> : null}
          {deal.isNew ? <span className="hidden rounded-full bg-brand-navy px-2.5 py-1 text-xs font-black text-white sm:inline-flex">신규</span> : null}
          {deal.isEndingSoon ? <span className="hidden rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-slate-950 sm:inline-flex">마감임박</span> : null}
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1.5 sm:bottom-3 sm:right-3 sm:gap-2">
          <button
            type="button"
            onClick={() => onShareDeal(deal)}
            aria-label={`${deal.title} 공유하기`}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/95 text-slate-600 shadow-md transition hover:text-dossa-red sm:h-10 sm:w-10"
          >
            <Share2 size={17} />
          </button>
          <button
            type="button"
            onClick={() => linkAvailable && onOpenDeal(deal)}
            disabled={!linkAvailable}
            aria-label={linkAvailable ? `${deal.title} 판매처 이동 전 확인` : `${deal.title} 링크 확인 필요`}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-navy text-white shadow-md transition hover:bg-dossa-red disabled:cursor-not-allowed disabled:bg-slate-300 sm:h-10 sm:w-10"
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
          <Link href={`/deals/${deal.id}`} className="block" aria-label={`${deal.title} 상세 정보 보기`} target="_blank" rel="noopener noreferrer">
            <h3 className="line-clamp-2 text-[14px] font-black leading-snug text-slate-950 hover:text-dossa-red sm:min-h-[2.75rem] sm:text-base">
              {deal.title}
            </h3>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${
              linkVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            <LinkTrustIcon size={12} />
            <span className="truncate">{getDealLinkTrustLabel(deal)}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
            <Truck size={12} />
            {deal.shipping}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
            <Clock size={12} />
            {getTimeLeft(deal.expiresAt)}
          </span>
        </div>
        <p className="text-[11px] font-bold text-slate-500">
          {getDealPurchaseConfidenceLabel(deal)} · 가격 기준 {getRelativeTime(deal.priceCheckedAt)}
        </p>

        <div className="hidden grid-cols-2 gap-1.5 rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:grid" aria-label={`${deal.title} 출처와 신고 상태`}>
          <div className="min-w-0 rounded-xl bg-slate-50 px-2 py-1.5">
            <p className="text-[10px] font-black text-slate-400">출처</p>
            <p className="mt-0.5 truncate text-[11px] font-black text-slate-800">{sourceLabel}</p>
          </div>
          <div className="min-w-0 rounded-xl bg-slate-50 px-2 py-1.5">
            <p className="text-[10px] font-black text-slate-400">신고 상태</p>
            <p className={`mt-0.5 truncate text-[11px] font-black ${deal.reportCount > 0 ? "text-amber-700" : "text-slate-800"}`}>
              {reportLabel}
            </p>
          </div>
        </div>

        <div className="hidden rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 sm:block" aria-label={`${deal.title} 품질 안내`}>
          <p className="text-[11px] font-black text-slate-700">품질 안내: {qualityNotice.label}</p>
          <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-slate-500">{qualityNotice.description}</p>
        </div>

        <div className="hidden rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 lg:block" aria-label={`${deal.title} 신고 처리 기준`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black text-amber-900">신고 처리 기준</p>
            <Link href={`/reports?dealId=${deal.id}&reason=wrong_info`} className="shrink-0 text-[11px] font-black text-amber-800 underline-offset-2 hover:underline">
              바로 신고
            </Link>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {reportReviewItems.map((item) => (
              <span key={item} className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-amber-800 shadow-sm">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-4 text-amber-900/75">
            링크 오류, 품절, 종료 신고는 운영 점검 큐에 반영하고 구매 전 최종 조건은 판매처에서 확인합니다.
          </p>
        </div>

        <div className="rounded-2xl bg-orange-50 px-3 py-2">
          <p className="text-[11px] font-black text-dossa-red">{getBenefitTypeLabel(deal.dealType)}</p>
          <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-700">{deal.benefitSummary}</p>
        </div>

        <div className="hidden rounded-2xl border border-red-100 bg-white p-2 xl:block" aria-label={`${deal.title} 혜택 조건 요약`}>
          <p className="mb-1.5 text-[11px] font-black text-dossa-red">혜택 조건</p>
          <div className="grid grid-cols-2 gap-1.5">
            {benefitConditionItems.map((item) => (
              <div key={item.label} className="min-w-0 rounded-xl bg-red-50/70 px-2 py-1.5">
                <p className="text-[10px] font-black text-red-400">{item.label}</p>
                <p className="mt-0.5 truncate text-[11px] font-black text-dossa-deep">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)] lg:block" aria-label={`${deal.title} 구매 전 체크`}>
          <p className="mb-1.5 text-[11px] font-black text-slate-500">구매 전 체크</p>
          <div className="grid grid-cols-3 gap-1.5">
            {purchaseCheckItems.map((item) => (
              <div key={item.label} className="min-w-0 rounded-xl bg-slate-50 px-2 py-1.5">
                <p className="text-[10px] font-black text-slate-400">{item.label}</p>
                <p className="mt-0.5 truncate text-[11px] font-black text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-line bg-white/80 p-2.5 sm:p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</p>
              <strong className="mt-0.5 block truncate text-lg font-black text-slate-950 sm:text-2xl">{formatPrice(deal.salePrice)}</strong>
            </div>
            <span className="shrink-0 rounded-xl commerce-gradient px-2 py-1.5 text-sm font-black leading-none text-white sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xl">
              {deal.discountRate}%
            </span>
          </div>
          <p className="mt-1 text-xs font-black text-dossa-red sm:mt-2">{formatPrice(deal.discountAmount)} 절약</p>
        </div>

        <div className="hidden flex-wrap gap-1.5 md:flex">
          <DealTrustBadge deal={deal} compact />
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
          <span className="sm:col-span-2">가격 기준 {getRelativeTime(deal.priceCheckedAt)}</span>
        </div>

        <p className="hidden line-clamp-2 rounded-2xl bg-white px-0 py-0 text-xs font-bold leading-5 text-slate-500 sm:block">
          {getAffiliateDisclosure(deal)}
        </p>

        <div className="grid grid-cols-[0.75fr_0.75fr_1fr] gap-2 pt-1">
          <Link
            href={`/deals/${deal.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-red-100 hover:text-dossa-red"
            aria-label={`${deal.title} 상세 정보와 가격 신고 보기`}
           target="_blank" rel="noopener noreferrer">
            상세 보기
          </Link>
          <Link
            href={`/reports?dealId=${deal.id}&reason=link_error`}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-red-100 hover:text-dossa-red"
            aria-label={`${deal.title} 품절 또는 링크 오류 신고하기`}
          >
            신고
          </Link>
          <button
            type="button"
            onClick={() => linkAvailable && onOpenDeal(deal)}
            disabled={!linkAvailable}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-brand-navy px-3 text-xs font-black text-white transition hover:bg-dossa-red disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label={linkAvailable ? `${deal.title} 구매 전 판매처 확인` : `${deal.title} 링크 확인 필요`}
          >
            판매처 확인
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

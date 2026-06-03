"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { getAffiliateDisclosure, getDealLinkTrustLabel, resolveDealDestinationUrl } from "@/lib/affiliate";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { getDealPurchaseConfidenceLabel } from "@/lib/deals/linkValidator";
import { formatPrice, getRelativeTime } from "@/lib/format";
import { Deal } from "@/types/deal";
import { CommerceBadge } from "@/components/ui/CommerceBadge";
import { CommerceButton, commerceButtonClassName } from "@/components/ui/CommerceButton";
import { CommerceCard } from "@/components/ui/CommerceCard";
import { CommerceModal } from "@/components/ui/CommerceModal";

interface PurchaseConfirmSheetProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deal: Deal) => void;
}

function getDestinationHost(deal: Deal) {
  try {
    return new URL(resolveDealDestinationUrl(deal)).hostname.replace(/^www\./, "");
  } catch {
    return deal.mallName;
  }
}

export function PurchaseConfirmSheet({ deal, isOpen, onClose, onConfirm }: PurchaseConfirmSheetProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !deal) return null;

  const isVerified = isVerifiedPurchaseLink(deal);
  const StatusIcon = isVerified ? CheckCircle2 : AlertTriangle;
  const destinationHost = getDestinationHost(deal);

  return (
    <CommerceModal
      eyebrow="판매처 이동 전 확인"
      title={deal.title}
      description={`${deal.mallName} · 가격 기준 ${getRelativeTime(deal.priceCheckedAt)}`}
      onClose={onClose}
    >
      <div className="space-y-3 p-4 sm:p-5">
        <CommerceBadge tone="neutral">이동 예정 판매처: {destinationHost}</CommerceBadge>

        <CommerceCard tone="highlight" className="p-4">
          <p className="text-xs font-bold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</p>
          <div className="mt-1 flex items-end gap-2">
            <strong className="text-2xl font-black text-dossa-red">{formatPrice(deal.salePrice)}</strong>
            <span className="commerce-gradient rounded-xl px-2.5 py-1 text-sm font-black text-white">{deal.discountRate}%</span>
          </div>
          <p className="mt-2 text-xs font-black text-dossa-deep">{deal.shipping}</p>
        </CommerceCard>

        <CommerceCard tone={isVerified ? "trust" : "warning"} className="flex items-start gap-3 p-4">
          <StatusIcon className={isVerified ? "text-emerald-700" : "text-amber-700"} size={20} />
          <div>
            <p className={`text-sm font-black ${isVerified ? "text-emerald-800" : "text-amber-800"}`}>
              {getDealLinkTrustLabel(deal)}
            </p>
            <p className={`mt-1 text-xs font-semibold leading-5 ${isVerified ? "text-emerald-700" : "text-amber-800"}`}>
              {isVerified
                ? "확인된 판매처 링크를 통해 이동합니다. 결제 전 옵션가와 쿠폰 조건은 다시 확인하세요."
                : "판매처에서 상품명, 가격, 옵션 조건을 한 번 더 확인한 뒤 구매하세요."}
            </p>
            <p className={`mt-2 text-xs font-black ${isVerified ? "text-emerald-800" : "text-amber-900"}`}>
              {getDealPurchaseConfidenceLabel(deal)} · 링크 확인 {getRelativeTime(deal.checkedAt)}
            </p>
          </div>
        </CommerceCard>

        <CommerceCard tone="subtle" className="bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
            <ShieldCheck size={18} className="text-dossa-red" />
            구매 전 체크
          </div>
          <ul className="mt-3 space-y-1.5 text-xs font-semibold leading-5 text-slate-600">
            <li>판매처의 최종 가격, 배송비, 쿠폰 적용 여부를 확인하세요.</li>
            <li>품절, 옵션가, 카드 할인 조건은 실시간으로 달라질 수 있습니다.</li>
            <li>판매처 도메인이 예상과 다르면 이동하지 말고 가격/품절 신고를 남겨주세요.</li>
            <li>{getAffiliateDisclosure(deal)}</li>
          </ul>
        </CommerceCard>

        <Link
          href={`/reports?dealId=${deal.id}&reason=price_changed`}
          className={commerceButtonClassName({ tone: "danger", size: "lg", className: "w-full justify-between text-left" })}
        >
          <span>
            <span className="block text-sm font-black text-amber-900">가격이나 품절 정보가 다르다면</span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-amber-800">할인도사 확인 요청으로 바로 알려주세요.</span>
          </span>
          <AlertTriangle size={19} className="shrink-0 text-amber-700" />
        </Link>
      </div>

      <div className="grid grid-cols-[0.7fr_1fr] gap-2 border-t border-brand-line p-4 sm:p-5">
        <CommerceButton onClick={onClose} tone="neutral" size="lg">
          취소
        </CommerceButton>
        <CommerceButton onClick={() => onConfirm(deal)} tone="navy" size="lg">
          판매처로 이동
          <ExternalLink size={17} />
        </CommerceButton>
      </div>
    </CommerceModal>
  );
}

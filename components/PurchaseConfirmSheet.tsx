"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, X } from "lucide-react";
import { getAffiliateDisclosure, getDealLinkTrustLabel } from "@/lib/affiliate";
import { formatPrice, getRelativeTime } from "@/lib/format";
import { Deal } from "@/types/deal";

interface PurchaseConfirmSheetProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deal: Deal) => void;
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

  const isVerified = deal.linkStatus === "verified";
  const StatusIcon = isVerified ? CheckCircle2 : AlertTriangle;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-8 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${deal.title} 판매처 이동 확인`}
        className="w-full max-w-[480px] overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-950/5 sm:max-w-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-black text-dossa-red">판매처 이동 전 확인</p>
            <h2 className="mt-1 line-clamp-2 text-lg font-black leading-snug text-slate-950">{deal.title}</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {deal.mallName} · 가격 기준 {getRelativeTime(deal.priceCheckedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <div className="rounded-3xl bg-red-50 p-4">
            <p className="text-xs font-bold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</p>
            <div className="mt-1 flex items-end gap-2">
              <strong className="text-2xl font-black text-dossa-red">{formatPrice(deal.salePrice)}</strong>
              <span className="rounded-xl bg-dossa-red px-2.5 py-1 text-sm font-black text-white">{deal.discountRate}%</span>
            </div>
            <p className="mt-2 text-xs font-black text-dossa-deep">{deal.shipping}</p>
          </div>

          <div className={`flex items-start gap-3 rounded-3xl p-4 ${isVerified ? "bg-emerald-50" : "bg-amber-50"}`}>
            <StatusIcon className={isVerified ? "text-emerald-700" : "text-amber-700"} size={20} />
            <div>
              <p className={`text-sm font-black ${isVerified ? "text-emerald-800" : "text-amber-800"}`}>
                {getDealLinkTrustLabel(deal)}
              </p>
              <p className={`mt-1 text-xs font-semibold leading-5 ${isVerified ? "text-emerald-700" : "text-amber-800"}`}>
                {isVerified
                  ? "확인된 판매처 링크를 통해 이동합니다. 결제 전 옵션가와 쿠폰 조건은 다시 확인하세요."
                  : "대표 페이지가 아닌 판매처 검색 결과로 이동합니다. 상품명과 가격 조건이 맞는지 직접 확인해야 합니다."}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
              <ShieldCheck size={18} className="text-dossa-red" />
              구매 전 체크
            </div>
            <ul className="mt-3 space-y-1.5 text-xs font-semibold leading-5 text-slate-600">
              <li>판매처의 최종 가격, 배송비, 쿠폰 적용 여부를 확인하세요.</li>
              <li>품절, 옵션가, 카드 할인 조건은 실시간으로 달라질 수 있습니다.</li>
              <li>{getAffiliateDisclosure(deal)}</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-[0.7fr_1fr] gap-2 border-t border-slate-100 p-4 sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(deal)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-dossa-red"
          >
            판매처로 이동
            <ExternalLink size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Heart, Share2 } from "lucide-react";
import { Deal } from "@/types/deal";
import { buildDealRedirectUrl } from "@/lib/redirectUrl";
import { canOpenDealLink } from "@/lib/affiliate";
import { hasAffiliateConsent, hasAnalyticsConsent, readStoredConsent } from "@/lib/consent";
import { rememberRecentDealId } from "@/lib/recentDeals";
import { PurchaseConfirmSheet } from "@/components/PurchaseConfirmSheet";

const favoriteKey = "halindosa:favorites";

async function isNativeRuntime() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function DealDetailActions({ deal }: { deal: Deal }) {
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isFavorite, setIsFavorite] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = window.localStorage.getItem(favoriteKey);
      const favorites = stored ? (JSON.parse(stored) as string[]) : [];
      return favorites.includes(deal.id);
    } catch {
      return false;
    }
  });

  const toggleFavorite = () => {
    try {
      const stored = window.localStorage.getItem(favoriteKey);
      const favorites = stored ? (JSON.parse(stored) as string[]) : [];
      const next = favorites.includes(deal.id) ? favorites.filter((id) => id !== deal.id) : [...favorites, deal.id];
      window.localStorage.setItem(favoriteKey, JSON.stringify(next));
      setIsFavorite(next.includes(deal.id));
      setMessage(next.includes(deal.id) ? "관심 특가에 저장했습니다." : "관심 특가에서 제거했습니다.");
    } catch {
      setIsFavorite((value) => {
        const next = !value;
        setMessage(next ? "관심 특가에 저장했습니다." : "관심 특가에서 제거했습니다.");
        return next;
      });
    }
  };

  const openPurchase = () => {
    if (!canOpenDealLink(deal)) {
      setMessage("이 특가는 링크 확인이 필요합니다.");
      return;
    }
    setShowPurchaseConfirm(true);
  };

  const confirmPurchase = async () => {
    setShowPurchaseConfirm(false);
    rememberRecentDealId(deal.id);
    const consent = readStoredConsent();
    const redirectUrl = buildDealRedirectUrl(deal.id, "detail", {
      analytics: hasAnalyticsConsent(consent),
      affiliate: hasAffiliateConsent(consent)
    });

    if (await isNativeRuntime()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: redirectUrl });
      return;
    }

    window.open(redirectUrl, "_blank", "noopener,noreferrer");
  };

  const shareDeal = async () => {
    const shareUrl = `${window.location.origin}/deals/${deal.id}`;
    const text = `${deal.mall} ${deal.title} ${deal.discountRate}% 할인`;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void>; clipboard?: Clipboard };

    try {
      if (nav.share) {
        await nav.share({ title: `할인도사 - ${deal.title}`, text, url: shareUrl });
        setMessage("특가 공유를 열었습니다.");
        return;
      }

      if (nav.clipboard) {
        await nav.clipboard.writeText(`${text}\n${shareUrl}`);
        setMessage("특가 링크를 복사했습니다.");
        return;
      }

      setMessage("공유 기능을 사용할 수 없습니다.");
    } catch {
      setMessage("공유를 취소했습니다.");
    }
  };

  return (
    <>
      <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <button
          type="button"
          onClick={openPurchase}
          disabled={!canOpenDealLink(deal)}
          aria-label={canOpenDealLink(deal) ? `${deal.title} 구매 전 판매처 확인` : `${deal.title} 링크 확인 필요`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-dossa-red px-5 py-3 text-sm font-black text-white transition hover:bg-dossa-deep disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {canOpenDealLink(deal) ? "구매 전 판매처 확인" : "링크 확인 필요"}
          <ExternalLink size={17} />
        </button>
        <button
          type="button"
          onClick={toggleFavorite}
          aria-pressed={isFavorite}
          aria-label={`${deal.title} ${isFavorite ? "관심 특가에서 제거" : "관심 특가에 저장"}`}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black transition ${
            isFavorite
              ? "border-red-100 bg-red-50 text-dossa-red"
              : "border-slate-200 bg-white text-slate-700 hover:border-red-100 hover:text-dossa-red"
          }`}
        >
          <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
          관심 특가
        </button>
        <button
          type="button"
          onClick={shareDeal}
          aria-label={`${deal.title} 공유하기`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-red-100 hover:text-dossa-red"
        >
          <Share2 size={17} />
          공유하기
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-red-100 hover:text-dossa-red"
        >
          <ArrowLeft size={17} />
          홈으로
        </Link>
      </div>
      {message ? (
        <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">
          {message}
        </p>
      ) : null}
      <PurchaseConfirmSheet
        deal={deal}
        isOpen={showPurchaseConfirm}
        onClose={() => setShowPurchaseConfirm(false)}
        onConfirm={() => {
          void confirmPurchase();
        }}
      />
    </>
  );
}

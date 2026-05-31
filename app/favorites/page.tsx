"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Heart, Sparkles } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { LoginPromptSheet } from "@/components/LoginPromptSheet";
import { PurchaseConfirmSheet } from "@/components/PurchaseConfirmSheet";
import { useAuth } from "@/components/AuthProvider";
import { mockDeals } from "@/data/mockDeals";
import { canOpenDealLink } from "@/lib/affiliate";
import { hasAffiliateConsent, hasAnalyticsConsent, readStoredConsent } from "@/lib/consent";
import { getLinkQualityScore, isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { formatPrice } from "@/lib/format";
import { buildDealRedirectUrl, buildNativeSafeDealUrl } from "@/lib/redirectUrl";
import { readLocalFavoriteIds, recordRecentDealView, syncFavoritesWithSupabase, toggleFavoriteSynced } from "@/lib/memberSync";
import { Deal } from "@/types/deal";

interface DealsResponse {
  deals?: Deal[];
}

async function openExternalDeal(deal: Deal) {
  await recordRecentDealView(deal.id);
  const consent = readStoredConsent();
  const redirectUrl = buildDealRedirectUrl(deal.id, "favorites", {
    analytics: hasAnalyticsConsent(consent),
    affiliate: hasAffiliateConsent(consent)
  });

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({
        url: buildNativeSafeDealUrl(deal, "favorites", {
          analytics: hasAnalyticsConsent(consent),
          affiliate: hasAffiliateConsent(consent)
        })
      });
      return;
    }
  } catch {
    // Browser fallback below.
  }

  window.open(redirectUrl, "_blank", "noopener,noreferrer");
}

export default function FavoritesPage() {
  const { configured: authConfigured, user } = useAuth();
  const userId = user?.id;
  const [pendingPurchaseDeal, setPendingPurchaseDeal] = useState<Deal | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [message, setMessage] = useState("");
  const [catalog, setCatalog] = useState<Deal[]>(mockDeals);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => readLocalFavoriteIds());

  const favoriteDeals = useMemo(() => catalog.filter((deal) => favorites.includes(deal.id)), [catalog, favorites]);
  const recommendedDeals = useMemo(
    () =>
      [...catalog]
        .filter((deal) => !favorites.includes(deal.id) && canOpenDealLink(deal))
        .sort(
          (a, b) =>
            Number(isVerifiedPurchaseLink(b)) - Number(isVerifiedPurchaseLink(a)) ||
            getLinkQualityScore(b) - getLinkQualityScore(a) ||
            Number(b.isHot) - Number(a.isHot) ||
            b.likeCount - a.likeCount ||
            b.discountRate - a.discountRate
        )
        .slice(0, 3),
    [catalog, favorites]
  );

  useEffect(() => {
    let active = true;

    async function fetchCatalog() {
      setIsCatalogLoading(true);

      try {
        const response = await fetch("/api/deals?sort=latest", { cache: "no-store" });
        const data = (await response.json()) as DealsResponse;
        if (active && Array.isArray(data.deals) && data.deals.length) {
          setCatalog(data.deals);
        }
      } catch {
        if (active) {
          setCatalog(mockDeals);
        }
      } finally {
        if (active) {
          setIsCatalogLoading(false);
        }
      }
    }

    void fetchCatalog();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => (authConfigured && userId ? syncFavoritesWithSupabase() : readLocalFavoriteIds()))
      .then((ids) => {
        if (active) setFavorites(ids);
      })
      .catch(() => {
        if (active) setFavorites(readLocalFavoriteIds());
      });

    return () => {
      active = false;
    };
  }, [authConfigured, userId]);

  const toggleFavorite = (id: string) => {
    if (authConfigured && !user) {
      setShowLoginPrompt(true);
      setMessage("로그인하면 찜한 특가를 계정으로 이어볼 수 있습니다.");
      return;
    }

    setFavorites((current) => {
      const wasFavorite = current.includes(id);
      const optimistic = wasFavorite ? current.filter((favoriteId) => favoriteId !== id) : [id, ...current];
      setMessage(wasFavorite ? "찜 목록에서 제거했습니다." : "찜 목록에 저장했습니다.");
      void toggleFavoriteSynced(id, current)
        .then((next) => setFavorites(next))
        .catch(() => setMessage("네트워크가 불안정해 기기 저장소에 우선 반영했습니다."));
      return optimistic;
    });
  };

  const shareDeal = async (deal: Deal) => {
    const shareUrl = `${window.location.origin}/deals/${deal.id}`;
    const text = `${deal.mall} ${deal.title} ${deal.discountRate}% 할인`;

    try {
      const nav = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
        clipboard?: Clipboard;
      };

      if (nav.share) {
        await nav.share({ title: `할인도사 - ${deal.title}`, text, url: shareUrl });
        setMessage("특가 공유를 열었습니다.");
        return;
      }

      await nav.clipboard?.writeText(`${text}\n${shareUrl}`);
      setMessage("특가 링크를 복사했습니다.");
    } catch {
      setMessage("공유를 취소했습니다.");
    }
  };

  const openDeal = (deal: Deal) => {
    if (!canOpenDealLink(deal)) {
      setMessage("이 특가는 링크 확인이 필요합니다.");
      return;
    }
    setPendingPurchaseDeal(deal);
  };

  const confirmOpenDeal = (deal: Deal) => {
    setPendingPurchaseDeal(null);
    void openExternalDeal(deal);
  };

  return (
    <div className="space-y-5 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-dossa-red">
          <ArrowLeft size={17} />
          할인도사 홈
        </Link>

        <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-red-200">
              <Heart size={24} fill="currentColor" />
            </span>
            <div>
              <p className="text-sm font-black text-red-200">관심 특가</p>
              <h1 className="text-2xl font-black sm:text-3xl">찜한 특가 {favoriteDeals.length}개</h1>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-300">
            {isCatalogLoading ? "최신 특가 목록과 동기화 중입니다." : "현재 노출 중인 특가 목록 기준으로 찜한 상품을 보여줍니다."}
          </p>
        </section>

        {message ? (
          <div role="status" aria-live="polite" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">
            {message}
          </div>
        ) : null}

        {favoriteDeals.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {favoriteDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isFavorite={favorites.includes(deal.id)}
                onToggleFavorite={toggleFavorite}
                onOpenDeal={openDeal}
                onShareDeal={shareDeal}
              />
            ))}
          </div>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 shadow-sm sm:p-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-dossa-red">
                <Heart size={25} />
              </span>
              <p className="mt-4 text-lg font-black text-slate-900">아직 찜한 특가가 없습니다.</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                구매 링크가 확인된 특가와 인기 반응이 높은 상품부터 저장해보세요. 로그인하면 기기를 바꿔도 관심 특가를 이어볼 수 있습니다.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link
                  href="/?verifiedOnly=true"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-dossa-red px-5 text-sm font-black text-white transition hover:bg-dossa-deep"
                >
                  <CheckCircle2 size={17} />
                  구매 링크 확인 특가 보기
                </Link>
                {!user ? (
                  <Link
                    href="/signup"
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    로그인하고 찜 동기화
                  </Link>
                ) : null}
              </div>
            </div>

            {recommendedDeals.length ? (
              <div className="mt-6 rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-dossa-red" />
                  <p className="text-sm font-black text-slate-950">먼저 저장해볼 만한 특가</p>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {recommendedDeals.map((deal) => (
                    <Link key={deal.id} href={`/deals/${deal.id}`} className="rounded-2xl bg-white p-3 shadow-sm transition hover:bg-red-50">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                        {isVerifiedPurchaseLink(deal) ? "구매 링크 확인" : "판매처 확인 필요"}
                      </span>
                      <span className="mt-2 block line-clamp-2 min-h-10 text-sm font-black leading-snug text-slate-950">{deal.title}</span>
                      <span className="mt-2 block text-xs font-bold text-slate-500">{deal.mallName} · {deal.shipping}</span>
                      <span className="mt-1 block text-sm font-black text-dossa-red">{deal.discountRate}% · {formatPrice(deal.salePrice)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        )}
        <PurchaseConfirmSheet
          deal={pendingPurchaseDeal}
          isOpen={Boolean(pendingPurchaseDeal)}
          onClose={() => setPendingPurchaseDeal(null)}
          onConfirm={confirmOpenDeal}
        />
        <LoginPromptSheet isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    </div>
  );
}

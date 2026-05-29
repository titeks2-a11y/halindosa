"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { mockDeals } from "@/data/mockDeals";
import { Deal } from "@/types/deal";

const favoriteKey = "halindosa:favorites";

async function openExternalDeal(deal: Deal) {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: deal.link });
      return;
    }
  } catch {
    // Browser fallback below.
  }

  window.open(deal.link, "_blank", "noopener,noreferrer");
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(favoriteKey);
      setFavorites(stored ? (JSON.parse(stored) as string[]) : []);
    } catch {
      setFavorites([]);
    }
  }, []);

  const favoriteDeals = useMemo(() => mockDeals.filter((deal) => favorites.includes(deal.id)), [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [...current, id];
      window.localStorage.setItem(favoriteKey, JSON.stringify(next));
      return next;
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
        return;
      }

      await nav.clipboard?.writeText(`${text}\n${shareUrl}`);
    } catch {
      // Sharing is optional and should not interrupt browsing.
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
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
        </section>

        {favoriteDeals.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {favoriteDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isFavorite={favorites.includes(deal.id)}
                onToggleFavorite={toggleFavorite}
                onOpenDeal={openExternalDeal}
                onShareDeal={shareDeal}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-black text-slate-900">아직 찜한 특가가 없습니다.</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">홈에서 하트 버튼을 눌러 관심 특가를 저장해보세요.</p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-2xl bg-dossa-red px-5 py-3 text-sm font-black text-white transition hover:bg-dossa-deep"
            >
              특가 둘러보기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

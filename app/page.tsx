"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, Flame, Info, SlidersHorizontal, Timer, Truck, UserRound } from "lucide-react";
import { AppView, BottomNav, DesktopNav } from "@/components/BottomNav";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CommercialFooter } from "@/components/CommercialFooter";
import { ConsentSettings } from "@/components/ConsentSettings";
import { DealCard } from "@/components/DealCard";
import { FeaturedDealSections } from "@/components/FeaturedDealSections";
import { Header } from "@/components/Header";
import { HotSignalSection } from "@/components/HotSignalSection";
import { LiveDealFeed } from "@/components/LiveDealFeed";
import { SearchBar } from "@/components/SearchBar";
import { SortSelect } from "@/components/SortSelect";
import { Toast } from "@/components/Toast";
import { dealChannels, dealMatchesChannel, getDealChannel, getProviderCategory } from "@/data/dealChannels";
import { mockHotSignals } from "@/data/mockHotSignals";
import { mockDeals } from "@/data/mockDeals";
import { ConsentState, hasAffiliateConsent, hasAnalyticsConsent, readStoredConsent } from "@/lib/consent";
import { Deal, DealSort } from "@/types/deal";
import { HotSignal } from "@/types/hotSignal";

const favoriteKey = "halindosa:favorites";
const toastMessages = [
  "🔥 새로운 역대급 특가가 등록되었습니다!",
  "⚡ 마감임박 상품이 빠르게 소진되고 있어요.",
  "🎯 관심 카테고리에 할인율 높은 상품이 올라왔어요!",
  "💳 카드할인 적용 가능한 핫딜을 찾았습니다.",
  "🛒 오늘만 진행되는 쿠폰 특가를 확인해보세요."
];

async function isNativeRuntime() {
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
    return false;
  }

  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.isNativePlatform();
}

function isFreeShippingDeal(deal: Deal) {
  return /무료배송|무배|네멤무료|로켓프레시/.test([deal.shippingInfo, ...deal.tags].join(" "));
}

function filterLocalDeals(
  items: Deal[],
  category: string,
  query: string,
  sort: DealSort,
  freeShippingOnly = false,
  hotOnly = false,
  endingSoonOnly = false
) {
  const searchQuery = query.trim().toLowerCase();
  let filtered = items;

  if (category && category !== "전체" && category !== "all") {
    filtered = filtered.filter((deal) => dealMatchesChannel(deal, category));
  }

  if (searchQuery) {
    filtered = filtered.filter((deal) =>
      [deal.title, deal.mall, deal.category, deal.source, ...deal.tags].some((value) =>
        value.toLowerCase().includes(searchQuery)
      )
    );
  }

  if (freeShippingOnly) {
    filtered = filtered.filter(isFreeShippingDeal);
  }

  if (hotOnly) {
    filtered = filtered.filter((deal) => deal.isHot);
  }

  if (endingSoonOnly) {
    filtered = filtered.filter((deal) => deal.isEndingSoon);
  }

  switch (sort) {
    case "discount":
      return [...filtered].sort((a, b) => b.discountRate - a.discountRate);
    case "price":
      return [...filtered].sort((a, b) => a.salePrice - b.salePrice);
    case "hot":
      return [...filtered].sort((a, b) => Number(b.isHot) - Number(a.isHot) || b.popularityScore - a.popularityScore);
    case "endingSoon":
      return [...filtered].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    case "latest":
    default:
      return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

interface DealsResponse {
  ok: boolean;
  deals: Deal[];
  count: number;
  updatedAt: string;
  source: string;
  message: string;
}

interface HotSignalsResponse {
  ok: boolean;
  signals: HotSignal[];
  count: number;
  updatedAt: string;
  source: string;
  message: string;
}

function requestJson<T>(url: string): Promise<T> {
  if (typeof window.fetch === "function") {
    return window.fetch(url, { cache: "no-store" }).then(async (response) => (await response.json()) as T);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as T);
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new Error("Network request failed"));
    xhr.send();
  });
}

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [catalog, setCatalog] = useState<Deal[]>(mockDeals);
  const [activeView, setActiveView] = useState<AppView>("home");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<DealSort>("latest");
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [hotOnly, setHotOnly] = useState(false);
  const [endingSoonOnly, setEndingSoonOnly] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [providerSource, setProviderSource] = useState("mock");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hotSignals, setHotSignals] = useState<HotSignal[]>(mockHotSignals);
  const [isSignalLoading, setIsSignalLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = window.localStorage.getItem(favoriteKey);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState("");
  const [consent, setConsent] = useState<ConsentState | null>(() => {
    if (typeof window === "undefined") return null;
    return readStoredConsent();
  });

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  }, []);

  const fetchDeals = useCallback(
    async (toastMessage?: string) => {
      setIsLoading(true);

      try {
        if (await isNativeRuntime()) {
          const localDeals = filterLocalDeals(mockDeals, category, query, sort, freeShippingOnly, hotOnly, endingSoonOnly);
          setDeals(localDeals);
          setCatalog(mockDeals);
          setProviderSource("android bundle");
          setUpdatedAt(new Date().toISOString());

          if (toastMessage) {
            showToast(toastMessage);
          }

          return;
        }

        setLoadError("");
        const params = new URLSearchParams({
          category,
          sort,
          freeShippingOnly: String(freeShippingOnly),
          hotOnly: String(hotOnly),
          endingSoonOnly: String(endingSoonOnly)
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        const data = await requestJson<DealsResponse>(`/api/deals?${params.toString()}`);

        const nextDeals = Array.isArray(data.deals) ? data.deals : [];
        setDeals(
          nextDeals
            .filter((deal) => !freeShippingOnly || isFreeShippingDeal(deal))
            .filter((deal) => !hotOnly || deal.isHot)
            .filter((deal) => !endingSoonOnly || deal.isEndingSoon)
        );
        setUpdatedAt(data.updatedAt);
        setProviderSource(data.source ?? "mock");
        if (!query.trim() && category === "all") {
          setCatalog(Array.isArray(data.deals) ? data.deals : []);
        }

        if (toastMessage) {
          showToast(toastMessage);
        }
      } catch {
        setLoadError("특가 데이터를 불러오지 못했습니다. 기본 저장 데이터를 표시합니다.");
        setDeals(filterLocalDeals(mockDeals, category, query, sort, freeShippingOnly, hotOnly, endingSoonOnly));
        setCatalog(mockDeals);
        setProviderSource("mock fallback");
        setUpdatedAt(new Date().toISOString());
        showToast("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    },
    [category, endingSoonOnly, freeShippingOnly, hotOnly, query, showToast, sort]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      fetchDeals();
    }, 180);

    return () => window.clearTimeout(handle);
  }, [fetchDeals]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function registerBackButton() {
      if (!(await isNativeRuntime())) return;

      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("backButton", ({ canGoBack }) => {
        if (activeView !== "home") {
          setActiveView("home");
          return;
        }

        if (canGoBack) {
          window.history.back();
          return;
        }

        void App.exitApp();
      });

      cleanup = () => {
        void listener.remove();
      };
    }

    void registerBackButton();

    return () => cleanup?.();
  }, [activeView]);

  useEffect(() => {
    async function fetchSignals() {
      setIsSignalLoading(true);

      try {
        if (await isNativeRuntime()) {
          setHotSignals(mockHotSignals);
          return;
        }

        const params = new URLSearchParams({
          category: getProviderCategory(category) ?? category,
          limit: "9"
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        const data = await requestJson<HotSignalsResponse>(`/api/hot-signals?${params.toString()}`);
        const nextSignals = Array.isArray(data.signals) && data.signals.length ? data.signals : mockHotSignals;
        setHotSignals(nextSignals);
      } catch {
        setHotSignals(mockHotSignals);
      } finally {
        setIsSignalLoading(false);
      }
    }

    const handle = window.setTimeout(fetchSignals, 250);
    return () => window.clearTimeout(handle);
  }, [category, query]);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        if (await isNativeRuntime()) {
          setCatalog(mockDeals);
          return;
        }

        const data = await requestJson<DealsResponse>("/api/deals?sort=latest");
        setCatalog(data.deals);
      } catch {
        setCatalog([]);
      }
    }

    fetchCatalog();
  }, []);

  useEffect(() => {
    const firstDelay = 3000 + Math.random() * 3000;
    let intervalId = 0;

    const firstTimer = window.setTimeout(() => {
      showToast(toastMessages[Math.floor(Math.random() * toastMessages.length)]);
      intervalId = window.setInterval(() => {
        showToast(toastMessages[Math.floor(Math.random() * toastMessages.length)]);
      }, 20000 + Math.random() * 10000);
    }, firstDelay);

    return () => {
      window.clearTimeout(firstTimer);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [showToast]);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const isRemoving = current.includes(id);
      const next = isRemoving ? current.filter((favoriteId) => favoriteId !== id) : [...current, id];
      window.localStorage.setItem(favoriteKey, JSON.stringify(next));
      void trackEvent(isRemoving ? "favorite_remove" : "favorite_add", id);
      showToast(isRemoving ? "찜 목록에서 제거했습니다." : "찜 목록에 저장했습니다.");
      return next;
    });
  };

  const trackEvent = async (eventType: "deal_click" | "favorite_add" | "favorite_remove", dealId: string) => {
    if (!hasAnalyticsConsent(consent)) return;

    try {
      await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventType,
          dealId,
          page: activeView,
          metadata: {
            category,
            sort
          }
        })
      });
    } catch {
      // Tracking must never block shopping flow.
    }
  };

  const openDeal = async (deal: Deal) => {
    void trackEvent("deal_click", deal.id);
    showToast(`${deal.mall} 특가 페이지로 이동합니다.`);

    if (await isNativeRuntime()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: deal.link });
      return;
    }

    const params = new URLSearchParams({
      from: activeView
    });

    if (hasAnalyticsConsent(consent)) {
      params.set("analytics", "granted");
    }

    if (hasAffiliateConsent(consent)) {
      params.set("affiliate", "granted");
    }

    window.open(`/api/redirect/${deal.id}?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  const shareDeal = async (deal: Deal) => {
    const shareUrl = typeof window === "undefined" ? deal.link : `${window.location.origin}/deals/${deal.id}`;
    const text = `${deal.mall} ${deal.title} ${deal.discountRate}% 할인`;

    try {
      const nav = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
        clipboard?: Clipboard;
      };

      if (typeof navigator !== "undefined" && nav.share) {
        await nav.share({
          title: `할인도사 - ${deal.title}`,
          text,
          url: shareUrl
        });
      } else if (nav.clipboard) {
        await nav.clipboard.writeText(`${text}\n${shareUrl}`);
        showToast("특가 링크를 복사했습니다.");
      } else {
        showToast("공유 기능을 사용할 수 없습니다.");
      }
    } catch {
      showToast("공유를 취소했습니다.");
    }
  };

  const openHotSignal = async (signal: HotSignal) => {
    showToast("할인도사 특가 브리핑으로 이동합니다.");

    if (await isNativeRuntime()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: signal.url });
      return;
    }

    window.open(signal.url, "_blank", "noopener,noreferrer");
  };

  const stats = useMemo(() => {
    const hotCount = deals.filter((deal) => deal.isHot).length;
    const endingCount = deals.filter((deal) => deal.isEndingSoon).length;
    return { hotCount, endingCount };
  }, [deals]);

  const alertDeals = useMemo(
    () => catalog.filter((deal) => deal.isHot || deal.isNew || deal.isEndingSoon).slice(0, 8),
    [catalog]
  );

  const favoriteDeals = useMemo(
    () => catalog.filter((deal) => favorites.includes(deal.id)),
    [catalog, favorites]
  );

  const categoryStats = useMemo(
    () =>
      dealChannels.map((channel) => {
        const categoryDeals = channel.id === "all" ? catalog : catalog.filter((deal) => dealMatchesChannel(deal, channel.id));
        const bestDiscount = categoryDeals.reduce((best, deal) => Math.max(best, deal.discountRate), 0);

        return {
          name: channel.label,
          id: channel.id,
          description: channel.description,
          count: categoryDeals.length,
          bestDiscount
        };
      }),
    [catalog]
  );

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        dealChannels.map((channel) => [
          channel.id,
          channel.id === "all" ? catalog.length : catalog.filter((deal) => dealMatchesChannel(deal, channel.id)).length
        ])
      ),
    [catalog]
  );

  const openCategory = (id: string) => {
    setCategory(id);
    setActiveView("home");
    window.setTimeout(() => document.getElementById("deals")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const viewTitle =
    activeView === "home"
      ? getDealChannel(category).label === "전체"
        ? "실시간 할인 정보"
        : getDealChannel(category).label
      : activeView === "categories"
        ? "카테고리"
        : activeView === "alerts"
          ? "알림"
          : activeView === "favorites"
            ? "찜한 특가"
            : "마이";

  const renderDealGrid = (items: Deal[], emptyTitle: string, emptyDescription: string) => {
    if (!items.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-black text-slate-900">{emptyTitle}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{emptyDescription}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((deal) => (
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
    );
  };

  return (
    <main className="min-h-screen pb-24 sm:pb-10">
      <Header
        updatedAt={updatedAt}
        isLoading={isLoading}
        onRefresh={() => fetchDeals("특가 데이터를 새로 불러왔습니다.")}
      />
      <section id="deals" className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-dossa-red">실시간 특가 모아보기</p>
            <h2 className="text-2xl font-black text-slate-950">{viewTitle}</h2>
          </div>
          <DesktopNav
            activeView={activeView}
            favoriteCount={favorites.length}
            alertCount={alertDeals.length}
            onChange={setActiveView}
          />
        </div>

        {activeView === "home" ? (
          <>
            <HotSignalSection signals={hotSignals} isLoading={isSignalLoading} onOpenSignal={openHotSignal} />

            <LiveDealFeed
              deals={deals}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpenDeal={openDeal}
              onShareDeal={shareDeal}
            />

            <FeaturedDealSections
              deals={catalog.length ? catalog : deals}
              favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onOpenDeal={openDeal}
          onShareDeal={shareDeal}
        />

            <div id="all-deals" className="h-1" />
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row">
                <SearchBar value={query} onChange={setQuery} />
                <SortSelect value={sort} onChange={setSort} />
                <button
                  type="button"
                  onClick={() => setFreeShippingOnly((value) => !value)}
                  className={`inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm transition ${
                    freeShippingOnly
                      ? "border-dossa-red bg-red-50 text-dossa-red"
                      : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-dossa-red"
                  }`}
                  aria-pressed={freeShippingOnly}
                >
                  <Truck size={18} />
                  무료배송만
                </button>
                <button
                  type="button"
                  onClick={() => setHotOnly((value) => !value)}
                  className={`inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm transition ${
                    hotOnly
                      ? "border-dossa-red bg-red-50 text-dossa-red"
                      : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-dossa-red"
                  }`}
                  aria-pressed={hotOnly}
                >
                  <Flame size={18} />
                  핫딜만
                </button>
                <button
                  type="button"
                  onClick={() => setEndingSoonOnly((value) => !value)}
                  className={`inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm transition ${
                    endingSoonOnly
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:text-amber-700"
                  }`}
                  aria-pressed={endingSoonOnly}
                >
                  <Timer size={18} />
                  마감임박만
                </button>
              </div>
              <div className="mt-3">
                <CategoryTabs selected={category} onSelect={setCategory} counts={categoryCounts} />
              </div>
              <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  총 <span className="text-dossa-red">{deals.length}</span>개
                </div>
                <div className="rounded-2xl bg-red-50 px-4 py-3">
                  HOT <span className="text-dossa-red">{stats.hotCount}</span>개
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-3">
                  마감임박 <span className="text-amber-700">{stats.endingCount}</span>개
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  찜 <span className="text-dossa-red">{favorites.length}</span>개
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {providerSource === "mock" ? "할인도사 기본 특가" : "할인도사 실시간 특가"} · 주요 특가 브리핑은 2분 단위로 갱신됩니다.
              </p>
              {loadError ? (
                <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-700">{loadError}</p>
              ) : null}
            </div>

            {isLoading && !deals.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="h-40 rounded-t-3xl bg-red-50" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-24 rounded-full bg-slate-100" />
                      <div className="h-5 rounded-full bg-slate-100" />
                      <div className="h-5 w-2/3 rounded-full bg-slate-100" />
                      <div className="h-10 rounded-2xl bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              renderDealGrid(
                deals,
                "조건에 맞는 특가가 없습니다.",
                freeShippingOnly || hotOnly || endingSoonOnly
                  ? "선택한 필터를 줄이거나 다른 카테고리를 선택해보세요."
                  : "검색어를 줄이거나 다른 카테고리를 선택해보세요."
              )
            )}
          </>
        ) : null}

        {activeView === "categories" ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {categoryStats.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openCategory(item.id)}
                className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-red-100 hover:shadow-deal"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                  <SlidersHorizontal size={19} />
                </span>
                <p className="mt-4 text-lg font-black text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{item.description}</p>
                <p className="mt-3 text-sm font-black text-dossa-red">최대 {item.bestDiscount}%</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{item.count}개 특가</p>
              </button>
            ))}
          </div>
        ) : null}

        {activeView === "alerts" ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="space-y-3">
              {alertDeals.map((deal) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => {
                    setQuery(deal.mall);
                    setActiveView("home");
                  }}
                  className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-red-100 hover:shadow-deal"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                    <BellRing size={21} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-slate-950">
                      {deal.isEndingSoon ? "마감 임박 특가" : deal.isNew ? "신규 등록 특가" : "오늘의 인기 특가"} · {deal.mall}
                    </span>
                    <span className="mt-1 block truncate text-sm font-semibold text-slate-500">{deal.title}</span>
                  </span>
                  <span className="shrink-0 text-base font-black text-dossa-red">{deal.discountRate}%</span>
                </button>
              ))}
            </div>
            <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Info size={19} className="text-dossa-red" />
                <p className="text-lg font-black text-slate-950">알림 설정 준비 중</p>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                현재는 앱 안에서 마감 임박, 인기, 신규 특가를 우선 표시합니다. 출시 후 푸시 알림 권한과 관심 카테고리 설정을 연결할 수 있는 구조입니다.
              </p>
              <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
                <div className="rounded-2xl bg-red-50 px-4 py-3">마감 임박 {alertDeals.filter((deal) => deal.isEndingSoon).length}개</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">오늘의 인기 {alertDeals.filter((deal) => deal.isHot).length}개</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">신규 등록 {alertDeals.filter((deal) => deal.isNew).length}개</div>
              </div>
            </aside>
          </div>
        ) : null}

        {activeView === "favorites"
          ? renderDealGrid(favoriteDeals, "아직 찜한 특가가 없습니다.", "마음에 드는 특가의 하트 버튼을 눌러 저장해보세요.")
          : null}

        {activeView === "my" ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <UserRound size={23} />
                </span>
                <div>
                  <p className="text-lg font-black text-slate-950">할인도사</p>
                  <p className="text-sm font-semibold text-slate-500">회원가입 없이 실시간 할인 특가를 확인하는 앱입니다.</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-xs font-bold text-dossa-deep">찜</p>
                  <p className="mt-1 text-2xl font-black text-dossa-red">{favorites.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">알림</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{alertDeals.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">전체</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{catalog.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-lg font-black text-slate-950">상업화 준비 체크</p>
              <div className="mt-4 space-y-3">
                {["실시간 특가 업데이트 구조", "이벤트 추적 API", "SEO/정책 페이지", "헬스체크 API"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <CheckCircle2 size={18} className="text-dossa-red" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-2 text-sm font-black text-slate-600">
                <Link href="/privacy" className="rounded-2xl bg-slate-50 px-4 py-3 hover:bg-red-50 hover:text-dossa-red">개인정보처리방침</Link>
                <Link href="/terms" className="rounded-2xl bg-slate-50 px-4 py-3 hover:bg-red-50 hover:text-dossa-red">이용약관</Link>
                <a href="mailto:support@halindosa.example" className="rounded-2xl bg-slate-50 px-4 py-3 hover:bg-red-50 hover:text-dossa-red">문의하기</a>
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-dossa-red">앱 버전 1.0.0</p>
              </div>
            </div>
            <ConsentSettings consent={consent} onChange={setConsent} />
          </div>
        ) : null}
      </section>

      <CommercialFooter />

      <BottomNav
        activeView={activeView}
        favoriteCount={favorites.length}
        alertCount={alertDeals.length}
        onChange={setActiveView}
      />
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </main>
  );
}

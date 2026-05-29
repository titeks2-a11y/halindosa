"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, SlidersHorizontal, UserRound } from "lucide-react";
import { AppView, BottomNav, DesktopNav } from "@/components/BottomNav";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CommercialFooter } from "@/components/CommercialFooter";
import { ConsentBanner } from "@/components/ConsentBanner";
import { ConsentSettings } from "@/components/ConsentSettings";
import { DealCard } from "@/components/DealCard";
import { FeaturedDealSections } from "@/components/FeaturedDealSections";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { SearchBar } from "@/components/SearchBar";
import { SortSelect } from "@/components/SortSelect";
import { Toast } from "@/components/Toast";
import { categories, mockDeals } from "@/data/mockDeals";
import { ConsentState, hasAffiliateConsent, hasAnalyticsConsent, readStoredConsent } from "@/lib/consent";
import { Deal, DealSort } from "@/types/deal";

const favoriteKey = "halindosa:favorites";
const toastMessages = [
  "🔥 새로운 역대급 특가가 등록되었습니다!",
  "⚡ 마감임박 상품이 빠르게 소진되고 있어요.",
  "🎯 관심 카테고리에 할인율 높은 상품이 올라왔어요!",
  "💳 카드할인 적용 가능한 핫딜을 찾았습니다.",
  "🛒 오늘만 진행되는 쿠폰 특가를 확인해보세요."
];

async function isNativeRuntime() {
  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.isNativePlatform();
}

function filterLocalDeals(items: Deal[], category: string, query: string, sort: DealSort) {
  const searchQuery = query.trim().toLowerCase();
  let filtered = items;

  if (category && category !== "전체") {
    filtered = filtered.filter((deal) => deal.category === category);
  }

  if (searchQuery) {
    filtered = filtered.filter((deal) =>
      [deal.title, deal.mall, deal.category, deal.source, ...deal.tags].some((value) =>
        value.toLowerCase().includes(searchQuery)
      )
    );
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

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [catalog, setCatalog] = useState<Deal[]>(mockDeals);
  const [activeView, setActiveView] = useState<AppView>("home");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState<DealSort>("latest");
  const [updatedAt, setUpdatedAt] = useState("");
  const [providerSource, setProviderSource] = useState("mock");
  const [isLoading, setIsLoading] = useState(false);
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
          const localDeals = filterLocalDeals(mockDeals, category, query, sort);
          setDeals(localDeals);
          setCatalog(mockDeals);
          setProviderSource("android bundle");
          setUpdatedAt(new Date().toISOString());

          if (toastMessage) {
            showToast(toastMessage);
          }

          return;
        }

        const params = new URLSearchParams({
          category,
          sort
        });

        if (query.trim()) {
          params.set("q", query.trim());
        }

        const response = await fetch(`/api/deals?${params.toString()}`, {
          cache: "no-store"
        });
        const data = (await response.json()) as DealsResponse;

        setDeals(Array.isArray(data.deals) ? data.deals : []);
        setUpdatedAt(data.updatedAt);
        setProviderSource(data.source ?? "mock");
        if (!query.trim() && category === "전체") {
          setCatalog(Array.isArray(data.deals) ? data.deals : []);
        }

        if (toastMessage) {
          showToast(toastMessage);
        }
      } catch {
        showToast("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    },
    [category, query, showToast, sort]
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
    async function fetchCatalog() {
      try {
        if (await isNativeRuntime()) {
          setCatalog(mockDeals);
          return;
        }

        const response = await fetch("/api/deals?sort=latest", {
          cache: "no-store"
        });
        const data = (await response.json()) as DealsResponse;
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
      categories.map((name) => {
        const categoryDeals = name === "전체" ? catalog : catalog.filter((deal) => deal.category === name);
        const bestDiscount = categoryDeals.reduce((best, deal) => Math.max(best, deal.discountRate), 0);

        return {
          name,
          count: categoryDeals.length,
          bestDiscount
        };
      }),
    [catalog]
  );

  const openCategory = (name: string) => {
    setCategory(name);
    setActiveView("home");
    window.setTimeout(() => document.getElementById("deals")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

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
      <HeroSection />

      <section id="deals" className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-dossa-red">할인도사 앱 메뉴</p>
            <h2 className="text-2xl font-black text-slate-950">
              {activeView === "home" && "실시간 특가"}
              {activeView === "categories" && "카테고리"}
              {activeView === "alerts" && "알림"}
              {activeView === "favorites" && "찜한 특가"}
              {activeView === "my" && "마이"}
            </h2>
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
        <FeaturedDealSections
          deals={catalog.length ? catalog : deals}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onOpenDeal={openDeal}
        />

        <div id="all-deals" className="h-1" />
        <div className="flex flex-col gap-3 lg:flex-row">
          <SearchBar value={query} onChange={setQuery} />
          <SortSelect value={sort} onChange={setSort} />
        </div>
        <CategoryTabs selected={category} onSelect={setCategory} />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm font-bold text-slate-700">
            총 <span className="text-dossa-red">{deals.length}</span>개 특가
            <span className="mx-2 text-slate-300">|</span>
            HOT {stats.hotCount}개
            <span className="mx-2 text-slate-300">|</span>
            마감임박 {stats.endingCount}개
          </p>
          <p className="text-xs font-semibold text-slate-500">
            데이터 {providerSource === "mock" ? "mock fallback" : providerSource} · 찜한 상품 {favorites.length}개
          </p>
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
          renderDealGrid(deals, "조건에 맞는 특가가 없습니다.", "검색어를 줄이거나 다른 카테고리를 선택해보세요.")
        )}
          </>
        ) : null}

        {activeView === "categories" ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {categoryStats.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => openCategory(item.name)}
                className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-red-100 hover:shadow-deal"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                  <SlidersHorizontal size={19} />
                </span>
                <p className="mt-4 text-lg font-black text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{item.count}개 특가</p>
                <p className="mt-3 text-sm font-black text-dossa-red">최대 {item.bestDiscount}%</p>
              </button>
            ))}
          </div>
        ) : null}

        {activeView === "alerts" ? (
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
                    {deal.isEndingSoon ? "마감임박" : deal.isNew ? "신규 특가" : "인기 핫딜"} · {deal.mall}
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold text-slate-500">{deal.title}</span>
                </span>
                <span className="shrink-0 text-base font-black text-dossa-red">{deal.discountRate}%</span>
              </button>
            ))}
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
                  <p className="text-lg font-black text-slate-950">게스트 쇼핑러</p>
                  <p className="text-sm font-semibold text-slate-500">찜과 최근 필터는 이 브라우저에 저장됩니다.</p>
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
                {["공식 API/RSS 연동 구조", "이벤트 추적 API", "SEO/정책 페이지", "헬스체크 API"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <CheckCircle2 size={18} className="text-dossa-red" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <ConsentSettings consent={consent} onChange={setConsent} />
          </div>
        ) : null}
      </section>

      <CommercialFooter />
      <ConsentBanner consent={consent} onChange={setConsent} />

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

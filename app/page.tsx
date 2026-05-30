"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, Flame, Info, Share2, ShieldCheck, SlidersHorizontal, Timer, Truck, UserRound } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CommercialFooter } from "@/components/CommercialFooter";
import { ConsentSettings } from "@/components/ConsentSettings";
import { DealCard } from "@/components/DealCard";
import { FeaturedDealSections } from "@/components/FeaturedDealSections";
import { HotSignalSection } from "@/components/HotSignalSection";
import { LiveDealFeed } from "@/components/LiveDealFeed";
import { PurchaseConfirmSheet } from "@/components/PurchaseConfirmSheet";
import { SearchBar } from "@/components/SearchBar";
import { SortSelect } from "@/components/SortSelect";
import { Toast } from "@/components/Toast";
import { dealChannels, dealMatchesChannel, getDealChannel, getProviderCategory } from "@/data/dealChannels";
import { mockHotSignals } from "@/data/mockHotSignals";
import { mockDeals } from "@/data/mockDeals";
import { ConsentState, hasAffiliateConsent, hasAnalyticsConsent, readStoredConsent } from "@/lib/consent";
import { canOpenDealLink } from "@/lib/affiliate";
import { getRelativeTime } from "@/lib/format";
import { buildDealRedirectUrl } from "@/lib/redirectUrl";
import { readRecentDealIds, rememberRecentDealId } from "@/lib/recentDeals";
import { Deal, DealSort } from "@/types/deal";
import { HotSignal } from "@/types/hotSignal";

const favoriteKey = "halindosa:favorites";
type AppView = "home" | "categories" | "alerts" | "favorites" | "my";
const mallFilters = [
  { id: "all", label: "전체 쇼핑몰" },
  { id: "쿠팡", label: "쿠팡" },
  { id: "naver", label: "네이버" },
  { id: "gmarket", label: "G마켓" },
  { id: "11번가", label: "11번가" },
  { id: "ssg", label: "SSG/이마트" },
  { id: "auction", label: "옥션" },
  { id: "aliexpress", label: "알리익스프레스" },
  { id: "롯데온", label: "롯데온" },
  { id: "interpark", label: "인터파크" },
  { id: "올리브영", label: "올리브영" },
  { id: "무신사", label: "무신사" },
  { id: "하이마트", label: "하이마트" }
];
const toastMessages = [
  "🔥 새로운 역대급 특가가 등록되었습니다!",
  "⚡ 마감임박 상품이 빠르게 소진되고 있어요.",
  "🎯 관심 카테고리에 할인율 높은 상품이 올라왔어요!",
  "💳 카드할인 적용 가능한 핫딜을 찾았습니다.",
  "🛒 오늘만 진행되는 쿠폰 특가를 확인해보세요."
];

async function isNativeRuntime() {
  const localHost = "local" + "host";
  const loopbackHost = ["127", "0", "0", "1"].join(".");

  if (typeof window !== "undefined" && [localHost, loopbackHost, "::1"].includes(window.location.hostname)) {
    return false;
  }

  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.isNativePlatform();
}

function isFreeShippingDeal(deal: Deal) {
  return deal.isFreeShipping || /무료배송|무배|네멤무료|로켓프레시/.test([deal.shipping, ...deal.tags].join(" "));
}

function commercialScore(deal: Deal) {
  const expireHours = Math.max(1, (new Date(deal.expireAt).getTime() - Date.now()) / (60 * 60 * 1000));
  return (
    Number(deal.isHot) * 40 +
    Number(deal.isFreeShipping) * 12 +
    deal.popularityScore +
    deal.discountRate * 0.8 +
    Math.max(0, 24 - expireHours)
  );
}

function filterLocalDeals(
  items: Deal[],
  category: string,
  query: string,
  sort: DealSort,
  freeShippingOnly = false,
  hotOnly = false,
  endingSoonOnly = false,
  verifiedOnly = false,
  mallFilter = "all"
) {
  const searchQuery = query.trim().toLowerCase();
  let filtered = items;

  if (category && category !== "전체" && category !== "all") {
    filtered = filtered.filter((deal) => dealMatchesChannel(deal, category));
  }

  if (searchQuery) {
    filtered = filtered.filter((deal) =>
      [deal.title, deal.mallName, deal.category, deal.source, ...deal.tags].some((value) =>
        value.toLowerCase().includes(searchQuery)
      )
    );
  }

  if (mallFilter !== "all") {
    filtered = filtered.filter((deal) => {
      const mall = `${deal.mallName} ${deal.mall}`.toLowerCase();
      if (mallFilter === "gmarket") return /g마켓|지마켓|gmarket/.test(mall);
      if (mallFilter === "naver") return /네이버|naver/.test(mall);
      if (mallFilter === "ssg") return /ssg|쓱|이마트/.test(mall);
      if (mallFilter === "auction") return /옥션|auction/.test(mall);
      if (mallFilter === "aliexpress") return /알리|ali/.test(mall);
      if (mallFilter === "interpark") return /인터파크|interpark/.test(mall);
      return mall.includes(mallFilter.toLowerCase());
    });
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

  if (verifiedOnly) {
    filtered = filtered.filter((deal) => deal.linkStatus === "verified" && deal.linkType !== "seller_search");
  }

  switch (sort) {
    case "discount":
      return [...filtered].sort((a, b) => b.discountRate - a.discountRate);
    case "price":
      return [...filtered].sort((a, b) => a.salePrice - b.salePrice);
    case "hot":
      return [...filtered].sort((a, b) => Number(b.isHot) - Number(a.isHot) || b.popularityScore - a.popularityScore);
    case "endingSoon":
      return [...filtered].sort((a, b) => new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime());
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
  const [hasAppliedInitialParams, setHasAppliedInitialParams] = useState(false);
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [catalog, setCatalog] = useState<Deal[]>(mockDeals);
  const [activeView, setActiveView] = useState<AppView>("home");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<DealSort>("latest");
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [hotOnly, setHotOnly] = useState(false);
  const [endingSoonOnly, setEndingSoonOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [mallFilter, setMallFilter] = useState("all");
  const [updatedAt, setUpdatedAt] = useState("");
  const [providerSource, setProviderSource] = useState("mock");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isOffline, setIsOffline] = useState(() => (typeof navigator === "undefined" ? false : !navigator.onLine));
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
  const [recentDealIds, setRecentDealIds] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [pendingPurchaseDeal, setPendingPurchaseDeal] = useState<Deal | null>(null);
  const [consent, setConsent] = useState<ConsentState | null>(() => {
    if (typeof window === "undefined") return null;
    return readStoredConsent();
  });

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const initialCategory = params.get("category");
      const initialMall = params.get("mall");
      const initialSort = params.get("sort") as DealSort | null;
      const initialQuery = params.get("q");

      if (initialCategory) {
        setCategory(initialCategory);
        setActiveView("home");
      }

      if (initialMall) {
        setMallFilter(initialMall);
        setActiveView("home");
      }

      if (initialSort && ["latest", "discount", "price", "hot", "endingSoon"].includes(initialSort)) {
        setSort(initialSort);
        setActiveView("home");
      }

      if (initialQuery) {
        setQuery(initialQuery);
        setActiveView("home");
      }

      setHasAppliedInitialParams(true);
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    const updateNetworkState = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);
      if (offline) {
        setLoadError("네트워크 연결이 불안정합니다. 저장된 기본 특가를 함께 표시합니다.");
      }
    };

    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);
    const handle = window.setTimeout(updateNetworkState, 0);

    return () => {
      window.clearTimeout(handle);
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
    };
  }, []);

  const fetchDeals = useCallback(
    async (toastMessage?: string) => {
      setIsLoading(true);

      try {
        if (await isNativeRuntime()) {
          const localDeals = filterLocalDeals(mockDeals, category, query, sort, freeShippingOnly, hotOnly, endingSoonOnly, verifiedOnly, mallFilter);
          setDeals(localDeals);
          setCatalog(mockDeals);
          setProviderSource("android bundle");
          setUpdatedAt(new Date().toISOString());

          if (toastMessage) {
            showToast(toastMessage);
          }

          return;
        }

        if (!isOffline) setLoadError("");
        const params = new URLSearchParams({
          category,
          sort,
          freeShippingOnly: String(freeShippingOnly),
          hotOnly: String(hotOnly),
          endingSoonOnly: String(endingSoonOnly),
          verifiedOnly: String(verifiedOnly),
          mall: mallFilter
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
            .filter((deal) => !verifiedOnly || (deal.linkStatus === "verified" && deal.linkType !== "seller_search"))
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
        setDeals(filterLocalDeals(mockDeals, category, query, sort, freeShippingOnly, hotOnly, endingSoonOnly, verifiedOnly, mallFilter));
        setCatalog(mockDeals);
        setProviderSource("mock fallback");
        setUpdatedAt(new Date().toISOString());
        showToast("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    },
    [category, endingSoonOnly, freeShippingOnly, hotOnly, isOffline, mallFilter, query, showToast, sort, verifiedOnly]
  );

  useEffect(() => {
    if (!hasAppliedInitialParams) return;

    const handle = window.setTimeout(() => {
      fetchDeals();
    }, 180);

    return () => window.clearTimeout(handle);
  }, [fetchDeals, hasAppliedInitialParams]);

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
    const handle = window.setTimeout(() => {
      setRecentDealIds(readRecentDealIds());
    }, 0);

    return () => window.clearTimeout(handle);
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

  const rememberRecentDeal = useCallback((id: string) => {
    setRecentDealIds((current) => {
      const fallback = [id, ...current.filter((dealId) => dealId !== id)].slice(0, 20);

      try {
        return rememberRecentDealId(id);
      } catch {
        return fallback;
      }
    });
  }, []);

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

  const openDeal = (deal: Deal) => {
    if (!canOpenDealLink(deal)) {
      showToast("이 특가는 링크 확인이 필요합니다. 다른 특가를 확인해주세요.");
      return;
    }

    setPendingPurchaseDeal(deal);
  };

  const confirmOpenDeal = async (deal: Deal) => {
    setPendingPurchaseDeal(null);

    rememberRecentDeal(deal.id);
    void trackEvent("deal_click", deal.id);
    showToast(`${deal.mallName} 특가 페이지로 이동합니다.`);
    const redirectUrl = buildDealRedirectUrl(deal.id, activeView, {
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

  const shareDeal = async (deal: Deal) => {
    const shareUrl = typeof window === "undefined" ? deal.link : `${window.location.origin}/deals/${deal.id}`;
    const text = `${deal.mallName} ${deal.title} ${deal.discountRate}% 할인`;

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

  const shareApp = async () => {
    const appUrl = typeof window === "undefined" ? "https://halindosa.example" : window.location.origin;
    const text = "할인도사 - 실시간 할인 특가 정보를 가장 빠르게 찾는 방법";

    try {
      const nav = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
        clipboard?: Clipboard;
      };

      if (nav.share) {
        await nav.share({ title: "할인도사", text, url: appUrl });
        return;
      }

      await nav.clipboard?.writeText(`${text}\n${appUrl}`);
      showToast("앱 공유 링크를 복사했습니다.");
    } catch {
      showToast("공유를 취소했습니다.");
    }
  };

  const stats = useMemo(() => {
    const hotCount = deals.filter((deal) => deal.isHot).length;
    const endingCount = deals.filter((deal) => deal.isEndingSoon).length;
    return { hotCount, endingCount };
  }, [deals]);

  const dataQuality = useMemo(() => {
    const source = deals.length ? deals : catalog;
    const verifiedLinkCount = source.filter((deal) => deal.linkStatus === "verified").length;
    const reviewLinkCount = source.filter((deal) => deal.linkStatus === "needs_review" || deal.linkType === "seller_search").length;
    const freeShippingCount = source.filter(isFreeShippingDeal).length;
    const latestPriceCheckedAt = source
      .map((deal) => new Date(deal.priceCheckedAt).getTime())
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0];

    return {
      total: source.length,
      verifiedLinkCount,
      reviewLinkCount,
      freeShippingCount,
      latestPriceCheckedAt: latestPriceCheckedAt ? new Date(latestPriceCheckedAt).toISOString() : ""
    };
  }, [catalog, deals]);

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

  const heroDeal = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    return [...source].sort((a, b) => commercialScore(b) - commercialScore(a))[0] ?? null;
  }, [catalog, deals]);

  const topDeals = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    return [...source].sort((a, b) => commercialScore(b) - commercialScore(a)).slice(0, 10);
  }, [catalog, deals]);

  const recentDeals = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    return recentDealIds.map((id) => source.find((deal) => deal.id === id)).filter((deal): deal is Deal => Boolean(deal)).slice(0, 6);
  }, [catalog, deals, recentDealIds]);

  const recommendedDeals = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    return [...source].filter((deal) => deal.isHot || deal.isFreeShipping).sort((a, b) => commercialScore(b) - commercialScore(a)).slice(0, 6);
  }, [catalog, deals]);

  const categoryHighlights = useMemo(
    () =>
      ["food", "living", "digital", "fashion", "baby", "travel", "etc"].map((id) => {
        const channel = getDealChannel(id);
        const items = catalog.filter((deal) => dealMatchesChannel(deal, id)).sort((a, b) => commercialScore(b) - commercialScore(a));
        return { id, label: channel.label, deal: items[0] };
      }).filter((item) => item.deal),
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

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    const selectedChannel = getDealChannel(category);
    const selectedMall = mallFilters.find((mall) => mall.id === mallFilter);

    if (query.trim()) labels.push(`검색: ${query.trim()}`);
    if (category !== "all") labels.push(selectedChannel.label);
    if (mallFilter !== "all" && selectedMall) labels.push(selectedMall.label);
    if (verifiedOnly) labels.push("구매링크 확인");
    if (freeShippingOnly) labels.push("무료배송");
    if (hotOnly) labels.push("핫딜");
    if (endingSoonOnly) labels.push("마감임박");
    if (sort !== "latest") {
      const sortLabel: Record<DealSort, string> = {
        latest: "최신순",
        discount: "할인율순",
        price: "낮은 가격순",
        hot: "핫딜순",
        endingSoon: "마감임박순"
      };
      labels.push(sortLabel[sort]);
    }

    return labels;
  }, [category, endingSoonOnly, freeShippingOnly, hotOnly, mallFilter, query, sort, verifiedOnly]);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setMallFilter("all");
    setSort("latest");
    setFreeShippingOnly(false);
    setHotOnly(false);
    setEndingSoonOnly(false);
    setVerifiedOnly(false);
    showToast("검색 조건을 초기화했습니다.");
  };

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
    <div className="min-h-screen">
      <section id="deals" className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-dossa-red lg:text-sm">실시간 특가 모아보기</p>
            <h2 className="text-xl font-black text-slate-950 lg:text-3xl">{viewTitle}</h2>
            <p className="mt-1 text-[11px] font-bold text-slate-400 lg:text-xs">
              마지막 업데이트 {updatedAt ? new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date(updatedAt)) : "대기 중"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchDeals("특가 데이터를 새로 불러왔습니다.")}
            disabled={isLoading}
            className="hidden rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-dossa-deep disabled:cursor-wait disabled:opacity-70 lg:inline-flex"
          >
            새로고침
          </button>
        </div>
        <div className="grid gap-2 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-4 sm:p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red">
              <ShieldCheck size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-dossa-deep">데이터 상태</p>
              <p className="truncate text-sm font-black text-slate-950">{providerSource}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-black text-slate-400">구매 링크 확인</p>
            <p className="mt-1 text-sm font-black text-slate-950">
              {dataQuality.verifiedLinkCount}/{dataQuality.total}개
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-3 py-3">
            <p className="text-[11px] font-black text-amber-700">판매처 검색 확인 필요</p>
            <p className="mt-1 text-sm font-black text-amber-900">{dataQuality.reviewLinkCount}개</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] font-black text-slate-400">네트워크</p>
            <p className="mt-1 truncate text-sm font-black text-slate-950">
              {isOffline ? "오프라인 모드" : "온라인"}
            </p>
          </div>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-slate-950">
              {isOffline ? "오프라인 상태입니다." : "네트워크 정상 · 최신 특가 확인 가능"}
            </p>
            <p className="text-xs font-bold text-slate-500">
              최근 가격 기준 {dataQuality.latestPriceCheckedAt ? getRelativeTime(dataQuality.latestPriceCheckedAt) : "대기 중"}
            </p>
          </div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {isOffline
              ? "연결이 복구되면 새로고침으로 최신 특가를 다시 불러올 수 있습니다."
              : "판매처의 최종 가격, 옵션가, 쿠폰 조건은 구매 전 다시 확인하세요."}
          </p>
        </div>

        {activeView === "home" ? (
          <>
            {heroDeal ? (
              <section className="overflow-hidden rounded-[30px] bg-dossa-red text-white shadow-deal">
                <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="p-5 sm:p-7">
                    <p className="text-sm font-black text-red-100">오늘의 특가 배너</p>
                    <h3 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{heroDeal.title}</h3>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-red-50">{heroDeal.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-dossa-red">{heroDeal.discountRate}% 할인</span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-black">{heroDeal.mallName}</span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-black">{heroDeal.shipping}</span>
                    </div>
                    <div className="mt-6 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openDeal(heroDeal)}
                        className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-dossa-red"
                      >
                        특가 보러가기
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(heroDeal.id)}
                        className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white"
                      >
                        {favorites.includes(heroDeal.id) ? "찜 해제" : "찜하기"}
                      </button>
                    </div>
                  </div>
                  <div className="min-h-64 bg-red-950/15">
                    {heroDeal.thumbnail ? (
                      <div
                        aria-label={heroDeal.title}
                        className="h-full min-h-64 w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${heroDeal.thumbnail})` }}
                      />
                    ) : (
                      <div className="flex h-full min-h-64 items-center justify-center text-7xl font-black text-white/25">SALE</div>
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-dossa-red">실시간 인기 TOP10</p>
                  <h3 className="text-xl font-black text-slate-950">지금 먼저 볼 특가</h3>
                </div>
                <button type="button" onClick={() => setSort("hot")} className="text-sm font-black text-dossa-red">
                  인기순 보기
                </button>
              </div>
              <div className="mt-4 grid gap-2">
                {topDeals.map((deal, index) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => openDeal(deal)}
                    className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-red-100 hover:bg-red-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dossa-red text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                      <span className="mt-0.5 block truncate text-xs font-bold text-slate-500">{deal.mallName} · {deal.category} · {deal.shipping}</span>
                    </span>
                    <span className="shrink-0 text-base font-black text-dossa-red">{deal.discountRate}%</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid min-w-0 gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-black text-dossa-red">카테고리별 인기</p>
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                  {categoryHighlights.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openCategory(item.id)}
                      className="w-full min-w-0 rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-red-50"
                    >
                      <span className="text-xs font-black text-dossa-red">{item.label}</span>
                      <span className="mt-1 block line-clamp-2 text-sm font-black text-slate-950">{item.deal?.title}</span>
                      <span className="mt-2 block text-xs font-bold text-slate-500">{item.deal?.mallName} · {item.deal?.discountRate}%</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-black text-dossa-red">{recentDeals.length ? "최근 본 특가" : "추천 특가"}</p>
                <div className="mt-4 space-y-2">
                  {(recentDeals.length ? recentDeals : recommendedDeals).slice(0, 6).map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => openDeal(deal)}
                      className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-red-50"
                    >
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-red-50">
                        {deal.thumbnail ? (
                          <span
                            aria-label={deal.title}
                            className="block h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${deal.thumbnail})` }}
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                        <span className="block truncate text-xs font-bold text-slate-500">{deal.mallName} · {deal.shipping}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

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
                <label className="min-w-[180px] flex-1">
                  <span className="sr-only">쇼핑몰 필터</span>
                  <select
                    value={mallFilter}
                    onChange={(event) => setMallFilter(event.target.value)}
                    className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none transition hover:border-red-200 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  >
                    {mallFilters.map((mall) => (
                      <option key={mall.id} value={mall.id}>
                        {mall.label}
                      </option>
                    ))}
                  </select>
                </label>
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
                  onClick={() => setVerifiedOnly((value) => !value)}
                  className={`inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black shadow-sm transition ${
                    verifiedOnly
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                  }`}
                  aria-pressed={verifiedOnly}
                >
                  <CheckCircle2 size={18} />
                  구매링크 확인만
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
              <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-400">적용된 조건</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeFilterLabels.length ? (
                      activeFilterLabels.map((label) => (
                        <span key={label} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">전체 특가</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!activeFilterLabels.length}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:border-red-100 hover:text-dossa-red disabled:cursor-not-allowed disabled:opacity-45"
                >
                  조건 초기화
                </button>
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
                구매링크 확인 필터를 켜면 판매처 검색 확인이 필요한 특가는 제외됩니다.
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
                freeShippingOnly || hotOnly || endingSoonOnly || verifiedOnly
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
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-dossa-red">무료배송 {alertDeals.filter(isFreeShippingDeal).length}개</div>
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
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">공지사항</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  현재 할인도사는 회원가입 없이 사용할 수 있으며, 관심 특가는 이 기기에만 저장됩니다. 실제 운영 전 공식 API와 제휴 피드를 연결할 예정입니다.
                </p>
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
                <button
                  type="button"
                  onClick={shareApp}
                  className="inline-flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left hover:bg-red-50 hover:text-dossa-red"
                >
                  앱 공유하기
                  <Share2 size={16} />
                </button>
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-dossa-red">앱 버전 1.0.0</p>
              </div>
            </div>
            <ConsentSettings consent={consent} onChange={setConsent} />
          </div>
        ) : null}
      </section>

      <CommercialFooter />

      <PurchaseConfirmSheet
        deal={pendingPurchaseDeal}
        isOpen={Boolean(pendingPurchaseDeal)}
        onClose={() => setPendingPurchaseDeal(null)}
        onConfirm={confirmOpenDeal}
      />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

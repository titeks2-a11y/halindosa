"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, Flame, Share2, ShieldCheck, ShoppingBag, SlidersHorizontal, Store, Timer, Truck, UserRound } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CommercialFooter } from "@/components/CommercialFooter";
import { ConsentSettings } from "@/components/ConsentSettings";
import { DealCard } from "@/components/DealCard";
import { FeaturedDealSections } from "@/components/FeaturedDealSections";
import { HotSignalSection } from "@/components/HotSignalSection";
import { LoginPromptSheet } from "@/components/LoginPromptSheet";
import { LiveDealFeed } from "@/components/LiveDealFeed";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { PriceAlertList } from "@/components/PriceAlertList";
import { PurchaseConfirmSheet } from "@/components/PurchaseConfirmSheet";
import { SearchBar } from "@/components/SearchBar";
import { SearchDiscoveryPanel } from "@/components/SearchDiscoveryPanel";
import { SortSelect } from "@/components/SortSelect";
import { Toast } from "@/components/Toast";
import { useAuth } from "@/components/AuthProvider";
import { dealChannels, dealMatchesChannel, getDealChannel, getProviderCategory } from "@/data/dealChannels";
import { mockHotSignals } from "@/data/mockHotSignals";
import { mockDeals } from "@/data/mockDeals";
import { ConsentState, hasAffiliateConsent, hasAnalyticsConsent, readStoredConsent } from "@/lib/consent";
import { canOpenDealLink } from "@/lib/affiliate";
import { getLinkQualityScore, isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { getRelativeTime } from "@/lib/format";
import { buildDealRedirectUrl, buildNativeSafeDealUrl } from "@/lib/redirectUrl";
import {
  clearRecentDealsSynced,
  readLocalFavoriteIds,
  recordRecentDealView,
  syncFavoritesWithSupabase,
  syncRecentDealsWithSupabase,
  toggleFavoriteSynced
} from "@/lib/memberSync";
import { getSupportMailto, supportEmail } from "@/lib/support";
import { Deal, DealSort } from "@/types/deal";
import { HotSignal } from "@/types/hotSignal";

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
const priceBands = [
  { id: "all", label: "전체 가격대", min: 0, max: Number.POSITIVE_INFINITY },
  { id: "under10000", label: "1만원 미만", min: 0, max: 9999 },
  { id: "10000-30000", label: "1만~3만원", min: 10000, max: 30000 },
  { id: "30000-100000", label: "3만~10만원", min: 30000, max: 100000 },
  { id: "over100000", label: "10만원 이상", min: 100000, max: Number.POSITIVE_INFINITY }
] as const;
type PriceBand = (typeof priceBands)[number]["id"];
const toastMessages = [
  "🔥 새로운 역대급 특가가 등록되었습니다!",
  "⚡ 마감임박 상품이 빠르게 소진되고 있어요.",
  "🎯 관심 카테고리에 할인율 높은 상품이 올라왔어요!",
  "💳 카드할인 적용 가능한 핫딜을 찾았습니다.",
  "🛒 오늘만 진행되는 쿠폰 특가를 확인해보세요."
];
const recentSearchStorageKey = "halindosa:recent-search-keywords";

function readRecentSearchKeywords() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentSearchStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function storeRecentSearchKeywords(keywords: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(recentSearchStorageKey, JSON.stringify(keywords.slice(0, 8)));
}

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

function dealMatchesMallFilter(deal: Deal, mallFilter: string) {
  if (mallFilter === "all") return true;

  const mall = `${deal.mallName} ${deal.mall}`.toLowerCase();
  if (mallFilter === "gmarket") return /g마켓|지마켓|gmarket/.test(mall);
  if (mallFilter === "naver") return /네이버|naver/.test(mall);
  if (mallFilter === "ssg") return /ssg|쓱|이마트/.test(mall);
  if (mallFilter === "auction") return /옥션|auction/.test(mall);
  if (mallFilter === "aliexpress") return /알리|ali/.test(mall);
  if (mallFilter === "interpark") return /인터파크|interpark/.test(mall);
  return mall.includes(mallFilter.toLowerCase());
}

function dealMatchesPriceBand(deal: Deal, priceBand: PriceBand) {
  const selectedBand = priceBands.find((band) => band.id === priceBand);
  if (!selectedBand || selectedBand.id === "all") return true;
  return deal.salePrice >= selectedBand.min && deal.salePrice <= selectedBand.max;
}

function getProviderDisplayLabel(source: string) {
  if (source === "production") return "운영 피드";
  if (source === "staging") return "검수 피드";
  if (source === "hybrid") return "혼합 피드";
  if (source.includes("fallback")) return "기본 특가";
  return "기본 특가";
}

function commercialScore(deal: Deal) {
  const expireHours = Math.max(1, (new Date(deal.expireAt).getTime() - Date.now()) / (60 * 60 * 1000));
  return (
    getLinkQualityScore(deal) +
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
  mallFilter = "all",
  priceBand: PriceBand = "all"
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
    filtered = filtered.filter((deal) => dealMatchesMallFilter(deal, mallFilter));
  }

  if (priceBand !== "all") {
    filtered = filtered.filter((deal) => dealMatchesPriceBand(deal, priceBand));
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
    filtered = filtered.filter(isVerifiedPurchaseLink);
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
  const { configured: authConfigured, user, nickname } = useAuth();
  const userId = user?.id;
  const [hasAppliedInitialParams, setHasAppliedInitialParams] = useState(false);
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [catalog, setCatalog] = useState<Deal[]>(mockDeals);
  const [activeView, setActiveView] = useState<AppView>("home");
  const [query, setQuery] = useState("");
  const [recentSearchKeywords, setRecentSearchKeywords] = useState<string[]>([]);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<DealSort>("latest");
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [hotOnly, setHotOnly] = useState(false);
  const [endingSoonOnly, setEndingSoonOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [mallFilter, setMallFilter] = useState("all");
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [updatedAt, setUpdatedAt] = useState("");
  const [providerSource, setProviderSource] = useState("mock");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [hotSignals, setHotSignals] = useState<HotSignal[]>(mockHotSignals);
  const [isSignalLoading, setIsSignalLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => readLocalFavoriteIds());
  const [recentDealIds, setRecentDealIds] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [pendingPurchaseDeal, setPendingPurchaseDeal] = useState<Deal | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
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
      setRecentSearchKeywords(readRecentSearchKeywords());
      const params = new URLSearchParams(window.location.search);
      const initialCategory = params.get("category");
      const initialMall = params.get("mall");
      const initialSort = params.get("sort") as DealSort | null;
      const initialQuery = params.get("q");
      const initialFreeShipping = params.get("freeShipping") ?? params.get("freeShippingOnly");
      const initialHotOnly = params.get("hotOnly");
      const initialEndingSoon = params.get("endingSoon") ?? params.get("endingSoonOnly");
      const initialPriceBand = params.get("priceBand") as PriceBand | null;

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

      if (initialFreeShipping === "true") {
        setFreeShippingOnly(true);
        setActiveView("home");
      }

      if (initialHotOnly === "true") {
        setHotOnly(true);
        setActiveView("home");
      }

      if (initialEndingSoon === "true") {
        setEndingSoonOnly(true);
        setActiveView("home");
      }

      if (initialPriceBand && priceBands.some((band) => band.id === initialPriceBand)) {
        setPriceBand(initialPriceBand);
        setActiveView("home");
      }

      setHasAppliedInitialParams(true);
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!hasAppliedInitialParams) return;
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) return;

    const handle = window.setTimeout(() => {
      setRecentSearchKeywords((current) => {
        const next = [normalizedQuery, ...current.filter((keyword) => keyword !== normalizedQuery)].slice(0, 8);
        storeRecentSearchKeywords(next);
        return next;
      });
    }, 900);

    return () => window.clearTimeout(handle);
  }, [hasAppliedInitialParams, query]);

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
          const localDeals = filterLocalDeals(mockDeals, category, query, sort, freeShippingOnly, hotOnly, endingSoonOnly, verifiedOnly, mallFilter, priceBand);
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
          mall: mallFilter,
          priceBand
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
            .filter((deal) => !verifiedOnly || isVerifiedPurchaseLink(deal))
            .filter((deal) => dealMatchesPriceBand(deal, priceBand))
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
        setDeals(filterLocalDeals(mockDeals, category, query, sort, freeShippingOnly, hotOnly, endingSoonOnly, verifiedOnly, mallFilter, priceBand));
        setCatalog(mockDeals);
        setProviderSource("mock fallback");
        setUpdatedAt(new Date().toISOString());
        showToast("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    },
    [category, endingSoonOnly, freeShippingOnly, hotOnly, isOffline, mallFilter, priceBand, query, showToast, sort, verifiedOnly]
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
    let active = true;
    syncRecentDealsWithSupabase()
      .then((ids) => {
        if (active) setRecentDealIds(ids);
      })
      .catch(() => {
        if (active) setRecentDealIds([]);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

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
    if (authConfigured && !user) {
      setShowLoginPrompt(true);
      showToast("로그인하면 찜한 특가를 계정으로 이어볼 수 있습니다.");
      return;
    }

    setFavorites((current) => {
      const isRemoving = current.includes(id);
      const next = isRemoving ? current.filter((favoriteId) => favoriteId !== id) : [id, ...current];
      void toggleFavoriteSynced(id, current)
        .then((syncedIds) => setFavorites(syncedIds))
        .catch(() => showToast("네트워크가 불안정해 기기 저장소에 우선 반영했습니다."));
      void trackEvent(isRemoving ? "favorite_remove" : "favorite_add", id);
      showToast(isRemoving ? "찜 목록에서 제거했습니다." : "찜 목록에 저장했습니다.");
      return next;
    });
  };

  const rememberRecentDeal = useCallback((id: string) => {
    void recordRecentDealView(id)
      .then((ids) => setRecentDealIds(ids))
      .catch(() => {
        setRecentDealIds((current) => [id, ...current.filter((dealId) => dealId !== id)].slice(0, 20));
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
      await Browser.open({
        url: buildNativeSafeDealUrl(deal, activeView, {
          analytics: hasAnalyticsConsent(consent),
          affiliate: hasAffiliateConsent(consent)
        })
      });
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
    const appUrl = typeof window === "undefined" ? (process.env.NEXT_PUBLIC_SITE_URL || "https://halindosa.com") : window.location.origin;
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
    const verifiedLinkCount = source.filter(isVerifiedPurchaseLink).length;
    const reviewLinkCount = source.filter((deal) => !isVerifiedPurchaseLink(deal)).length;
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
      verifiedLinkRate: source.length ? Math.round((verifiedLinkCount / source.length) * 100) : 0,
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
    return [...source].sort((a, b) => (commercialScore(b) + b.clickCount * 0.05) - (commercialScore(a) + a.clickCount * 0.05)).slice(0, 10);
  }, [catalog, deals]);

  const recentDeals = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    return recentDealIds.map((id) => source.find((deal) => deal.id === id)).filter((deal): deal is Deal => Boolean(deal)).slice(0, 6);
  }, [catalog, deals, recentDealIds]);

  const recommendedDeals = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    return [...source].filter((deal) => deal.isHot || deal.isFreeShipping).sort((a, b) => commercialScore(b) - commercialScore(a)).slice(0, 6);
  }, [catalog, deals]);

  const memberFavoriteDeals = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    return [...source].sort((a, b) => b.likeCount - a.likeCount || commercialScore(b) - commercialScore(a)).slice(0, 6);
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

  const mallHighlights = useMemo(
    () =>
      mallFilters
        .filter((mall) => mall.id !== "all")
        .map((mall) => {
          const mallDeals = catalog.filter((deal) => dealMatchesMallFilter(deal, mall.id));
          const bestDeal = [...mallDeals].sort((a, b) => commercialScore(b) - commercialScore(a))[0];

          return {
            ...mall,
            count: mallDeals.length,
            verifiedCount: mallDeals.filter(isVerifiedPurchaseLink).length,
            freeShippingCount: mallDeals.filter(isFreeShippingDeal).length,
            bestDeal,
            bestDiscount: mallDeals.reduce((best, deal) => Math.max(best, deal.discountRate), 0)
          };
        })
        .filter((mall) => mall.count > 0)
        .sort((a, b) => b.verifiedCount - a.verifiedCount || b.count - a.count || b.bestDiscount - a.bestDiscount)
        .slice(0, 8),
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

  const mallCounts = useMemo(
    () =>
      Object.fromEntries(
        mallFilters.map((mall) => [
          mall.id,
          mall.id === "all" ? catalog.length : catalog.filter((deal) => dealMatchesMallFilter(deal, mall.id)).length
        ])
      ),
    [catalog]
  );

  const priceBandCounts = useMemo(
    () =>
      Object.fromEntries(
        priceBands.map((band) => [
          band.id,
          band.id === "all" ? catalog.length : catalog.filter((deal) => dealMatchesPriceBand(deal, band.id)).length
        ])
      ),
    [catalog]
  );

  const popularSearchKeywords = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    const keywordScores = new Map<string, number>();

    for (const deal of source) {
      const baseScore = commercialScore(deal);
      const candidates = [
        deal.mallName,
        deal.category,
        ...deal.tags.slice(0, 3),
        ...deal.title.split(/\s+/).filter((word) => word.length >= 2).slice(0, 3)
      ];

      for (const candidate of candidates) {
        const keyword = candidate.replace(/[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ/+.-]/g, "").trim();
        if (keyword.length < 2 || /^\d+$/.test(keyword)) continue;
        keywordScores.set(keyword, (keywordScores.get(keyword) ?? 0) + baseScore);
      }
    }

    return Array.from(keywordScores.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
      .map(([keyword]) => keyword)
      .slice(0, 10);
  }, [catalog, deals]);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    const selectedChannel = getDealChannel(category);
    const selectedMall = mallFilters.find((mall) => mall.id === mallFilter);
    const selectedPriceBand = priceBands.find((band) => band.id === priceBand);

    if (query.trim()) labels.push(`검색: ${query.trim()}`);
    if (category !== "all") labels.push(selectedChannel.label);
    if (mallFilter !== "all" && selectedMall) labels.push(selectedMall.label);
    if (priceBand !== "all" && selectedPriceBand) labels.push(selectedPriceBand.label);
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
  }, [category, endingSoonOnly, freeShippingOnly, hotOnly, mallFilter, priceBand, query, sort, verifiedOnly]);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setMallFilter("all");
    setPriceBand("all");
    setSort("latest");
    setFreeShippingOnly(false);
    setHotOnly(false);
    setEndingSoonOnly(false);
    setVerifiedOnly(false);
    showToast("검색 조건을 초기화했습니다.");
  };

  const selectSearchKeyword = (keyword: string) => {
    setQuery(keyword);
    setActiveView("home");
    window.setTimeout(() => document.getElementById("all-deals")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const clearRecentSearchKeywords = () => {
    setRecentSearchKeywords([]);
    storeRecentSearchKeywords([]);
    showToast("최근 검색어를 지웠습니다.");
  };

  const clearRecentDeals = () => {
    void clearRecentDealsSynced()
      .then(() => {
        setRecentDealIds([]);
        showToast("최근 본 특가를 비웠습니다.");
      })
      .catch(() => {
        setRecentDealIds([]);
        showToast("이 기기의 최근 본 특가를 비웠습니다.");
      });
  };

  const openCategory = (id: string) => {
    setCategory(id);
    setActiveView("home");
    window.setTimeout(() => document.getElementById("deals")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const openMall = (id: string) => {
    setQuery("");
    setCategory("all");
    setMallFilter(id);
    setActiveView("home");
    window.setTimeout(() => document.getElementById("all-deals")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const openQuickDiscovery = (preset: "verified" | "freeShipping" | "endingSoon" | "hot") => {
    setQuery("");
    setCategory("all");
    setMallFilter("all");
    setPriceBand("all");
    setVerifiedOnly(preset === "verified");
    setFreeShippingOnly(preset === "freeShipping");
    setEndingSoonOnly(preset === "endingSoon");
    setHotOnly(preset === "hot");
    setSort(preset === "endingSoon" ? "endingSoon" : preset === "hot" ? "hot" : "latest");
    setActiveView("home");
    window.setTimeout(() => document.getElementById("all-deals")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
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

  const renderDealGrid = (items: Deal[], emptyTitle: string, emptyDescription: string, emptyAction: ReactNode = null) => {
    if (!items.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-dossa-red">
            <ShoppingBag size={26} />
          </div>
          <p className="mt-4 text-lg font-black text-slate-900">{emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">{emptyDescription}</p>
          {emptyAction ? <div className="mt-5 flex justify-center">{emptyAction}</div> : null}
          <p className="mx-auto mt-4 max-w-md text-xs font-semibold leading-5 text-slate-400">
            가격과 재고는 판매처에서 변동될 수 있으므로 구매 전 최종 조건을 다시 확인하세요.
          </p>
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
        <div className="rounded-[22px] border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-red-50 px-3 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-dossa-red">
                <ShieldCheck size={18} />
              </span>
              <span className="text-xs font-black text-dossa-deep">데이터 상태</span>
              <span className="text-xs font-black text-slate-950">{getProviderDisplayLabel(providerSource)}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
              구매 전 판매처 확인 <b className="text-slate-950">권장</b>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
              가격/재고 변동 <b>안내</b>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
              네트워크 <b className="text-slate-950">{isOffline ? "오프라인 모드" : "온라인"}</b>
            </span>
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
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="오늘 바로 볼 할인 지도">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black text-dossa-red">오늘 바로 볼 할인 지도</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-2xl">좋은 특가만 빠르게 좁혀보기</h3>
                </div>
                <p className="text-xs font-bold leading-5 text-slate-500">
                  판매처 이동 확인 특가 {dataQuality.verifiedLinkCount}개 · 구매 전 최종 가격 확인 권장
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => openQuickDiscovery("verified")}
                  className="min-h-[104px] rounded-3xl border border-emerald-100 bg-emerald-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100"
                  aria-label="판매처 이동이 확인된 특가만 보기"
                >
                  <CheckCircle2 size={20} className="text-emerald-700" />
                  <span className="mt-3 block text-sm font-black text-emerald-900">구매처 바로 확인</span>
                  <span className="mt-1 block text-xs font-bold text-emerald-700">{dataQuality.verifiedLinkCount}개 먼저 보기</span>
                </button>
                <button
                  type="button"
                  onClick={() => openQuickDiscovery("freeShipping")}
                  className="min-h-[104px] rounded-3xl border border-red-100 bg-red-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-100"
                  aria-label="무료배송 특가만 보기"
                >
                  <Truck size={20} className="text-dossa-red" />
                  <span className="mt-3 block text-sm font-black text-slate-950">무료배송 특가</span>
                  <span className="mt-1 block text-xs font-bold text-dossa-red">{dataQuality.freeShippingCount}개 모아보기</span>
                </button>
                <button
                  type="button"
                  onClick={() => openQuickDiscovery("endingSoon")}
                  className="min-h-[104px] rounded-3xl border border-amber-100 bg-amber-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-100"
                  aria-label="마감임박 특가만 보기"
                >
                  <Timer size={20} className="text-amber-700" />
                  <span className="mt-3 block text-sm font-black text-amber-950">마감임박</span>
                  <span className="mt-1 block text-xs font-bold text-amber-700">{stats.endingCount}개 빠른 확인</span>
                </button>
                <button
                  type="button"
                  onClick={() => openQuickDiscovery("hot")}
                  className="min-h-[104px] rounded-3xl border border-slate-200 bg-slate-950 p-3 text-left text-white transition hover:-translate-y-0.5 hover:bg-dossa-red"
                  aria-label="인기 급상승 특가만 보기"
                >
                  <Flame size={20} className="text-red-200" />
                  <span className="mt-3 block text-sm font-black">인기 급상승</span>
                  <span className="mt-1 block text-xs font-bold text-red-100">{stats.hotCount}개 인기순 보기</span>
                </button>
              </div>
            </section>

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

            <section className="rounded-[28px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-slate-50 p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black text-dossa-red">회원 전용 추천</p>
                  <h3 className="text-xl font-black text-slate-950">
                    {user ? `${nickname || "회원"}님이 이어볼 특가` : "로그인하면 찜과 최근 본 특가를 이어볼 수 있어요"}
                  </h3>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                    회원들이 많이 찜한 특가와 최근 본 상품을 함께 보여드립니다.
                  </p>
                </div>
                {user ? (
                  <Link href="/mypage" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">마이페이지</Link>
                ) : (
                  <Link href="/signup" className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-sm font-black text-white">무료로 시작하기</Link>
                )}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {memberFavoriteDeals.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => openDeal(deal)}
                    className="flex min-w-0 items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:bg-red-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xs font-black text-dossa-red">
                      {deal.likeCount}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                      <span className="block truncate text-xs font-bold text-slate-500">{deal.mallName} · 찜 많은 특가</span>
                    </span>
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-dossa-red">{recentDeals.length ? "최근 본 특가" : "추천 특가"}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">
                      {recentDeals.length ? "방금 보던 상품 이어보기" : "처음 보는 분을 위한 추천"}
                    </h3>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                      {recentDeals.length
                        ? "최근 확인한 특가를 다시 열고, 필요 없으면 기록을 바로 비울 수 있습니다."
                        : "상세를 열거나 판매처를 확인하면 최근 본 특가가 여기에 쌓입니다."}
                    </p>
                  </div>
                  {recentDeals.length ? (
                    <button
                      type="button"
                      onClick={clearRecentDeals}
                      className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 transition hover:border-red-100 hover:text-dossa-red"
                      aria-label="최근 본 특가 모두 비우기"
                    >
                      기록 비우기
                    </button>
                  ) : (
                    <Link href="/?verifiedOnly=true" className="shrink-0 rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-dossa-red">
                      구매처 확인
                    </Link>
                  )}
                </div>
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
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href="/favorites" className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center text-xs font-black text-slate-600 transition hover:bg-red-50 hover:text-dossa-red">
                    찜 목록 보기
                  </Link>
                  <Link href="/mypage" className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center text-xs font-black text-slate-600 transition hover:bg-red-50 hover:text-dossa-red">
                    최근 기록 관리
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="쇼핑몰별 특가 바로가기">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black text-dossa-red">쇼핑몰별 특가 바로가기</p>
                  <h3 className="text-xl font-black text-slate-950">자주 쓰는 판매처만 골라보기</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                    구매처 확인이 많은 판매처를 먼저 정리했습니다. 클릭하면 해당 쇼핑몰 특가만 바로 필터링됩니다.
                  </p>
                </div>
                <Link href="/categories" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">
                  전체 채널 보기
                </Link>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {mallHighlights.map((mall) => (
                  <button
                    key={mall.id}
                    type="button"
                    onClick={() => openMall(mall.id)}
                    className="min-h-[154px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50"
                    aria-label={`${mall.label} 쇼핑몰 특가 ${mall.count}개 보기`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                        <Store size={19} />
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">{mall.count}개</span>
                    </span>
                    <span className="mt-4 block text-base font-black text-slate-950">{mall.label}</span>
                    <span className="mt-1 line-clamp-2 block min-h-9 text-xs font-bold leading-5 text-slate-500">
                      {mall.bestDeal?.title ?? "판매처별 특가를 모아봤습니다."}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-black">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">구매처 확인 {mall.verifiedCount}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">무료배송 {mall.freeShippingCount}</span>
                    </span>
                  </button>
                ))}
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
                    aria-label="쇼핑몰 필터"
                    className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none transition hover:border-red-200 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  >
                    {mallFilters.map((mall) => (
                      <option key={mall.id} value={mall.id}>
                        {mall.id === "all" ? mall.label : `${mall.label} (${mallCounts[mall.id] ?? 0})`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-[170px] flex-1">
                  <span className="sr-only">가격대 필터</span>
                  <select
                    value={priceBand}
                    onChange={(event) => setPriceBand(event.target.value as PriceBand)}
                    aria-label="가격대 필터"
                    className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none transition hover:border-red-200 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  >
                    {priceBands.map((band) => (
                      <option key={band.id} value={band.id}>
                        {band.id === "all" ? band.label : `${band.label} (${priceBandCounts[band.id] ?? 0})`}
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
                  aria-label={`무료배송만 보기 ${freeShippingOnly ? "켜짐" : "꺼짐"}`}
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
                  aria-label={`구매링크 확인된 특가만 보기 ${verifiedOnly ? "켜짐" : "꺼짐"}`}
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
                  aria-label={`핫딜만 보기 ${hotOnly ? "켜짐" : "꺼짐"}`}
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
                  aria-label={`마감임박 특가만 보기 ${endingSoonOnly ? "켜짐" : "꺼짐"}`}
                >
                  <Timer size={18} />
                  마감임박만
                </button>
              </div>
              <div className="mt-3">
                <CategoryTabs selected={category} onSelect={setCategory} counts={categoryCounts} />
              </div>
              <div className="mt-4">
                <SearchDiscoveryPanel
                  popularKeywords={popularSearchKeywords}
                  recentKeywords={recentSearchKeywords}
                  resultCount={deals.length}
                  onSelectKeyword={selectSearchKeyword}
                  onClearRecentKeywords={clearRecentSearchKeywords}
                />
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
                  aria-label="검색과 필터 조건 초기화"
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
                {providerSource === "production" || providerSource === "hybrid" ? "할인도사 운영 특가" : "할인도사 기본 특가"} · 주요 특가 브리핑은 2분 단위로 갱신됩니다.
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
                freeShippingOnly || hotOnly || endingSoonOnly || verifiedOnly || priceBand !== "all"
                  ? "선택한 필터를 줄이거나 다른 카테고리를 선택해보세요."
                  : "검색어를 줄이거나 다른 카테고리를 선택해보세요.",
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-dossa-red"
                >
                  조건 초기화하고 전체 특가 보기
                </button>
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
            <aside className="space-y-3">
              <NotificationPreferences />
              <PriceAlertList deals={catalog.length ? catalog : deals} />
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
          ? renderDealGrid(
              favoriteDeals,
              "아직 찜한 특가가 없습니다.",
              "마음에 드는 특가의 하트 버튼을 눌러 저장해보세요.",
              <button
                type="button"
                onClick={() => setActiveView("home")}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-dossa-red"
              >
                홈에서 특가 둘러보기
              </button>
            )
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
                  <p className="text-sm font-semibold text-slate-500">비회원도 둘러보고, 로그인하면 관심 특가를 이어볼 수 있습니다.</p>
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
                  비회원도 모든 특가를 자유롭게 볼 수 있습니다. 로그인하면 찜과 최근 본 상품, 관심 카테고리를 계정 기반으로 동기화할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-lg font-black text-slate-950">서비스 이용 안내</p>
              <div className="mt-4 space-y-3">
                {["구매 전 최종 가격 확인", "찜한 특가와 최근 본 상품 관리", "관심 카테고리와 알림 설정", "개인정보와 이용약관 확인"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <CheckCircle2 size={18} className="text-dossa-red" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-2 text-sm font-black text-slate-600">
                <Link href="/privacy" className="rounded-2xl bg-slate-50 px-4 py-3 hover:bg-red-50 hover:text-dossa-red">개인정보처리방침</Link>
                <Link href="/terms" className="rounded-2xl bg-slate-50 px-4 py-3 hover:bg-red-50 hover:text-dossa-red">이용약관</Link>
                <a href={getSupportMailto("할인도사 고객 문의")} className="rounded-2xl bg-slate-50 px-4 py-3 hover:bg-red-50 hover:text-dossa-red">
                  문의하기 · {supportEmail}
                </a>
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

      <LoginPromptSheet isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

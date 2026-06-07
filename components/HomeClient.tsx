"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, ExternalLink, Flame, Share2, ShieldCheck, SlidersHorizontal, Store, Timer, Truck, UserRound } from "lucide-react";
import { BenefitCheckInCard } from "@/components/BenefitCheckInCard";
import { BenefitDiscoverySections } from "@/components/BenefitDiscoverySections";
import { BenefitPlaybook, BenefitPreset } from "@/components/BenefitPlaybook";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ClaimedBenefitHomeSummary } from "@/components/ClaimedBenefitHomeSummary";
import { CommercialFooter } from "@/components/CommercialFooter";
import { ConsentSettings } from "@/components/ConsentSettings";
import { DailyBenefitChecklist } from "@/components/DailyBenefitChecklist";
import { FeaturedDealSections } from "@/components/FeaturedDealSections";
import { HotSignalSection } from "@/components/HotSignalSection";
import { LoginPromptSheet } from "@/components/LoginPromptSheet";
import { LiveDealFeed } from "@/components/LiveDealFeed";
import { HomeOfficialBenefitAlertRail } from "@/components/HomeOfficialBenefitAlertRail";
import { HomeDealGrid } from "@/components/home/HomeDealGrid";
import { HomeEmptyRecovery } from "@/components/home/HomeEmptyRecovery";
import { HomeLiveBenefitStrip } from "@/components/home/HomeLiveBenefitStrip";
import { HomeStatusStrip } from "@/components/home/HomeStatusStrip";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { PriceAlertList } from "@/components/PriceAlertList";
import { PurchaseConfirmSheet } from "@/components/PurchaseConfirmSheet";
import { PurchaseLinkOverview } from "@/components/PurchaseLinkOverview";
import { RealtimeNewsDealsSection } from "@/components/RealtimeNewsDealsSection";
import { SearchBar } from "@/components/SearchBar";
import { SearchDiscoveryPanel } from "@/components/SearchDiscoveryPanel";
import { SortSelect } from "@/components/SortSelect";
import { Toast } from "@/components/Toast";
import { TrueDealSpotlight } from "@/components/TrueDealSpotlight";
import { DealGridSkeleton } from "@/components/ui/StatePanel";
import { useAuth } from "@/components/AuthProvider";
import { getDealChannel, getProviderCategory } from "@/data/dealChannels";
import { mockHotSignals } from "@/data/mockHotSignals";
import { mockDeals } from "@/data/mockDeals";
import refreshedNewsSnapshot from "@/data/refreshedNewsDeals.json";
import { ConsentState, hasAffiliateConsent, hasAnalyticsConsent, readStoredConsent } from "@/lib/consent";
import { canOpenDealLink } from "@/lib/affiliate";
import { buildBenefitDecisionGuide } from "@/lib/deals/benefitDecisionGuide";
import { buildDailyBenefitBriefing } from "@/lib/deals/dailyBenefitBriefing";
import { buildDailyRoutinePlan } from "@/lib/deals/dailyRoutinePlan";
import { buildNewsDeadlineSummary } from "@/lib/deals/newsDeadlineInsights";
import { buildInitialNewsRecommendedQueries, buildInitialNewsTargetSections, buildNewsIntentGroups } from "@/lib/deals/newsRecommendedQueries";
import { buildPersonalizedBenefitQueue } from "@/lib/deals/personalizedBenefitQueue";
import { isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import {
  commercialScore,
  filterLocalDeals,
  isFreeShippingDeal
} from "@/lib/homeDealFilters";
import { getDealImageSrc } from "@/lib/imageSrc";
import {
  benefitFilters,
  fallbackInterestCategories,
  mallFilters,
  priceBands,
  quickInterestOptions,
  toastMessages,
  type PriceBand
} from "@/lib/homeDiscoveryConfig";
import { HOME_REFRESH_INTERVAL_MS, HOME_REFRESH_INTERVAL_SECONDS } from "@/lib/homeRealtimeConfig";
import {
  buildDealsRequestUrl,
  buildHomeRequestUrl,
  buildHotSignalsRequestUrl,
  buildLatestDealsRequestUrl,
  buildNewsDealsRequestUrl,
  type DealsResponse,
  type HomeFreshness,
  type HomeQualitySummary,
  type HomeResponse,
  type HotSignalsResponse,
  type NewsDealsResponse,
  requestJson
} from "@/lib/homeApi";
import { buildCombinedHomeSnapshot, buildHomeDealsSnapshot, buildHomeNewsSnapshot, buildLocalHomeDealsSnapshot, getNewsFreeBenefitCount, type HomeDealFilters } from "@/lib/homeDataSnapshots";
import {
  buildFilterOutcomeCards,
  buildHomeActiveFilterChips,
  buildHomeCategoryCounts,
  buildHomeCategoryHighlights,
  buildHomeCategoryStats,
  buildHomeDataQuality,
  buildHomeDealScanItems,
  buildHomeFilterActionQueue,
  buildHomeListRefinementChips,
  buildHomeMallCounts,
  buildHomeMallHighlights,
  buildHomePriceBandCounts,
  buildHomeResultInsightCards,
  buildHomeStats,
  buildListComparisonCards,
  buildPopularSearchKeywords,
  buildPublicDealSource,
  buildQuickBenefitFilterChips,
  buildQuickCategoryShortcuts,
  buildQuickMallFilterChips,
  buildQuickPriceFilterChips,
  buildQuickSearchSuggestions,
  buildSearchDecisionGuide,
  buildSearchPurposeCards,
  buildSearchResultGroups,
  buildSearchResultSnapshot,
  buildTodayBenefitQueue,
  selectHomeEmptySearchRecoveryDeals,
  selectHomeEmptySearchRecoveryKeywords,
  selectHomeEndingSoonDeals,
  selectHomeHeroDeal,
  selectHomeInstantDealRail,
  selectHomeQuickResultPicks,
  selectHomeTopDeals,
  selectMemberFavoriteHomeDeals,
  selectPersonalizedHomeDeals,
  selectRecentHomeDeals,
  selectRecommendedHomeDeals
} from "@/lib/homeDerivedData";
import { readRecentSearchKeywords, storeRecentSearchKeywords } from "@/lib/homeRecentSearches";
import { buildHomeUrlSearchParams, readHomeUrlState } from "@/lib/homeUrlState";
import { getHotSignalDiscoveryQuery } from "@/lib/hotSignalNavigation";
import { buildDealRedirectUrl, buildNativeSafeDealUrl } from "@/lib/redirectUrl";
import { rememberRecentNewsBenefitId } from "@/lib/recentNewsBenefits";
import { buildPublicAppShareUrl, buildPublicDealShareUrl } from "@/lib/shareUrl";
import { isNativeRuntime } from "@/lib/nativeRuntime";
import { shouldUseLocalBundleData } from "@/lib/runtimeApi";
import {
  clearRecentDealsSynced,
  fetchRemotePreferences,
  readLocalFavoriteIds,
  readLocalPreferences,
  recordRecentDealView,
  savePreferencesSynced,
  syncFavoritesWithSupabase,
  syncRecentDealsWithSupabase,
  toggleFavoriteSynced
} from "@/lib/memberSync";
import { getSupportMailto, supportEmail } from "@/lib/support";
import { Deal, DealBenefitType, DealSort } from "@/types/deal";
import { HotSignal } from "@/types/hotSignal";
import type { NewsDeadlineSummary, NewsDeal, NewsDealSourceTrust, NewsIntentGroup, NewsTargetSection } from "@/types/newsDeal";

type AppView = "home" | "categories" | "alerts" | "favorites" | "my";
const INITIAL_HOME_DEAL_LIMIT = 12;
const HOME_DEAL_LOAD_STEP = 12;
const initialNewsSnapshot = refreshedNewsSnapshot as { generatedAt?: string; deals?: NewsDeal[]; sourceTrustScores?: NewsDealSourceTrust[]; intentGroups?: NewsIntentGroup[] };

export default function Home() {
  const { configured: authConfigured, user, nickname } = useAuth();
  const userId = user?.id;
  const [hasAppliedInitialParams, setHasAppliedInitialParams] = useState(false);
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [catalog, setCatalog] = useState<Deal[]>(mockDeals);
  const [activeView, setActiveView] = useState<AppView>("home");
  const [query, setQuery] = useState("");
  const [visibleDealCount, setVisibleDealCount] = useState(INITIAL_HOME_DEAL_LIMIT);
  const [showDeepBenefitSections, setShowDeepBenefitSections] = useState(false);
  const [showAdvancedFilterPanel, setShowAdvancedFilterPanel] = useState(false);
  const [recentSearchKeywords, setRecentSearchKeywords] = useState<string[]>([]);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<DealSort>("latest");
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [hotOnly, setHotOnly] = useState(false);
  const [endingSoonOnly, setEndingSoonOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [mallFilter, setMallFilter] = useState("all");
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [benefitFilter, setBenefitFilter] = useState<"all" | DealBenefitType>("all");
  const [updatedAt, setUpdatedAt] = useState("");
  const [lastHomeSyncAt, setLastHomeSyncAt] = useState("");
  const [homeFreshness, setHomeFreshness] = useState<HomeFreshness | null>(null);
  const [homeQuality, setHomeQuality] = useState<HomeQualitySummary | null>(null);
  const [providerSource, setProviderSource] = useState("mock");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [hotSignals, setHotSignals] = useState<HotSignal[]>(mockHotSignals);
  const [isSignalLoading, setIsSignalLoading] = useState(false);
  const [newsDeals, setNewsDeals] = useState<NewsDeal[]>(() => initialNewsSnapshot.deals ?? []);
  const [newsTotalCount, setNewsTotalCount] = useState(() => initialNewsSnapshot.deals?.length ?? 0);
  const [newsFreeBenefitCount, setNewsFreeBenefitCount] = useState(() => getNewsFreeBenefitCount(undefined, undefined, initialNewsSnapshot.deals ?? []));
  const [newsRecommendedQueries, setNewsRecommendedQueries] = useState<Array<{ query: string; count: number }>>(() =>
    buildInitialNewsRecommendedQueries(initialNewsSnapshot.deals ?? [])
  );
  const [newsTargetSections, setNewsTargetSections] = useState<NewsTargetSection[]>(() => buildInitialNewsTargetSections(initialNewsSnapshot.deals ?? []));
  const [newsIntentGroups, setNewsIntentGroups] = useState<NewsIntentGroup[]>(() => initialNewsSnapshot.intentGroups ?? buildNewsIntentGroups(initialNewsSnapshot.deals ?? []));
  const [newsSourceTrustScores, setNewsSourceTrustScores] = useState<NewsDealSourceTrust[]>(() => initialNewsSnapshot.sourceTrustScores ?? []);
  const [newsDeadlineSummary, setNewsDeadlineSummary] = useState<NewsDeadlineSummary>(() => buildNewsDeadlineSummary(initialNewsSnapshot.deals ?? []));
  const [newsUpdatedAt, setNewsUpdatedAt] = useState(initialNewsSnapshot.generatedAt ?? "");
  const [newsFreshness, setNewsFreshness] = useState<{
    status: "fresh" | "due" | "stale" | "seed";
    label: string;
    ageMinutes: number | null;
    nextRefreshAt: string;
  }>({
    status: initialNewsSnapshot.generatedAt ? "fresh" : "seed",
    label: initialNewsSnapshot.generatedAt ? "최근 확인" : "seed 기준",
    ageMinutes: null,
    nextRefreshAt: ""
  });
  const [isNewsRefreshing, setIsNewsRefreshing] = useState(false);
  const [newsRefreshError, setNewsRefreshError] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentDealIds, setRecentDealIds] = useState<string[]>([]);
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>(fallbackInterestCategories);
  const [toast, setToast] = useState("");
  const [pendingPurchaseDeal, setPendingPurchaseDeal] = useState<Deal | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const homeDealFilters = useMemo<HomeDealFilters>(
    () => ({
      category,
      query,
      sort,
      freeShippingOnly,
      hotOnly,
      endingSoonOnly,
      verifiedOnly,
      mallFilter,
      priceBand,
      benefitFilter
    }),
    [benefitFilter, category, endingSoonOnly, freeShippingOnly, hotOnly, mallFilter, priceBand, query, sort, verifiedOnly]
  );

  const refreshNewsDeals = useCallback(
    async ({ silent = false, notify = false }: { silent?: boolean; notify?: boolean } = {}) => {
      try {
        if (await shouldUseLocalBundleData()) return;
        if (silent && typeof document !== "undefined" && document.visibilityState === "hidden") return;

        setIsNewsRefreshing(true);
        const data = await requestJson<NewsDealsResponse>(
          buildNewsDealsRequestUrl({
            query,
            sort: query.trim() ? "endingSoon" : "priority"
          })
        );
        const snapshot = buildHomeNewsSnapshot(data);
        setNewsDeals(snapshot.deals);
        setNewsTotalCount(snapshot.totalCount);
        setNewsFreeBenefitCount(snapshot.freeBenefitCount);
        setNewsRecommendedQueries(snapshot.recommendedQueries);
        setNewsTargetSections(snapshot.targetSections.length ? snapshot.targetSections : buildInitialNewsTargetSections(snapshot.deals));
        setNewsIntentGroups(snapshot.intentGroups.length ? snapshot.intentGroups : buildNewsIntentGroups(snapshot.deals));
        setNewsSourceTrustScores(snapshot.sourceTrustScores);
        setNewsDeadlineSummary(snapshot.deadlineSummary);
        setNewsUpdatedAt(snapshot.updatedAt);
        setNewsFreshness(snapshot.freshness);
        setNewsRefreshError("");
        if (notify) showToast("공식 혜택 정보를 다시 확인했습니다.");
      } catch {
        setNewsRefreshError("연결이 불안정해 기존 혜택을 유지합니다.");
        if (notify) showToast("공식 혜택을 다시 확인하지 못했습니다.");
      } finally {
        setIsNewsRefreshing(false);
      }
    },
    [query, showToast]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setConsent(readStoredConsent());
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    let active = true;

    const hydratePreferences = async () => {
      const localPreferences = readLocalPreferences();
      const remotePreferences = authConfigured && userId ? await fetchRemotePreferences() : null;
      const nextCategories = remotePreferences?.favoriteCategories?.length ? remotePreferences.favoriteCategories : localPreferences.favoriteCategories;

      if (active) {
        setFavoriteCategories(nextCategories);
      }
    };

    hydratePreferences().catch(() => {
      if (active) {
        setFavoriteCategories(readLocalPreferences().favoriteCategories);
      }
    });

    return () => {
      active = false;
    };
  }, [authConfigured, userId]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setRecentSearchKeywords(readRecentSearchKeywords());
      const {
        category: initialCategory,
        mall: initialMall,
        sort: initialSort,
        query: initialQuery,
        freeShippingOnly: initialFreeShipping,
        hotOnly: initialHotOnly,
        endingSoonOnly: initialEndingSoon,
        verifiedOnly: initialVerifiedOnly,
        priceBand: initialPriceBand,
        benefitFilter: initialBenefitType
      } = readHomeUrlState(window.location.search);

      if (initialCategory) {
        setCategory(initialCategory);
        setActiveView("home");
      }

      if (initialMall) {
        setMallFilter(initialMall);
        setActiveView("home");
      }

      if (initialSort) {
        setSort(initialSort);
        setActiveView("home");
      }

      if (initialQuery) {
        setQuery(initialQuery);
        setActiveView("home");
      }

      if (initialFreeShipping) {
        setFreeShippingOnly(true);
        setActiveView("home");
      }

      if (initialHotOnly) {
        setHotOnly(true);
        setActiveView("home");
      }

      if (initialEndingSoon) {
        setEndingSoonOnly(true);
        setActiveView("home");
      }

      if (initialVerifiedOnly) {
        setVerifiedOnly(true);
        setActiveView("home");
      }

      if (initialPriceBand) {
        setPriceBand(initialPriceBand);
        setActiveView("home");
      }

      if (initialBenefitType) {
        setBenefitFilter(initialBenefitType);
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
    if (!hasAppliedInitialParams || typeof window === "undefined") return;

    const handle = window.setTimeout(() => {
      const params = buildHomeUrlSearchParams({ category, query, sort, freeShippingOnly, hotOnly, endingSoonOnly, verifiedOnly, mallFilter, priceBand, benefitFilter });
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
        window.history.replaceState(null, "", nextUrl);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [benefitFilter, category, endingSoonOnly, freeShippingOnly, hasAppliedInitialParams, hotOnly, mallFilter, priceBand, query, sort, verifiedOnly]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setVisibleDealCount(INITIAL_HOME_DEAL_LIMIT);
    }, 0);

    return () => window.clearTimeout(handle);
  }, [activeView, benefitFilter, category, endingSoonOnly, freeShippingOnly, hotOnly, mallFilter, priceBand, query, sort, verifiedOnly]);

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
    async (toastMessage?: string, silent = false) => {
      if (!silent) setIsLoading(true);

      try {
        if (await shouldUseLocalBundleData()) {
          const snapshot = buildLocalHomeDealsSnapshot(mockDeals, homeDealFilters, "android bundle");
          setDeals(snapshot.deals);
          setCatalog(snapshot.catalog);
          setProviderSource(snapshot.providerSource);
          setUpdatedAt(snapshot.updatedAt);

          if (toastMessage) {
            showToast(toastMessage);
          }

          return;
        }

        if (!isOffline) setLoadError("");
        const data = await requestJson<DealsResponse>(
          buildDealsRequestUrl(homeDealFilters)
        );

        const snapshot = buildHomeDealsSnapshot(data, homeDealFilters);
        setDeals(snapshot.deals);
        setUpdatedAt(snapshot.updatedAt);
        setProviderSource(snapshot.providerSource);
        if (snapshot.catalog) setCatalog(snapshot.catalog);

        if (toastMessage) {
          showToast(toastMessage);
        }
      } catch {
        setLoadError("특가 데이터를 불러오지 못했습니다. 기본 저장 데이터를 표시합니다.");
        const snapshot = buildLocalHomeDealsSnapshot(mockDeals, homeDealFilters, "mock fallback");
        setDeals(snapshot.deals);
        setCatalog(snapshot.catalog);
        setProviderSource(snapshot.providerSource);
        setUpdatedAt(snapshot.updatedAt);
        showToast("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [homeDealFilters, isOffline, showToast]
  );

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

  const fetchSignals = useCallback(
    async (silent = false) => {
      if (!silent) setIsSignalLoading(true);

      try {
        if (await shouldUseLocalBundleData()) {
          setHotSignals(mockHotSignals);
          return;
        }

        const data = await requestJson<HotSignalsResponse>(
          buildHotSignalsRequestUrl({
            category: getProviderCategory(category) ?? category,
            query
          })
        );
        const nextSignals = Array.isArray(data.signals) && data.signals.length ? data.signals : mockHotSignals;
        setHotSignals(nextSignals);
      } catch {
        setHotSignals(mockHotSignals);
      } finally {
        if (!silent) setIsSignalLoading(false);
      }
    },
    [category, query]
  );

  useEffect(() => {
    async function fetchCatalog() {
      try {
        if (await shouldUseLocalBundleData()) {
          setCatalog(mockDeals);
          return;
        }

        const data = await requestJson<DealsResponse>(buildLatestDealsRequestUrl());
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

  const rememberRecentNewsBenefit = useCallback((deal: NewsDeal) => {
    rememberRecentNewsBenefitId(deal.id);
    showToast(`${deal.merchant} 공식 혜택을 최근 본 혜택에 저장했습니다.`);
  }, [showToast]);

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
    const shareUrl = buildPublicDealShareUrl(deal.id);
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

  const openHotSignal = (signal: HotSignal) => {
    const nextQuery = getHotSignalDiscoveryQuery(signal);
    const nextCategory = getProviderCategory(signal.category) ?? signal.category;

    setQuery(nextQuery);
    setCategory(nextCategory && nextCategory !== "전체" ? nextCategory : "all");
    setMallFilter("all");
    setPriceBand("all");
    setBenefitFilter("all");
    setVerifiedOnly(true);
    setFreeShippingOnly(false);
    setHotOnly(false);
    setEndingSoonOnly(false);
    setSort("hot");
    setActiveView("home");
    showToast("검증된 구매 링크 특가에서 관련 상품을 찾아봅니다.");
    window.setTimeout(() => {
      document.getElementById("deal-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const shareApp = async () => {
    const appUrl = buildPublicAppShareUrl();
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

  const refreshHomeSnapshot = useCallback(
    async ({ notify = false, silent = false }: { notify?: boolean; silent?: boolean } = {}) => {
      if (!silent) {
        setIsLoading(true);
        setIsNewsRefreshing(true);
        setIsSignalLoading(true);
      }

      try {
        if (await shouldUseLocalBundleData()) {
          await Promise.all([fetchDeals(undefined, true), refreshNewsDeals({ silent: true }), fetchSignals(true)]);
          const generatedAt = new Date().toISOString();
          setLastHomeSyncAt(generatedAt);
          setHomeQuality(null);
          setHomeFreshness({
            generatedAt,
            status: "fresh",
            label: "방금 업데이트",
            ageMinutes: 0,
            oldestChannel: "deals",
            nextRefreshAt: new Date(Date.now() + HOME_REFRESH_INTERVAL_MS).toISOString(),
            staleChannelCount: 0,
            channels: {
              deals: {
                updatedAt: generatedAt,
                ageMinutes: 0,
                status: "fresh",
                label: "방금 업데이트",
                count: mockDeals.length,
                source: "android bundle"
              },
              newsDeals: {
                updatedAt: generatedAt,
                ageMinutes: 0,
                status: "fresh",
                label: "방금 업데이트",
                count: initialNewsSnapshot.deals?.length ?? 0,
                source: "native"
              },
              hotSignals: {
                updatedAt: generatedAt,
                ageMinutes: 0,
                status: "fresh",
                label: "방금 업데이트",
                count: mockHotSignals.length,
                source: "native"
              }
            }
          });
          if (notify) showToast("최신 할인 정보를 다시 확인했습니다.");
          return;
        }

        const data = await requestJson<HomeResponse>(
          buildHomeRequestUrl({
            ...homeDealFilters,
            limit: 0
          })
        );
        const snapshot = buildCombinedHomeSnapshot(data, homeDealFilters);

        setDeals(snapshot.deals.deals);
        setUpdatedAt(snapshot.deals.updatedAt);
        setProviderSource(snapshot.deals.providerSource);
        if (snapshot.deals.catalog) setCatalog(snapshot.deals.catalog);

        setNewsDeals(snapshot.news.deals);
        setNewsTotalCount(snapshot.news.totalCount);
        setNewsFreeBenefitCount(snapshot.news.freeBenefitCount);
        setNewsRecommendedQueries(snapshot.news.recommendedQueries);
        setNewsTargetSections(snapshot.news.targetSections.length ? snapshot.news.targetSections : buildInitialNewsTargetSections(snapshot.news.deals));
        setNewsIntentGroups(snapshot.news.intentGroups.length ? snapshot.news.intentGroups : buildNewsIntentGroups(snapshot.news.deals));
        setNewsSourceTrustScores(snapshot.news.sourceTrustScores);
        setNewsDeadlineSummary(snapshot.news.deadlineSummary);
        setNewsUpdatedAt(snapshot.news.updatedAt);
        setNewsFreshness(snapshot.news.freshness);

        setHotSignals(snapshot.hotSignals.length ? snapshot.hotSignals : mockHotSignals);
        setLastHomeSyncAt(snapshot.updatedAt);
        setHomeFreshness(snapshot.freshness ?? null);
        setHomeQuality(snapshot.quality ?? null);
        setLoadError("");
        setNewsRefreshError("");
        if (notify) showToast("최신 할인 정보를 다시 확인했습니다.");
      } catch {
        setLoadError("최신 홈 데이터를 한 번에 불러오지 못해 기존 특가를 유지합니다.");
        setNewsRefreshError("공식 혜택 갱신이 지연되어 기존 혜택을 유지합니다.");
        await Promise.allSettled([fetchDeals(undefined, true), refreshNewsDeals({ silent: true }), fetchSignals(true)]);
        if (notify) showToast("일부 데이터를 다시 확인하지 못했습니다.");
      } finally {
        if (!silent) {
          setIsLoading(false);
          setIsNewsRefreshing(false);
          setIsSignalLoading(false);
        }
      }
    },
    [fetchDeals, fetchSignals, homeDealFilters, refreshNewsDeals, showToast]
  );

  const refreshHomeNow = () => {
    void refreshHomeSnapshot({ notify: true });
  };

  useEffect(() => {
    if (!hasAppliedInitialParams) return;

    let active = true;
    const refreshHomeIfVisible = () => {
      if (!active) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void refreshHomeSnapshot({ silent: true });
    };
    const initialHandle = window.setTimeout(refreshHomeIfVisible, 320);
    const intervalHandle = window.setInterval(refreshHomeIfVisible, HOME_REFRESH_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshHomeIfVisible();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearTimeout(initialHandle);
      window.clearInterval(intervalHandle);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hasAppliedInitialParams, refreshHomeSnapshot]);

  const stats = useMemo(() => buildHomeStats(deals, favorites), [deals, favorites]);
  const dataQuality = useMemo(() => buildHomeDataQuality(deals, catalog), [catalog, deals]);
  const homeFreshnessLabel = homeFreshness?.label ?? getRelativeTime(lastHomeSyncAt || updatedAt || newsUpdatedAt);
  const homeFreshnessUpdatedAt = homeFreshness?.generatedAt || lastHomeSyncAt || updatedAt || newsUpdatedAt;

  const alertDeals = useMemo(
    () => catalog.filter((deal) => deal.isHot || deal.isNew || deal.isEndingSoon).slice(0, 8),
    [catalog]
  );

  const favoriteDeals = useMemo(
    () => catalog.filter((deal) => favorites.includes(deal.id)),
    [catalog, favorites]
  );

  const categoryStats = useMemo(() => buildHomeCategoryStats(catalog), [catalog]);
  const publicDealSource = useMemo(() => buildPublicDealSource(catalog, deals), [catalog, deals]);
  const verifiedHomeDeals = useMemo(
    () => publicDealSource.filter((deal) => isVerifiedPurchaseLink(deal) && deal.purchaseLinkVerified && deal.linkStatus === "verified"),
    [publicDealSource]
  );
  const topDeals = useMemo(
    () => selectHomeTopDeals(publicDealSource).sort((a, b) => commercialScore(b) - commercialScore(a) || b.discountRate - a.discountRate),
    [publicDealSource]
  );
  const heroDeal = useMemo(() => topDeals[0] ?? selectHomeHeroDeal(publicDealSource), [publicDealSource, topDeals]);
  const endingSoonDeals = useMemo(() => selectHomeEndingSoonDeals(publicDealSource), [publicDealSource]);
  const instantDealRail = useMemo(() => selectHomeInstantDealRail(deals, publicDealSource), [deals, publicDealSource]);
  const recentDeals = useMemo(() => selectRecentHomeDeals(publicDealSource, deals, recentDealIds), [deals, publicDealSource, recentDealIds]);
  const recommendedDeals = useMemo(() => selectRecommendedHomeDeals(publicDealSource, deals), [deals, publicDealSource]);
  const memberFavoriteDeals = useMemo(() => selectMemberFavoriteHomeDeals(publicDealSource, deals), [deals, publicDealSource]);
  const personalizedDeals = useMemo(
    () => selectPersonalizedHomeDeals(catalog, deals, favoriteCategories, fallbackInterestCategories, memberFavoriteDeals, recommendedDeals),
    [catalog, deals, favoriteCategories, memberFavoriteDeals, recommendedDeals]
  );

  const interestLabels = favoriteCategories.length ? favoriteCategories : fallbackInterestCategories;
  const personalizedBenefitQueue = useMemo(
    () =>
      buildPersonalizedBenefitQueue(catalog.length ? catalog : deals, {
        interests: interestLabels,
        favoriteIds: favorites,
        recentIds: recentDealIds,
        limit: 4
      }),
    [catalog, deals, favorites, interestLabels, recentDealIds]
  );
  const personalizedApiHref = `/api/benefits/personalized?limit=4${interestLabels
    .slice(0, 4)
    .map((interest) => `&interest=${encodeURIComponent(interest)}`)
    .join("")}`;

  const categoryHighlights = useMemo(() => buildHomeCategoryHighlights(publicDealSource), [publicDealSource]);
  const mallHighlights = useMemo(() => buildHomeMallHighlights(catalog), [catalog]);
  const categoryCounts = useMemo(() => buildHomeCategoryCounts(catalog), [catalog]);
  const quickCategoryShortcuts = useMemo(() => buildQuickCategoryShortcuts(categoryCounts), [categoryCounts]);
  const mallCounts = useMemo(() => buildHomeMallCounts(catalog), [catalog]);
  const priceBandCounts = useMemo(() => buildHomePriceBandCounts(catalog), [catalog]);
  const quickMallFilterChips = useMemo(() => buildQuickMallFilterChips(mallCounts), [mallCounts]);
  const quickPriceFilterChips = useMemo(() => buildQuickPriceFilterChips(priceBandCounts), [priceBandCounts]);
  const quickBenefitFilterChips = useMemo(() => buildQuickBenefitFilterChips(), []);
  const popularSearchKeywords = useMemo(() => buildPopularSearchKeywords(catalog, deals), [catalog, deals]);
  const quickSearchSuggestions = useMemo(
    () => buildQuickSearchSuggestions(recentSearchKeywords, popularSearchKeywords),
    [popularSearchKeywords, recentSearchKeywords]
  );
  const activeFilterChips = useMemo(
    () =>
      buildHomeActiveFilterChips({
        category,
        query,
        sort,
        freeShippingOnly,
        hotOnly,
        endingSoonOnly,
        verifiedOnly,
        mallFilter,
        priceBand,
        benefitFilter
      }),
    [benefitFilter, category, endingSoonOnly, freeShippingOnly, hotOnly, mallFilter, priceBand, query, sort, verifiedOnly]
  );
  const activeFilterLabels = useMemo(() => activeFilterChips.map((chip) => chip.label), [activeFilterChips]);
  const hasMobileVisibleFilterReset = useMemo(
    () => activeFilterChips.some((chip) => chip.id !== "verified"),
    [activeFilterChips]
  );

  const filterOutcomeCards = useMemo(() => buildFilterOutcomeCards(deals, activeFilterLabels), [activeFilterLabels, deals]);

  const searchResultSnapshot = useMemo(() => buildSearchResultSnapshot(deals), [deals]);

  const searchDecisionGuide = useMemo(() => buildSearchDecisionGuide(deals), [deals]);

  const dealScanBarItems = useMemo(
    () =>
      buildHomeDealScanItems(deals).map((item) => ({
        ...item,
        active:
          (item.id === "verified" && verifiedOnly) ||
          (item.id === "freeShipping" && freeShippingOnly) ||
          (item.id === "hot" && hotOnly) ||
          (item.id === "price" && sort === "price") ||
          (item.id === "discount" && sort === "discount"),
        action: () => {
          if (item.id === "verified") setVerifiedOnly((current) => !current);
          if (item.id === "freeShipping") setFreeShippingOnly((current) => !current);
          if (item.id === "hot") setHotOnly((current) => !current);
          if (item.id === "price") setSort("price");
          if (item.id === "discount") setSort("discount");
        }
      })),
    [deals, freeShippingOnly, hotOnly, sort, verifiedOnly]
  );

  const listComparisonCards = useMemo(() => buildListComparisonCards(deals), [deals]);

  const listRefinementChips = useMemo(
    () =>
      buildHomeListRefinementChips(deals, { mallFilter, category, benefitFilter, verifiedOnly, freeShippingOnly, endingSoonOnly }).map((item) => ({
        ...item,
        action: () => {
          if (item.kind === "mall") {
            setMallFilter(item.target);
            showToast(`${item.label} 특가만 모아봅니다.`);
          }

          if (item.kind === "category") {
            setCategory(item.target);
            showToast(`${item.label} 카테고리만 봅니다.`);
          }

          if (item.kind === "benefit") {
            setBenefitFilter(item.target);
            showToast(`${item.label} 혜택만 봅니다.`);
          }

          if (item.target === "verified") {
            setVerifiedOnly((current) => !current);
            showToast(verifiedOnly ? "구매처 확인 필터를 해제했습니다." : "구매처 확인된 특가만 봅니다.");
          }

          if (item.target === "freeShipping") {
            setFreeShippingOnly((current) => !current);
            showToast(freeShippingOnly ? "무료배송 필터를 해제했습니다." : "무료배송 특가만 봅니다.");
          }

          if (item.target === "endingSoon") {
            setEndingSoonOnly((current) => !current);
            showToast(endingSoonOnly ? "마감임박 필터를 해제했습니다." : "마감임박 특가만 봅니다.");
          }
        }
      })),
    [benefitFilter, category, deals, endingSoonOnly, freeShippingOnly, mallFilter, showToast, verifiedOnly]
  );

  const searchResultGroups = useMemo(() => buildSearchResultGroups(catalog, deals, query), [catalog, deals, query]);

  const resultInsightCards = useMemo(
    () =>
      buildHomeResultInsightCards(deals, searchResultGroups, { mallFilter, category, benefitFilter, verifiedOnly }).map((item) => ({
        ...item,
        action: () => {
          if (item.id === "mall" && item.target) setMallFilter(item.target);
          if (item.id === "category" && item.target) setCategory(item.target);
          if (item.id === "benefit" && item.target) setBenefitFilter(item.target);
          if (item.id === "verified") setVerifiedOnly((current) => !current);
        }
      })),
    [benefitFilter, category, deals, mallFilter, searchResultGroups, verifiedOnly]
  );

  const filterActionQueue = useMemo(() => buildHomeFilterActionQueue(deals), [deals]);
  const quickResultPicks = useMemo(() => selectHomeQuickResultPicks(deals), [deals]);
  const emptySearchRecoveryDeals = useMemo(() => selectHomeEmptySearchRecoveryDeals(catalog, deals), [catalog, deals]);
  const emptySearchRecoveryKeywords = useMemo(() => selectHomeEmptySearchRecoveryKeywords(deals, query), [deals, query]);

  const todayBenefitQueue = useMemo(() => buildTodayBenefitQueue(catalog, deals), [catalog, deals]);
  const firstVisitDecisionGuide = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    return buildBenefitDecisionGuide(source);
  }, [catalog, deals]);
  const dailyBenefitBriefing = useMemo(() => buildDailyBenefitBriefing(catalog.length ? catalog : deals, new Date(), 3), [catalog, deals]);
  const dailyRoutinePlan = useMemo(() => buildDailyRoutinePlan(catalog.length ? catalog : deals, 2), [catalog, deals]);

  const searchPurposeCards = useMemo(() => buildSearchPurposeCards(catalog, deals), [catalog, deals]);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setMallFilter("all");
    setPriceBand("all");
    setBenefitFilter("all");
    setSort("latest");
    setFreeShippingOnly(false);
    setHotOnly(false);
    setEndingSoonOnly(false);
    setVerifiedOnly(false);
    showToast("검색 조건을 초기화했습니다.");
  };

  const scrollToDealList = () => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      document.getElementById("deal-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const openQuickDiscoveryAndScroll = (preset: "verified" | "freeShipping" | "endingSoon" | "hot") => {
    openQuickDiscovery(preset);
    scrollToDealList();
  };

  const resetFiltersAndScroll = () => {
    resetFilters();
    scrollToDealList();
  };

  const removeActiveFilter = (id: string) => {
    if (id === "query") setQuery("");
    if (id === "category") setCategory("all");
    if (id === "mall") setMallFilter("all");
    if (id === "price") setPriceBand("all");
    if (id === "benefit") setBenefitFilter("all");
    if (id === "verified") setVerifiedOnly(false);
    if (id === "freeShipping") setFreeShippingOnly(false);
    if (id === "hot") setHotOnly(false);
    if (id === "endingSoon") setEndingSoonOnly(false);
    if (id === "sort") setSort("latest");
    showToast("선택한 조건을 해제했습니다.");
  };

  const selectSearchKeyword = (keyword: string) => {
    setQuery(keyword);
    setActiveView("home");
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
  };

  const openMall = (id: string) => {
    setQuery("");
    setCategory("all");
    setMallFilter(id);
    setActiveView("home");
  };

  const openBenefitFilter = (type: DealBenefitType) => {
    setQuery("");
    setCategory(type === "coupon" ? "coupon" : type === "freeShipping" || type === "freebie" ? "freezero" : "all");
    setMallFilter("all");
    setPriceBand("all");
    setBenefitFilter(type);
    setFreeShippingOnly(type === "freeShipping");
    setVerifiedOnly(false);
    setHotOnly(false);
    setEndingSoonOnly(false);
    setSort(type === "freebie" || type === "coupon" ? "hot" : "latest");
    setActiveView("home");
  };

  const openBenefitPreset = (preset: BenefitPreset) => {
    setQuery(preset.query ?? "");
    setCategory(preset.category ?? "all");
    setMallFilter("all");
    setPriceBand("all");
    setBenefitFilter(preset.dealType ?? "all");
    setFreeShippingOnly(Boolean(preset.freeShippingOnly));
    setVerifiedOnly(Boolean(preset.verifiedOnly));
    setHotOnly(false);
    setEndingSoonOnly(Boolean(preset.endingSoonOnly));
    setSort(preset.sort ?? "latest");
    setActiveView("home");
  };

  const openQuickDiscovery = (preset: "verified" | "freeShipping" | "endingSoon" | "hot") => {
    setQuery("");
    setCategory("all");
    setMallFilter("all");
    setPriceBand("all");
    setBenefitFilter(preset === "freeShipping" ? "freeShipping" : "all");
    setVerifiedOnly(preset === "verified");
    setFreeShippingOnly(preset === "freeShipping");
    setEndingSoonOnly(preset === "endingSoon");
    setHotOnly(preset === "hot");
    setSort(preset === "endingSoon" ? "endingSoon" : preset === "hot" ? "hot" : "latest");
    setActiveView("home");
  };

  const applySearchDecisionGuide = () => {
    if (searchDecisionGuide.action === "reset") {
      resetFilters();
      return;
    }

    if (searchDecisionGuide.action === "verified") {
      setVerifiedOnly(true);
      setActiveView("home");
      return;
    }

    if (searchDecisionGuide.action === "discount") {
      setSort("discount");
      setActiveView("home");
      return;
    }

    openQuickDiscovery(searchDecisionGuide.action);
  };

  const toggleQuickInterest = (interest: string) => {
    const currentPreferences = readLocalPreferences();
    const exists = favoriteCategories.includes(interest);
    const nextCategories = exists
      ? favoriteCategories.filter((categoryLabel) => categoryLabel !== interest)
      : [...favoriteCategories, interest];
    const nextPreferences = {
      ...currentPreferences,
      favoriteCategories: nextCategories
    };

    setFavoriteCategories(nextCategories);
    void savePreferencesSynced(nextPreferences, user?.email ?? null, nickname ?? undefined).catch(() => {
      setFavoriteCategories(readLocalPreferences().favoriteCategories);
      showToast("관심 설정을 이 기기에 저장했습니다.");
    });
    showToast(exists ? `${interest} 관심 설정을 해제했습니다.` : `${interest} 관심 혜택을 홈 추천에 반영했습니다.`);
  };

  const openReviewNeededDeals = () => {
    setQuery("");
    setCategory("all");
    setMallFilter("all");
    setPriceBand("all");
    setVerifiedOnly(false);
    setFreeShippingOnly(false);
    setEndingSoonOnly(false);
    setHotOnly(false);
    setSort("latest");
    setDeals(filterLocalDeals(catalog.filter((deal) => !isVerifiedPurchaseLink(deal)), "전체", "", "latest"));
    setActiveView("home");
    showToast("판매처 확인 단계 상품을 모았습니다. 이동 전 최종 조건을 확인해주세요.");
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

  return (
    <div className="min-h-screen">
      <p className="sr-only">
        할인도사는 검증된 특가와 공식 혜택을 검색, 필터, 정렬해 보여주며 구매 전 판매처 확인과 신고 기능을 제공합니다.
        상품 목록, 공식 혜택, 무료 혜택, 찜, 최근 본 상품, 하단 네비게이션을 통해 원하는 혜택으로 이동할 수 있습니다.
      </p>
      <section id="deals" className="space-y-2 px-2 py-2 sm:space-y-4 sm:px-4 sm:py-4 lg:px-0 lg:py-8">
        <div className="hidden flex-wrap items-center justify-between gap-3 lg:flex">
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
        {activeView === "home" ? (
          <section className="rounded-2xl border border-red-100 bg-white p-2 shadow-sm sm:rounded-[28px] sm:p-4" aria-label="빠른 상품 검색">
            <div className="mb-2 hidden flex-col gap-1 sm:mb-3 sm:flex sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-dossa-red">빠른 상품 검색</p>
                <h3 className="text-lg font-black text-slate-950 sm:text-xl">찾고 싶은 특가를 바로 좁혀보세요</h3>
              </div>
              <p className="text-xs font-bold text-slate-500">검색, 쇼핑몰, 정렬, 핵심 필터를 한 번에 적용합니다.</p>
            </div>
            <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  suggestions={quickSearchSuggestions}
                  resultCount={deals.length}
                  onSelectSuggestion={selectSearchKeyword}
                />
              </div>
              <div className="hidden grid-cols-2 gap-2 sm:grid lg:flex lg:items-center">
                <SortSelect value={sort} onChange={setSort} />
                <select
                  aria-label="쇼핑몰 필터"
                  value={mallFilter}
                  onChange={(event) => setMallFilter(event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 outline-none transition focus:border-dossa-red focus:ring-4 focus:ring-red-100"
                >
                  {mallFilters.map((mall) => (
                    <option key={mall.id} value={mall.id}>
                      {mall.id === "all" ? mall.label : `${mall.label} ${mallCounts[mall.id] ?? 0}개`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!activeFilterLabels.length}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
                >
                  초기화
                </button>
              </div>
            </div>
            <div className="mt-3 hidden grid-cols-2 gap-2 sm:grid lg:grid-cols-4" aria-label="검색 결과 핵심 요약">
              {searchResultSnapshot.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-black text-slate-400">{item.label}</p>
                  <p className="mt-1 truncate text-sm font-black text-slate-950 sm:text-base">{item.value}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-500">{item.helper}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 hidden flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 sm:flex sm:flex-row sm:items-center sm:justify-between" aria-label="검색 결과 추천 판단">
              <div className="min-w-0">
                <p className="text-[11px] font-black text-dossa-red">{searchDecisionGuide.label}</p>
                <p className="mt-1 text-sm font-black text-slate-950 sm:text-base">{searchDecisionGuide.title}</p>
                <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-dossa-deep">{searchDecisionGuide.copy}</p>
              </div>
              <button
                type="button"
                onClick={applySearchDecisionGuide}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-dossa-red px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-950"
                aria-label={`${searchDecisionGuide.title} ${searchDecisionGuide.actionLabel}`}
              >
                {searchDecisionGuide.actionLabel}
              </button>
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:mt-3 sm:gap-2 [&::-webkit-scrollbar]:hidden">
              {[
                { label: "최신순", active: sort === "latest", onClick: () => setSort("latest"), icon: <Timer size={16} /> },
                { label: "오늘특가", active: hotOnly, onClick: () => openQuickDiscovery("hot"), icon: <Flame size={16} /> },
                { label: "무료배송", active: freeShippingOnly, onClick: () => openQuickDiscovery("freeShipping"), icon: <Truck size={16} /> },
                { label: "마감임박", active: endingSoonOnly, onClick: () => openQuickDiscovery("endingSoon"), icon: <Timer size={16} /> },
                { label: "직접구매", active: verifiedOnly, onClick: () => openQuickDiscovery("verified"), icon: <ShieldCheck size={16} /> },
                { label: "쿠폰", active: benefitFilter === "coupon", onClick: () => openBenefitFilter("coupon"), icon: <CheckCircle2 size={16} /> }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-black transition sm:min-h-11 sm:gap-2 sm:rounded-2xl sm:text-sm ${
                    item.active
                      ? "border-transparent bg-gradient-to-r from-[#ff2b2b] to-[#ff6a3d] text-white shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-dossa-red"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-2 py-1.5 text-[11px] font-bold text-slate-500 sm:hidden">
              <span className="min-w-0 truncate">
                실시간 검증됨 · {verifiedHomeDeals.length.toLocaleString("ko-KR")}개 · 무료/쿠폰 {newsFreeBenefitCount.toLocaleString("ko-KR")}개 · {homeFreshnessLabel}
              </span>
              <button
                type="button"
                onClick={refreshHomeNow}
                disabled={isLoading || isNewsRefreshing || isSignalLoading}
                className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-full bg-dossa-red px-3 text-[11px] font-black text-white disabled:cursor-wait disabled:opacity-65"
                aria-label="최신 특가와 무료혜택 다시 확인"
              >
                {isLoading || isNewsRefreshing || isSignalLoading ? "확인 중" : "새로고침"}
              </button>
            </div>
            {hasMobileVisibleFilterReset ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 inline-flex min-h-8 items-center rounded-full px-2 text-[11px] font-black text-dossa-red sm:hidden"
              >
                필터 초기화
              </button>
            ) : null}
            <div className="mt-3 hidden gap-3 sm:grid xl:grid-cols-3" aria-label="쇼핑몰 가격 혜택 빠른 필터">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-slate-700">쇼핑몰 빠른 선택</p>
                  <p className="text-[11px] font-bold text-slate-400">자주 쓰는 판매처</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {quickMallFilterChips.map((mall) => (
                    <button
                      key={mall.id}
                      type="button"
                      onClick={() => setMallFilter((current) => (current === mall.id ? "all" : mall.id))}
                      className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-xs font-black transition ${
                        mallFilter === mall.id
                          ? "border-transparent bg-slate-950 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-dossa-red"
                      }`}
                      aria-pressed={mallFilter === mall.id}
                      aria-label={`${mall.label} 쇼핑몰 필터 적용`}
                    >
                      {mall.label}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${mallFilter === mall.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {mallCounts[mall.id] ?? 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-slate-700">가격 빠른 선택</p>
                  <p className="text-[11px] font-bold text-slate-400">예산별 보기</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {quickPriceFilterChips.map((band) => (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => setPriceBand((current) => (current === band.id ? "all" : band.id))}
                      className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-xs font-black transition ${
                        priceBand === band.id
                          ? "border-transparent bg-slate-950 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-dossa-red"
                      }`}
                      aria-pressed={priceBand === band.id}
                      aria-label={`${band.label} 가격대 필터 적용`}
                    >
                      {band.label}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${priceBand === band.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {priceBandCounts[band.id] ?? 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-slate-700">혜택 빠른 선택</p>
                  <p className="text-[11px] font-bold text-slate-400">무료·쿠폰·포인트</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {quickBenefitFilterChips.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => {
                        setBenefitFilter((current) => (current === filter.id ? "all" : filter.id));
                        setFreeShippingOnly((current) => (filter.id === "freeShipping" ? !current : false));
                      }}
                      className={`inline-flex min-h-10 shrink-0 items-center rounded-2xl border px-3 text-xs font-black transition ${
                        benefitFilter === filter.id
                          ? "border-transparent bg-slate-950 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-dossa-red"
                      }`}
                      aria-pressed={benefitFilter === filter.id}
                      aria-label={`${filter.label} 혜택 유형 필터 적용`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 sm:mt-3" aria-label="카테고리 바로가기">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="sr-only sm:not-sr-only sm:text-xs sm:font-black sm:text-slate-700">카테고리 바로가기</p>
                <p className="hidden text-[11px] font-bold text-slate-400 sm:block">원하는 분야만 빠르게 보기</p>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
                {quickCategoryShortcuts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openCategory(item.id)}
                    className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-black transition sm:min-h-10 sm:gap-2 sm:rounded-2xl sm:px-3 sm:text-xs ${
                      category === item.id
                        ? "border-transparent bg-slate-950 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-dossa-red"
                    }`}
                    aria-pressed={category === item.id}
                  >
                    {item.label}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${category === item.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 hidden flex-col gap-2 rounded-2xl bg-slate-50 px-3 py-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black text-slate-950">
                현재 결과 {deals.length}개
                <span className="ml-2 text-xs font-bold text-slate-500">
                  {query ? `"${query}" 검색 중` : "상품명, 브랜드, 쇼핑몰, 카테고리 통합 검색"}
                </span>
              </p>
              <p className="text-xs font-bold text-slate-500">
                상품 이동은 모두 새 탭에서 직접 구매 링크로 열립니다.
              </p>
            </div>
            <div className="mt-3 hidden rounded-2xl border border-slate-200 bg-white p-3 sm:block" aria-label="홈 탐색 바로가기">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-dossa-red">홈 탐색 바로가기</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-500">첫 화면에서 원하는 목록으로 바로 내려갑니다.</p>
                </div>
                <span className="hidden rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-dossa-red sm:inline-flex">
                  새 탭 구매 이동 유지
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  { label: "전체상품", helper: `${catalog.length || deals.length}개`, action: resetFiltersAndScroll, active: !activeFilterLabels.length },
                  { label: "오늘인기", helper: `${stats.hotCount}개`, action: () => openQuickDiscoveryAndScroll("hot"), active: hotOnly },
                  { label: "무료배송", helper: `${dataQuality.freeShippingCount}개`, action: () => openQuickDiscoveryAndScroll("freeShipping"), active: freeShippingOnly },
                  { label: "마감임박", helper: `${stats.endingCount}개`, action: () => openQuickDiscoveryAndScroll("endingSoon"), active: endingSoonOnly },
                  { label: "구매처확인", helper: `${dataQuality.verifiedLinkCount}개`, action: () => openQuickDiscoveryAndScroll("verified"), active: verifiedOnly }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    aria-pressed={item.active}
                    className={`min-h-14 rounded-2xl border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                      item.active
                        ? "border-transparent bg-gradient-to-r from-[#ff2b2b] to-[#ff6a3d] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-800 hover:border-red-100 hover:bg-red-50 hover:text-dossa-red"
                    }`}
                  >
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className={`mt-0.5 block text-[11px] font-bold ${item.active ? "text-white/80" : "text-slate-500"}`}>{item.helper}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        {activeView === "home" ? (
          <div className="hidden sm:block">
            <HomeStatusStrip
              dealCount={deals.length}
              verifiedDealCount={verifiedHomeDeals.length}
              publishableDealCount={homeQuality?.productDeals.publishableLinks ?? dataQuality.verifiedLinkCount}
              officialBenefitCount={newsTotalCount || homeQuality?.officialBenefits.publishable}
              averageQualityScore={homeQuality?.exposure.averageQualityScore ?? 0}
              newDealCount={stats.newCount}
              hotDealCount={stats.hotCount}
              isOffline={isOffline}
              providerSource={providerSource}
              latestPriceCheckedAt={dataQuality.latestPriceCheckedAt}
              updatedAt={homeFreshnessUpdatedAt}
              freshnessLabel={homeFreshness?.label}
              staleChannelCount={homeFreshness?.staleChannelCount}
              oldestChannel={homeFreshness?.oldestChannel}
              isRefreshing={isLoading || isNewsRefreshing || isSignalLoading}
              refreshIntervalSeconds={HOME_REFRESH_INTERVAL_SECONDS}
              onRefresh={refreshHomeNow}
            />
          </div>
        ) : null}
        {activeView === "home" ? (
          <section id="deal-list" className="scroll-mt-24 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm sm:p-3" aria-label="검증 특가 목록">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <p className="text-xs font-black text-dossa-red">검증 특가</p>
                <h3 className="truncate text-base font-black text-slate-950">
                  {query.trim() ? `"${query.trim()}" 검색 결과` : "지금 바로 볼 수 있는 상품"}
                </h3>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-black text-slate-500">현재 결과</p>
                <p className="text-sm font-black text-dossa-red">{deals.length.toLocaleString("ko-KR")}개</p>
              </div>
            </div>
            {isLoading && !deals.length ? (
              <DealGridSkeleton />
            ) : (
              <HomeDealGrid
                items={deals}
                visibleCount={visibleDealCount}
                loadStep={HOME_DEAL_LOAD_STEP}
                favoriteIds={favorites}
                emptyTitle={loadError ? "현재 검증된 특가를 불러오는 중입니다." : "조건에 맞는 특가가 없습니다."}
                emptyDescription={loadError || (freeShippingOnly || hotOnly || endingSoonOnly || verifiedOnly || priceBand !== "all"
                  ? "선택한 필터를 줄이거나 다른 카테고리를 선택해보세요."
                  : "검색어를 줄이거나 다른 카테고리를 선택해보세요.")}
                emptyAction={
                  <HomeEmptyRecovery
                    keywords={emptySearchRecoveryKeywords}
                    deals={emptySearchRecoveryDeals}
                    onResetFilters={resetFilters}
                    onSelectKeyword={selectSearchKeyword}
                    onOpenDeal={openDeal}
                  />
                }
                onLoadMore={setVisibleDealCount}
                onToggleFavorite={toggleFavorite}
                onOpenDeal={openDeal}
                onShareDeal={shareDeal}
              />
            )}
          </section>
        ) : null}
        {activeView === "home" ? (
          <HomeLiveBenefitStrip
            deals={newsDeals}
            totalCount={newsTotalCount}
            updatedAt={newsUpdatedAt}
            freshnessLabel={newsFreshness.label}
            freeBenefitCount={newsFreeBenefitCount}
            isRefreshing={isNewsRefreshing}
            onRefresh={() => {
              void refreshNewsDeals({ notify: true });
            }}
            onOpenNewsDeal={rememberRecentNewsBenefit}
          />
        ) : null}
        {activeView === "home" && instantDealRail.length ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:rounded-[28px] sm:p-4" aria-label="오늘 바로 볼 특가">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div>
                <p className="text-xs font-black text-dossa-red">오늘 바로 볼 특가</p>
                <h3 className="text-base font-black text-slate-950 sm:mt-1 sm:text-xl">먼저 확인할 상품</h3>
              </div>
              <p className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500 sm:bg-transparent sm:px-0 sm:text-xs sm:font-bold">
                옆으로 넘기기
              </p>
            </div>
            <div className="relative">
              <div
                className="mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-2 pb-1 pr-8 [scrollbar-width:none] sm:mt-3 sm:gap-3 sm:scroll-px-3 sm:pr-10 [&::-webkit-scrollbar]:hidden"
                aria-label="오늘 바로 볼 특가 가로 목록"
              >
                {instantDealRail.map((deal) => (
                  <article
                    key={deal.id}
                    className="group relative flex w-[138px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-white sm:w-[190px] sm:rounded-3xl"
                  >
                    <Link
                      href={`/deals/${deal.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                      aria-label={`${deal.title} 상세 정보 새 탭으로 보기`}
                    >
                      <span className="relative block aspect-[4/3] overflow-hidden bg-red-50 sm:aspect-square">
                        {deal.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getDealImageSrc(deal.thumbnail)}
                            alt={`${deal.title} 상품 이미지`}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-sm font-black text-dossa-red">SALE</span>
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-dossa-red px-2 py-0.5 text-[11px] font-black text-white sm:left-2 sm:top-2 sm:py-1 sm:text-xs">{deal.discountRate}%</span>
                        {deal.isFreeShipping ? (
                          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-dossa-red shadow-sm sm:bottom-2 sm:left-2 sm:py-1 sm:text-[11px]">무배</span>
                        ) : null}
                      </span>
                      <span className="block space-y-1 p-2 sm:space-y-1.5 sm:p-3">
                        <span className="flex items-center justify-between gap-2 text-[11px] font-black">
                          <span className="truncate text-dossa-red">{deal.mallName}</span>
                          <span className="hidden shrink-0 text-slate-400 sm:inline">{getRelativeTime(deal.priceCheckedAt)}</span>
                        </span>
                        <span className="line-clamp-2 min-h-8 text-xs font-black leading-4 text-slate-950 sm:min-h-10 sm:text-sm sm:leading-5">{deal.title}</span>
                        <span className="hidden text-[11px] font-bold text-slate-400 line-through sm:block">{formatPrice(deal.originalPrice)}</span>
                        <span className="block text-[15px] font-black text-dossa-red sm:text-lg">{formatPrice(deal.salePrice)}</span>
                      </span>
                    </Link>
                    <div className="mt-auto grid grid-cols-2 gap-1 px-2 pb-2 sm:px-3 sm:pb-3">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(deal.id)}
                        className={`min-h-8 rounded-xl border text-[11px] font-black transition sm:min-h-10 sm:rounded-2xl sm:text-xs ${
                          favorites.includes(deal.id) ? "border-red-100 bg-red-50 text-dossa-red" : "border-slate-200 bg-white text-slate-600 hover:text-dossa-red"
                        }`}
                        aria-label={`${deal.title} ${favorites.includes(deal.id) ? "찜 해제" : "찜하기"}`}
                        aria-pressed={favorites.includes(deal.id)}
                      >
                        찜
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeal(deal)}
                        className="min-h-8 rounded-xl bg-slate-950 text-[11px] font-black text-white transition hover:bg-dossa-red sm:min-h-10 sm:rounded-2xl sm:text-xs"
                        aria-label={`${deal.title} 판매처 새 탭으로 확인`}
                      >
                        구매
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-1 right-0 top-2 w-10 rounded-r-2xl bg-gradient-to-l from-white via-white/90 to-transparent sm:top-3 sm:w-12"
              />
            </div>
          </section>
        ) : null}
        {activeView === "home" ? (
          <RealtimeNewsDealsSection
            deals={newsDeals}
            totalCount={newsTotalCount}
            recommendedQueries={newsRecommendedQueries}
            targetSections={newsTargetSections}
            intentGroups={newsIntentGroups}
            sourceTrustScores={newsSourceTrustScores}
            deadlineSummary={newsDeadlineSummary}
            updatedAt={newsUpdatedAt}
            activeQuery={query}
            freshnessStatus={newsFreshness.status}
            freshnessLabel={newsFreshness.label}
            freshnessAgeMinutes={newsFreshness.ageMinutes}
            nextRefreshAt={newsFreshness.nextRefreshAt}
            isRefreshing={isNewsRefreshing}
            refreshError={newsRefreshError}
            onRefresh={() => {
              void refreshNewsDeals({ notify: true });
            }}
            onOpenNewsDeal={rememberRecentNewsBenefit}
            onSelectQuery={(nextQuery) => {
              setQuery(nextQuery);
              setActiveView("home");
            }}
          />
        ) : null}
        {activeView === "home" ? <HomeOfficialBenefitAlertRail deals={newsDeals} onOpenNewsDeal={rememberRecentNewsBenefit} /> : null}
        {activeView === "home" ? (
          <section className="grid gap-2 sm:gap-4 lg:grid-cols-[1fr_0.9fr]" aria-label="홈 핵심 특가 요약">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[28px] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-dossa-red">인기 특가</p>
                  <h2 className="text-base font-black text-slate-950 sm:mt-1 sm:text-xl">지금 많이 확인하는 상품</h2>
                </div>
                <Link href="/popular" className="rounded-xl bg-slate-950 px-3 py-2 text-[11px] font-black text-white sm:rounded-2xl sm:text-xs">
                  전체 보기
                </Link>
              </div>
              <div className="mt-4 grid gap-2">
                {topDeals.slice(0, 6).map((deal, index) => (
                  <a
                    key={deal.id}
                    href={`/go/${deal.id}?source=home_popular`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2 transition hover:border-red-100 hover:bg-red-50 sm:gap-3 sm:rounded-2xl sm:p-3"
                    aria-label={`${deal.title} 판매처 새 탭으로 열기`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dossa-red text-xs font-black text-white sm:h-8 sm:w-8 sm:text-sm">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black text-slate-950 sm:text-sm">{deal.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-bold text-slate-500 sm:text-xs">{deal.mallName} · {deal.shipping}</span>
                    </span>
                    <span className="shrink-0 text-sm font-black text-dossa-red sm:text-base">{deal.discountRate}%</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white p-3 shadow-sm sm:rounded-[28px] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-amber-700">마감 임박</p>
                  <h2 className="text-base font-black text-slate-950 sm:mt-1 sm:text-xl">오늘 먼저 확인할 특가</h2>
                </div>
                <button type="button" onClick={() => openQuickDiscovery("endingSoon")} className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-800 sm:rounded-2xl sm:text-xs">
                  마감순
                </button>
              </div>
              <div className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
                {(endingSoonDeals.length ? endingSoonDeals : topDeals.slice(0, 4)).slice(0, 4).map((deal) => (
                  <a
                    key={deal.id}
                    href={`/go/${deal.id}?source=home_ending`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 p-2 transition hover:bg-amber-50 sm:gap-3 sm:rounded-2xl sm:p-3"
                    aria-label={`${deal.title} 판매처 새 탭으로 열기`}
                  >
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-red-50 sm:h-12 sm:w-12 sm:rounded-2xl">
                      {deal.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getDealImageSrc(deal.thumbnail)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black text-slate-950 sm:text-sm">{deal.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-bold text-slate-500 sm:text-xs">{deal.mallName} · {getTimeLeft(deal.expireAt)}</span>
                    </span>
                    <ExternalLink size={16} className="shrink-0 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {activeView === "home" && categoryHighlights.length ? (
          <section className="hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:block sm:p-5" aria-label="카테고리 바로가기">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-dossa-red">카테고리</p>
                <h2 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">원하는 분야만 빠르게 보기</h2>
              </div>
              <Link href="/categories" className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                전체 카테고리
              </Link>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {categoryHighlights.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openCategory(item.id)}
                  className="min-h-[116px] rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-red-100 hover:bg-red-50"
                >
                  <span className="text-xs font-black text-dossa-red">{item.label}</span>
                  <span className="mt-2 block line-clamp-2 text-sm font-black leading-5 text-slate-950">{item.deal?.title}</span>
                  <span className="mt-2 block truncate text-xs font-bold text-slate-500">{item.deal?.mallName} · {item.deal?.discountRate}%</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {activeView === "home" ? (
          <>
            {!showDeepBenefitSections ? (
              <section className="rounded-[24px] border border-red-100 bg-white p-3 shadow-sm sm:p-4" aria-label="심화 혜택 탐색 열기">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-dossa-red">심화 혜택 탐색</p>
                    <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">상품 목록을 먼저 보고, 필요할 때 혜택 루틴을 펼치세요</h3>
                    <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">
                      무료혜택 큐, 오늘 브리핑, 개인화 추천, 쇼핑몰별 탐색은 첫 화면을 가볍게 유지하기 위해 필요할 때만 불러옵니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeepBenefitSections(true)}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-dossa-red"
                    aria-label="심화 혜택 루틴 더보기"
                  >
                    혜택 루틴 더보기
                  </button>
                </div>
              </section>
            ) : (
            <details open className="group overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-sm" aria-label="심화 혜택 탐색 접기">
              <summary className="flex cursor-pointer list-none flex-col gap-3 bg-gradient-to-r from-red-50 via-white to-orange-50 px-4 py-4 outline-none transition hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-100 sm:flex-row sm:items-center sm:justify-between sm:px-5 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-xs font-black text-dossa-red">심화 혜택 탐색</span>
                  <span className="mt-1 block text-lg font-black text-slate-950 sm:text-xl">상품 목록을 먼저 보고, 필요할 때 혜택 분석을 펼치세요</span>
                  <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">
                    무료혜택 큐, 오늘 브리핑, 개인화 추천, 쇼핑몰별 탐색을 접어 첫 화면을 더 짧게 유지합니다.
                  </span>
                </span>
                <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white transition group-open:bg-dossa-red">
                  <span className="group-open:hidden">펼쳐보기</span>
                  <span className="hidden group-open:inline">접기</span>
                </span>
              </summary>
              <div className="space-y-4 p-3 sm:p-4">
                <section className="overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-sm" aria-label="첫 화면 혜택 우선순위 큐">
              <div className="border-b border-red-100 bg-red-50 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-dossa-red">오늘 받을 혜택 큐</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">스크롤 전에 먼저 고를 5가지</h3>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                      무료, 쿠폰, 무배, 마감, 실제 구매처 이동을 한 화면에서 빠르게 좁힙니다.
                    </p>
                  </div>
                  <Link href="/free-benefits" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-dossa-red px-4 text-sm font-black text-white shadow-sm">
                    무료 혜택 전용 보기
                  </Link>
                </div>
              </div>
              <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-5">
                {todayBenefitQueue.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === "endingSoon") {
                        openQuickDiscovery("endingSoon");
                        return;
                      }
                      if (item.id === "verified") {
                        openQuickDiscovery("verified");
                        return;
                      }
                      openBenefitFilter(item.id as DealBenefitType);
                    }}
                    className="min-h-[142px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-white hover:shadow-sm"
                  >
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                      {item.label} {item.count}개
                    </span>
                    <span className="mt-3 block text-base font-black leading-5 text-slate-950">{item.title}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.copy}</span>
                    <span className="mt-3 block min-h-10 rounded-2xl bg-white px-3 py-2 text-xs font-black leading-5 text-slate-700">
                      {item.deal ? item.deal.title : "조건에 맞는 혜택을 준비 중입니다"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="첫 방문 혜택 판단 가이드">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black text-dossa-red">처음 왔다면 이 순서</p>
                  <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">오늘 먼저 챙길 혜택 판단표</h3>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                    무료로 받을 것, 결제 전 적용할 것, 오늘 끝날 것, 바로 이동할 상품만 먼저 압축했습니다.
                  </p>
                </div>
                <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-dossa-red">
                  비회원도 전체 열람 가능
                </p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {firstVisitDecisionGuide.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === "free") {
                        openBenefitFilter("freebie");
                        return;
                      }
                      if (item.id === "coupon") {
                        openBenefitFilter("coupon");
                        return;
                      }
                      if (item.id === "endingSoon") {
                        openQuickDiscovery("endingSoon");
                        return;
                      }
                      openQuickDiscovery("verified");
                    }}
                    className="group min-h-[156px] rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-white hover:shadow-sm"
                  >
                    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">
                      {item.value}
                    </span>
                    <span className="mt-3 block text-base font-black leading-5 text-slate-950">{item.title}</span>
                    <span className="mt-2 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                    <span className="mt-3 inline-flex min-h-9 items-center rounded-2xl bg-slate-950 px-3 text-xs font-black text-white transition group-hover:bg-dossa-red">
                      {item.action}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="오늘 혜택 브리핑">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black text-dossa-red">오늘 혜택 브리핑</p>
                  <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">{dailyBenefitBriefing.headline}</h3>
                  <p className="mt-1 max-w-2xl text-sm font-bold leading-6 text-slate-500">
                    이번 주 혜택 캘린더에서 오늘 먼저 챙길 루틴을 골랐습니다. 비회원도 전체 혜택을 볼 수 있고, 저장 기능만 선택 로그인으로 이어집니다.
                  </p>
                </div>
                <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Link href="/api/benefits/briefing?limit=3" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">
                    브리핑 API 보기
                  </Link>
                  <Link href="/api/benefits/routine?limit=2" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-red-50 px-4 text-sm font-black text-dossa-red">
                    루틴 API 보기
                  </Link>
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
                <div className="rounded-3xl bg-red-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{dailyBenefitBriefing.todayCalendar.title}</p>
                      <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">{dailyBenefitBriefing.todayCalendar.copy}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">
                      {dailyBenefitBriefing.todayLabel}요일
                    </span>
                  </div>
                  <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
                    {dailyBenefitBriefing.todayCalendar.operationNote}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {dailyBenefitBriefing.quickActions.map((action) => (
                      <Link key={action.label} href={action.href} className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-950 shadow-sm">
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-black text-dossa-red">오늘 대표 큐</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{dailyBenefitBriefing.primarySection.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{dailyBenefitBriefing.primarySection.description}</p>
                    <p className="mt-3 rounded-full bg-white px-3 py-1.5 text-center text-xs font-black text-dossa-red shadow-sm">
                      후보 {dailyBenefitBriefing.primarySection.items.length}개
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-black text-dossa-red">비회원 열람</p>
                    <p className="mt-1 text-sm font-black text-slate-950">가입 없이 전체 혜택 확인</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{dailyBenefitBriefing.notice}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-3xl border border-red-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-dossa-red">{dailyRoutinePlan.title}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{dailyRoutinePlan.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">
                    실행 {dailyRoutinePlan.summary.actionableSteps}단계
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {dailyRoutinePlan.steps.map((step, index) => (
                    <Link key={step.id} href={step.href} className="rounded-2xl bg-slate-50 px-3 py-2 transition hover:bg-red-50">
                      <span className="block text-[11px] font-black text-dossa-red">
                        {index + 1}단계 · {step.primaryAction}
                      </span>
                      <span className="mt-1 block line-clamp-1 text-xs font-black text-slate-950">{step.title}</span>
                      <span className="mt-1 block text-[11px] font-bold text-slate-500">{step.count}개 · {step.doneSignal}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <BenefitDiscoverySections
              deals={catalog.length ? catalog : deals}
              recentDeals={recentDeals}
              favoriteCount={favorites.length}
              onSelectBenefit={openBenefitFilter}
              onSelectCategory={openCategory}
              onOpenDeal={openDeal}
            />

            <DailyBenefitChecklist
              deals={catalog.length ? catalog : deals}
              onApplyPreset={openBenefitPreset}
              onShowEndingSoon={() => openQuickDiscovery("endingSoon")}
              onShowVerified={() => openQuickDiscovery("verified")}
            />

            <BenefitCheckInCard
              deals={catalog.length ? catalog : deals}
              favoriteCount={favorites.length}
              recentCount={recentDeals.length}
              onApplyPreset={openBenefitPreset}
              onOpenAlerts={() => setActiveView("alerts")}
            />

            <ClaimedBenefitHomeSummary deals={catalog.length ? catalog : deals} favorites={favorites} />

            <BenefitPlaybook deals={catalog.length ? catalog : deals} onApplyPreset={openBenefitPreset} />

            <TrueDealSpotlight
              deals={catalog.length ? catalog : deals}
              favorites={favorites}
              onOpenDeal={openDeal}
              onToggleFavorite={toggleFavorite}
              onShareDeal={shareDeal}
              onShowVerified={() => openQuickDiscovery("verified")}
            />

            <PurchaseLinkOverview
              total={dataQuality.total}
              verifiedLinkCount={dataQuality.verifiedLinkCount}
              reviewLinkCount={dataQuality.reviewLinkCount}
              latestPriceCheckedAt={dataQuality.latestPriceCheckedAt}
              onShowVerified={() => openQuickDiscovery("verified")}
              onShowReview={openReviewNeededDeals}
            />

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="오늘 바로 볼 할인 지도">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-dossa-red">오늘 바로 볼 할인 지도</p>
                <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-2xl">좋은 특가만 빠르게 좁혀보기</h3>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <p className="text-xs font-bold leading-5 text-slate-500">
                  판매처 이동 확인 특가 {dataQuality.verifiedLinkCount}개 · 구매 전 최종 가격 확인 권장
                </p>
                <Link href="/free-benefits" className="rounded-2xl bg-dossa-red px-4 py-2 text-center text-xs font-black text-white">
                  무료 혜택 전용 탭
                </Link>
              </div>
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
              <section className="overflow-hidden rounded-[30px] bg-dossa-red text-white shadow-brand">
                <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="p-5 sm:p-7">
                    <p className="text-sm font-black text-red-50">오늘의 특가 배너</p>
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
                  <div className="min-h-64 bg-white/10">
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
                  <p className="text-xs font-black text-dossa-red">관심 카테고리 추천</p>
                  <h3 className="text-xl font-black text-slate-950">
                    {user ? `${nickname || "회원"}님이 저장한 관심 기준` : "비회원도 모두 보고, 로그인하면 관심 기준을 저장해요"}
                  </h3>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                    관심 카테고리, 찜 반응, 최근 본 흐름을 함께 반영해 오늘 볼 혜택을 먼저 보여드립니다.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {interestLabels.slice(0, 6).map((label) => (
                      <span key={label} className="rounded-full bg-white px-3 py-1 text-xs font-black text-dossa-red shadow-sm">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 rounded-3xl border border-red-100 bg-white/80 p-3 shadow-sm" aria-label="홈 빠른 관심 설정">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black text-slate-700">홈 빠른 관심 설정</p>
                      <p className="text-[11px] font-black text-slate-400">비회원 기기 저장</p>
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                      {quickInterestOptions.map((interest) => {
                        const active = favoriteCategories.includes(interest);

                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => toggleQuickInterest(interest)}
                            aria-pressed={active}
                            className={`inline-flex min-h-10 shrink-0 items-center rounded-2xl px-3 text-xs font-black transition ${
                              active ? "bg-dossa-red text-white" : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-dossa-red"
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
                      선택한 관심사는 홈 추천과 알림 후보에 바로 반영됩니다. 로그인하면 계정으로 이어볼 수 있습니다.
                    </p>
                  </div>
                </div>
                {user ? (
                  <Link href="/mypage" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">마이페이지</Link>
                ) : (
                  <Link href="/onboarding" className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-sm font-black text-white">관심 설정하기</Link>
                )}
              </div>
              <div className="mt-4 rounded-3xl border border-red-100 bg-white/85 p-3 shadow-sm" aria-label="개인화 혜택 추천 API">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-dossa-red">개인화 혜택 추천 API</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                      관심사 {personalizedBenefitQueue.summary.interestMatchedDeals}개 후보와 최근/찜 흐름 {personalizedBenefitQueue.summary.continuityDeals}개를 합쳐 추천합니다.
                    </p>
                  </div>
                  <Link href={personalizedApiHref} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-center text-xs font-black text-white">
                    추천 API 보기
                  </Link>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {personalizedBenefitQueue.items.slice(0, 2).map((item) => (
                    <Link key={item.id} href={item.detailUrl} className="rounded-2xl bg-red-50 px-3 py-2 transition hover:bg-red-100">
                      <span className="block line-clamp-1 text-xs font-black text-slate-950">{item.title}</span>
                      <span className="mt-1 block text-[11px] font-bold leading-5 text-red-900/70">{item.reason}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {personalizedDeals.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => openDeal(deal)}
                    className="flex min-w-0 items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:bg-red-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xs font-black text-dossa-red">
                      {deal.discountRate ? `${deal.discountRate}%` : "혜택"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                      <span className="block truncate text-xs font-bold text-slate-500">{deal.mallName} · {deal.category} · 찜 {deal.likeCount}</span>
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
              deals={deals.slice(0, INITIAL_HOME_DEAL_LIMIT)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpenDeal={openDeal}
              onShareDeal={shareDeal}
            />

            <FeaturedDealSections
              deals={(catalog.length ? catalog : deals).slice(0, INITIAL_HOME_DEAL_LIMIT)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onOpenDeal={openDeal}
              onShareDeal={shareDeal}
            />
              </div>
            </details>
            )}

            {!showAdvancedFilterPanel ? (
              <section className="hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:block" aria-label="상세 필터와 결과 분석 열기">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-dossa-red">상세 필터와 결과 분석</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">상품 목록을 먼저 보고, 더 좁힐 때 펼치세요</h3>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                      쇼핑몰·가격대·혜택 목적·결과 해석 카드는 필요할 때만 렌더링해 모바일 앱 반응성을 유지합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilterPanel(true)}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-dossa-red"
                    aria-label="상세 필터와 결과 분석 펼치기"
                  >
                    필터 더보기
                  </button>
                </div>
              </section>
            ) : (
            <details open className="group hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm sm:block" aria-label="상세 필터와 결과 분석 접기">
              <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-4 outline-none transition hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-red-100 sm:flex-row sm:items-center sm:justify-between sm:px-5 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-xs font-black text-dossa-red">상세 필터와 결과 분석</span>
                  <span className="mt-1 block text-lg font-black text-slate-950">상품 목록을 먼저 보고, 더 좁힐 때 펼치세요</span>
                  <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">
                    쇼핑몰·가격대·혜택 목적·결과 해석 카드는 접어서 보관하고, 상품 목록 앞 빠른 좁히기는 계속 노출합니다.
                  </span>
                </span>
                <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-4 text-xs font-black text-white transition group-open:bg-dossa-red">
                  <span className="group-open:hidden">필터 더보기</span>
                  <span className="hidden group-open:inline">접기</span>
                </span>
              </summary>
              <div className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
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
                <label className="min-w-[170px] flex-1">
                  <span className="sr-only">혜택 유형 필터</span>
                  <select
                    value={benefitFilter}
                    onChange={(event) => setBenefitFilter(event.target.value as "all" | DealBenefitType)}
                    aria-label="혜택 유형 필터"
                    className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none transition hover:border-red-200 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                  >
                    {benefitFilters.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
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
              <div className="mt-4 rounded-[24px] border border-red-100 bg-white p-4 shadow-sm" aria-label="검색 결과 빠른 분류">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-dossa-red">검색 결과 빠른 분류</p>
                    <h3 className="mt-1 text-base font-black text-slate-950">
                      {query.trim()
                        ? `"${query.trim()}" 관련 상품 ${searchResultGroups.queryMatchedCount}개를 더 빠르게 좁힙니다`
                        : `전체 상품 ${searchResultGroups.queryMatchedCount}개를 쇼핑몰과 혜택별로 빠르게 봅니다`}
                    </h3>
                  </div>
                  <p className="text-xs font-bold leading-5 text-slate-500">쇼핑몰, 카테고리, 혜택 유형을 바로 눌러 결과를 줄일 수 있습니다.</p>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-black text-slate-700">많이 나온 쇼핑몰</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {searchResultGroups.malls.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMallFilter(item.id)}
                          className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-xs font-black transition ${
                            mallFilter === item.id
                              ? "border-transparent bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-dossa-red"
                          }`}
                          aria-pressed={mallFilter === item.id}
                        >
                          {item.label}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${mallFilter === item.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {item.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-black text-slate-700">가까운 카테고리</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {searchResultGroups.categories.map((item) => (
                        <button
                          key={`${item.id}-${item.label}`}
                          type="button"
                          onClick={() => setCategory(item.id)}
                          className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-xs font-black transition ${
                            category === item.id
                              ? "border-transparent bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-dossa-red"
                          }`}
                          aria-pressed={category === item.id}
                        >
                          {item.label}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${category === item.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {item.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-black text-slate-700">혜택 유형</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {searchResultGroups.benefits.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBenefitFilter((current) => (current === item.id ? "all" : item.id))}
                          className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-xs font-black transition ${
                            benefitFilter === item.id
                              ? "border-transparent bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-dossa-red"
                          }`}
                          aria-pressed={benefitFilter === item.id}
                        >
                          {item.label}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${benefitFilter === item.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {item.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="결과 바로 판단 카드">
                  {resultInsightCards.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      disabled={item.disabled}
                      aria-pressed={item.active}
                      aria-label={`${item.title} ${item.actionLabel}`}
                      className={`min-h-[128px] rounded-3xl border p-3 text-left transition ${
                        item.active
                          ? "border-dossa-red bg-red-50 text-dossa-red"
                          : "border-slate-100 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-red-100 hover:bg-white hover:shadow-sm"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black shadow-sm">{item.label}</span>
                      <span className="mt-3 block text-sm font-black leading-5 text-slate-950">{item.title}</span>
                      <span className="mt-1 block line-clamp-2 text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                      <span className={`mt-3 inline-flex rounded-2xl px-3 py-2 text-[11px] font-black ${item.active ? "bg-dossa-red text-white" : "bg-slate-950 text-white"}`}>
                        {item.actionLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3" aria-label="혜택 목적 빠른 필터">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-dossa-red">혜택 목적 빠른 필터</p>
                    <p className="mt-1 text-sm font-black text-slate-950">무료, 쿠폰, 앱테크, 문화 초대권을 한 번에 좁힙니다</p>
                  </div>
                  <p className="text-xs font-bold leading-5 text-dossa-deep">비회원도 모든 결과를 보고, 저장만 로그인으로 이어집니다.</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {searchPurposeCards.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => openBenefitPreset(item.preset)}
                      className="min-h-[112px] rounded-3xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      aria-label={`${item.title} 빠른 필터 ${item.count}개 적용`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">{item.label}</span>
                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">{item.count}개</span>
                      </span>
                      <span className="mt-3 block text-sm font-black text-slate-950">{item.title}</span>
                      <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-400">적용된 조건</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">조건 칩을 누르면 조건 개별 해제</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeFilterLabels.length ? (
                      activeFilterChips.map((chip) => (
                        <button
                          key={`${chip.id}-${chip.label}`}
                          type="button"
                          onClick={() => removeActiveFilter(chip.id)}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-dossa-red"
                          aria-label={`${chip.label} 조건 개별 해제`}
                        >
                          {chip.label}
                          <span className="text-[11px] text-slate-400" aria-hidden="true">x</span>
                        </button>
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
              <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]" aria-label="조건별 결과 요약">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-dossa-red">조건별 결과 요약</p>
                    <p className="mt-1 text-sm font-black text-slate-950">현재 필터가 보여주는 혜택을 먼저 해석합니다</p>
                  </div>
                  <p className="text-xs font-bold leading-5 text-slate-500">
                    조건을 좁힐수록 실제 구매 링크, 마감, 배송비 상태를 함께 확인하세요.
                  </p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {filterOutcomeCards.map((item) => (
                    <div key={item.title} className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-black text-slate-500">{item.title}</p>
                      <p className="mt-1 text-xl font-black text-slate-950">{item.value}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-slate-500">{item.copy}</p>
                    </div>
                  ))}
                </div>
                {quickResultPicks.length ? (
                  <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3" aria-label="현재 조건 빠른 추천">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-black text-dossa-red">현재 조건 빠른 추천</p>
                        <p className="mt-1 text-sm font-black text-slate-950">목록을 길게 보기 전 먼저 확인할 3개</p>
                      </div>
                      <p className="text-xs font-bold leading-5 text-dossa-deep">구매처 확인, 반응, 배송, 마감 기준을 함께 반영했습니다.</p>
                    </div>
                    <div className="mt-3 grid gap-2 lg:grid-cols-3">
                      {quickResultPicks.map((deal, index) => (
                        <article key={deal.id} className="rounded-3xl bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-dossa-red">추천 {index + 1}</p>
                              <h4 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-950">{deal.title}</h4>
                            </div>
                            <span className="shrink-0 rounded-2xl bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">
                              {deal.discountRate}%
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">{deal.mallName}</span>
                            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">{deal.shipping}</span>
                            {isVerifiedPurchaseLink(deal) ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">구매처 확인</span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex items-end justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</p>
                              <p className="truncate text-lg font-black text-slate-950">{formatPrice(deal.salePrice)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openDeal(deal)}
                              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl bg-dossa-red px-3 text-xs font-black text-white shadow-sm transition hover:bg-slate-950"
                              aria-label={`${deal.title} 현재 조건 추천 판매처 확인`}
                            >
                              바로 확인
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 rounded-2xl bg-slate-50 p-3" aria-label="현재 결과 바로 실행 큐">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-black text-dossa-red">현재 결과 바로 실행 큐</p>
                      <p className="mt-1 text-sm font-black text-slate-950">지금 조건에서 먼저 눌러볼 혜택을 골랐습니다</p>
                    </div>
                    <p className="text-xs font-bold leading-5 text-slate-500">비회원도 열람 가능 · 저장과 알림만 선택 로그인</p>
                  </div>
                  <div className="mt-3 grid gap-2 lg:grid-cols-3">
                    {filterActionQueue.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => (item.deal ? openDeal(item.deal) : resetFilters())}
                        className="min-h-[128px] rounded-3xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        aria-label={item.deal ? `${item.deal.title} 먼저 보기` : `${item.title} 조건 초기화`}
                      >
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">
                          {item.label}
                        </span>
                        <span className="mt-3 block text-sm font-black leading-5 text-slate-950">
                          {item.deal ? item.deal.title : item.title}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-xs font-bold leading-5 text-slate-500">
                          {item.deal ? `${item.deal.mallName} · ${item.deal.benefitSummary}` : item.helper}
                        </span>
                        <span className="mt-3 inline-flex rounded-2xl bg-slate-950 px-3 py-2 text-[11px] font-black text-white">
                          {item.deal ? `${formatPrice(item.deal.salePrice)} 확인` : "전체 조건으로 다시 보기"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
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
                구매링크 확인 필터를 켜면 링크 확인이 필요한 특가는 제외됩니다.
              </p>
              {loadError ? (
                <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-700">{loadError}</p>
              ) : null}
              </div>
            </details>
            )}

            <section className="rounded-[24px] border border-red-100 bg-white p-3 shadow-sm" aria-label="상품 목록 적용 조건 빠른 해제">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black text-dossa-red">상품 목록 적용 조건</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {activeFilterLabels.length ? "조건을 눌러 바로 해제하고 같은 목록에서 다시 비교합니다." : "전체 특가를 보고 있습니다. 필요하면 아래 빠른 좁히기로 바로 필터링하세요."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!activeFilterLabels.length}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-red-100 hover:bg-red-50 hover:text-dossa-red disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="상품 목록 적용 조건 전체 초기화"
                >
                  전체 초기화
                </button>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeFilterChips.length ? (
                  activeFilterChips.map((chip) => (
                    <button
                      key={`list-${chip.id}-${chip.label}`}
                      type="button"
                      onClick={() => removeActiveFilter(chip.id)}
                      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-dossa-red transition hover:bg-dossa-red hover:text-white"
                      aria-label={`${chip.label} 조건 상품 목록에서 해제`}
                    >
                      {chip.label}
                      <span aria-hidden="true">x</span>
                    </button>
                  ))
                ) : (
                  <span className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">전체 특가</span>
                )}
              </div>
            </section>

            {deals.length ? (
              <section className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm" aria-label="현재 결과 빠른 좁히기">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-dossa-red">현재 결과 빠른 좁히기</p>
                    <h3 className="mt-1 text-base font-black text-slate-950">목록 안에서 많이 나온 기준만 바로 선택</h3>
                  </div>
                  <p className="text-xs font-bold leading-5 text-slate-500">쇼핑몰, 카테고리, 혜택 조건을 상품 목록 앞에서 다시 좁힙니다.</p>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {listRefinementChips.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      aria-pressed={item.active}
                      aria-label={`${item.label} ${item.helper} ${item.value}`}
                      className={`min-w-[132px] rounded-2xl border px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                        item.active
                          ? "border-dossa-red bg-red-50 text-dossa-red"
                          : "border-slate-200 bg-white text-slate-700 hover:border-red-100"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-black">{item.label}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${item.active ? "bg-white text-dossa-red" : "bg-slate-100 text-slate-500"}`}>
                          {item.value}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-[11px] font-bold text-slate-500">{item.helper}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {deals.length ? (
              <section id="deal-list" className="scroll-mt-24 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm" aria-label="상품 목록 빠른 스캔">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-dossa-red">상품 목록 빠른 스캔</p>
                    <h3 className="mt-1 text-base font-black text-slate-950">지금 목록에서 먼저 비교할 기준</h3>
                  </div>
                  <p className="text-xs font-bold leading-5 text-slate-500">누르면 같은 목록에서 조건이나 정렬이 바로 바뀝니다.</p>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {dealScanBarItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      aria-pressed={item.active}
                      aria-label={`${item.label} 빠른 스캔 적용`}
                      className={`min-w-[148px] rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                        item.active
                          ? "border-dossa-red bg-red-50 text-dossa-red"
                          : "border-slate-200 bg-white text-slate-700 hover:border-red-100"
                      }`}
                    >
                      <span className="block text-[11px] font-black">{item.label}</span>
                      <strong className="mt-1 block text-lg font-black text-slate-950">{item.value}</strong>
                      <small className="mt-1 block text-[11px] font-bold leading-4 text-slate-500">{item.helper}</small>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {deals.length ? (
              <section className="rounded-[24px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-white p-3 shadow-sm" aria-label="현재 목록 가격 비교">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black text-dossa-red">현재 목록 가격 비교</p>
                    <h3 className="mt-1 text-base font-black text-slate-950">가격으로 먼저 고를 4가지 후보</h3>
                  </div>
                  <p className="text-xs font-bold leading-5 text-slate-500">가격은 판매처에서 변동될 수 있어 구매 전 최종 조건을 다시 확인하세요.</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {listComparisonCards.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => item.deal && openDeal(item.deal)}
                      disabled={!item.deal}
                      className="min-h-[132px] rounded-3xl border border-white bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={item.deal ? `${item.label} ${item.deal.title} 판매처 확인` : `${item.label} 후보 없음`}
                    >
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">{item.label}</span>
                      <strong className="mt-3 block truncate text-lg font-black text-slate-950">{item.value}</strong>
                      <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.helper}</span>
                      {item.deal ? (
                        <span className="mt-3 flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-[11px] font-black text-slate-600">{item.deal.title}</span>
                          <span className="shrink-0 rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">보기</span>
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

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
          ? (
            <HomeDealGrid
              items={favoriteDeals}
              visibleCount={visibleDealCount}
              loadStep={HOME_DEAL_LOAD_STEP}
              favoriteIds={favorites}
              emptyTitle="아직 찜한 특가가 없습니다."
              emptyDescription="마음에 드는 특가의 하트 버튼을 눌러 저장해보세요."
              emptyAction={
                <button
                type="button"
                onClick={() => setActiveView("home")}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-dossa-red"
              >
                홈에서 특가 둘러보기
              </button>
              }
              onLoadMore={setVisibleDealCount}
              onToggleFavorite={toggleFavorite}
              onOpenDeal={openDeal}
              onShareDeal={shareDeal}
            />
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

"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, Flame, Share2, ShieldCheck, ShoppingBag, SlidersHorizontal, Store, Timer, Truck, UserRound } from "lucide-react";
import { BenefitCheckInCard } from "@/components/BenefitCheckInCard";
import { BenefitDiscoverySections } from "@/components/BenefitDiscoverySections";
import { BenefitPlaybook, BenefitPreset } from "@/components/BenefitPlaybook";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CommercialFooter } from "@/components/CommercialFooter";
import { ConsentSettings } from "@/components/ConsentSettings";
import { DailyBenefitChecklist } from "@/components/DailyBenefitChecklist";
import { FeaturedDealSections } from "@/components/FeaturedDealSections";
import { HotSignalSection } from "@/components/HotSignalSection";
import { LoginPromptSheet } from "@/components/LoginPromptSheet";
import { LiveDealFeed } from "@/components/LiveDealFeed";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { PriceAlertList } from "@/components/PriceAlertList";
import { PurchaseConfirmSheet } from "@/components/PurchaseConfirmSheet";
import { PurchaseLinkOverview } from "@/components/PurchaseLinkOverview";
import { QuickDealCard } from "@/components/QuickDealCard";
import { SearchBar } from "@/components/SearchBar";
import { SearchDiscoveryPanel } from "@/components/SearchDiscoveryPanel";
import { SortSelect } from "@/components/SortSelect";
import { Toast } from "@/components/Toast";
import { TrueDealSpotlight } from "@/components/TrueDealSpotlight";
import { useAuth } from "@/components/AuthProvider";
import { dealChannels, dealMatchesChannel, getDealChannel, getProviderCategory } from "@/data/dealChannels";
import { mockHotSignals } from "@/data/mockHotSignals";
import { mockDeals } from "@/data/mockDeals";
import { ConsentState, hasAffiliateConsent, hasAnalyticsConsent, readStoredConsent } from "@/lib/consent";
import { canOpenDealLink } from "@/lib/affiliate";
import { benefitReturnReservationUpdatedEvent, readBenefitReturnReservations } from "@/lib/benefitReturnReservations";
import { readBenefitVisitStreak } from "@/lib/benefitVisitStreak";
import { claimedBenefitUpdatedEvent, readClaimedBenefits } from "@/lib/claimedBenefits";
import { buildBenefitDecisionGuide } from "@/lib/deals/benefitDecisionGuide";
import { buildDailyBenefitBriefing } from "@/lib/deals/dailyBenefitBriefing";
import { buildDailyRoutinePlan } from "@/lib/deals/dailyRoutinePlan";
import { buildPersonalizedBenefitQueue } from "@/lib/deals/personalizedBenefitQueue";
import { getLinkQualityScore, isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { dealMatchesSearch } from "@/lib/deals/search";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import { getDealImageSrc } from "@/lib/imageSrc";
import { buildDealRedirectUrl, buildNativeSafeDealUrl } from "@/lib/redirectUrl";
import { buildPublicAppShareUrl, buildPublicDealShareUrl } from "@/lib/shareUrl";
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
const benefitFilters: Array<{ id: "all" | DealBenefitType; label: string }> = [
  { id: "all", label: "전체 혜택" },
  { id: "freebie", label: "무료혜택" },
  { id: "coupon", label: "쿠폰/이벤트" },
  { id: "freeShipping", label: "무료배송" },
  { id: "experience", label: "체험/샘플" },
  { id: "point", label: "포인트" },
  { id: "convenienceStore", label: "편의점" },
  { id: "mart", label: "마트" },
  { id: "foodDelivery", label: "배달/외식" },
  { id: "discount", label: "오늘특가" }
];
const searchPurposePresets: Array<{
  title: string;
  label: string;
  copy: string;
  preset: BenefitPreset;
  match: (deal: Deal) => boolean;
}> = [
  {
    title: "무료·0원 먼저",
    label: "무료",
    copy: "샘플, 체험단, 초대권처럼 비용 부담 낮은 혜택",
    preset: { dealType: "freebie", query: "무료", sort: "hot" },
    match: (deal) => ["freebie", "experience"].includes(deal.dealType) || deal.salePrice <= 1000 || /무료|0원|샘플|체험|초대권/.test(`${deal.title} ${deal.tags.join(" ")}`)
  },
  {
    title: "쿠폰 조건 확인",
    label: "쿠폰",
    copy: "첫 구매, 카드, 브랜드, 배달 쿠폰을 결제 전 확인",
    preset: { dealType: "coupon", query: "쿠폰", sort: "hot" },
    match: (deal) => ["coupon", "foodDelivery"].includes(deal.dealType) || /쿠폰|카드|첫 구매|배달|외식/.test(`${deal.title} ${deal.tags.join(" ")}`)
  },
  {
    title: "앱테크 적립",
    label: "적립",
    copy: "출석체크, 페이, 멤버십 포인트 루틴",
    preset: { dealType: "point", query: "포인트", sort: "latest" },
    match: (deal) => deal.dealType === "point" || /출석|포인트|적립|페이|멤버십|리워드/.test(`${deal.title} ${deal.tags.join(" ")}`)
  },
  {
    title: "문화 초대권",
    label: "문화",
    copy: "영화 시사회, 전시, 공연, 티켓 혜택",
    preset: { dealType: "experience", query: "초대권", sort: "endingSoon" },
    match: (deal) => /영화|시사회|전시|공연|초대권|티켓/.test(`${deal.title} ${deal.tags.join(" ")} ${deal.benefitSummary}`)
  },
  {
    title: "검증 링크만",
    label: "신뢰",
    copy: "검색/메인이 아닌 실제 상세 이동 우선",
    preset: { verifiedOnly: true, sort: "hot" },
    match: (deal) => isVerifiedPurchaseLink(deal)
  }
];
const toastMessages = [
  "🔥 새로운 역대급 특가가 등록되었습니다!",
  "⚡ 마감임박 상품이 빠르게 소진되고 있어요.",
  "🎯 관심 카테고리에 할인율 높은 상품이 올라왔어요!",
  "💳 카드할인 적용 가능한 핫딜을 찾았습니다.",
  "🛒 오늘만 진행되는 쿠폰 특가를 확인해보세요."
];
const recentSearchStorageKey = "halindosa:recent-search-keywords";
const highIntentSearchKeywords = [
  "생수",
  "물티슈",
  "계란",
  "우유",
  "닭가슴살",
  "마스크",
  "충전케이블",
  "멀티탭",
  "화장지",
  "청소포",
  "김자반",
  "김치",
  "키친타월",
  "참치",
  "가글",
  "로켓",
  "지마켓",
  "배달쿠폰",
  "커피쿠폰",
  "라면",
  "햇반",
  "세제",
  "기저귀",
  "선크림",
  "유산균",
  "치킨쿠폰",
  "무료커피",
  "영화무료",
  "패션",
  "우산"
];

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

const fallbackInterestCategories = ["무료/체험", "쿠폰/이벤트", "생활용품"];
const quickInterestOptions = ["무료/체험", "쿠폰/이벤트", "식품", "생활용품", "디지털", "육아", "뷰티", "여행"];

function dealMatchesInterestCategory(deal: Deal, interest: string) {
  const searchable = [
    deal.title,
    deal.description,
    deal.mallName,
    deal.category,
    deal.subCategory ?? "",
    deal.dealType,
    deal.benefitSummary ?? "",
    deal.shipping,
    ...deal.tags
  ].join(" ");

  if (interest === "디지털") return /디지털|전자기기|가전|노트북|TV|스마트|충전|이어폰/.test(searchable);
  if (interest === "패션") return /패션|의류|잡화|신발|무신사|가방|스니커즈/.test(searchable);
  if (interest === "여행") return /여행|티켓|항공|숙박|호텔|공연|전시|영화/.test(searchable);
  if (interest === "무료/체험") return ["freebie", "experience", "coupon", "point"].includes(deal.dealType) || /무료|체험|샘플|쿠폰|포인트|0원/.test(searchable);

  return searchable.includes(interest);
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

function getCategoryFilterId(categoryName: string) {
  if (categoryName === "식품") return "food";
  if (categoryName === "생활용품") return "living";
  if (categoryName === "전자기기" || categoryName === "가전") return "digital";
  if (categoryName === "의류" || categoryName === "뷰티") return "fashion";
  if (categoryName === "육아") return "baby";
  if (categoryName === "여행/티켓") return "travel";
  if (categoryName === "편의점/마트") return "mart";
  if (categoryName === "쿠폰/이벤트") return "coupon";
  return "etc";
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
  priceBand: PriceBand = "all",
  benefitFilter: "all" | DealBenefitType = "all"
) {
  let filtered = items;

  if (category && category !== "전체" && category !== "all") {
    filtered = filtered.filter((deal) => dealMatchesChannel(deal, category));
  }

  if (query.trim()) {
    filtered = filtered.filter((deal) => dealMatchesSearch(deal, query));
  }

  if (mallFilter !== "all") {
    filtered = filtered.filter((deal) => dealMatchesMallFilter(deal, mallFilter));
  }

  if (priceBand !== "all") {
    filtered = filtered.filter((deal) => dealMatchesPriceBand(deal, priceBand));
  }

  if (benefitFilter !== "all") {
    filtered = filtered.filter((deal) => deal.dealType === benefitFilter);
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

function ClaimedBenefitHomeSummary({ deals, favorites }: { deals: Deal[]; favorites: string[] }) {
  const [claimedBenefits, setClaimedBenefits] = useState<ReturnType<typeof readClaimedBenefits>>([]);
  const [returnReservations, setReturnReservations] = useState<ReturnType<typeof readBenefitReturnReservations>>([]);
  const [visitStreak, setVisitStreak] = useState<ReturnType<typeof readBenefitVisitStreak>>({ currentStreak: 0, totalVisits: 0, lastVisitedDate: "", visitedDates: [] });
  const claimedIds = useMemo(() => new Set(claimedBenefits.map((record) => record.dealId)), [claimedBenefits]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const claimedToday = claimedBenefits.filter((record) => record.claimedAt.slice(0, 10) === todayKey);
  const savingsCandidate = claimedBenefits.reduce((total, record) => total + Math.max(0, record.savingsAmount), 0);
  const savedBenefitCount = useMemo(() => deals.filter((deal) => favorites.includes(deal.id)).length, [deals, favorites]);
  const missionSteps = useMemo(
    () => [
      {
        title: "무료 혜택 1개 챙기기",
        status: claimedToday.length > 0 ? "완료" : "시작",
        done: claimedToday.length > 0,
        href: "/free-benefits?mission=free"
      },
      {
        title: "쿠폰 1개 저장하기",
        status: savedBenefitCount > 0 ? "저장됨" : "저장 전",
        done: savedBenefitCount > 0,
        href: "/free-benefits?mission=coupon"
      },
      {
        title: "내일 볼 루틴 예약",
        status: returnReservations.length > 0 ? "예약됨" : "예약 전",
        done: returnReservations.length > 0,
        href: "/free-benefits?mission=return"
      }
    ],
    [claimedToday.length, returnReservations.length, savedBenefitCount]
  );
  const nextBenefits = useMemo(
    () =>
      deals
        .filter((deal) => !claimedIds.has(deal.id))
        .filter((deal) => !deal.isExpired && !deal.isSoldOut)
        .filter((deal) => ["freebie", "coupon", "freeShipping", "experience", "event", "point", "foodDelivery"].includes(deal.dealType))
        .sort((a, b) => Number(b.isHot) - Number(a.isHot) || b.reliabilityScore - a.reliabilityScore || b.savingsAmount - a.savingsAmount)
        .slice(0, 3),
    [claimedIds, deals]
  );

  useEffect(() => {
    const refresh = () => {
      setClaimedBenefits(readClaimedBenefits());
      setReturnReservations(readBenefitReturnReservations());
      setVisitStreak(readBenefitVisitStreak());
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(claimedBenefitUpdatedEvent, refresh);
    window.addEventListener(benefitReturnReservationUpdatedEvent, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(claimedBenefitUpdatedEvent, refresh);
      window.removeEventListener(benefitReturnReservationUpdatedEvent, refresh);
    };
  }, []);

  return (
    <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="홈 챙긴 혜택 요약">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex-1 rounded-3xl bg-red-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-dossa-red">오늘 챙긴 혜택 요약</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">앱을 열 때마다 놓친 혜택을 줄여보세요</h3>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                무료 혜택 탭에서 누른 챙김 기록을 비회원 기기 저장으로 이어 보여드립니다.
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
              <CheckCircle2 size={22} />
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white p-3">
              <p className="text-[11px] font-black text-slate-400">오늘 챙김</p>
              <p className="mt-1 text-lg font-black text-slate-950">{claimedToday.length}개</p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-[11px] font-black text-slate-400">누적 혜택</p>
              <p className="mt-1 text-lg font-black text-slate-950">{claimedBenefits.length}개</p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-[11px] font-black text-slate-400">절약 후보</p>
              <p className="mt-1 text-lg font-black text-dossa-red">{formatPrice(savingsCandidate)}</p>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-red-100 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-dossa-red">홈 오늘 혜택 미션</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  무료 혜택 탭의 세 가지 미션을 홈에서 바로 이어봅니다.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">
                {missionSteps.filter((mission) => mission.done).length}/3
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {missionSteps.map((mission) => (
                <Link
                  key={mission.title}
                  href={mission.href}
                  className={`rounded-2xl px-3 py-2 transition hover:-translate-y-0.5 ${
                    mission.done ? "bg-slate-950 text-white" : "bg-red-50 text-dossa-red hover:bg-red-100"
                  }`}
                >
                  <span className="block text-[11px] font-black">{mission.status}</span>
                  <span className="mt-1 block line-clamp-1 text-xs font-black">{mission.title}</span>
                </Link>
              ))}
            </div>
          </div>
          {claimedBenefits.length ? (
            <div className="mt-3 space-y-2">
              {claimedBenefits.slice(0, 2).map((record) => (
                <div key={`${record.dealId}-${record.claimedAt}`} className="rounded-2xl bg-white px-3 py-2">
                  <p className="line-clamp-1 text-xs font-black text-slate-900">{record.title}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    {record.mallName} · {getRelativeTime(record.claimedAt)} 챙김
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl bg-white px-3 py-3 text-xs font-bold leading-5 text-slate-500">
              아직 챙긴 기록이 없습니다. 무료 혜택 전용 탭에서 받을 만한 혜택을 먼저 표시해두세요.
            </p>
          )}
          <div className="mt-3 rounded-2xl border border-red-100 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-dossa-red">홈 재방문 예약 요약</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  무료 혜택 탭에서 저장한 아침 무료 혜택, 저녁 쿠폰 점검, 마감 전 확인 루틴을 홈에서도 이어봅니다.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">
                {returnReservations.length}개
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(returnReservations.length ? returnReservations.slice(0, 2) : [
                { id: "free-morning", slot: "아침", title: "무료 혜택 먼저 확인" },
                { id: "coupon-evening", slot: "저녁", title: "쿠폰·포인트 다시 보기" }
              ]).map((item) => (
                <div key={item.id} className="rounded-2xl bg-red-50 px-3 py-2">
                  <p className="text-[11px] font-black text-dossa-red">{item.slot}</p>
                  <p className="mt-1 line-clamp-1 text-xs font-black text-slate-950">{item.title}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Link href="/free-benefits" className="rounded-2xl bg-dossa-red px-3 py-2 text-center text-xs font-black text-white">
                재방문 루틴 더 저장
              </Link>
              <Link href="/notifications" className="rounded-2xl bg-slate-950 px-3 py-2 text-center text-xs font-black text-white">
                알림에서 이어보기
              </Link>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-red-100 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-dossa-red">홈 무료 혜택 방문 요약</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  무료혜택 탭을 열어본 흐름을 홈에서도 이어봅니다. 비회원도 이 기기에만 기록됩니다.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">
                연속 {visitStreak.currentStreak}일
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-red-50 px-3 py-2">
                <p className="text-[11px] font-black text-dossa-red">누적 방문</p>
                <p className="mt-1 text-sm font-black text-slate-950">{visitStreak.totalVisits}회</p>
              </div>
              <Link href="/free-benefits" className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                무료 혜택 방문 루틴 계속하기
                <span className="mt-1 block text-[11px] text-slate-300">무료 1개 챙기고 쿠폰 점검</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-slate-500">아직 챙길 만한 무료 혜택</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">오늘 놓치기 쉬운 후보</h3>
            </div>
            <Link href="/free-benefits" className="rounded-2xl bg-dossa-red px-4 py-2 text-xs font-black text-white">
              무료 혜택 더 챙기기
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {(nextBenefits.length ? nextBenefits : deals.slice(0, 3)).map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
               target="_blank" rel="noopener noreferrer">
                <span className="min-w-0">
                  <span className="line-clamp-1 text-sm font-black text-slate-950">{deal.title}</span>
                  <span className="mt-1 block text-[11px] font-bold text-slate-500">{deal.benefitSummary || deal.mallName}</span>
                </span>
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">
                  {deal.salePrice <= 0 ? "0원" : formatPrice(deal.salePrice)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
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
  const [benefitFilter, setBenefitFilter] = useState<"all" | DealBenefitType>("all");
  const [updatedAt, setUpdatedAt] = useState("");
  const [providerSource, setProviderSource] = useState("mock");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [hotSignals, setHotSignals] = useState<HotSignal[]>(mockHotSignals);
  const [isSignalLoading, setIsSignalLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => readLocalFavoriteIds());
  const [recentDealIds, setRecentDealIds] = useState<string[]>([]);
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>(() => readLocalPreferences().favoriteCategories);
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
      const params = new URLSearchParams(window.location.search);
      const initialCategory = params.get("category");
      const initialMall = params.get("mall");
      const initialSort = params.get("sort") as DealSort | null;
      const initialQuery = params.get("q");
      const initialFreeShipping = params.get("freeShipping") ?? params.get("freeShippingOnly");
      const initialHotOnly = params.get("hotOnly");
      const initialEndingSoon = params.get("endingSoon") ?? params.get("endingSoonOnly");
      const initialVerifiedOnly = params.get("verified") ?? params.get("verifiedOnly");
      const initialPriceBand = params.get("priceBand") as PriceBand | null;
      const initialBenefitType = params.get("dealType") as DealBenefitType | null;

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

      if (initialVerifiedOnly === "true") {
        setVerifiedOnly(true);
        setActiveView("home");
      }

      if (initialPriceBand && priceBands.some((band) => band.id === initialPriceBand)) {
        setPriceBand(initialPriceBand);
        setActiveView("home");
      }

      if (initialBenefitType && benefitFilters.some((filter) => filter.id === initialBenefitType)) {
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
      const params = new URLSearchParams();

      if (category !== "all") params.set("category", category);
      if (query.trim()) params.set("q", query.trim());
      if (sort !== "latest") params.set("sort", sort);
      if (freeShippingOnly) params.set("freeShippingOnly", "true");
      if (hotOnly) params.set("hotOnly", "true");
      if (endingSoonOnly) params.set("endingSoonOnly", "true");
      if (verifiedOnly) params.set("verifiedOnly", "true");
      if (mallFilter !== "all") params.set("mall", mallFilter);
      if (priceBand !== "all") params.set("priceBand", priceBand);
      if (benefitFilter !== "all") params.set("dealType", benefitFilter);

      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
        window.history.replaceState(null, "", nextUrl);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [benefitFilter, category, endingSoonOnly, freeShippingOnly, hasAppliedInitialParams, hotOnly, mallFilter, priceBand, query, sort, verifiedOnly]);

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
          const localDeals = filterLocalDeals(mockDeals, category, query, sort, freeShippingOnly, hotOnly, endingSoonOnly, verifiedOnly, mallFilter, priceBand, benefitFilter);
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
          priceBand,
          dealType: benefitFilter
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
            .filter((deal) => benefitFilter === "all" || deal.dealType === benefitFilter)
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
        setDeals(filterLocalDeals(mockDeals, category, query, sort, freeShippingOnly, hotOnly, endingSoonOnly, verifiedOnly, mallFilter, priceBand, benefitFilter));
        setCatalog(mockDeals);
        setProviderSource("mock fallback");
        setUpdatedAt(new Date().toISOString());
        showToast("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    },
    [benefitFilter, category, endingSoonOnly, freeShippingOnly, hotOnly, isOffline, mallFilter, priceBand, query, showToast, sort, verifiedOnly]
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

  const instantDealRail = useMemo(() => {
    const source = deals.length ? deals : catalog;
    const railScore = (deal: Deal) =>
      Number(deal.isHot) * 70 + deal.discountRate + deal.likeCount * 0.08 + deal.clickCount * 0.03;

    return [...source]
      .filter((deal) => isVerifiedPurchaseLink(deal) && !deal.isExpired && !deal.isSoldOut)
      .sort((a, b) => railScore(b) - railScore(a))
      .slice(0, 8);
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

  const personalizedDeals = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    const interests = favoriteCategories.length ? favoriteCategories : fallbackInterestCategories;
    const matchedDeals = source.filter((deal) => interests.some((interest) => dealMatchesInterestCategory(deal, interest)));
    const fallbackDeals = memberFavoriteDeals.length ? memberFavoriteDeals : recommendedDeals;

    return [...(matchedDeals.length ? matchedDeals : fallbackDeals)]
      .sort((a, b) => b.likeCount - a.likeCount || commercialScore(b) - commercialScore(a))
      .slice(0, 6);
  }, [catalog, deals, favoriteCategories, memberFavoriteDeals, recommendedDeals]);

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
  const quickCategoryShortcuts = useMemo(
    () =>
      ["all", "freezero", "today", "food", "living", "digital", "fashion", "baby", "mart", "coupon", "travel"]
        .map((id) => {
          const channel = getDealChannel(id);
          return {
            id,
            label: channel.label,
            count: categoryCounts[id] ?? 0
          };
        })
        .filter((item) => item.id === "all" || item.count > 0),
    [categoryCounts]
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
  const quickMallFilterChips = useMemo(
    () =>
      mallFilters
        .filter((mall) => mall.id !== "all" && (mallCounts[mall.id] ?? 0) > 0)
        .slice(0, 7),
    [mallCounts]
  );
  const quickPriceFilterChips = useMemo(
    () => priceBands.filter((band) => band.id !== "all" && (priceBandCounts[band.id] ?? 0) > 0),
    [priceBandCounts]
  );
  const quickBenefitFilterChips = useMemo(
    () =>
      benefitFilters.filter((filter) =>
        ["discount", "freebie", "coupon", "freeShipping", "point", "foodDelivery"].includes(filter.id)
      ),
    []
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

  const quickSearchSuggestions = useMemo(() => {
    const merged = [...recentSearchKeywords, ...highIntentSearchKeywords, ...popularSearchKeywords];
    return Array.from(new Set(merged)).slice(0, 24);
  }, [popularSearchKeywords, recentSearchKeywords]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string }> = [];
    const selectedChannel = getDealChannel(category);
    const selectedMall = mallFilters.find((mall) => mall.id === mallFilter);
    const selectedPriceBand = priceBands.find((band) => band.id === priceBand);
    const selectedBenefit = benefitFilters.find((filter) => filter.id === benefitFilter);

    if (query.trim()) chips.push({ id: "query", label: `검색: ${query.trim()}` });
    if (category !== "all") chips.push({ id: "category", label: selectedChannel.label });
    if (mallFilter !== "all" && selectedMall) chips.push({ id: "mall", label: selectedMall.label });
    if (priceBand !== "all" && selectedPriceBand) chips.push({ id: "price", label: selectedPriceBand.label });
    if (benefitFilter !== "all" && selectedBenefit) chips.push({ id: "benefit", label: selectedBenefit.label });
    if (verifiedOnly) chips.push({ id: "verified", label: "구매링크 확인" });
    if (freeShippingOnly) chips.push({ id: "freeShipping", label: "무료배송" });
    if (hotOnly) chips.push({ id: "hot", label: "핫딜" });
    if (endingSoonOnly) chips.push({ id: "endingSoon", label: "마감임박" });
    if (sort !== "latest") {
      const sortLabel: Record<DealSort, string> = {
        latest: "최신순",
        discount: "할인율순",
        price: "낮은 가격순",
        hot: "핫딜순",
        endingSoon: "마감임박순"
      };
      chips.push({ id: "sort", label: sortLabel[sort] });
    }

    return chips;
  }, [benefitFilter, category, endingSoonOnly, freeShippingOnly, hotOnly, mallFilter, priceBand, query, sort, verifiedOnly]);
  const activeFilterLabels = useMemo(() => activeFilterChips.map((chip) => chip.label), [activeFilterChips]);

  const filterOutcomeCards = useMemo(
    () => [
      {
        title: "현재 조건으로 볼 혜택",
        value: `${deals.length}개`,
        copy: activeFilterLabels.length ? "선택한 조건에 맞는 상품과 무료 혜택입니다." : "전체 혜택을 넓게 보고 있습니다."
      },
      {
        title: "구매처 바로 확인",
        value: `${deals.filter(isVerifiedPurchaseLink).length}개`,
        copy: "검색 결과가 아닌 실제 상품·혜택 상세 이동을 우선 표시합니다."
      },
      {
        title: "마감 전 확인",
        value: `${deals.filter((deal) => deal.isEndingSoon || deal.isExpired).length}개`,
        copy: "시간 제한, 선착순, 종료 가능성이 있는 혜택입니다."
      },
      {
        title: "배송비 부담 낮음",
        value: `${deals.filter(isFreeShippingDeal).length}개`,
        copy: "무료배송 또는 배송비 조건이 좋은 혜택입니다."
      }
    ],
    [activeFilterLabels.length, deals]
  );

  const searchResultSnapshot = useMemo(() => {
    const activeDeals = deals;
    const mallCounts = new Map<string, number>();
    for (const deal of activeDeals) {
      mallCounts.set(deal.mallName, (mallCounts.get(deal.mallName) ?? 0) + 1);
    }

    const topMall = Array.from(mallCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))[0];
    const bestDiscount = activeDeals.reduce((best, deal) => Math.max(best, deal.discountRate), 0);
    const lowestPrice = activeDeals.reduce((best, deal) => Math.min(best, deal.salePrice), Number.POSITIVE_INFINITY);
    const endingSoonCount = activeDeals.filter((deal) => deal.isEndingSoon || deal.isExpired).length;

    return [
      {
        label: "많은 판매처",
        value: topMall ? topMall[0] : "대기 중",
        helper: topMall ? `${topMall[1]}개 혜택` : "검색 결과 없음"
      },
      {
        label: "최대 할인",
        value: activeDeals.length ? `${bestDiscount}%` : "0%",
        helper: "할인율 높은순으로 바로 비교"
      },
      {
        label: "낮은 현재가",
        value: Number.isFinite(lowestPrice) ? formatPrice(lowestPrice) : "-",
        helper: "가격 낮은순과 함께 확인"
      },
      {
        label: "마감 임박",
        value: `${endingSoonCount}개`,
        helper: endingSoonCount ? "오늘 먼저 확인할 후보" : "여유 있는 혜택 위주"
      }
    ];
  }, [deals]);

  const searchDecisionGuide = useMemo(() => {
    const verifiedCount = deals.filter(isVerifiedPurchaseLink).length;
    const freeShippingCount = deals.filter(isFreeShippingDeal).length;
    const endingSoonCount = deals.filter((deal) => deal.isEndingSoon || deal.isExpired).length;
    const hotCount = deals.filter((deal) => deal.isHot).length;
    const averageDiscount = deals.length ? Math.round(deals.reduce((sum, deal) => sum + deal.discountRate, 0) / deals.length) : 0;

    if (!deals.length) {
      return {
        label: "결과 없음",
        title: "조건을 조금 넓혀보세요",
        copy: "검색어를 줄이거나 쇼핑몰, 가격대, 혜택 필터를 초기화하면 다시 찾을 수 있습니다.",
        actionLabel: "조건 초기화",
        action: "reset" as const
      };
    }

    if (verifiedCount && verifiedCount < deals.length) {
      return {
        label: "먼저 볼 기준",
        title: `구매처 확인 ${verifiedCount}개부터 보세요`,
        copy: "검색 결과나 대표몰이 아니라 실제 상품·혜택 상세로 이동 가능한 항목을 먼저 추립니다.",
        actionLabel: "구매처 확인만 보기",
        action: "verified" as const
      };
    }

    if (endingSoonCount >= Math.max(2, Math.ceil(deals.length * 0.2))) {
      return {
        label: "먼저 볼 기준",
        title: `마감 임박 ${endingSoonCount}개를 먼저 확인하세요`,
        copy: "시간 제한, 선착순, 쿠폰 종료 가능성이 있는 항목부터 놓치지 않게 정렬합니다.",
        actionLabel: "마감 임박 보기",
        action: "endingSoon" as const
      };
    }

    if (freeShippingCount >= Math.max(2, Math.ceil(deals.length * 0.25))) {
      return {
        label: "먼저 볼 기준",
        title: `무료배송 ${freeShippingCount}개로 배송비를 줄이세요`,
        copy: "실제 결제 전 배송비 조건을 함께 확인하기 좋은 결과입니다.",
        actionLabel: "무료배송 보기",
        action: "freeShipping" as const
      };
    }

    if (hotCount >= Math.max(2, Math.ceil(deals.length * 0.2))) {
      return {
        label: "먼저 볼 기준",
        title: `반응 좋은 핫딜 ${hotCount}개를 먼저 보세요`,
        copy: "클릭, 찜, 인기 신호가 높은 후보부터 빠르게 비교합니다.",
        actionLabel: "핫딜 보기",
        action: "hot" as const
      };
    }

    return {
      label: "먼저 볼 기준",
      title: `평균 할인율 ${averageDiscount}% 결과입니다`,
      copy: "가격 낮은순이나 할인율 높은순으로 바꾸면 비교 기준이 더 또렷해집니다.",
      actionLabel: "할인율순 보기",
      action: "discount" as const
    };
  }, [deals]);

  const dealScanBarItems = useMemo(() => {
    const verifiedCount = deals.filter(isVerifiedPurchaseLink).length;
    const freeShippingCount = deals.filter(isFreeShippingDeal).length;
    const hotCount = deals.filter((deal) => deal.isHot).length;
    const lowestDeal = deals.reduce<Deal | null>((best, deal) => (!best || deal.salePrice < best.salePrice ? deal : best), null);
    const topDiscountDeal = deals.reduce<Deal | null>((best, deal) => (!best || deal.discountRate > best.discountRate ? deal : best), null);

    return [
      {
        label: "구매처 확인",
        value: `${verifiedCount}개`,
        helper: "검색 결과 대신 상세 이동",
        action: () => setVerifiedOnly((current) => !current),
        active: verifiedOnly
      },
      {
        label: "무료배송",
        value: `${freeShippingCount}개`,
        helper: "배송비 부담 낮춤",
        action: () => setFreeShippingOnly((current) => !current),
        active: freeShippingOnly
      },
      {
        label: "핫딜",
        value: `${hotCount}개`,
        helper: "반응 좋은 상품",
        action: () => setHotOnly((current) => !current),
        active: hotOnly
      },
      {
        label: "낮은 가격 후보",
        value: lowestDeal ? formatPrice(lowestDeal.salePrice) : "-",
        helper: lowestDeal?.mallName ?? "결과 없음",
        action: () => setSort("price"),
        active: sort === "price"
      },
      {
        label: "할인율 최고",
        value: topDiscountDeal ? `${topDiscountDeal.discountRate}%` : "0%",
        helper: topDiscountDeal?.mallName ?? "결과 없음",
        action: () => setSort("discount"),
        active: sort === "discount"
      }
    ];
  }, [deals, freeShippingOnly, hotOnly, sort, verifiedOnly]);

  const listComparisonCards = useMemo(() => {
    const availableDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut);
    const pickLowestPrice = availableDeals.reduce<Deal | null>((best, deal) => (!best || deal.salePrice < best.salePrice ? deal : best), null);
    const pickTopDiscount = availableDeals.reduce<Deal | null>((best, deal) => (!best || deal.discountRate > best.discountRate ? deal : best), null);
    const pickBigSavings = availableDeals.reduce<Deal | null>((best, deal) => (!best || deal.discountAmount > best.discountAmount ? deal : best), null);
    const pickEndingSoon = availableDeals.reduce<Deal | null>((best, deal) => {
      if (!best) return deal;
      return new Date(deal.expireAt).getTime() < new Date(best.expireAt).getTime() ? deal : best;
    }, null);

    return [
      {
        label: "가장 낮은 가격",
        value: pickLowestPrice ? formatPrice(pickLowestPrice.salePrice) : "-",
        helper: pickLowestPrice ? `${pickLowestPrice.mallName} · ${pickLowestPrice.shipping}` : "조건을 넓히면 비교 후보가 늘어납니다.",
        deal: pickLowestPrice
      },
      {
        label: "할인율 최고",
        value: pickTopDiscount ? `${pickTopDiscount.discountRate}% 할인` : "0% 할인",
        helper: pickTopDiscount ? `${pickTopDiscount.mallName} · ${formatPrice(pickTopDiscount.salePrice)}` : "할인율 높은 상품이 없습니다.",
        deal: pickTopDiscount
      },
      {
        label: "절약액 큼",
        value: pickBigSavings ? `${formatPrice(pickBigSavings.discountAmount)} 아낌` : "-",
        helper: pickBigSavings ? `${pickBigSavings.mallName} · 정상가 대비` : "원가 정보가 있는 상품을 우선 비교합니다.",
        deal: pickBigSavings
      },
      {
        label: "마감 먼저",
        value: pickEndingSoon ? getTimeLeft(pickEndingSoon.expiresAt ?? pickEndingSoon.expireAt) : "-",
        helper: pickEndingSoon ? `${pickEndingSoon.mallName} · 구매 전 종료 시간을 확인하세요.` : "진행 중인 후보가 없습니다.",
        deal: pickEndingSoon
      }
    ];
  }, [deals]);

  const listRefinementChips = useMemo(() => {
    const countBy = <T extends string>(items: T[]) => {
      const counts = new Map<T, number>();
      for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);

      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
        .map(([id, count]) => ({ id, count }));
    };

    const mallChips = countBy(deals.map((deal) => deal.mallName))
      .filter((item) => item.id !== mallFilter)
      .slice(0, 3)
      .map((item) => ({
        id: `mall-${item.id}`,
        label: item.id,
        value: `${item.count}개`,
        helper: "쇼핑몰로 좁히기",
        active: false,
        action: () => {
          setMallFilter(item.id);
          showToast(`${item.id} 특가만 모아봅니다.`);
        }
      }));

    const categoryChips = countBy(deals.map((deal) => deal.category))
      .map((item) => ({ ...item, filterId: getCategoryFilterId(item.id) }))
      .filter((item) => item.filterId !== category)
      .slice(0, 3)
      .map((item) => ({
        id: `category-${item.filterId}-${item.id}`,
        label: item.id,
        value: `${item.count}개`,
        helper: "카테고리로 좁히기",
        active: false,
        action: () => {
          setCategory(item.filterId);
          showToast(`${item.id} 카테고리만 봅니다.`);
        }
      }));

    const benefitChips = countBy(deals.map((deal) => deal.dealType))
      .filter((item) => item.id !== benefitFilter)
      .slice(0, 3)
      .map((item) => ({
        id: `benefit-${item.id}`,
        label: benefitFilters.find((filter) => filter.id === item.id)?.label ?? item.id,
        value: `${item.count}개`,
        helper: "혜택 유형으로 좁히기",
        active: false,
        action: () => {
          setBenefitFilter(item.id);
          showToast(`${benefitFilters.find((filter) => filter.id === item.id)?.label ?? item.id} 혜택만 봅니다.`);
        }
      }));

    const utilityChips = [
      {
        id: "verified",
        label: "구매처 확인",
        value: `${deals.filter(isVerifiedPurchaseLink).length}개`,
        helper: "실제 상세 이동 우선",
        active: verifiedOnly,
        action: () => {
          setVerifiedOnly((current) => !current);
          showToast(verifiedOnly ? "구매처 확인 필터를 해제했습니다." : "구매처 확인된 특가만 봅니다.");
        }
      },
      {
        id: "free-shipping",
        label: "무료배송",
        value: `${deals.filter(isFreeShippingDeal).length}개`,
        helper: "배송비 부담 낮음",
        active: freeShippingOnly,
        action: () => {
          setFreeShippingOnly((current) => !current);
          showToast(freeShippingOnly ? "무료배송 필터를 해제했습니다." : "무료배송 특가만 봅니다.");
        }
      },
      {
        id: "ending-soon",
        label: "마감임박",
        value: `${deals.filter((deal) => deal.isEndingSoon || deal.isExpired).length}개`,
        helper: "오늘 먼저 확인",
        active: endingSoonOnly,
        action: () => {
          setEndingSoonOnly((current) => !current);
          showToast(endingSoonOnly ? "마감임박 필터를 해제했습니다." : "마감임박 특가만 봅니다.");
        }
      }
    ].filter((item) => item.active || !item.value.startsWith("0"));

    return [...utilityChips, ...mallChips, ...categoryChips, ...benefitChips].slice(0, 10);
  }, [benefitFilter, category, deals, endingSoonOnly, freeShippingOnly, mallFilter, showToast, verifiedOnly]);

  const searchResultGroups = useMemo(() => {
    const normalizedQuery = query.trim();
    const source = catalog.length ? catalog : deals;
    const matchedDeals = normalizedQuery ? source.filter((deal) => dealMatchesSearch(deal, normalizedQuery)) : source;
    const countBy = <T extends string>(items: T[]) => {
      const counts = new Map<T, number>();
      for (const item of items) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }));
    };

    const malls = countBy(matchedDeals.map((deal) => deal.mallName)).map((item) => ({
      ...item,
      label: item.id
    }));
    const categories = countBy(matchedDeals.map((deal) => deal.category)).map((item) => ({
      id: getCategoryFilterId(item.id),
      label: item.id,
      count: item.count
    }));
    const benefits = countBy(matchedDeals.map((deal) => deal.dealType)).map((item) => ({
      ...item,
      label: benefitFilters.find((filter) => filter.id === item.id)?.label ?? item.id
    }));

    return {
      queryMatchedCount: matchedDeals.length,
      malls,
      categories,
      benefits
    };
  }, [catalog, deals, query]);

  const resultInsightCards = useMemo(() => {
    const topMall = searchResultGroups.malls[0] ?? null;
    const topCategory = searchResultGroups.categories[0] ?? null;
    const topBenefit = searchResultGroups.benefits[0] ?? null;
    const firstVerifiedDeal = deals.find(isVerifiedPurchaseLink) ?? null;

    return [
      {
        id: "mall",
        label: "판매처 집중",
        title: topMall ? `${topMall.label} ${topMall.count}개` : "판매처 대기",
        copy: topMall ? "가장 많이 나온 판매처만 먼저 볼 수 있습니다." : "검색 결과가 생기면 판매처를 추천합니다.",
        actionLabel: "판매처로 좁히기",
        active: Boolean(topMall && mallFilter === topMall.id),
        disabled: !topMall,
        action: () => topMall && setMallFilter(topMall.id)
      },
      {
        id: "category",
        label: "카테고리 집중",
        title: topCategory ? `${topCategory.label} ${topCategory.count}개` : "카테고리 대기",
        copy: topCategory ? "가장 가까운 카테고리 결과를 먼저 모읍니다." : "검색 결과가 생기면 카테고리를 추천합니다.",
        actionLabel: "카테고리로 좁히기",
        active: Boolean(topCategory && category === topCategory.id),
        disabled: !topCategory,
        action: () => topCategory && setCategory(topCategory.id)
      },
      {
        id: "benefit",
        label: "혜택 유형",
        title: topBenefit ? `${topBenefit.label} ${topBenefit.count}개` : "혜택 대기",
        copy: topBenefit ? "무료, 쿠폰, 무배 같은 혜택 성격으로 다시 정리합니다." : "검색 결과가 생기면 혜택 유형을 추천합니다.",
        actionLabel: "혜택으로 좁히기",
        active: Boolean(topBenefit && benefitFilter === topBenefit.id),
        disabled: !topBenefit,
        action: () => topBenefit && setBenefitFilter(topBenefit.id)
      },
      {
        id: "verified",
        label: "안전 이동",
        title: firstVerifiedDeal ? "구매처 확인 결과 우선" : "구매처 확인 대기",
        copy: firstVerifiedDeal ? `${firstVerifiedDeal.mallName} 등 상세 이동 가능한 결과를 먼저 봅니다.` : "구매처 확인된 결과가 생기면 먼저 보여줍니다.",
        actionLabel: "구매처 확인만 보기",
        active: verifiedOnly,
        disabled: !firstVerifiedDeal,
        action: () => setVerifiedOnly((current) => !current)
      }
    ];
  }, [benefitFilter, category, deals, mallFilter, searchResultGroups.benefits, searchResultGroups.categories, searchResultGroups.malls, verifiedOnly]);

  const filterActionQueue = useMemo(() => {
    const usedIds = new Set<string>();
    const findDeal = (predicate: (deal: Deal) => boolean) => {
      const found = deals.find((deal) => !usedIds.has(deal.id) && predicate(deal));
      if (found) usedIds.add(found.id);
      return found ?? null;
    };

    return [
      {
        label: "가장 안전한 이동",
        title: "구매처가 확인된 혜택부터 보기",
        helper: "검색 결과가 아닌 상세 이동 링크가 확인된 결과입니다.",
        deal: findDeal((deal) => isVerifiedPurchaseLink(deal))
      },
      {
        label: "돈 쓰기 전",
        title: "무료·쿠폰 혜택 먼저 챙기기",
        helper: "결제 전에 적용하거나 받을 수 있는 혜택을 먼저 봅니다.",
        deal: findDeal((deal) => ["freebie", "experience", "coupon", "point", "foodDelivery"].includes(deal.dealType))
      },
      {
        label: "오늘 확인",
        title: "마감 전 놓치기 쉬운 혜택",
        helper: "선착순, 기간 한정, 종료 가능성이 있는 결과입니다.",
        deal: findDeal((deal) => deal.isEndingSoon || deal.isExpired)
      }
    ];
  }, [deals]);
  const quickResultPicks = useMemo(
    () =>
      [...deals]
        .sort(
          (a, b) =>
            Number(isVerifiedPurchaseLink(b)) * 120 -
              Number(isVerifiedPurchaseLink(a)) * 120 +
              commercialScore(b) -
              commercialScore(a) +
              b.likeCount * 0.4 -
              a.likeCount * 0.4 +
              b.clickCount * 0.08 -
              a.clickCount * 0.08
        )
        .slice(0, 3),
    [deals]
  );
  const emptySearchRecoveryDeals = useMemo(() => {
    if (deals.length) return [];

    return [...catalog]
      .filter(isVerifiedPurchaseLink)
      .sort((a, b) => commercialScore(b) - commercialScore(a) || b.discountRate - a.discountRate)
      .slice(0, 3);
  }, [catalog, deals.length]);
  const emptySearchRecoveryKeywords = useMemo(() => {
    if (deals.length) return [];

    return highIntentSearchKeywords.filter((keyword) => keyword !== query).slice(0, 8);
  }, [deals.length, query]);

  const todayBenefitQueue = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    const byScore = (items: Deal[]) => [...items].sort((a, b) => commercialScore(b) - commercialScore(a));
    const freeItems = byScore(source.filter((deal) => ["freebie", "experience"].includes(deal.dealType) || deal.salePrice === 0));
    const couponItems = byScore(source.filter((deal) => ["coupon", "point", "event"].includes(deal.dealType)));
    const shippingItems = byScore(source.filter(isFreeShippingDeal));
    const endingItems = byScore(source.filter((deal) => deal.isEndingSoon && !deal.isExpired));
    const verifiedItems = byScore(source.filter(isVerifiedPurchaseLink));

    return [
      {
        id: "freebie",
        title: "무료 혜택 먼저",
        label: "무료/체험",
        copy: "돈 쓰기 전 받을 수 있는 샘플, 체험, 무료 쿠폰",
        count: freeItems.length,
        deal: freeItems[0] ?? null
      },
      {
        id: "coupon",
        title: "쿠폰·포인트 적용",
        label: "쿠폰",
        copy: "구매 전 바로 눌러볼 쿠폰과 적립 혜택",
        count: couponItems.length,
        deal: couponItems[0] ?? null
      },
      {
        id: "freeShipping",
        title: "배송비 줄이기",
        label: "무배",
        copy: "무료배송 또는 배송비 부담이 낮은 혜택",
        count: shippingItems.length,
        deal: shippingItems[0] ?? null
      },
      {
        id: "endingSoon",
        title: "마감 전 확인",
        label: "마감",
        copy: "오늘 끝날 수 있는 선착순, 기간 한정 혜택",
        count: endingItems.length,
        deal: endingItems[0] ?? null
      },
      {
        id: "verified",
        title: "구매처 바로 이동",
        label: "링크",
        copy: "검색 페이지보다 실제 상세 이동을 우선 확인",
        count: verifiedItems.length,
        deal: verifiedItems[0] ?? null
      }
    ];
  }, [catalog, deals]);
  const firstVisitDecisionGuide = useMemo(() => {
    const source = catalog.length ? catalog : deals;
    return buildBenefitDecisionGuide(source);
  }, [catalog, deals]);
  const dailyBenefitBriefing = useMemo(() => buildDailyBenefitBriefing(catalog.length ? catalog : deals, new Date(), 3), [catalog, deals]);
  const dailyRoutinePlan = useMemo(() => buildDailyRoutinePlan(catalog.length ? catalog : deals, 2), [catalog, deals]);

  const searchPurposeCards = useMemo(() => {
    const source = catalog.length ? catalog : deals;

    return searchPurposePresets.map((item) => ({
      ...item,
      count: source.filter(item.match).length
    }));
  }, [catalog, deals]);

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
      <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 md:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((deal) => (
          <QuickDealCard
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
          <section className="rounded-[28px] border border-red-100 bg-white p-3 shadow-sm sm:p-4" aria-label="빠른 상품 검색">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-dossa-red">빠른 상품 검색</p>
                <h3 className="text-lg font-black text-slate-950 sm:text-xl">찾고 싶은 특가를 바로 좁혀보세요</h3>
              </div>
              <p className="text-xs font-bold text-slate-500">검색, 쇼핑몰, 정렬, 핵심 필터를 한 번에 적용합니다.</p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  suggestions={quickSearchSuggestions}
                  resultCount={deals.length}
                  onSelectSuggestion={selectSearchKeyword}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
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
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="검색 결과 핵심 요약">
              {searchResultSnapshot.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-black text-slate-400">{item.label}</p>
                  <p className="mt-1 truncate text-sm font-black text-slate-950 sm:text-base">{item.value}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-500">{item.helper}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="검색 결과 추천 판단">
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
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { label: "오늘특가", active: hotOnly, onClick: () => openQuickDiscovery("hot"), icon: <Flame size={16} /> },
                { label: "무료배송", active: freeShippingOnly, onClick: () => openQuickDiscovery("freeShipping"), icon: <Truck size={16} /> },
                { label: "마감임박", active: endingSoonOnly, onClick: () => openQuickDiscovery("endingSoon"), icon: <Timer size={16} /> },
                { label: "직접구매", active: verifiedOnly, onClick: () => openQuickDiscovery("verified"), icon: <ShieldCheck size={16} /> },
                { label: "쿠폰", active: benefitFilter === "coupon", onClick: () => openBenefitFilter("coupon"), icon: <CheckCircle2 size={16} /> },
                { label: "무료혜택", active: benefitFilter === "freebie", onClick: () => openBenefitFilter("freebie"), icon: <ShoppingBag size={16} /> }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-3 text-sm font-black transition ${
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
            <div className="mt-3 grid gap-3 xl:grid-cols-3" aria-label="쇼핑몰 가격 혜택 빠른 필터">
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
            <div className="mt-3" aria-label="카테고리 바로가기">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-black text-slate-700">카테고리 바로가기</p>
                <p className="text-[11px] font-bold text-slate-400">원하는 분야만 빠르게 보기</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {quickCategoryShortcuts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openCategory(item.id)}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-2xl border px-3 text-xs font-black transition ${
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
            <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3" aria-label="홈 탐색 바로가기">
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
        {activeView === "home" && instantDealRail.length ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4" aria-label="오늘 바로 볼 특가">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-dossa-red">오늘 바로 볼 특가</p>
                <h3 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">검색 결과에서 먼저 확인할 상품</h3>
              </div>
              <p className="hidden text-xs font-bold text-slate-500 sm:block">상품 상세도 새 탭으로 열립니다.</p>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {instantDealRail.map((deal) => (
                <article
                  key={deal.id}
                  className="group relative flex w-[168px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-white sm:w-[190px]"
                >
                  <Link
                    href={`/deals/${deal.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    aria-label={`${deal.title} 상세 정보 새 탭으로 보기`}
                  >
                    <span className="relative block aspect-square overflow-hidden bg-red-50">
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
                      <span className="absolute left-2 top-2 rounded-full bg-dossa-red px-2 py-1 text-xs font-black text-white">{deal.discountRate}%</span>
                      {deal.isFreeShipping ? (
                        <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-1 text-[11px] font-black text-dossa-red shadow-sm">무료배송</span>
                      ) : null}
                    </span>
                    <span className="block space-y-1.5 p-3">
                      <span className="flex items-center justify-between gap-2 text-[11px] font-black">
                        <span className="truncate text-dossa-red">{deal.mallName}</span>
                        <span className="shrink-0 text-slate-400">{getRelativeTime(deal.priceCheckedAt)}</span>
                      </span>
                      <span className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950">{deal.title}</span>
                      <span className="block text-[11px] font-bold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</span>
                      <span className="block text-lg font-black text-dossa-red">{formatPrice(deal.salePrice)}</span>
                    </span>
                  </Link>
                  <div className="mt-auto grid grid-cols-2 gap-1 px-3 pb-3">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(deal.id)}
                      className={`min-h-10 rounded-2xl border text-xs font-black transition ${
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
                      className="min-h-10 rounded-2xl bg-slate-950 text-xs font-black text-white transition hover:bg-dossa-red"
                      aria-label={`${deal.title} 판매처 새 탭으로 확인`}
                    >
                      구매
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {activeView === "home" ? (
          <>
            <details className="group overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-sm" aria-label="심화 혜택 탐색 접기">
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
              </div>
            </details>

            <details className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm" aria-label="상세 필터와 결과 분석 접기">
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
                구매링크 확인 필터를 켜면 판매처 검색 확인이 필요한 특가는 제외됩니다.
              </p>
              {loadError ? (
                <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-black text-amber-700">{loadError}</p>
              ) : null}
              </div>
            </details>

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
                <div className="w-full max-w-3xl space-y-4 text-left" aria-label="검색 결과 없음 복구">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-dossa-red"
                    >
                      조건 초기화하고 전체 특가 보기
                    </button>
                  </div>
                  {emptySearchRecoveryKeywords.length ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-3" aria-label="검색 결과 없음 추천 검색어">
                      <p className="text-xs font-black text-dossa-red">바로 다시 찾아볼 검색어</p>
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {emptySearchRecoveryKeywords.map((keyword) => (
                          <button
                            key={keyword}
                            type="button"
                            onClick={() => selectSearchKeyword(keyword)}
                            className="inline-flex min-h-10 shrink-0 items-center rounded-2xl border border-red-100 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-white hover:text-dossa-red"
                            aria-label={`${keyword} 검색어로 다시 검색`}
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {emptySearchRecoveryDeals.length ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3" aria-label="검색 실패 시 먼저 볼 검증 특가">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-700">먼저 볼 만한 검증 특가</p>
                          <p className="text-[11px] font-bold text-slate-500">검색 결과 대신 실제 구매 링크가 확인된 상품을 보여드립니다.</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-dossa-red">새 탭 이동</span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {emptySearchRecoveryDeals.map((deal) => (
                          <button
                            key={deal.id}
                            type="button"
                            onClick={() => openDeal(deal)}
                            className="min-h-[112px] rounded-2xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            aria-label={`${deal.title} 검증 특가 판매처 확인`}
                          >
                            <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-black text-dossa-red">{deal.discountRate}%</span>
                            <strong className="mt-2 line-clamp-2 block text-sm font-black text-slate-950">{deal.title}</strong>
                            <span className="mt-2 block truncate text-[11px] font-bold text-slate-500">{deal.mallName} · {formatPrice(deal.salePrice)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
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

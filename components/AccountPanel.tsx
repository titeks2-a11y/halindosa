"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, Clock, Heart, History, LogOut, Settings, SlidersHorizontal, Sparkles, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { BenefitSavingsDiary } from "@/components/BenefitSavingsDiary";
import { getSupabaseBrowserClient } from "@/lib/auth/supabaseClient";
import { benefitMissionLabels, getTodayKey, readBenefitCheckInState } from "@/lib/benefitCheckIn";
import { benefitReturnReservationUpdatedEvent, readBenefitReturnReservations } from "@/lib/benefitReturnReservations";
import { benefitVisitStreakStorageKey, readBenefitVisitStreak } from "@/lib/benefitVisitStreak";
import { claimedBenefitUpdatedEvent, readClaimedBenefits } from "@/lib/claimedBenefits";
import { buildClaimEffortSummary, getClaimEffort } from "@/lib/deals/claimEffort";
import { formatPrice } from "@/lib/format";
import { priceAlertStorageKey, readStoredPriceAlerts } from "@/lib/priceAlerts";
import { readRecentDealIds } from "@/lib/recentDeals";
import {
  clearRecentDealsSynced,
  fetchRemotePreferences,
  readLocalFavoriteIds,
  readLocalPreferences,
  syncFavoritesWithSupabase,
  syncRecentDealsWithSupabase,
  savePreferencesSynced
} from "@/lib/memberSync";
import { Deal } from "@/types/deal";

const categoryOptions = ["식품", "생활용품", "디지털", "패션", "육아", "여행", "뷰티", "쿠폰/이벤트"];

interface MemberPreferences {
  favoriteCategories: string[];
  marketingConsent: boolean;
  notificationConsent: boolean;
}

function AccountClaimEffortBoard({ deals }: { deals: Deal[] }) {
  const claimEffortSummary = buildClaimEffortSummary(deals);
  const claimEffortGroups = [
    {
      key: "easy",
      label: "간편 수령",
      description: "가입·조건 확인이 적어 바로 열어볼 후보",
      icon: CheckCircle2,
      href: "/free-benefits?effort=easy"
    },
    {
      key: "condition",
      label: "조건 확인",
      description: "쿠폰, 최소금액, 가입 조건을 먼저 볼 후보",
      icon: SlidersHorizontal,
      href: "/free-benefits?effort=condition"
    },
    {
      key: "deadline",
      label: "마감 주의",
      description: "선착순·마감 임박이라 오늘 먼저 볼 후보",
      icon: Clock,
      href: "/free-benefits?effort=deadline"
    }
  ].map((group) => {
    const summaryGroup = claimEffortSummary.groups.find((item) => item.effort === group.key);
    const sampleDeal = deals.find((deal) => getClaimEffort(deal) === group.key && !deal.isExpired && !deal.isSoldOut);

    return {
      ...group,
      count: summaryGroup?.count ?? 0,
      sample: sampleDeal
    };
  });

  return (
    <div className="mt-4 rounded-3xl border border-red-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">마이 혜택 수령 난이도</p>
          <h3 className="mt-1 text-base font-black text-slate-950">오늘 먼저 챙길 혜택을 쉬운 순서로 정리</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            비회원도 그대로 볼 수 있고, 로그인은 찜·알림·관심 저장을 이어가기 위한 선택 기능입니다.
          </p>
        </div>
        <Link href="/free-benefits" className="w-fit rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white">
          무료 혜택 보기
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {claimEffortGroups.map((group) => {
          const Icon = group.icon;

          return (
            <Link key={group.key} href={group.href} className="rounded-2xl bg-slate-50 p-3 transition hover:bg-red-50">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                  <Icon size={17} />
                </span>
                <span className="text-lg font-black text-slate-950">
                  {group.count}
                  <span className="ml-0.5 text-xs text-dossa-red">개</span>
                </span>
              </div>
              <p className="mt-2 text-xs font-black text-slate-950">{group.label}</p>
              <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{group.description}</p>
              <p className="mt-2 line-clamp-1 text-[11px] font-black text-dossa-red">
                {group.sample ? group.sample.title : "추천 혜택 준비 중"}
              </p>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-[11px] font-black leading-4 text-dossa-deep">
        구매 전에는 최종 가격, 배송비, 쿠폰 조건, 마감 여부를 판매처에서 다시 확인하세요.
      </p>
    </div>
  );
}

function BenefitSaveRoutine({ mode }: { mode: "local" | "guest" | "member" }) {
  const isMember = mode === "member";
  const routineItems = [
    {
      href: "/favorites",
      label: "찜한 혜택 다시 보기",
      description: isMember ? "계정에 저장한 특가를 이어서 확인합니다." : "비회원도 이 기기에 저장한 혜택을 다시 볼 수 있습니다.",
      icon: Heart
    },
    {
      href: "/",
      label: "최근 본 상품 이어보기",
      description: "방금 본 상품과 무료 혜택을 홈에서 다시 찾기 쉽게 정리합니다.",
      icon: History
    },
    {
      href: "/onboarding",
      label: "관심 카테고리 조정",
      description: "무료/체험, 식품, 생활용품처럼 자주 보는 혜택을 먼저 띄웁니다.",
      icon: SlidersHorizontal
    },
    {
      href: "/notifications",
      label: "가격 알림 조건 확인",
      description: "실제 푸시는 별도 동의 후 연결하고, 지금은 앱 안에서 조건만 관리합니다.",
      icon: Bell
    }
  ];

  return (
    <div className="mt-4 rounded-3xl border border-red-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">내 혜택 저장 루틴</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            비회원도 기기에 저장하고, 로그인하면 찜·최근 본 상품·관심 카테고리를 계정으로 이어볼 수 있습니다.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {routineItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.label} href={item.href} className="flex min-h-20 items-start gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-red-50">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black text-slate-950">{item.label}</span>
                <span className="mt-1 block text-[11px] font-bold leading-4 text-slate-500">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-[11px] font-black leading-4 text-dossa-deep">
        가입해야만 볼 수 있는 혜택은 없습니다. 저장, 알림, 개인화만 선택적으로 로그인합니다.
      </p>
    </div>
  );
}

function AccountCarryoverPlan({
  mode,
  favoriteCount,
  recentCount,
  categoryCount,
  priceAlertCount,
  returnReservationCount
}: {
  mode: "local" | "guest" | "member";
  favoriteCount: number;
  recentCount: number;
  categoryCount: number;
  priceAlertCount: number;
  returnReservationCount: number;
}) {
  const isMember = mode === "member";
  const accountCarryoverPlan = [
    {
      label: "찜한 혜택",
      value: favoriteCount,
      suffix: "개",
      description: "다시 확인할 관심 특가",
      icon: Heart
    },
    {
      label: "최근 본 상품",
      value: recentCount,
      suffix: "개",
      description: "방금 본 혜택 기록",
      icon: History
    },
    {
      label: "관심 카테고리",
      value: categoryCount,
      suffix: "개",
      description: "추천에 반영할 관심사",
      icon: SlidersHorizontal
    },
    {
      label: "가격 알림 조건",
      value: priceAlertCount,
      suffix: "개",
      description: "앱 안에 저장한 목표가",
      icon: Bell
    },
    {
      label: "재방문 예약",
      value: returnReservationCount,
      suffix: "개",
      description: "무료·쿠폰·마감 루틴",
      icon: CalendarDays
    }
  ];

  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">비회원 저장을 계정으로 이어보기</p>
          <h3 className="mt-1 text-base font-black text-slate-950">저장한 기록만 로그인하면 이어집니다</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            모든 혜택은 그대로 볼 수 있고, 찜·최근 본 상품·관심 카테고리·가격 알림 조건·재방문 예약만 선택적으로 계정에 보관합니다.
          </p>
        </div>
        <span className="w-fit rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-black text-dossa-red">
          {isMember ? "계정 이어보기 사용 중" : "비회원 전체 열람 유지"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {accountCarryoverPlan.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                  <Icon size={15} />
                </span>
                <span className="text-lg font-black text-slate-950">
                  {item.value}
                  <span className="ml-0.5 text-xs text-dossa-red">{item.suffix}</span>
                </span>
              </div>
              <p className="mt-2 text-xs font-black text-slate-950">{item.label}</p>
              <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{item.description}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Link href={isMember ? "/notifications" : "/login"} className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-xs font-black text-white">
          {isMember ? "알림·재방문 예약 이어보기" : "로그인하고 기록 이어보기"}
        </Link>
        <Link href="/guide" className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-xs font-black text-slate-700">
          저장 기준 확인
        </Link>
      </div>
    </div>
  );
}

function BenefitCheckInSummary() {
  const [checkIn, setCheckIn] = useState<ReturnType<typeof readBenefitCheckInState>>({ lastDate: "", streak: 0, completedMissions: [] });
  const [visitStreak, setVisitStreak] = useState<ReturnType<typeof readBenefitVisitStreak>>({ currentStreak: 0, totalVisits: 0, lastVisitedDate: "", visitedDates: [] });
  const [claimedBenefits, setClaimedBenefits] = useState<ReturnType<typeof readClaimedBenefits>>([]);
  const todayKey = getTodayKey();
  const checkedToday = checkIn.lastDate === todayKey;
  const completedMissions = checkedToday ? checkIn.completedMissions : [];
  const completionRate = Math.round((completedMissions.length / 4) * 100);
  const claimedTodayCount = claimedBenefits.filter((record) => record.claimedAt.slice(0, 10) === todayKey).length;
  const claimedSavings = claimedBenefits.reduce((total, record) => total + record.savingsAmount, 0);

  useEffect(() => {
    const refresh = () => {
      setCheckIn(readBenefitCheckInState());
      setVisitStreak(readBenefitVisitStreak());
      setClaimedBenefits(readClaimedBenefits());
    };
    window.addEventListener("storage", refresh);
    window.addEventListener(claimedBenefitUpdatedEvent, refresh);
    window.addEventListener(benefitReturnReservationUpdatedEvent, refresh);
    refresh();

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(claimedBenefitUpdatedEvent, refresh);
      window.removeEventListener(benefitReturnReservationUpdatedEvent, refresh);
    };
  }, []);

  return (
    <div className="mt-4 rounded-3xl border border-red-100 bg-red-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">이번 주 혜택 루틴 기록</p>
          <h3 className="mt-1 text-base font-black text-slate-950">오늘 챙긴 혜택 {completedMissions.length}/4개</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">
            홈에서 체크한 무료·쿠폰·마감·포인트 루틴을 이 기기에서 이어봅니다.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-dossa-red shadow-sm">
          연속 {checkIn.streak}일
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-dossa-red" style={{ width: `${completionRate}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-black">
        <span className="rounded-2xl bg-white px-2 py-2 text-dossa-red shadow-sm">
          <b className="block text-base">{claimedTodayCount}</b>
          오늘 챙김
        </span>
        <span className="rounded-2xl bg-white px-2 py-2 text-slate-600 shadow-sm">
          <b className="block text-base">{claimedBenefits.length}</b>
          누적 혜택
        </span>
        <span className="rounded-2xl bg-white px-2 py-2 text-slate-600 shadow-sm">
          <b className="block text-base">{formatPrice(claimedSavings)}</b>
          절약 후보
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-white px-3 py-3 text-xs font-black text-slate-700 shadow-sm">
          <span className="block text-[11px] text-slate-400">무료 혜택 방문 기록</span>
          <span className="mt-1 block text-base text-slate-950">연속 {visitStreak.currentStreak}일 · 누적 {visitStreak.totalVisits}회</span>
        </div>
        <Link href="/free-benefits" className="rounded-2xl bg-white px-3 py-3 text-xs font-black text-dossa-red shadow-sm">
          무료 혜택 방문 루틴 이어보기
          <span className="mt-1 block text-[11px] text-red-900/60">무료 1개 챙기고 내일 볼 루틴 예약</span>
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(benefitMissionLabels).map(([id, label]) => {
          const active = completedMissions.includes(id);

          return (
            <span key={id} className={`rounded-full px-3 py-1.5 text-[11px] font-black ${active ? "bg-dossa-red text-white" : "bg-white text-slate-500"}`}>
              {label}
            </span>
          );
        })}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Link href="/?checkin=true" className="rounded-2xl bg-white px-4 py-3 text-center text-xs font-black text-dossa-red shadow-sm">
          홈에서 오늘 루틴 계속하기
        </Link>
        <Link href="/free-benefits" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white">
          무료 혜택 전용 탭 보기
        </Link>
      </div>
    </div>
  );
}

export function AccountPanel() {
  const { configured, isLoading, user, nickname, signOut, updateNickname } = useAuth();
  const userId = user?.id;
  const [draftNickname, setDraftNickname] = useState("");
  const [preferences, setPreferences] = useState<MemberPreferences>({ favoriteCategories: [], marketingConsent: false, notificationConsent: false });
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [priceAlertCount, setPriceAlertCount] = useState(0);
  const [returnReservationCount, setReturnReservationCount] = useState(0);
  const [catalog, setCatalog] = useState<Deal[]>([]);
  const [message, setMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/deals?sort=latest")
      .then((response) => response.json())
      .then((data: { deals?: Deal[] }) => {
        if (active) setCatalog(Array.isArray(data.deals) ? data.deals : []);
      })
      .catch(() => {
        if (active) setCatalog([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!configured || !userId) {
          return Promise.all([Promise.resolve(readLocalFavoriteIds()), Promise.resolve(readRecentDealIds()), Promise.resolve(null)] as const);
        }
        return Promise.all([syncFavoritesWithSupabase(), syncRecentDealsWithSupabase(), fetchRemotePreferences()] as const);
      })
      .then(([nextFavorites, nextRecent, remotePreferences]) => {
        if (!active) return;
        setFavoriteIds(nextFavorites);
        setRecentIds(nextRecent);
        setPriceAlertCount(readStoredPriceAlerts().length);
        setReturnReservationCount(readBenefitReturnReservations().length);
        setPreferences(remotePreferences ?? readLocalPreferences());
      })
      .catch(() => {
        if (!active) return;
        setFavoriteIds(readLocalFavoriteIds());
        setRecentIds(readRecentDealIds());
        setPriceAlertCount(readStoredPriceAlerts().length);
        setReturnReservationCount(readBenefitReturnReservations().length);
        setPreferences(readLocalPreferences());
      });

    return () => {
      active = false;
    };
  }, [configured, userId]);

  const favoriteDeals = useMemo(() => catalog.filter((deal) => favoriteIds.includes(deal.id)).slice(0, 4), [catalog, favoriteIds]);
  const recentDeals = useMemo(() => recentIds.map((id) => catalog.find((deal) => deal.id === id)).filter((deal): deal is Deal => Boolean(deal)).slice(0, 4), [catalog, recentIds]);
  const accountSummaryCards = [
    { label: "찜한 특가", value: favoriteIds.length, suffix: "개", description: "계정에 저장된 관심 상품" },
    { label: "최근 본 상품", value: recentIds.length, suffix: "개", description: "다시 확인할 수 있는 탐색 기록" },
    { label: "관심 카테고리", value: preferences.favoriteCategories.length, suffix: "개", description: "추천에 활용할 선호 영역" },
    { label: "재방문 예약", value: returnReservationCount, suffix: "개", description: "무료·쿠폰·마감 루틴" }
  ];

  const savePreferences = (next: MemberPreferences) => {
    setPreferences(next);
    void savePreferencesSynced(next, user?.email, nickname);
    setMessage("관심 설정을 저장했습니다.");
  };

  const toggleCategory = (category: string) => {
    const exists = preferences.favoriteCategories.includes(category);
    savePreferences({
      ...preferences,
      favoriteCategories: exists
        ? preferences.favoriteCategories.filter((item) => item !== category)
        : [...preferences.favoriteCategories, category]
    });
  };

  const saveNickname = async () => {
    const result = await updateNickname(draftNickname || nickname);
    setMessage(result.error ?? "닉네임을 저장했습니다.");
  };

  const deleteAccount = async () => {
    if (deleteConfirmText !== "탈퇴") {
      setMessage("탈퇴를 진행하려면 확인란에 '탈퇴'를 입력해 주세요.");
      return;
    }

    setIsDeleting(true);
    setMessage("");

    try {
      const client = getSupabaseBrowserClient();
      const { data: sessionData } = client ? await client.auth.getSession() : { data: { session: null } };
      const accessToken = sessionData.session?.access_token;
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ confirmText: deleteConfirmText })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "회원 탈퇴에 실패했습니다.");
      await signOut();
      window.localStorage.removeItem("halindosa:favorites");
      window.localStorage.removeItem("halindosa:recent-deals");
      window.localStorage.removeItem("halindosa:member-preferences");
      window.localStorage.removeItem(priceAlertStorageKey);
      window.localStorage.removeItem(benefitVisitStreakStorageKey);
      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "회원 탈퇴에 실패했습니다.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm font-black text-slate-500 shadow-sm">계정 정보를 확인하는 중입니다.</div>;
  }

  if (!configured) {
    return (
      <section className="rounded-3xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Settings className="text-dossa-red" size={22} />
          <div>
            <h2 className="text-lg font-black text-slate-950">비회원으로 이용 중</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-dossa-deep">
              모든 특가를 둘러볼 수 있고, 찜과 최근 본 상품은 이 기기에 저장됩니다. 로그인 환경에서는 관심 특가를 계정으로 이어볼 수 있습니다.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-sm font-black text-slate-950">계정 활동 요약</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            찜, 최근 본 상품, 관심 카테고리, 재방문 예약을 이 기기에 저장합니다. 로그인 환경을 연결하면 같은 정보를 계정으로 이어볼 수 있습니다.
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {["찜", "최근본", "관심", "예약"].map((label) => (
              <div key={label} className="rounded-2xl bg-red-50 px-2 py-3">
                <p className="text-lg font-black text-dossa-red">0</p>
                <p className="mt-0.5 text-[11px] font-black text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <AccountCarryoverPlan
          mode="local"
          favoriteCount={favoriteIds.length}
          recentCount={recentIds.length}
          categoryCount={preferences.favoriteCategories.length}
          priceAlertCount={priceAlertCount}
          returnReservationCount={returnReservationCount}
        />
        <BenefitSaveRoutine mode="local" />
        <AccountClaimEffortBoard deals={catalog} />
        <BenefitCheckInSummary />
        <div className="mt-4">
          <BenefitSavingsDiary deals={catalog} compact />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
            <UserRound size={22} />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950">로그인하고 관심 특가를 이어보세요</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">찜, 관심 카테고리, 알림 설정을 계정으로 안전하게 보관할 수 있습니다.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href="/login" className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-sm font-black text-white">로그인</Link>
          <Link href="/signup" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">회원가입</Link>
        </div>
        <div className="mt-4 rounded-3xl bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">계정 활동 요약</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            로그인하면 찜, 최근 본 상품, 관심 카테고리, 재방문 예약을 한 화면에서 이어보고 다른 기기에서도 복원할 수 있습니다.
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {["찜", "최근본", "관심", "예약"].map((label) => (
              <div key={label} className="rounded-2xl bg-white px-2 py-3 shadow-sm">
                <p className="text-lg font-black text-dossa-red">0</p>
                <p className="mt-0.5 text-[11px] font-black text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <AccountCarryoverPlan
          mode="guest"
          favoriteCount={favoriteIds.length}
          recentCount={recentIds.length}
          categoryCount={preferences.favoriteCategories.length}
          priceAlertCount={priceAlertCount}
          returnReservationCount={returnReservationCount}
        />
        <BenefitSaveRoutine mode="guest" />
        <AccountClaimEffortBoard deals={catalog} />
        <BenefitCheckInSummary />
        <div className="mt-4">
          <BenefitSavingsDiary deals={catalog} compact />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <UserRound size={23} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-slate-950">{nickname || "할인도사 회원"}</h2>
            <p className="truncate text-sm font-bold text-slate-500">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex h-10 items-center gap-1 rounded-2xl bg-slate-100 px-3 text-xs font-black text-slate-700"
        >
          <LogOut size={15} />
          로그아웃
        </button>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={draftNickname || nickname}
          onChange={(event) => setDraftNickname(event.target.value)}
          className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50"
          placeholder="닉네임"
        />
        <button type="button" onClick={() => void saveNickname()} className="rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white">
          닉네임 저장
        </button>
      </div>

      <div className="mt-5 rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-slate-50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
            <Sparkles size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-950">계정 활동 요약</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              찜, 최근 본 상품, 관심 카테고리, 재방문 예약을 기준으로 다음에 확인할 혜택을 더 빠르게 이어볼 수 있습니다.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {accountSummaryCards.map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-xs font-black text-slate-400">{item.label}</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {item.value}
                <span className="ml-0.5 text-sm text-dossa-red">{item.suffix}</span>
              </p>
              <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Link href="/favorites" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white transition hover:bg-dossa-red">
            찜한 특가 이어보기
          </Link>
          <Link href="/?verifiedOnly=true" className="rounded-2xl bg-white px-4 py-3 text-center text-xs font-black text-dossa-red shadow-sm transition hover:bg-red-50">
            구매 링크 확인 특가 보기
          </Link>
        </div>
        <AccountCarryoverPlan
          mode="member"
          favoriteCount={favoriteIds.length}
          recentCount={recentIds.length}
          categoryCount={preferences.favoriteCategories.length}
          priceAlertCount={priceAlertCount}
          returnReservationCount={returnReservationCount}
        />
        <BenefitSaveRoutine mode="member" />
        <AccountClaimEffortBoard deals={catalog} />
        <BenefitCheckInSummary />
        <div className="mt-4">
          <BenefitSavingsDiary deals={catalog} compact />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-black text-slate-950">관심 카테고리</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categoryOptions.map((category) => {
            const active = preferences.favoriteCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                aria-pressed={active}
                className={`rounded-full px-3 py-2 text-xs font-black transition ${
                  active ? "bg-dossa-red text-white" : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-dossa-red"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
          <span className="inline-flex items-center gap-2"><Bell size={17} className="text-dossa-red" /> 가격 하락/마감 알림 준비</span>
          <input
            type="checkbox"
            checked={preferences.notificationConsent}
            onChange={(event) => savePreferences({ ...preferences, notificationConsent: event.target.checked })}
            className="h-5 w-5 accent-dossa-red"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
          <span className="inline-flex items-center gap-2"><Heart size={17} className="text-dossa-red" /> 마케팅/혜택 소식 수신</span>
          <input
            type="checkbox"
            checked={preferences.marketingConsent}
            onChange={(event) => savePreferences({ ...preferences, marketingConsent: event.target.checked })}
            className="h-5 w-5 accent-dossa-red"
          />
        </label>
      </div>

      {message ? (
        <p role="status" className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          <CheckCircle2 size={17} />
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl bg-red-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-black text-slate-950">
              <Heart size={17} className="text-dossa-red" />
              찜한 특가
            </p>
            <Link href="/favorites" className="text-xs font-black text-dossa-red">전체 보기</Link>
          </div>
          <div className="mt-3 space-y-2">
            {favoriteDeals.length ? favoriteDeals.map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-2xl bg-white p-3 shadow-sm" target="_blank" rel="noopener noreferrer">
                <span className="line-clamp-1 text-sm font-black text-slate-950">{deal.title}</span>
                <span className="mt-1 block text-xs font-bold text-slate-500">{deal.mallName} · {formatPrice(deal.salePrice)}</span>
              </Link>
            )) : (
              <p className="rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-slate-500">
                아직 찜한 특가가 없습니다. 홈에서 하트 버튼을 눌러 저장해보세요.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-black text-slate-950">
              <Clock size={17} className="text-dossa-red" />
              최근 본 상품
            </p>
            <button
              type="button"
              onClick={() => {
                void clearRecentDealsSynced().then(() => {
                  setRecentIds([]);
                  setMessage("최근 본 상품을 비웠습니다.");
                });
              }}
              className="text-xs font-black text-slate-500"
            >
              비우기
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {recentDeals.length ? recentDeals.map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-2xl bg-white p-3 shadow-sm" target="_blank" rel="noopener noreferrer">
                <span className="line-clamp-1 text-sm font-black text-slate-950">{deal.title}</span>
                <span className="mt-1 block text-xs font-bold text-slate-500">{deal.mallName} · {formatPrice(deal.salePrice)}</span>
              </Link>
            )) : (
              <p className="rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-slate-500">
                아직 최근 본 상품이 없습니다. 특가 상세 또는 구매 이동을 확인하면 여기에 표시됩니다.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-dossa-red" size={20} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-950">회원 탈퇴</p>
            <p className="mt-1 text-xs font-bold leading-5 text-red-800">
              탈퇴하면 프로필, 찜, 최근 본 상품, 가격 알림 데이터가 삭제됩니다. 통계용 클릭 로그는 개인을 식별할 수 없도록 익명화됩니다.
            </p>
            {!deleteConfirmOpen ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-xs font-black text-dossa-red"
              >
                <Trash2 size={15} />
                회원 탈퇴 진행
              </button>
            ) : (
              <div className="mt-3 space-y-2">
                <label className="block text-xs font-black text-red-900" htmlFor="delete-confirm-text">
                  확인을 위해 “탈퇴”를 입력하세요.
                </label>
                <input
                  id="delete-confirm-text"
                  value={deleteConfirmText}
                  onChange={(event) => setDeleteConfirmText(event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-red-200 bg-white px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-red-100"
                  placeholder="탈퇴"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void deleteAccount()}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-dossa-red px-4 py-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-70"
                  >
                    <Trash2 size={15} />
                    {isDeleting ? "처리 중" : "탈퇴 확정"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setDeleteConfirmText("");
                    }}
                    className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-700"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

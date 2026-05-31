"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock, Heart, LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { readRecentDealIds, recentDealStorageKey } from "@/lib/recentDeals";
import { formatPrice } from "@/lib/format";
import { Deal } from "@/types/deal";

const profileStorageKey = "halindosa:member-preferences";
const favoriteStorageKey = "halindosa:favorites";
const categoryOptions = ["식품", "생활용품", "디지털", "패션", "육아", "여행", "뷰티", "쿠폰/이벤트"];

interface MemberPreferences {
  favoriteCategories: string[];
  marketingConsent: boolean;
  notificationConsent: boolean;
}

const defaultPreferences: MemberPreferences = {
  favoriteCategories: [],
  marketingConsent: false,
  notificationConsent: false
};

function readPreferences() {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const stored = window.localStorage.getItem(profileStorageKey);
    return stored ? { ...defaultPreferences, ...(JSON.parse(stored) as Partial<MemberPreferences>) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

function readFavoriteIds() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(favoriteStorageKey);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

export function AccountPanel() {
  const { configured, isLoading, user, nickname, signOut, updateNickname } = useAuth();
  const [draftNickname, setDraftNickname] = useState("");
  const [preferences, setPreferences] = useState<MemberPreferences>(() => readPreferences());
  const [favoriteIds] = useState<string[]>(() => readFavoriteIds());
  const [recentIds, setRecentIds] = useState<string[]>(() => (typeof window === "undefined" ? [] : readRecentDealIds()));
  const [catalog, setCatalog] = useState<Deal[]>([]);
  const [message, setMessage] = useState("");

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

  const favoriteDeals = useMemo(() => catalog.filter((deal) => favoriteIds.includes(deal.id)).slice(0, 4), [catalog, favoriteIds]);
  const recentDeals = useMemo(() => recentIds.map((id) => catalog.find((deal) => deal.id === id)).filter((deal): deal is Deal => Boolean(deal)).slice(0, 4), [catalog, recentIds]);

  const savePreferences = (next: MemberPreferences) => {
    setPreferences(next);
    window.localStorage.setItem(profileStorageKey, JSON.stringify(next));
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

  if (isLoading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm font-black text-slate-500 shadow-sm">계정 정보를 확인하는 중입니다.</div>;
  }

  if (!configured) {
    return (
      <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Settings className="text-amber-700" size={22} />
          <div>
            <h2 className="text-lg font-black text-amber-950">회원 기능 설정 필요</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">
              Supabase 환경변수를 연결하면 이메일 회원가입, 로그인 유지, 계정 기반 찜/관심 카테고리 확장이 활성화됩니다.
            </p>
          </div>
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
            <p className="mt-1 text-sm font-semibold text-slate-500">찜, 관심 카테고리, 알림 설정을 계정 기반으로 확장할 수 있습니다.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href="/login" className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-sm font-black text-white">로그인</Link>
          <Link href="/signup" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">회원가입</Link>
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
              <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-2xl bg-white p-3 shadow-sm">
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
                window.localStorage.removeItem(recentDealStorageKey);
                setRecentIds([]);
                setMessage("최근 본 상품을 비웠습니다.");
              }}
              className="text-xs font-black text-slate-500"
            >
              비우기
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {recentDeals.length ? recentDeals.map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-2xl bg-white p-3 shadow-sm">
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
    </section>
  );
}

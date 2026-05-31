"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, Heart, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const profileStorageKey = "halindosa:member-preferences";
const categoryOptions = ["식품", "생활용품", "디지털", "육아", "패션", "뷰티", "여행", "무료/체험"];

interface MemberPreferences {
  favoriteCategories: string[];
  marketingConsent: boolean;
  notificationConsent: boolean;
}

function readPreferences(): MemberPreferences {
  if (typeof window === "undefined") return { favoriteCategories: [], marketingConsent: false, notificationConsent: false };
  try {
    const stored = window.localStorage.getItem(profileStorageKey);
    return stored ? { favoriteCategories: [], marketingConsent: false, notificationConsent: false, ...JSON.parse(stored) } : { favoriteCategories: [], marketingConsent: false, notificationConsent: false };
  } catch {
    return { favoriteCategories: [], marketingConsent: false, notificationConsent: false };
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { configured, user, nickname } = useAuth();
  const [preferences, setPreferences] = useState<MemberPreferences>(() => readPreferences());

  const toggleCategory = (category: string) => {
    setPreferences((current) => {
      const exists = current.favoriteCategories.includes(category);
      return {
        ...current,
        favoriteCategories: exists
          ? current.favoriteCategories.filter((item) => item !== category)
          : [...current.favoriteCategories, category]
      };
    });
  };

  const complete = () => {
    window.localStorage.setItem(profileStorageKey, JSON.stringify(preferences));
    router.push("/");
  };

  return (
    <main className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <p className="text-sm font-black text-red-200">할인도사 시작 설정</p>
        <h1 className="mt-2 text-3xl font-black">{nickname || "관심 특가를 골라주세요"}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
          관심 카테고리를 선택하면 홈에서 더 빠르게 오늘 볼 만한 특가를 찾을 수 있습니다.
        </p>
      </section>

      {configured && !user ? (
        <section className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
          로그인하면 관심 설정과 찜 목록을 계정으로 이어갈 수 있습니다. 먼저 둘러본 뒤 나중에 로그인해도 됩니다.
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
            <Sparkles size={22} />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950">자주 확인할 카테고리</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-500">복수 선택 가능하며 마이페이지에서 언제든 바꿀 수 있습니다.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {categoryOptions.map((category) => {
            const active = preferences.favoriteCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                aria-pressed={active}
                className={`min-h-12 rounded-2xl px-3 text-sm font-black transition ${
                  active ? "bg-dossa-red text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-dossa-red"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-2">
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            <span className="inline-flex items-center gap-2"><BellRing size={17} className="text-dossa-red" /> 가격 하락/마감 알림 준비</span>
            <input
              type="checkbox"
              checked={preferences.notificationConsent}
              onChange={(event) => setPreferences((current) => ({ ...current, notificationConsent: event.target.checked }))}
              className="h-5 w-5 accent-dossa-red"
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            <span className="inline-flex items-center gap-2"><Heart size={17} className="text-dossa-red" /> 혜택/이벤트 소식 수신</span>
            <input
              type="checkbox"
              checked={preferences.marketingConsent}
              onChange={(event) => setPreferences((current) => ({ ...current, marketingConsent: event.target.checked }))}
              className="h-5 w-5 accent-dossa-red"
            />
          </label>
        </div>
      </section>

      <div className="sticky bottom-20 z-20 grid gap-2 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:static sm:grid-cols-[1fr_auto]">
        <Link href="/" className="rounded-2xl bg-slate-100 px-5 py-3 text-center text-sm font-black text-slate-700">
          나중에 하기
        </Link>
        <button type="button" onClick={complete} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-dossa-red px-5 py-3 text-sm font-black text-white">
          할인도사 시작하기
          <ArrowRight size={17} />
        </button>
      </div>
    </main>
  );
}

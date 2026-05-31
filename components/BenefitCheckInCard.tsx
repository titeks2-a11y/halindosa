"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarCheck2, Gift, Sparkles, Timer } from "lucide-react";
import type { BenefitPreset } from "@/components/BenefitPlaybook";
import type { Deal } from "@/types/deal";

interface BenefitCheckInCardProps {
  deals: Deal[];
  favoriteCount: number;
  recentCount: number;
  onApplyPreset: (preset: BenefitPreset) => void;
  onOpenAlerts: () => void;
}

interface CheckInState {
  lastDate: string;
  streak: number;
}

const storageKey = "halindosa:benefit-check-in";

function getTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function getPreviousDateKey(dateKey: string) {
  const previous = new Date(`${dateKey}T00:00:00`);
  previous.setDate(previous.getDate() - 1);
  const month = String(previous.getMonth() + 1).padStart(2, "0");
  const day = String(previous.getDate()).padStart(2, "0");
  return `${previous.getFullYear()}-${month}-${day}`;
}

function readCheckInState(): CheckInState {
  if (typeof window === "undefined") return { lastDate: "", streak: 0 };

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
    return {
      lastDate: typeof parsed.lastDate === "string" ? parsed.lastDate : "",
      streak: typeof parsed.streak === "number" ? parsed.streak : 0
    };
  } catch {
    return { lastDate: "", streak: 0 };
  }
}

function writeCheckInState(state: CheckInState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function BenefitCheckInCard({ deals, favoriteCount, recentCount, onApplyPreset, onOpenAlerts }: BenefitCheckInCardProps) {
  const [checkIn, setCheckIn] = useState<CheckInState>(() => readCheckInState());
  const [todayKey] = useState(() => getTodayKey());
  const checkedToday = checkIn.lastDate === todayKey;

  const stats = useMemo(
    () => ({
      freeBenefits: deals.filter((deal) => deal.dealType === "freebie" || deal.dealType === "experience").length,
      coupons: deals.filter((deal) => deal.dealType === "coupon" || deal.dealType === "foodDelivery").length,
      endingSoon: deals.filter((deal) => deal.isEndingSoon).length,
      points: deals.filter((deal) => deal.dealType === "point").length
    }),
    [deals]
  );

  const completeCheckIn = () => {
    if (checkedToday) return;

    const previousDateKey = getPreviousDateKey(todayKey);
    const nextStreak = checkIn.lastDate === previousDateKey ? checkIn.streak + 1 : 1;
    const nextState = { lastDate: todayKey, streak: nextStreak };

    writeCheckInState(nextState);
    setCheckIn(nextState);
  };

  const routines = [
    {
      title: "무료·체험 먼저",
      description: `${stats.freeBenefits}개 혜택`,
      icon: Gift,
      action: () => onApplyPreset({ dealType: "freebie", query: "무료", sort: "hot" })
    },
    {
      title: "쿠폰 적용",
      description: `${stats.coupons}개 후보`,
      icon: Sparkles,
      action: () => onApplyPreset({ dealType: "coupon", query: "쿠폰", sort: "hot" })
    },
    {
      title: "마감 확인",
      description: `${stats.endingSoon}개 임박`,
      icon: Timer,
      action: () => onApplyPreset({ sort: "endingSoon" })
    },
    {
      title: "알림 큐",
      description: "저장 조건 보기",
      icon: BellRing,
      action: onOpenAlerts
    }
  ];

  return (
    <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="오늘 혜택 출석 체크">
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-dossa-red p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <CalendarCheck2 size={24} />
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-dossa-red">
              {checkedToday ? "오늘 완료" : "오늘 미완료"}
            </span>
          </div>
          <p className="mt-5 text-xs font-black text-red-100">오늘 혜택 출석 체크</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">매일 1분만 확인해도 놓치는 혜택이 줄어듭니다</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-red-50">
            비회원도 기기에만 출석 기록을 저장합니다. 무료 혜택, 쿠폰, 마감 임박, 알림 큐를 순서대로 확인하세요.
          </p>
          <button
            type="button"
            onClick={completeCheckIn}
            disabled={checkedToday}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white px-4 text-sm font-black text-dossa-red transition hover:bg-red-50 disabled:cursor-default disabled:bg-white/75 disabled:text-red-300"
          >
            {checkedToday ? `연속 ${checkIn.streak}일 확인 중` : "오늘 혜택 확인 시작"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-400">오늘 저장 상태</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <span className="rounded-2xl bg-white px-2 py-3 shadow-sm">
                <b className="block text-xl font-black text-dossa-red">{checkIn.streak}</b>
                <span className="text-[11px] font-black text-slate-500">연속일</span>
              </span>
              <span className="rounded-2xl bg-white px-2 py-3 shadow-sm">
                <b className="block text-xl font-black text-slate-950">{favoriteCount}</b>
                <span className="text-[11px] font-black text-slate-500">찜</span>
              </span>
              <span className="rounded-2xl bg-white px-2 py-3 shadow-sm">
                <b className="block text-xl font-black text-slate-950">{recentCount}</b>
                <span className="text-[11px] font-black text-slate-500">최근본</span>
              </span>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
              로그인은 선택 사항입니다. 계정 연결 전에도 출석, 찜, 최근 본 상품은 이 기기에서 이어볼 수 있습니다.
            </p>
          </div>

          <div className="grid gap-2">
            {routines.map((routine) => {
              const Icon = routine.icon;

              return (
                <button
                  key={routine.title}
                  type="button"
                  onClick={routine.action}
                  className="flex min-h-16 items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-4 text-left transition hover:border-red-200 hover:bg-red-50"
                  aria-label={`${routine.title} 루틴 적용`}
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-950">{routine.title}</span>
                    <span className="block text-xs font-bold text-slate-500">{routine.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            href="/free-benefits"
            className="sm:col-span-2 rounded-3xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-black text-dossa-red transition hover:bg-red-100"
          >
            무료 혜택 전용 탭에서 이번 주 루틴 보기
          </Link>
        </div>
      </div>
    </section>
  );
}

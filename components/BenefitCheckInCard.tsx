"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarCheck2, Gift, Sparkles, Timer } from "lucide-react";
import type { BenefitPreset } from "@/components/BenefitPlaybook";
import { getPreviousDateKey, getTodayKey, readBenefitCheckInState, writeBenefitCheckInState } from "@/lib/benefitCheckIn";
import type { BenefitCheckInState } from "@/lib/benefitCheckIn";
import type { Deal } from "@/types/deal";

const defaultCheckInState: BenefitCheckInState = { lastDate: "", streak: 0, completedMissions: [] };

interface BenefitCheckInCardProps {
  deals: Deal[];
  favoriteCount: number;
  recentCount: number;
  onApplyPreset: (preset: BenefitPreset) => void;
  onOpenAlerts: () => void;
}

export function BenefitCheckInCard({ deals, favoriteCount, recentCount, onApplyPreset, onOpenAlerts }: BenefitCheckInCardProps) {
  const [checkIn, setCheckIn] = useState(defaultCheckInState);
  const [todayKey, setTodayKey] = useState("");
  const checkedToday = Boolean(todayKey) && checkIn.lastDate === todayKey;
  const completedMissions = checkedToday ? checkIn.completedMissions ?? [] : [];

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setTodayKey(getTodayKey());
      setCheckIn(readBenefitCheckInState());
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

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

    const currentTodayKey = todayKey || getTodayKey();
    const previousDateKey = getPreviousDateKey(currentTodayKey);
    const nextStreak = checkIn.lastDate === previousDateKey ? checkIn.streak + 1 : 1;
    const nextState = { lastDate: currentTodayKey, streak: nextStreak, completedMissions: [] };

    writeBenefitCheckInState(nextState);
    setTodayKey(currentTodayKey);
    setCheckIn(nextState);
  };

  const toggleMission = (missionId: string) => {
    const currentTodayKey = todayKey || getTodayKey();
    const previousDateKey = getPreviousDateKey(currentTodayKey);
    const nextStreak = checkedToday ? checkIn.streak : checkIn.lastDate === previousDateKey ? checkIn.streak + 1 : 1;
    const currentMissions = checkedToday ? checkIn.completedMissions ?? [] : [];
    const nextMissions = currentMissions.includes(missionId)
      ? currentMissions.filter((item) => item !== missionId)
      : [...currentMissions, missionId];
    const nextState = {
      lastDate: currentTodayKey,
      streak: nextStreak,
      completedMissions: nextMissions
    };

    writeBenefitCheckInState(nextState);
    setTodayKey(currentTodayKey);
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
  const missionItems = [
    { id: "free", label: "무료·체험 확인", count: stats.freeBenefits },
    { id: "coupon", label: "쿠폰 적용 후보", count: stats.coupons },
    { id: "ending", label: "마감 전 확인", count: stats.endingSoon },
    { id: "point", label: "포인트 적립", count: stats.points }
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

          <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-dossa-red">오늘 챙긴 혜택 기록</p>
                <p className="mt-1 text-sm font-black text-slate-950">{completedMissions.length}/4개 루틴 완료</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">기기 저장</span>
            </div>
            <div className="mt-3 grid gap-2">
              {missionItems.map((mission) => {
                const active = completedMissions.includes(mission.id);

                return (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => toggleMission(mission.id)}
                    aria-pressed={active}
                    className={`flex min-h-11 items-center justify-between gap-3 rounded-2xl px-3 text-left text-xs font-black transition ${
                      active ? "bg-dossa-red text-white" : "bg-white text-slate-700 hover:bg-red-100"
                    }`}
                  >
                    <span>{mission.label}</span>
                    <span className={active ? "text-red-100" : "text-dossa-red"}>{mission.count}개</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] font-bold leading-4 text-red-900/70">
              기록은 이 기기에만 저장됩니다. 최종 수령 여부와 결제 조건은 판매처에서 다시 확인하세요.
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

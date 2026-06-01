"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Gift } from "lucide-react";
import { readBenefitVisitStreak } from "@/lib/benefitVisitStreak";

export function BenefitVisitStreakSummary() {
  const [visitStreak, setVisitStreak] = useState<ReturnType<typeof readBenefitVisitStreak>>({
    currentStreak: 0,
    totalVisits: 0,
    lastVisitedDate: "",
    visitedDates: []
  });

  useEffect(() => {
    const refresh = () => setVisitStreak(readBenefitVisitStreak());
    window.addEventListener("storage", refresh);
    const frame = window.requestAnimationFrame(refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="rounded-[22px] border border-red-100 bg-white p-4 shadow-sm lg:p-5" aria-label="무료 혜택 방문 알림 요약">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
            <CalendarDays size={20} />
          </span>
          <div>
            <p className="text-xs font-black text-dossa-red">무료 혜택 방문 알림 요약</p>
            <h2 className="mt-1 text-base font-black text-slate-950">무료 혜택을 다시 확인할 타이밍입니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              무료혜택 탭을 열어본 기록을 기준으로 연속 확인일과 다음 재방문 행동을 안내합니다. 비회원도 이 기기에만 기록됩니다.
            </p>
          </div>
        </div>
        <Link href="/free-benefits" className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-xs font-black text-white">
          무료 혜택 이어보기
        </Link>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-3xl bg-red-50 p-4">
          <p className="text-xs font-black text-dossa-red">연속 확인</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{visitStreak.currentStreak}일</p>
          <p className="mt-1 text-xs font-bold text-slate-500">무료·쿠폰 방문 루틴</p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-black text-slate-500">누적 방문</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{visitStreak.totalVisits}회</p>
          <p className="mt-1 text-xs font-bold text-slate-500">이 기기 저장 기준</p>
        </div>
        <div className="rounded-3xl bg-slate-950 p-4 text-white">
          <Gift size={18} className="text-red-100" />
          <p className="mt-2 text-sm font-black leading-5">오늘 무료 1개 챙기고 저녁 쿠폰 점검으로 이어가기</p>
          <p className="mt-2 text-xs font-bold text-slate-300">푸시 권한 없이 알림센터에서만 안내합니다.</p>
        </div>
      </div>
    </section>
  );
}

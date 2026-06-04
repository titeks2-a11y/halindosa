"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { benefitReturnReservationUpdatedEvent, readBenefitReturnReservations } from "@/lib/benefitReturnReservations";
import { readBenefitVisitStreak } from "@/lib/benefitVisitStreak";
import { claimedBenefitUpdatedEvent, readClaimedBenefits } from "@/lib/claimedBenefits";
import { formatPrice, getRelativeTime } from "@/lib/format";
import type { Deal } from "@/types/deal";

export function ClaimedBenefitHomeSummary({ deals, favorites }: { deals: Deal[]; favorites: string[] }) {
  const [claimedBenefits, setClaimedBenefits] = useState<ReturnType<typeof readClaimedBenefits>>([]);
  const [returnReservations, setReturnReservations] = useState<ReturnType<typeof readBenefitReturnReservations>>([]);
  const [visitStreak, setVisitStreak] = useState<ReturnType<typeof readBenefitVisitStreak>>({
    currentStreak: 0,
    totalVisits: 0,
    lastVisitedDate: "",
    visitedDates: []
  });
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
              {(returnReservations.length
                ? returnReservations.slice(0, 2)
                : [
                    { id: "free-morning", slot: "아침", title: "무료 혜택 먼저 확인" },
                    { id: "coupon-evening", slot: "저녁", title: "쿠폰·포인트 다시 보기" }
                  ]
              ).map((item) => (
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
                target="_blank"
                rel="noopener noreferrer"
              >
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

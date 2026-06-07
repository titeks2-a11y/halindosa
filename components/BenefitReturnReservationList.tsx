"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, Gift, TicketPercent } from "lucide-react";
import {
  BenefitReturnReservation,
  benefitReturnReservationUpdatedEvent,
  readBenefitReturnReservations,
  writeBenefitReturnReservations
} from "@/lib/benefitReturnReservations";

const reservationLinks: Record<string, { href: string; label: string }> = {
  "morning-free": { href: "/free-benefits?dealType=freebie&sort=recommended", label: "무료 혜택 열기" },
  "evening-coupon": { href: "/free-benefits?dealType=coupon&sort=popular", label: "쿠폰 점검" },
  "deadline-check": { href: "/?endingSoon=true&sort=endingSoon", label: "마감 확인" }
};

const defaultReservationActions = [
  {
    title: "아침 무료 혜택",
    description: "무료 샘플, 체험단, 포인트 적립을 하루 초반에 먼저 확인합니다.",
    href: "/free-benefits?dealType=freebie&sort=recommended",
    icon: Gift
  },
  {
    title: "저녁 쿠폰 점검",
    description: "배달, 외식, 편의점, 마트 쿠폰을 결제 전에 다시 봅니다.",
    href: "/free-benefits?dealType=coupon&sort=popular",
    icon: TicketPercent
  },
  {
    title: "마감 전 확인",
    description: "선착순과 종료 가능 혜택을 마감순으로 이어봅니다.",
    href: "/?endingSoon=true&sort=endingSoon",
    icon: Clock
  }
];

export function BenefitReturnReservationList() {
  const [reservations, setReservations] = useState<BenefitReturnReservation[]>([]);

  const visibleReservations = useMemo(() => reservations.slice(0, 5), [reservations]);
  const todayRoutineSummary = useMemo(
    () => [
      {
        label: "저장된 루틴",
        value: `${reservations.length}개`,
        copy: reservations.length ? "오늘 이어볼 순서가 준비됐습니다." : "아직 저장 전입니다."
      },
      {
        label: "아침 확인",
        value: reservations.some((item) => item.id === "morning-free") ? "예약됨" : "추천",
        copy: "무료 샘플, 체험단, 포인트를 먼저 봅니다."
      },
      {
        label: "저녁 확인",
        value: reservations.some((item) => item.id === "evening-coupon") ? "예약됨" : "추천",
        copy: "쿠폰, 배달, 마트 혜택을 결제 전에 봅니다."
      },
      {
        label: "마감 확인",
        value: reservations.some((item) => item.id === "deadline-check") ? "예약됨" : "추천",
        copy: "오늘 끝날 수 있는 혜택을 마지막으로 확인합니다."
      }
    ],
    [reservations]
  );

  useEffect(() => {
    const refreshReservations = () => setReservations(readBenefitReturnReservations());
    refreshReservations();
    window.addEventListener("storage", refreshReservations);
    window.addEventListener(benefitReturnReservationUpdatedEvent, refreshReservations);
    window.addEventListener("focus", refreshReservations);

    return () => {
      window.removeEventListener("storage", refreshReservations);
      window.removeEventListener(benefitReturnReservationUpdatedEvent, refreshReservations);
      window.removeEventListener("focus", refreshReservations);
    };
  }, []);

  const removeReservation = (id: string) => {
    setReservations((current) => {
      const next = current.filter((item) => item.id !== id);
      writeBenefitReturnReservations(next);
      return next;
    });
  };

  return (
    <section className="rounded-[22px] border border-red-100 bg-white p-4 shadow-sm lg:p-5" aria-label="저장한 재방문 혜택 알림">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">저장한 재방문 혜택 알림</p>
          <h2 className="mt-1 text-base font-black text-slate-950">기기에 저장한 무료·쿠폰·마감 루틴을 이어봅니다</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            무료 혜택 탭에서 저장한 재방문 예약을 알림 센터에서 다시 확인합니다. 실제 푸시 발송 없이 이 기기에만 보관됩니다.
          </p>
        </div>
        <Link href="/free-benefits" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-black text-dossa-red">
          재방문 루틴 추가
        </Link>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="오늘 이어볼 재방문 루틴 요약">
        {todayRoutineSummary.map((item) => (
          <div key={item.label} className="rounded-2xl bg-red-50 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black text-dossa-red">{item.label}</p>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-dossa-red shadow-sm">{item.value}</span>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-red-900/70">{item.copy}</p>
          </div>
        ))}
      </div>

      {visibleReservations.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {visibleReservations.map((item) => {
            const link = reservationLinks[item.id] ?? { href: "/free-benefits", label: "혜택 이어보기" };

            return (
              <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <CalendarDays size={18} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.slot}</span>
                </div>
                <p className="mt-4 text-sm font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">저장일 {new Date(item.createdAt).toLocaleDateString("ko-KR")}</p>
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <Link href={link.href} className="rounded-2xl bg-dossa-red px-3 py-2 text-center text-xs font-black text-white">
                    {link.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeReservation(item.id)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 transition hover:border-red-100 hover:text-dossa-red"
                    aria-label={`${item.title} 재방문 예약 삭제`}
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {defaultReservationActions.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.title} href={item.href} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                  <Icon size={18} />
                </span>
                <p className="mt-4 text-sm font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-dossa-deep">
        재방문 혜택 알림은 권한 요청 없이 쓰는 앱 안의 예약함입니다. 실제 푸시는 FCM과 사용자 동의가 준비된 뒤 별도 연결합니다.
      </p>
    </section>
  );
}

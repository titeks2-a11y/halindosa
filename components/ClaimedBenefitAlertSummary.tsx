"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Clock3, Gift, Sparkles, TicketPercent } from "lucide-react";
import { claimedBenefitUpdatedEvent, readClaimedBenefits } from "@/lib/claimedBenefits";
import { formatPrice } from "@/lib/format";
import type { Deal } from "@/types/deal";

interface ClaimedBenefitAlertSummaryProps {
  deals: Deal[];
}

export function ClaimedBenefitAlertSummary({ deals }: ClaimedBenefitAlertSummaryProps) {
  const [claimedBenefits, setClaimedBenefits] = useState<ReturnType<typeof readClaimedBenefits>>([]);

  useEffect(() => {
    const refresh = () => setClaimedBenefits(readClaimedBenefits());
    window.addEventListener("storage", refresh);
    window.addEventListener(claimedBenefitUpdatedEvent, refresh);
    refresh();

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(claimedBenefitUpdatedEvent, refresh);
    };
  }, []);

  const claimedIds = useMemo(() => new Set(claimedBenefits.map((record) => record.dealId)), [claimedBenefits]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const claimedToday = claimedBenefits.filter((record) => record.claimedAt.slice(0, 10) === todayKey);
  const claimedSavings = claimedBenefits.reduce((total, record) => total + record.savingsAmount, 0);
  const nextBenefits = useMemo(
    () =>
      deals
        .filter(
          (deal) =>
            !claimedIds.has(deal.id) &&
            !deal.isExpired &&
            !deal.isSoldOut &&
            ["freebie", "experience", "coupon", "point", "foodDelivery", "freeShipping"].includes(deal.dealType)
        )
        .sort((a, b) => Number(b.isEndingSoon) - Number(a.isEndingSoon) || b.likeCount - a.likeCount || b.savingsAmount - a.savingsAmount)
        .slice(0, 3),
    [claimedIds, deals]
  );
  const nextAlertQueue = useMemo(
    () => [
      {
        title: "무료 혜택 다시 알림",
        copy: "아직 기록하지 않은 샘플, 체험단, 0원 혜택을 다음 방문 때 먼저 보여줍니다.",
        count: deals.filter((deal) => !claimedIds.has(deal.id) && ["freebie", "experience"].includes(deal.dealType) && !deal.isExpired && !deal.isSoldOut).length,
        href: "/free-benefits?dealType=freebie&sort=recommended",
        icon: Gift
      },
      {
        title: "쿠폰·포인트 재확인",
        copy: "결제 전 다시 볼 쿠폰, 배달/외식, 포인트 적립 혜택을 따로 묶습니다.",
        count: deals.filter((deal) => !claimedIds.has(deal.id) && ["coupon", "point", "foodDelivery"].includes(deal.dealType) && !deal.isExpired && !deal.isSoldOut).length,
        href: "/free-benefits?dealType=coupon&sort=popular",
        icon: TicketPercent
      },
      {
        title: "마감 전 확인 알림",
        copy: "선착순, 기간 한정, 오늘 끝날 수 있는 혜택을 권한 요청 없이 앱 안에서 먼저 정리합니다.",
        count: deals.filter((deal) => !claimedIds.has(deal.id) && deal.isEndingSoon && !deal.isExpired && !deal.isSoldOut).length,
        href: "/?endingSoon=true&sort=endingSoon",
        icon: Clock3
      }
    ],
    [claimedIds, deals]
  );

  return (
    <section className="rounded-[22px] border border-red-100 bg-red-50 p-4 shadow-sm lg:p-5" aria-label="챙긴 혜택 알림 요약">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
            <CheckCircle2 size={22} />
          </span>
          <div>
            <p className="text-xs font-black text-dossa-red">챙긴 혜택 알림 요약</p>
            <h2 className="mt-1 text-base font-black text-slate-950">오늘 챙긴 혜택과 다음 후보를 같이 봅니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-red-900/70">
              무료 혜택 탭에서 `챙김`으로 남긴 기록입니다. 비회원도 이 기기에만 저장되고, 아직 안 챙긴 혜택을 이어서 확인할 수 있습니다.
            </p>
          </div>
        </div>
        <Link href="/free-benefits" className="rounded-2xl bg-white px-4 py-3 text-center text-xs font-black text-dossa-red shadow-sm">
          무료 혜택 더 챙기기
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
        <span className="rounded-2xl bg-white px-3 py-3 text-dossa-red shadow-sm">
          <b className="block text-xl">{claimedToday.length}</b>
          오늘 챙김
        </span>
        <span className="rounded-2xl bg-white px-3 py-3 text-slate-700 shadow-sm">
          <b className="block text-xl">{claimedBenefits.length}</b>
          누적 기록
        </span>
        <span className="rounded-2xl bg-white px-3 py-3 text-slate-700 shadow-sm">
          <b className="block text-xl">{formatPrice(claimedSavings)}</b>
          절약 후보
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Gift size={17} className="text-dossa-red" />
            <p className="text-sm font-black text-slate-950">최근 챙긴 혜택</p>
          </div>
          <div className="mt-3 space-y-2">
            {claimedBenefits.slice(0, 3).length ? (
              claimedBenefits.slice(0, 3).map((record) => (
                <Link key={record.dealId} href={`/deals/${record.dealId}`} className="block rounded-2xl bg-slate-50 p-3 transition hover:bg-red-50">
                  <span className="block truncate text-sm font-black text-slate-950">{record.title}</span>
                  <span className="mt-1 block truncate text-xs font-bold text-slate-500">{record.mallName} · {record.benefitSummary}</span>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">
                아직 챙긴 혜택이 없습니다. 무료 혜택 탭에서 `챙김`을 눌러 기록해보세요.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-dossa-red" />
            <p className="text-sm font-black text-slate-950">아직 챙길 만한 혜택</p>
          </div>
          <div className="mt-3 space-y-2">
            {nextBenefits.map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-2xl bg-slate-50 p-3 transition hover:bg-red-50">
                <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                <span className="mt-1 block truncate text-xs font-bold text-slate-500">{deal.mallName} · {deal.benefitSummary}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm" aria-label="챙긴 혜택 다음 알림 후보">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <Bell size={17} className="text-dossa-red" />
            <p className="text-sm font-black text-slate-950">챙긴 혜택 다음 알림 후보</p>
          </div>
          <p className="text-xs font-bold leading-5 text-slate-500">실제 푸시 전에도 앱 안에서 다음 확인 순서를 보여드립니다.</p>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {nextAlertQueue.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="min-h-[136px] rounded-2xl bg-slate-50 p-3 transition hover:bg-red-50"
                aria-label={`${item.title} ${item.count}개 확인`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <Icon size={16} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.count}개</span>
                </span>
                <span className="mt-3 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.copy}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

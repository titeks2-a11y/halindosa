"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Gift, Sparkles } from "lucide-react";
import { readClaimedBenefits } from "@/lib/claimedBenefits";
import { formatPrice } from "@/lib/format";
import type { Deal } from "@/types/deal";

interface ClaimedBenefitAlertSummaryProps {
  deals: Deal[];
}

export function ClaimedBenefitAlertSummary({ deals }: ClaimedBenefitAlertSummaryProps) {
  const [claimedBenefits, setClaimedBenefits] = useState(() => readClaimedBenefits());

  useEffect(() => {
    const refresh = () => setClaimedBenefits(readClaimedBenefits());
    window.addEventListener("storage", refresh);
    refresh();

    return () => window.removeEventListener("storage", refresh);
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
    </section>
  );
}

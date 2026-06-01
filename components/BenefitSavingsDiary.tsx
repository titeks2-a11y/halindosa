"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, NotebookTabs, PiggyBank } from "lucide-react";
import { claimedBenefitUpdatedEvent, readClaimedBenefits } from "@/lib/claimedBenefits";
import { formatPrice, getRelativeTime } from "@/lib/format";
import { buildSavingsDiarySummary } from "@/lib/savingsDiary";
import type { Deal } from "@/types/deal";

interface BenefitSavingsDiaryProps {
  deals?: Deal[];
  compact?: boolean;
}

export function BenefitSavingsDiary({ deals = [], compact = false }: BenefitSavingsDiaryProps) {
  const [records, setRecords] = useState<ReturnType<typeof readClaimedBenefits>>([]);

  useEffect(() => {
    const refresh = () => setRecords(readClaimedBenefits());

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(claimedBenefitUpdatedEvent, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(claimedBenefitUpdatedEvent, refresh);
    };
  }, []);

  const summary = useMemo(() => buildSavingsDiarySummary(records, deals), [deals, records]);

  return (
    <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="절약 다이어리">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">절약 다이어리</p>
          <h2 className={`${compact ? "text-lg" : "text-2xl"} mt-1 font-black tracking-tight text-slate-950`}>
            오늘 챙긴 혜택과 다음 행동을 같이 봅니다
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
            챙김으로 남긴 무료·쿠폰·포인트 기록을 기준으로 이번 주 절약 후보와 다음에 볼 혜택을 정리합니다. 비회원도 이 기기에만 저장됩니다.
          </p>
        </div>
        <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-xs font-black text-dossa-red">
          <NotebookTabs size={16} aria-hidden />
          이번 주 {summary.weeklyCount}개
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {[
          ["오늘 챙김", `${summary.todayCount}개`, "오늘 기록한 혜택"],
          ["이번 주 절약 후보", formatPrice(summary.weeklySavings), "최근 7일 기준"],
          ["누적 절약 후보", formatPrice(summary.totalSavings), `${summary.totalCount}개 기록`],
          ["자주 챙긴 제공처", summary.topProvider, "기기 기록 기준"]
        ].map(([label, value, helper]) => (
          <div key={label} className="rounded-2xl bg-red-50 p-3">
            <p className="text-[11px] font-black text-dossa-red">{label}</p>
            <p className="mt-1 truncate text-lg font-black text-slate-950">{value}</p>
            <p className="mt-1 text-[11px] font-bold leading-4 text-red-900/60">{helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-dossa-red" aria-hidden />
            <p className="text-sm font-black text-slate-950">최근 챙긴 혜택</p>
          </div>
          <div className="mt-3 space-y-2">
            {summary.recentRecords.length ? (
              summary.recentRecords.map((record) => (
                <Link key={`${record.dealId}-${record.claimedAt}`} href={`/deals/${record.dealId}`} className="block rounded-2xl bg-white px-3 py-2 transition hover:bg-red-50">
                  <span className="block truncate text-xs font-black text-slate-950">{record.title}</span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-slate-500">
                    {record.mallName} · {getRelativeTime(record.claimedAt)} · {formatPrice(record.savingsAmount)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs font-bold leading-5 text-slate-500">
                아직 챙긴 혜택 기록이 없습니다. 무료혜택 탭에서 받을 만한 혜택을 열고 챙김을 눌러보세요.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-950 p-4 text-white">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-red-100" aria-hidden />
            <p className="text-sm font-black">다음 절약 행동</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {summary.nextActions.map((action) => (
              <Link key={action.title} href={action.href} className="rounded-2xl bg-white/10 p-3 transition hover:bg-white/15">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red">{action.count}개</span>
                <span className="mt-3 block text-sm font-black leading-5">{action.title}</span>
                <span className="mt-1 block text-[11px] font-bold leading-4 text-slate-300">{action.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

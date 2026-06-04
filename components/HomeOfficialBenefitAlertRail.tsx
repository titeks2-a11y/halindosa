"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BellRing, ExternalLink, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { getTimeLeft } from "@/lib/format";
import { buildOfficialBenefitAlertQueue, defaultOfficialBenefitAlertInterests } from "@/lib/deals/officialBenefitAlertQueue";
import {
  notificationPreferenceUpdatedEvent,
  readNotificationPreferenceCategories
} from "@/lib/notificationPreferences";
import {
  clearRecentNewsBenefitIds,
  readRecentNewsBenefitIds,
  recentNewsBenefitUpdatedEvent,
  rememberRecentNewsBenefitId
} from "@/lib/recentNewsBenefits";
import type { NewsDeal } from "@/types/newsDeal";

interface HomeOfficialBenefitAlertRailProps {
  deals: NewsDeal[];
  onOpenNewsDeal?: (deal: NewsDeal) => void;
}

function benefitLabel(deal: NewsDeal) {
  if (deal.benefitType === "freebie") return "무료";
  if (deal.benefitType === "coupon") return "쿠폰";
  if (deal.benefitType === "point") return "포인트";
  if (deal.benefitType === "card") return "카드";
  if (deal.benefitType === "membership") return "멤버십";
  return deal.category;
}

export function HomeOfficialBenefitAlertRail({ deals, onOpenNewsDeal }: HomeOfficialBenefitAlertRailProps) {
  const [categories, setCategories] = useState<string[]>(defaultOfficialBenefitAlertInterests);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => {
      const nextCategories = readNotificationPreferenceCategories();
      setCategories(nextCategories.length ? nextCategories : defaultOfficialBenefitAlertInterests);
      setRecentIds(readRecentNewsBenefitIds().slice(0, 12));
    };

    const handle = window.setTimeout(refresh, 0);
    window.addEventListener(notificationPreferenceUpdatedEvent, refresh);
    window.addEventListener(recentNewsBenefitUpdatedEvent, refresh);

    return () => {
      window.clearTimeout(handle);
      window.removeEventListener(notificationPreferenceUpdatedEvent, refresh);
      window.removeEventListener(recentNewsBenefitUpdatedEvent, refresh);
    };
  }, []);

  const alertQueue = useMemo(
    () =>
      buildOfficialBenefitAlertQueue(deals, {
        interests: categories,
        recentNewsIds: recentIds,
        limit: 4
      }),
    [categories, deals, recentIds]
  );

  const alertDeals = useMemo(
    () =>
      alertQueue.items
        .map((item) => deals.find((deal) => deal.id === item.id))
        .filter((deal): deal is NewsDeal => Boolean(deal)),
    [alertQueue.items, deals]
  );

  if (!deals.length) return null;

  const handleOpen = (deal: NewsDeal) => {
    if (onOpenNewsDeal) {
      onOpenNewsDeal(deal);
      return;
    }

    rememberRecentNewsBenefitId(deal.id);
    setRecentIds(readRecentNewsBenefitIds().slice(0, 12));
  };

  const clearRecent = () => {
    clearRecentNewsBenefitIds();
    setRecentIds([]);
  };

  return (
    <section
      className="rounded-2xl border border-brand-line bg-white p-3 shadow-sm sm:rounded-[28px] sm:p-4"
      aria-label="오늘 다시 볼 공식 혜택"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-brand-red">
            <BellRing size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-brand-red">재방문 혜택 큐</p>
            <h2 className="mt-0.5 text-base font-black text-slate-950 sm:text-lg">오늘 다시 볼 공식 혜택</h2>
            <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">
              검색 결과가 아니라 공식 페이지 이동이 확인된 혜택만 관심 카테고리와 최근 본 공식 혜택 기준으로 정리합니다.
            </p>
          </div>
        </div>
        {recentIds.length ? (
          <button
            type="button"
            onClick={clearRecent}
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 text-[11px] font-black text-slate-600 transition hover:bg-red-50 hover:text-brand-red"
            aria-label="최근 본 공식 혜택 비우기"
          >
            <RotateCcw size={12} />
            비우기
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="관심 카테고리 공식 혜택 요약">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-brand-red">
          <ShieldCheck size={12} />
          공식 링크 {alertQueue.summary.totalActiveBenefits}개
        </span>
        <span className="inline-flex shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-800">
          관심 매칭 {alertQueue.summary.interestMatchedBenefits}개
        </span>
        <span className="inline-flex shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
          최근 본 공식 혜택 {alertQueue.summary.recentBenefits}개
        </span>
      </div>

      <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-2 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {alertDeals.length ? (
          alertDeals.map((deal) => {
            const reason = alertQueue.items.find((item) => item.id === deal.id)?.reason ?? "공식 페이지 이동이 확인된 혜택입니다.";

            return (
              <Link
                key={deal.id}
                href={`/go/news/${encodeURIComponent(deal.id)}?from=home-official-alert`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleOpen(deal)}
                className="min-h-[132px] w-[228px] shrink-0 snap-start rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-red-100 hover:bg-red-50 sm:w-auto"
                aria-label={`${deal.title} 공식 페이지 새 탭으로 열기`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-red shadow-sm">
                    {benefitLabel(deal)}
                  </span>
                  <ExternalLink size={14} className="text-slate-400" />
                </span>
                <span className="mt-2 line-clamp-2 block min-h-10 text-xs font-black leading-5 text-slate-950">{deal.title}</span>
                <span className="mt-1 line-clamp-1 block text-[11px] font-bold text-slate-500">
                  {deal.sourceName} · {getTimeLeft(deal.endDate)}
                </span>
                <span className="mt-2 line-clamp-1 block text-[11px] font-black text-brand-red">{reason}</span>
                <span className="mt-3 inline-flex min-h-8 items-center justify-center rounded-full bg-slate-950 px-3 text-[11px] font-black text-white">
                  공식 보기
                </span>
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-red-100 bg-red-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-black text-slate-950">
              <Sparkles size={16} className="text-brand-red" />
              관심 카테고리 공식 혜택을 다시 확인 중입니다.
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">검증된 공식 링크만 홈에 노출합니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}

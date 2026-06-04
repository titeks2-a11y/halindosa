"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, BellRing, Clock3, Gift, Sparkles, TicketPercent } from "lucide-react";
import { getTimeLeft } from "@/lib/format";
import { buildOfficialBenefitAlertQueue, defaultOfficialBenefitAlertInterests } from "@/lib/deals/officialBenefitAlertQueue";
import {
  defaultNotificationCategories,
  notificationPreferenceUpdatedEvent,
  readNotificationPreferenceCategories
} from "@/lib/notificationPreferences";
import {
  readRecentNewsBenefitIds,
  recentNewsBenefitUpdatedEvent,
  rememberRecentNewsBenefitId
} from "@/lib/recentNewsBenefits";
import type { NewsDeal } from "@/types/newsDeal";

interface OfficialBenefitAlertPreviewProps {
  deals: NewsDeal[];
  updatedAt: string;
}

const fallbackCategories = ["무료/체험", "쿠폰/이벤트", "마트/편의점", "영화/문화"];

function benefitLabel(deal: NewsDeal) {
  if (deal.benefitType === "freebie") return "무료혜택";
  if (deal.benefitType === "coupon") return "쿠폰";
  if (deal.benefitType === "point") return "포인트";
  if (deal.benefitType === "card") return "카드할인";
  if (deal.benefitType === "membership") return "멤버십";
  if (deal.benefitType === "foodDelivery") return "배달혜택";
  return deal.category;
}

export function OfficialBenefitAlertPreview({ deals, updatedAt }: OfficialBenefitAlertPreviewProps) {
  const [categories, setCategories] = useState<string[]>(defaultNotificationCategories);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => {
      const nextCategories = readNotificationPreferenceCategories();
      setCategories(nextCategories.length ? nextCategories : fallbackCategories);
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
        interests: categories.length ? categories : defaultOfficialBenefitAlertInterests,
        recentNewsIds: recentIds,
        limit: 5
      }),
    [categories, deals, recentIds]
  );
  const matchedBenefits = useMemo(
    () =>
      alertQueue.items
        .map((item) => deals.find((deal) => deal.id === item.id))
        .filter((deal): deal is NewsDeal => Boolean(deal)),
    [alertQueue.items, deals]
  );

  const recentBenefits = useMemo(
    () =>
      recentIds
        .map((id) => deals.find((deal) => deal.id === id))
        .filter((deal): deal is NewsDeal => Boolean(deal))
        .slice(0, 3),
    [deals, recentIds]
  );
  const officialAlertApiHref = `/api/benefits/official-alerts?limit=5${(categories.length ? categories : defaultOfficialBenefitAlertInterests)
    .slice(0, 5)
    .map((interest) => `&interest=${encodeURIComponent(interest)}`)
    .join("")}${recentIds
    .slice(0, 3)
    .map((recentNewsId) => `&recentNewsId=${encodeURIComponent(recentNewsId)}`)
    .join("")}`;

  const quickFilters = [
    { label: "무료·쿠폰", href: "/free-benefits?activeOnly=true", icon: Gift },
    { label: "카드·멤버십", href: "/?category=카드/멤버십&verifiedOnly=true", icon: TicketPercent },
    { label: "문화·공공", href: "/free-benefits?benefitType=public", icon: Sparkles }
  ];

  return (
    <section className="rounded-[22px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-red-50 p-4 shadow-sm lg:p-5" aria-label="공식 혜택 알림 후보">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
            <BellRing size={21} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-dossa-red">공식 혜택 알림 후보</p>
            <h2 className="mt-1 text-base font-black text-slate-950">공식 페이지 이동만 포함해 오늘 받을 혜택을 골랐습니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              검색 결과나 커뮤니티 원문이 아니라 검증된 공식 혜택 링크만 알림 후보로 사용합니다.
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-black text-slate-600 shadow-sm">
          <BadgeCheck size={14} className="text-dossa-red" />
          {deals.length}개 공식 혜택
        </span>
      </div>

      <div className="mt-4 rounded-3xl border border-amber-100 bg-white/85 p-3 shadow-sm" aria-label="공식 혜택 알림 API">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">공식 혜택 알림 API</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              공식 혜택 {alertQueue.summary.totalActiveBenefits}개 중 관심 카테고리 {alertQueue.summary.interestMatchedBenefits}개와 최근 본 공식 혜택 {alertQueue.summary.recentBenefits}개를 후보로 정리합니다.
            </p>
          </div>
          <Link href={officialAlertApiHref} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-center text-xs font-black text-white">
            공식 알림 API 보기
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "관심 매칭", value: alertQueue.summary.interestMatchedBenefits },
          { label: "최근 본 공식 혜택", value: alertQueue.summary.recentBenefits },
          { label: "마지막 확인", value: updatedAt ? "최신" : "대기" }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-base font-black text-slate-950">{item.value}</p>
            <p className="mt-0.5 text-[11px] font-black text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;

          return (
            <Link
              key={filter.label}
              href={filter.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-black text-dossa-red shadow-sm"
            >
              <Icon size={14} />
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2">
        {matchedBenefits.length ? (
          matchedBenefits.map((deal) => (
            <Link
              key={deal.id}
              href={`/go/news/${deal.id}`}
              onClick={() => rememberRecentNewsBenefitId(deal.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition hover:bg-red-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-dossa-red">
                <Clock3 size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                <span className="mt-1 block truncate text-xs font-bold text-slate-500">
                  {deal.sourceName} · {benefitLabel(deal)} · {getTimeLeft(deal.endDate)}
                </span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-dossa-red">
                  {alertQueue.items.find((item) => item.id === deal.id)?.reason ?? "공식 페이지 이동이 확인된 혜택입니다."}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[11px] font-black text-white">
                공식 보기
              </span>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-5 text-center">
            <p className="text-sm font-black text-slate-950">현재 공식 혜택 알림 후보가 없습니다.</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">공식 페이지가 검증된 혜택만 다시 노출합니다.</p>
          </div>
        )}
      </div>

      {recentBenefits.length ? (
        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-500 shadow-sm">
          최근 본 공식 혜택 {recentBenefits.length}개가 알림 후보 정렬에 반영됩니다. 비회원도 이 기기 안에서만 저장됩니다.
        </p>
      ) : (
        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-500 shadow-sm">
          {alertQueue.notice}
        </p>
      )}
    </section>
  );
}

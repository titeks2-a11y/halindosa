"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarClock, ExternalLink, ShieldCheck, TicketPercent } from "lucide-react";
import { getRelativeTime, getTimeLeft } from "@/lib/format";
import { rememberRecentNewsBenefitId } from "@/lib/recentNewsBenefits";
import type { NewsDeal } from "@/types/newsDeal";

const benefitLabels: Record<NewsDeal["benefitType"], string> = {
  discount: "할인",
  coupon: "쿠폰",
  freebie: "무료",
  membership: "멤버십",
  card: "카드",
  culture: "문화",
  travel: "여행",
  public: "공공혜택",
  point: "포인트",
  foodDelivery: "배달"
};

const categoryHighlights = [
  { key: "free-coupon", label: "무료/쿠폰 혜택", matches: (deal: NewsDeal) => deal.category === "무료혜택" || deal.benefitType === "coupon" || deal.benefitType === "freebie" },
  { key: "card", label: "카드·멤버십 할인", matches: (deal: NewsDeal) => deal.category === "카드/멤버십" || deal.benefitType === "card" || deal.benefitType === "membership" },
  { key: "culture", label: "영화·문화 할인", matches: (deal: NewsDeal) => deal.category === "영화/문화" || deal.benefitType === "culture" },
  { key: "mart", label: "마트·편의점 행사", matches: (deal: NewsDeal) => deal.category === "마트/편의점" },
  { key: "public", label: "정부·공공혜택", matches: (deal: NewsDeal) => deal.category === "정부/공공혜택" || deal.benefitType === "public" },
  { key: "delivery", label: "외식·배달 쿠폰", matches: (deal: NewsDeal) => deal.category === "외식/배달" }
];

export function RealtimeNewsDealsSection({
  deals,
  updatedAt,
  onOpenNewsDeal
}: {
  deals: NewsDeal[];
  updatedAt: string;
  onOpenNewsDeal?: (deal: NewsDeal) => void;
}) {
  const highlightCounts = useMemo(
    () =>
      categoryHighlights
        .map((item) => ({
          ...item,
          count: deals.filter(item.matches).length
        }))
        .filter((item) => item.count > 0),
    [deals]
  );

  if (!deals.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 shadow-sm" aria-label="오늘의 실시간 할인뉴스">
        <p className="text-xs font-black text-brand-red">오늘의 실시간 할인뉴스</p>
        <h3 className="mt-1 text-base font-black text-slate-950">공식 링크가 확인된 혜택만 준비 중입니다</h3>
        <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
          검색 결과, 커뮤니티 원문, 종료 이벤트는 노출하지 않습니다. 공식 이벤트 페이지가 검증되면 이 영역에 표시됩니다.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-brand-line bg-white p-3 shadow-sm sm:rounded-[28px] sm:p-4" aria-label="오늘의 실시간 할인뉴스">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-brand-red">오늘의 실시간 할인뉴스</p>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-xl">공식 혜택 페이지로 바로 이동</h3>
        </div>
        <span className="hidden rounded-full bg-brand-warm px-3 py-1.5 text-[11px] font-black text-slate-600 sm:inline-flex">
          {updatedAt ? getRelativeTime(updatedAt) : "방금 확인"}
        </span>
      </div>
      {highlightCounts.length ? (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="공식 혜택 카테고리 요약">
          {highlightCounts.map((item) => (
            <span key={item.key} className="shrink-0 rounded-full bg-brand-warm px-3 py-1.5 text-[11px] font-black text-slate-700">
              {item.label} {item.count}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {deals.slice(0, 8).map((deal) => (
          <article
            key={deal.id}
            data-news-deal-card="true"
            className="min-h-[166px] w-[250px] shrink-0 snap-start rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-brand-warm p-4 shadow-sm sm:w-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-red shadow-sm">
                <TicketPercent size={19} />
              </span>
              <span className="rounded-full bg-brand-navy px-2.5 py-1 text-[11px] font-black text-white">
                {benefitLabels[deal.benefitType]}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950">{deal.title}</p>
            <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{deal.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700 shadow-sm">
                <ShieldCheck size={12} />
                공식 링크
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                <CalendarClock size={12} />
                {getTimeLeft(deal.endDate)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[11px] font-black text-slate-500">{deal.sourceName}</p>
              <Link
                href={`/go/news/${encodeURIComponent(deal.id)}?from=home-news`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  rememberRecentNewsBenefitId(deal.id);
                  onOpenNewsDeal?.(deal);
                }}
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-red px-3 text-xs font-black text-white transition hover:bg-brand-coral"
                aria-label={`${deal.title} 공식 페이지 새 탭으로 열기`}
              >
                공식 페이지
                <ExternalLink size={13} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

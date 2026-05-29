import { Clock, ExternalLink, Heart, Radio, Zap } from "lucide-react";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import { Deal } from "@/types/deal";
import { HotSignal } from "@/types/hotSignal";

interface LiveDealFeedProps {
  deals: Deal[];
  signals: HotSignal[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  onOpenSignal: (signal: HotSignal) => void;
}

export function LiveDealFeed({
  deals,
  signals,
  favorites,
  onToggleFavorite,
  onOpenDeal,
  onOpenSignal
}: LiveDealFeedProps) {
  const leadDeals = deals.slice(0, 10);
  const hotCount = leadDeals.filter((deal) => deal.isHot).length;
  const endingCount = leadDeals.filter((deal) => deal.isEndingSoon).length;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-dossa-red">
            <Radio size={14} />
            실시간 업데이트
          </div>
          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">지금 올라온 특가</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            할인도사가 감지한 가격 하락, 쿠폰, 마감 임박 정보를 바로 확인하세요.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-slate-400">특가</p>
            <p className="mt-1 text-lg text-slate-950">{leadDeals.length}</p>
          </div>
          <div className="rounded-2xl bg-red-50 px-3 py-2">
            <p className="text-red-400">HOT</p>
            <p className="mt-1 text-lg text-dossa-red">{hotCount}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-3 py-2">
            <p className="text-amber-500">마감</p>
            <p className="mt-1 text-lg text-amber-700">{endingCount}</p>
          </div>
        </div>
      </div>

      {signals.length ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {signals.slice(0, 5).map((signal) => (
            <button
              key={signal.id}
              type="button"
              onClick={() => onOpenSignal(signal)}
              className="min-w-[260px] rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left transition hover:bg-red-100 sm:min-w-[320px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red">할인도사 감지</span>
                <span className="text-xs font-black text-dossa-red">{signal.score}점</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-black leading-6 text-slate-950">{signal.title}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">{getRelativeTime(signal.publishedAt)} 업데이트</p>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100">
        {leadDeals.map((deal) => (
          <article key={deal.id} className="grid gap-3 bg-white p-3 transition hover:bg-slate-50 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-dossa-red text-lg font-black text-white">
                {deal.discountRate}%
              </div>
              <div className="min-w-0 sm:hidden">
                <p className="line-clamp-2 text-base font-black leading-snug text-slate-950">{deal.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{deal.mall} · {deal.category}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <Clock size={12} />
                  {getRelativeTime(deal.createdAt)} · {getTimeLeft(deal.expiresAt)}
                </p>
              </div>
            </div>

            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-2">
                {deal.isHot ? <span className="rounded-full bg-dossa-red px-2 py-0.5 text-[11px] font-black text-white">HOT</span> : null}
                {deal.isEndingSoon ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">마감임박</span> : null}
                <span className="text-xs font-bold text-slate-500">{deal.mall} · {deal.category}</span>
              </div>
              <p className="mt-1 truncate text-base font-black text-slate-950">{deal.title}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                <Clock size={13} />
                {getRelativeTime(deal.createdAt)} 등록 · {getTimeLeft(deal.expiresAt)}
              </p>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
              <div className="min-w-0 text-right">
                <p className="text-xs font-semibold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</p>
                <p className="truncate text-xl font-black text-dossa-red">{formatPrice(deal.salePrice)}</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleFavorite(deal.id)}
                aria-label="찜하기"
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                  favorites.includes(deal.id)
                    ? "border-red-100 bg-red-50 text-dossa-red"
                    : "border-slate-200 bg-white text-slate-400 hover:text-dossa-red"
                }`}
              >
                <Heart size={18} fill={favorites.includes(deal.id) ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={() => onOpenDeal(deal)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-dossa-red"
                aria-label="특가 보러가기"
              >
                <ExternalLink size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>

      <a
        href="#all-deals"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-dossa-red"
      >
        계속 특가 보기
        <Zap size={16} />
      </a>
    </section>
  );
}

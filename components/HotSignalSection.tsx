"use client";

import { useState } from "react";
import { ExternalLink, Heart, Radio, Share2, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { getRelativeTime } from "@/lib/format";
import { getDealImageSrc } from "@/lib/imageSrc";
import { HotSignal } from "@/types/hotSignal";

interface HotSignalSectionProps {
  signals: HotSignal[];
  isLoading: boolean;
  onOpenSignal: (signal: HotSignal) => void;
}

const signalFavoriteKey = "halindosa:signal-favorites";

function getSignalLabel(signal: HotSignal) {
  if (signal.signalType === "community") return "핫딜 반응";
  if (signal.signalType === "news") return "가격 이슈";
  return "특가 감지";
}

export function HotSignalSection({ signals, isLoading, onOpenSignal }: HotSignalSectionProps) {
  const leadSignal = signals[0];
  const restSignals = signals.slice(1, 9);
  const freeCount = signals.filter((signal) => /무료|공짜|무료배포|무료입장|무료개방/.test(`${signal.title} ${signal.summary}`)).length;
  const limitedCount = signals.filter((signal) => /기간한정|오늘만|마감|쿠폰|역대가|반값|1\+1/.test(`${signal.title} ${signal.summary}`)).length;
  const [favoriteSignals, setFavoriteSignals] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(signalFavoriteKey);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  const toggleSignalFavorite = (id: string) => {
    setFavoriteSignals((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem(signalFavoriteKey, JSON.stringify(next));
      return next;
    });
  };

  const shareSignal = async (signal: HotSignal) => {
    const text = `할인도사 ${signal.title}`;

    try {
      const nav = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
        clipboard?: Clipboard;
      };

      if (nav.share) {
        await nav.share({ title: `할인도사 - ${signal.title}`, text, url: signal.url });
        return;
      }

      await nav.clipboard?.writeText(`${text}\n${signal.url}`);
    } catch {
      // Optional share action.
    }
  };

  const renderImage = (signal: HotSignal, sizeClass: string) => (
    <div className={`${sizeClass} relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 text-dossa-red`}>
      {signal.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getDealImageSrc(signal.imageUrl)} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ShoppingBag size={24} />
        </div>
      )}
    </div>
  );

  const renderActions = (signal: HotSignal, dark = false) => {
    const isFavorite = favoriteSignals.includes(signal.id);
    const baseButton = dark
      ? "bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/15"
      : "border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-red-100 hover:text-dossa-red";

    return (
      <>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleSignalFavorite(signal.id);
          }}
          aria-label={`${signal.title} ${isFavorite ? "찜 해제" : "찜하기"}`}
          aria-pressed={isFavorite}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl transition ${baseButton} ${
            isFavorite ? "text-dossa-red" : ""
          }`}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void shareSignal(signal);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${baseButton}`}
            aria-label={`${signal.title} 공유하기`}
          >
            <Share2 size={17} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenSignal(signal);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
              dark ? "bg-white text-slate-950 hover:bg-red-50" : "bg-slate-950 text-white shadow-sm hover:bg-dossa-red"
            }`}
            aria-label={`${signal.title} 자세히 보기`}
          >
            <ExternalLink size={17} />
          </button>
        </div>
      </>
    );
  };

  return (
    <section id="live-signals" className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-dossa-red text-white">
              <Radio size={18} />
            </span>
            <h3 className="text-2xl font-black text-slate-950">오늘 먼저 봐야 할 할인 정보</h3>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            무료/무배, 기간한정 쿠폰, 고할인 특가 중심의 할인도사 우선 브리핑
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
          <span className="rounded-2xl bg-red-50 px-3 py-2 text-dossa-red">
            <Sparkles size={13} className="mx-auto mb-1" />
            {isLoading ? "갱신중" : `${signals.length}개`}
          </span>
          <span className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-700">무료/무배 {freeCount}</span>
          <span className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-700">한정 {limitedCount}</span>
        </div>
      </div>

      {isLoading && !signals.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      ) : null}

      {!isLoading || signals.length ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
          {leadSignal ? (
            <article
              role="button"
              tabIndex={0}
              onClick={() => onOpenSignal(leadSignal)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onOpenSignal(leadSignal);
              }}
              className="relative grid min-h-72 gap-4 rounded-3xl bg-slate-950 p-4 pb-16 pr-16 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-900 sm:grid-cols-[180px_1fr] sm:p-5 sm:pb-16 sm:pr-20"
            >
              {renderImage(leadSignal, "h-32 w-full sm:h-full sm:w-[180px]")}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white">
                    <TrendingUp size={13} />
                    할인도사 추천
                  </span>
                </div>
                <p className="mt-5 line-clamp-4 text-2xl font-black leading-tight sm:text-3xl">{leadSignal.title}</p>
                <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-300">{leadSignal.summary}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-950">{leadSignal.category}</span>
                  {leadSignal.keywords.slice(0, 3).map((keyword) => (
                    <span key={keyword} className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-black text-red-100">
                      {keyword}
                    </span>
                  ))}
                </div>
                <p className="mt-4 truncate text-xs font-bold text-slate-300">실시간 확인 · {getRelativeTime(leadSignal.publishedAt)}</p>
              </div>
              {renderActions(leadSignal, true)}
            </article>
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <div>
                <p className="text-base font-black text-slate-900">아직 감지된 핫딜 신호가 없습니다.</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">검색어 변경 또는 새로고침 필요</p>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {restSignals.map((signal) => (
              <article
                key={signal.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenSignal(signal)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onOpenSignal(signal);
                }}
                className="relative grid min-h-40 grid-cols-[72px_1fr] gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 pb-14 pr-16 text-left transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50"
              >
                {renderImage(signal, "h-[72px] w-[72px]")}
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600">
                      {getSignalLabel(signal)}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-black leading-6 text-slate-950">{signal.title}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500">{signal.category}</span>
                    {signal.keywords.slice(0, 2).map((keyword) => (
                      <span key={keyword} className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-dossa-red">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 truncate text-xs font-semibold text-slate-500">
                    실시간 확인 · {getRelativeTime(signal.publishedAt)}
                  </p>
                </div>
                {renderActions(signal)}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

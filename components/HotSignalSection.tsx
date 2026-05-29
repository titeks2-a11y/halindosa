import { ExternalLink, Radio, Sparkles, TrendingUp } from "lucide-react";
import { getRelativeTime } from "@/lib/format";
import { HotSignal } from "@/types/hotSignal";

interface HotSignalSectionProps {
  signals: HotSignal[];
  isLoading: boolean;
  onOpenSignal: (signal: HotSignal) => void;
}

function getSignalLabel(signal: HotSignal) {
  if (signal.signalType === "community") return "사용자 반응";
  if (signal.signalType === "news") return "가격 이슈";
  return "특가 감지";
}

export function HotSignalSection({ signals, isLoading, onOpenSignal }: HotSignalSectionProps) {
  const leadSignal = signals[0];
  const restSignals = signals.slice(1, 9);
  const freeCount = signals.filter((signal) => /무료|공짜|무료배포|무료입장|무료개방/.test(`${signal.title} ${signal.summary}`)).length;
  const limitedCount = signals.filter((signal) => /기간한정|오늘만|마감|쿠폰|역대가|반값|1\+1/.test(`${signal.title} ${signal.summary}`)).length;

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
            무료/무배, 기간한정 쿠폰, 고할인 특가처럼 놓치기 쉬운 정보를 할인도사가 먼저 정리합니다.
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
            <button
              type="button"
              onClick={() => onOpenSignal(leadSignal)}
              className="flex min-h-72 flex-col justify-between rounded-3xl bg-slate-950 p-5 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white">
                    <TrendingUp size={13} />
                    할인도사 추천
                  </span>
                  <span className="rounded-full bg-dossa-red px-3 py-1.5 text-xs font-black text-white">{leadSignal.score}점</span>
                </div>
                <p className="mt-5 line-clamp-4 text-2xl font-black leading-tight sm:text-3xl">{leadSignal.title}</p>
                <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-slate-300">{leadSignal.summary}</p>
              </div>
              <div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-950">{leadSignal.category}</span>
                  {leadSignal.keywords.slice(0, 3).map((keyword) => (
                    <span key={keyword} className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-black text-red-100">
                      {keyword}
                    </span>
                  ))}
                </div>
                <p className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-slate-300">
                  <span className="truncate">
                    실시간 확인 · {getRelativeTime(leadSignal.publishedAt)}
                  </span>
                  <ExternalLink size={15} className="shrink-0" />
                </p>
              </div>
            </button>
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <div>
                <p className="text-base font-black text-slate-900">아직 감지된 핫딜 신호가 없습니다.</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">검색어를 바꾸거나 잠시 후 새로고침해보세요.</p>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {restSignals.map((signal) => (
              <button
                key={signal.id}
                type="button"
                onClick={() => onOpenSignal(signal)}
                className="min-h-36 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600">
                    {getSignalLabel(signal)}
                  </span>
                  <span className="text-xs font-black text-dossa-red">{signal.score}점</span>
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
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

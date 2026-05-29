import { Newspaper, Radio, Sparkles } from "lucide-react";
import { getRelativeTime } from "@/lib/format";
import { HotSignal } from "@/types/hotSignal";

interface HotSignalSectionProps {
  signals: HotSignal[];
  isLoading: boolean;
  onOpenSignal: (signal: HotSignal) => void;
}

function getSignalLabel(signal: HotSignal) {
  if (signal.signalType === "community") return "커뮤니티";
  if (signal.signalType === "news") return "뉴스";
  return "RSS";
}

export function HotSignalSection({ signals, isLoading, onOpenSignal }: HotSignalSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Radio size={18} />
            </span>
            <h3 className="text-xl font-black text-slate-950">실시간 핫딜 신호</h3>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            뉴스/RSS/허용된 커뮤니티 피드에서 특가 단서를 빠르게 모읍니다.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-dossa-red">
          <Sparkles size={13} />
          {isLoading ? "업데이트 중" : `${signals.length}개 감지`}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {isLoading && !signals.length
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))
          : signals.slice(0, 6).map((signal) => (
              <button
                key={signal.id}
                type="button"
                onClick={() => onOpenSignal(signal)}
                className="min-h-32 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600">
                    <Newspaper size={12} />
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
                  {signal.sourceName} · {getRelativeTime(signal.publishedAt)}
                </p>
              </button>
            ))}
      </div>
    </section>
  );
}

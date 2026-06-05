import { Activity, Download, RefreshCcw, ShieldCheck } from "lucide-react";
import { getRelativeTime } from "@/lib/format";
import type { LiveProbeReviewReport } from "@/lib/operations/liveProbeReview";

interface AdminLiveProbeReviewPanelProps {
  apiHref: string;
  csvHref: string;
  report: LiveProbeReviewReport;
}

const severityClassNames: Record<string, string> = {
  blocker: "bg-red-50 text-dossa-red ring-red-100",
  quarantine: "bg-orange-50 text-orange-700 ring-orange-100",
  review: "bg-amber-50 text-amber-700 ring-amber-100",
  watch: "bg-sky-50 text-sky-700 ring-sky-100"
};

export function AdminLiveProbeReviewPanel({ apiHref, csvHref, report }: AdminLiveProbeReviewPanelProps) {
  const topQueue = report.reviewQueue.slice(0, 5);

  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm" aria-label="live probe 자동 본문 검증 운영 큐">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black text-sky-700">live probe 자동 본문 검증</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">판매처 접근 보호와 hard failure를 분리합니다</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            `reports/live-probe-review.json` 기준으로 hard failure, 숨김 격리, 접근보호 403/429, backoff retry 대상을 분리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={apiHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 py-3 text-sm font-black text-white"
          >
            <ShieldCheck size={17} aria-hidden="true" />
            live JSON
          </a>
          <a
            href={csvHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black text-sky-700"
          >
            <Download size={17} aria-hidden="true" />
            live CSV
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["확인 대상", report.summary.totalDeals, "전체 링크"],
          ["본문 통과", report.summary.livePassed, "자동 확인"],
          ["hard failure", report.summary.hardFailureCount, "항상 0"],
          ["노출 실패", report.summary.exposedHardFailureCount, "항상 0"],
          ["접근보호/429", report.summary.protectedOrRateLimitedCount, "재확인"],
          ["운영 큐", report.summary.reviewQueueCount, "우선 처리"]
        ].map(([label, value, description]) => (
          <div key={label} className="rounded-2xl bg-sky-50 p-4">
            <p className="text-xs font-black text-sky-700">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
            <p className="mt-1 text-xs font-bold text-sky-900/70">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.78fr_1.22fr]">
        <div className={`rounded-2xl border p-4 ${report.ok ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">live probe 판정</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${report.ok ? "bg-white text-emerald-700" : "bg-white text-dossa-red"}`}>
              {report.ok ? "노출 hard failure 없음" : "출시 차단 필요"}
            </span>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            생성 시각 {report.generatedAt ? getRelativeTime(report.generatedAt) : "리포트 없음"} · live checked {report.summary.liveChecked.toLocaleString("ko-KR")}개
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            검색 링크 {report.summary.exposedSearchLinks}개 · 품절/종료 {report.summary.exposedSoldOutLinks}개 · 깨진 링크 {report.summary.exposedBrokenLinks}개
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            숨김 격리 {report.summary.quarantinedFailureCount ?? 0}개 · 일시 네트워크 {report.summary.transientNetworkCount}개
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <RefreshCcw size={17} className="text-sky-700" aria-hidden="true" />
            <p className="text-sm font-black text-slate-950">처리 기준</p>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            hard failure는 즉시 차단하고, 판매처 접근 보호는 official API, partner feed, manual device check 순서로 재확인합니다. 429와 일시 네트워크 실패는 backoff retry 큐로 남깁니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(report.retryModeCounts).slice(0, 5).map(([mode, count]) => (
              <span key={mode} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                {mode} {count.toLocaleString("ko-KR")}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-black text-slate-950">host별 우선 조치</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700 shadow-sm">
            <Activity size={14} aria-hidden="true" />
            {report.topHostActions.length.toLocaleString("ko-KR")}개 host
          </span>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {report.topHostActions.slice(0, 6).map((item) => (
            <div key={item.host} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">{item.host}</p>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-700">{item.count}개</span>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{item.recommendedAction}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-950">오늘 볼 live probe 큐</p>
        <div className="mt-3 space-y-2">
          {topQueue.length ? (
            topQueue.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {item.mallName} · {item.host} · {item.status ?? "n/a"} · {item.reason}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{item.retryMode}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${severityClassNames[item.severity] ?? severityClassNames.watch}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{item.recommendedAction}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">live probe 재검증 항목이 없습니다.</div>
          )}
        </div>
      </div>
    </section>
  );
}

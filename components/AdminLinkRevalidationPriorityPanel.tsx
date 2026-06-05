import { Activity, Download, RefreshCcw, ShieldCheck } from "lucide-react";
import { getRelativeTime } from "@/lib/format";
import type { LinkRevalidationPriorityReport } from "@/lib/operations/linkRevalidationPriority";

interface AdminLinkRevalidationPriorityPanelProps {
  apiHref: string;
  csvHref: string;
  report: LinkRevalidationPriorityReport;
}

const severityClassNames: Record<string, string> = {
  block: "bg-red-50 text-dossa-red ring-red-100",
  quarantine: "bg-orange-50 text-orange-700 ring-orange-100",
  review: "bg-amber-50 text-amber-700 ring-amber-100",
  watch: "bg-sky-50 text-sky-700 ring-sky-100",
  routine: "bg-emerald-50 text-emerald-700 ring-emerald-100"
};

export function AdminLinkRevalidationPriorityPanel({ apiHref, csvHref, report }: AdminLinkRevalidationPriorityPanelProps) {
  const topQueue = report.topQueue.slice(0, 5);

  return (
    <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm" aria-label="링크 재검증 우선순위">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black text-amber-700">링크 재검증 우선순위</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">출시 후에도 직접 구매 링크 상태를 계속 추적합니다</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            `reports/link-revalidation-priority.json` 기준으로 접근보호 403/429, 일시 네트워크 실패, 최종 URL 변화 가능성을 운영 큐로 분리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={apiHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white"
          >
            <ShieldCheck size={17} aria-hidden="true" />
            재검증 JSON
          </a>
          <a
            href={csvHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-amber-700"
          >
            <Download size={17} aria-hidden="true" />
            재검증 CSV
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["노출 가능", report.summary.publishableItems, "고객 공개 후보"],
          ["차단 재검증", report.summary.blockingRevalidationItems, "항상 0"],
          ["신고 우선", report.summary.userReportedItems ?? 0, "미처리 신고"],
          ["검토", report.summary.reviewItems, "403/429 등"],
          ["관찰", report.summary.watchItems, "일시 실패"],
          ["운영 큐", report.summary.queueItems, "우선 처리"]
        ].map(([label, value, description]) => (
          <div key={label} className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs font-black text-amber-700">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
            <p className="mt-1 text-xs font-bold text-amber-900/70">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.78fr_1.22fr]">
        <div className={`rounded-2xl border p-4 ${report.ok ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">재검증 운영 판정</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${report.ok ? "bg-white text-emerald-700" : "bg-white text-dossa-red"}`}>
              {report.ok ? "차단 항목 없음" : "차단 항목 있음"}
            </span>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            생성 시각 {report.generatedAt ? getRelativeTime(report.generatedAt) : "리포트 없음"} · 감사 {report.summary.auditedItems.toLocaleString("ko-KR")}개
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            검색 링크 노출 {report.summary.exposedSearchLinks}개 · 품절/종료 노출 {report.summary.exposedSoldOutLinks}개 · 깨진 링크 노출 {report.summary.exposedBrokenLinks}개
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            접근보호 {report.liveProbeReviewSummary.accessProtectedCount ?? 0}개 · 일시 네트워크 {report.liveProbeReviewSummary.transientNetworkCount ?? 0}개
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <RefreshCcw size={17} className="text-amber-700" aria-hidden="true" />
            <p className="text-sm font-black text-slate-950">운영 규칙</p>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            검색·대표몰·커뮤니티·품절·깨진 링크는 즉시 차단하고, 접근보호 403/429는 공식 API, 제휴 피드, 실기기 확인 우선순위로 남깁니다. 상품 수보다 링크 신뢰도를 먼저 봅니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(report.counts.byReason).slice(0, 5).map(([reason, count]) => (
              <span key={reason} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                {reason} {count.toLocaleString("ko-KR")}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-black text-slate-950">오늘 처리할 링크 재검증 큐</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm">
            <Activity size={14} aria-hidden="true" />
            {report.summary.queueItems.toLocaleString("ko-KR")}개
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {topQueue.length ? (
            topQueue.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="line-clamp-1 text-sm font-black text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {item.mallName} · {item.host} · {item.liveStatus ?? "n/a"} · {item.liveReason}
                    </p>
                    {item.userReportCount ? (
                      <p className="mt-1 text-xs font-black text-dossa-red">
                        사용자 신고 {item.userReportCount}건 · {item.userReportReason}
                      </p>
                    ) : null}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${severityClassNames[item.severity] ?? severityClassNames.routine}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{item.action}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">우선 재검증 항목이 없습니다.</div>
          )}
        </div>
      </div>
    </section>
  );
}

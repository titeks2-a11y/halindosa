import { getRelativeTime } from "@/lib/format";
import type { CronRefreshOperationsReport } from "@/lib/operations/cronRefresh";

interface AdminCronRefreshPanelProps {
  dryRunHref: string;
  liveFeedDryRunHref: string;
  report: CronRefreshOperationsReport;
}

export function AdminCronRefreshPanel({ dryRunHref, liveFeedDryRunHref, report }: AdminCronRefreshPanelProps) {
  return (
    <section className="rounded-3xl border border-brand-line bg-white p-5 shadow-lift" aria-label="자동 refresh cron 운영 상태">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black text-brand-red">자동 refresh cron 운영</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">매일 검증 데이터 갱신 상태를 확인합니다</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Vercel Cron이 `/api/cron/refresh`를 호출하고, 결과는 `reports/cron-refresh.json`에 남습니다. 명시 호출 시 `mode=liveFeed`로 공식 feed 라이브 파이프라인까지 점검합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${report.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brand-red"}`}>
            {report.label}
          </span>
          <span className="rounded-full bg-brand-warm px-3 py-1 text-xs font-black text-slate-700">
            {report.schedule}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${report.secretConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            CRON_SECRET {report.secretConfigured ? "설정됨" : "배포 전 설정"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {[
          ["상품 특가", report.productDealsCount],
          ["공식 혜택", report.newsDealsCount],
          ["live feed 혜택", report.livePipelineOfficialBenefitsCount],
          ["숨김 처리", report.hiddenCount],
          ["실패", report.failedCount]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-brand-warm p-4">
            <p className="text-xs font-black text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">마지막 cron 실행</p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            {report.generatedAt ? `${getRelativeTime(report.generatedAt)} · ${report.ageHours ?? 0}시간 경과` : "아직 직접 실행 리포트 없음"}
          </p>
          <p className="mt-2 text-xs font-black text-brand-red">
            상태 {report.status} · refresh:all {report.refreshAllOk ? "정상" : "점검"} · 마지막 모드 {report.lastPipelineMode}
          </p>
          <p className="mt-1 text-xs font-black text-slate-500">
            live feed {report.livePipelineStatus} · URL {report.livePipelineConfiguredUrlCount}개 · {report.livePipelineOk ? "리포트 정상" : "점검 필요"}
          </p>
          <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">{report.message}</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-black text-slate-950">다음 운영 액션</p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{report.nextAction}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={dryRunHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-brand-red px-4 py-2 text-xs font-black text-white"
            >
              dry-run 확인
            </a>
            <a
              href={liveFeedDryRunHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white"
            >
              liveFeed dry-run
            </a>
            <code className="rounded-2xl bg-white px-3 py-2 text-[11px] font-black text-slate-700">{report.command}</code>
            <code className="rounded-2xl bg-white px-3 py-2 text-[11px] font-black text-slate-700">{report.liveCommand}</code>
          </div>
          <p className="mt-3 text-[11px] font-bold leading-5 text-red-900/70">
            {report.guardrails[0]} · {report.guardrails[1]}
          </p>
        </div>
      </div>
    </section>
  );
}

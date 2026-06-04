import { Activity, ExternalLink, ShieldCheck } from "lucide-react";
import type { HealthReadinessReport } from "@/lib/operations/healthReadiness";

interface AdminHealthReadinessPanelProps {
  report: HealthReadinessReport;
  apiHref: string;
}

function formatFreshness(hours: number) {
  if (!Number.isFinite(hours)) return "확인 필요";
  if (hours < 1) return "방금 갱신";
  return `${hours}시간 전`;
}

function getProviderRiskClassName(severity?: string) {
  if (severity === "healthy") return "bg-emerald-50 text-emerald-700";
  if (severity === "watch") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-dossa-red";
}

function formatDate(value: string) {
  if (!value) return "생성 전";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "생성 전";

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function AdminHealthReadinessPanel({ report, apiHref }: AdminHealthReadinessPanelProps) {
  const failedChecks = report.checks.filter((check) => !check.ok);
  const categoryCounts = Object.entries(report.officialBenefits.categoryCounts).sort((a, b) => b[1] - a[1]);
  const officialProviderStats = report.officialBenefits.providerStats;
  const officialProviderRisks = report.officialBenefits.providerRisks;
  const sourceReadinessIssueCount =
    report.sourceReadiness.blockedLiveIssues + report.sourceReadiness.feedEnvFailedCount + report.sourceReadiness.failedGateCount;
  const healthCards = [
    {
      label: "운영 준비 점수",
      value: `${report.score}/100`,
      detail: report.ok ? "출시 운영 기준 충족" : "보강 필요"
    },
    {
      label: "상품 링크",
      value: `${report.product.verifiedProductLinks}/${report.product.productDealsCount}`,
      detail: `검색 링크 ${report.product.searchLinks}개 · 품절 노출 ${report.product.soldOutProducts}개`
    },
    {
      label: "공식 혜택",
      value: `${report.officialBenefits.visibleCount}개`,
      detail: `카테고리 ${report.officialBenefits.readyCategories}/${report.officialBenefits.requiredCategories}`
    },
    {
      label: "공식 feed",
      value: `${report.officialBenefits.sourceMix.feedItemCount}건`,
      detail: `seed ${report.officialBenefits.sourceMix.seedCount} · 성공 ${report.officialBenefits.sourceMix.feedSuccessCount}/${report.officialBenefits.sourceMix.configuredFeedUrls}`
    },
    {
      label: "공식 소스",
      value: report.sourceReadiness.ok ? "정상" : "점검",
      detail: `후보 ${report.sourceReadiness.officialSourceCandidates}개 · 차단 ${sourceReadinessIssueCount}개`
    },
    {
      label: "refresh:all",
      value: report.refreshAll.ok ? "정상" : "점검",
      detail: `갱신 ${formatDate(report.refreshAll.generatedAt)}`
    },
    {
      label: "cron refresh",
      value: report.cronRefresh.ok ? "정상" : "점검",
      detail: `${report.cronRefresh.schedule} · ${report.cronRefresh.reportExists ? formatDate(report.cronRefresh.generatedAt) : "수동 리포트 기준"}`
    }
  ];

  return (
    <section className="rounded-3xl border border-brand-line bg-white p-5 shadow-lift" aria-label="운영 헬스 리포트">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black text-brand-red">운영 헬스 리포트</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">검증 상품·공식 혜택 출시 게이트</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            상품 링크, 공식 혜택 카테고리, refresh 파이프라인, 리포트 신선도를 한 번에 확인합니다.
          </p>
        </div>
        <a
          href={apiHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          API 보기
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {healthCards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-brand-warm p-4">
            <p className="text-xs font-black text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{card.value}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className={`rounded-2xl border p-4 ${report.ok ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}>
          <div className="flex items-center gap-2">
            {report.ok ? <ShieldCheck size={18} className="text-emerald-700" /> : <Activity size={18} className="text-dossa-red" />}
            <p className={`text-sm font-black ${report.ok ? "text-emerald-800" : "text-dossa-red"}`}>
              {report.ok ? "운영 기준 통과" : "운영 기준 보강 필요"}
            </p>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            마지막 생성: {formatDate(report.generatedAt)} · 공식 혜택 신선도 {formatFreshness(report.officialBenefits.freshnessHours)}
          </p>
          <div className="mt-3 space-y-2">
            {(failedChecks.length ? failedChecks : report.checks.slice(0, 4)).map((check) => (
              <div key={check.name} className="rounded-2xl bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-black text-slate-800">{check.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${check.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-dossa-red"}`}>
                    {check.ok ? "PASS" : "FAIL"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-slate-950">공식 혜택 카테고리 커버리지</p>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600">
              기준 {report.officialBenefits.minimumCategoryDealCount}건 이상
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {categoryCounts.map(([category, count]) => {
              const isReady = count >= report.officialBenefits.minimumCategoryDealCount;

              return (
                <div key={category} className="rounded-2xl bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-800">{category}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {isReady ? "ready" : "thin"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-black text-slate-950">{count}개</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500">
            누락 {report.officialBenefits.missingCategories.length}개 · 보강 {report.officialBenefits.thinCategories.length}개 · 숨김/종료/비공식 {report.officialBenefits.hiddenCount + report.officialBenefits.expiredCount + report.officialBenefits.officialMissingCount}개
          </p>
          <div className="mt-4 rounded-2xl bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-slate-950">공식 혜택 Provider 상태</p>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">
                active {report.officialBenefits.activeProviders.length} · feed {report.officialBenefits.configuredProviders.length}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
              source mix: seed {report.officialBenefits.sourceMix.seedCount} · 외부 feed {report.officialBenefits.sourceMix.feedItemCount} · 전체 수집 {report.officialBenefits.sourceMix.collectedCount} · 외부 비율 {report.officialBenefits.sourceMix.feedItemRate}%
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(officialProviderStats.length ? officialProviderStats : [{ provider: "없음", source: "-", configured: false, feedUrls: 0, seedCount: 0, feedItemCount: 0, feedSuccessCount: 0, collectedCount: 0, feedItemRate: 0, fetchedCount: 0, normalizedCount: 0, visibleCount: 0, hiddenCount: 0, failedCount: 0, expiredCount: 0, officialMissingCount: 0, errorCount: 0 }]).map((provider) => (
                <div key={provider.provider} className="min-w-[190px] rounded-2xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-800">{provider.provider}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${provider.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {provider.configured ? "feed" : "seed"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{provider.source}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    seed {provider.seedCount} · feed {provider.feedItemCount} · 성공 {provider.feedSuccessCount}/{provider.feedUrls}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    수집 {provider.collectedCount || provider.fetchedCount} · 노출 {provider.visibleCount} · 실패 {provider.failedCount}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-slate-950">공식 혜택 Provider 위험도</p>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">
                정상 {report.officialBenefits.providerRiskSummary.healthy} · 관찰 {report.officialBenefits.providerRiskSummary.watch} · 점검 {report.officialBenefits.providerRiskSummary.danger}
              </span>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {(officialProviderRisks.length ? officialProviderRisks : [{ provider: "없음", source: "-", severity: "danger" as const, label: "리포트 없음", reason: "provider risk 리포트가 없습니다.", visibleCount: 0, issueCount: 0, failureRate: 0 }]).map((risk) => (
                <div key={`${risk.provider}-${risk.label}`} className="rounded-2xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-800">{risk.provider}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${getProviderRiskClassName(risk.severity)}`}>
                      {risk.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                    노출 {risk.visibleCount} · 이슈 {risk.issueCount} · 실패율 {risk.failureRate}% · {risk.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-slate-950">공식 소스 통합 준비도</p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${report.sourceReadiness.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-dossa-red"}`}>
                {report.sourceReadiness.launchGateStatus}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
              {report.sourceReadiness.readinessLabel} · 공식 후보 {report.sourceReadiness.officialSourceCandidates}개 · 접근 가능 {report.sourceReadiness.reachableSources}개 · 보호 {report.sourceReadiness.guardedSources}개
            </p>
            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
              공식 feed URL {report.sourceReadiness.configuredFeedUrls}개 · feed env 실패 {report.sourceReadiness.feedEnvFailedCount}개 · 차단 이슈 {sourceReadinessIssueCount}개
            </p>
            <div className="mt-2 space-y-1.5">
              {(report.sourceReadiness.operatorNextActions.length ? report.sourceReadiness.operatorNextActions.slice(0, 3) : ["npm run source:readiness:report 실행 후 health:readiness를 다시 실행하세요."]).map((action) => (
                <p key={action} className="rounded-2xl bg-slate-50 px-3 py-2 text-[11px] font-bold leading-5 text-slate-600">
                  {action}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

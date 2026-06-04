import { Download } from "lucide-react";
import { AdminNewsOperationsPanel } from "@/components/AdminNewsOperationsPanel";
import { NewsFeedDryRunPanel } from "@/components/NewsFeedDryRunPanel";
import { adminSampleNewsFeedText } from "@/lib/adminDashboardDerivedData";
import { getRelativeTime } from "@/lib/format";
import type { getNewsOperationsReport } from "@/lib/deals/newsOperations";
import type { NewsFeedPreviewReport } from "@/lib/operations/newsFeedPreview";
import type { NewsDeal } from "@/types/newsDeal";

type NewsOperationsReport = ReturnType<typeof getNewsOperationsReport>;

interface AdminNewsCollectionPanelProps {
  token?: string;
  newsOperations: NewsOperationsReport;
  newsFeedPreview: NewsFeedPreviewReport;
  newsDeals: NewsDeal[];
  newsCategoryCounts: Array<[string, number]>;
  newsOperationsApiHref: string;
  newsOperationsCsvHref: string;
  newsFeedPreviewApiHref: string;
  newsFeedPreviewCsvHref: string;
  newsFeedCanaryApiHref: string;
  newsFeedCanaryCsvHref: string;
  newsFeedLiveApiHref: string;
  newsFeedLiveCsvHref: string;
}

function formatAdminDateTime(isoDate?: string) {
  if (!isoDate) return "미정";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "미정";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function AdminNewsCollectionPanel({
  token,
  newsOperations,
  newsFeedPreview,
  newsDeals,
  newsCategoryCounts,
  newsOperationsApiHref,
  newsOperationsCsvHref,
  newsFeedPreviewApiHref,
  newsFeedPreviewCsvHref,
  newsFeedCanaryApiHref,
  newsFeedCanaryCsvHref,
  newsFeedLiveApiHref,
  newsFeedLiveCsvHref
}: AdminNewsCollectionPanelProps) {
  return (
    <section className="rounded-3xl border border-brand-line bg-white p-5 shadow-lift" aria-label="뉴스 수집 현황">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-brand-red">뉴스 수집 현황</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">공식 이벤트·무료 혜택 feed 후보</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            뉴스 기사는 출처로만 쓰고, 사용자 이동은 공식 이벤트·구매·혜택 페이지로 검증된 항목만 노출합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={newsOperationsApiHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-brand-red px-4 py-3 text-center text-sm font-black text-white"
          >
            운영 리포트 API 보기
          </a>
          <a
            href={newsOperationsCsvHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-line bg-white px-4 py-3 text-center text-sm font-black text-slate-800"
          >
            <Download size={16} aria-hidden="true" />
            Provider 위험도 CSV
          </a>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ["노출 뉴스혜택", newsOperations.visibleCount],
          ["카테고리", newsCategoryCounts.length],
          ["공식 링크", newsDeals.filter((deal) => deal.validationStatus === "passed").length],
          ["숨김", newsOperations.hiddenCount],
          ["종료", newsOperations.expiredCount],
          ["실패", newsOperations.failedCount]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-brand-warm p-4">
            <p className="text-xs font-black text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-red-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">공식 feed preview</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              운영 feed를 실제 노출 전에 dry-run으로 확인합니다. 뉴스 기사 링크는 출처로만 남기고, 뉴스 본문 공식 링크 승격으로 공식 이벤트·혜택 링크만 사용자 이동 URL에 반영합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={newsFeedPreviewApiHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
            >
              Preview JSON
            </a>
            <a
              href={newsFeedPreviewCsvHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-emerald-700 shadow-sm"
            >
              <Download size={14} aria-hidden="true" />
              Preview CSV
            </a>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["상태", newsFeedPreview.ok ? "통과" : "점검"],
            ["노출 가능", `${newsFeedPreview.visibleCount}개`],
            ["숨김 후보", `${newsFeedPreview.hiddenCount}개`],
            ["공식 링크 승격", `${newsFeedPreview.officialLinkPromotedCount}개`],
            ["검색/비공식", `${newsFeedPreview.summary.exposedSearchLinkCount + newsFeedPreview.summary.exposedNonOfficialLinkCount}개`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-[11px] font-black text-slate-500">{label}</p>
              <p className={`mt-1 text-lg font-black ${label === "상태" && value !== "통과" ? "text-dossa-red" : "text-slate-950"}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-4">
          {newsFeedPreview.providerResults.map((provider) => (
            <div key={provider.provider} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-black text-slate-950">{provider.label}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${provider.errorCount === 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-dossa-red"}`}>
                  {provider.errorCount === 0 ? "정상" : "오류"}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
                후보 {provider.fetchedCount} · 노출 {provider.visibleCount} · 숨김 {provider.hiddenCount} · 승격 {provider.officialLinkPromotedCount}
              </p>
              <p className="mt-2 line-clamp-1 text-[11px] font-black text-emerald-700">{provider.sourceMode}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {newsFeedPreview.nextActions.slice(0, 3).map((action) => (
            <p key={action} className="rounded-2xl bg-white px-3 py-2 text-[11px] font-bold leading-5 text-slate-500 shadow-sm">
              {action}
            </p>
          ))}
        </div>
        <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500">
          마지막 preview {newsFeedPreview.generatedAt ? getRelativeTime(newsFeedPreview.generatedAt) : "생성 필요"} · 명령어: npm run news:preview
        </p>
      </div>
      <div className="mt-4">
        <NewsFeedDryRunPanel token={token} initialText={adminSampleNewsFeedText} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">신선도 운영</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${newsOperations.freshness.severity === "good" ? "bg-emerald-50 text-emerald-700" : newsOperations.freshness.severity === "caution" ? "bg-amber-50 text-amber-700" : "bg-white text-dossa-red"}`}>
              {newsOperations.freshness.label}
            </span>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            마지막 생성 {newsOperations.freshness.generatedAt ? getRelativeTime(newsOperations.freshness.generatedAt) : "없음"} · 갱신 주기 {newsOperations.freshness.cadenceHours}시간 · stale 기준 {newsOperations.freshness.staleHours}시간
          </p>
          <p className="mt-2 text-xs font-black text-dossa-red">
            다음 refresh 권장: {formatAdminDateTime(newsOperations.freshness.nextRefreshDueAt)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">공식 혜택 다음 운영 액션</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {newsOperations.operatorNextActions.slice(0, 3).map((action) => (
              <div key={`${action.priority}-${action.title}`} className="min-w-[220px] rounded-2xl bg-white px-3 py-2 shadow-sm">
                <p className="text-xs font-black text-slate-950">{action.title}</p>
                <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-5 text-slate-500">{action.description}</p>
                {action.command ? <code className="mt-2 block rounded-xl bg-brand-warm px-2 py-1 text-[10px] font-black text-dossa-red">{action.command}</code> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">공식 피드 전환 준비도</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              공식 API/RSS/제휴 feed로 바꿀 때 볼 운영 기준입니다. 현재도 승인 seed로 노출하지만, 상용 운영은 provider별 공식 feed 연결을 우선합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-dossa-red shadow-sm">
              {newsOperations.feedTransitionReadiness.label}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
              연결 {newsOperations.feedTransitionReadiness.configuredProviders}/{newsOperations.feedTransitionReadiness.totalProviders}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
              feed URL {newsOperations.feedTransitionReadiness.configuredFeedUrls}개
            </span>
            <span className={`rounded-full bg-white px-3 py-1 text-xs font-black shadow-sm ${newsOperations.feedCanary.ok ? "text-emerald-700" : "text-amber-700"}`}>
              canary {newsOperations.feedCanary.status} · {newsOperations.feedCanary.freshnessStatus}
            </span>
            <a
              href={newsFeedCanaryApiHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white shadow-sm"
            >
              canary JSON
            </a>
            <a
              href={newsFeedCanaryCsvHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-3 py-1 text-xs font-black text-dossa-red shadow-sm"
            >
              canary CSV
            </a>
            <a
              href={newsFeedLiveApiHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white shadow-sm"
            >
              live JSON
            </a>
            <a
              href={newsFeedLiveCsvHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-3 py-1 text-xs font-black text-dossa-red shadow-sm"
            >
              live CSV
            </a>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
              외부 feed {newsOperations.feedTransitionReadiness.feedItemCount}건
            </span>
            <span className={`rounded-full bg-white px-3 py-1 text-xs font-black shadow-sm ${newsOperations.feedTransitionReadiness.configuredEmptyFeedCount ? "text-amber-700" : "text-slate-700"}`}>
              feed 공백 {newsOperations.feedTransitionReadiness.configuredEmptyFeedCount}개
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
              seed {newsOperations.feedTransitionReadiness.seedCount}건
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
              준비율 {newsOperations.feedTransitionReadiness.readinessRate}%
            </span>
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {newsOperations.feedTransitionReadiness.providers.map((provider) => (
            <div key={provider.provider} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-black text-slate-950">{provider.label}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${provider.configuredEmptyFeed ? "bg-amber-50 text-amber-700" : provider.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {provider.configuredEmptyFeed ? "feed 공백" : provider.modeLabel}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
                노출 {provider.visibleCount} · 이슈 {provider.issueCount} · URL {provider.feedUrls}
              </p>
              <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                seed {provider.seedCount} · 외부 feed {provider.feedItemCount} · 성공 {provider.feedSuccessCount}/{provider.feedUrls} · 외부 비율 {provider.feedItemRate}%
              </p>
              <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-5 text-slate-500">{provider.acceptedSources}</p>
              <p className="mt-2 line-clamp-2 text-[11px] font-black leading-5 text-dossa-red">{provider.nextAction}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {provider.envKeys.map((key) => (
                  <code key={key} className="rounded-full bg-brand-warm px-2 py-0.5 text-[10px] font-black text-slate-700">
                    {key}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
          {newsOperations.feedTransitionReadiness.operatorAction} · canary 후보 {newsOperations.feedCanary.visibleCandidateCount}개 · canary age {newsOperations.feedCanary.ageHours ?? "확인 불가"}h · {newsOperations.feedTransitionReadiness.guardrails[0]}
        </p>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">카테고리별 공식 혜택</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {newsCategoryCounts.map(([categoryName, count]) => (
              <span key={categoryName} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">
                {categoryName} {count}개
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
            `refresh:news`와 `verify:news`가 검색, 커뮤니티, 뉴스 기사 단독 링크를 숨김 처리합니다.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {newsDeals.slice(0, 4).map((deal) => (
            <a
              key={deal.id}
              href={deal.finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-100 hover:bg-red-50"
            >
              <p className="line-clamp-2 text-sm font-black text-slate-950">{deal.title}</p>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{deal.summary}</p>
              <p className="mt-3 text-[11px] font-black text-brand-red">{deal.sourceName} · 공식 링크 확인</p>
            </a>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">Provider별 성공/실패</p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
              refresh:all {newsOperations.refreshAll.ok ? "정상" : "점검"}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {newsOperations.providerStats.map((provider) => (
              <div key={provider.provider} className="rounded-2xl bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-slate-800">{provider.provider}</p>
                  <p className="text-[11px] font-black text-slate-500">{provider.configured ? "feed 연결" : "seed/fallback"}</p>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  seed {provider.seedCount ?? 0} · 실시간 feed {provider.feedItemCount ?? 0} · 성공 feed {provider.feedSuccessCount ?? 0}/{provider.feedUrls ?? 0}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  수집 {provider.collectedCount ?? provider.fetchedCount ?? 0} · 정규화 {provider.normalizedCount ?? 0} · 노출 {provider.visibleCount ?? 0} · 숨김 {provider.hiddenCount ?? 0} · 오류 {provider.errorCount ?? 0}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-sm font-black text-slate-950">검증 실패 TOP10</p>
          <div className="mt-3 space-y-2">
            {newsOperations.failureReasonTop10.length ? (
              newsOperations.failureReasonTop10.map((item) => (
                <div key={item.reason} className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50 px-3 py-2">
                  <p className="truncate text-xs font-black text-amber-800">{item.reason}</p>
                  <p className="text-xs font-black text-amber-700">{item.count}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700">현재 실패 사유 없음</p>
            )}
          </div>
          <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500">
            공식 링크 없음 {newsOperations.officialMissingCount}건 · 기간 종료 {newsOperations.expiredCount}건 · 수동 숨김 {newsOperations.overrides.hiddenCount}건
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-sm font-black text-slate-950">최근 20개 수집 로그</p>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {newsOperations.recentLogs.slice(0, 20).map((log) => (
              <div key={`${log.dealId}-${log.checkedAt}`} className="rounded-2xl bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-black text-slate-800">{log.title}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${log.status === "visible" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-dossa-red"}`}>
                    {log.status === "visible" ? "노출" : "숨김"}
                  </span>
                </div>
                <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{log.provider} · {log.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">숨김/종료/공식 링크 없음 큐</p>
          <div className="mt-3 space-y-2">
            {newsOperations.hiddenDeals.length ? (
              newsOperations.hiddenDeals.slice(0, 8).map((deal) => (
                <div key={String(deal.id)} className="rounded-2xl bg-white px-3 py-2">
                  <p className="line-clamp-1 text-xs font-black text-slate-800">{deal.title}</p>
                  <p className="mt-1 truncate text-[11px] font-bold text-dossa-red">{deal.hiddenReason}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-white px-3 py-3 text-xs font-black text-emerald-700">숨김 처리된 공식 혜택 없음</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">수동 숨김/복구/재검증 구조</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {newsOperations.manualActions.map((action) => (
              <div key={action.action} className="rounded-2xl bg-white p-3">
                <p className="text-xs font-black text-slate-950">{action.label}</p>
                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">{action.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500">
            API: POST {newsOperationsApiHref} · action=hide/restore/revalidate, id, reason. 로컬에서는 override 파일, 운영에서는 Supabase admin_actions로 확장합니다.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <AdminNewsOperationsPanel apiHref={newsOperationsApiHref} initialReport={newsOperations} />
      </div>
    </section>
  );
}

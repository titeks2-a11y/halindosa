"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, Eye, EyeOff, ListChecks, RefreshCw, RotateCcw } from "lucide-react";
import { getRelativeTime } from "@/lib/format";

type NewsOperationAction = "hide" | "restore" | "revalidate";

interface NewsOperationDeal {
  id?: string;
  title?: string;
  merchant?: string;
  category?: string;
  benefitType?: string;
  sourceName?: string;
  finalUrl?: string;
  validationStatus?: string;
  hiddenReason?: string;
  lastCheckedAt?: string;
}

interface NewsOperationAuditLog {
  action: string;
  id: string;
  reason: string;
  createdAt: string;
}

interface FreshnessQueueItem {
  id: string;
  title: string;
  merchant?: string;
  category?: string;
  sourceName?: string;
  endDate?: string;
  daysLeft?: number;
  action?: string;
  replacementCandidates?: Array<{
    id: string;
    label: string;
    provider: string;
    officialUrl: string;
    liveStatus: string;
    score: number;
    nextAction: string;
    recommendedEnvKeys: string[];
  }>;
}

interface FailureReasonTopItem {
  reason: string;
  count: number;
}

interface SourceTrustScore {
  sourceName: string;
  provider: string;
  officialHost: string;
  totalCount: number;
  visibleCount: number;
  hiddenCount: number;
  failedCount: number;
  searchLinkCount: number;
  expiredCount: number;
  averagePriorityScore: number;
  trustScore: number;
  status: "trusted" | "watch" | "needs_review";
  lastCheckedAt: string;
  categories: string[];
  benefitTypes: string[];
  recommendedAction: string;
}

interface RecentCollectionLog {
  dealId: string;
  provider: string;
  title: string;
  status: string;
  reason: string;
  finalUrl: string;
  linkType?: string;
  availability?: string;
  priorityScore?: number;
  checkedAt: string;
}

interface NewsOperationsReport {
  ok: boolean;
  visibleCount: number;
  hiddenCount: number;
  failedCount: number;
  freshness?: {
    status: "fresh" | "due" | "stale" | "missing";
    severity: "good" | "caution" | "danger";
    label: string;
    cadenceHours: number;
    staleHours: number;
    ageHours: number | null;
    generatedAt: string;
    nextRefreshDueAt: string;
    staleAfterAt: string;
    command: string;
    releaseBlocking: boolean;
  };
  freshnessQueues?: {
    reportGeneratedAt: string;
    expiringWithin14DaysCount: number;
    expiringWithin30DaysCount: number;
    renewalQueue: FreshnessQueueItem[];
    watchQueue: FreshnessQueueItem[];
    nextActions: string[];
  };
  operatorNextActions?: Array<{
    priority: "high" | "medium" | "low" | string;
    title: string;
    description: string;
    command?: string;
    dueAt?: string;
  }>;
  providerRisks?: Array<{
    provider: string;
    source: string;
    severity: "healthy" | "watch" | "danger";
    label: string;
    reason: string;
    action: string;
    visibleCount: number;
    issueCount: number;
    failureRate: number;
  }>;
  providerRiskSummary?: {
    healthy: number;
    watch: number;
    danger: number;
  };
  sourceTrustScores?: SourceTrustScore[];
  feedTransitionReadiness?: {
    status: "production_feed_ready" | "hybrid_feed_ready" | "seed_launch_ready";
    label: string;
    readinessRate: number;
    totalProviders: number;
    configuredProviders: number;
    seedOnlyProviders: number;
    configuredFeedUrls: number;
    launchBlockingCount: number;
    recommendedNextEnvKeys: string[];
    guardrails: string[];
    operatorAction: string;
    providers: Array<{
      provider: string;
      label: string;
      mode: "external_feed" | "seed_fallback";
      modeLabel: string;
      configured: boolean;
      feedUrls: number;
      envKeys: string[];
      acceptedSources: string;
      nextAction: string;
      priority: "high" | "medium" | "low";
      launchBlocking: boolean;
      visibleCount: number;
      issueCount: number;
    }>;
  };
  sourceConfig?: {
    configFile?: string;
    configuredSources?: number;
    enabledProviders?: string[];
    envKeys?: string[];
    categories?: string[];
    benefitTypes?: string[];
    recommendedQueries?: string[];
    targetSections?: string[];
    operatorOwners?: string[];
    minimumRefreshCadenceMinutes?: number;
    nextRefreshAt?: string;
    sourceRefreshWindows?: Array<{
      id?: string;
      provider?: string;
      source?: string;
      operatorOwner?: string;
      launchPriority?: string;
      refreshCadenceMinutes?: number;
      nextRefreshAt?: string;
      targetSections?: string[];
      envKeys?: string[];
      status?: string;
      operatorAction?: string;
    }>;
    highPrioritySources?: number;
    sourceOperations?: Array<{
      id?: string;
      provider?: string;
      source?: string;
      operatorOwner?: string;
      launchPriority?: string;
      refreshCadenceMinutes?: number;
      nextRefreshAt?: string;
      targetSections?: string[];
      qualityChecklist?: string[];
      envKeys?: string[];
    }>;
    guardrails?: string[];
  };
  categoryCoverage?: Array<{
    category: string;
    action: string;
    count: number;
    minimumCount?: number;
    status: string;
    sampleTitle?: string;
  }>;
  operationalRisks?: string[];
  visibleDeals: NewsOperationDeal[];
  hiddenDeals: NewsOperationDeal[];
  failureReasonTop10?: FailureReasonTopItem[];
  recentLogs?: RecentCollectionLog[];
  refreshAll?: {
    ok: boolean;
    generatedAt: string;
    productDealsCount: number;
    newsDealsCount: number;
    hiddenCount: number;
    expiredCount: number;
    failedCount: number;
    steps: Array<{
      name: string;
      ok: boolean;
      status: number;
      startedAt: string;
      finishedAt: string;
      durationMs?: number;
    }>;
  };
  overrides: {
    hiddenCount: number;
    recentAudit: NewsOperationAuditLog[];
  };
}

interface AdminNewsOperationsPanelProps {
  apiHref: string;
  initialReport: NewsOperationsReport;
}

const actionLabels: Record<NewsOperationAction, string> = {
  hide: "숨김",
  restore: "복구",
  revalidate: "재검증"
};

function getDealId(deal: NewsOperationDeal) {
  return String(deal.id ?? "");
}

function getStatusCopy(action: NewsOperationAction, id: string) {
  if (action === "hide") return `${id} 혜택을 수동 숨김 처리했습니다.`;
  if (action === "restore") return `${id} 혜택을 복구 후보로 되돌렸습니다.`;
  return `${id} 혜택의 링크 재검증 요청을 기록했습니다.`;
}

function formatDuration(durationMs = 0) {
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}초`;
}

function formatDateTime(isoDate?: string) {
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

function getFreshnessClassName(severity?: string) {
  if (severity === "good") return "bg-emerald-50 text-emerald-700";
  if (severity === "caution") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-brand-red";
}

function getProviderRiskClassName(severity?: string) {
  if (severity === "healthy") return "bg-emerald-50 text-emerald-700";
  if (severity === "watch") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-brand-red";
}

function getSourceTrustClassName(status?: string) {
  if (status === "trusted") return "bg-emerald-50 text-emerald-700";
  if (status === "watch") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-brand-red";
}

function getSourceTrustLabel(status?: string) {
  if (status === "trusted") return "신뢰";
  if (status === "watch") return "관찰";
  return "점검";
}

function getFailureReasonAction(reason: string) {
  if (reason === "none") return "현재 조치 없음";
  if (/search|result|query|keyword/i.test(reason)) return "검색/결과 링크는 사용자 노출 전 숨김 처리하고 공식 상세 URL로 교체";
  if (/expired|ended|sold|unavailable|마감|종료|품절/i.test(reason)) return "기간·재고 확인 후 종료/품절이면 숨김 유지";
  if (/official|host|domain|url/i.test(reason)) return "공식 도메인과 finalUrl을 검수하고 승인 feed만 연결";
  return "provider 원본 feed와 정규화 결과를 확인한 뒤 재검증 실행";
}

export function AdminNewsOperationsPanel({ apiHref, initialReport }: AdminNewsOperationsPanelProps) {
  const [report, setReport] = useState(initialReport);
  const [reason, setReason] = useState("manual_admin_review");
  const [pendingKey, setPendingKey] = useState("");
  const [message, setMessage] = useState("");
  const visibleDeals = useMemo(() => report.visibleDeals?.slice(0, 8) ?? [], [report.visibleDeals]);
  const hiddenDeals = useMemo(() => report.hiddenDeals?.slice(0, 8) ?? [], [report.hiddenDeals]);
  const categoryCoverage = useMemo(() => report.categoryCoverage ?? [], [report.categoryCoverage]);
  const providerRisks = useMemo(() => report.providerRisks ?? [], [report.providerRisks]);
  const sourceTrustScores = useMemo(() => report.sourceTrustScores?.slice(0, 8) ?? [], [report.sourceTrustScores]);
  const feedTransitionReadiness = report.feedTransitionReadiness;
  const sourceConfig = report.sourceConfig;
  const feedTransitionProviders = useMemo(() => feedTransitionReadiness?.providers ?? [], [feedTransitionReadiness?.providers]);
  const sourceConfigQueries = useMemo(() => sourceConfig?.recommendedQueries?.slice(0, 12) ?? [], [sourceConfig?.recommendedQueries]);
  const sourceConfigGuardrails = useMemo(() => sourceConfig?.guardrails?.slice(0, 4) ?? [], [sourceConfig?.guardrails]);
  const sourceConfigEnvKeys = useMemo(() => sourceConfig?.envKeys?.slice(0, 8) ?? [], [sourceConfig?.envKeys]);
  const sourceConfigTargetSections = useMemo(() => sourceConfig?.targetSections?.slice(0, 8) ?? [], [sourceConfig?.targetSections]);
  const sourceConfigOwners = useMemo(() => sourceConfig?.operatorOwners?.slice(0, 4) ?? [], [sourceConfig?.operatorOwners]);
  const sourceRefreshWindows = useMemo(() => sourceConfig?.sourceRefreshWindows?.slice(0, 6) ?? [], [sourceConfig?.sourceRefreshWindows]);
  const refreshSteps = useMemo(() => report.refreshAll?.steps?.slice(0, 6) ?? [], [report.refreshAll?.steps]);
  const operatorNextActions = useMemo(() => report.operatorNextActions?.slice(0, 3) ?? [], [report.operatorNextActions]);
  const renewalQueue = useMemo(() => report.freshnessQueues?.renewalQueue?.slice(0, 4) ?? [], [report.freshnessQueues?.renewalQueue]);
  const watchQueue = useMemo(() => report.freshnessQueues?.watchQueue?.slice(0, 4) ?? [], [report.freshnessQueues?.watchQueue]);
  const failureReasonTop10 = useMemo(() => report.failureReasonTop10?.slice(0, 10) ?? [], [report.failureReasonTop10]);
  const recentLogs = useMemo(() => report.recentLogs?.slice(0, 20) ?? [], [report.recentLogs]);
  const issueCount = categoryCoverage.filter((item) => item.status === "gap" || item.status === "thin").length;
  const trustedSourceCount = sourceTrustScores.filter((source) => source.status === "trusted").length;
  const sourceTrustIssueCount = sourceTrustScores.filter((source) => source.status !== "trusted").length;
  const freshness = report.freshness;

  const runAction = async (action: NewsOperationAction, deal: NewsOperationDeal) => {
    const id = getDealId(deal);
    if (!id) {
      setMessage("대상 혜택 ID가 없어 액션을 실행할 수 없습니다.");
      return;
    }

    const operationKey = `${action}:${id}`;
    setPendingKey(operationKey);
    setMessage("");

    try {
      const response = await fetch(apiHref, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          action,
          id,
          reason: reason.trim() || "manual_admin_review"
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; report?: NewsOperationsReport };

      if (!response.ok || !payload.ok || !payload.report) {
        throw new Error(payload.message || "운영 액션 처리에 실패했습니다.");
      }

      setReport(payload.report);
      setMessage(payload.message || getStatusCopy(action, id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "운영 액션 처리에 실패했습니다.");
    } finally {
      setPendingKey("");
    }
  };

  return (
    <section className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm" aria-label="공식 혜택 수동 운영 패널">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black text-brand-red">공식 혜택 수동 운영</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">숨김, 복구, 링크 재검증을 화면에서 바로 실행</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            검색 링크, 종료 이벤트, 공식 링크 누락이 발견되면 사용자 노출 전에 즉시 숨기고 audit log를 남깁니다.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-black">
          <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700">
            노출
            <b className="mt-0.5 block text-base">{report.visibleCount}</b>
          </span>
          <span className="rounded-2xl bg-red-50 px-3 py-2 text-brand-red">
            숨김
            <b className="mt-0.5 block text-base">{report.hiddenCount}</b>
          </span>
          <span className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-700">
            실패
            <b className="mt-0.5 block text-base">{report.failedCount}</b>
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">필수 혜택 카테고리 커버리지</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${issueCount ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              {issueCount ? `${issueCount}개 보강` : "전체 충족"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
            {categoryCoverage.map((item) => (
              <div key={item.category} className={`rounded-2xl p-3 ${item.status === "gap" ? "bg-red-50" : item.status === "thin" ? "bg-amber-50" : "bg-white"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-black text-slate-800">{item.category}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.status === "gap" ? "bg-white text-brand-red" : item.status === "thin" ? "bg-white text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {item.count}/{item.minimumCount ?? 2}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-4 text-slate-500">
                  {item.sampleTitle || item.action}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">refresh:all 운영 상태</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${report.refreshAll?.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brand-red"}`}>
              {report.refreshAll?.ok ? "정상" : "확인 필요"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-black">
            <span className="rounded-2xl bg-slate-50 px-2 py-2 text-slate-600">
              상품
              <b className="block text-sm text-slate-950">{report.refreshAll?.productDealsCount ?? 0}</b>
            </span>
            <span className="rounded-2xl bg-slate-50 px-2 py-2 text-slate-600">
              뉴스
              <b className="block text-sm text-slate-950">{report.refreshAll?.newsDealsCount ?? 0}</b>
            </span>
            <span className="rounded-2xl bg-slate-50 px-2 py-2 text-slate-600">
              실패
              <b className="block text-sm text-slate-950">{report.refreshAll?.failedCount ?? 0}</b>
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {refreshSteps.map((step) => (
              <div key={`${step.name}-${step.startedAt}`} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                <span className="truncate text-[11px] font-black text-slate-700">{step.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${step.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brand-red"}`}>
                  {step.ok ? "PASS" : `FAIL ${step.status}`} · {formatDuration(step.durationMs)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">신선도 운영</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${getFreshnessClassName(freshness?.severity)}`}>
              {freshness?.label ?? "리포트 확인 필요"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-600">
            <span className="rounded-2xl bg-slate-50 px-3 py-2">
              갱신 주기
              <b className="mt-0.5 block text-sm text-slate-950">{freshness?.cadenceHours ?? 6}시간</b>
            </span>
            <span className="rounded-2xl bg-slate-50 px-3 py-2">
              stale 기준
              <b className="mt-0.5 block text-sm text-slate-950">{freshness?.staleHours ?? 24}시간</b>
            </span>
          </div>
          <div className="mt-3 rounded-2xl bg-brand-warm px-3 py-2 text-[11px] font-bold leading-5 text-slate-600">
            <p>
              <b className="text-slate-950">다음 refresh 권장:</b> {formatDateTime(freshness?.nextRefreshDueAt)}
            </p>
            <p>
              <b className="text-slate-950">마지막 생성:</b>{" "}
              {freshness?.generatedAt ? `${getRelativeTime(freshness.generatedAt)} · ${freshness.ageHours ?? 0}시간 경과` : "리포트 없음"}
            </p>
            <code className="mt-2 block overflow-x-auto rounded-xl bg-white px-2 py-1 text-[10px] font-black text-brand-red">
              {freshness?.command ?? "npm run refresh:all && npm run health:readiness"}
            </code>
          </div>
        </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">만료 임박 대체 큐</p>
            <p className="mt-1 text-[11px] font-bold leading-5 text-amber-900/75">
              14일 이내 종료 혜택은 같은 카테고리의 공식 소스 후보로 대체 준비하고, 30일 이내 항목은 감시 큐로 유지합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-black">
            <span className="rounded-2xl bg-white px-3 py-2 text-amber-800 shadow-sm">
              14일 내
              <b className="mt-0.5 block text-sm text-slate-950">{report.freshnessQueues?.expiringWithin14DaysCount ?? renewalQueue.length}</b>
            </span>
            <span className="rounded-2xl bg-white px-3 py-2 text-amber-800 shadow-sm">
              30일 감시
              <b className="mt-0.5 block text-sm text-slate-950">{report.freshnessQueues?.expiringWithin30DaysCount ?? watchQueue.length}</b>
            </span>
          </div>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xs font-black text-brand-red">이번 주 대체 준비</p>
            <div className="mt-2 space-y-2">
              {(renewalQueue.length ? renewalQueue : [{ id: "none", title: "14일 이내 종료 혜택 없음", merchant: "운영 상태", category: "정상", daysLeft: 0 }]).map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-xs font-black text-slate-950">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-amber-700">
                      D-{Math.max(0, Math.ceil(Number(item.daysLeft ?? 0)))}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    {item.merchant ?? item.sourceName ?? "공식 혜택"} · {item.category ?? "카테고리"}
                    {item.endDate ? ` · 종료 ${formatDateTime(item.endDate)}` : ""}
                  </p>
                  {item.replacementCandidates?.length ? (
                    <div className="mt-2 rounded-xl bg-white px-2 py-1.5">
                      <p className="text-[10px] font-black text-amber-700">추천 대체 소스</p>
                      <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-700">
                        {item.replacementCandidates[0].label} · {item.replacementCandidates[0].recommendedEnvKeys.slice(0, 2).join(", ")}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xs font-black text-slate-950">30일 감시 후보</p>
            <div className="mt-2 space-y-2">
              {(watchQueue.length ? watchQueue : [{ id: "none", title: "30일 이내 감시 혜택 없음", merchant: "운영 상태", category: "정상", daysLeft: 0 }]).map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-xs font-black text-slate-950">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-600">
                      D-{Math.max(0, Math.ceil(Number(item.daysLeft ?? 0)))}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    {item.merchant ?? item.sourceName ?? "공식 혜택"} · {item.category ?? "카테고리"}
                    {item.endDate ? ` · 종료 ${formatDateTime(item.endDate)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black text-slate-950">Provider 위험도</p>
            <p className="mt-1 text-[11px] font-bold text-slate-500">feed 연결 전 seed 운영, 수집 공백, 검증 실패를 분리해 출시 전 운영 우선순위를 정합니다.</p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">
            정상 {report.providerRiskSummary?.healthy ?? 0} · 관찰 {report.providerRiskSummary?.watch ?? 0} · 점검 {report.providerRiskSummary?.danger ?? 0}
          </span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {(providerRisks.length ? providerRisks : [{ provider: "없음", source: "-", severity: "danger" as const, label: "리포트 없음", reason: "provider risk 리포트가 없습니다.", action: "npm run refresh:all && npm run health:readiness", visibleCount: 0, issueCount: 0, failureRate: 0 }]).map((risk) => (
            <div key={risk.provider} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-black text-slate-900">{risk.provider}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${getProviderRiskClassName(risk.severity)}`}>
                  {risk.label}
                </span>
              </div>
              <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{risk.source}</p>
              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-600">{risk.reason}</p>
              <p className="mt-2 text-[11px] font-black text-slate-500">
                노출 {risk.visibleCount} · 이슈 {risk.issueCount} · 실패율 {risk.failureRate}%
              </p>
              <p className="mt-2 line-clamp-2 rounded-xl bg-white px-2 py-1.5 text-[11px] font-bold leading-5 text-slate-600">{risk.action}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-red-50 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">공식 출처 신뢰도</p>
            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
              노출 중인 공식 출처를 링크 품질, 종료/검색 링크 차단, 평균 우선순위로 점검합니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
            신뢰 {trustedSourceCount} · 점검 {sourceTrustIssueCount}
          </span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {(sourceTrustScores.length
            ? sourceTrustScores
            : [
                {
                  sourceName: "리포트 없음",
                  provider: "system",
                  officialHost: "",
                  totalCount: 0,
                  visibleCount: 0,
                  hiddenCount: 0,
                  failedCount: 0,
                  searchLinkCount: 0,
                  expiredCount: 0,
                  averagePriorityScore: 0,
                  trustScore: 0,
                  status: "needs_review" as const,
                  lastCheckedAt: "",
                  categories: [],
                  benefitTypes: [],
                  recommendedAction: "npm run refresh:news && npm run verify:news로 공식 출처 신뢰도 리포트를 갱신하세요."
                }
              ]).map((source) => {
            const issueTotal = source.hiddenCount + source.failedCount + source.searchLinkCount + source.expiredCount;

            return (
              <div key={`${source.provider}-${source.sourceName}`} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-xs font-black text-slate-950">{source.sourceName}</p>
                    <p className="mt-1 truncate text-[11px] font-bold text-slate-500">
                      {source.provider}
                      {source.officialHost ? ` · ${source.officialHost}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${getSourceTrustClassName(source.status)}`}>
                    {getSourceTrustLabel(source.status)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] font-black text-slate-500">
                  <span className="rounded-xl bg-slate-50 px-2 py-1.5">
                    신뢰
                    <b className="mt-0.5 block text-sm text-slate-950">{source.trustScore}</b>
                  </span>
                  <span className="rounded-xl bg-slate-50 px-2 py-1.5">
                    평균
                    <b className="mt-0.5 block text-sm text-slate-950">{source.averagePriorityScore}</b>
                  </span>
                  <span className="rounded-xl bg-slate-50 px-2 py-1.5">
                    이슈
                    <b className="mt-0.5 block text-sm text-brand-red">{issueTotal}</b>
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-black text-slate-500">
                  노출 {source.visibleCount}/{source.totalCount} · 숨김 {source.hiddenCount} · 실패 {source.failedCount}
                </p>
                <div className="mt-2 flex gap-1 overflow-hidden">
                  {(source.categories.length ? source.categories : ["카테고리 대기"]).slice(0, 2).map((category) => (
                    <span key={category} className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                      {category}
                    </span>
                  ))}
                </div>
                <p className="mt-2 line-clamp-2 rounded-xl bg-slate-50 px-2 py-1.5 text-[11px] font-bold leading-5 text-slate-600">
                  {source.recommendedAction}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-white via-amber-50/50 to-red-50 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">공식 feed 전환 준비도</p>
            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
              seed fallback으로 출시 안정성을 유지하면서 공식 API/RSS/제휴 JSON feed 연결 우선순위를 관리합니다.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-black">
            <span className="rounded-2xl bg-white px-3 py-2 text-slate-600 shadow-sm">
              연결
              <b className="mt-0.5 block text-sm text-slate-950">
                {feedTransitionReadiness?.configuredProviders ?? 0}/{feedTransitionReadiness?.totalProviders ?? 0}
              </b>
            </span>
            <span className="rounded-2xl bg-white px-3 py-2 text-slate-600 shadow-sm">
              feed URL
              <b className="mt-0.5 block text-sm text-slate-950">{feedTransitionReadiness?.configuredFeedUrls ?? 0}</b>
            </span>
            <span className="rounded-2xl bg-white px-3 py-2 text-slate-600 shadow-sm">
              준비율
              <b className="mt-0.5 block text-sm text-brand-red">{feedTransitionReadiness?.readinessRate ?? 0}%</b>
            </span>
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {feedTransitionProviders.map((provider) => (
            <div key={provider.provider} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-950">{provider.label}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{provider.acceptedSources}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${provider.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {provider.modeLabel}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-black text-slate-500">
                노출 {provider.visibleCount} · 이슈 {provider.issueCount} · URL {provider.feedUrls}
              </p>
              <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-5 text-slate-600">{provider.nextAction}</p>
              <code className="mt-2 block overflow-x-auto rounded-xl bg-slate-50 px-2 py-1 text-[10px] font-black text-brand-red">
                {provider.envKeys.join(", ")}
              </code>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-[11px] font-bold leading-5 text-slate-600 shadow-sm">
          <p>
            <b className="text-slate-950">{feedTransitionReadiness?.label ?? "feed 전환 상태 확인 필요"}:</b>{" "}
            {feedTransitionReadiness?.operatorAction ?? "공식 feed 후보를 연결한 뒤 npm run refresh:all을 실행하세요."}
          </p>
          <p className="mt-1">
            <b className="text-slate-950">우선 env:</b>{" "}
            {(feedTransitionReadiness?.recommendedNextEnvKeys ?? []).slice(0, 4).join(", ") || "모든 provider 연결됨"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-red-100 bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">공식 feed 소스 설정</p>
            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
              운영자가 승인한 RSS, JSON, 제휴 API만 연결하고 검색 결과·커뮤니티·뉴스 단독 링크는 자동 차단합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-black">
            <span className="rounded-2xl bg-red-50 px-3 py-2 text-brand-red">
              설정 소스
              <b className="mt-0.5 block text-sm text-slate-950">{sourceConfig?.configuredSources ?? 0}</b>
            </span>
            <span className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600">
              env key
              <b className="mt-0.5 block text-sm text-slate-950">{sourceConfig?.envKeys?.length ?? 0}</b>
            </span>
            <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700">
              우선 소스
              <b className="mt-0.5 block text-sm text-slate-950">{sourceConfig?.highPrioritySources ?? 0}</b>
            </span>
            <span className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-700">
              최소 주기
              <b className="mt-0.5 block text-sm text-slate-950">{sourceConfig?.minimumRefreshCadenceMinutes ?? 360}분</b>
            </span>
            <span className="rounded-2xl bg-brand-navySoft px-3 py-2 text-brand-navy">
              다음 갱신
              <b className="mt-0.5 block text-sm text-slate-950">
                {sourceConfig?.nextRefreshAt ? getRelativeTime(sourceConfig.nextRefreshAt) : "대기 중"}
              </b>
            </span>
          </div>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-black text-slate-950">추천 검색어 자동 큐</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(sourceConfigQueries.length ? sourceConfigQueries : ["오늘의 무료", "쿠폰", "마트", "편의점", "배달", "카드 혜택", "정부 지원/문화 혜택"]).map((query) => (
                <span key={query} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-red shadow-sm">
                  {query}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500">
              설정 파일: <code className="rounded-lg bg-white px-1.5 py-0.5 font-black text-slate-700">{sourceConfig?.configFile ?? "data/officialBenefitFeedSources.json"}</code>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(sourceConfigTargetSections.length ? sourceConfigTargetSections : ["오늘의 무료", "쿠폰", "마트", "편의점"]).map((section) => (
                <span key={section} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-600 shadow-sm">
                  노출 {section}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-brand-warm p-3">
            <p className="text-xs font-black text-slate-950">허용·차단 가드레일</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {(sourceConfigGuardrails.length ? sourceConfigGuardrails : ["공식 RSS, 공식 JSON, 제휴 API만 연결", "검색 결과, 커뮤니티 원문, 뉴스 기사 단독 링크 차단"]).map((rule) => (
                <p key={rule} className="rounded-2xl bg-white px-3 py-2 text-[11px] font-bold leading-5 text-slate-600 shadow-sm">
                  {rule}
                </p>
              ))}
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(sourceConfigEnvKeys.length ? sourceConfigEnvKeys : feedTransitionReadiness?.recommendedNextEnvKeys ?? []).slice(0, 8).map((key) => (
                <code key={key} className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm">
                  {key}
                </code>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(sourceConfigOwners.length ? sourceConfigOwners : ["benefit-ops"]).map((owner) => (
                <span key={owner} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-600 shadow-sm">
                  담당 {owner}
                </span>
              ))}
            </div>
          </div>
        </div>
        {sourceRefreshWindows.length ? (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3" aria-label="공식 feed 소스별 재확인 큐">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-slate-950">소스별 재확인 큐</p>
                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                  출시 후 운영자는 다음 갱신 시각이 가까운 공식 feed부터 가격, 종료일, 혜택 조건을 다시 확인합니다.
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 shadow-sm">
                {sourceRefreshWindows.length}개 소스
              </span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {sourceRefreshWindows.map((item) => (
                <article key={`${item.provider}-${item.source}`} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-950">{item.source ?? item.provider}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-400">
                        담당 {item.operatorOwner ?? "benefit-ops"} · {item.refreshCadenceMinutes ?? 360}분 주기
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                      item.status === "near_realtime" ? "bg-emerald-50 text-emerald-700" : item.status === "standard" ? "bg-red-50 text-brand-red" : "bg-amber-50 text-amber-700"
                    }`}>
                      {item.status === "near_realtime" ? "고빈도" : item.status === "standard" ? "표준" : "주의"}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] font-black text-brand-navy">
                    다음 확인 {item.nextRefreshAt ? getRelativeTime(item.nextRefreshAt) : "대기 중"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-5 text-slate-500">
                    {item.operatorAction ?? "공식 feed 연결 상태와 혜택 조건을 재확인합니다."}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-red-100 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-950">실패 사유별 운영 액션</p>
              <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                검증 실패 TOP10이 생기면 원인별 조치 기준을 보고 숨김, 공식 URL 교체, 재검증 순서로 처리합니다.
              </p>
            </div>
            <AlertTriangle size={18} className="shrink-0 text-brand-red" aria-hidden="true" />
          </div>
          <div className="mt-3 space-y-2">
            {(failureReasonTop10.length ? failureReasonTop10 : [{ reason: "none", count: 0 }]).map((item) => (
              <div key={item.reason} className={`rounded-2xl px-3 py-2 ${item.reason === "none" ? "bg-emerald-50" : "bg-red-50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate text-xs font-black ${item.reason === "none" ? "text-emerald-700" : "text-brand-red"}`}>
                    {item.reason === "none" ? "현재 실패 사유 없음" : item.reason}
                  </p>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-700 shadow-sm">
                    {item.count}건
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-600">{getFailureReasonAction(item.reason)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-950">수집 로그 바로 점검</p>
              <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                최근 20개 수집 로그에서 provider, 상태, 사유, 공식 링크를 확인하고 이상 신호가 있으면 재검증을 기록합니다.
              </p>
            </div>
            <ListChecks size={18} className="shrink-0 text-slate-500" aria-hidden="true" />
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {(recentLogs.length ? recentLogs : [{ dealId: "none", provider: "system", title: "최근 수집 로그 없음", status: "empty", reason: "refresh:news 실행 필요", finalUrl: "", checkedAt: "" }]).map((log) => (
              <div key={`${log.dealId}-${log.checkedAt}-${log.status}`} className="rounded-2xl bg-slate-50 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-xs font-black text-slate-950">{log.title}</p>
                    <p className="mt-1 truncate text-[11px] font-bold text-slate-500">
                      {log.provider} · {log.reason} {log.checkedAt ? `· ${getRelativeTime(log.checkedAt)}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${log.status === "visible" ? "bg-emerald-50 text-emerald-700" : log.status === "empty" ? "bg-slate-100 text-slate-500" : "bg-red-50 text-brand-red"}`}>
                    {log.status === "visible" ? "노출" : log.status === "empty" ? "대기" : "점검"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="truncate text-[10px] font-bold text-slate-400">
                    {log.linkType ? `${log.linkType} · ` : ""}
                    {log.availability ? `${log.availability} · ` : ""}
                    {typeof log.priorityScore === "number" ? `${log.priorityScore}점 · ` : ""}
                    {log.finalUrl || "공식 링크 없음"}
                  </p>
                  {log.finalUrl ? (
                    <a
                      href={log.finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-700 shadow-sm hover:text-brand-red"
                      aria-label={`${log.title} 공식 링크 새 탭 확인`}
                    >
                      확인
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-brand-warm p-3">
        <p className="text-xs font-black text-slate-950">오늘 운영 리스크</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {(report.operationalRisks ?? []).map((risk) => (
            <p key={risk} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
              {risk}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black text-slate-950">다음 운영 액션</p>
          <Clock3 size={16} className="text-brand-red" aria-hidden="true" />
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {(operatorNextActions.length ? operatorNextActions : [{ priority: "low", title: "운영 액션 없음", description: "현재 공식 혜택 신선도와 카테고리 커버리지가 정상입니다." }]).map((action) => (
            <div key={`${action.priority}-${action.title}`} className="rounded-2xl bg-white px-3 py-2 shadow-sm">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${action.priority === "high" ? "bg-red-50 text-brand-red" : action.priority === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                {action.priority}
              </span>
              <p className="mt-2 text-xs font-black text-slate-950">{action.title}</p>
              <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">{action.description}</p>
              {action.dueAt ? <p className="mt-1 text-[11px] font-black text-slate-600">권장 시각 {formatDateTime(action.dueAt)}</p> : null}
              {action.command ? <code className="mt-2 block rounded-xl bg-slate-50 px-2 py-1 text-[10px] font-black text-brand-red">{action.command}</code> : null}
            </div>
          ))}
        </div>
      </div>

      <label className="mt-4 block text-xs font-black text-slate-700" htmlFor="news-operation-reason">
        운영 사유
      </label>
      <input
        id="news-operation-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50"
        placeholder="manual_admin_review"
      />

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">노출 중 공식 혜택</p>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700">hide/revalidate</span>
          </div>
          <div className="mt-3 space-y-2">
            {visibleDeals.length ? visibleDeals.map((deal) => {
              const id = getDealId(deal);
              return (
                <article key={id} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-xs font-black text-slate-950">{deal.title}</p>
                      <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{deal.sourceName ?? deal.merchant} · {deal.category}</p>
                    </div>
                    {deal.finalUrl ? (
                      <a href={deal.finalUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-red-50 hover:text-brand-red" aria-label={`${deal.title} 공식 링크 새 탭 확인`}>
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => runAction("hide", deal)}
                      disabled={pendingKey === `hide:${id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-brand-red px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <EyeOff size={14} />
                      수동 숨김
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction("revalidate", deal)}
                      disabled={pendingKey === `revalidate:${id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <RefreshCw size={14} />
                      재검증 기록
                    </button>
                  </div>
                </article>
              );
            }) : (
              <p className="rounded-2xl bg-white p-3 text-xs font-black text-slate-500">노출 중인 공식 혜택이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-red-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">숨김/점검 공식 혜택</p>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-red">restore/revalidate</span>
          </div>
          <div className="mt-3 space-y-2">
            {hiddenDeals.length ? hiddenDeals.map((deal) => {
              const id = getDealId(deal);
              return (
                <article key={`${id}-${deal.hiddenReason ?? "hidden"}`} className="rounded-2xl bg-white p-3 shadow-sm">
                  <p className="line-clamp-1 text-xs font-black text-slate-950">{deal.title}</p>
                  <p className="mt-1 truncate text-[11px] font-bold text-brand-red">{deal.hiddenReason ?? "manual_hidden"}</p>
                  {deal.lastCheckedAt ? <p className="mt-1 text-[11px] font-bold text-slate-400">{getRelativeTime(deal.lastCheckedAt)}</p> : null}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => runAction("restore", deal)}
                      disabled={pendingKey === `restore:${id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-white px-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 disabled:cursor-wait disabled:opacity-60"
                    >
                      <RotateCcw size={14} />
                      복구
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction("revalidate", deal)}
                      disabled={pendingKey === `revalidate:${id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <Eye size={14} />
                      재검증
                    </button>
                  </div>
                </article>
              );
            }) : (
              <p className="rounded-2xl bg-white p-3 text-xs font-black text-emerald-700">숨김 처리된 공식 혜택 없음</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-black text-slate-950">최근 운영 액션</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(report.overrides.recentAudit.length ? report.overrides.recentAudit : [{ action: "ready", id: "none", reason: "아직 수동 액션 없음", createdAt: "" }]).slice(0, 8).map((log) => (
            <span key={`${log.action}-${log.id}-${log.createdAt}`} className="min-w-[180px] rounded-2xl bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm">
              <b className="block text-xs text-slate-950">{actionLabels[log.action as NewsOperationAction] ?? log.action}</b>
              {log.id} · {log.reason}
            </span>
          ))}
        </div>
      </div>

      {message ? (
        <p role="status" aria-live="polite" className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          <CheckCircle2 size={17} />
          {message}
        </p>
      ) : null}
    </section>
  );
}

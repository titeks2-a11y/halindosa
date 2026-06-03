import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { applyNewsDealOverrides, readNewsDealOverrides } from "@/lib/deals/newsOverrides";
import type { NewsDeal } from "@/types/newsDeal";

interface NewsDealSnapshot {
  generatedAt?: string;
  source?: string;
  allDeals?: NewsDeal[];
  deals?: NewsDeal[];
  hiddenDeals?: NewsDeal[];
  providerStats?: ProviderStat[];
}

interface ProviderStat {
  provider: string;
  source?: string;
  configured?: boolean;
  feedUrls?: number;
  fetchedCount?: number;
  normalizedCount?: number;
  visibleCount?: number;
  hiddenCount?: number;
  failedCount?: number;
  expiredCount?: number;
  officialMissingCount?: number;
  errorCount?: number;
  errors?: string[];
}

type ProviderRiskSeverity = "healthy" | "watch" | "danger";

interface ProviderRisk {
  provider: string;
  source: string;
  severity: ProviderRiskSeverity;
  label: string;
  reason: string;
  action: string;
  visibleCount: number;
  issueCount: number;
  failureRate: number;
}

interface NewsDealsReport {
  ok?: boolean;
  generatedAt?: string;
  totalCount?: number;
  visibleCount?: number;
  hiddenCount?: number;
  expiredCount?: number;
  officialMissingCount?: number;
  failedCount?: number;
  providerStats?: ProviderStat[];
  failureReasons?: Record<string, number>;
  failureReasonTop10?: Array<{ reason: string; count: number }>;
  hiddenDeals?: Array<Partial<NewsDeal> & { hiddenReason?: string; officialHost?: string }>;
  expiredDeals?: Array<Partial<NewsDeal> & { hiddenReason?: string; officialHost?: string }>;
  officialMissingDeals?: Array<Partial<NewsDeal> & { hiddenReason?: string; officialHost?: string }>;
  recentLogs?: Array<{
    dealId: string;
    provider: string;
    title: string;
    status: string;
    reason: string;
    finalUrl: string;
    checkedAt: string;
  }>;
  manualActions?: Array<{ action: string; label: string; description: string }>;
}

interface RefreshAllReport {
  ok?: boolean;
  generatedAt?: string;
  productDealsCount?: number;
  newsDealsCount?: number;
  insertedCount?: number;
  updatedCount?: number;
  hiddenCount?: number;
  expiredCount?: number;
  failedCount?: number;
  steps?: Array<{ name: string; ok: boolean; status: number; startedAt: string; finishedAt: string }>;
}

const refreshedNewsDealsPath = join(process.cwd(), "data", "refreshedNewsDeals.json");
const newsDealsReportPath = join(process.cwd(), "reports", "news-deals.json");
const refreshAllReportPath = join(process.cwd(), "reports", "refresh-all.json");

const requiredNewsCategories = [
  { category: "식품/생필품", action: "생활 장보기 공식 행사 2개 이상 유지" },
  { category: "마트/편의점", action: "편의점 1+1, 마트 쿠폰, 장보기 행사 확인" },
  { category: "디지털/가전", action: "공식몰 기획전 또는 카드 혜택 2개 이상 유지" },
  { category: "패션/뷰티", action: "브랜드 공식 쿠폰, 뷰티 체험 혜택 확인" },
  { category: "외식/배달", action: "배달앱, 프랜차이즈 공식 쿠폰 2개 이상 유지" },
  { category: "여행/숙박", action: "항공, 숙박, 교통 프로모션 공식 페이지 2개 이상 유지" },
  { category: "영화/문화", action: "영화관, 전시, 문화의날 혜택 확인" },
  { category: "카드/멤버십", action: "카드사, 통신사, 간편결제 할인 조건 확인" },
  { category: "무료혜택", action: "무료 체험, 무료 쿠폰, 샘플 수령 조건 2개 이상 유지" },
  { category: "정부/공공혜택", action: "공공 쿠폰, 문화/복지 혜택 2개 이상 유지" }
];
const minimumCategoryDealCount = 2;
const newsRefreshCadenceHours = 6;
const newsRefreshStaleHours = 24;

type NewsFreshnessStatus = "fresh" | "due" | "stale" | "missing";
type NewsFreshnessSeverity = "good" | "caution" | "danger";

function roundAgeHours(ageMs: number) {
  return Math.round((ageMs / (60 * 60 * 1000)) * 10) / 10;
}

function addHours(timestamp: number, hours: number) {
  return new Date(timestamp + hours * 60 * 60 * 1000).toISOString();
}

function getNewsFreshnessState(generatedAt?: string) {
  const generatedTimestamp = Date.parse(generatedAt ?? "");
  const hasGeneratedAt = Number.isFinite(generatedTimestamp);
  const ageHours = hasGeneratedAt ? roundAgeHours(Math.max(0, Date.now() - generatedTimestamp)) : null;
  const currentAgeHours = ageHours ?? 0;
  const status: NewsFreshnessStatus = !hasGeneratedAt
    ? "missing"
    : currentAgeHours >= newsRefreshStaleHours
      ? "stale"
      : currentAgeHours >= newsRefreshCadenceHours
        ? "due"
        : "fresh";
  const severity: NewsFreshnessSeverity = status === "fresh" ? "good" : status === "due" ? "caution" : "danger";
  const label =
    status === "fresh"
      ? "최신 상태"
      : status === "due"
        ? "갱신 권장"
        : status === "stale"
          ? "출시 전 갱신 필요"
          : "리포트 생성 필요";

  return {
    status,
    severity,
    label,
    cadenceHours: newsRefreshCadenceHours,
    staleHours: newsRefreshStaleHours,
    ageHours,
    generatedAt: hasGeneratedAt ? new Date(generatedTimestamp).toISOString() : "",
    nextRefreshDueAt: hasGeneratedAt ? addHours(generatedTimestamp, newsRefreshCadenceHours) : "",
    staleAfterAt: hasGeneratedAt ? addHours(generatedTimestamp, newsRefreshStaleHours) : "",
    command: "npm run refresh:all && npm run health:readiness",
    releaseBlocking: status === "stale" || status === "missing"
  };
}

function readJson<T>(fullPath: string, fallback: T): T {
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function sortLatestLogs(logs: NonNullable<NewsDealsReport["recentLogs"]>) {
  return [...logs].sort((a, b) => Date.parse(b.checkedAt) - Date.parse(a.checkedAt)).slice(0, 20);
}

function getDurationMs(startedAt?: string, finishedAt?: string) {
  const started = Date.parse(startedAt ?? "");
  const finished = Date.parse(finishedAt ?? "");
  if (!Number.isFinite(started) || !Number.isFinite(finished)) return 0;
  return Math.max(0, finished - started);
}

function getProviderRisk(stat: ProviderStat): ProviderRisk {
  const visibleCount = Number(stat.visibleCount ?? 0);
  const fetchedCount = Number(stat.fetchedCount ?? 0);
  const normalizedCount = Number(stat.normalizedCount ?? 0);
  const hiddenCount = Number(stat.hiddenCount ?? 0);
  const failedCount = Number(stat.failedCount ?? 0);
  const expiredCount = Number(stat.expiredCount ?? 0);
  const officialMissingCount = Number(stat.officialMissingCount ?? 0);
  const errorCount = Number(stat.errorCount ?? 0);
  const issueCount = hiddenCount + failedCount + expiredCount + officialMissingCount + errorCount;
  const totalCount = Math.max(fetchedCount, normalizedCount, visibleCount + issueCount, 1);
  const failureRate = Math.round((issueCount / totalCount) * 1000) / 10;

  if (failedCount > 0 || errorCount > 0 || officialMissingCount > 0) {
    return {
      provider: stat.provider,
      source: stat.source ?? "seed_fallback",
      severity: "danger",
      label: "즉시 점검",
      reason: `실패 ${failedCount} · 오류 ${errorCount} · 공식 링크 누락 ${officialMissingCount}`,
      action: "관리자 숨김/재검증 큐에서 원인 확인 후 feed 또는 seed를 수정하세요.",
      visibleCount,
      issueCount,
      failureRate
    };
  }

  if (expiredCount > 0 || hiddenCount > 0) {
    return {
      provider: stat.provider,
      source: stat.source ?? "seed_fallback",
      severity: "watch",
      label: "정리 필요",
      reason: `숨김 ${hiddenCount} · 종료 ${expiredCount}`,
      action: "종료/숨김 항목을 검토하고 대체 공식 혜택을 보강하세요.",
      visibleCount,
      issueCount,
      failureRate
    };
  }

  if (visibleCount === 0) {
    return {
      provider: stat.provider,
      source: stat.source ?? "seed_fallback",
      severity: "watch",
      label: "수집 대기",
      reason: "노출 가능한 공식 혜택이 아직 없습니다.",
      action: "공식 feed URL 또는 승인된 seed 후보를 추가해 provider 공백을 줄이세요.",
      visibleCount,
      issueCount,
      failureRate
    };
  }

  if (!stat.configured) {
    return {
      provider: stat.provider,
      source: stat.source ?? "seed_fallback",
      severity: "watch",
      label: "seed 운영",
      reason: "외부 feed 미연결 상태에서 승인된 seed/fallback으로 운영 중입니다.",
      action: "상용 운영 전 공식 API/RSS/제휴 feed를 연결하고 news:feed:doctor를 실행하세요.",
      visibleCount,
      issueCount,
      failureRate
    };
  }

  return {
    provider: stat.provider,
    source: stat.source ?? "configured_feed",
    severity: "healthy",
    label: "정상",
    reason: "공식 feed가 연결되어 있고 노출/검증 실패가 없습니다.",
    action: "현재 cadence에 맞춰 refresh:all을 유지하세요.",
    visibleCount,
    issueCount,
    failureRate
  };
}

export function getNewsOperationsReport() {
  const snapshot = readJson<NewsDealSnapshot>(refreshedNewsDealsPath, {});
  const report = readJson<NewsDealsReport>(newsDealsReportPath, {});
  const refreshAll = readJson<RefreshAllReport>(refreshAllReportPath, {});
  const overrides = readNewsDealOverrides();
  const allDeals = snapshot.allDeals?.length ? snapshot.allDeals : [...(snapshot.deals ?? []), ...(snapshot.hiddenDeals ?? [])] as NewsDeal[];
  const visibleDeals = applyNewsDealOverrides(snapshot.deals ?? []);
  const hiddenByReport = report.hiddenDeals ?? [];
  const manualHiddenDeals = Object.entries(overrides.hidden).map(([id, entry]) => ({
    id,
    title: allDeals.find((deal) => deal.id === id)?.title ?? id,
    hiddenReason: `manual_hidden:${entry.reason}`,
    lastCheckedAt: entry.updatedAt
  }));
  const providerStats = report.providerStats?.length ? report.providerStats : (snapshot.providerStats ?? []);
  const providerRisks = providerStats.map(getProviderRisk);
  const providerRiskSummary = {
    healthy: providerRisks.filter((risk) => risk.severity === "healthy").length,
    watch: providerRisks.filter((risk) => risk.severity === "watch").length,
    danger: providerRisks.filter((risk) => risk.severity === "danger").length
  };
  const recentLogs = sortLatestLogs(report.recentLogs ?? []);
  const failureReasonTop10 = report.failureReasonTop10?.length
    ? report.failureReasonTop10
    : Object.entries(report.failureReasons ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([reason, count]) => ({ reason, count }));
  const visibleCategoryCounts = visibleDeals.reduce((map, deal) => {
    map.set(deal.category, (map.get(deal.category) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const categoryCoverage = requiredNewsCategories.map((item) => {
    const count = visibleCategoryCounts.get(item.category) ?? 0;
    const sample = visibleDeals.find((deal) => deal.category === item.category);

    return {
      ...item,
      count,
      minimumCount: minimumCategoryDealCount,
      status: count >= minimumCategoryDealCount ? "ready" : count > 0 ? "thin" : "gap",
      sampleTitle: sample?.title ?? ""
    };
  });
  const refreshSteps = (refreshAll.steps ?? []).map((step) => ({
    ...step,
    durationMs: getDurationMs(step.startedAt, step.finishedAt)
  }));
  const freshness = getNewsFreshnessState(report.generatedAt ?? snapshot.generatedAt);
  const operatorNextActions = [
    ...(freshness.status === "fresh"
      ? [
          {
            priority: "low",
            title: "정기 갱신 대기",
            description: `${freshness.cadenceHours}시간 주기로 공식 혜택 리포트를 다시 갱신합니다.`,
            command: freshness.command,
            dueAt: freshness.nextRefreshDueAt
          }
        ]
      : [
          {
            priority: freshness.releaseBlocking ? "high" : "medium",
            title: freshness.releaseBlocking ? "출시 전 공식 혜택 리포트 갱신" : "공식 혜택 리포트 갱신 권장",
            description: `${freshness.label} 상태입니다. 상품/뉴스 refresh와 health readiness를 다시 실행하세요.`,
            command: freshness.command,
            dueAt: freshness.nextRefreshDueAt || new Date().toISOString()
          }
        ]),
    ...(categoryCoverage.some((item) => item.status === "gap" || item.status === "thin")
      ? [
          {
            priority: "high",
            title: "공식 혜택 카테고리 보강",
            description: "필수 혜택 카테고리별 최소 2개 이상의 공식 링크 검증 혜택을 유지하세요.",
            command: "npm run refresh:news && npm run verify:news"
          }
        ]
      : []),
    ...(((report.hiddenCount ?? 0) > 0 || (report.failedCount ?? 0) > 0 || (report.expiredCount ?? 0) > 0)
      ? [
          {
            priority: "medium",
            title: "숨김/실패/종료 큐 검토",
            description: "관리자 뉴스 운영 패널에서 hide, restore, revalidate 액션으로 공식 혜택 상태를 정리하세요.",
            command: "open /admin"
          }
        ]
      : [])
  ];
  const operationalRisks = [
    ...(categoryCoverage.some((item) => item.status === "gap") ? ["카테고리 공백이 있어 공식 혜택 seed 또는 feed 보강 필요"] : []),
    ...(categoryCoverage.some((item) => item.status === "thin") ? ["공식 혜택 2건 미만 카테고리가 있어 운영 피드 추가 확인 필요"] : []),
    ...((report.hiddenCount ?? 0) > 0 ? ["숨김 처리된 공식 혜택이 있어 복구/종료 판단 필요"] : []),
    ...((report.expiredCount ?? 0) > 0 ? ["종료된 혜택이 있어 사용자 노출 제외 상태 확인 필요"] : []),
    ...((report.officialMissingCount ?? 0) > 0 ? ["공식 finalUrl이 없는 혜택 후보가 있어 노출 제외 상태 확인 필요"] : []),
    ...((report.failedCount ?? 0) > 0 ? ["검증 실패 공식 혜택이 있어 실패 사유 TOP10 확인 필요"] : []),
    ...(refreshAll.ok === false ? ["refresh:all 마지막 실행이 실패하여 파이프라인 로그 확인 필요"] : []),
    ...(freshness.releaseBlocking ? ["뉴스 혜택 리포트가 24시간 이상 갱신되지 않아 refresh:all 실행 필요"] : []),
    ...(freshness.status === "due" ? ["뉴스 혜택 리포트 정기 갱신 시간이 지나 refresh:all 실행 권장"] : [])
  ];

  return {
    ok: report.ok !== false && refreshAll.ok !== false && !freshness.releaseBlocking,
    generatedAt: report.generatedAt ?? snapshot.generatedAt ?? new Date().toISOString(),
    snapshotSource: snapshot.source ?? "seed",
    totalCount: report.totalCount ?? allDeals.length,
    visibleCount: visibleDeals.length,
    hiddenCount: (report.hiddenCount ?? hiddenByReport.length) + manualHiddenDeals.length,
    expiredCount: report.expiredCount ?? 0,
    officialMissingCount: report.officialMissingCount ?? 0,
    failedCount: (report.failedCount ?? hiddenByReport.length) + manualHiddenDeals.length,
    categoryCoverage,
    freshness,
    operatorNextActions,
    operationalRisks: operationalRisks.length ? operationalRisks : ["공식 혜택 노출 기준, 카테고리 커버리지, refresh:all 상태가 정상입니다."],
    providerStats,
    providerRisks,
    providerRiskSummary,
    failureReasonTop10,
    visibleDeals: visibleDeals
      .map((deal) => ({
        id: deal.id,
        title: deal.title,
        merchant: deal.merchant,
        category: deal.category,
        benefitType: deal.benefitType,
        sourceName: deal.sourceName,
        finalUrl: deal.finalUrl,
        validationStatus: deal.validationStatus,
        lastCheckedAt: deal.lastCheckedAt
      }))
      .slice(0, 20),
    hiddenDeals: [...manualHiddenDeals, ...hiddenByReport].slice(0, 20),
    expiredDeals: report.expiredDeals ?? [],
    officialMissingDeals: report.officialMissingDeals ?? [],
    recentLogs,
    manualActions: report.manualActions ?? [
      { action: "hide", label: "수동 숨김", description: "링크 오류, 종료, 조건 불명확 항목을 즉시 제외" },
      { action: "restore", label: "수동 복구", description: "재검증 후 사용자 노출 후보로 복구" },
      { action: "revalidate", label: "링크 재검증", description: "refresh:all로 전체 링크 상태를 다시 확인" }
    ],
    overrides: {
      hiddenCount: Object.keys(overrides.hidden).length,
      recentAudit: overrides.auditLog.slice(0, 10)
    },
    refreshAll: {
      ok: refreshAll.ok ?? false,
      generatedAt: refreshAll.generatedAt ?? "",
      productDealsCount: refreshAll.productDealsCount ?? 0,
      newsDealsCount: refreshAll.newsDealsCount ?? 0,
      hiddenCount: refreshAll.hiddenCount ?? 0,
      expiredCount: refreshAll.expiredCount ?? 0,
      failedCount: refreshAll.failedCount ?? 0,
      steps: refreshSteps
    }
  };
}

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getEnvFeedUrls } from "@/lib/deals/feedUrls";
import { applyNewsDealOverrides, readNewsDealOverrides } from "@/lib/deals/newsOverrides";
import { getOfficialSourceOnboardingPlan } from "@/lib/operations/sourceOnboardingPlan";
import type { NewsDeal, NewsDealSourceTrust } from "@/types/newsDeal";

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
  targetSections?: string[];
  operatorOwner?: string;
  launchPriority?: string;
  refreshCadenceMinutes?: number;
  qualityChecklist?: string[];
  seedCount?: number;
  feedItemCount?: number;
  feedSuccessCount?: number;
  collectedCount?: number;
  configuredEmptyFeed?: boolean;
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

type FeedTransitionMode = "external_feed" | "seed_fallback";
type FeedTransitionPriority = "high" | "medium" | "low";

interface FeedTransitionProvider {
  provider: string;
  label: string;
  mode: FeedTransitionMode;
  modeLabel: string;
  configured: boolean;
  feedUrls: number;
  seedCount: number;
  feedItemCount: number;
  feedSuccessCount: number;
  collectedCount: number;
  feedItemRate: number;
  configuredEmptyFeed: boolean;
  envKeys: string[];
  acceptedSources: string;
  nextAction: string;
  priority: FeedTransitionPriority;
  launchBlocking: boolean;
  visibleCount: number;
  issueCount: number;
}

interface FeedTransitionReadiness {
  status: "production_feed_ready" | "hybrid_feed_ready" | "seed_launch_ready";
  label: string;
  readinessRate: number;
  totalProviders: number;
  configuredProviders: number;
  seedOnlyProviders: number;
  configuredFeedUrls: number;
  seedCount: number;
  feedItemCount: number;
  feedSuccessCount: number;
  collectedCount: number;
  feedItemRate: number;
  configuredEmptyFeedCount: number;
  configuredEmptyFeedProviders: string[];
  launchBlockingCount: number;
  recommendedNextEnvKeys: string[];
  guardrails: string[];
  operatorAction: string;
  providers: FeedTransitionProvider[];
}

interface SourceActionQueueItem {
  provider: string;
  source: string;
  priority: "high" | "medium" | "low";
  status: "connect_feed" | "fix_feed" | "review" | "healthy";
  label: string;
  reason: string;
  action: string;
  command: string;
  envKeys: string[];
  nextRefreshAt?: string;
  issueCount: number;
  visibleCount: number;
}

interface OfficialBenefitSourceConfig {
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
}

interface NewsPolicyRegression {
  ok: boolean;
  total: number;
  passed: number;
  visiblePositiveSamples: number;
  blockedNegativeSamples: number;
  results: Array<{
    id: string;
    expectedHidden: boolean;
    actualHidden: boolean;
    expectedReason: string;
    hiddenReason: string;
    linkType: string;
    availability: string;
    validationStatus: string;
    priorityScore: number;
    ok: boolean;
  }>;
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
  sourceConfig?: OfficialBenefitSourceConfig;
  sourceTrustScores?: NewsDealSourceTrust[];
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
    linkType?: string;
    availability?: string;
    priorityScore?: number;
    checkedAt: string;
  }>;
  manualActions?: Array<{ action: string; label: string; description: string }>;
  gates?: {
    policyRegression?: NewsPolicyRegression;
    [key: string]: unknown;
  };
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

interface FreshnessQueueItem {
  id: string;
  title: string;
  merchant?: string;
  category?: string;
  sourceName?: string;
  endDate?: string;
  daysLeft?: number;
  action?: string;
}

interface SourceReplacementCandidate {
  id: string;
  label: string;
  provider: string;
  officialUrl: string;
  liveStatus: string;
  score: number;
  nextAction: string;
  recommendedEnvKeys: string[];
}

type FreshnessQueueWithCandidates = FreshnessQueueItem & {
  replacementCandidates: SourceReplacementCandidate[];
};

interface NewsFreshnessReport {
  ok?: boolean;
  generatedAt?: string;
  expiringWithin14DaysCount?: number;
  expiringWithin30DaysCount?: number;
  renewalQueue?: FreshnessQueueItem[];
  watchQueue?: FreshnessQueueItem[];
  nextActions?: string[];
}

interface NewsFeedCanaryReport {
  ok?: boolean;
  generatedAt?: string;
  status?: string;
  freshnessStatus?: string;
  cadenceHours?: number;
  staleHours?: number;
  providerCount?: number;
  configuredProviderCount?: number;
  configuredFeedUrls?: number;
  totalFetchedCount?: number;
  visibleCandidateCount?: number;
  hiddenCandidateCount?: number;
  errorCount?: number;
  configuredEmptyFeedCount?: number;
  officialLinkPromotedCount?: number;
  failedProviders?: Array<{ provider: string; status: string; action: string }>;
  nextActions?: string[];
}

const refreshedNewsDealsPath = join(process.cwd(), "data", "refreshedNewsDeals.json");
const newsDealsReportPath = join(process.cwd(), "reports", "news-deals.json");
const refreshAllReportPath = join(process.cwd(), "reports", "refresh-all.json");
const newsFreshnessReportPath = join(process.cwd(), "reports", "news-freshness.json");
const newsFeedCanaryReportPath = join(process.cwd(), "reports", "news-feed-canary.json");

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

const feedTransitionProfiles = [
  {
    provider: "news",
    label: "뉴스·보도자료",
    envKeys: ["DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS"],
    acceptedSources: "공식 보도자료, 승인 RSS/JSON feed",
    nextAction: "공식 보도자료 RSS 또는 승인 JSON feed를 연결하고 finalUrl은 공식 혜택 페이지로만 유지하세요.",
    priority: "medium"
  },
  {
    provider: "event_news",
    label: "이벤트 뉴스",
    envKeys: ["DEAL_EVENT_NEWS_FEED_URLS"],
    acceptedSources: "공식 이벤트 보도자료 feed",
    nextAction: "행사 기사 원문은 sourceUrl로만 보관하고 사용자 이동 URL은 공식 이벤트 상세로 교체하세요.",
    priority: "medium"
  },
  {
    provider: "official_event",
    label: "공식 이벤트·혜택",
    envKeys: ["OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"],
    acceptedSources: "쇼핑몰, 카드사, 통신사, 편의점, 마트 공식 이벤트 JSON feed",
    nextAction: "출시 후 가장 먼저 공식 이벤트 feed를 연결해 seed 의존도를 줄이세요.",
    priority: "high"
  },
  {
    provider: "public_coupon",
    label: "공공·쿠폰·무료혜택",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS"],
    acceptedSources: "공공기관, 브랜드, 쿠폰 제공처의 공식 혜택 feed",
    nextAction: "무료·쿠폰·포인트 혜택은 공식 수령 페이지가 있는 feed만 연결하세요.",
    priority: "high"
  }
] as const;

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

function attachReplacementCandidates(
  queue: FreshnessQueueItem[],
  sourceQueue: ReturnType<typeof getOfficialSourceOnboardingPlan>["queue"],
  limitPerDeal = 3
): FreshnessQueueWithCandidates[] {
  return queue.map((deal) => {
    const category = deal.category ?? "";
    const candidates = sourceQueue
      .filter((source) => source.category.includes(category))
      .sort((a, b) => b.score - a.score || a.rank - b.rank)
      .slice(0, limitPerDeal)
      .map((source) => ({
        id: source.id,
        label: source.label,
        provider: source.provider,
        officialUrl: source.officialUrl,
        liveStatus: source.liveStatus,
        score: source.score,
        nextAction: source.nextAction,
        recommendedEnvKeys: source.recommendedEnvKeys
      }));

    return {
      ...deal,
      replacementCandidates: candidates
    };
  });
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
  const feedUrls = Number(stat.feedUrls ?? 0);
  const feedItemCount = Number(stat.feedItemCount ?? 0);
  const configuredEmptyFeed = Boolean(stat.configured) && feedUrls > 0 && feedItemCount === 0;

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

  if (configuredEmptyFeed) {
    return {
      provider: stat.provider,
      source: stat.source ?? "configured_feed",
      severity: "watch",
      label: "feed 공백",
      reason: `feed URL ${feedUrls}개가 연결됐지만 외부 feed 항목이 0건입니다.`,
      action: "feed URL, 응답 형식, normalizer 매핑, 공식 상세 링크 승격 결과를 확인하세요.",
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

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildRuntimeSourceTrustScores(deals: NewsDeal[]): NewsDealSourceTrust[] {
  const groups = new Map<string, {
    sourceName: string;
    provider: string;
    officialHost: string;
    totalCount: number;
    visibleCount: number;
    hiddenCount: number;
    failedCount: number;
    searchLinkCount: number;
    expiredCount: number;
    priorityScoreSum: number;
    lastCheckedAt: string;
    categories: Set<NewsDeal["category"]>;
    benefitTypes: Set<NewsDeal["benefitType"]>;
  }>();

  deals.forEach((deal) => {
    const sourceName = deal.sourceName || deal.merchant || deal.provider || "unknown_source";
    const officialHost = deal.officialHost ?? "";
    const key = `${sourceName}::${officialHost}`;
    const current = groups.get(key) ?? {
      sourceName,
      provider: deal.provider,
      officialHost,
      totalCount: 0,
      visibleCount: 0,
      hiddenCount: 0,
      failedCount: 0,
      searchLinkCount: 0,
      expiredCount: 0,
      priorityScoreSum: 0,
      lastCheckedAt: "",
      categories: new Set<NewsDeal["category"]>(),
      benefitTypes: new Set<NewsDeal["benefitType"]>()
    };
    const visible = !deal.isHidden && deal.validationStatus === "passed";

    current.totalCount += 1;
    current.visibleCount += visible ? 1 : 0;
    current.hiddenCount += visible ? 0 : 1;
    current.failedCount += deal.validationStatus === "failed" ? 1 : 0;
    current.searchLinkCount += deal.linkType === "search" || deal.hiddenReason?.includes("search_or_result_url") ? 1 : 0;
    current.expiredCount += deal.availability === "expired" || deal.hiddenReason?.includes("expired_event") ? 1 : 0;
    current.priorityScoreSum += Number(deal.priorityScore ?? 0);
    current.lastCheckedAt = !current.lastCheckedAt || Date.parse(deal.lastCheckedAt) > Date.parse(current.lastCheckedAt) ? deal.lastCheckedAt : current.lastCheckedAt;
    current.categories.add(deal.category);
    current.benefitTypes.add(deal.benefitType);
    groups.set(key, current);
  });

  return Array.from(groups.values())
    .map((source) => {
      const averagePriorityScore = source.totalCount ? Math.round(source.priorityScoreSum / source.totalCount) : 0;
      const exposureRate = source.totalCount ? source.visibleCount / source.totalCount : 0;
      const trustScore = clampScore(
        averagePriorityScore * 0.45 +
          exposureRate * 35 +
          (source.officialHost ? 20 : 0) -
          source.hiddenCount * 4 -
          source.failedCount * 6 -
          source.searchLinkCount * 12 -
          source.expiredCount * 8
      );
      const status = trustScore >= 90 && source.searchLinkCount === 0 && source.failedCount === 0
        ? "trusted"
        : trustScore >= 75
          ? "watch"
          : "needs_review";

      return {
        sourceName: source.sourceName,
        provider: source.provider,
        officialHost: source.officialHost,
        totalCount: source.totalCount,
        visibleCount: source.visibleCount,
        hiddenCount: source.hiddenCount,
        failedCount: source.failedCount,
        searchLinkCount: source.searchLinkCount,
        expiredCount: source.expiredCount,
        averagePriorityScore,
        trustScore,
        status,
        lastCheckedAt: source.lastCheckedAt,
        categories: Array.from(source.categories).sort(),
        benefitTypes: Array.from(source.benefitTypes).sort(),
        recommendedAction:
          status === "trusted"
            ? "공식 feed 후보로 우선 유지"
            : source.searchLinkCount > 0
              ? "검색 결과 URL을 공식 상세 URL로 교체"
              : source.expiredCount > 0
                ? "종료 혜택 대체 후보 준비"
                : source.failedCount > 0
                  ? "실패 사유 확인 후 수동 숨김 또는 재검증"
                  : "공식 링크와 혜택 조건을 재확인"
      } satisfies NewsDealSourceTrust;
    })
    .sort((a, b) => b.trustScore - a.trustScore || b.visibleCount - a.visibleCount || a.sourceName.localeCompare(b.sourceName));
}

function readConfiguredFeedUrls(envKeys: readonly string[]) {
  return getEnvFeedUrls(...envKeys);
}

function buildFeedTransitionReadiness(providerStats: ProviderStat[]): FeedTransitionReadiness {
  const statsByProvider = new Map(providerStats.map((stat) => [stat.provider, stat]));
  const providers = feedTransitionProfiles.map((profile) => {
    const stat = statsByProvider.get(profile.provider);
    const feedUrls = readConfiguredFeedUrls(profile.envKeys).length || Number(stat?.feedUrls ?? 0);
    const configured = Boolean(stat?.configured) || feedUrls > 0;
    const visibleCount = Number(stat?.visibleCount ?? 0);
    const seedCount = Number(stat?.seedCount ?? 0);
    const feedItemCount = Number(stat?.feedItemCount ?? 0);
    const feedSuccessCount = Number(stat?.feedSuccessCount ?? 0);
    const collectedCount = Number(stat?.collectedCount ?? stat?.fetchedCount ?? seedCount + feedItemCount);
    const feedItemRate = Math.round((feedItemCount / Math.max(collectedCount, 1)) * 1000) / 10;
    const configuredEmptyFeed = configured && feedUrls > 0 && feedItemCount === 0;
    const issueCount =
      Number(stat?.hiddenCount ?? 0) +
      Number(stat?.failedCount ?? 0) +
      Number(stat?.expiredCount ?? 0) +
      Number(stat?.officialMissingCount ?? 0) +
      Number(stat?.errorCount ?? 0);

    return {
      provider: profile.provider,
      label: profile.label,
      mode: configured ? "external_feed" as const : "seed_fallback" as const,
      modeLabel: configured ? "공식 feed 연결" : "seed fallback",
      configured,
      feedUrls,
      seedCount,
      feedItemCount,
      feedSuccessCount,
      collectedCount,
      feedItemRate,
      configuredEmptyFeed,
      envKeys: [...profile.envKeys],
      acceptedSources: profile.acceptedSources,
      nextAction: configuredEmptyFeed
        ? "feed URL은 연결됐지만 외부 항목이 없습니다. 응답 스키마, RSS/JSON 파서, 공식 상세 URL 승격 결과를 먼저 확인하세요."
        : configured
          ? "연결된 feed의 종료/검색 URL/공식 링크 누락 리포트를 매일 확인하세요."
          : profile.nextAction,
      priority: profile.priority,
      launchBlocking: visibleCount === 0 || issueCount > 0 || (configuredEmptyFeed && seedCount === 0),
      visibleCount,
      issueCount
    };
  });

  const configuredProviders = providers.filter((provider) => provider.configured).length;
  const seedOnlyProviders = providers.length - configuredProviders;
  const configuredFeedUrls = providers.reduce((sum, provider) => sum + provider.feedUrls, 0);
  const seedCount = providers.reduce((sum, provider) => sum + provider.seedCount, 0);
  const feedItemCount = providers.reduce((sum, provider) => sum + provider.feedItemCount, 0);
  const feedSuccessCount = providers.reduce((sum, provider) => sum + provider.feedSuccessCount, 0);
  const collectedCount = providers.reduce((sum, provider) => sum + provider.collectedCount, 0);
  const feedItemRate = Math.round((feedItemCount / Math.max(collectedCount, 1)) * 1000) / 10;
  const configuredEmptyFeedProviders = providers.filter((provider) => provider.configuredEmptyFeed).map((provider) => provider.provider);
  const configuredEmptyFeedCount = configuredEmptyFeedProviders.length;
  const readinessRate = Math.round((configuredProviders / Math.max(providers.length, 1)) * 100);
  const launchBlockingCount = providers.filter((provider) => provider.launchBlocking).length;
  const recommendedNextEnvKeys = providers
    .filter((provider) => !provider.configured)
    .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1))
    .flatMap((provider) => provider.envKeys);
  const status =
    configuredProviders === providers.length
      ? "production_feed_ready"
      : configuredProviders > 0
        ? "hybrid_feed_ready"
        : "seed_launch_ready";
  const label =
    status === "production_feed_ready"
      ? "공식 feed 운영 가능"
      : status === "hybrid_feed_ready"
        ? "부분 feed 전환"
        : "seed fallback 운영";

  return {
    status,
    label,
    readinessRate,
    totalProviders: providers.length,
    configuredProviders,
    seedOnlyProviders,
    configuredFeedUrls,
    seedCount,
    feedItemCount,
    feedSuccessCount,
    collectedCount,
    feedItemRate,
    configuredEmptyFeedCount,
    configuredEmptyFeedProviders,
    launchBlockingCount,
    recommendedNextEnvKeys,
    guardrails: [
      "공식 API/RSS/제휴 JSON feed만 연결합니다.",
      "뉴스·커뮤니티 원문은 출처로만 보관하고 사용자 이동은 공식 이벤트·쿠폰·구매 페이지로 제한합니다.",
      "feed URL이 연결됐는데 외부 항목이 0건이면 seed fallback으로 숨기지 말고 운영 경고로 처리합니다.",
      "검색 결과 URL, 종료 이벤트, 공식 링크 누락 항목은 verify:news와 release:doctor에서 노출 제외합니다."
    ],
    operatorAction: configuredEmptyFeedCount
      ? `${configuredEmptyFeedProviders.join(", ")} feed가 연결됐지만 외부 항목 0건입니다. feed URL, 응답 형식, normalizer를 점검한 뒤 refresh:news를 다시 실행하세요.`
      : recommendedNextEnvKeys.length
      ? `${recommendedNextEnvKeys.slice(0, 3).join(", ")}부터 연결한 뒤 npm run refresh:all && npm run release:doctor를 실행하세요.`
      : "연결된 공식 feed를 유지하면서 매일 refresh:all과 Provider 위험도 CSV를 확인하세요.",
    providers
  };
}

function buildSourceActionQueue(
  providerRisks: ProviderRisk[],
  feedTransitionReadiness: FeedTransitionReadiness,
  sourceRefreshWindows: NonNullable<OfficialBenefitSourceConfig["sourceRefreshWindows"]> = []
): SourceActionQueueItem[] {
  const risksByProvider = new Map(providerRisks.map((risk) => [risk.provider, risk]));
  const windowsByProvider = new Map(sourceRefreshWindows.map((item) => [item.provider ?? "", item]));
  const priorityWeight = { high: 0, medium: 1, low: 2 };
  const statusWeight = { fix_feed: 0, connect_feed: 1, review: 2, healthy: 3 };

  return feedTransitionReadiness.providers
    .map((provider) => {
      const risk = risksByProvider.get(provider.provider);
      const window = windowsByProvider.get(provider.provider);
      const needsFeedConnection = !provider.configured;
      const needsFeedFix = provider.configuredEmptyFeed || provider.launchBlocking || risk?.severity === "danger";
      const needsReview = risk?.severity === "watch" || provider.issueCount > 0;
      const status: SourceActionQueueItem["status"] = needsFeedFix
        ? "fix_feed"
        : needsFeedConnection
          ? "connect_feed"
          : needsReview
            ? "review"
            : "healthy";
      const priority: SourceActionQueueItem["priority"] =
        status === "fix_feed" || (status === "connect_feed" && provider.priority === "high")
          ? "high"
          : status === "review" || status === "connect_feed"
            ? "medium"
            : "low";
      const label =
        status === "fix_feed"
          ? "공식 feed 점검"
          : status === "connect_feed"
            ? "공식 feed 연결"
            : status === "review"
              ? "운영 검토"
              : "정상 유지";
      const reason =
        status === "fix_feed"
          ? risk?.reason ?? "feed 연결 또는 검증 지표에 출시 전 확인이 필요한 신호가 있습니다."
          : status === "connect_feed"
            ? `${provider.acceptedSources} 기준의 공식 feed URL이 아직 연결되지 않았습니다.`
            : status === "review"
              ? risk?.reason ?? "숨김/종료/검증 지표를 운영자가 주기적으로 확인해야 합니다."
              : "공식 feed와 검증 지표가 안정적입니다.";
      const action =
        status === "healthy"
          ? "현재 refresh cadence를 유지하고 종료일/혜택 조건 변경만 확인하세요."
          : provider.nextAction;

      return {
        provider: provider.provider,
        source: provider.label,
        priority,
        status,
        label,
        reason,
        action,
        command:
          status === "connect_feed"
            ? "npm run source:feed-env:doctor && npm run refresh:all"
            : status === "fix_feed"
              ? "npm run refresh:news && npm run verify:news"
              : status === "review"
                ? "npm run daily:operations:report && npm run health:readiness"
                : "npm run refresh:all",
        envKeys: provider.envKeys,
        nextRefreshAt: window?.nextRefreshAt,
        issueCount: provider.issueCount,
        visibleCount: provider.visibleCount
      };
    })
    .sort((a, b) => {
      const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDiff) return priorityDiff;
      const statusDiff = statusWeight[a.status] - statusWeight[b.status];
      if (statusDiff) return statusDiff;
      return b.issueCount - a.issueCount || a.provider.localeCompare(b.provider);
    });
}

export function getNewsOperationsReport() {
  const snapshot = readJson<NewsDealSnapshot>(refreshedNewsDealsPath, {});
  const report = readJson<NewsDealsReport>(newsDealsReportPath, {});
  const refreshAll = readJson<RefreshAllReport>(refreshAllReportPath, {});
  const freshnessReport = readJson<NewsFreshnessReport>(newsFreshnessReportPath, {});
  const feedCanaryReport = readJson<NewsFeedCanaryReport>(newsFeedCanaryReportPath, {});
  const sourceOnboardingPlan = getOfficialSourceOnboardingPlan();
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
  const rawProviderStats = report.providerStats?.length ? report.providerStats : (snapshot.providerStats ?? []);
  const sourceTrustScores = report.sourceTrustScores?.length ? report.sourceTrustScores : buildRuntimeSourceTrustScores(allDeals);
  const providerStats = rawProviderStats.map((stat) => {
    const feedUrls = Number(stat.feedUrls ?? 0);
    const feedItemCount = Number(stat.feedItemCount ?? 0);

    return {
      ...stat,
      feedUrls,
      seedCount: Number(stat.seedCount ?? 0),
      feedItemCount,
      feedSuccessCount: Number(stat.feedSuccessCount ?? 0),
      collectedCount: Number(stat.collectedCount ?? stat.fetchedCount ?? 0),
      configuredEmptyFeed: Boolean(stat.configured) && feedUrls > 0 && feedItemCount === 0
    };
  });
  const providerRisks = providerStats.map(getProviderRisk);
  const feedTransitionReadiness = buildFeedTransitionReadiness(providerStats);
  const providerRiskSummary = {
    healthy: providerRisks.filter((risk) => risk.severity === "healthy").length,
    watch: providerRisks.filter((risk) => risk.severity === "watch").length,
    danger: providerRisks.filter((risk) => risk.severity === "danger").length
  };
  const canarySeedFallbackReady =
    !existsSync(newsFeedCanaryReportPath) &&
    feedTransitionReadiness.configuredFeedUrls === 0 &&
    visibleDeals.length >= 70 &&
    providerRiskSummary.danger === 0;
  const effectiveFeedCanaryReport: NewsFeedCanaryReport = canarySeedFallbackReady
    ? {
        ...feedCanaryReport,
        ok: true,
        generatedAt: snapshot.generatedAt ?? report.generatedAt ?? new Date().toISOString(),
        status: "seed_fallback_only",
        freshnessStatus: "fresh",
        staleHours: newsRefreshStaleHours,
        providerCount: feedTransitionReadiness.totalProviders,
        configuredProviderCount: 0,
        configuredFeedUrls: 0,
        totalFetchedCount: visibleDeals.length,
        visibleCandidateCount: 0,
        hiddenCandidateCount: 0,
        errorCount: 0,
        configuredEmptyFeedCount: 0,
        officialLinkPromotedCount: 0,
        failedProviders: [],
        nextActions: ["공식 feed URL이 연결되기 전까지 검증된 배포 스냅샷으로 무료혜택을 노출합니다."]
      }
    : feedCanaryReport;
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
  const feedCanaryFreshness = {
    ...getNewsFreshnessState(effectiveFeedCanaryReport.generatedAt),
    command: "npm run news:feed:canary && npm run health:readiness"
  };
  const renewalQueue = attachReplacementCandidates((freshnessReport.renewalQueue ?? []).slice(0, 12), sourceOnboardingPlan.queue);
  const watchQueue = attachReplacementCandidates((freshnessReport.watchQueue ?? []).slice(0, 20), sourceOnboardingPlan.queue, 2);
  const freshnessNextActions = freshnessReport.nextActions ?? [];
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
    ...(renewalQueue.length
      ? [
          {
            priority: "medium",
            title: "14일 내 종료 혜택 대체 준비",
            description: `${renewalQueue.length}개 공식 혜택이 14일 이내 종료됩니다. 공식 소스 후보에서 같은 카테고리 대체 혜택을 준비하세요.`,
            command: "npm run source:onboarding:plan && npm run refresh:news"
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
    ...(freshness.status === "due" ? ["뉴스 혜택 리포트 정기 갱신 시간이 지나 refresh:all 실행 권장"] : []),
    ...(effectiveFeedCanaryReport.ok === false ? ["공식 feed canary가 실패하여 연결 feed URL과 노출 후보를 점검해야 합니다."] : []),
    ...(feedCanaryFreshness.releaseBlocking ? ["공식 feed canary 리포트가 24시간 이상 갱신되지 않아 news:feed:canary 실행 필요"] : []),
    ...(feedCanaryFreshness.status === "due" ? ["공식 feed canary 정기 갱신 시간이 지나 news:feed:canary 실행 권장"] : []),
    ...(renewalQueue.length ? [`14일 이내 종료되는 공식 혜택 ${renewalQueue.length}개가 있어 대체 공식 혜택 후보 준비 필요`] : [])
  ];
  const feedCanary = {
    ok: effectiveFeedCanaryReport.ok === true && !feedCanaryFreshness.releaseBlocking,
    generatedAt: feedCanaryFreshness.generatedAt,
    status: effectiveFeedCanaryReport.status ?? "missing",
    freshnessStatus: feedCanaryFreshness.status,
    freshnessLabel: feedCanaryFreshness.label,
    ageHours: feedCanaryFreshness.ageHours,
    cadenceHours: feedCanaryFreshness.cadenceHours,
    staleHours: feedCanaryFreshness.staleHours,
    nextRefreshDueAt: feedCanaryFreshness.nextRefreshDueAt,
    staleAfterAt: feedCanaryFreshness.staleAfterAt,
    releaseBlocking: feedCanaryFreshness.releaseBlocking,
    providerCount: Number(effectiveFeedCanaryReport.providerCount ?? 0),
    configuredProviderCount: Number(effectiveFeedCanaryReport.configuredProviderCount ?? 0),
    configuredFeedUrls: Number(effectiveFeedCanaryReport.configuredFeedUrls ?? 0),
    totalFetchedCount: Number(effectiveFeedCanaryReport.totalFetchedCount ?? 0),
    visibleCandidateCount: Number(effectiveFeedCanaryReport.visibleCandidateCount ?? 0),
    hiddenCandidateCount: Number(effectiveFeedCanaryReport.hiddenCandidateCount ?? 0),
    errorCount: Number(effectiveFeedCanaryReport.errorCount ?? 0),
    configuredEmptyFeedCount: Number(effectiveFeedCanaryReport.configuredEmptyFeedCount ?? 0),
    officialLinkPromotedCount: Number(effectiveFeedCanaryReport.officialLinkPromotedCount ?? 0),
    failedProviders: Array.isArray(effectiveFeedCanaryReport.failedProviders) ? effectiveFeedCanaryReport.failedProviders : [],
    nextActions: Array.isArray(effectiveFeedCanaryReport.nextActions)
      ? effectiveFeedCanaryReport.nextActions.slice(0, 5)
      : ["npm run news:feed:canary 실행 후 공식 feed 연결 상태를 다시 확인하세요."]
  };
  const operationGeneratedAt = report.generatedAt ?? snapshot.generatedAt ?? new Date().toISOString();
  const operationGeneratedAtMs = Date.parse(operationGeneratedAt);
  const refreshBaseTime = Number.isFinite(operationGeneratedAtMs) ? operationGeneratedAtMs : Date.now();
  const buildNextRefreshAt = (minutes = 360) => new Date(refreshBaseTime + minutes * 60_000).toISOString();
  const fallbackSourceConfig = {
    configFile: "data/officialBenefitFeedSources.json",
    configuredSources: feedTransitionReadiness.totalProviders,
    enabledProviders: feedTransitionReadiness.providers.map((provider) => provider.provider),
    envKeys: feedTransitionReadiness.providers.flatMap((provider) => provider.envKeys),
    categories: requiredNewsCategories.map((item) => item.category),
    benefitTypes: [],
    recommendedQueries: ["무료 쿠폰", "공식 이벤트", "마트 행사", "편의점 1+1", "배달 쿠폰", "카드 혜택", "문화 초대권", "공공 혜택"],
    targetSections: ["오늘의 무료", "쿠폰", "마트 행사", "편의점 1+1", "배달 쿠폰", "카드 혜택"],
    operatorOwners: ["benefit-ops", "commerce-ops", "event-ops"],
    minimumRefreshCadenceMinutes: 180,
    nextRefreshAt: buildNextRefreshAt(180),
    sourceRefreshWindows: feedTransitionReadiness.providers.map((provider) => {
      const refreshCadenceMinutes = provider.priority === "high" ? 180 : 360;
      return {
        provider: provider.provider,
        source: provider.label,
        operatorOwner: "benefit-ops",
        launchPriority: provider.priority,
        refreshCadenceMinutes,
        nextRefreshAt: buildNextRefreshAt(refreshCadenceMinutes),
        targetSections: [],
        envKeys: provider.envKeys,
        status: refreshCadenceMinutes <= 180 ? "near_realtime" : "standard",
        operatorAction: "공식 feed 연결 상태와 혜택 조건을 재확인합니다."
      };
    }),
    highPrioritySources: feedTransitionReadiness.providers.filter((provider) => provider.priority === "high").length,
    sourceOperations: feedTransitionReadiness.providers.map((provider) => ({
      provider: provider.provider,
      source: provider.label,
      operatorOwner: "benefit-ops",
      launchPriority: provider.priority,
      refreshCadenceMinutes: provider.priority === "high" ? 180 : 360,
      nextRefreshAt: buildNextRefreshAt(provider.priority === "high" ? 180 : 360),
      targetSections: [],
      qualityChecklist: ["officialFinalUrl", "endDate", "benefitConditions"],
      envKeys: provider.envKeys
    })),
    guardrails: feedTransitionReadiness.guardrails
  } satisfies OfficialBenefitSourceConfig;
  const sourceConfig = report.sourceConfig ?? fallbackSourceConfig;
  const sourceActionQueue = buildSourceActionQueue(providerRisks, feedTransitionReadiness, sourceConfig.sourceRefreshWindows ?? []);

  return {
    ok: report.ok !== false && refreshAll.ok !== false && !freshness.releaseBlocking && feedCanary.ok,
    generatedAt: operationGeneratedAt,
    snapshotSource: snapshot.source ?? "seed",
    totalCount: report.totalCount ?? allDeals.length,
    visibleCount: visibleDeals.length,
    hiddenCount: (report.hiddenCount ?? hiddenByReport.length) + manualHiddenDeals.length,
    expiredCount: report.expiredCount ?? 0,
    officialMissingCount: report.officialMissingCount ?? 0,
    failedCount: (report.failedCount ?? hiddenByReport.length) + manualHiddenDeals.length,
    categoryCoverage,
    freshness,
    freshnessQueues: {
      reportGeneratedAt: freshnessReport.generatedAt ?? "",
      expiringWithin14DaysCount: freshnessReport.expiringWithin14DaysCount ?? renewalQueue.length,
      expiringWithin30DaysCount: freshnessReport.expiringWithin30DaysCount ?? watchQueue.length,
      renewalQueue,
      watchQueue,
      nextActions: freshnessNextActions
    },
    feedCanary,
    operatorNextActions,
    operationalRisks: operationalRisks.length ? operationalRisks : ["공식 혜택 노출 기준, 카테고리 커버리지, refresh:all 상태가 정상입니다."],
    providerStats,
    sourceTrustScores,
    providerRisks,
    providerRiskSummary,
    feedTransitionReadiness,
    sourceConfig,
    sourceActionQueue,
    failureReasonTop10,
    policyRegression: report.gates?.policyRegression ?? {
      ok: false,
      total: 0,
      passed: 0,
      visiblePositiveSamples: 0,
      blockedNegativeSamples: 0,
      results: []
    },
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

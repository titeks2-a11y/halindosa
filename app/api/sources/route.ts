import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { getEnvFeedUrls } from "@/lib/deals/feedUrls";
import { getNewsOperationsReport } from "@/lib/deals/newsOperations";
import { getConfiguredProductionFeedUrls } from "@/lib/deals/providers/productionProvider";
import { getDealSourceReadiness, listDealSourceProfiles } from "@/lib/deals/trust";
import officialSourceCatalog from "@/data/officialSourceCatalog.json";

const requiredOfficialBenefitCategories = [
  "식품/생필품",
  "마트/편의점",
  "디지털/가전",
  "패션/뷰티",
  "외식/배달",
  "여행/숙박",
  "영화/문화",
  "카드/멤버십",
  "무료혜택",
  "정부/공공혜택"
];

type SourcesPayload = {
  ok: boolean;
  activeMode: string;
  currentSource: string;
  updatedAt: string;
  sources: unknown[];
  readiness: unknown[];
  officialBenefitProviderReadiness: {
    summary: unknown;
    providers: unknown[];
    nextActions: unknown[];
  };
  officialBenefitFeedTransitionReadiness: {
    status: string;
    label: string;
    readinessRate: number;
    configuredProviders: number;
    seedOnlyProviders: number;
    totalProviders: number;
    configuredFeedUrls: number;
    seedCount: number;
    feedItemCount: number;
    feedSuccessCount: number;
    collectedCount: number;
    feedItemRate: number;
    configuredEmptyFeedCount: number;
    configuredEmptyFeedProviders: string[];
    recommendedNextEnvKeys: string[];
    operatorAction: string;
    guardrails: string[];
    providers: Array<{
      provider: string;
      label: string;
      mode: string;
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
      priority: string;
      visibleCount: number;
      issueCount: number;
    }>;
  };
  officialSourceCatalog: ReturnType<typeof getOfficialSourceCatalogSummary>;
  operationPolicy: unknown;
  message: string;
};

function toList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(" | ");
  if (value == null) return "";
  return String(value);
}

function getHost(value: unknown) {
  if (typeof value !== "string") return "";

  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function csvEscape(value: unknown) {
  const text = toList(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildCsv(rows: Array<Record<string, unknown>>) {
  const headers = [
    "section",
    "id",
    "label",
    "provider",
    "category",
    "sourceType",
    "priority",
    "officialUrl",
    "host",
    "refreshCadenceHours",
    "preferredEnvKeys",
    "configuredFeedUrls",
    "allowedUse",
    "blockedUse",
    "status",
    "mode",
    "modeLabel",
    "seedCount",
    "feedItemCount",
    "feedSuccessCount",
    "collectedCount",
    "feedItemRate",
    "configuredEmptyFeed",
    "visibleCount",
    "issueCount",
    "readinessRate",
    "nextAction",
    "operatorAction"
  ];

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
}

function buildSourcesCsv(payload: SourcesPayload) {
  const catalogRows = payload.officialSourceCatalog.sources.map((source) => ({
    section: "source_catalog",
    id: source.id,
    label: source.label,
    provider: source.provider,
    category: source.category,
    sourceType: source.sourceType,
    priority: source.priority,
    officialUrl: source.officialUrl,
    host: getHost(source.officialUrl),
    refreshCadenceHours: source.refreshCadenceHours,
    preferredEnvKeys: source.preferredEnvKeys,
    configuredFeedUrls: source.configuredFeedUrls,
    allowedUse: source.allowedUse,
    blockedUse: source.blockedUse,
    nextAction:
      source.configuredFeedUrls > 0
        ? "연결된 공식 feed를 refresh:news와 verify:news로 검증"
        : `${source.preferredEnvKeys.join(" 또는 ")}에 승인 feed URL 연결`
  }));

  const transitionRows = payload.officialBenefitFeedTransitionReadiness.providers.map((provider) => ({
    section: "feed_transition",
    id: provider.provider,
    label: provider.label,
    provider: provider.provider,
    priority: provider.priority,
    configuredFeedUrls: provider.feedUrls,
    preferredEnvKeys: provider.envKeys,
    allowedUse: provider.acceptedSources,
    status: payload.officialBenefitFeedTransitionReadiness.status,
    mode: provider.mode,
    modeLabel: provider.modeLabel,
    seedCount: provider.seedCount,
    feedItemCount: provider.feedItemCount,
    feedSuccessCount: provider.feedSuccessCount,
    collectedCount: provider.collectedCount,
    feedItemRate: provider.feedItemRate,
    configuredEmptyFeed: provider.configuredEmptyFeed,
    visibleCount: provider.visibleCount,
    issueCount: provider.issueCount,
    readinessRate: payload.officialBenefitFeedTransitionReadiness.readinessRate,
    nextAction: provider.nextAction,
    operatorAction: payload.officialBenefitFeedTransitionReadiness.operatorAction
  }));

  const nextActionRows = payload.officialSourceCatalog.nextActions.map((action, index) => ({
    section: "next_action",
    id: `next_${index + 1}`,
    label: action,
    status: payload.officialBenefitFeedTransitionReadiness.status,
    readinessRate: payload.officialBenefitFeedTransitionReadiness.readinessRate,
    operatorAction: payload.officialBenefitFeedTransitionReadiness.operatorAction
  }));

  return buildCsv([...catalogRows, ...transitionRows, ...nextActionRows]);
}

function getOfficialSourceCatalogSummary() {
  const providerCounts = new Map<string, number>();
  const categoryCounts = new Map(requiredOfficialBenefitCategories.map((category) => [category, 0]));
  const configuredEnvKeys = new Set<string>();

  for (const source of officialSourceCatalog) {
    providerCounts.set(source.provider, (providerCounts.get(source.provider) ?? 0) + 1);
    for (const category of source.category) {
      if (categoryCounts.has(category)) {
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      }
    }
    for (const key of source.preferredEnvKeys) {
      if (getEnvFeedUrls(key).length) configuredEnvKeys.add(key);
    }
  }

  const missingCategories = requiredOfficialBenefitCategories.filter((category) => Number(categoryCounts.get(category) ?? 0) === 0);
  const thinCategories = requiredOfficialBenefitCategories.filter((category) => {
    const count = Number(categoryCounts.get(category) ?? 0);
    return count > 0 && count < 2;
  });
  const nextAction = configuredEnvKeys.size
    ? "연결된 공식 feed를 refresh:news와 verify:news로 검증하세요."
    : "OFFICIAL_EVENT_FEED_URLS와 PUBLIC_COUPON_FEED_URLS부터 승인 JSON/RSS feed를 연결하세요.";
  const nextActions = [
    nextAction,
    "CSV를 스프레드시트로 열어 우선순위 high 후보부터 공식 feed 연결 여부를 결정하세요.",
    "새 후보를 추가할 때는 공식 URL, 허용 사용 범위, 차단 사용 범위, env key를 함께 기록하세요."
  ];

  return {
    totalSources: officialSourceCatalog.length,
    highPrioritySources: officialSourceCatalog.filter((source) => source.priority === "high").length,
    configuredEnvKeys: Array.from(configuredEnvKeys).sort(),
    configuredEnvKeyCount: configuredEnvKeys.size,
    categoryCoverage: Object.fromEntries(Array.from(categoryCounts.entries())),
    missingCategories,
    thinCategories,
    providerCoverage: Object.fromEntries(Array.from(providerCounts.entries()).sort(([a], [b]) => a.localeCompare(b))),
    sources: officialSourceCatalog.map((source) => ({
      id: source.id,
      label: source.label,
      provider: source.provider,
      category: source.category,
      sourceType: source.sourceType,
      officialUrl: source.officialUrl,
      host: getHost(source.officialUrl),
      preferredEnvKeys: source.preferredEnvKeys,
      priority: source.priority,
      refreshCadenceHours: source.refreshCadenceHours,
      configuredFeedUrls: source.preferredEnvKeys.reduce((sum, key) => {
        return sum + getEnvFeedUrls(key).length;
      }, 0),
      allowedUse: source.allowedUse,
      blockedUse: source.blockedUse,
      notes: source.notes
    })),
    nextAction,
    nextActions,
    reportCommand: "npm run source:catalog:report"
  };
}

async function buildSourcesPayload(): Promise<SourcesPayload> {
  const { deals, source, updatedAt } = await getDeals();
  const profiles = listDealSourceProfiles();
  const readiness = getDealSourceReadiness(deals);
  const newsOperations = getNewsOperationsReport();
  const counts = new Map<string, number>();
  const configuredProductionFeeds = getConfiguredProductionFeedUrls().length;
  const officialBenefitFeedTransition = newsOperations.feedTransitionReadiness;

  for (const deal of deals) {
    counts.set(deal.source, (counts.get(deal.source) ?? 0) + 1);
  }

  return {
    ok: true,
    activeMode: process.env.DEAL_DATA_MODE ?? process.env.DEAL_PROVIDER ?? "mock",
    currentSource: source,
    updatedAt,
    sources: profiles.map((profile) => ({
      ...profile,
      dealCount: counts.get(profile.key) ?? 0,
      readiness: readiness.find((item) => item.key === profile.key) ?? null
    })),
    readiness,
    officialBenefitProviderReadiness: {
      summary: newsOperations.providerRiskSummary,
      providers: newsOperations.providerRisks.map((risk) => ({
        provider: risk.provider,
        source: risk.source,
        severity: risk.severity,
        label: risk.label,
        reason: risk.reason,
        action: risk.action,
        visibleCount: risk.visibleCount,
        issueCount: risk.issueCount
      })),
      nextActions: newsOperations.providerRisks
        .filter((risk) => risk.severity !== "healthy")
        .slice(0, 5)
        .map((risk) => ({
          provider: risk.provider,
          severity: risk.severity,
          action: risk.action
        }))
    },
    officialBenefitFeedTransitionReadiness: {
      status: officialBenefitFeedTransition.status,
      label: officialBenefitFeedTransition.label,
      readinessRate: officialBenefitFeedTransition.readinessRate,
      configuredProviders: officialBenefitFeedTransition.configuredProviders,
      seedOnlyProviders: officialBenefitFeedTransition.seedOnlyProviders,
      totalProviders: officialBenefitFeedTransition.totalProviders,
      configuredFeedUrls: officialBenefitFeedTransition.configuredFeedUrls,
      seedCount: officialBenefitFeedTransition.seedCount,
      feedItemCount: officialBenefitFeedTransition.feedItemCount,
      feedSuccessCount: officialBenefitFeedTransition.feedSuccessCount,
      collectedCount: officialBenefitFeedTransition.collectedCount,
      feedItemRate: officialBenefitFeedTransition.feedItemRate,
      configuredEmptyFeedCount: officialBenefitFeedTransition.configuredEmptyFeedCount,
      configuredEmptyFeedProviders: officialBenefitFeedTransition.configuredEmptyFeedProviders,
      recommendedNextEnvKeys: officialBenefitFeedTransition.recommendedNextEnvKeys,
      operatorAction: officialBenefitFeedTransition.operatorAction,
      guardrails: officialBenefitFeedTransition.guardrails,
      providers: officialBenefitFeedTransition.providers.map((provider) => ({
        provider: provider.provider,
        label: provider.label,
        mode: provider.mode,
        modeLabel: provider.modeLabel,
        configured: provider.configured,
        feedUrls: provider.feedUrls,
        seedCount: provider.seedCount,
        feedItemCount: provider.feedItemCount,
        feedSuccessCount: provider.feedSuccessCount,
        collectedCount: provider.collectedCount,
        feedItemRate: provider.feedItemRate,
        configuredEmptyFeed: provider.configuredEmptyFeed,
        envKeys: provider.envKeys,
        acceptedSources: provider.acceptedSources,
        nextAction: provider.nextAction,
        priority: provider.priority,
        visibleCount: provider.visibleCount,
        issueCount: provider.issueCount
      }))
    },
    officialSourceCatalog: getOfficialSourceCatalogSummary(),
    operationPolicy: {
      configuredProductionFeeds,
      configuredOfficialBenefitFeeds: officialBenefitFeedTransition.configuredFeedUrls,
      officialBenefitSeedOnlyProviders: officialBenefitFeedTransition.seedOnlyProviders,
      allowedSources: ["공식 API", "RSS", "제휴 피드", "허용된 파트너 JSON"],
      blockedSources: ["약관이 불명확한 크롤링", "커뮤니티 원문 단독 구매 링크", "검색 결과를 상세 링크처럼 표시"],
      officialBenefitProviderRiskOk: newsOperations.providerRiskSummary.danger === 0,
      nextStep: configuredProductionFeeds
        ? "production 피드는 dry-run 검증 후 유효한 상품·혜택 상세 URL만 노출합니다."
        : `${officialBenefitFeedTransition.operatorAction} 상품 피드는 DEAL_PRODUCTION_FEED_URLS에 공식 API, RSS 변환 JSON, 제휴 피드 URL을 연결한 뒤 dry-run 검증을 실행하세요.`
    },
    message: "할인도사 데이터 공급원 상태를 불러왔습니다."
  };
}

export async function GET(request: Request) {
  const payload = await buildSourcesPayload();
  const format = new URL(request.url).searchParams.get("format")?.toLowerCase();

  if (format === "csv") {
    return new NextResponse(`\uFEFF${buildSourcesCsv(payload)}\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-source-readiness-${payload.updatedAt.slice(0, 10)}.csv"`,
        "Cache-Control": "no-store"
      }
    });
  }

  return NextResponse.json(payload);
}

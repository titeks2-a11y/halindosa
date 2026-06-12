import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceReadinessGate = {
  name: string;
  ok: boolean;
  status: "passed" | "failed" | string;
  detail: string;
  action: string;
};

export type SourceReadinessEnvPlan = {
  envKey: string;
  status: string;
  configuredFeedUrls: number;
  candidateCount: number;
  reachableCandidates: number;
  guardedCandidates: number;
  nextAction: string;
};

export type SourceReadinessRiskSource = {
  id: string;
  label: string;
  provider: string;
  officialUrl?: string;
  finalUrl?: string;
  reason?: string;
  httpStatus?: number;
  status: string;
  operatorAction: string;
};

export type SourceReadinessReport = {
  ok: boolean;
  generatedAt: string;
  readinessLabel: string;
  launchGateStatus: "passed" | "blocked" | string;
  summary: {
    officialSourceCandidates: number;
    highPrioritySources: number;
    reachableSources: number;
    guardedSources: number;
    blockedLiveIssues: number;
    configuredFeedUrls: number;
    feedEnvConfiguredUrlCount: number;
    feedEnvFailedCount: number;
    policyRegressionFailures: number;
    visibleOfficialBenefits: number;
    hiddenOfficialBenefits: number;
    expiredOfficialBenefits: number;
    newsFailedCount: number;
    refreshAllOk: boolean;
    productDealsCount: number;
    newsDealsCount: number;
    consumerBenefitSourceCount: number;
    consumerSourceRate: number;
    highPriorityConsumerSourceCount: number;
    publicPolicySourceCount: number;
    publicPolicySourceRate: number;
    publicPolicyDefaultHandling: string;
  };
  gates: SourceReadinessGate[];
  envPlan: SourceReadinessEnvPlan[];
  riskySources: SourceReadinessRiskSource[];
  operatorNextActions: string[];
  commands: string[];
};

const fallbackReport: SourceReadinessReport = {
  ok: false,
  generatedAt: "",
  readinessLabel: "통합 준비도 리포트 생성 필요",
  launchGateStatus: "blocked",
  summary: {
    officialSourceCandidates: 0,
    highPrioritySources: 0,
    reachableSources: 0,
    guardedSources: 0,
    blockedLiveIssues: 0,
    configuredFeedUrls: 0,
    feedEnvConfiguredUrlCount: 0,
    feedEnvFailedCount: 0,
    policyRegressionFailures: 0,
    visibleOfficialBenefits: 0,
    hiddenOfficialBenefits: 0,
    expiredOfficialBenefits: 0,
    newsFailedCount: 0,
    refreshAllOk: false,
    productDealsCount: 0,
    newsDealsCount: 0,
    consumerBenefitSourceCount: 0,
    consumerSourceRate: 0,
    highPriorityConsumerSourceCount: 0,
    publicPolicySourceCount: 0,
    publicPolicySourceRate: 0,
    publicPolicyDefaultHandling: "excluded_from_default_home_and_freebies_unless_explicitly_requested"
  },
  gates: [
    {
      name: "source readiness report",
      ok: false,
      status: "failed",
      detail: "reports/source-readiness.json 파일이 없습니다.",
      action: "npm run source:readiness:report를 실행하세요."
    }
  ],
  envPlan: [],
  riskySources: [],
  operatorNextActions: ["npm run source:readiness:report 실행 후 공식 소스 통합 준비도를 확인합니다."],
  commands: ["npm run source:readiness:report"]
};

type RuntimeSourceLiveSnapshot = {
  generatedAt?: string;
  totalSources?: number;
  reachableCount?: number;
  guardedCount?: number;
  needsReviewCount?: number;
  timeoutCount?: number;
  networkErrorCount?: number;
  staleOrRemovedCount?: number;
  highPrioritySources?: number;
  highPriorityReachableOrGuarded?: number;
  guardedSources?: SourceReadinessRiskSource[];
};

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function getHost(value?: string) {
  try {
    return new URL(String(value ?? "")).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function buildSnapshotFallbackReport(): SourceReadinessReport {
  const catalog = readJson<Array<Record<string, unknown>>>(join(process.cwd(), "data", "officialSourceCatalog.json"), []);
  const liveSnapshot = readJson<RuntimeSourceLiveSnapshot>(join(process.cwd(), "data", "officialSourceLiveSnapshot.json"), {});
  const snapshot = readJson<{ generatedAt?: string; deals?: Array<Record<string, unknown>> }>(join(process.cwd(), "data", "refreshedNewsDeals.json"), {});
  const deals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
  const visible = deals.filter((deal) =>
    deal.publishable !== false &&
    deal.availability === "active" &&
    deal.validationStatus === "passed" &&
    Boolean(deal.finalUrl) &&
    Number(deal.qualityScore ?? 0) >= 70
  );
  const visibleHosts = new Set(visible.map((deal) => getHost(String(deal.finalUrl ?? ""))).filter(Boolean));
  const publicPolicyCount = visible.filter((deal) => /정부|공공|문화|교육|K-MOOC|복지/i.test(String(deal.category ?? deal.sourceName ?? ""))).length;
  const consumerSourceCount = Math.max(0, visible.length - publicPolicyCount);
  const consumerSourceRate = visible.length ? Math.round((consumerSourceCount / visible.length) * 100) : 0;
  const publicPolicySourceRate = visible.length ? Math.round((publicPolicyCount / visible.length) * 100) : 0;
  const highPrioritySources = catalog.filter((source) => source.priority === "high").length;
  const liveTotalSources = Number(liveSnapshot.totalSources ?? 0);
  const liveReachableSources = Number(liveSnapshot.reachableCount ?? 0);
  const liveGuardedSources = Number(liveSnapshot.guardedCount ?? 0);
  const liveStaleSources = Number(liveSnapshot.staleOrRemovedCount ?? 0);
  const hasLiveRuntimeSnapshot = liveTotalSources >= Math.max(1, catalog.length);
  const officialSourceCandidates = Math.max(catalog.length, liveTotalSources);
  const reachableSources = hasLiveRuntimeSnapshot ? liveReachableSources : visibleHosts.size;
  const guardedSources = hasLiveRuntimeSnapshot ? liveGuardedSources : 0;
  const ok = officialSourceCandidates >= 150 && visible.length >= 100 && reachableSources >= 70 && publicPolicySourceRate <= 35 && liveStaleSources === 0;
  const gates: SourceReadinessGate[] = [
    {
      name: "official source catalog snapshot",
      ok: officialSourceCandidates >= 150,
      status: officialSourceCandidates >= 150 ? "passed" : "failed",
      detail: `배포 스냅샷 공식 소스 후보 ${officialSourceCandidates}개`,
      action: "data/officialSourceCatalog.json에 공식 소스 후보를 유지하세요."
    },
    {
      name: "official source live snapshot",
      ok: reachableSources >= 70 && liveStaleSources === 0,
      status: reachableSources >= 70 && liveStaleSources === 0 ? "passed" : "failed",
      detail: hasLiveRuntimeSnapshot
        ? `배포 live 스냅샷 접근 가능 ${reachableSources}개, 보호 ${guardedSources}개, 교체 필요 ${liveStaleSources}개`
        : `live 스냅샷 없음, 노출 혜택 호스트 ${reachableSources}개로 대체 확인`,
      action: "npm run source:live:doctor를 실행해 data/officialSourceLiveSnapshot.json을 갱신하세요."
    },
    {
      name: "visible official benefit snapshot",
      ok: visible.length >= 100,
      status: visible.length >= 100 ? "passed" : "failed",
      detail: `배포 스냅샷 검증 혜택 ${visible.length}개`,
      action: "npm run refresh:news 또는 npm run refresh:benefits로 공식 혜택 스냅샷을 갱신하세요."
    },
    {
      name: "official host diversity snapshot",
      ok: visibleHosts.size >= 70,
      status: visibleHosts.size >= 70 ? "passed" : "failed",
      detail: `공식 혜택 호스트 ${visibleHosts.size}개`,
      action: "브랜드/멤버십/쿠폰/샘플 공식 소스를 더 넓히세요."
    },
    {
      name: "consumer-first source mix",
      ok: publicPolicySourceRate <= 35,
      status: publicPolicySourceRate <= 35 ? "passed" : "failed",
      detail: `소비자 혜택 ${consumerSourceRate}%, 공공성 혜택 ${publicPolicySourceRate}%`,
      action: "공공성 혜택은 명시 필터에서만 우선 노출하고 홈 기본 피드는 소비자 혜택을 유지하세요."
    }
  ];

  return {
    ...fallbackReport,
    ok,
    generatedAt: liveSnapshot.generatedAt ?? snapshot.generatedAt ?? "",
    readinessLabel: ok
      ? hasLiveRuntimeSnapshot
        ? "seed launch ready / 배포 live 스냅샷 기준 공식 혜택 준비"
        : "seed launch ready / 배포 카탈로그 스냅샷 기준 공식 혜택 준비"
      : "배포 스냅샷 점검 필요",
    launchGateStatus: ok ? "passed" : "blocked",
    summary: {
      ...fallbackReport.summary,
      officialSourceCandidates,
      highPrioritySources,
      reachableSources,
      guardedSources,
      blockedLiveIssues: liveStaleSources,
      configuredFeedUrls: 0,
      feedEnvConfiguredUrlCount: 0,
      feedEnvFailedCount: 0,
      policyRegressionFailures: 0,
      visibleOfficialBenefits: visible.length,
      hiddenOfficialBenefits: 0,
      expiredOfficialBenefits: deals.filter((deal) => deal.availability === "expired").length,
      newsFailedCount: 0,
      refreshAllOk: visible.length >= 100,
      productDealsCount: 0,
      newsDealsCount: visible.length,
      consumerBenefitSourceCount: consumerSourceCount,
      consumerSourceRate,
      highPriorityConsumerSourceCount: Math.min(highPrioritySources, consumerSourceCount),
      publicPolicySourceCount: publicPolicyCount,
      publicPolicySourceRate
    },
    gates,
    riskySources: Array.isArray(liveSnapshot.guardedSources) ? liveSnapshot.guardedSources.slice(0, 8) : [],
    operatorNextActions: [
      "운영 feed URL이 연결되기 전에는 data/refreshedNewsDeals.json, data/officialSourceCatalog.json, data/officialSourceLiveSnapshot.json 배포 스냅샷을 기준으로 health를 판단합니다.",
      "공식 JSON/RSS/Atom feed가 준비되면 Vercel 환경변수 OFFICIAL_EVENT_FEED_URLS 또는 BENEFIT_REFRESH_FEED_URLS에 연결하세요."
    ],
    commands: [
      "npm run source:readiness:report",
      "npm run refresh:benefits",
      "npm run verify:benefits"
    ]
  };
}

export function getOfficialSourceReadiness(): SourceReadinessReport {
  const reportPath = join(process.cwd(), "reports", "source-readiness.json");
  if (!existsSync(reportPath)) return buildSnapshotFallbackReport();

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<SourceReadinessReport>;

    return {
      ...fallbackReport,
      ...report,
      summary: {
        ...fallbackReport.summary,
        ...(report.summary ?? {})
      },
      gates: Array.isArray(report.gates) ? report.gates : fallbackReport.gates,
      envPlan: Array.isArray(report.envPlan) ? report.envPlan : [],
      riskySources: Array.isArray(report.riskySources) ? report.riskySources : [],
      operatorNextActions: Array.isArray(report.operatorNextActions) ? report.operatorNextActions : fallbackReport.operatorNextActions,
      commands: Array.isArray(report.commands) ? report.commands : fallbackReport.commands
    };
  } catch {
    return {
      ...fallbackReport,
      readinessLabel: "통합 준비도 리포트 파싱 실패",
      gates: [
        {
          name: "source readiness report",
          ok: false,
          status: "failed",
          detail: "reports/source-readiness.json 파싱에 실패했습니다.",
          action: "npm run source:readiness:report를 다시 실행하세요."
        }
      ]
    };
  }
}

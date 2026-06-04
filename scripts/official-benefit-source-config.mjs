import { readJson } from "./news-deal-utils.mjs";

const defaultProviderSpecs = [
  { provider: "news", source: "approved_news_feed", seed: true, env: ["DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS"] },
  { provider: "event_news", source: "official_event_news_feed", seed: true, env: ["DEAL_EVENT_NEWS_FEED_URLS"] },
  { provider: "official_event", source: "official_event_page_feed", seed: true, env: ["OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"] },
  { provider: "public_coupon", source: "public_coupon_and_culture_benefit_feed", seed: true, env: ["PUBLIC_COUPON_FEED_URLS"] }
];

export const officialBenefitSourceConfigPath = "data/officialBenefitFeedSources.json";

export function normalizeOfficialBenefitProviderSpec(spec) {
  const refreshCadenceMinutes = Number(spec.refreshCadenceMinutes ?? 360);
  const launchPriority = String(spec.launchPriority ?? "medium").trim();

  return {
    id: String(spec.id ?? spec.provider ?? "").trim(),
    provider: String(spec.provider ?? "").trim(),
    source: String(spec.source ?? spec.provider ?? "").trim(),
    enabled: spec.enabled !== false,
    seed: spec.seed !== false,
    env: Array.isArray(spec.env) ? spec.env.filter((key) => typeof key === "string" && key.trim()) : [],
    categories: Array.isArray(spec.categories) ? spec.categories.filter(Boolean) : [],
    benefitTypes: Array.isArray(spec.benefitTypes) ? spec.benefitTypes.filter(Boolean) : [],
    recommendedQueries: Array.isArray(spec.recommendedQueries) ? spec.recommendedQueries.filter(Boolean) : [],
    targetSections: Array.isArray(spec.targetSections) ? spec.targetSections.filter(Boolean) : [],
    operatorOwner: String(spec.operatorOwner ?? "benefit-ops").trim(),
    launchPriority: ["high", "medium", "low"].includes(launchPriority) ? launchPriority : "medium",
    refreshCadenceMinutes: Number.isFinite(refreshCadenceMinutes) && refreshCadenceMinutes > 0 ? refreshCadenceMinutes : 360,
    qualityChecklist: Array.isArray(spec.qualityChecklist) ? spec.qualityChecklist.filter(Boolean) : [],
    allowedUse: String(spec.allowedUse ?? "").trim(),
    blockedUse: String(spec.blockedUse ?? "").trim(),
    operatorNote: String(spec.operatorNote ?? "").trim()
  };
}

export function getOfficialBenefitProviderSpecs() {
  const configured = readJson(officialBenefitSourceConfigPath, []);
  const specs = (Array.isArray(configured) && configured.length ? configured : defaultProviderSpecs)
    .map(normalizeOfficialBenefitProviderSpec)
    .filter((spec) => spec.enabled && spec.provider && spec.source && spec.env.length);

  return specs.length ? specs : defaultProviderSpecs.map(normalizeOfficialBenefitProviderSpec);
}

export function buildOfficialBenefitSourceConfigSummary(providerSpecs = getOfficialBenefitProviderSpecs()) {
  const refreshCadences = providerSpecs.map((spec) => spec.refreshCadenceMinutes).filter(Number.isFinite);

  return {
    configFile: officialBenefitSourceConfigPath,
    configuredSources: providerSpecs.length,
    enabledProviders: [...new Set(providerSpecs.map((spec) => spec.provider).filter(Boolean))],
    envKeys: [...new Set(providerSpecs.flatMap((spec) => spec.env).filter(Boolean))],
    categories: [...new Set(providerSpecs.flatMap((spec) => spec.categories).filter(Boolean))],
    benefitTypes: [...new Set(providerSpecs.flatMap((spec) => spec.benefitTypes).filter(Boolean))],
    recommendedQueries: [...new Set(providerSpecs.flatMap((spec) => spec.recommendedQueries).filter(Boolean))],
    targetSections: [...new Set(providerSpecs.flatMap((spec) => spec.targetSections).filter(Boolean))],
    operatorOwners: [...new Set(providerSpecs.map((spec) => spec.operatorOwner).filter(Boolean))],
    minimumRefreshCadenceMinutes: refreshCadences.length ? Math.min(...refreshCadences) : 360,
    highPrioritySources: providerSpecs.filter((spec) => spec.launchPriority === "high").length,
    sourceOperations: providerSpecs.map((spec) => ({
      id: spec.id,
      provider: spec.provider,
      source: spec.source,
      operatorOwner: spec.operatorOwner,
      launchPriority: spec.launchPriority,
      refreshCadenceMinutes: spec.refreshCadenceMinutes,
      targetSections: spec.targetSections,
      qualityChecklist: spec.qualityChecklist,
      envKeys: spec.env
    })),
    guardrails: [
      "공식 RSS, 공식 JSON, 제휴 API, 운영자 승인 feed만 연결",
      "검색 결과, 커뮤니티 원문, 블로그, 뉴스 기사 단독 링크 차단",
      "종료일, 혜택 조건, 공식 finalUrl이 없는 항목 숨김 처리"
    ]
  };
}

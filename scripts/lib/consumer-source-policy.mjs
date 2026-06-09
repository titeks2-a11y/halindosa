export const CONSUMER_FIRST_POLICY_DEFAULTS = {
  minimumConsumerSourceRate: 70,
  minimumHighPriorityConsumerSources: 30,
  maximumPublicPolicySourceRate: 35,
  defaultExposure: "consumer_first_public_policy_opt_in",
  publicPolicyDefaultHandling: "excluded_from_default_home_and_freebies_unless_explicitly_requested"
};

const publicPolicyPatterns = [
  /gov|정부|보조금|복지|bokjiro|공공|공기관|지자체|정책/i,
  /서울|seoul|청년|한강|공원|평생학습|yeyak\.seoul|youth\.seoul|sll\.seoul/i,
  /culture\.go|문화가.?있는.?날|문화포털|mnuri|visitkorea/i,
  /hrd|work24|고용24|내일배움|kmooc|k-mooc|kocw|ebs|교육|훈련/i
];

const publicPolicySourceTypes = new Set([
  "approved_public",
  "approved_public_benefit_page",
  "public_benefit_page",
  "public_official_page"
]);

export function sourceText(source) {
  return [
    source.id,
    source.label,
    source.provider,
    source.sourceType,
    source.officialUrl,
    Array.isArray(source.category) ? source.category.join(" ") : source.category,
    source.allowedUse,
    source.blockedUse,
    source.notes
  ]
    .filter(Boolean)
    .join(" ");
}

export function isPublicPolicySource(source) {
  return publicPolicySourceTypes.has(String(source.sourceType ?? "")) || isPublicPolicyText(sourceText(source));
}

export function isPublicPolicyText(value) {
  return publicPolicyPatterns.some((pattern) => pattern.test(String(value ?? "")));
}

export function buildConsumerFirstPolicy(catalog, liveRowsById = new Map(), overrides = {}) {
  const thresholds = {
    ...CONSUMER_FIRST_POLICY_DEFAULTS,
    ...overrides
  };
  const activeCatalog = (Array.isArray(catalog) ? catalog : []).filter((source) => liveRowsById.get(source.id)?.status !== "stale_or_removed");
  const publicPolicySources = activeCatalog.filter(isPublicPolicySource);
  const consumerBenefitSources = activeCatalog.filter((source) => !isPublicPolicySource(source));
  const highPriorityConsumerSources = consumerBenefitSources.filter((source) => source.priority === "high");
  const consumerSourceRate = activeCatalog.length ? Math.round((consumerBenefitSources.length / activeCatalog.length) * 100) : 0;
  const publicPolicySourceRate = activeCatalog.length ? Math.round((publicPolicySources.length / activeCatalog.length) * 100) : 0;

  return {
    minimumConsumerSourceRate: thresholds.minimumConsumerSourceRate,
    minimumHighPriorityConsumerSources: thresholds.minimumHighPriorityConsumerSources,
    maximumPublicPolicySourceRate: thresholds.maximumPublicPolicySourceRate,
    activeSourceCount: activeCatalog.length,
    consumerBenefitSourceCount: consumerBenefitSources.length,
    consumerSourceRate,
    highPriorityConsumerSourceCount: highPriorityConsumerSources.length,
    publicPolicySourceCount: publicPolicySources.length,
    publicPolicySourceRate,
    defaultExposure: thresholds.defaultExposure,
    publicPolicyDefaultHandling: thresholds.publicPolicyDefaultHandling,
    ok:
      consumerSourceRate >= thresholds.minimumConsumerSourceRate &&
      highPriorityConsumerSources.length >= thresholds.minimumHighPriorityConsumerSources &&
      publicPolicySourceRate <= thresholds.maximumPublicPolicySourceRate
  };
}

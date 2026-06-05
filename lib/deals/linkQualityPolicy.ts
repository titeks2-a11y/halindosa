import policy from "@/data/linkQualityPolicy.json";

export interface LinkQualityPolicy {
  version: number;
  blockedHosts: string[];
  placeholderHosts: string[];
  homePaths: string[];
  searchPatterns: string[];
  productDetailSignals: string[];
  officialBenefitUrlSignals: string[];
  officialBenefitEvidenceSignals: string[];
  unavailableTextPatterns: string[];
  liveUnavailableTextPatterns?: string[];
  allowedVerificationSources: string[];
  exposurePolicy: {
    availability: string;
    validationStatus: string;
    isHidden: boolean;
    publishable?: boolean;
    blockedLinkTypes: string[];
    finalUrlRequired: boolean;
  };
  launchGate?: {
    exposedSearchLinks: number;
    exposedSoldOutLinks: number;
    exposedBrokenLinks: number;
    exposedInvalidUrls: number;
    liveHardFailures: number;
    sellerUnavailableSignals: number;
  };
}

export const linkQualityPolicy = policy as LinkQualityPolicy;

export function compilePolicyPatterns(patterns: string[]) {
  return patterns.map((pattern) => new RegExp(pattern, "i"));
}

export function hostMatchesPolicy(host: string, candidate: string) {
  return host === candidate || host.endsWith(`.${candidate}`) || host.includes(candidate);
}

export function isPolicyBlockedHost(host: string) {
  const normalizedHost = host.replace(/^www\./, "").toLowerCase();

  return linkQualityPolicy.blockedHosts.some((candidate) => hostMatchesPolicy(normalizedHost, candidate));
}

export function isPolicyPlaceholderHost(host: string) {
  const normalizedHost = host.replace(/^www\./, "").toLowerCase();

  return linkQualityPolicy.placeholderHosts.some((candidate) => normalizedHost === candidate || normalizedHost.endsWith(`.${candidate}`));
}

export function isPolicyHomeOnlyUrl(url: URL) {
  const path = url.pathname.replace(/\/+$/, "").toLowerCase();

  return linkQualityPolicy.homePaths.includes(path);
}

export function isPolicySearchLikeUrl(url: URL) {
  const productDetailPatterns = compilePolicyPatterns(linkQualityPolicy.productDetailSignals);
  const urlValue = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  const benefitValue = `${url.pathname}${url.search}${url.hash}`.toLowerCase();

  if (productDetailPatterns.some((pattern) => pattern.test(urlValue))) return false;
  if (linkQualityPolicy.officialBenefitUrlSignals.some((signal) => benefitValue.includes(signal))) return false;

  return linkQualityPolicy.searchPatterns.some((pattern) => urlValue.includes(pattern.toLowerCase()));
}

export function containsPolicyUnavailableText(text: string) {
  const normalizedText = text.toLowerCase();

  return linkQualityPolicy.unavailableTextPatterns.some((pattern) => normalizedText.includes(pattern.toLowerCase()));
}

export function hasPolicyProductDetailSignal(url: URL) {
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();

  return compilePolicyPatterns(linkQualityPolicy.productDetailSignals).some((pattern) => pattern.test(value));
}

export function hasPolicyOfficialBenefitSignal(url: URL, evidence = "") {
  const urlValue = `${url.hostname}${url.pathname}${url.search}${url.hash}`.toLowerCase();
  const evidenceValue = evidence.toLowerCase();
  const urlLooksLikeBenefit = linkQualityPolicy.officialBenefitUrlSignals.some((signal) => urlValue.includes(signal));
  const evidenceLooksLikeBenefit = linkQualityPolicy.officialBenefitEvidenceSignals.some((signal) => evidenceValue.includes(signal.toLowerCase()));

  return urlLooksLikeBenefit && evidenceLooksLikeBenefit;
}

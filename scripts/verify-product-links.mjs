import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mockDeals = readFileSync(join(root, "data/mockDeals.ts"), "utf8");
const verifiedLinks = readFileSync(join(root, "data/verifiedPurchaseLinks.ts"), "utf8");
const linkQualityPolicy = JSON.parse(readFileSync(join(root, "data/linkQualityPolicy.json"), "utf8"));

const blockedHosts = [...linkQualityPolicy.blockedHosts, ...linkQualityPolicy.placeholderHosts];
const searchPatterns = linkQualityPolicy.searchPatterns;
const unavailablePatterns = linkQualityPolicy.unavailableTextPatterns;
const allowedSources = new Set(linkQualityPolicy.allowedVerificationSources);
const minimums = {
  distinctHosts: 18,
  evidenceLength: 12
};
const liveProbeEnabled = process.env.DEAL_LINK_LIVE_PROBE === "true" || process.env.DEAL_REFRESH_LIVE_PROBE === "true";
const liveProbeStrict = process.env.DEAL_LINK_LIVE_STRICT === "true";
const bodyProbeEnabled = process.env.DEAL_LINK_BODY_PROBE === "true";
const probeTimeoutMs = Number(process.env.DEAL_LINK_TIMEOUT_MS ?? 3500);
const liveProbe = {
  enabled: liveProbeEnabled,
  strict: liveProbeStrict,
  bodyProbe: bodyProbeEnabled,
  timeoutMs: probeTimeoutMs,
  checked: 0,
  passed: 0,
  failed: 0,
  redirected: 0,
  finalUrlChanged: 0,
  http404: 0,
  http410: 0,
  http5xx: 0,
  timeout: 0,
  robotsBlocked: 0,
  unavailableText: 0,
  failures: []
};

function isBlockedHost(host) {
  return blockedHosts.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

function isHomeOnly(url) {
  const path = url.pathname.replace(/\/+$/, "");
  return path === "" || path === "/" || path === "/main" || path === "/index";
}

function isSearchLike(url) {
  if (/\/product\/|\/products\/|\/goods\/|\/item\/|itemview|goodsdetail|detailview/i.test(`${url.pathname}${url.search}`)) return false;
  if (/event|benefit|campaign|coupon|promotion/i.test(`${url.pathname}${url.search}${url.hash}`)) return false;
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  return searchPatterns.some((pattern) => value.includes(pattern));
}

function containsUnavailableText(text) {
  return unavailablePatterns.some((pattern) => text.includes(pattern));
}

function hasProductDetailSignal(url) {
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();

  return linkQualityPolicy.productDetailSignals.some((pattern) => new RegExp(pattern, "i").test(value));
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), probeTimeoutMs);

  try {
    return await fetch(url, {
      ...options,
      redirect: "follow",
      headers: {
        "User-Agent": "HalindosaLinkVerifier/1.0 (+https://halindosa.com)",
        Accept: "text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5",
        ...(options.headers ?? {})
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function probeLiveUrl(urlValue) {
  const result = {
    ok: false,
    status: 0,
    finalUrl: urlValue,
    reason: "not_checked",
    bodyChecked: false,
    unavailableText: false
  };

  try {
    let response = await fetchWithTimeout(urlValue, { method: "HEAD" });

    if ([403, 404, 405, 501].includes(response.status) || bodyProbeEnabled) {
      response = await fetchWithTimeout(urlValue, {
        method: "GET",
        headers: bodyProbeEnabled ? { Range: "bytes=0-65535" } : {}
      });
    }

    result.status = response.status;
    result.finalUrl = response.url || urlValue;
    result.ok = response.status >= 200 && response.status < 400;

    if (response.status === 403 || response.status === 401) result.reason = "robots_or_access_blocked";
    else if (response.status === 404) result.reason = "http_404";
    else if (response.status === 410) result.reason = "http_410";
    else if (response.status >= 500) result.reason = `http_${response.status}`;
    else result.reason = result.ok ? "http_ok" : `http_${response.status}`;

    const contentType = response.headers.get("content-type") ?? "";
    if (bodyProbeEnabled && /text|html|json/i.test(contentType)) {
      const body = await response.text();
      result.bodyChecked = true;
      result.unavailableText = containsUnavailableText(body.slice(0, 65535));
      if (result.unavailableText) {
        result.ok = false;
        result.reason = "sold_out_or_ended_text";
      }
    }

    return result;
  } catch (error) {
    result.reason = error instanceof Error && error.name === "AbortError" ? "timeout" : "request_failed";
    return result;
  }
}

function recordLiveProbeResult(id, urlValue, probe) {
  liveProbe.checked += 1;
  if (probe.ok) liveProbe.passed += 1;
  else liveProbe.failed += 1;

  if (probe.finalUrl && probe.finalUrl !== urlValue) {
    liveProbe.redirected += 1;
    liveProbe.finalUrlChanged += 1;
  }

  if (probe.status === 404) liveProbe.http404 += 1;
  if (probe.status === 410) liveProbe.http410 += 1;
  if (probe.status >= 500) liveProbe.http5xx += 1;
  if (probe.reason === "timeout") liveProbe.timeout += 1;
  if (probe.reason === "robots_or_access_blocked") liveProbe.robotsBlocked += 1;
  if (probe.unavailableText) liveProbe.unavailableText += 1;

  if (!probe.ok) {
    liveProbe.failures.push({
      id,
      url: urlValue,
      finalUrl: probe.finalUrl,
      status: probe.status,
      reason: probe.reason
    });
  }
}

function hasClaimOrBenefitSignal(url, evidence) {
  const value = `${url.hostname}${url.pathname}${url.search}${url.hash}`.toLowerCase();
  const evidenceValue = evidence.toLowerCase();
  const urlLooksLikeBenefit = linkQualityPolicy.officialBenefitUrlSignals.some((signal) => value.includes(signal));
  const evidenceLooksLikeBenefit = linkQualityPolicy.officialBenefitEvidenceSignals.some((signal) => evidenceValue.includes(signal.toLowerCase()));

  return urlLooksLikeBenefit && evidenceLooksLikeBenefit;
}

function parseVerifiedEntries() {
  const entries = [];
  const pattern = /^\s*(d\d+):\s*\{(?<body>[\s\S]*?)^\s*\},?/gm;
  let match;

  while ((match = pattern.exec(verifiedLinks))) {
    const body = match.groups?.body ?? "";
    entries.push({
      id: match[1],
      url: body.match(/url:\s*"([^"]+)"/)?.[1] ?? "",
      checkedAt: body.match(/checkedAt:\s*"([^"]+)"/)?.[1] ?? "",
      source: body.match(/source:\s*"([^"]+)"/)?.[1] ?? "",
      evidence: body.match(/evidence:\s*"([^"]+)"/)?.[1] ?? ""
    });
  }

  return entries;
}

function getIssueMessagesForId(id, allIssues) {
  return allIssues.filter((issue) => issue.startsWith(`${id}:`));
}

function getLiveProbeFailureForId(id) {
  return liveProbe.failures.find((failure) => failure.id === id) ?? null;
}

function getAuditPriorityScore({ linkType, validationStatus, availability, hasImage, hasPrice, discountRate, checkedAt, liveProbeFailure }) {
  let score = 50;

  if (linkType === "direct_purchase" || linkType === "affiliate") score += 24;
  if (validationStatus === "passed") score += 16;
  if (availability === "active") score += 12;
  if (hasImage) score += 8;
  if (hasPrice) score += 8;
  if (discountRate > 0) score += 5;
  if (checkedAt) score += 4;
  if (linkType === "search" || linkType === "seller_search") score -= 45;
  if (linkType === "unavailable") score -= 50;
  if (availability === "sold_out" || availability === "ended") score -= 60;
  if (validationStatus === "failed") score -= 35;
  if (liveProbeFailure?.reason === "timeout") score -= 12;
  if (liveProbeFailure?.reason === "robots_or_access_blocked") score -= 8;
  if (liveProbeFailure?.status >= 400) score -= 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildAuditedItems({ dealIds, entryMap, metadataMap, issues }) {
  return dealIds.map((id) => {
    const urlValue = entryMap.get(id) ?? "";
    const metadata = metadataMap.get(id);
    const issueMessages = getIssueMessagesForId(id, issues);
    const liveProbeFailure = getLiveProbeFailureForId(id);
    const checks = {
      httpUrl: false,
      blockedHost: false,
      homeOnlyUrl: false,
      searchLikeUrl: false,
      productDetailUrl: false,
      officialBenefitUrl: false,
      unavailableText: containsUnavailableText(metadata?.evidence ?? ""),
      liveProbeOk: liveProbeEnabled ? !liveProbeFailure : null
    };
    let host = "";
    let finalUrl = urlValue;
    let linkType = "unavailable";

    try {
      if (urlValue) {
        const url = new URL(urlValue);
        host = url.hostname.replace(/^www\./, "").toLowerCase();
        finalUrl = liveProbeFailure?.finalUrl ?? urlValue;
        checks.httpUrl = url.protocol === "https:" || url.protocol === "http:";
        checks.blockedHost = isBlockedHost(host);
        checks.homeOnlyUrl = isHomeOnly(url);
        checks.searchLikeUrl = isSearchLike(url);
        checks.productDetailUrl = hasProductDetailSignal(url);
        checks.officialBenefitUrl = hasClaimOrBenefitSignal(url, metadata?.evidence ?? "");

        if (checks.searchLikeUrl) linkType = "search";
        else if (checks.productDetailUrl || checks.officialBenefitUrl) linkType = "direct_purchase";
      }
    } catch {
      finalUrl = urlValue;
    }

    const unavailableDetected = checks.unavailableText || liveProbeFailure?.reason === "sold_out_or_ended_text";
    const validationStatus = issueMessages.length ? "failed" : "passed";
    const availability = unavailableDetected ? "sold_out" : validationStatus === "passed" ? "active" : "unknown";
    const isHidden =
      availability !== "active" ||
      validationStatus !== "passed" ||
      linkType === "search" ||
      linkType === "seller_search" ||
      linkType === "unavailable" ||
      !urlValue;
    const priorityScore = getAuditPriorityScore({
      linkType,
      validationStatus,
      availability,
      hasImage: true,
      hasPrice: true,
      discountRate: 1,
      checkedAt: metadata?.checkedAt,
      liveProbeFailure
    });

    return {
      id,
      source: metadata?.source ?? "missing",
      originalUrl: urlValue,
      finalUrl,
      linkType,
      availability,
      validationStatus,
      validationReason: issueMessages.length ? issueMessages.map((issue) => issue.replace(`${id}: `, "")).join(" | ") : "passed",
      lastCheckedAt: metadata?.checkedAt ?? "",
      priorityScore,
      isHidden,
      host,
      evidence: metadata?.evidence ?? "",
      checks,
      liveProbe: liveProbeFailure
        ? {
            ok: false,
            status: liveProbeFailure.status,
            reason: liveProbeFailure.reason,
            finalUrl: liveProbeFailure.finalUrl
          }
        : liveProbeEnabled
          ? { ok: true }
          : { ok: null, reason: "disabled" }
    };
  });
}

const dealIds = [...mockDeals.matchAll(/deal\("(d\d+)"/g)].map((match) => match[1]);
const entries = parseVerifiedEntries();
const entryMap = new Map(entries.map((entry) => [entry.id, entry.url]));
const metadataMap = new Map(entries.map((entry) => [entry.id, entry]));
const issues = [];
const hosts = new Set();
const domainCounts = new Map();
const excludedReasonCounts = new Map();
let productDetailCount = 0;
let claimBenefitCount = 0;
let soldOutOrEndedCount = 0;

function addExcludedReason(reason) {
  excludedReasonCounts.set(reason, (excludedReasonCounts.get(reason) ?? 0) + 1);
}

for (const id of dealIds) {
  const urlValue = entryMap.get(id);
  const metadata = metadataMap.get(id);
  if (!urlValue) {
    issues.push(`${id}: verifiedPurchaseLinks.ts에 실제 구매 상세 URL이 없습니다.`);
    addExcludedReason("missing_direct_link");
    continue;
  }

  if (!metadata?.checkedAt || Number.isNaN(Date.parse(metadata.checkedAt))) {
    issues.push(`${id}: checkedAt 검수 시각이 없거나 ISO 날짜가 아닙니다.`);
    addExcludedReason("manual_review_needed");
  }

  if (!allowedSources.has(metadata?.source)) {
    issues.push(`${id}: source는 manual_review, partner_feed, official_api 중 하나여야 합니다. ${metadata?.source ?? "(없음)"}`);
    addExcludedReason("manual_review_needed");
  }

  if (!metadata?.evidence || metadata.evidence.trim().length < minimums.evidenceLength) {
    issues.push(`${id}: evidence 검수 근거가 부족합니다.`);
    addExcludedReason("manual_review_needed");
  }

  try {
    const url = new URL(urlValue);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    hosts.add(host);
    domainCounts.set(host, (domainCounts.get(host) ?? 0) + 1);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      issues.push(`${id}: http/https가 아닌 URL입니다. ${urlValue}`);
      addExcludedReason("broken_url");
    }

    if (isBlockedHost(host)) {
      issues.push(`${id}: 커뮤니티 또는 placeholder 링크입니다. ${urlValue}`);
      addExcludedReason("community_source");
    }

    if (isHomeOnly(url)) {
      issues.push(`${id}: 쇼핑몰 메인 링크입니다. ${urlValue}`);
      addExcludedReason("redirect_to_home");
    }

    if (isSearchLike(url)) {
      issues.push(`${id}: 검색/카테고리 링크입니다. ${urlValue}`);
      addExcludedReason("search_result_url");
    }

    if (containsUnavailableText(metadata?.evidence ?? "")) {
      issues.push(`${id}: 검수 근거에 품절/판매종료/마감 신호가 있습니다.`);
      soldOutOrEndedCount += 1;
      addExcludedReason("sold_out_or_ended");
    }

    const productDetailLike = hasProductDetailSignal(url);
    const claimBenefitLike = hasClaimOrBenefitSignal(url, metadata?.evidence ?? "");

    if (productDetailLike) productDetailCount += 1;
    if (!productDetailLike && claimBenefitLike) claimBenefitCount += 1;

    if (!productDetailLike && !claimBenefitLike) {
      issues.push(`${id}: 상품 상세 또는 혜택 신청 페이지로 보기 어려운 URL입니다. ${urlValue}`);
      addExcludedReason("manual_review_needed");
    }

    if (liveProbeEnabled && !isBlockedHost(host) && !isHomeOnly(url) && !isSearchLike(url)) {
      const probe = await probeLiveUrl(urlValue);
      recordLiveProbeResult(id, urlValue, probe);

      if (probe.finalUrl && probe.finalUrl !== urlValue) {
        const finalUrl = new URL(probe.finalUrl);
        if (isHomeOnly(finalUrl) || isSearchLike(finalUrl)) {
          issues.push(`${id}: redirect 후 최종 URL이 검색/대표 페이지입니다. ${probe.finalUrl}`);
          addExcludedReason("redirect_to_search_or_home");
        }
      }

      if (probe.unavailableText) {
        issues.push(`${id}: live probe 본문에서 품절/판매종료 문구가 탐지되었습니다. ${probe.finalUrl}`);
        soldOutOrEndedCount += 1;
        addExcludedReason("sold_out_or_ended");
      }

      if (liveProbeStrict && !probe.ok) {
        issues.push(`${id}: live probe 실패: ${probe.reason} (${probe.status || "no_status"})`);
        addExcludedReason(probe.reason);
      }
    }
  } catch {
    issues.push(`${id}: 올바른 URL이 아닙니다. ${urlValue}`);
    addExcludedReason("broken_url");
  }
}

const extraEntries = entries.filter((entry) => !dealIds.includes(entry.id));
if (extraEntries.length) {
  issues.push(`사용하지 않는 검증 링크 ID가 있습니다: ${extraEntries.map((entry) => entry.id).join(", ")}`);
  addExcludedReason("manual_review_needed");
}

if (hosts.size < minimums.distinctHosts) {
  issues.push(`검증 링크 판매처 도메인이 부족합니다: ${hosts.size}/${minimums.distinctHosts}`);
  addExcludedReason("manual_review_needed");
}

const auditedItems = buildAuditedItems({ dealIds, entryMap, metadataMap, issues });
const exposureAudit = {
  totalItems: auditedItems.length,
  passedItems: auditedItems.filter((item) => item.validationStatus === "passed" && item.availability === "active" && !item.isHidden).length,
  hiddenItems: auditedItems.filter((item) => item.isHidden).length,
  searchItems: auditedItems.filter((item) => item.linkType === "search" || item.linkType === "seller_search").length,
  soldOutItems: auditedItems.filter((item) => item.availability === "sold_out").length,
  failedItems: auditedItems.filter((item) => item.validationStatus === "failed").length,
  averagePriorityScore: auditedItems.length ? Math.round(auditedItems.reduce((sum, item) => sum + item.priorityScore, 0) / auditedItems.length) : 0
};

const report = {
  generatedAt: new Date().toISOString(),
  totalDeals: dealIds.length,
  verificationTargets: dealIds.length,
  passedDirectLinks: issues.length ? Math.max(0, entries.length - issues.length) : entries.length,
  visibleDeals: issues.length ? 0 : dealIds.length,
  excludedDeals: issues.length ? new Set(issues.map((issue) => issue.match(/^(d\d+)/)?.[1]).filter(Boolean)).size : 0,
  failedCount: issues.length,
  productDetailUrls: productDetailCount,
  officialBenefitUrls: claimBenefitCount,
  searchOrCategorySuspected: excludedReasonCounts.get("search_result_url") ?? 0,
  searchLinks: excludedReasonCounts.get("search_result_url") ?? 0,
  soldOutOrEndedSuspected: soldOutOrEndedCount,
  homeOrMainSuspected: excludedReasonCounts.get("redirect_to_home") ?? 0,
  communitySuspected: excludedReasonCounts.get("community_source") ?? 0,
  manualReviewNeeded: excludedReasonCounts.get("manual_review_needed") ?? 0,
  hiddenCount: issues.length ? new Set(issues.map((issue) => issue.match(/^(d\d+)/)?.[1]).filter(Boolean)).size : 0,
  exposedSearchLinks: excludedReasonCounts.get("search_result_url") ?? 0,
  exposedSoldOutLinks: soldOutOrEndedCount,
  visibleCount: issues.length ? 0 : dealIds.length,
  liveProbe,
  httpStatusSummary: {
    redirected: liveProbe.redirected,
    finalUrlChanged: liveProbe.finalUrlChanged,
    http404: liveProbe.http404,
    http410: liveProbe.http410,
    http5xx: liveProbe.http5xx,
    timeout: liveProbe.timeout,
    robotsBlocked: liveProbe.robotsBlocked,
    unavailableText: liveProbe.unavailableText
  },
  policy: {
    version: linkQualityPolicy.version,
    source: "data/linkQualityPolicy.json",
    searchPatterns: linkQualityPolicy.searchPatterns.length,
    unavailableTextPatterns: linkQualityPolicy.unavailableTextPatterns.length,
    productDetailSignals: linkQualityPolicy.productDetailSignals.length,
    officialBenefitUrlSignals: linkQualityPolicy.officialBenefitUrlSignals.length
  },
  exposurePolicy: {
    ...linkQualityPolicy.exposurePolicy
  },
  exposureAudit,
  auditedItems,
  excludedReasonCounts: Object.fromEntries([...excludedReasonCounts.entries()].sort(([a], [b]) => a.localeCompare(b))),
  domainCounts: Object.fromEntries([...domainCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  issues
};

mkdirSync(join(root, "reports"), { recursive: true });
writeFileSync(join(root, "LINK_VERIFICATION_RESULT.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(root, "reports", "link-validation.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(
  join(root, "LINK_VERIFICATION_REPORT.md"),
  `# 할인도사 Link Verification Report

Generated: ${report.generatedAt}

## Summary

| Metric | Value |
| --- | ---: |
| 총 상품 수 | ${report.totalDeals} |
| 검증 대상 수 | ${report.verificationTargets} |
| 직접 링크 통과 수 | ${report.passedDirectLinks} |
| 노출 가능 상품 수 | ${report.visibleDeals} |
| 제외 상품 수 | ${report.excludedDeals} |
| 실패 이슈 수 | ${report.failedCount} |
| 상품 상세 URL | ${report.productDetailUrls} |
| 공식 혜택/이벤트 URL | ${report.officialBenefitUrls} |
| 검색/카테고리 의심 | ${report.searchOrCategorySuspected} |
| 품절/종료 의심 | ${report.soldOutOrEndedSuspected} |
| 메인/홈 링크 의심 | ${report.homeOrMainSuspected} |
| 커뮤니티 의심 | ${report.communitySuspected} |
| 수동 검토 필요 | ${report.manualReviewNeeded} |
| Live probe 확인 | ${report.liveProbe.checked} |
| Live probe 실패 | ${report.liveProbe.failed} |
| Live probe robots/access 차단 | ${report.liveProbe.robotsBlocked} |
| Live probe timeout | ${report.liveProbe.timeout} |

## Excluded Reasons

${Object.entries(report.excludedReasonCounts).length ? Object.entries(report.excludedReasonCounts).map(([reason, count]) => `- ${reason}: ${count}`).join("\n") : "- 없음"}

## Domain Distribution

${Object.entries(report.domainCounts).slice(0, 30).map(([domain, count]) => `- ${domain}: ${count}`).join("\n")}

## Issues

${report.issues.length ? report.issues.map((issue) => `- ${issue}`).join("\n") : "- 링크 검증 이슈 없음"}
`,
  "utf8"
);

if (issues.length) {
  console.error("Product link verification failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

const coverageRate = dealIds.length ? Math.round((entries.length / dealIds.length) * 100) : 0;
console.log(`Product link verification passed: ${entries.length}/${dealIds.length} verified purchase URLs (${coverageRate}%).`);
console.log(`- Distinct purchase hosts: ${hosts.size}`);
console.log(`- Product detail URLs: ${productDetailCount}`);
console.log(`- Official benefit/event URLs: ${claimBenefitCount}`);

if (liveProbe.enabled) {
  const reasonCounts = liveProbe.failures.reduce((counts, failure) => {
    counts.set(failure.reason, (counts.get(failure.reason) ?? 0) + 1);
    return counts;
  }, new Map());
  const reasonSummary = [...reasonCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([reason, count]) => `${reason}:${count}`)
    .join(", ");

  console.log(
    `- Live probe: checked ${liveProbe.checked}, passed ${liveProbe.passed}, failed ${liveProbe.failed}, redirected ${liveProbe.redirected}`
  );
  console.log(
    `- Live probe signals: 404 ${liveProbe.http404}, 410 ${liveProbe.http410}, 5xx ${liveProbe.http5xx}, timeout ${liveProbe.timeout}, robots/access ${liveProbe.robotsBlocked}, sold-out text ${liveProbe.unavailableText}`
  );
  console.log(`- Live probe failure reasons: ${reasonSummary || "none"}`);

  if (!liveProbe.strict && liveProbe.failed) {
    console.log("- Live probe is non-strict: seller access protections are recorded for review without hiding otherwise valid purchase links.");
  }
}

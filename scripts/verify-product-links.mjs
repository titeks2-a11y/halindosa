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
const liveUnavailablePatterns = linkQualityPolicy.liveUnavailableTextPatterns ?? unavailablePatterns;
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
  rateLimited: 0,
  unavailableText: 0,
  unavailableTextReview: 0,
  bodyChecked: 0,
  titleMetaChecked: 0,
  contentMatched: 0,
  contentMismatch: 0,
  accessibleContentMismatch: 0,
  accessGuardBody: 0,
  priceSignal: 0,
  purchaseActionSignal: 0,
  failures: []
};
const liveProbeDetails = new Map();

function isBlockedHost(host) {
  return blockedHosts.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

function isHomeOnly(url) {
  const path = url.pathname.replace(/\/+$/, "");
  return path === "" || path === "/" || path === "/main" || path === "/index";
}

function isSearchLike(url) {
  if (hasProductDetailSignal(url)) return false;
  if (/\/product\/|\/products\/|\/goods\/|\/item\/|itemview|goodsdetail|detailview/i.test(`${url.pathname}${url.search}`)) return false;
  if (/event|benefit|campaign|coupon|promotion/i.test(`${url.pathname}${url.search}${url.hash}`)) return false;
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  return searchPatterns.some((pattern) => value.includes(pattern.toLowerCase()));
}

function containsUnavailableText(text) {
  const value = text.toLowerCase();

  return unavailablePatterns.some((pattern) => value.includes(pattern.toLowerCase()));
}

function containsLiveUnavailableText(text) {
  const value = text.toLowerCase();

  return liveUnavailablePatterns.some((pattern) => value.includes(pattern.toLowerCase()));
}

function findLiveUnavailablePattern(text) {
  const value = String(text ?? "").toLowerCase();

  return liveUnavailablePatterns.find((pattern) => value.includes(pattern.toLowerCase())) ?? "";
}

function containsAccessGuardText(text) {
  return /(잠시만 기다려 주세요|비정상적인 접근|access denied|request blocked|bot detection|captcha|보안문자|접근이 제한)/i.test(String(text ?? ""));
}

function isRateLimitedProbe(probe) {
  return probe?.status === 429 || probe?.reason === "http_429";
}

function isAccessProtectedProbe(probe) {
  return Boolean(probe?.accessGuard || probe?.reason === "robots_or_access_blocked" || isRateLimitedProbe(probe));
}

function hasAccessibleContentMismatch(probe) {
  return probe?.contentMatch === false && !isAccessProtectedProbe(probe);
}

function isHardLiveProbeFailure(probe) {
  if (!probe) return false;
  if (probe.reason === "sold_out_or_ended_text") return true;
  return probe.status === 404 || probe.status === 410 || probe.status >= 500;
}

function getHardLiveFailureReason(probe) {
  if (!isHardLiveProbeFailure(probe)) return "";
  if (probe.reason === "sold_out_or_ended_text") return "live_sold_out_or_ended_signal";
  if (probe.status) return `live_http_${probe.status}`;
  return probe.reason || "live_hard_failure";
}

function classifyContentMismatch(probe) {
  if (!hasAccessibleContentMismatch(probe)) return "";

  const title = String(probe?.title ?? "");
  const meta = String(probe?.metaDescription ?? "");
  const text = `${title} ${meta}`.toLowerCase();

  if (/naver sign in|login|로그인|sign in|인증/.test(text)) return "login_wall";
  if (/종료이벤트|당첨발표|이벤트\s*종료|행사\s*종료|마감|ended|expired/.test(text)) return "ended_event_page";
  if (/에러페이지|error|not found|페이지를 찾을 수|오류/.test(text)) return "error_page";
  if (!title.trim() && !meta.trim() && !probe?.priceSignal && !probe?.purchaseActionSignal) return "blank_or_script_shell";
  if (/나를 나답게 lfmall|^11번가$|^payco::이벤트$|배민아카데미/.test(text) && !probe?.priceSignal && !probe?.purchaseActionSignal) {
    return "generic_landing_or_shell";
  }
  if ((title || meta) && Number(probe?.titleSimilarity ?? 0) < 18) return "wrong_product_or_benefit";

  return "live_content_mismatch";
}

function getMismatchAction(category) {
  switch (category) {
    case "login_wall":
      return "로그인 없이 접근 가능한 공식 혜택/상품 상세 URL로 교체";
    case "ended_event_page":
      return "진행 중인 이벤트 상세 URL로 교체하거나 종료 처리";
    case "error_page":
      return "오류 없는 공식 상품/이벤트 상세 URL로 교체";
    case "blank_or_script_shell":
      return "서버 렌더링 또는 메타 정보가 확인되는 상세 URL로 교체";
    case "generic_landing_or_shell":
      return "대표/목록/앱 쉘 페이지 대신 개별 상세 URL로 교체";
    case "wrong_product_or_benefit":
      return "페이지 title/meta가 상품명과 맞는 직접 상세 URL로 교체";
    case "live_content_mismatch":
      return "본문/메타가 상품명과 일치하는지 수동 재검증";
    default:
      return "";
  }
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHtmlSignal(body) {
  const sample = String(body ?? "").slice(0, 65535);
  const title = stripHtml(sample.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const metaDescription = stripHtml(
    sample.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1] ??
      sample.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i)?.[1] ??
      ""
  );
  const text = stripHtml(sample).slice(0, 30000);
  const lowerText = text.toLowerCase();

  return {
    title,
    metaDescription,
    textSample: text.slice(0, 500),
    priceSignal: /(\d{1,3}(,\d{3})+|\d+\s*원|₩|price|saleprice|lprice|판매가|할인가|쿠폰가|최종가)/i.test(text),
    purchaseActionSignal: /(구매하기|장바구니|바로구매|바로 구매|주문하기|신청하기|쿠폰받기|쿠폰 받기|참여하기|예약하기|buy now|add to cart|checkout)/i.test(text),
    unavailableText: containsLiveUnavailableText(lowerText),
    unavailablePattern: findLiveUnavailablePattern(lowerText),
    accessGuard: containsAccessGuardText(`${title} ${metaDescription} ${text.slice(0, 1000)}`)
  };
}

function tokenizeForSimilarity(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !/^\d+$/.test(token))
    .slice(0, 24);
}

function getContentSimilarity(title, ...candidates) {
  const tokens = tokenizeForSimilarity(title);
  if (!tokens.length) return 0;

  const haystack = candidates.join(" ").toLowerCase();
  const matched = tokens.filter((token) => haystack.includes(token)).length;
  return Math.round((matched / tokens.length) * 100);
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

async function probeLiveUrl(urlValue, context = {}) {
  const result = {
    ok: false,
    status: 0,
    finalUrl: urlValue,
    reason: "not_checked",
    bodyChecked: false,
    unavailableText: false,
    title: "",
    metaDescription: "",
    textSample: "",
    titleSimilarity: 0,
    contentMatch: null,
    priceSignal: false,
    purchaseActionSignal: false,
    unavailableTextReview: false,
    accessGuard: false,
    unavailablePattern: ""
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
      const bodySignals = extractHtmlSignal(body);
      result.title = bodySignals.title;
      result.metaDescription = bodySignals.metaDescription;
      result.textSample = bodySignals.textSample;
      result.priceSignal = bodySignals.priceSignal;
      result.purchaseActionSignal = bodySignals.purchaseActionSignal;
      result.unavailableText = bodySignals.unavailableText;
      result.unavailablePattern = bodySignals.unavailablePattern;
      result.accessGuard = bodySignals.accessGuard;
      result.titleSimilarity = getContentSimilarity(context.title, bodySignals.title, bodySignals.metaDescription, bodySignals.textSample);
      result.contentMatch = result.titleSimilarity >= 18 || result.priceSignal || result.purchaseActionSignal;
      const hasStrongContentEvidence = result.titleSimilarity >= 18 || result.priceSignal;

      if (result.accessGuard) {
        result.ok = false;
        result.reason = "robots_or_access_blocked";
      } else if (result.unavailableText && hasStrongContentEvidence) {
        result.ok = false;
        result.reason = "sold_out_or_ended_text";
      } else if (result.unavailableText) {
        result.unavailableTextReview = true;
      } else if (process.env.DEAL_LINK_CONTENT_STRICT === "true" && result.contentMatch === false) {
        result.ok = false;
        result.reason = "content_mismatch";
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
  if (isRateLimitedProbe(probe)) liveProbe.rateLimited += 1;
  if (probe.reason === "sold_out_or_ended_text") liveProbe.unavailableText += 1;
  if (probe.unavailableTextReview) liveProbe.unavailableTextReview += 1;
  if (probe.bodyChecked) liveProbe.bodyChecked += 1;
  if (probe.title || probe.metaDescription) liveProbe.titleMetaChecked += 1;
  if (probe.contentMatch === true) liveProbe.contentMatched += 1;
  if (probe.contentMatch === false) liveProbe.contentMismatch += 1;
  if (hasAccessibleContentMismatch(probe)) liveProbe.accessibleContentMismatch += 1;
  if (probe.accessGuard) liveProbe.accessGuardBody += 1;
  if (probe.priceSignal) liveProbe.priceSignal += 1;
  if (probe.purchaseActionSignal) liveProbe.purchaseActionSignal += 1;

  liveProbeDetails.set(id, {
    ok: probe.ok,
    status: probe.status,
    reason: probe.reason,
    finalUrl: probe.finalUrl,
    bodyChecked: probe.bodyChecked,
    title: probe.title,
    metaDescription: probe.metaDescription,
    textSample: probe.textSample,
    titleSimilarity: probe.titleSimilarity,
    contentMatch: probe.contentMatch,
    priceSignal: probe.priceSignal,
    purchaseActionSignal: probe.purchaseActionSignal,
    unavailableText: probe.unavailableText,
    unavailablePattern: probe.unavailablePattern,
    unavailableTextReview: probe.unavailableTextReview,
    accessGuard: probe.accessGuard
  });

  if (!probe.ok) {
      liveProbe.failures.push({
        id,
        url: urlValue,
        finalUrl: probe.finalUrl,
        status: probe.status,
        reason: probe.reason,
        titleSimilarity: probe.titleSimilarity,
        contentMatch: probe.contentMatch,
        accessGuard: probe.accessGuard,
        rateLimited: isRateLimitedProbe(probe),
        unavailablePattern: probe.unavailablePattern
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

function parseMockDealMetadata() {
  const entries = [];
  const pattern = /deal\("(?<id>d\d+)",\s*"(?<mallName>[^"]+)",\s*"(?<title>[^"]+)",\s*"(?<category>[^"]+)"/g;
  let match;

  while ((match = pattern.exec(mockDeals))) {
    entries.push({
      id: match.groups?.id ?? "",
      mallName: match.groups?.mallName ?? "",
      title: match.groups?.title ?? "",
      category: match.groups?.category ?? ""
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

function getLiveProbeDetailForId(id) {
  return liveProbeDetails.get(id) ?? null;
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

function getValidationCode({ linkType, validationStatus, availability, checks, liveProbeFailure, hasUrl }) {
  if (!hasUrl) return "missing_final_url";
  if (availability === "sold_out") return "sold_out";
  if (availability === "ended") return "stale";
  if (linkType === "search" || linkType === "seller_search" || checks?.searchLikeUrl) return "search_link";
  if (checks?.homeOnlyUrl) return "homepage_link";
  if (checks?.blockedHost) return "community_link";
  if (checks?.httpUrl === false) return "unsafe_url";
  if (checks?.accessibleContentMismatch) return "mismatch";
  if (liveProbeFailure?.reason === "timeout") return "timeout";
  if (validationStatus === "passed" && availability === "active" && linkType !== "unavailable") return "valid";
  if (validationStatus === "needs_review") return "mismatch";
  return "invalid";
}

function buildAuditedItems({ dealIds, entryMap, metadataMap, dealMetadataMap, issues }) {
  return dealIds.map((id) => {
    const urlValue = entryMap.get(id) ?? "";
    const metadata = metadataMap.get(id);
    const dealMetadata = dealMetadataMap.get(id) ?? {};
    const issueMessages = getIssueMessagesForId(id, issues);
    const liveProbeFailure = getLiveProbeFailureForId(id);
    const liveProbeDetail = getLiveProbeDetailForId(id);
    const mismatchCategory = classifyContentMismatch(liveProbeFailure ?? liveProbeDetail);
    const mismatchAction = getMismatchAction(mismatchCategory);
    const checks = {
      httpUrl: false,
      blockedHost: false,
      homeOnlyUrl: false,
      searchLikeUrl: false,
      productDetailUrl: false,
      officialBenefitUrl: false,
      unavailableText: containsUnavailableText(metadata?.evidence ?? ""),
      liveProbeOk: liveProbeEnabled ? !liveProbeFailure : null,
      titleMetaChecked: liveProbeDetail ? Boolean(liveProbeDetail.title || liveProbeDetail.metaDescription) : false,
      titleSimilarity: liveProbeDetail?.titleSimilarity ?? null,
      contentMatch: liveProbeDetail?.contentMatch ?? null,
      priceSignal: Boolean(liveProbeDetail?.priceSignal),
      purchaseActionSignal: Boolean(liveProbeDetail?.purchaseActionSignal),
      accessGuard: Boolean(liveProbeDetail?.accessGuard),
      rateLimited: Boolean(isRateLimitedProbe(liveProbeFailure ?? liveProbeDetail)),
      accessibleContentMismatch: Boolean(hasAccessibleContentMismatch(liveProbeFailure ?? liveProbeDetail)),
      mismatchCategory,
      mismatchAction
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
        else if (checks.officialBenefitUrl) linkType = "affiliate";
        else if (checks.productDetailUrl) linkType = "direct_purchase";
      }
    } catch {
      finalUrl = urlValue;
    }

    const unavailableDetected = checks.unavailableText || liveProbeFailure?.reason === "sold_out_or_ended_text";
    const hardLiveFailureReason = getHardLiveFailureReason(liveProbeFailure);
    const validationReasons = [
      ...issueMessages.map((issue) => issue.replace(`${id}: `, "")),
      ...(hardLiveFailureReason ? [hardLiveFailureReason] : []),
      ...(checks.accessibleContentMismatch ? [mismatchCategory || "live_content_mismatch"] : [])
    ];
    const validationStatus = validationReasons.length ? "failed" : "passed";
    const availability = unavailableDetected ? "sold_out" : validationStatus === "passed" ? "active" : "unknown";
    const validationCode = getValidationCode({
      linkType,
      validationStatus,
      availability,
      checks,
      liveProbeFailure,
      hasUrl: Boolean(urlValue)
    });
    const isHidden =
      availability !== "active" ||
      validationStatus !== "passed" ||
      linkType === "search" ||
      linkType === "seller_search" ||
      linkType === "unavailable" ||
      !urlValue;
    const publishable = !isHidden && validationCode === "valid";
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
      title: dealMetadata.title ?? "",
      mallName: dealMetadata.mallName ?? "",
      category: dealMetadata.category ?? "",
      source: metadata?.source ?? "missing",
      sourceName: dealMetadata.mallName ?? "",
      originalUrl: urlValue,
      finalUrl,
      affiliateUrl: linkType === "affiliate" ? urlValue : "",
      eventUrl: checks.officialBenefitUrl ? urlValue : "",
      linkType,
      availability,
      validationStatus,
      validationCode,
      validationReason: validationReasons.length ? validationReasons.join(" | ") : "passed",
      mismatchCategory,
      mismatchAction,
      lastCheckedAt: metadata?.checkedAt ?? "",
      priorityScore,
      isHidden,
      publishable,
      host,
      evidence: metadata?.evidence ?? "",
      checks,
      liveProbe: liveProbeFailure
        ? {
            ok: false,
            status: liveProbeFailure.status,
            reason: liveProbeFailure.reason,
            finalUrl: liveProbeFailure.finalUrl,
            titleSimilarity: liveProbeFailure.titleSimilarity ?? null,
            contentMatch: liveProbeFailure.contentMatch ?? null,
            accessGuard: liveProbeFailure.accessGuard ?? false,
            rateLimited: isRateLimitedProbe(liveProbeFailure)
          }
        : liveProbeEnabled
          ? {
              status: liveProbeDetail?.status ?? 0,
              reason: liveProbeDetail?.reason ?? "",
              ok: true,
              bodyChecked: liveProbeDetail?.bodyChecked ?? false,
              title: liveProbeDetail?.title ?? "",
              metaDescription: liveProbeDetail?.metaDescription ?? "",
              textSample: liveProbeDetail?.textSample ?? "",
              titleSimilarity: liveProbeDetail?.titleSimilarity ?? null,
              contentMatch: liveProbeDetail?.contentMatch ?? null,
              priceSignal: liveProbeDetail?.priceSignal ?? false,
              purchaseActionSignal: liveProbeDetail?.purchaseActionSignal ?? false,
              accessGuard: liveProbeDetail?.accessGuard ?? false,
              rateLimited: isRateLimitedProbe(liveProbeDetail)
            }
          : { ok: null, reason: "disabled" }
    };
  });
}

function getVerificationEvidenceTier(item) {
  if (item.validationStatus !== "passed" || item.availability !== "active" || item.isHidden) return "blocked";
  if (item.liveProbe?.ok === true && item.checks?.contentMatch === true) return "live_content_confirmed";
  if (item.liveProbe?.ok === true && (item.checks?.priceSignal || item.checks?.purchaseActionSignal)) return "live_commerce_signal_confirmed";
  if (item.liveProbe?.ok === false && item.checks?.accessGuard) return "seller_access_protected_manual_verified";
  if (item.liveProbe?.ok === false && item.checks?.rateLimited) return "seller_rate_limited_manual_verified";
  if (item.liveProbe?.ok === false && ["request_failed", "timeout"].includes(item.liveProbe?.reason)) return "transient_network_manual_verified";
  if (item.linkType === "direct_purchase" || item.linkType === "affiliate") return "manual_pattern_verified";
  return "manual_review_needed";
}

function getRevalidationPriority(item) {
  if (item.validationStatus !== "passed" || item.availability !== "active" || item.isHidden) return 100;
  if (item.liveProbe?.reason === "sold_out_or_ended_text") return 95;
  if (item.liveProbe?.status === 404 || item.liveProbe?.status === 410 || item.liveProbe?.status >= 500) return 90;
  if (["request_failed", "timeout"].includes(item.liveProbe?.reason)) return 75;
  if (item.checks?.accessibleContentMismatch) return 65;
  if (item.liveProbe?.reason === "http_429") return 55;
  if (item.liveProbe?.reason === "robots_or_access_blocked") return 45;
  return 20;
}

function getRevalidationReason(item) {
  if (item.validationStatus !== "passed" || item.availability !== "active" || item.isHidden) return item.validationReason || "not_publishable";
  if (item.liveProbe?.reason === "sold_out_or_ended_text") return "live_sold_out_or_ended_signal";
  if (item.liveProbe?.status === 404 || item.liveProbe?.status === 410 || item.liveProbe?.status >= 500) return `live_http_${item.liveProbe.status}`;
  if (["request_failed", "timeout"].includes(item.liveProbe?.reason)) return item.liveProbe.reason;
  if (item.checks?.accessibleContentMismatch) return "accessible_content_mismatch_blocked";
  if (item.liveProbe?.reason === "http_429") return "seller_rate_limited_review";
  if (item.liveProbe?.reason === "robots_or_access_blocked") return "seller_access_protected_review";
  return "routine_rotation_review";
}

function getIssueDealId(issue) {
  return String(issue ?? "").match(/^(d\d+):/)?.[1] ?? "";
}

const dealIds = [...mockDeals.matchAll(/deal\("(d\d+)"/g)].map((match) => match[1]);
const entries = parseVerifiedEntries();
const entryMap = new Map(entries.map((entry) => [entry.id, entry.url]));
const metadataMap = new Map(entries.map((entry) => [entry.id, entry]));
const dealMetadataMap = new Map(parseMockDealMetadata().map((entry) => [entry.id, entry]));
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
      const probe = await probeLiveUrl(urlValue, dealMetadataMap.get(id) ?? {});
      recordLiveProbeResult(id, urlValue, probe);

      if (probe.finalUrl && probe.finalUrl !== urlValue) {
        const finalUrl = new URL(probe.finalUrl);
        if (isHomeOnly(finalUrl) || isSearchLike(finalUrl)) {
          issues.push(`${id}: redirect 후 최종 URL이 검색/대표 페이지입니다. ${probe.finalUrl}`);
          addExcludedReason("redirect_to_search_or_home");
        }
      }

      if (probe.reason === "sold_out_or_ended_text") {
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

const auditedItems = buildAuditedItems({ dealIds, entryMap, metadataMap, dealMetadataMap, issues });
const auditedItemsWithEvidence = auditedItems.map((item) => ({
  ...item,
  verificationEvidenceTier: getVerificationEvidenceTier(item),
  revalidationPriority: getRevalidationPriority(item),
  revalidationReason: getRevalidationReason(item)
}));
const exposureAudit = {
  totalItems: auditedItemsWithEvidence.length,
  exposedItems: auditedItemsWithEvidence.filter((item) => !item.isHidden).length,
  publishableItems: auditedItemsWithEvidence.filter((item) => item.publishable).length,
  passedItems: auditedItemsWithEvidence.filter((item) => item.validationStatus === "passed" && item.availability === "active" && !item.isHidden).length,
  hiddenItems: auditedItemsWithEvidence.filter((item) => item.isHidden).length,
  searchItems: auditedItemsWithEvidence.filter((item) => item.linkType === "search" || item.linkType === "seller_search").length,
  soldOutItems: auditedItemsWithEvidence.filter((item) => item.availability === "sold_out").length,
  failedItems: auditedItemsWithEvidence.filter((item) => item.validationStatus === "failed").length,
  exposedSearchLinks: auditedItemsWithEvidence.filter((item) => !item.isHidden && (item.linkType === "search" || item.linkType === "seller_search")).length,
  exposedSoldOutLinks: auditedItemsWithEvidence.filter((item) => !item.isHidden && item.availability === "sold_out").length,
  exposedBrokenLinks: auditedItemsWithEvidence.filter((item) => !item.isHidden && item.validationStatus === "failed").length,
  exposedInvalidUrls: auditedItemsWithEvidence.filter((item) => !item.isHidden && item.checks?.httpUrl === false).length,
  exposedNonPublishableItems: auditedItemsWithEvidence.filter((item) => !item.isHidden && item.publishable !== true).length,
  averagePriorityScore: auditedItemsWithEvidence.length ? Math.round(auditedItemsWithEvidence.reduce((sum, item) => sum + item.priorityScore, 0) / auditedItemsWithEvidence.length) : 0
};
const hiddenAuditIds = new Set(auditedItemsWithEvidence.filter((item) => item.isHidden).map((item) => item.id));
const exposedIssues = issues.filter((issue) => {
  const issueDealId = getIssueDealId(issue);
  return !issueDealId || !hiddenAuditIds.has(issueDealId);
});
const liveProbeReasonCounts = liveProbe.failures.reduce((counts, failure) => {
  counts.set(failure.reason, (counts.get(failure.reason) ?? 0) + 1);
  return counts;
}, new Map());
const liveProbeHostFailureCounts = liveProbe.failures.reduce((counts, failure) => {
  let host = "unknown";

  try {
    host = new URL(failure.finalUrl || failure.url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    host = "invalid_url";
  }

  counts.set(host, (counts.get(host) ?? 0) + 1);
  return counts;
}, new Map());
const hardLiveProbeFailures = liveProbe.failures.filter((failure) => {
  if (failure.reason === "robots_or_access_blocked") return false;
  if (failure.reason === "request_failed") return false;
  if (failure.reason === "timeout") return false;
  if (failure.reason === "sold_out_or_ended_text") return true;
  return failure.status === 404 || failure.status === 410 || failure.status >= 500;
});
const hardLiveProbeFailureIds = new Set(hardLiveProbeFailures.map((failure) => failure.id));
const exposedHardLiveProbeFailures = auditedItemsWithEvidence.filter((item) => !item.isHidden && hardLiveProbeFailureIds.has(item.id));
const transientLiveProbeFailures = liveProbe.failures.filter((failure) => failure.reason === "timeout" || failure.reason === "request_failed");
const verificationEvidenceCounts = auditedItemsWithEvidence.reduce((counts, item) => {
  counts.set(item.verificationEvidenceTier, (counts.get(item.verificationEvidenceTier) ?? 0) + 1);
  return counts;
}, new Map());
const mismatchCategoryCounts = auditedItemsWithEvidence
  .filter((item) => item.mismatchCategory)
  .reduce((counts, item) => {
    counts.set(item.mismatchCategory, (counts.get(item.mismatchCategory) ?? 0) + 1);
    return counts;
  }, new Map());
const revalidationQueue = auditedItemsWithEvidence
  .filter((item) => item.revalidationPriority >= 45)
  .sort((a, b) => b.revalidationPriority - a.revalidationPriority || b.priorityScore - a.priorityScore || a.id.localeCompare(b.id))
  .slice(0, 30)
  .map((item) => ({
    id: item.id,
    title: item.title,
    mallName: item.mallName,
    host: item.host,
    finalUrl: item.finalUrl,
    priority: item.revalidationPriority,
    reason: item.revalidationReason,
    evidenceTier: item.verificationEvidenceTier,
    liveProbe: item.liveProbe
  }));
const liveProbeReviewSummary = {
  status: !liveProbe.enabled
    ? "disabled"
    : hardLiveProbeFailures.length
      ? "needs_review"
      : transientLiveProbeFailures.length
        ? "transient_network_review"
      : liveProbe.failed
        ? "access_protected_review"
        : "clear",
  hardFailureCount: hardLiveProbeFailures.length,
  exposedHardFailureCount: exposedHardLiveProbeFailures.length,
  exposedSellerUnavailableSignals: auditedItemsWithEvidence.filter((item) => !item.isHidden && item.liveProbe?.reason === "sold_out_or_ended_text").length,
  transientNetworkCount: transientLiveProbeFailures.length,
  accessProtectedCount: liveProbe.robotsBlocked,
  sellerUnavailableSignals: liveProbe.unavailableText,
  contentProbe: {
    bodyChecked: liveProbe.bodyChecked,
    titleMetaChecked: liveProbe.titleMetaChecked,
    contentMatched: liveProbe.contentMatched,
    contentMismatch: liveProbe.contentMismatch,
    accessibleContentMismatch: liveProbe.accessibleContentMismatch,
    accessGuardBody: liveProbe.accessGuardBody,
    priceSignal: liveProbe.priceSignal,
    purchaseActionSignal: liveProbe.purchaseActionSignal,
    strict: process.env.DEAL_LINK_CONTENT_STRICT === "true"
  },
  interpretation: !liveProbe.enabled
    ? "Live probe is disabled for this run."
    : hardLiveProbeFailures.length
      ? "Some URLs returned hard failure signals and should be reviewed before launch."
      : transientLiveProbeFailures.length
        ? "Some URLs returned transient network signals; no exposed search, sold-out, 404, 410, or 5xx links were found."
      : liveProbe.failed
        ? "Failed live checks are seller access protections or non-strict request failures; no exposed search, sold-out, 404, 410, or 5xx links were found."
        : "All live checks passed."
};
const launchGate = {
  passed:
    exposureAudit.exposedSearchLinks === 0 &&
    exposureAudit.exposedSoldOutLinks === 0 &&
    exposureAudit.exposedBrokenLinks === 0 &&
    exposureAudit.exposedInvalidUrls === 0 &&
    exposureAudit.exposedNonPublishableItems === 0 &&
    liveProbeReviewSummary.exposedHardFailureCount === 0 &&
    liveProbeReviewSummary.exposedSellerUnavailableSignals === 0 &&
    exposedIssues.length === 0,
  criteria: {
    exposedSearchLinks: 0,
    exposedSoldOutLinks: 0,
    exposedBrokenLinks: 0,
    exposedInvalidUrls: 0,
    exposedNonPublishableItems: 0,
    liveHardFailures: 0,
    sellerUnavailableSignals: 0
  },
  actual: {
    exposedSearchLinks: exposureAudit.exposedSearchLinks,
    exposedSoldOutLinks: exposureAudit.exposedSoldOutLinks,
    exposedBrokenLinks: exposureAudit.exposedBrokenLinks,
    exposedInvalidUrls: exposureAudit.exposedInvalidUrls,
    exposedNonPublishableItems: exposureAudit.exposedNonPublishableItems,
    liveHardFailures: liveProbeReviewSummary.exposedHardFailureCount,
    sellerUnavailableSignals: liveProbeReviewSummary.exposedSellerUnavailableSignals
  }
};

const report = {
  generatedAt: new Date().toISOString(),
  totalDeals: dealIds.length,
  verificationTargets: dealIds.length,
  passedDirectLinks: exposureAudit.passedItems,
  visibleDeals: exposureAudit.exposedItems,
  publishableDeals: exposureAudit.publishableItems,
  excludedDeals: exposureAudit.hiddenItems,
  failedCount: exposureAudit.failedItems,
  productDetailUrls: productDetailCount,
  officialBenefitUrls: claimBenefitCount,
  searchOrCategorySuspected: excludedReasonCounts.get("search_result_url") ?? 0,
  searchLinks: excludedReasonCounts.get("search_result_url") ?? 0,
  soldOutOrEndedSuspected: soldOutOrEndedCount,
  homeOrMainSuspected: excludedReasonCounts.get("redirect_to_home") ?? 0,
  communitySuspected: excludedReasonCounts.get("community_source") ?? 0,
  manualReviewNeeded: excludedReasonCounts.get("manual_review_needed") ?? 0,
  hiddenCount: exposureAudit.hiddenItems,
  exposedIssues,
  exposedSearchLinks: exposureAudit.exposedSearchLinks,
  exposedSoldOutLinks: exposureAudit.exposedSoldOutLinks,
  exposedBrokenLinks: exposureAudit.exposedBrokenLinks,
  exposedInvalidUrls: exposureAudit.exposedInvalidUrls,
  exposedNonPublishableItems: exposureAudit.exposedNonPublishableItems,
  visibleCount: exposureAudit.exposedItems,
  liveProbe,
  httpStatusSummary: {
    redirected: liveProbe.redirected,
    finalUrlChanged: liveProbe.finalUrlChanged,
    http404: liveProbe.http404,
    http410: liveProbe.http410,
    http5xx: liveProbe.http5xx,
    timeout: liveProbe.timeout,
    rateLimited: liveProbe.rateLimited,
    robotsBlocked: liveProbe.robotsBlocked,
    unavailableText: liveProbe.unavailableText,
    unavailableTextReview: liveProbe.unavailableTextReview
  },
  contentSignalSummary: {
    bodyChecked: liveProbe.bodyChecked,
    titleMetaChecked: liveProbe.titleMetaChecked,
    contentMatched: liveProbe.contentMatched,
    contentMismatch: liveProbe.contentMismatch,
    priceSignal: liveProbe.priceSignal,
    purchaseActionSignal: liveProbe.purchaseActionSignal,
    unavailableTextReview: liveProbe.unavailableTextReview,
    accessibleContentMismatch: liveProbe.accessibleContentMismatch,
    accessGuardBody: liveProbe.accessGuardBody,
    strict: process.env.DEAL_LINK_CONTENT_STRICT === "true"
  },
  verificationEvidenceSummary: {
    counts: Object.fromEntries([...verificationEvidenceCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
    liveConfirmed: (verificationEvidenceCounts.get("live_content_confirmed") ?? 0) + (verificationEvidenceCounts.get("live_commerce_signal_confirmed") ?? 0),
    sellerAccessProtected: verificationEvidenceCounts.get("seller_access_protected_manual_verified") ?? 0,
    sellerRateLimited: verificationEvidenceCounts.get("seller_rate_limited_manual_verified") ?? 0,
    transientNetwork: verificationEvidenceCounts.get("transient_network_manual_verified") ?? 0,
    manualPatternVerified: verificationEvidenceCounts.get("manual_pattern_verified") ?? 0,
    blocked: verificationEvidenceCounts.get("blocked") ?? 0
  },
  mismatchCategoryCounts: Object.fromEntries([...mismatchCategoryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  revalidationQueue,
  policy: {
    version: linkQualityPolicy.version,
    source: "data/linkQualityPolicy.json",
    searchPatterns: linkQualityPolicy.searchPatterns.length,
    unavailableTextPatterns: linkQualityPolicy.unavailableTextPatterns.length,
    liveUnavailableTextPatterns: liveUnavailablePatterns.length,
    productDetailSignals: linkQualityPolicy.productDetailSignals.length,
    officialBenefitUrlSignals: linkQualityPolicy.officialBenefitUrlSignals.length
  },
  exposurePolicy: {
    ...linkQualityPolicy.exposurePolicy
  },
  exposureAudit,
  launchGate,
  liveProbeReviewSummary,
  liveProbeReasonCounts: Object.fromEntries([...liveProbeReasonCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  liveProbeHostFailureCounts: Object.fromEntries([...liveProbeHostFailureCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 30)),
  hardLiveProbeFailures,
  exposedHardLiveProbeFailures,
  transientLiveProbeFailures,
  auditedItems: auditedItemsWithEvidence,
  excludedReasonCounts: Object.fromEntries([...excludedReasonCounts.entries()].sort(([a], [b]) => a.localeCompare(b))),
  domainCounts: Object.fromEntries([...domainCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
  issues
};

mkdirSync(join(root, "reports"), { recursive: true });
writeFileSync(join(root, "LINK_VERIFICATION_RESULT.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(root, "reports", "link-validation.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(
  join(root, "data", "linkValidationExposureOverrides.json"),
  `${JSON.stringify(
    {
      generatedAt: report.generatedAt,
      sourceReport: "reports/link-validation.json",
      hiddenCount: report.exposureAudit.hiddenItems,
      items: report.auditedItems
        .filter((item) => item.isHidden === true || item.publishable !== true || item.validationStatus !== "passed" || item.availability !== "active")
        .map((item) => ({
          id: item.id,
          title: item.title,
          mallName: item.mallName,
          availability: item.availability,
          validationStatus: item.validationStatus,
          validationReason: item.validationReason,
          validationCode: item.validationCode,
          mismatchCategory: item.mismatchCategory,
          mismatchAction: item.mismatchAction,
          evidenceTier: item.verificationEvidenceTier,
          revalidationReason: item.revalidationReason,
          finalUrl: item.finalUrl
        }))
    },
    null,
    2
  )}\n`,
  "utf8"
);
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
| 최종 발행 가능 상품 수 | ${report.exposureAudit.publishableItems} |
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
| Live probe rate limit | ${report.liveProbe.rateLimited} |
| Live probe timeout | ${report.liveProbe.timeout} |
| Live probe exposed hard failure | ${report.liveProbeReviewSummary.exposedHardFailureCount} |
| Live probe hidden hard failure review | ${Math.max(0, report.liveProbeReviewSummary.hardFailureCount - report.liveProbeReviewSummary.exposedHardFailureCount)} |
| Live probe transient network | ${report.liveProbeReviewSummary.transientNetworkCount} |
| Live body 확인 | ${report.contentSignalSummary.bodyChecked} |
| Live 제목/메타 확인 | ${report.contentSignalSummary.titleMetaChecked} |
| Live 콘텐츠 일치 신호 | ${report.contentSignalSummary.contentMatched} |
| Live 콘텐츠 불일치 신호 | ${report.contentSignalSummary.contentMismatch} |
| Live 접근 가능 본문 불일치 | ${report.contentSignalSummary.accessibleContentMismatch} |
| Live 접근 차단 본문 | ${report.contentSignalSummary.accessGuardBody} |
| Live 가격 신호 | ${report.contentSignalSummary.priceSignal} |
| Live 구매/신청 버튼 신호 | ${report.contentSignalSummary.purchaseActionSignal} |
| Live 종료 문구 재검토 신호 | ${report.contentSignalSummary.unavailableTextReview} |
| 출시 게이트 통과 | ${report.launchGate.passed ? "YES" : "NO"} |
| 노출 검색 링크 | ${report.exposedSearchLinks} |
| 노출 품절/종료 링크 | ${report.exposedSoldOutLinks} |
| 노출 깨진 링크 | ${report.exposedBrokenLinks} |
| 노출 invalid URL | ${report.exposedInvalidUrls} |
| 노출 publishable=false | ${report.exposureAudit.exposedNonPublishableItems} |

## Live Probe Review

- 상태: ${report.liveProbeReviewSummary.status}
- 해석: ${report.liveProbeReviewSummary.interpretation}
- 고객에게 노출되는 404/410/5xx/품절 본문 같은 강한 실패 신호: ${report.liveProbeReviewSummary.exposedHardFailureCount}
- 숨김 처리 후 보정 큐에 남은 강한 실패 신호: ${Math.max(0, report.liveProbeReviewSummary.hardFailureCount - report.liveProbeReviewSummary.exposedHardFailureCount)}
- timeout/request_failed 같은 일시 네트워크 신호: ${report.liveProbeReviewSummary.transientNetworkCount}
- 쇼핑몰 접근 보호 또는 robots/access 차단: ${report.liveProbeReviewSummary.accessProtectedCount}
- 품절/판매종료 본문 감지: ${report.liveProbeReviewSummary.sellerUnavailableSignals}

## Verification Evidence

${Object.entries(report.verificationEvidenceSummary.counts).map(([tier, count]) => `- ${tier}: ${count}`).join("\n")}

## Revalidation Queue

${report.revalidationQueue.length ? report.revalidationQueue.map((item) => `- ${item.id} · ${item.mallName} · ${item.reason} · priority ${item.priority}`).join("\n") : "- 우선 재검증 대상 없음"}

### Live Probe Failure Reasons

${Object.entries(report.liveProbeReasonCounts).length ? Object.entries(report.liveProbeReasonCounts).map(([reason, count]) => `- ${reason}: ${count}`).join("\n") : "- 없음"}

### Live Probe Failed Hosts

${Object.entries(report.liveProbeHostFailureCounts).length ? Object.entries(report.liveProbeHostFailureCounts).map(([host, count]) => `- ${host}: ${count}`).join("\n") : "- 없음"}

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
console.log(`- Publishable after exposure policy: ${report.publishableDeals}/${report.totalDeals} (hidden ${report.hiddenCount})`);
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
    `- Live probe signals: 404 ${liveProbe.http404}, 410 ${liveProbe.http410}, 5xx ${liveProbe.http5xx}, timeout ${liveProbe.timeout}, rate-limit ${liveProbe.rateLimited}, robots/access ${liveProbe.robotsBlocked}, sold-out text ${liveProbe.unavailableText}`
  );
  console.log(`- Live probe failure reasons: ${reasonSummary || "none"}`);

  if (!liveProbe.strict && liveProbe.failed) {
    console.log("- Live probe is non-strict: seller access protections are recorded for review without hiding otherwise valid purchase links.");
  }
}

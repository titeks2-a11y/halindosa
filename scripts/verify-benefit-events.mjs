import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const snapshotPath = join(root, "data", "refreshedNewsDeals.json");
const reportPath = join(root, "reports", "free-benefit-events.json");
const docsPath = join(root, "docs", "FREE_BENEFIT_EVENTS_REPORT.md");

const minimumVisibleEvents = 100;
const allowedBenefitTypes = new Set([
  "coupon",
  "freebie",
  "freeShipping",
  "event",
  "point",
  "public",
  "membership",
  "card",
  "culture",
  "convenienceStore",
  "mart",
  "foodDelivery"
]);
const blockedUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|sword=|kwd=|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum|youtube|example\.com/i;
const endedPattern = /마감|종료|품절|판매\s*종료|일시\s*품절|선착순\s*마감|이벤트\s*종료|행사\s*종료|재입고\s*알림/i;
const privateHostPattern = /(^localhost$)|(^127\.)|(^10\.)|(^172\.(1[6-9]|2\d|3[0-1])\.)|(^192\.168\.)|(^169\.254\.)|(^0\.0\.0\.0$)|(\.local$)|metadata\.google|169\.254\.169\.254/i;
const homePathSet = new Set(["", "/", "/main", "/index"]);

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function sanitize(value, maxLength = 180) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/javascript:/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeTitle(value) {
  return sanitize(value, 120)
    .toLowerCase()
    .replace(/\[[^\]]+\]|\([^)]+\)/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function normalizeHost(host) {
  return String(host ?? "").replace(/^www\./, "").toLowerCase();
}

function normalizeUrlKey(value) {
  if (!value) return "";

  try {
    const url = new URL(value);
    for (const param of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "igshid"]) {
      url.searchParams.delete(param);
    }
    url.hash = "";
    url.hostname = normalizeHost(url.hostname);
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    url.searchParams.sort();
    return url.toString().toLowerCase();
  } catch {
    return String(value ?? "").toLowerCase().replace(/[#?].*$/, "").replace(/\/+$/, "");
  }
}

function hostFromUrlKey(value) {
  try {
    return normalizeHost(new URL(value).hostname);
  } catch {
    return "";
  }
}

function buildDedupeKey(event) {
  const normalizedUrl = normalizeUrlKey(event.finalUrl || event.officialUrl || event.eventUrl);
  return [
    event.brandName.toLowerCase().replace(/\s+/g, ""),
    normalizeTitle(event.title),
    event.host || hostFromUrlKey(normalizedUrl || event.finalUrl || event.officialUrl || event.eventUrl),
    event.benefitType,
    String(event.endAt).slice(0, 10),
    normalizedUrl
  ].join("|");
}

function readAllowedHosts() {
  const catalog = readJson(join(root, "data", "officialSourceCatalog.json"), []);
  return new Set(
    catalog
      .flatMap((source) => [source.officialUrl, ...(Array.isArray(source.allowedFinalHosts) ? source.allowedFinalHosts : [])])
      .map((value) => {
        try {
          const input = String(value ?? "");
          const parsed = new URL(input.startsWith("http") ? input : `https://${input}`);
          return normalizeHost(parsed.hostname);
        } catch {
          return "";
        }
      })
      .filter(Boolean)
  );
}

function classifyUrl(value, allowedHosts) {
  if (!value) return { ok: false, reason: "missing" };
  if (blockedUrlPattern.test(value)) return { ok: false, reason: "blocked_pattern" };

  try {
    const url = new URL(value);
    const host = normalizeHost(url.hostname);
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, reason: "non_http" };
    if (privateHostPattern.test(host)) return { ok: false, reason: "private_host" };
    if (homePathSet.has(path)) return { ok: false, reason: "homepage" };
    const allowed = Array.from(allowedHosts).some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
    if (!allowed) return { ok: false, reason: "unapproved_host", host };
    return { ok: true, reason: "official", host };
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
}

function toEvent(deal, allowedHosts, now) {
  const text = sanitize([deal.title, deal.summary, deal.category, deal.sourceName, (deal.tags ?? []).join(" ")].join(" "), 600);
  const urlCheck = classifyUrl(deal.finalUrl, allowedHosts);
  const endsAt = Date.parse(deal.expiresAt || deal.endDate);
  const expired = deal.availability === "expired" || endedPattern.test(text) || (Number.isFinite(endsAt) && endsAt < now);
  const validationStatus = !urlCheck.ok ? "blocked" : deal.validationStatus === "passed" ? "passed" : "failed";
  const status = !urlCheck.ok || deal.isHidden || deal.publishable === false ? "blocked" : expired ? "expired" : deal.availability === "active" ? "active" : "unknown";
  const benefitType = allowedBenefitTypes.has(deal.benefitType) ? deal.benefitType : "event";
  const event = {
    id: deal.id,
    title: sanitize(deal.title, 90),
    brandName: sanitize(deal.merchant || deal.mallName || deal.sourceName, 40),
    benefitType,
    eventUrl: deal.eventUrl || deal.finalUrl,
    officialUrl: deal.sourceUrl || deal.finalUrl,
    finalUrl: urlCheck.ok ? deal.finalUrl : "",
    startAt: deal.startDate,
    endAt: deal.expiresAt || deal.endDate,
    participationCondition: /구매|주문|결제/.test(text) ? "구매 필요" : /로그인|회원|가입/.test(text) ? "로그인 필요" : "공식 페이지 확인",
    requiresLogin: /로그인|회원|가입|앱\s*설치|멤버십/.test(text),
    requiresPurchase: /구매|주문|결제|최소\s*주문|이상\s*구매|배송비/.test(text),
    isEveryoneReward: /전원|모두|누구나|100%/.test(text),
    isFirstComeFirstServed: /선착순|한정|소진\s*시|수량\s*한정/.test(text),
    rewardText: sanitize(deal.summary || deal.title, 120),
    collectedAt: deal.updatedAt || deal.startDate,
    verifiedAt: deal.verifiedAt || deal.lastCheckedAt,
    status,
    validationStatus,
    validationReason: urlCheck.ok ? "official_event_link_passed" : urlCheck.reason,
    sourceName: sanitize(deal.sourceName, 50),
    sourceType: deal.provider,
    sourceUrl: deal.sourceUrl,
    qualityScore: Number(deal.qualityScore ?? 0),
    freshnessScore: scoreFreshness(deal, now),
    officialScore: scoreOfficial(deal, urlCheck),
    urgencyScore: scoreUrgency(deal.expiresAt || deal.endDate, now),
    priorityScore: Number(deal.priorityScore ?? deal.confidenceScore ?? 0),
    hiddenReason: sanitize(deal.hiddenReason || (status === "active" ? "" : status), 80),
    tags: (deal.tags ?? []).map((tag) => sanitize(tag, 24)).filter(Boolean).slice(0, 8),
    host: urlCheck.host ?? ""
  };

  return {
    ...event,
    rewardScore: scoreReward(event)
  };
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function average(items, key) {
  const values = items.map((item) => Number(item[key] ?? 0)).filter((value) => Number.isFinite(value));
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function scoreFreshness(deal, now) {
  const checkedAt = Date.parse(deal.verifiedAt || deal.lastCheckedAt || deal.updatedAt || deal.startDate);
  if (!Number.isFinite(checkedAt)) return 45;
  const ageHours = Math.max(0, (now - checkedAt) / 3_600_000);
  if (ageHours <= 6) return 100;
  if (ageHours <= 24) return 92;
  if (ageHours <= 72) return 78;
  if (ageHours <= 168) return 62;
  if (ageHours <= 336) return 45;
  return 25;
}

function scoreOfficial(deal, urlCheck) {
  let score = 0;
  if (deal.provider === "official_event" || deal.provider === "public_coupon") score += 58;
  if (deal.validationStatus === "passed") score += 20;
  if (String(deal.linkType || "").startsWith("official")) score += 18;
  if (urlCheck.ok) score += 12;
  if (/blog|cafe|community|news|search/i.test(String(deal.linkType || ""))) score -= 70;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreUrgency(endAt, now) {
  const endsAt = Date.parse(endAt);
  if (!Number.isFinite(endsAt)) return 45;
  const hoursLeft = (endsAt - now) / 3_600_000;
  if (hoursLeft < 0) return 0;
  if (hoursLeft <= 24) return 100;
  if (hoursLeft <= 72) return 86;
  if (hoursLeft <= 7 * 24) return 68;
  if (hoursLeft <= 14 * 24) return 54;
  return 40;
}

function scoreReward(event) {
  let score = 42;
  if (!event.requiresPurchase) score += 18;
  else score -= 18;
  if (event.isEveryoneReward) score += 16;
  if (event.isFirstComeFirstServed) score += 10;
  if (["gifticon", "freebie", "event", "coupon", "point"].includes(event.benefitType)) score += 12;
  if (/기프티콘|샘플|무료\s*체험|교환권|포인트|캐시백|전원|선착순|0원|무료배송/i.test(event.rewardText)) score += 10;
  if (event.benefitType === "public") score -= 34;
  return Math.max(0, Math.min(100, Math.round(score)));
}

const snapshot = readJson(snapshotPath, { deals: [], generatedAt: "" });
const rawDeals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
const allowedHosts = readAllowedHosts();
const now = Date.now();
const candidates = rawDeals.map((deal) => toEvent(deal, allowedHosts, now));
const dedupedMap = new Map();

for (const event of candidates) {
  const key = buildDedupeKey(event).toLowerCase();
  const current = dedupedMap.get(key);
  if (!current || event.qualityScore + event.priorityScore > current.qualityScore + current.priorityScore) dedupedMap.set(key, event);
}

const deduped = Array.from(dedupedMap.values());
const visible = deduped.filter((event) => event.status === "active" && event.validationStatus === "passed" && event.finalUrl && event.qualityScore >= 70);
const blocked = deduped.filter((event) => event.status === "blocked" || event.validationStatus === "blocked");
const expired = deduped.filter((event) => event.status === "expired");
const purchaseRequired = visible.filter((event) => event.requiresPurchase);
const noPurchase = visible.filter((event) => !event.requiresPurchase);
const sourceCount = new Set(visible.map((event) => event.sourceName).filter(Boolean)).size;
const hostCount = new Set(visible.map((event) => event.host).filter(Boolean)).size;
const problems = [];

if (visible.length < minimumVisibleEvents) problems.push(`active official free benefit events ${visible.length}/${minimumVisibleEvents}`);
if (visible.some((event) => blockedUrlPattern.test(event.finalUrl))) problems.push("visible event contains search/community/news URL");
if (visible.some((event) => homePathSet.has(new URL(event.finalUrl).pathname.replace(/\/+$/, "").toLowerCase()))) problems.push("visible event contains homepage URL");
if (visible.some((event) => event.status !== "active" || event.validationStatus !== "passed")) problems.push("visible event contains inactive or unpassed status");
if (sourceCount < 50) problems.push(`official source diversity too low: ${sourceCount}/50`);
if (hostCount < 45) problems.push(`official host diversity too low: ${hostCount}/45`);

const report = {
  ok: problems.length === 0,
  generatedAt: new Date().toISOString(),
  sourceSnapshotGeneratedAt: snapshot.generatedAt ?? "",
  totalRawDeals: rawDeals.length,
  candidateEvents: candidates.length,
  dedupedEvents: deduped.length,
  visibleActiveEvents: visible.length,
  minimumVisibleEvents,
  noPurchaseVisibleEvents: noPurchase.length,
  purchaseRequiredVisibleEvents: purchaseRequired.length,
  blockedEvents: blocked.length,
  expiredEvents: expired.length,
  duplicateMergedCount: candidates.length - deduped.length,
  sourceCount,
  hostCount,
  averageScores: {
    quality: average(visible, "qualityScore"),
    freshness: average(visible, "freshnessScore"),
    official: average(visible, "officialScore"),
    urgency: average(visible, "urgencyScore"),
    reward: average(visible, "rewardScore")
  },
  benefitTypeCounts: countBy(visible, "benefitType"),
  sourceTypeCounts: countBy(visible, "sourceType"),
  topEvents: visible.slice(0, 20).map((event) => ({
    id: event.id,
    title: event.title,
    sourceName: event.sourceName,
    benefitType: event.benefitType,
    finalUrl: event.finalUrl,
    endAt: event.endAt,
    qualityScore: event.qualityScore,
    freshnessScore: event.freshnessScore,
    officialScore: event.officialScore,
    urgencyScore: event.urgencyScore,
    rewardScore: event.rewardScore,
    requiresLogin: event.requiresLogin,
    requiresPurchase: event.requiresPurchase
  })),
  blockedSamples: blocked.slice(0, 20).map((event) => ({
    id: event.id,
    title: event.title,
    sourceName: event.sourceName,
    validationReason: event.validationReason,
    hiddenReason: event.hiddenReason
  })),
  problems
};

const docs = `# Free Benefit Event Verification

Generated: ${report.generatedAt}

| Metric | Value |
| --- | ---: |
| Raw deals | ${report.totalRawDeals} |
| Candidate events | ${report.candidateEvents} |
| Deduped events | ${report.dedupedEvents} |
| Visible active official events | ${report.visibleActiveEvents} |
| Minimum visible events | ${report.minimumVisibleEvents} |
| No-purchase visible events | ${report.noPurchaseVisibleEvents} |
| Purchase-required visible events | ${report.purchaseRequiredVisibleEvents} |
| Blocked events | ${report.blockedEvents} |
| Expired events | ${report.expiredEvents} |
| Duplicate merged | ${report.duplicateMergedCount} |
| Source diversity | ${report.sourceCount} |
| Host diversity | ${report.hostCount} |
| Avg quality score | ${report.averageScores.quality} |
| Avg freshness score | ${report.averageScores.freshness} |
| Avg official score | ${report.averageScores.official} |
| Avg urgency score | ${report.averageScores.urgency} |
| Avg reward score | ${report.averageScores.reward} |

## Policy

- Only active official event, coupon, sample, free trial, point, public benefit, and free-shipping URLs can be visible.
- Search pages, homepages, community posts, news articles, private-network URLs, and expired/sold-out pages are blocked.
- Purchase-required events remain visible with lower priority and explicit condition metadata.

## Problems

${problems.length ? problems.map((problem) => `- ${problem}`).join("\n") : "- None"}
`;

mkdirSync(join(root, "reports"), { recursive: true });
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(docsPath, `${docs}\n`, "utf8");

if (!report.ok) {
  console.error(`Free benefit event verification failed: ${problems.join("; ")}`);
  process.exit(1);
}

console.log(`Free benefit event verification passed: ${visible.length}/${minimumVisibleEvents} active official events, ${sourceCount} sources, ${hostCount} hosts.`);

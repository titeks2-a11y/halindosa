import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mockDeals = readFileSync(join(root, "data/mockDeals.ts"), "utf8");
const verifiedLinks = readFileSync(join(root, "data/verifiedPurchaseLinks.ts"), "utf8");

const blockedHosts = [
  "ppomppu.co.kr",
  "fmkorea.com",
  "quasarzone.com",
  "algumon.com",
  "clien.net",
  "ruliweb.com",
  "dcinside.com",
  "theqoo.net",
  "instiz.net",
  "coolenjoy.net",
  "example.com"
];

const searchPatterns = [
  "/search",
  "search.",
  "query=",
  "keyword=",
  "kwd=",
  "sword=",
  "wholesale-",
  "/np/search",
  "/productions/feed",
  "/category",
  "/categories"
];
const allowedSources = new Set(["manual_review", "partner_feed", "official_api"]);
const minimums = {
  distinctHosts: 18,
  evidenceLength: 12
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

const dealIds = [...mockDeals.matchAll(/deal\("(d\d+)"/g)].map((match) => match[1]);
const entries = parseVerifiedEntries();
const entryMap = new Map(entries.map((entry) => [entry.id, entry.url]));
const metadataMap = new Map(entries.map((entry) => [entry.id, entry]));
const issues = [];
const hosts = new Set();

for (const id of dealIds) {
  const urlValue = entryMap.get(id);
  const metadata = metadataMap.get(id);
  if (!urlValue) {
    issues.push(`${id}: verifiedPurchaseLinks.ts에 실제 구매 상세 URL이 없습니다.`);
    continue;
  }

  if (!metadata?.checkedAt || Number.isNaN(Date.parse(metadata.checkedAt))) {
    issues.push(`${id}: checkedAt 검수 시각이 없거나 ISO 날짜가 아닙니다.`);
  }

  if (!allowedSources.has(metadata?.source)) {
    issues.push(`${id}: source는 manual_review, partner_feed, official_api 중 하나여야 합니다. ${metadata?.source ?? "(없음)"}`);
  }

  if (!metadata?.evidence || metadata.evidence.trim().length < minimums.evidenceLength) {
    issues.push(`${id}: evidence 검수 근거가 부족합니다.`);
  }

  try {
    const url = new URL(urlValue);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    hosts.add(host);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      issues.push(`${id}: http/https가 아닌 URL입니다. ${urlValue}`);
    }

    if (isBlockedHost(host)) {
      issues.push(`${id}: 커뮤니티 또는 placeholder 링크입니다. ${urlValue}`);
    }

    if (isHomeOnly(url)) {
      issues.push(`${id}: 쇼핑몰 메인 링크입니다. ${urlValue}`);
    }

    if (isSearchLike(url)) {
      issues.push(`${id}: 검색/카테고리 링크입니다. ${urlValue}`);
    }
  } catch {
    issues.push(`${id}: 올바른 URL이 아닙니다. ${urlValue}`);
  }
}

const extraEntries = entries.filter((entry) => !dealIds.includes(entry.id));
if (extraEntries.length) {
  issues.push(`사용하지 않는 검증 링크 ID가 있습니다: ${extraEntries.map((entry) => entry.id).join(", ")}`);
}

if (hosts.size < minimums.distinctHosts) {
  issues.push(`검증 링크 판매처 도메인이 부족합니다: ${hosts.size}/${minimums.distinctHosts}`);
}

if (issues.length) {
  console.error("Product link verification failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

const coverageRate = dealIds.length ? Math.round((entries.length / dealIds.length) * 100) : 0;
console.log(`Product link verification passed: ${entries.length}/${dealIds.length} verified purchase URLs (${coverageRate}%).`);
console.log(`- Distinct purchase hosts: ${hosts.size}`);

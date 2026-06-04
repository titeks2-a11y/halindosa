import { parseNewsFeedXmlItems } from "@/lib/deals/providers/newsProvider";
import { isApprovedOfficialNewsUrl } from "@/lib/deals/newsLinkPolicy";
import type { NewsDeal } from "@/types/newsDeal";

type NewsProviderName = NewsDeal["provider"];

interface NewsFeedDryRunInput {
  source?: string;
  provider?: NewsProviderName;
  items?: unknown;
  text?: string;
}

interface CandidateRow {
  id: string;
  title: string;
  merchant: string;
  category: string;
  benefitType: string;
  finalUrl: string;
  sourceUrl: string;
  linkType: NewsDeal["linkType"];
  availability: NewsDeal["availability"];
  validationStatus: NewsDeal["validationStatus"];
  hiddenReason: string;
  priorityScore: number;
  action: string;
}

const blockedContextHosts = [
  "ppomppu.co.kr",
  "fmkorea.com",
  "quasarzone.com",
  "algumon.com",
  "clien.net",
  "dcinside.com",
  "theqoo.net",
  "blog.naver.com",
  "m.blog.naver.com",
  "news.naver.com",
  "v.daum.net",
  "news.daum.net",
  "youtube.com"
];

const searchLikePatterns = [
  "/search",
  "search?",
  "query=",
  "keyword=",
  "shopping/search",
  "msearch",
  "/find",
  "/result",
  "sword=",
  "kwd="
];

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? fallback : String(value).trim();
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function arrayValue(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = recordValue(value);
  const candidates = [record.deals, record.items, record.newsDeals, record.events, record.coupons, record.benefits];
  const collection = candidates.find(Array.isArray);
  return Array.isArray(collection) ? collection : [];
}

function normalizeHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isSearchLikeUrl(value: string) {
  try {
    const url = new URL(value);
    const full = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
    return searchLikePatterns.some((pattern) => full.includes(pattern));
  } catch {
    return false;
  }
}

function isBlockedContextUrl(value: string) {
  const host = normalizeHost(value);
  return Boolean(host && blockedContextHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`)));
}

function extractUrlCandidates(value: string) {
  const candidates = new Set<string>();
  const hrefPattern = /\bhref=["']([^"']+)["']/gi;
  const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
  let match = hrefPattern.exec(value);

  while (match) {
    candidates.add(match[1]);
    match = hrefPattern.exec(value);
  }

  match = urlPattern.exec(value);
  while (match) {
    candidates.add(match[0]);
    match = urlPattern.exec(value);
  }

  return Array.from(candidates).map((candidate) => candidate.replace(/[),.;\]]+$/, "")).filter(Boolean);
}

function firstApprovedOfficialUrl(...values: string[]) {
  return values.flatMap(extractUrlCandidates).find(isApprovedOfficialNewsUrl) ?? "";
}

function firstNonEmpty(...values: string[]) {
  return values.find(Boolean) ?? "";
}

function parseTextPayload(text: string, provider: NewsProviderName) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("<")) {
    return parseNewsFeedXmlItems(trimmed, provider, "admin_paste_news_feed");
  }

  try {
    return arrayValue(JSON.parse(trimmed));
  } catch {
    return [];
  }
}

function classifyLink(finalUrl: string): NewsDeal["linkType"] {
  if (!finalUrl) return "invalid";
  if (isSearchLikeUrl(finalUrl)) return "search";
  if (isBlockedContextUrl(finalUrl)) return "news_only";
  if (isApprovedOfficialNewsUrl(finalUrl)) return "official_benefit";
  return "invalid";
}

function validateCandidate(raw: unknown, index: number, provider: NewsProviderName, generatedAt: string): CandidateRow {
  const item = recordValue(raw);
  const id = firstNonEmpty(stringValue(item.id), stringValue(item.guid), `preview-news-${index + 1}`);
  const title = firstNonEmpty(stringValue(item.title), stringValue(item.name));
  const summary = firstNonEmpty(stringValue(item.summary), stringValue(item.description), stringValue(item.content));
  const sourceUrl = firstNonEmpty(stringValue(item.sourceUrl), stringValue(item.sourceURL), stringValue(item.link), stringValue(item.originalUrl));
  const explicitFinalUrl = firstNonEmpty(
    stringValue(item.finalUrl),
    stringValue(item.eventUrl),
    stringValue(item.purchaseUrl),
    stringValue(item.affiliateUrl),
    stringValue(item.url),
    stringValue(item.link)
  );
  const promotedOfficialUrl = firstApprovedOfficialUrl(
    stringValue(item.finalUrl),
    stringValue(item.eventUrl),
    stringValue(item.purchaseUrl),
    stringValue(item.affiliateUrl),
    summary,
    sourceUrl
  );
  const finalUrl = promotedOfficialUrl || explicitFinalUrl;
  const linkType = classifyLink(finalUrl);
  const endDate = firstNonEmpty(stringValue(item.endDate), stringValue(item.expireAt), stringValue(item.expiresAt), stringValue(item.expires));
  const endsAt = Date.parse(endDate);
  const availability: NewsDeal["availability"] = Number.isFinite(endsAt) && endsAt < Date.now() ? "expired" : "active";
  const hiddenReasons = [
    !title ? "missing_title" : "",
    !finalUrl ? "missing_final_url" : "",
    linkType === "search" ? "search_or_result_url" : "",
    linkType === "news_only" ? "blocked_news_or_community_context_url" : "",
    linkType === "invalid" && finalUrl ? "not_approved_official_url" : "",
    availability === "expired" ? "expired_event" : ""
  ].filter(Boolean);
  const validationStatus: NewsDeal["validationStatus"] = hiddenReasons.length ? "failed" : "passed";
  const priorityScore = validationStatus === "passed" ? 100 : Math.max(0, 60 - hiddenReasons.length * 15);

  return {
    id,
    title,
    merchant: firstNonEmpty(stringValue(item.merchant), stringValue(item.mallName), stringValue(item.brand), stringValue(item.sourceName), "공식 혜택"),
    category: firstNonEmpty(stringValue(item.category), "무료혜택"),
    benefitType: firstNonEmpty(stringValue(item.benefitType), "coupon"),
    finalUrl,
    sourceUrl: sourceUrl || finalUrl,
    linkType,
    availability,
    validationStatus,
    hiddenReason: hiddenReasons.join(","),
    priorityScore,
    action:
      validationStatus === "passed"
        ? "refresh:news 반영 후보"
        : hiddenReasons.includes("search_or_result_url") || hiddenReasons.includes("blocked_news_or_community_context_url")
          ? "본문/원문에서 공식 이벤트 URL을 찾아 finalUrl로 보강"
          : "공식 도메인, 종료일, 제목, 혜택 조건을 보강",
    ...(generatedAt ? {} : {})
  };
}

export function dryRunNewsFeedPreview(input: NewsFeedDryRunInput) {
  const generatedAt = new Date().toISOString();
  const provider = input.provider ?? "official_event";
  const rawItems = input.text ? parseTextPayload(input.text, provider) : arrayValue(input.items);
  const rows = rawItems.map((item, index) => validateCandidate(item, index, provider, generatedAt));
  const visibleRows = rows.filter((row) => row.validationStatus === "passed" && row.availability === "active" && row.linkType.startsWith("official"));
  const hiddenRows = rows.filter((row) => !visibleRows.includes(row));
  const hiddenReasonTop5 = Object.entries(
    hiddenRows.reduce<Record<string, number>>((acc, row) => {
      for (const reason of row.hiddenReason.split(",").filter(Boolean)) {
        acc[reason] = (acc[reason] ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  return {
    ok: rawItems.length > 0 && hiddenRows.length === 0,
    source: input.source ?? "admin_news_feed_paste",
    provider,
    generatedAt,
    received: rawItems.length,
    visible: visibleRows.length,
    hidden: hiddenRows.length,
    officialLinkPromotedCount: visibleRows.filter((row) => normalizeHost(row.sourceUrl) && normalizeHost(row.finalUrl) && normalizeHost(row.sourceUrl) !== normalizeHost(row.finalUrl)).length,
    exposedSearchLinkCount: visibleRows.filter((row) => row.linkType === "search").length,
    exposedNonOfficialLinkCount: visibleRows.filter((row) => !row.linkType.startsWith("official")).length,
    hiddenReasonTop5,
    rows,
    visibleRows,
    hiddenRows,
    nextActions: [
      "visibleRows만 운영 feed 후보로 사용하세요.",
      "hiddenRows는 공식 이벤트/혜택 URL, 종료일, 제목, 혜택 조건을 보강한 뒤 다시 dry-run 하세요.",
      "통과 후 npm run refresh:news && npm run verify:news && npm run refresh:all을 실행하세요."
    ],
    message: rawItems.length
      ? hiddenRows.length
        ? "공식 feed dry-run이 끝났습니다. 숨김 후보를 보강한 뒤 다시 확인하세요."
        : "공식 feed dry-run이 통과했습니다. 반영 전 refresh/verify 명령을 이어서 실행하세요."
      : "검증할 JSON/RSS 항목을 찾지 못했습니다."
  };
}

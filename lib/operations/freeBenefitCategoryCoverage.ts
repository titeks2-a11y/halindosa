import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface CategoryCoverageSourceItem {
  id?: string;
  title?: string;
  summary?: string;
  category?: string;
  sourceName?: string;
  mallName?: string;
  merchant?: string;
  tags?: string[];
  benefitType?: string;
  publishable?: boolean;
  isHidden?: boolean;
  availability?: string;
  validationStatus?: string;
  hiddenReason?: string;
  validationReason?: string;
  finalUrl?: string;
  expiresAt?: string;
  endDate?: string;
  qualityScore?: number;
  priorityScore?: number;
  confidenceScore?: number;
}

export interface FreeBenefitRequiredCategory {
  id: string;
  label: string;
  minimum: number;
}

export interface FreeBenefitCategoryCoverageRow extends FreeBenefitRequiredCategory {
  count: number;
  ok: boolean;
  href: string;
}

export interface FreeBenefitCategoryCoverageCandidate {
  id: string;
  title: string;
  sourceName: string;
  category: string;
  finalUrl: string;
  host: string;
  endAt: string;
  requiresPurchase: boolean;
  claimEaseScore: number;
  claimUrgencyLabel: string;
  qualityScore: number;
  priorityScore: number;
}

export interface FreeBenefitCategoryCandidateGroup extends FreeBenefitRequiredCategory {
  count: number;
  ok: boolean;
  href: string;
  candidates: FreeBenefitCategoryCoverageCandidate[];
}

export interface FreeBenefitCategoryCoverageReport {
  ok: boolean;
  generatedAt: string;
  sourceSnapshotGeneratedAt?: string;
  totalRawDeals: number;
  visibleActiveBenefits: number;
  noPurchaseVisibleBenefits: number;
  purchaseRequiredVisibleBenefits: number;
  todayEndingBenefits: number;
  weekEndingBenefits: number;
  officialHostCount: number;
  categoryCounts: Record<string, number>;
  categoryCoverage: FreeBenefitCategoryCoverageRow[];
  categoryCandidateGroups: FreeBenefitCategoryCandidateGroup[];
  averageScores: {
    quality: number;
    priority: number;
  };
  topCandidates: FreeBenefitCategoryCoverageCandidate[];
  advisories: string[];
  problems: string[];
}

export const freeBenefitRequiredCategories: FreeBenefitRequiredCategory[] = [
  { id: "everyone", label: "전원증정", minimum: 3 },
  { id: "firstCome", label: "선착순", minimum: 8 },
  { id: "coupon", label: "쿠폰", minimum: 8 },
  { id: "sample", label: "무료 샘플", minimum: 3 },
  { id: "freeTrial", label: "무료체험", minimum: 1 },
  { id: "gifticon", label: "기프티콘", minimum: 1 },
  { id: "pointCashback", label: "포인트/캐시백", minimum: 20 },
  { id: "freeShipping", label: "무료배송", minimum: 3 },
  { id: "signup", label: "신규가입 혜택", minimum: 3 },
  { id: "checkIn", label: "출석체크", minimum: 2 }
];

const endedPattern = /마감|종료|품절|판매\s*종료|일시\s*품절|선착순\s*마감|이벤트\s*종료|행사\s*종료|재고\s*소진|재입고\s*알림/i;
const firstComePattern = /선착순|한정|소진\s*시|수량\s*한정|마감\s*임박/i;
const everyoneRewardPattern = /전원|모두|누구나|100%|전부|전체\s*지급/i;
const searchOrJunkUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum|youtube|example\.com/i;
const homePathSet = new Set(["", "/", "/main", "/index"]);

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function sanitize(value: unknown, maxLength = 180) {
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

function normalizeHost(value: unknown) {
  try {
    return new URL(String(value ?? "")).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function classifyCategory(deal: CategoryCoverageSourceItem) {
  const text = sanitize([deal.title, deal.summary, deal.category, deal.sourceName, (deal.tags ?? []).join(" ")].join(" "), 800);
  if (everyoneRewardPattern.test(text)) return "everyone";
  if (firstComePattern.test(text)) return "firstCome";
  if (/출석|체크인|매일\s*참여|스탬프/i.test(text)) return "checkIn";
  if (/신규|첫\s*구매|첫\s*가입|웰컴/i.test(text)) return "signup";
  if (/기프티콘|교환권|모바일\s*쿠폰|음료권/i.test(text)) return "gifticon";
  if (/포인트|캐시백|적립|페이/i.test(text)) return "pointCashback";
  if (/무료\s*체험|trial|구독\s*체험/i.test(text)) return "freeTrial";
  if (/샘플|체험팩|무료\s*증정|초대권/i.test(text) || deal.benefitType === "freebie") return "sample";
  if (/무배|무료배송|배송비\s*무료/i.test(text) || deal.benefitType === "freeShipping") return "freeShipping";
  if (/쿠폰|할인권|바우처/i.test(text) || deal.benefitType === "coupon") return "coupon";
  if (/공공|정부|지원|문화가\s*있는\s*날|서울시|복지|교육/i.test(text) || deal.benefitType === "public" || deal.benefitType === "public_free" || deal.benefitType === "education") {
    return "publicFree";
  }
  return "brandEvent";
}

function hasSafeActionUrl(value: unknown) {
  const raw = String(value ?? "");
  if (!raw || searchOrJunkUrlPattern.test(raw)) return false;
  try {
    const url = new URL(raw);
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    return (url.protocol === "http:" || url.protocol === "https:") && !homePathSet.has(path);
  } catch {
    return false;
  }
}

function isPublishableBenefit(deal: CategoryCoverageSourceItem, now: number) {
  const titleText = sanitize([deal.title, deal.summary, deal.hiddenReason, deal.validationReason].join(" "), 800);
  const endAt = Date.parse(String(deal.expiresAt || deal.endDate || ""));
  return (
    deal.publishable !== false &&
    !deal.isHidden &&
    deal.availability === "active" &&
    deal.validationStatus === "passed" &&
    Number.isFinite(endAt) &&
    endAt >= now &&
    !endedPattern.test(titleText) &&
    hasSafeActionUrl(deal.finalUrl)
  );
}

function countBy<T>(items: T[], select: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = select(item) || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function average<T>(items: T[], select: (item: T) => number) {
  const values = items.map(select).filter(Number.isFinite);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function candidateDisplayScore(item: FreeBenefitCategoryCoverageCandidate) {
  const publicSectorPenalty = /go\.kr|or\.kr|gov\.kr|seoul|government|복지|공공|서울시|정부|지자체/i.test(
    `${item.host} ${item.sourceName} ${item.title}`
  )
    ? 80
    : 0;
  const purchasePenalty = item.requiresPurchase ? 20 : 0;
  return item.qualityScore + item.priorityScore + item.claimEaseScore - publicSectorPenalty - purchasePenalty;
}

function getHoursLeft(value: string, now: number) {
  const endAt = Date.parse(value);
  if (!Number.isFinite(endAt)) return Number.POSITIVE_INFINITY;
  return (endAt - now) / 3_600_000;
}

function getClaimUrgencyLabel(endAt: string, now: number) {
  const hoursLeft = getHoursLeft(endAt, now);
  if (hoursLeft <= 24) return "오늘마감";
  if (hoursLeft <= 72) return "3일내마감";
  if (hoursLeft <= 7 * 24) return "이번주마감";
  return "여유있음";
}

function getClaimEaseScore(item: {
  category: string;
  requiresPurchase: boolean;
  title: string;
  sourceName: string;
  host: string;
  endAt: string;
}, now: number) {
  const text = `${item.title} ${item.sourceName} ${item.host}`;
  const hoursLeft = getHoursLeft(item.endAt, now);
  let score = 50;
  if (!item.requiresPurchase) score += 25;
  if (["everyone", "coupon", "sample", "freeTrial", "gifticon", "pointCashback", "signup", "checkIn"].includes(item.category)) score += 12;
  if (/전원|누구나|100%|모두|무료|샘플|쿠폰|출석|룰렛|포인트|기프티콘/i.test(text)) score += 8;
  if (/로그인|회원|앱\s*전용/i.test(text)) score -= 6;
  if (item.requiresPurchase || /구매|주문|결제|이상\s*구매|배송비/i.test(text)) score -= 20;
  if (hoursLeft <= 24) score += 8;
  else if (hoursLeft <= 72) score += 5;
  else if (hoursLeft <= 7 * 24) score += 3;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildFreeBenefitCategoryCoverageReport(referenceNow = Date.now()): FreeBenefitCategoryCoverageReport {
  const snapshot = readJson<{ generatedAt?: string; deals?: CategoryCoverageSourceItem[] }>(join(process.cwd(), "data", "refreshedNewsDeals.json"), {});
  const rawDeals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
  const visible = rawDeals
    .filter((deal) => isPublishableBenefit(deal, referenceNow))
    .map((deal): FreeBenefitCategoryCoverageCandidate => {
      const category = classifyCategory(deal);
      const endAt = String(deal.expiresAt || deal.endDate || "");
      const candidate = {
        id: sanitize(deal.id, 80),
        title: sanitize(deal.title, 90),
        sourceName: sanitize(deal.sourceName || deal.mallName || deal.merchant, 48),
        category,
        finalUrl: String(deal.finalUrl ?? ""),
        host: normalizeHost(deal.finalUrl),
        endAt,
        requiresPurchase: /구매|주문|결제|최소\s*주문|이상\s*구매|배송비/.test(sanitize([deal.title, deal.summary, deal.tags?.join(" ")].join(" "), 600)),
        qualityScore: Number(deal.qualityScore ?? 0),
        priorityScore: Number(deal.priorityScore ?? deal.confidenceScore ?? 0)
      };
      return {
        ...candidate,
        claimEaseScore: getClaimEaseScore(candidate, referenceNow),
        claimUrgencyLabel: getClaimUrgencyLabel(endAt, referenceNow)
      };
    });

  const categoryCounts = countBy(visible, (item) => item.category);
  const officialHostCount = new Set(visible.map((item) => item.host).filter(Boolean)).size;
  const noPurchaseVisibleBenefits = visible.filter((item) => !item.requiresPurchase).length;
  const weekEndingBenefits = visible.filter((item) => {
    const endAt = Date.parse(item.endAt);
    return Number.isFinite(endAt) && endAt >= referenceNow && endAt - referenceNow <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const todayEndingBenefits = visible.filter((item) => {
    const endAt = Date.parse(item.endAt);
    return Number.isFinite(endAt) && endAt >= referenceNow && endAt - referenceNow <= 24 * 60 * 60 * 1000;
  }).length;

  const categoryCoverage = freeBenefitRequiredCategories.map((category) => {
    const count = Number(categoryCounts[category.id] ?? 0);
    return {
      ...category,
      count,
      ok: count >= category.minimum,
      href: `/free-benefits?eventType=${encodeURIComponent(category.id)}`
    };
  });
  const sortedVisible = [...visible].sort((a, b) => candidateDisplayScore(b) - candidateDisplayScore(a));
  const categoryCandidateGroups = categoryCoverage.map((category) => ({
    ...category,
    candidates: sortedVisible.filter((item) => item.category === category.id).slice(0, 4)
  }));
  const problems = [
    visible.length < 150 ? `visible active benefits ${visible.length}/150` : "",
    officialHostCount < 70 ? `official host coverage ${officialHostCount}/70` : "",
    noPurchaseVisibleBenefits < 120 ? `no-purchase visible benefits ${noPurchaseVisibleBenefits}/120` : "",
    weekEndingBenefits < 3 ? `this-week ending benefits ${weekEndingBenefits}/3` : "",
    ...categoryCoverage.filter((category) => !category.ok).map((category) => `${category.label} category ${category.count}/${category.minimum}`),
    visible.some((item) => searchOrJunkUrlPattern.test(item.finalUrl)) ? "visible benefit contains search/community/news URL" : ""
  ].filter(Boolean);

  return {
    ok: problems.length === 0,
    generatedAt: new Date(referenceNow).toISOString(),
    sourceSnapshotGeneratedAt: snapshot.generatedAt ?? "",
    totalRawDeals: rawDeals.length,
    visibleActiveBenefits: visible.length,
    noPurchaseVisibleBenefits,
    purchaseRequiredVisibleBenefits: visible.length - noPurchaseVisibleBenefits,
    todayEndingBenefits,
    weekEndingBenefits,
    officialHostCount,
    categoryCounts,
    categoryCoverage,
    categoryCandidateGroups,
    averageScores: {
      quality: average(visible, (item) => item.qualityScore),
      priority: average(visible, (item) => item.priorityScore)
    },
    topCandidates: sortedVisible.slice(0, 20),
    advisories: todayEndingBenefits === 0 ? ["오늘마감 혜택은 현재 0건입니다. 홈은 이번주 마감과 선착순 혜택으로 대체 노출해야 합니다."] : [],
    problems
  };
}

export function buildFreeBenefitCategoryCoverageCsv(report: FreeBenefitCategoryCoverageReport) {
  const rows: string[][] = [["section", "name", "status", "value", "minimum", "detail", "action"]];
  rows.push(["summary", "visibleActiveBenefits", report.visibleActiveBenefits >= 150 ? "passed" : "failed", String(report.visibleActiveBenefits), "150", "노출 가능한 active 무료혜택", "npm run benefit:category:doctor"]);
  rows.push(["summary", "officialHostCount", report.officialHostCount >= 70 ? "passed" : "failed", String(report.officialHostCount), "70", "공식 도메인 다양성", "source:breadth:doctor"]);
  rows.push(["summary", "noPurchaseVisibleBenefits", report.noPurchaseVisibleBenefits >= 120 ? "passed" : "failed", String(report.noPurchaseVisibleBenefits), "120", "구매 조건 없는 무료혜택", "verify:freebies"]);
  rows.push(["summary", "weekEndingBenefits", report.weekEndingBenefits >= 3 ? "passed" : "failed", String(report.weekEndingBenefits), "3", "이번주 마감 혜택", "/free-benefits?deadline=week"]);
  rows.push(["summary", "todayEndingBenefits", report.todayEndingBenefits > 0 ? "count" : "advisory", String(report.todayEndingBenefits), "0", "오늘마감은 없으면 이번주 마감으로 대체", "/free-benefits?deadline=soon"]);
  for (const row of report.categoryCoverage) {
    rows.push(["category", row.label, row.ok ? "passed" : "failed", String(row.count), String(row.minimum), row.id, row.href]);
  }
  for (const group of report.categoryCandidateGroups) {
    for (const item of group.candidates) {
      rows.push([
        "category_candidate",
        group.label,
        group.ok ? "passed" : "failed",
        String(item.qualityScore + item.priorityScore + item.claimEaseScore),
        String(group.minimum),
        `${item.sourceName}; ${item.title}; ${item.host}; ${item.claimUrgencyLabel}; claimEase=${item.claimEaseScore}`,
        item.finalUrl
      ]);
    }
  }
  for (const item of report.topCandidates) {
    rows.push(["top_candidate", item.id, "candidate", String(item.qualityScore + item.priorityScore), "", `${item.sourceName}; ${item.title}; ${item.category}; ${item.host}`, item.finalUrl]);
  }
  for (const problem of report.problems) {
    rows.push(["problem", "category_coverage", "failed", "", "", problem, "npm run benefit:category:doctor"]);
  }
  for (const advisory of report.advisories) {
    rows.push(["advisory", "deadline", "watch", "", "", advisory, "/free-benefits?deadline=week"]);
  }

  return `${rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll("\"", "\"\"")}"`).join(",")).join("\n")}\n`;
}

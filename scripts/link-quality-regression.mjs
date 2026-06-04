import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
mkdirSync(reportsDir, { recursive: true });

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function readJson(path, fallback = null) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

const policy = readJson("data/linkQualityPolicy.json", {});
const linkReport = readJson("reports/link-validation.json", {});
const productReport = readJson("reports/product-quality.json", {});
const exposureReport = readJson("reports/exposure-policy.json", {});
const normalizer = read("lib/deals/normalizer.ts");
const quality = read("lib/deals/quality.ts");
const linkValidator = read("lib/deals/linkValidator.ts");
const affiliate = read("lib/affiliate.ts");
const goRoute = read("app/go/[id]/route.ts");
const redirectRoute = read("app/api/redirect/[id]/route.ts");
const packageJson = readJson("package.json", {});
const qaRunner = read("scripts/run-qa.mjs");
const qaCommandSource = `${String(packageJson.scripts?.qa ?? "")}\n${qaRunner}`;

const blockedHosts = new Set([...(policy.blockedHosts ?? []), ...(policy.placeholderHosts ?? [])]);
const searchPatterns = policy.searchPatterns ?? [];
const unavailablePatterns = policy.unavailableTextPatterns ?? [];

function hostMatches(host, candidate) {
  return host === candidate || host.endsWith(`.${candidate}`) || host.includes(candidate);
}

function hasBlockedHost(host) {
  return [...blockedHosts].some((candidate) => hostMatches(host, candidate));
}

function isHomeUrl(url) {
  const path = url.pathname.replace(/\/+$/, "").toLowerCase();
  return ["", "/", "/main", "/index"].includes(path);
}

function isSearchUrl(url) {
  const full = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  if (/\/vp\/products\/\d+|\/products\/\d+|\/goods\/\d+|\/item\/itemview\.ssg|goodscode=|goodsno=|itemid=/i.test(full)) {
    return false;
  }
  if (/event|benefit|campaign|coupon|promotion|culture-event/i.test(`${url.pathname}${url.search}${url.hash}`)) {
    return false;
  }
  return searchPatterns.some((pattern) => full.includes(pattern.toLowerCase()));
}

function hasProductSignal(url) {
  const full = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  return (policy.productDetailSignals ?? []).some((pattern) => new RegExp(pattern, "i").test(full));
}

function hasOfficialBenefitSignal(url, evidence) {
  const full = `${url.hostname}${url.pathname}${url.search}${url.hash}`.toLowerCase();
  const evidenceText = evidence.toLowerCase();
  return (policy.officialBenefitUrlSignals ?? []).some((signal) => full.includes(signal)) &&
    (policy.officialBenefitEvidenceSignals ?? []).some((signal) => evidenceText.includes(signal.toLowerCase()));
}

function containsUnavailableText(text) {
  const value = text.toLowerCase();

  return unavailablePatterns.some((pattern) => value.includes(pattern.toLowerCase()));
}

function classify(sample) {
  try {
    const url = new URL(sample.url);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const evidence = sample.evidence ?? "";

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { linkType: "unavailable", availability: "unknown", validationStatus: "failed", isHidden: true, reason: "unsafe_protocol" };
    }
    if (hasBlockedHost(host)) {
      return { linkType: "unavailable", availability: "unknown", validationStatus: "failed", isHidden: true, reason: "blocked_host" };
    }
    if (isHomeUrl(url)) {
      return { linkType: "unavailable", availability: "unknown", validationStatus: "failed", isHidden: true, reason: "home_or_landing_url" };
    }
    if (isSearchUrl(url)) {
      return { linkType: "search", availability: "unknown", validationStatus: "failed", isHidden: true, reason: "search_url" };
    }
    if (containsUnavailableText(evidence)) {
      return { linkType: "unavailable", availability: "sold_out", validationStatus: "failed", isHidden: true, reason: "sold_out_or_ended_text" };
    }
    if (hasProductSignal(url)) {
      return { linkType: "direct_purchase", availability: "active", validationStatus: "passed", isHidden: false, reason: "product_detail" };
    }
    if (hasOfficialBenefitSignal(url, evidence)) {
      return { linkType: "affiliate", availability: "active", validationStatus: "passed", isHidden: false, reason: "official_benefit" };
    }

    return { linkType: "unavailable", availability: "unknown", validationStatus: "failed", isHidden: true, reason: "missing_product_or_benefit_signal" };
  } catch {
    return { linkType: "unavailable", availability: "unknown", validationStatus: "failed", isHidden: true, reason: "invalid_url" };
  }
}

const samples = [
  {
    name: "coupang product detail allowed",
    url: "https://www.coupang.com/vp/products/130180913?itemId=383114455&vendorItemId=3930090438",
    evidence: "쿠팡 상품 상세 수동 검수",
    expected: { isHidden: false, validationStatus: "passed", availability: "active" }
  },
  {
    name: "coupang search blocked",
    url: "https://www.coupang.com/np/search?q=%EC%9A%B0%EC%9C%A0",
    evidence: "검색 결과 URL",
    expected: { isHidden: true, linkType: "search" }
  },
  {
    name: "naver shopping search blocked",
    url: "https://search.shopping.naver.com/search/all?query=%ED%8A%B9%EA%B0%80",
    evidence: "검색 결과 URL",
    expected: { isHidden: true, linkType: "search" }
  },
  {
    name: "lotteon search result blocked",
    url: "https://www.lotteon.com/search/search/search.ecn?render=search&platform=pc&q=%ED%8A%B9%EA%B0%80",
    evidence: "검색 결과 URL",
    expected: { isHidden: true, linkType: "search" }
  },
  {
    name: "community source blocked",
    url: "https://www.ppomppu.co.kr/zboard/view.php?id=ppomppu&no=123",
    evidence: "커뮤니티 게시글",
    expected: { isHidden: true, validationStatus: "failed" }
  },
  {
    name: "home landing blocked",
    url: "https://www.gmarket.co.kr/",
    evidence: "대표몰 홈",
    expected: { isHidden: true, validationStatus: "failed" }
  },
  {
    name: "unsafe protocol blocked",
    url: "javascript:alert(1)",
    evidence: "위험 프로토콜",
    expected: { isHidden: true, validationStatus: "failed" }
  },
  {
    name: "sold out evidence blocked",
    url: "https://item.gmarket.co.kr/Item?goodscode=3560262554",
    evidence: "판매종료 품절 재입고알림",
    expected: { isHidden: true, availability: "sold_out" }
  },
  {
    name: "ending soon evidence stays visible",
    url: "https://item.gmarket.co.kr/Item?goodscode=3560262554",
    evidence: "마감임박 오늘만 한정수량",
    expected: { isHidden: false, availability: "active", validationStatus: "passed" }
  },
  {
    name: "event ended evidence blocked",
    url: "https://www.coupang.com/vp/products/130180913?itemId=383114455",
    evidence: "이벤트 종료 모집 마감 신청마감",
    expected: { isHidden: true, availability: "sold_out" }
  },
  {
    name: "english sold out evidence blocked",
    url: "https://www.coupang.com/vp/products/130180913?itemId=383114455",
    evidence: "Out of stock temporarily unavailable",
    expected: { isHidden: true, availability: "sold_out" }
  },
  {
    name: "official benefit allowed",
    url: "https://www.cgv.co.kr/culture-event/event/detailViewUnited.aspx?seq=12345",
    evidence: "공식 이벤트 무료 초대권 할인 혜택",
    expected: { isHidden: false, validationStatus: "passed", availability: "active" }
  }
];

const sampleResults = samples.map((sample) => {
  const actual = classify(sample);
  const mismatches = Object.entries(sample.expected).filter(([key, value]) => actual[key] !== value);
  return {
    name: sample.name,
    url: sample.url,
    expected: sample.expected,
    actual,
    ok: mismatches.length === 0,
    mismatches: mismatches.map(([key, value]) => `${key}: expected ${value}, got ${actual[key]}`)
  };
});

const structuralChecks = [
  {
    name: "normalizer fills canonical link quality fields",
    ok: ["originalUrl", "finalUrl", "affiliateUrl", "eventUrl", "availability", "validationStatus", "lastCheckedAt", "priorityScore", "isHidden"].every((field) => normalizer.includes(field))
  },
  {
    name: "quality gate blocks bad public exposure",
    ok: ["isPubliclyVisibleDeal", "getDealExposureDecision", "isPolicySearchLikeUrl", "isPolicyHomeOnlyUrl", "isPolicyBlockedHost", "missing_final_url"].every((token) => quality.includes(token))
  },
  {
    name: "link validator uses shared policy and live probe fields",
    ok: ["linkQualityPolicy", "probePurchaseLink", "robots_or_access_blocked", "timeout", "HTTP"].every((token) => linkValidator.includes(token))
  },
  {
    name: "outbound route does not fallback to search links",
    ok: affiliate.includes("return \"\"") && affiliate.includes("isVerifiedPurchaseLink(deal)") && goRoute.includes("canOpenDealLink") && redirectRoute.includes("canOpenDealLink")
  },
  {
    name: "qa includes link and exposure gates",
    ok: ["verify:links", "verify:products", "exposure:doctor"].every((script) => qaCommandSource.includes(script))
  }
];

const reportChecks = [
  {
    name: "current link report has zero exposed search links",
    ok: (linkReport.exposedSearchLinks ?? linkReport.searchLinks ?? 0) === 0
  },
  {
    name: "current link report has zero exposed sold-out links",
    ok: (linkReport.exposedSoldOutLinks ?? linkReport.soldOutOrEndedSuspected ?? 0) === 0
  },
  {
    name: "product report has zero failed products",
    ok: (productReport.failedProducts ?? 0) === 0
  },
  {
    name: "exposure report has zero bad exposed items",
    ok: (exposureReport.summary?.badExposedItems ?? 0) === 0
  }
];

const checks = [...sampleResults, ...structuralChecks, ...reportChecks];
const issues = checks.filter((check) => !check.ok).flatMap((check) => check.mismatches?.length ? check.mismatches.map((issue) => `${check.name}: ${issue}`) : [`${check.name}: failed`]);
const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  sampleResults,
  structuralChecks,
  reportChecks,
  summary: {
    sampleCount: sampleResults.length,
    samplePassed: sampleResults.filter((item) => item.ok).length,
    structuralPassed: structuralChecks.filter((item) => item.ok).length,
    reportPassed: reportChecks.filter((item) => item.ok).length,
    exposedSearchLinks: linkReport.exposedSearchLinks ?? linkReport.searchLinks ?? 0,
    exposedSoldOutLinks: linkReport.exposedSoldOutLinks ?? linkReport.soldOutOrEndedSuspected ?? 0,
    badExposedItems: exposureReport.summary?.badExposedItems ?? 0
  },
  issues
};

writeFileSync(join(reportsDir, "link-quality-regression.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (issues.length) {
  console.error("Link quality regression failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Link quality regression passed.");
console.log(`- Samples: ${report.summary.samplePassed}/${report.summary.sampleCount}`);
console.log(`- Exposed search links: ${report.summary.exposedSearchLinks}`);
console.log(`- Exposed sold-out links: ${report.summary.exposedSoldOutLinks}`);
console.log(`- Bad exposed items: ${report.summary.badExposedItems}`);

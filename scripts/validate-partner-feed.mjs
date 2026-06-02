import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const communityHosts = [
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
  "blog.naver.com",
  "m.blog.naver.com",
  "blog.daum.net",
  "tistory.com",
  "news.naver.com",
  "media.naver.com",
  "news.daum.net"
];

const detailUrlPatterns = [
  /coupang\.com\/vp\/products\/\d+/i,
  /item\.gmarket\.co\.kr\/Item\?/i,
  /11st\.co\.kr\/products\//i,
  /ssg\.com\/item\/itemView\.ssg/i,
  /auction\.co\.kr\/item\/detailview\.aspx/i,
  /oliveyoung\.co\.kr\/store\/goods\/getGoodsDetail\.do/i,
  /kurly\.com\/goods\//i,
  /musinsa\.com\/products\//i,
  /ohou\.se\/productions\//i,
  /aliexpress\.[^/]+\/item\//i,
  /smartstore\.naver\.com\/[^/]+\/products\/\d+/i
];

const officialBenefitPatterns = [
  /\/event/i,
  /\/events/i,
  /\/benefit/i,
  /\/benefits/i,
  /\/coupon/i,
  /\/promotion/i,
  /\/campaign/i,
  /\/membership/i,
  /\/member\/benefit/i,
  /\/culture-event\/event/i,
  /\/customer-engagement\/event\/detail/i,
  /\/whats_new\/campaign/i
];

const allowedDealTypes = new Set([
  "discount",
  "freebie",
  "coupon",
  "freeShipping",
  "experience",
  "event",
  "point",
  "convenienceStore",
  "mart",
  "foodDelivery"
]);

const sampleItems = [
  {
    externalId: "validator-001",
    mall: "쿠팡",
    title: "무선 청소기 운영 피드 샘플",
    description: "제휴 피드 검수용 가전 특가 샘플입니다.",
    category: "가전",
    dealType: "discount",
    benefitSummary: "주말 한정 무료배송 특가",
    originalPrice: 259000,
    salePrice: 159000,
    imageUrl: "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2024/01/01/10/0/product.jpg",
    productUrl: "https://www.coupang.com/vp/products/7999681537",
    searchUrl: "https://www.coupang.com/np/search?q=%EB%AC%B4%EC%84%A0%20%EC%B2%AD%EC%86%8C%EA%B8%B0",
    sourceName: "쿠팡",
    sourceUrl: "https://www.coupang.com/vp/products/7999681537",
    expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: true,
    requiresSignup: false,
    shippingFee: "무료배송",
    eligibilityChecklist: ["판매처 상품 상세 확인", "배송 조건 확인", "최종 가격 확인"],
    claimSteps: ["상품 상세 이동", "조건 확인", "결제 전 가격 확인"],
    claimWarning: "판매처 조건은 변경될 수 있습니다.",
    tags: ["무료배송"]
  },
  {
    externalId: "validator-002",
    mall: "G마켓",
    title: "즉석밥 24개입 운영 피드 샘플",
    description: "제휴 피드 검수용 식품 쿠폰 샘플입니다.",
    category: "식품",
    dealType: "coupon",
    benefitSummary: "쿠폰 적용 시 즉석밥 묶음 할인",
    originalPrice: 39800,
    salePrice: 24900,
    imageUrl: "https://gdimg.gmarket.co.kr/4076233103/still/600",
    productUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
    sourceName: "G마켓",
    sourceUrl: "https://item.gmarket.co.kr/Item?goodsCode=4076233103",
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: false,
    requiresSignup: false,
    shippingFee: "판매처 조건부",
    couponCondition: "판매처 쿠폰 적용",
    minimumOrderAmount: 0,
    eligibilityChecklist: ["쿠폰 적용 가능 여부 확인", "배송비 조건 확인", "최종 가격 확인"],
    claimSteps: ["상품 상세 이동", "쿠폰 받기", "결제 전 적용 확인"],
    claimWarning: "쿠폰 조건은 판매처 정책에 따라 달라질 수 있습니다.",
    tags: ["쿠폰적용"]
  },
  {
    externalId: "validator-003",
    mall: "공식 이벤트",
    title: "커피 무료 쿠폰 운영 피드 샘플",
    description: "무료 쿠폰 혜택도 상품과 같은 품질 기준으로 검수합니다.",
    category: "쿠폰/이벤트",
    dealType: "freebie",
    benefitSummary: "앱 가입 후 커피 무료 쿠폰",
    originalPrice: 4500,
    salePrice: 1,
    imageUrl: "https://shopping-phinf.pstatic.net/main_1234567/1234567890.20260602120000.jpg",
    productUrl: "https://smartstore.naver.com/halindosa/products/1234567890",
    sourceName: "브랜드 공식몰",
    sourceUrl: "https://smartstore.naver.com/halindosa/products/1234567890",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isFirstComeFirstServed: true,
    requiresSignup: true,
    shippingFee: "배송 없음",
    eligibilityChecklist: ["신규 가입 대상 확인", "쿠폰 재고 확인", "사용 가능 매장 확인"],
    claimSteps: ["이벤트 상세 이동", "가입 후 쿠폰 받기", "유효기간 확인"],
    claimWarning: "선착순 쿠폰은 조기 소진될 수 있습니다.",
    tags: ["무료쿠폰", "선착순"]
  }
];

function parseArgs(argv) {
  const args = { files: [], urls: [], reportPath: "" };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const next = argv[index + 1];

    if (value === "--file" && next) {
      args.files.push(next);
      index += 1;
    } else if (value === "--url" && next) {
      args.urls.push(next);
      index += 1;
    } else if (value === "--report" && next) {
      args.reportPath = next;
      index += 1;
    } else if (/^https?:\/\//i.test(value)) {
      args.urls.push(value);
    } else if (value && !value.startsWith("--")) {
      args.files.push(value);
    }
  }

  return args;
}

function getFeedItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray(payload.deals)) return payload.deals;
  if (payload && typeof payload === "object" && Array.isArray(payload.items)) return payload.items;
  return [];
}

async function loadJsonFromFile(file) {
  const body = await readFile(file, "utf8");
  return JSON.parse(body);
}

async function loadJsonFromUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function getPrimaryUrl(item) {
  const fields = ["affiliateUrl", "finalPurchaseUrl", "productUrl", "purchaseUrl", "originalUrl", "link", "searchUrl"];
  const field = fields.find((key) => typeof item[key] === "string" && item[key].trim());
  return field ? { field, value: item[field].trim() } : { field: "", value: "" };
}

function getItemIdentity(item, index) {
  return {
    row: index + 1,
    externalId: String(item.externalId ?? item.id ?? "").trim(),
    mall: String(item.mall ?? item.mallName ?? "").trim(),
    title: String(item.title ?? "").trim()
  };
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hostMatches(host, expected) {
  return host === expected || host.endsWith(`.${expected}`) || host.includes(expected);
}

function isCommunityOrPlaceholder(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      host === "example.com" ||
      host.endsWith(".example.com") ||
      communityHosts.some((communityHost) => hostMatches(host, communityHost))
    );
  } catch {
    return true;
  }
}

function isSearchOrHomeOnly(value) {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "");
    const query = url.search.toLowerCase();

    return (
      path === "" ||
      path === "/" ||
      path === "/main" ||
      path === "/index" ||
      /\/search|\/np\/search|\/search\/all|browse\.gmarket\.co\.kr\/search/i.test(`${url.hostname}${url.pathname}`) ||
      query.includes("query=") ||
      query.includes("keyword=")
    );
  } catch {
    return true;
  }
}

function looksLikeProductDetail(value) {
  return detailUrlPatterns.some((pattern) => pattern.test(value));
}

function looksLikeOfficialBenefitDetail(value, item) {
  const dealType = String(item.dealType ?? "").trim();
  const benefitSummary = String(item.benefitSummary ?? "").trim();
  const sourceName = String(item.sourceName ?? item.source ?? "").trim();
  const claimText = [
    benefitSummary,
    sourceName,
    ...(Array.isArray(item.eligibilityChecklist) ? item.eligibilityChecklist : []),
    ...(Array.isArray(item.claimSteps) ? item.claimSteps : [])
  ].join(" ");
  const hasBenefitType = ["freebie", "coupon", "freeShipping", "experience", "event", "point", "convenienceStore", "mart", "foodDelivery"].includes(dealType);
  const hasBenefitCopy = /무료|쿠폰|혜택|포인트|멤버십|행사|이벤트|체험|샘플|응모|적립|할인|1\+1|2\+1|배달/.test(claimText);

  return hasBenefitType && hasBenefitCopy && officialBenefitPatterns.some((pattern) => pattern.test(value));
}

function issue(index, field, message, severity = "error") {
  return { index, field, message, severity };
}

function validateItem(item, index) {
  const issues = [];
  const externalId = String(item.externalId ?? item.id ?? "").trim();
  const mall = String(item.mall ?? item.mallName ?? "").trim();
  const title = String(item.title ?? "").trim();
  const originalPrice = Number(item.originalPrice);
  const salePrice = Number(item.salePrice ?? item.price);
  const dealType = String(item.dealType ?? "").trim();
  const benefitSummary = String(item.benefitSummary ?? "").trim();
  const expiresAt = String(item.expiresAt ?? item.expireAt ?? "").trim();
  const sourceName = String(item.sourceName ?? item.source ?? "").trim();
  const sourceUrl = String(item.sourceUrl ?? "").trim();
  const imageUrl = String(item.imageUrl ?? item.thumbnail ?? "").trim();
  const primary = getPrimaryUrl(item);

  if (!externalId) issues.push(issue(index, "externalId", "외부 ID가 필요합니다."));
  if (!mall) issues.push(issue(index, "mall", "쇼핑몰명 또는 제공처명이 필요합니다."));
  if (!title) issues.push(issue(index, "title", "상품명 또는 혜택명이 필요합니다."));
  if (!dealType) issues.push(issue(index, "dealType", "혜택 유형 dealType이 필요합니다."));
  if (dealType && !allowedDealTypes.has(dealType)) {
    issues.push(issue(index, "dealType", `허용된 혜택 유형만 사용할 수 있습니다: ${Array.from(allowedDealTypes).join(", ")}`));
  }
  if (!benefitSummary) issues.push(issue(index, "benefitSummary", "사용자가 바로 이해할 혜택 요약이 필요합니다."));
  if (!sourceName) issues.push(issue(index, "sourceName", "출처명 또는 제공처명이 필요합니다."));
  if (!imageUrl) {
    issues.push(issue(index, "imageUrl", "실상품 이미지 URL이 필요합니다. 카테고리 fallback은 운영 노출 전 임시 보조 수단입니다."));
  } else if (!isValidHttpUrl(imageUrl)) {
    issues.push(issue(index, "imageUrl", "이미지 URL은 http/https만 허용합니다."));
  } else if (isCommunityOrPlaceholder(imageUrl)) {
    issues.push(issue(index, "imageUrl", "커뮤니티 또는 placeholder 이미지는 운영 피드 이미지로 사용할 수 없습니다."));
  }
  if (!expiresAt) {
    issues.push(issue(index, "expiresAt", "혜택/특가 마감 시간이 필요합니다."));
  } else if (Number.isNaN(new Date(expiresAt).getTime())) {
    issues.push(issue(index, "expiresAt", "마감 시간은 ISO 날짜 문자열이어야 합니다."));
  }
  if (!sourceUrl) {
    issues.push(issue(index, "sourceUrl", "출처 URL이 필요합니다."));
  } else if (!isValidHttpUrl(sourceUrl)) {
    issues.push(issue(index, "sourceUrl", "출처 URL은 http/https만 허용합니다."));
  }
  if (!Array.isArray(item.eligibilityChecklist) || item.eligibilityChecklist.length < 3) {
    issues.push(issue(index, "eligibilityChecklist", "수령 전 체크리스트는 3개 이상 필요합니다."));
  }
  if (!Array.isArray(item.claimSteps) || item.claimSteps.length < 2) {
    issues.push(issue(index, "claimSteps", "수령 단계는 2개 이상 필요합니다."));
  }
  if (!String(item.claimWarning ?? "").trim()) {
    issues.push(issue(index, "claimWarning", "가격/재고/조건 변동 안내가 필요합니다."));
  }
  if (typeof item.requiresSignup !== "boolean") {
    issues.push(issue(index, "requiresSignup", "회원가입 필요 여부를 true/false로 표시해야 합니다."));
  }
  if (typeof item.isFirstComeFirstServed !== "boolean") {
    issues.push(issue(index, "isFirstComeFirstServed", "선착순 여부를 true/false로 표시해야 합니다."));
  }
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) issues.push(issue(index, "originalPrice", "정상 원가가 필요합니다."));
  if (!Number.isFinite(salePrice) || salePrice <= 0) issues.push(issue(index, "salePrice", "정상 할인가가 필요합니다."));
  if (Number.isFinite(originalPrice) && Number.isFinite(salePrice) && salePrice > originalPrice) {
    issues.push(issue(index, "salePrice", "할인가가 원가보다 높을 수 없습니다."));
  }
  if (["freebie", "experience", "coupon", "point", "foodDelivery", "convenienceStore", "mart"].includes(dealType) && !benefitSummary) {
    issues.push(issue(index, "benefitSummary", "무료/쿠폰/생활 혜택은 조건을 알 수 있는 혜택 요약이 필수입니다."));
  }

  if (!primary.value) {
    issues.push(issue(index, "productUrl", "실제 상품/혜택 상세 URL이 필요합니다."));
  } else if (!isValidHttpUrl(primary.value)) {
    issues.push(issue(index, primary.field, "http/https URL만 허용합니다."));
  } else if (isCommunityOrPlaceholder(primary.value)) {
    issues.push(issue(index, primary.field, "커뮤니티 원문 또는 placeholder 링크는 운영 피드에 사용할 수 없습니다."));
  } else if (primary.field === "searchUrl" || isSearchOrHomeOnly(primary.value)) {
    issues.push(issue(index, primary.field, "검색 결과나 쇼핑몰 메인이 아니라 실제 상품/혜택 상세 URL이 필요합니다."));
  } else if (!looksLikeProductDetail(primary.value) && !looksLikeOfficialBenefitDetail(primary.value, item)) {
    issues.push(issue(index, primary.field, "상품 상세 또는 공식 혜택 상세 URL 패턴이 확인되지 않아 운영 반영 전 수동 검수가 필요합니다."));
  }

  for (const field of ["affiliateUrl", "finalPurchaseUrl", "productUrl", "purchaseUrl", "originalUrl", "link", "searchUrl", "sourceUrl"]) {
    const value = item[field];
    if (typeof value !== "string" || !value.trim()) continue;
    if (!isValidHttpUrl(value)) issues.push(issue(index, field, "http/https URL만 허용합니다."));
    if (isCommunityOrPlaceholder(value) && field !== "sourceUrl") {
      issues.push(issue(index, field, "커뮤니티 원문 또는 placeholder 링크는 구매 이동 URL로 사용할 수 없습니다."));
    }
  }

  return issues;
}

function validateFeed(items, source) {
  const issues = items.flatMap((item, index) => validateItem(item, index));
  const invalidIndexes = new Set(issues.map((item) => item.index));
  const valid = items.length - invalidIndexes.size;
  const rows = items.map((item, index) => {
    const rowIssues = issues.filter((issueItem) => issueItem.index === index);
    const primary = getPrimaryUrl(item);

    return {
      ...getItemIdentity(item, index),
      status: rowIssues.length ? "needs_fix" : "ready",
      primaryUrlField: primary.field || null,
      primaryUrl: primary.value || null,
      issueCount: rowIssues.length,
      issues: rowIssues.map(({ field, message, severity }) => ({ field, message, severity }))
    };
  });

  return {
    source,
    received: items.length,
    valid,
    invalid: invalidIndexes.size,
    readyRate: items.length ? Math.round((valid / items.length) * 100) : 0,
    issues,
    rows,
    generatedAt: new Date().toISOString()
  };
}

function printResult(result) {
  console.log(`\n[${result.source}] received=${result.received} valid=${result.valid} invalid=${result.invalid}`);

  for (const item of result.issues.slice(0, 30)) {
    console.log(`- row ${item.index + 1} ${item.field}: ${item.message}`);
  }

  if (result.issues.length > 30) {
    console.log(`- ...and ${result.issues.length - 30} more issues`);
  }
}

function buildReport(results) {
  const totals = results.reduce(
    (acc, result) => ({
      received: acc.received + result.received,
      valid: acc.valid + result.valid,
      invalid: acc.invalid + result.invalid,
      issues: acc.issues + result.issues.length
    }),
    { received: 0, valid: 0, invalid: 0, issues: 0 }
  );

  return {
    ok: totals.invalid === 0 && totals.valid > 0,
    generatedAt: new Date().toISOString(),
    totals: {
      ...totals,
      readyRate: totals.received ? Math.round((totals.valid / totals.received) * 100) : 0
    },
    policy: {
      allowed: ["공식 API", "제휴 피드", "브랜드 공식몰", "실제 상품/혜택 상세 URL"],
      blocked: ["커뮤니티 원문 단독 링크", "블로그/뉴스 원문 단독 링크", "placeholder URL", "쇼핑몰 메인", "검색 결과 fallback", "http/https가 아닌 URL"],
      nextAction: totals.invalid
        ? "needs_fix 행의 productUrl/finalPurchaseUrl/affiliateUrl을 실제 상세 URL로 보강한 뒤 다시 검증하세요."
        : "운영 피드 연결 전 production feed doctor와 release doctor를 이어서 실행하세요."
    },
    results
  };
}

async function writeReport(reportPath, report) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`\nPartner feed validation report written: ${reportPath}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const envUrls = (process.env.DEAL_PRODUCTION_FEED_URLS ?? process.env.DEAL_PARTNER_FEED_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  const targets = [
    ...args.files.map((value) => ({ type: "file", value })),
    ...args.urls.map((value) => ({ type: "url", value })),
    ...(!args.files.length && !args.urls.length ? envUrls.map((value) => ({ type: "url", value })) : [])
  ];

  if (!targets.length) {
    const result = validateFeed(sampleItems, "built-in sample");
    printResult(result);
    if (args.reportPath) await writeReport(args.reportPath, buildReport([result]));
    console.log("\nPartner feed validator passed with the built-in sample. Pass --file, --url, or DEAL_PRODUCTION_FEED_URLS to validate an operating feed.");
    return;
  }

  const results = [];

  for (const target of targets) {
    const payload = target.type === "file" ? await loadJsonFromFile(target.value) : await loadJsonFromUrl(target.value);
    const items = getFeedItems(payload);
    results.push(validateFeed(items, `${target.type}:${target.value}`));
  }

  for (const result of results) printResult(result);
  if (args.reportPath) await writeReport(args.reportPath, buildReport(results));

  const totalInvalid = results.reduce((sum, result) => sum + result.invalid, 0);
  const totalValid = results.reduce((sum, result) => sum + result.valid, 0);

  if (totalInvalid > 0 || totalValid === 0) {
    console.error(`\nPartner feed validation failed: valid=${totalValid}, invalid=${totalInvalid}`);
    process.exit(1);
  }

  console.log(`\nPartner feed validation passed: valid=${totalValid}, invalid=${totalInvalid}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

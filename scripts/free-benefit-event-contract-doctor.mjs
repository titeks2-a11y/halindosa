import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportPath = join(root, "reports", "free-benefit-event-contract.json");
const docsPath = join(root, "docs", "FREE_BENEFIT_EVENT_CONTRACT.md");

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function hasAll(source, snippets) {
  return snippets.filter((snippet) => !source.includes(snippet));
}

function check(name, ok, detail) {
  return { name, ok, detail };
}

const typeSource = read("types/freeBenefitEvent.ts");
const normalizerSource = read("lib/freeBenefitEvents.ts");
const eventsRouteSource = read("app/api/benefits/events/route.ts");
const freebiesRouteSource = read("app/api/freebies/route.ts");
const homeRouteSource = read("app/api/home/route.ts");
const homeFreebieHeroSource = read("components/home/HomeFreebieHero.tsx");
const freeBenefitsClientSource = read("components/FreeBenefitsClient.tsx");
const verifySource = read("scripts/verify-benefit-events.mjs");
const smokeSource = read("scripts/smoke.mjs");

const requiredTypeFields = [
  "title",
  "brandName",
  "benefitType",
  "eventUrl",
  "officialUrl",
  "finalUrl",
  "sourceName",
  "sourceType",
  "sourceUrl",
  "startAt",
  "endAt",
  "participationCondition",
  "requiresLogin",
  "requiresPurchase",
  "isEveryoneReward",
  "isFirstComeFirstServed",
  "rewardText",
  "cautionText",
  "claimCtaLabel",
  "trustBadges",
  "collectedAt",
  "updatedAt",
  "verifiedAt",
  "status",
  "validationStatus",
  "validationReason",
  "qualityScore",
  "priorityScore",
  "isHidden",
  "hiddenReason",
  "tags"
];

const requiredBenefitTypes = [
  '"everyone"',
  '"firstCome"',
  '"coupon"',
  '"sample"',
  '"freeTrial"',
  '"gifticon"',
  '"pointCashback"',
  '"checkIn"',
  '"signup"',
  '"publicFree"',
  '"experiencePanel"',
  '"freeShipping"',
  '"brandEvent"'
];

const requiredFilterLabels = [
  "전체",
  "전원증정",
  "선착순",
  "쿠폰",
  "샘플",
  "무료체험",
  "기프티콘",
  "포인트/캐시백",
  "출석체크",
  "신규가입",
  "공공무료",
  "체험단"
];

const requiredHomeQuickFilterParams = [
  "eventType=everyone",
  "eventType=firstCome",
  "eventType=coupon",
  "eventType=sample",
  "eventType=freeTrial",
  "eventType=gifticon",
  "eventType=pointCashback",
  "eventType=checkIn",
  "eventType=signup",
  "eventType=publicFree",
  "eventType=experiencePanel",
  "endingSoon=true"
];

const checks = [
  check(
    "FreeBenefitEvent canonical fields",
    hasAll(typeSource, requiredTypeFields).length === 0,
    `Missing fields: ${hasAll(typeSource, requiredTypeFields).join(", ") || "none"}`
  ),
  check(
    "FreeBenefitEvent category coverage",
    hasAll(typeSource, requiredBenefitTypes).length === 0 &&
      hasAll(normalizerSource, requiredFilterLabels).length === 0 &&
      normalizerSource.includes("freeBenefitEventCategories") &&
      normalizerSource.includes("getFreeBenefitEventLabel"),
    `Missing benefit types: ${hasAll(typeSource, requiredBenefitTypes).join(", ") || "none"}; missing labels: ${hasAll(normalizerSource, requiredFilterLabels).join(", ") || "none"}`
  ),
  check(
    "FreeBenefitEvent status contract",
    typeSource.includes('"active"') &&
      typeSource.includes('"expired"') &&
      typeSource.includes('"blocked"') &&
      typeSource.includes('"unknown"') &&
      typeSource.includes('"passed"') &&
      typeSource.includes('"failed"') &&
      typeSource.includes('"needs_review"'),
    "Event status and validation status should distinguish active, expired, blocked, unknown, passed, failed, and needs_review."
  ),
  check(
    "normalizer sanitizes and blocks unsafe URLs",
    hasAll(normalizerSource, [
      "sanitizeBenefitText",
      "normalizeBenefitTitle",
      "isSafeBenefitEventUrl",
      "isApprovedOfficialNewsUrl",
      "searchOrJunkUrlPattern",
      "privateHostPattern",
      "endedTextPattern"
    ]).length === 0,
    "Normalizer should sanitize external text and reject search, community, news, private-network, and ended-link signals."
  ),
  check(
    "normalizer infers real benefit conditions",
    hasAll(normalizerSource, [
      "requiresLogin",
      "requiresPurchase",
      "isEveryoneReward",
      "isFirstComeFirstServed",
      "participationCondition",
      "claimCtaLabel",
      "trustBadges"
    ]).length === 0,
    "Normalizer should expose login, purchase, everyone reward, first-come, condition, CTA, and trust metadata."
  ),
  check(
    "publishable gate hides invalid events",
    hasAll(normalizerSource, [
      "isPublishableFreeBenefitEvent",
      'event.status === "active"',
      'event.validationStatus === "passed"',
      "!event.isHidden",
      "Boolean(event.finalUrl)",
      "isSafeBenefitEventUrl(event.finalUrl)",
      "event.qualityScore >= 70"
    ]).length === 0,
    "Publishable gate must require active, passed, visible, safe final URL, unexpired, and quality score."
  ),
  check(
    "event dedupe uses brand title URL and end date",
    normalizerSource.includes("new Map<string, FreeBenefitEvent>()") &&
      normalizerSource.includes("normalizeBenefitTitle(event.title)") &&
      normalizerSource.includes("event.endAt.slice(0, 10)") &&
      normalizerSource.includes("deduped.set(key, event)"),
    "Deduplication should merge same brand/title/url/end-date events before publishing."
  ),
  check(
    "benefits events API is runtime no-store",
    hasAll(eventsRouteSource, [
      'dynamic = "force-dynamic"',
      "revalidate = 0",
      'fetchCache = "force-no-store"',
      "noStoreJson",
      "cachePolicy"
    ]).length === 0,
    "Free benefit events API should avoid static cache and expose no-store cache policy."
  ),
  check(
    "benefits events API is guarded and filterable",
    hasAll(eventsRouteSource, [
      "rateLimit",
      'getClientKey(request, "benefit-events")',
      "parseLimit",
      "noPurchaseOnly",
      "endingSoonOnly",
      "requiresPurchase",
      "requiresLogin",
      "includesQuery",
      "sortEvents",
      "summary"
    ]).length === 0,
    "API should rate-limit and support q, type, purchase/login, ending-soon, no-purchase, sorting, and summary."
  ),
  check(
    "benefits events API exposes trust policy",
    hasAll(eventsRouteSource, [
      "rankingPolicy",
      "claimCtaLabel",
      "trustBadges",
      "publishableOnly: true",
      "allowedStatuses",
      "allowedValidationStatuses",
      "search_link",
      "homepage_link",
      "community_link"
    ]).length === 0,
    "API response should tell clients that only active, passed, non-search, non-homepage, non-community events are publishable."
  ),
  check(
    "home and freebies surfaces share publishable event selector",
    homeRouteSource.includes("selectPublishableFreeBenefitEvents") &&
      freebiesRouteSource.includes("selectPublishableFreeBenefitEvents"),
    "Home and /api/freebies should use the same publishable selector as the benefits events API."
  ),
  check(
    "home exposes free benefit quick filters",
    hasAll(homeFreebieHeroSource, [
      "data-home-free-benefit-quick-filters",
      "전원증정",
      "선착순",
      "쿠폰",
      "무료체험",
      "샘플",
      "기프티콘",
      "포인트",
      "출석체크",
      "신규가입",
      "공공무료",
      "체험단",
      "마감임박",
      ...requiredHomeQuickFilterParams
    ]).length === 0 &&
      hasAll(freeBenefitsClientSource, [
        "freeBenefitEventCategories",
        "getFreeBenefitEventLabel",
        "parseFreeBenefitEventType",
        "getInitialFreeBenefitUrlState",
        "new URLSearchParams(window.location.search)",
        "initialUrlState.activeEventType",
        "initialUrlState.endingSoonOnly",
        "initialUrlState.firstComeOnly",
        "event.benefitType === activeEventType"
      ]).length === 0,
    "Home should expose mobile quick filters for the main free-benefit intents and /free-benefits should hydrate those filters from URL params."
  ),
  check(
    "home event cards expose claim conditions",
    hasAll(homeFreebieHeroSource, [
      "getEventConditionBadges",
      "event.participationCondition",
      "로그인 필요",
      "비회원 확인",
      "구매 필요",
      "구매조건 낮음",
      "검증 완료",
      "event.validationStatus"
    ]).length === 0,
    "Home free-benefit event cards should show participation condition, login/purchase requirement, and validation state in compact trust badges."
  ),
  check(
    "free benefits event cards expose claim conditions",
    hasAll(freeBenefitsClientSource, [
      "getFreeBenefitEventConditionBadges",
      "event.participationCondition",
      "로그인 필요",
      "비회원 확인",
      "구매 필요",
      "구매조건 낮음",
      "검증 완료",
      "event.validationStatus"
    ]).length === 0,
    "/free-benefits event cards should show participation condition, login/purchase requirement, and validation state in compact trust badges."
  ),
  check(
    "verify benefits enforces official active event floor",
    hasAll(verifySource, [
      "minimumVisibleEvents",
      "visibleActiveEvents",
      "blockedUrlPattern",
      "homePathSet",
      "sourceCount < 50",
      "hostCount < 45",
      "free-benefit-events.json",
      "FREE_BENEFIT_EVENTS_REPORT.md"
    ]).length === 0,
    "verify:benefits should produce JSON/Markdown evidence and fail low official active/source/host coverage."
  ),
  check(
    "smoke covers benefits events API contract",
    hasAll(smokeSource, [
      "free benefit events api",
      "/api/benefits/events?limit=12&type=all",
      "sort=noPurchase&noPurchaseOnly=true",
      "publishableOnly",
      "claimCtaLabel",
      "trustBadges"
    ]).length === 0,
    "Smoke should hit the events API and assert publishable policy, CTA, trust badges, and no-purchase filtering."
  )
];

const failed = checks.filter((item) => !item.ok);
const report = {
  ok: failed.length === 0,
  generatedAt: new Date().toISOString(),
  checkedFiles: [
    "types/freeBenefitEvent.ts",
    "lib/freeBenefitEvents.ts",
    "app/api/benefits/events/route.ts",
    "app/api/freebies/route.ts",
    "app/api/home/route.ts",
    "components/home/HomeFreebieHero.tsx",
    "components/FreeBenefitsClient.tsx",
    "scripts/verify-benefit-events.mjs",
    "scripts/smoke.mjs"
  ],
  checks
};

const docs = `# FreeBenefitEvent 계약

Generated: ${report.generatedAt}

Status: ${report.ok ? "PASS" : "FAIL"}

## 목적

할인도사의 메인 데이터는 구매 상품보다 무료혜택, 쿠폰, 샘플, 무료체험, 전원증정, 선착순, 출석체크, 공공무료 혜택을 우선합니다. 이 계약은 홈, 무료혜택 API, 검증 스크립트가 같은 기준으로 사용자에게 보여줄 수 있는 혜택만 통과시키는지 검사합니다.

## 노출 조건

- \`status=active\`
- \`validationStatus=passed\`
- \`isHidden=false\`
- \`finalUrl\` 존재
- 공식 허용 도메인의 \`http/https\` URL
- 검색 링크, 대표 홈페이지, 커뮤니티 글, 뉴스 기사, private-network URL 아님
- 종료일이 지났거나 종료/품절/마감 문구가 감지되지 않음
- \`qualityScore >= 70\`

## 필수 필드

${requiredTypeFields.map((field) => `- \`${field}\``).join("\n")}

## 검사 결과

| Check | Result | Detail |
| --- | --- | --- |
${checks.map((item) => `| ${item.name} | ${item.ok ? "PASS" : "FAIL"} | ${item.detail.replace(/\|/g, "/")} |`).join("\n")}
`;

mkdirSync(join(root, "reports"), { recursive: true });
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(docsPath, `${docs}\n`, "utf8");

if (failed.length) {
  console.error(`FreeBenefitEvent contract doctor failed: ${failed.map((item) => item.name).join(", ")}`);
  process.exit(1);
}

console.log(`FreeBenefitEvent contract doctor passed: ${checks.length}/${checks.length} checks.`);

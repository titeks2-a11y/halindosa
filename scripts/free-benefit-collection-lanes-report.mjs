import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const generatedAt = new Date();

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

function readJson(relativePath, fallback = {}) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function textOf(item) {
  return [
    item.id,
    item.title,
    item.summary,
    item.description,
    item.merchant,
    item.mallName,
    item.brand,
    item.sourceName,
    item.category,
    item.benefitType,
    ...(Array.isArray(item.tags) ? item.tags : [])
  ]
    .filter(Boolean)
    .join(" ");
}

function hostOf(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isExpired(item) {
  const end = Date.parse(String(item.expiresAt || item.endDate || item.endAt || ""));
  return Number.isFinite(end) && end < generatedAt.getTime();
}

function isConsumerFacing(item) {
  const text = textOf(item);
  return !/정부|공공|복지|지자체|교육|강좌|K-?MOOC|HRD|정부24|복지로|서울시|문화가 있는 날/i.test(text);
}

function isVisibleOfficialBenefit(item) {
  const finalUrl = String(item.finalUrl || item.officialUrl || item.eventUrl || item.sourceUrl || "");
  return (
    item.publishable === true &&
    item.isHidden !== true &&
    item.validationStatus === "passed" &&
    item.availability === "active" &&
    String(item.linkType || "").startsWith("official") &&
    Boolean(finalUrl) &&
    !isExpired(item)
  );
}

function benefitLabel(type) {
  const labels = {
    coupon: "쿠폰",
    freebie: "전원증정",
    sample: "무료 샘플",
    freeTrial: "무료체험",
    gifticon: "기프티콘",
    point: "포인트",
    pointCashback: "포인트/캐시백",
    freeShipping: "무료배송",
    signup: "신규가입",
    checkIn: "출석체크",
    roulette: "룰렛",
    discount: "할인",
    event: "이벤트",
    foodDelivery: "배달/외식",
    convenienceStore: "편의점",
    mart: "마트"
  };
  return labels[type] || type || "기타";
}

function countTop(items, selector, limit = 6) {
  const counts = new Map();
  for (const item of items) {
    const value = String(selector(item) || "기타").trim() || "기타";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function getBrand(item) {
  return String(item.merchant || item.mallName || item.brand || item.sourceName || "기타").trim() || "기타";
}

function deadlineHours(item) {
  const end = Date.parse(String(item.expiresAt || item.endDate || item.endAt || ""));
  if (!Number.isFinite(end)) return Number.POSITIVE_INFINITY;
  return (end - generatedAt.getTime()) / (60 * 60 * 1000);
}

const laneDefinitions = [
  {
    id: "officialEvents",
    label: "공식 이벤트",
    envKey: "OFFICIAL_EVENT_FEED_URLS",
    minimum: 40,
    matches: (item) => /official_event|official_benefit/i.test(String(item.linkType || item.source || item.provider || ""))
  },
  {
    id: "couponsMembership",
    label: "쿠폰·멤버십",
    envKey: "PUBLIC_COUPON_FEED_URLS",
    minimum: 25,
    matches: (item) => /쿠폰|멤버십|회원|웰컴|신규|가입|롯데잇츠|해피포인트|CJ\s*ONE|H\.?Point|L\.?POINT/i.test(textOf(item))
  },
  {
    id: "convenienceMart",
    label: "편의점·마트",
    envKey: "CONVENIENCE_BENEFIT_FEED_URLS",
    minimum: 8,
    matches: (item) => /GS25|CU|세븐일레븐|이마트24|편의점|마트|홈플러스|이마트|롯데마트|SSG|몰리스|다이소/i.test(textOf(item))
  },
  {
    id: "samplesTrials",
    label: "샘플·무료체험",
    envKey: "BEAUTY_SAMPLE_FEED_URLS",
    minimum: 6,
    matches: (item) => /샘플|체험|무료체험|체험팩|키트|아모레|올리브영|닥터지|라운드랩|로얄캐닌|반려동물/i.test(textOf(item))
  },
  {
    id: "pointsCashback",
    label: "포인트·캐시백",
    envKey: "PAY_POINT_BENEFIT_FEED_URLS",
    minimum: 12,
    matches: (item) => /포인트|캐시백|페이|pay|토스|카카오페이|네이버페이|PAYCO|OK캐쉬백|신세계포인트|L\.?POINT/i.test(textOf(item))
  },
  {
    id: "deliveryFood",
    label: "배달·외식",
    envKey: "DELIVERY_FOOD_COUPON_FEED_URLS",
    minimum: 10,
    matches: (item) => /배민|요기요|쿠팡이츠|롯데잇츠|스타벅스|투썸|이디야|메가|할리스|배스킨|던킨|카페|외식|커피/i.test(textOf(item))
  },
  {
    id: "shippingZero",
    label: "무료배송",
    envKey: "FREE_SHIPPING_FEED_URLS",
    minimum: 4,
    matches: (item) => /무료배송|무배|배송비\s*0|배송비\s*무료/i.test(textOf(item))
  },
  {
    id: "deadline",
    label: "오늘·이번주 마감",
    envKey: "DEADLINE_EVENT_FEED_URLS",
    minimum: 1,
    matches: (item) => deadlineHours(item) >= 0 && deadlineHours(item) <= 7 * 24
  }
];

const snapshot = readJson("data/refreshedNewsDeals.json", {});
const allDeals = Array.isArray(snapshot.allDeals) ? snapshot.allDeals : Array.isArray(snapshot.deals) ? snapshot.deals : [];
const visibleOfficial = allDeals.filter(isVisibleOfficialBenefit);
const consumerVisible = visibleOfficial.filter(isConsumerFacing);
const blocked = allDeals.filter((item) => !isVisibleOfficialBenefit(item));
const duplicateKeys = new Map();

for (const item of consumerVisible) {
  const key = [
    String(item.title || "").toLowerCase().replace(/\s+/g, " ").trim(),
    getBrand(item).toLowerCase(),
    hostOf(item.finalUrl || item.officialUrl || item.eventUrl || item.sourceUrl),
    item.expiresAt || item.endDate || ""
  ].join("|");
  duplicateKeys.set(key, (duplicateKeys.get(key) || 0) + 1);
}

const lanes = laneDefinitions.map((lane) => {
  const items = consumerVisible.filter(lane.matches);
  const status = items.length >= lane.minimum ? "healthy" : items.length > 0 ? "thin" : "empty";
  return {
    id: lane.id,
    label: lane.label,
    envKey: lane.envKey,
    minimum: lane.minimum,
    count: items.length,
    officialCount: items.filter((item) => String(item.linkType || "").startsWith("official")).length,
    noPurchaseCount: items.filter((item) => item.requiresPurchase !== true && !/구매|주문|결제|이상 구매/.test(textOf(item))).length,
    verifiedCount: items.filter((item) => item.validationStatus === "passed").length,
    status,
    action:
      status === "healthy"
        ? "현재 홈·카테고리 노출에 충분합니다."
        : status === "thin"
          ? `${lane.envKey}에 공식 이벤트/쿠폰 URL을 추가해 수집폭을 보강하세요.`
          : `${lane.envKey}가 비었습니다. 공식 이벤트 feed 또는 seed 후보를 우선 연결하세요.`,
    topBrands: countTop(items, getBrand),
    topBenefitTypes: countTop(items, (item) => benefitLabel(item.benefitType)),
    topCandidates: items
      .slice()
      .sort((a, b) => Number(b.qualityScore || 0) + Number(b.priorityScore || 0) - (Number(a.qualityScore || 0) + Number(a.priorityScore || 0)))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        brand: getBrand(item),
        benefitType: benefitLabel(item.benefitType),
        endDate: item.expiresAt || item.endDate || "",
        officialUrl: item.finalUrl || item.officialUrl || item.eventUrl || item.sourceUrl
      }))
  };
});

const summary = {
  totalItems: allDeals.length,
  visibleOfficialItems: visibleOfficial.length,
  consumerVisibleItems: consumerVisible.length,
  blockedItems: blocked.length,
  duplicateGroups: Array.from(duplicateKeys.values()).filter((count) => count > 1).length,
  healthyLanes: lanes.filter((lane) => lane.status === "healthy").length,
  thinLanes: lanes.filter((lane) => lane.status === "thin").length,
  emptyLanes: lanes.filter((lane) => lane.status === "empty").length,
  officialHosts: new Set(consumerVisible.map((item) => hostOf(item.finalUrl || item.officialUrl || item.eventUrl || item.sourceUrl)).filter(Boolean)).size,
  generatedAt: generatedAt.toISOString()
};

const ok = summary.consumerVisibleItems >= 120 && summary.healthyLanes >= 6 && summary.emptyLanes === 0 && summary.duplicateGroups === 0;
const report = {
  ok,
  generatedAt: generatedAt.toISOString(),
  source: "data/refreshedNewsDeals.json",
  summary,
  lanes,
  nextActions: lanes
    .filter((lane) => lane.status !== "healthy")
    .map((lane) => ({
      id: lane.id,
      priority: lane.status === "empty" ? "high" : "medium",
      title: `${lane.label} 수집축 보강`,
      action: lane.action,
      envKey: lane.envKey
    }))
};

const reportPath = join(reportsDir, "free-benefit-collection-lanes.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const md = `# 무료혜택 수집축 리포트

Generated: ${report.generatedAt}

Status: ${ok ? "PASS" : "NEEDS REVIEW"}

## 요약

- 전체 후보: ${summary.totalItems}개
- 공식 노출 가능 혜택: ${summary.visibleOfficialItems}개
- 소비자형 공식 혜택: ${summary.consumerVisibleItems}개
- 자동 제외 후보: ${summary.blockedItems}개
- 공식 도메인 수: ${summary.officialHosts}개
- 중복 그룹: ${summary.duplicateGroups}개
- 건강한 수집축: ${summary.healthyLanes}/${lanes.length}
- 얇은 수집축: ${summary.thinLanes}개
- 빈 수집축: ${summary.emptyLanes}개

## 수집축 상태

| 수집축 | 상태 | 개수 | 최소 기준 | 공식 | 구매조건 낮음 | Env key | 다음 액션 |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
${lanes.map((lane) => `| ${lane.label} | ${lane.status} | ${lane.count} | ${lane.minimum} | ${lane.officialCount} | ${lane.noPurchaseCount} | \`${lane.envKey}\` | ${lane.action} |`).join("\n")}

## 상위 후보

${lanes
  .map((lane) => `### ${lane.label}

${lane.topCandidates.map((item) => `- ${item.brand}: ${item.title} (${item.benefitType}, ${item.endDate || "마감일 미정"})`).join("\n") || "- 후보 없음"}
`)
  .join("\n")}

## 운영 기준

- 검색 결과, 대표몰 메인, 커뮤니티 중계 글은 사용자 CTA에 쓰지 않는다.
- 공식 이벤트, 쿠폰, 샘플 신청, 출석체크, 무료체험, 기프티콘, 포인트 페이지처럼 사용자가 바로 혜택을 확인할 수 있는 URL만 노출한다.
- 공공·정책성 정보는 기본 홈 상단 판단에서 제외하고, 소비자형 무료 혜택을 우선한다.
- 이 문서는 \`npm run benefit:collection:report\`로 재생성한다.
`;

writeFileSync(join(docsDir, "FREE_BENEFIT_COLLECTION_LANES.md"), md, "utf8");

if (!ok) {
  console.error("Free benefit collection lane report needs review.");
  console.error(`Report: ${reportPath}`);
  process.exit(1);
}

console.log("Free benefit collection lane report passed.");
console.log(`- Consumer visible benefits: ${summary.consumerVisibleItems}`);
console.log(`- Healthy lanes: ${summary.healthyLanes}/${lanes.length}`);
console.log(`- Report: ${reportPath}`);

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mockDeals = readFileSync(join(root, "data/mockDeals.ts"), "utf8");
const verifiedPurchaseLinks = readFileSync(join(root, "data/verifiedPurchaseLinks.ts"), "utf8");

const requiredCategories = ["식품", "전자기기", "생활용품", "의류", "육아", "여행/티켓", "뷰티", "가전", "편의점/마트", "쿠폰/이벤트", "기타"];
const requiredDealTypes = ["discount", "freebie", "coupon", "freeShipping", "experience", "point", "convenienceStore", "mart", "foodDelivery"];
const minimums = {
  totalDeals: 125,
  verifiedCoverageRate: 100,
  mallCount: 18,
  categoryCount: 11,
  benefitHeavyDeals: 70,
  dealsPerRequiredCategory: 5,
  dealsPerRequiredType: 5,
  minimumTagsPerDeal: 2,
  minimumTitleLength: 6
};

function extractDeals() {
  const pattern =
    /deal\(\s*"(?<id>d\d+)"\s*,\s*"(?<mall>[^"]+)"\s*,\s*"(?<title>[^"]+)"\s*,\s*"(?<category>[^"]+)"\s*,\s*(?<originalPrice>\d+)\s*,\s*(?<discountRate>\d+)\s*,[\s\S]*?\[(?<tags>[^\]]*)\]/g;
  const deals = [];

  for (const match of mockDeals.matchAll(pattern)) {
    if (!match.groups) continue;
    deals.push({
      id: match.groups.id,
      mall: match.groups.mall,
      title: match.groups.title,
      category: match.groups.category,
      originalPrice: Number(match.groups.originalPrice),
      discountRate: Number(match.groups.discountRate),
      salePrice: Math.round((Number(match.groups.originalPrice) * (100 - Number(match.groups.discountRate))) / 100 / 10) * 10,
      tags: [...match.groups.tags.matchAll(/"([^"]+)"/g)].map((tagMatch) => tagMatch[1])
    });
  }

  return deals;
}

function extractVerifiedIds() {
  return new Set([...verifiedPurchaseLinks.matchAll(/^\s*(d\d+):\s*{/gm)].map((match) => match[1]));
}

function inferType(deal) {
  const text = `${deal.title} ${deal.category} ${deal.tags.join(" ")}`;
  if (/배달|외식/.test(text)) return "foodDelivery";
  if (/편의점|1\+1|2\+1|모바일쿠폰/.test(text)) return "convenienceStore";
  if (/마트|장보기|쓱배송/.test(text)) return "mart";
  if (/포인트|적립|출석|페이|멤버십|리워드/.test(text)) return "point";
  if (/무료 샘플|체험단|무료체험|초대권|시사회/.test(text)) return "experience";
  if (/0원|무료|공짜|무상/.test(text) && deal.salePrice <= 1000) return "freebie";
  if (/쿠폰|교환권|이벤트|첫 구매|카드/.test(text)) return "coupon";
  if (/무료배송|무배/.test(text)) return "freeShipping";
  return "discount";
}

function countBy(items, selector) {
  const map = new Map();
  for (const item of items) {
    const key = selector(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

const deals = extractDeals();
const verifiedIds = extractVerifiedIds();
const categories = countBy(deals, (deal) => deal.category);
const malls = countBy(deals, (deal) => deal.mall);
const dealTypes = countBy(deals, inferType);
const verifiedCount = deals.filter((deal) => verifiedIds.has(deal.id)).length;
const coverageRate = deals.length ? Math.round((verifiedCount / deals.length) * 100) : 0;
const benefitHeavyDeals = deals.filter((deal) => ["freebie", "coupon", "experience", "point", "convenienceStore", "mart", "foodDelivery"].includes(inferType(deal))).length;
const issues = [];
const ids = new Set();
const duplicateIds = new Set();
const normalizedTitleKeys = new Map();

for (const deal of deals) {
  if (ids.has(deal.id)) duplicateIds.add(deal.id);
  ids.add(deal.id);

  const numericId = Number(deal.id.replace(/^d/, ""));
  if (!Number.isInteger(numericId) || numericId < 1) {
    issues.push(`상품 ID 형식이 올바르지 않습니다: ${deal.id}`);
  }

  if (!deal.title || deal.title.trim().length < minimums.minimumTitleLength) {
    issues.push(`${deal.id}: 상품명이 너무 짧습니다.`);
  }

  if (!deal.mall || deal.mall.trim().length < 2) {
    issues.push(`${deal.id}: 판매처명이 부족합니다.`);
  }

  if (!Number.isFinite(deal.originalPrice) || deal.originalPrice <= 0) {
    issues.push(`${deal.id}: 정상가가 올바르지 않습니다.`);
  }

  if (!Number.isFinite(deal.salePrice) || deal.salePrice < 0 || deal.salePrice > deal.originalPrice) {
    issues.push(`${deal.id}: 할인가가 정상가보다 크거나 올바르지 않습니다.`);
  }

  if (!Number.isFinite(deal.discountRate) || deal.discountRate < 0 || deal.discountRate > 100) {
    issues.push(`${deal.id}: 할인율은 0~100 사이여야 합니다.`);
  }

  if (deal.tags.length < minimums.minimumTagsPerDeal) {
    issues.push(`${deal.id}: 검색/필터용 태그가 부족합니다. ${deal.tags.length}/${minimums.minimumTagsPerDeal}`);
  }

  const titleKey = `${deal.mall}|${deal.title}`.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
  const previous = normalizedTitleKeys.get(titleKey);
  if (previous) {
    issues.push(`${deal.id}: 같은 판매처의 중복 상품명입니다. 기존 ${previous}`);
  } else {
    normalizedTitleKeys.set(titleKey, deal.id);
  }
}

if (duplicateIds.size) {
  issues.push(`중복 상품 ID가 있습니다: ${[...duplicateIds].sort().join(", ")}`);
}

for (let index = 1; index <= deals.length; index += 1) {
  const expectedId = `d${String(index).padStart(3, "0")}`;
  if (!ids.has(expectedId)) issues.push(`상품 ID 순번에 빈 값이 있습니다: ${expectedId}`);
}

if (deals.length < minimums.totalDeals) issues.push(`상품 수가 부족합니다: ${deals.length}/${minimums.totalDeals}`);
if (coverageRate < minimums.verifiedCoverageRate) issues.push(`검증 링크 커버리지가 부족합니다: ${coverageRate}%/${minimums.verifiedCoverageRate}%`);
if (malls.size < minimums.mallCount) issues.push(`판매처 다양성이 부족합니다: ${malls.size}/${minimums.mallCount}`);
if (categories.size < minimums.categoryCount) issues.push(`카테고리 다양성이 부족합니다: ${categories.size}/${minimums.categoryCount}`);
if (benefitHeavyDeals < minimums.benefitHeavyDeals) issues.push(`무료/쿠폰/이벤트성 혜택 수가 부족합니다: ${benefitHeavyDeals}/${minimums.benefitHeavyDeals}`);

for (const category of requiredCategories) {
  if (!categories.has(category)) issues.push(`필수 카테고리가 없습니다: ${category}`);
  if ((categories.get(category) ?? 0) < minimums.dealsPerRequiredCategory) {
    issues.push(`필수 카테고리 상품 수가 부족합니다: ${category} ${(categories.get(category) ?? 0)}/${minimums.dealsPerRequiredCategory}`);
  }
}

for (const dealType of requiredDealTypes) {
  if (!dealTypes.has(dealType)) issues.push(`필수 혜택 유형 후보가 없습니다: ${dealType}`);
  if ((dealTypes.get(dealType) ?? 0) < minimums.dealsPerRequiredType) {
    issues.push(`필수 혜택 유형 상품 수가 부족합니다: ${dealType} ${(dealTypes.get(dealType) ?? 0)}/${minimums.dealsPerRequiredType}`);
  }
}

if (issues.length) {
  console.error("Catalog quality doctor failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Catalog quality doctor passed.");
console.log(`- Deals: ${deals.length}`);
console.log(`- Verified purchase coverage: ${verifiedCount}/${deals.length} (${coverageRate}%)`);
console.log(`- Malls: ${malls.size}`);
console.log(`- Categories: ${categories.size}`);
console.log(`- Benefit-heavy deals: ${benefitHeavyDeals}`);
console.log(`- Minimum per required category: ${minimums.dealsPerRequiredCategory}`);
console.log(`- Minimum per required deal type: ${minimums.dealsPerRequiredType}`);
console.log(`- ID hygiene: ${ids.size} unique sequential ids`);
console.log(`- Required tags per deal: ${minimums.minimumTagsPerDeal}+`);
console.log(`- Deal types: ${[...dealTypes.keys()].sort().join(", ")}`);

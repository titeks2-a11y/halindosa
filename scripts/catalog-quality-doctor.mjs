import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mockDeals = readFileSync(join(root, "data/mockDeals.ts"), "utf8");
const verifiedPurchaseLinks = readFileSync(join(root, "data/verifiedPurchaseLinks.ts"), "utf8");

const requiredCategories = ["식품", "전자기기", "생활용품", "의류", "육아", "여행/티켓", "뷰티", "가전", "편의점/마트", "쿠폰/이벤트"];
const requiredDealTypes = ["discount", "freebie", "coupon", "freeShipping", "experience", "point", "convenienceStore", "mart", "foodDelivery"];
const minimums = {
  totalDeals: 90,
  verifiedCoverageRate: 100,
  mallCount: 18,
  categoryCount: 10,
  benefitHeavyDeals: 24
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

if (deals.length < minimums.totalDeals) issues.push(`상품 수가 부족합니다: ${deals.length}/${minimums.totalDeals}`);
if (coverageRate < minimums.verifiedCoverageRate) issues.push(`검증 링크 커버리지가 부족합니다: ${coverageRate}%/${minimums.verifiedCoverageRate}%`);
if (malls.size < minimums.mallCount) issues.push(`판매처 다양성이 부족합니다: ${malls.size}/${minimums.mallCount}`);
if (categories.size < minimums.categoryCount) issues.push(`카테고리 다양성이 부족합니다: ${categories.size}/${minimums.categoryCount}`);
if (benefitHeavyDeals < minimums.benefitHeavyDeals) issues.push(`무료/쿠폰/이벤트성 혜택 수가 부족합니다: ${benefitHeavyDeals}/${minimums.benefitHeavyDeals}`);

for (const category of requiredCategories) {
  if (!categories.has(category)) issues.push(`필수 카테고리가 없습니다: ${category}`);
}

for (const dealType of requiredDealTypes) {
  if (!dealTypes.has(dealType)) issues.push(`필수 혜택 유형 후보가 없습니다: ${dealType}`);
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
console.log(`- Deal types: ${[...dealTypes.keys()].sort().join(", ")}`);

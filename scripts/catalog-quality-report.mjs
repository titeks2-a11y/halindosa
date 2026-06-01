import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mockDeals = readFileSync(join(root, "data/mockDeals.ts"), "utf8");
const verifiedPurchaseLinks = readFileSync(join(root, "data/verifiedPurchaseLinks.ts"), "utf8");
const outputPath = join(root, "docs/catalog-quality-report.md");

function extractDeals() {
  const pattern =
    /deal\(\s*"(?<id>d\d+)"\s*,\s*"(?<mall>[^"]+)"\s*,\s*"(?<title>[^"]+)"\s*,\s*"(?<category>[^"]+)"\s*,\s*(?<originalPrice>\d+)\s*,\s*(?<discountRate>\d+)\s*,[\s\S]*?\[(?<tags>[^\]]*)\]/g;
  const deals = [];

  for (const match of mockDeals.matchAll(pattern)) {
    if (!match.groups) continue;
    const originalPrice = Number(match.groups.originalPrice);
    const discountRate = Number(match.groups.discountRate);
    const salePrice = Math.round((originalPrice * (100 - discountRate)) / 100 / 10) * 10;

    deals.push({
      id: match.groups.id,
      mall: match.groups.mall,
      title: match.groups.title,
      category: match.groups.category,
      originalPrice,
      discountRate,
      salePrice,
      discountAmount: originalPrice - salePrice,
      tags: [...match.groups.tags.matchAll(/"([^"]+)"/g)].map((tagMatch) => tagMatch[1])
    });
  }

  return deals;
}

function extractVerifiedEntries() {
  const pattern = /^\s*(d\d+):\s*\{(?<body>[\s\S]*?)^\s*\},?/gm;
  const entries = [];

  for (const match of verifiedPurchaseLinks.matchAll(pattern)) {
    const body = match.groups?.body ?? "";
    const url = body.match(/url:\s*"([^"]+)"/)?.[1] ?? "";
    const host = safeHost(url);

    entries.push({
      id: match[1],
      url,
      host,
      source: body.match(/source:\s*"([^"]+)"/)?.[1] ?? "",
      evidence: body.match(/evidence:\s*"([^"]+)"/)?.[1] ?? ""
    });
  }

  return entries;
}

function safeHost(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
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
  const counts = new Map();
  for (const item of items) {
    const key = selector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"));
}

function renderRows(rows) {
  return rows.map(([label, count]) => `| ${label} | ${count} |`).join("\n");
}

function topDeals(deals, selector, count = 8) {
  return [...deals]
    .sort((a, b) => selector(b) - selector(a))
    .slice(0, count)
    .map((deal) => `| ${deal.id} | ${deal.mall} | ${deal.category} | ${deal.title.replace(/\|/g, "/")} | ${selector(deal).toLocaleString("ko-KR")} |`)
    .join("\n");
}

const deals = extractDeals();
const verifiedEntries = extractVerifiedEntries();
const verifiedIds = new Set(verifiedEntries.map((entry) => entry.id));
const verifiedCount = deals.filter((deal) => verifiedIds.has(deal.id)).length;
const categoryRows = countBy(deals, (deal) => deal.category);
const mallRows = countBy(deals, (deal) => deal.mall);
const typeRows = countBy(deals, inferType);
const hostRows = countBy(verifiedEntries.filter((entry) => entry.host), (entry) => entry.host);
const freeShippingDeals = deals.filter((deal) => /무료배송|무배|네멤무료|로켓배송|로켓프레시/.test(`${deal.tags.join(" ")} ${deal.title}`));
const eventDeals = deals.filter((deal) => ["freebie", "coupon", "experience", "point", "convenienceStore", "mart", "foodDelivery"].includes(inferType(deal)));
const underRepresentedCategories = categoryRows.filter(([, count]) => count < 5).map(([label]) => label);
const underRepresentedTypes = typeRows.filter(([, count]) => count < 5).map(([label]) => label);

const markdown = `# 상품 DB 품질 보고서

생성 시각: ${new Date().toISOString()}

## 요약

| 항목 | 값 |
| --- | ---: |
| 전체 상품 | ${deals.length} |
| 검증 링크 | ${verifiedCount}/${deals.length} |
| 판매처 수 | ${mallRows.length} |
| 구매 도메인 수 | ${hostRows.length} |
| 카테고리 수 | ${categoryRows.length} |
| 혜택 유형 수 | ${typeRows.length} |
| 무료배송/무배 후보 | ${freeShippingDeals.length} |
| 무료/쿠폰/이벤트성 혜택 | ${eventDeals.length} |

## 카테고리 분포

| 카테고리 | 상품 수 |
| --- | ---: |
${renderRows(categoryRows)}

## 혜택 유형 분포

| 혜택 유형 | 상품 수 |
| --- | ---: |
${renderRows(typeRows)}

## 판매처 상위 20개

| 판매처 | 상품 수 |
| --- | ---: |
${renderRows(mallRows.slice(0, 20))}

## 구매 도메인 상위 20개

| 도메인 | 링크 수 |
| --- | ---: |
${renderRows(hostRows.slice(0, 20))}

## 할인율 상위 상품

| ID | 판매처 | 카테고리 | 상품 | 값 |
| --- | --- | --- | --- | ---: |
${topDeals(deals, (deal) => deal.discountRate)}

## 절약액 상위 상품

| ID | 판매처 | 카테고리 | 상품 | 값 |
| --- | --- | --- | --- | ---: |
${topDeals(deals, (deal) => deal.discountAmount)}

## 다음 상품 보강 우선순위

- 카테고리 5개 미만 영역: ${underRepresentedCategories.length ? underRepresentedCategories.join(", ") : "없음"}
- 혜택 유형 5개 미만 영역: ${underRepresentedTypes.length ? underRepresentedTypes.join(", ") : "없음"}
- 신규 상품 추가 시 실제 상품 상세 URL 또는 공식 혜택/이벤트 URL을 먼저 확보합니다.
- 커뮤니티 원문, 검색 결과, 대표몰 메인 링크는 sourceUrl로만 분리하고 finalPurchaseUrl에는 넣지 않습니다.
- 상품 수를 늘릴 때는 특정 판매처에 치우치지 않도록 카테고리와 구매 도메인 분포를 함께 확인합니다.
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown, "utf8");

console.log(`Catalog quality report written: ${outputPath}`);
console.log(`- Deals: ${deals.length}`);
console.log(`- Verified links: ${verifiedCount}/${deals.length}`);
console.log(`- Categories: ${categoryRows.length}`);
console.log(`- Malls: ${mallRows.length}`);
console.log(`- Purchase hosts: ${hostRows.length}`);

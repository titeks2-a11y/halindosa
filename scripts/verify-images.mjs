import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function pass(name, detail = "") {
  checks.push({ name, ok: true, detail });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

function includesAll(source, values) {
  return values.every((value) => source.includes(value));
}

const dealType = read("types/deal.ts");
const normalizer = read("lib/deals/normalizer.ts");
const imageResolver = read("lib/deals/imageResolver.ts");
const quality = read("lib/deals/quality.ts");
const ranking = read("lib/deals/ranking.ts");
const mockDeals = read("data/mockDeals.ts");
const imageSrc = read("lib/imageSrc.ts");
const components = [
  ["QuickDealCard", "components/QuickDealCard.tsx"],
  ["DealCard", "components/DealCard.tsx"],
  ["LiveDealFeed", "components/LiveDealFeed.tsx"],
  ["HotSignalSection", "components/HotSignalSection.tsx"],
  ["TrueDealSpotlight", "components/TrueDealSpotlight.tsx"]
].map(([name, path]) => [name, path, read(path)]);

if (
  includesAll(dealType, [
    'DealImageType = "official" | "generated" | "fallback"',
    "qualityScore: number",
    "imageType: DealImageType"
  ])
) {
  pass("deal image schema", "Deal 표준 타입이 imageType과 qualityScore를 명시합니다.");
} else {
  fail("deal image schema", "Deal 타입에 imageType 또는 qualityScore 표준 필드가 부족합니다.");
}

if (
  includesAll(normalizer, [
    "getDealImageType(thumbnail)",
    "getDealQualityScore",
    "qualityScore >= 55",
    "qualityScore",
    "imageType"
  ])
) {
  pass("normalizer image fields", "정규화 단계에서 imageType과 qualityScore를 모든 상품에 채우고 낮은 품질 항목을 publishable에서 제외합니다.");
} else {
  fail("normalizer image fields", "정규화 단계에서 imageType, qualityScore, publishable 품질 하한 기준 중 일부가 부족합니다.");
}

if (
  includesAll(imageResolver, [
    "isCategoryFallbackImage",
    "isRealDealImageUrl",
    "getDealImageType",
    '"generated"',
    '"official"',
    '"fallback"'
  ])
) {
  pass("image type resolver", "이미지 resolver가 공식/생성/fallback 이미지를 구분합니다.");
} else {
  fail("image type resolver", "이미지 타입 resolver가 부족합니다.");
}

if (includesAll(quality, ["getDealQualityScore", "freshnessHours", "imageType === \"official\"", "imageType === \"generated\"", "shouldHideDeal(deal)"])) {
  pass("quality score image weighting", "qualityScore가 최신성, 링크 검증, 이미지 타입, 신고/숨김 상태를 반영합니다.");
} else {
  fail("quality score image weighting", "qualityScore 계산 기준에 최신성/링크/이미지/숨김 요소가 부족합니다.");
}

if (ranking.includes("(deal.qualityScore ?? 0)")) {
  pass("ranking quality score", "홈/추천 랭킹에 qualityScore가 반영됩니다.");
} else {
  fail("ranking quality score", "랭킹이 qualityScore를 반영하지 않습니다.");
}

const fallbackAssets = [...mockDeals.matchAll(/"(?<category>[^"]+)":\s*"(?<asset>\/deal-images\/category-[^"]+\.svg)"/g)].map((match) => ({
  category: match.groups.category,
  asset: match.groups.asset
}));

if (fallbackAssets.length >= 8 && mockDeals.includes("categoryFallbackImages") && mockDeals.includes("displayImageUrl")) {
  pass("generated placeholder mapping", `${fallbackAssets.length}개 카테고리 생성 placeholder가 mock 데이터 fallback으로 연결되어 있습니다.`);
} else {
  fail("generated placeholder mapping", "카테고리별 생성 placeholder 매핑이 부족합니다.");
}

const assetIssues = [];
for (const { category, asset } of fallbackAssets) {
  const path = join(root, "public", asset.replace(/^\//, ""));
  if (!existsSync(path)) {
    assetIssues.push(`${category}: ${asset} 파일 없음`);
    continue;
  }

  const body = readFileSync(path, "utf8");
  if (!body.includes("linearGradient") || !body.includes("role=\"img\"") || !body.includes("placeholder")) {
    assetIssues.push(`${category}: gradient/icon placeholder 메타가 부족함`);
  }
  if (/<image\b/i.test(body)) {
    assetIssues.push(`${category}: 실제 상품 사진처럼 보일 수 있는 embedded image 사용 금지`);
  }
}

if (assetIssues.length) {
  fail("generated placeholder assets", assetIssues.join("; "));
} else {
  pass("generated placeholder assets", "생성 placeholder는 gradient/icon 기반 SVG이며 실제 상품 사진을 가장하지 않습니다.");
}

const componentIssues = [];
for (const [name, , source] of components) {
  if (!source.includes("getDealImageSrc")) componentIssues.push(`${name}: getDealImageSrc 누락`);
  if (!source.includes('loading="lazy"')) componentIssues.push(`${name}: lazy loading 누락`);
  if (!source.includes('decoding="async"')) componentIssues.push(`${name}: async decoding 누락`);
  if (!source.includes("object-cover")) componentIssues.push(`${name}: object-cover 누락`);
  if (!source.includes("referrerPolicy=\"no-referrer\"")) componentIssues.push(`${name}: referrerPolicy 누락`);
}

if (componentIssues.length) {
  fail("image rendering components", componentIssues.join("; "));
} else {
  pass("image rendering components", "주요 카드/피드 컴포넌트가 lazy loading, async decoding, object-cover, no-referrer를 유지합니다.");
}

if (includesAll(imageSrc, ["proxiedHosts", "/api/image", "cdn.ppomppu.co.kr"])) {
  pass("local image proxy", "로컬 개발에서 차단 가능성이 높은 이미지 호스트는 프록시 유틸을 통과합니다.");
} else {
  fail("local image proxy", "로컬 이미지 프록시 기준이 부족합니다.");
}

const dealLines = mockDeals.split(/\r?\n/).filter((line) => /deal\("d\d+"/.test(line));
const explicitImageLines = dealLines.filter((line) => /https?:\/\/|\/deal-images\/|\/images\//.test(line));
const explicitImageRate = dealLines.length ? Math.round((explicitImageLines.length / dealLines.length) * 100) : 0;

if (explicitImageRate >= 25) {
  pass("explicit image floor", `명시 이미지 또는 파생 가능 이미지 라인이 ${explicitImageLines.length}/${dealLines.length}개(${explicitImageRate}%)입니다.`);
} else {
  fail("explicit image floor", `명시 이미지 커버리지가 ${explicitImageRate}%로 25% 기준보다 낮습니다.`);
}

const failed = checks.filter((check) => !check.ok);
const report = {
  generatedAt: new Date().toISOString(),
  ok: failed.length === 0,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  explicitImageRate,
  fallbackAssets,
  checks
};

mkdirSync(join(root, "reports"), { recursive: true });
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "reports", "image-verification.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const markdown = `# 할인도사 Image Verification Report

Generated: ${report.generatedAt}
Status: ${report.ok ? "PASS" : "FAIL"}

## Summary

| Metric | Value |
| --- | ---: |
| Checks | ${report.passedChecks}/${report.totalChecks} |
| Explicit image line rate | ${explicitImageRate}% |
| Generated placeholder assets | ${fallbackAssets.length} |

## Checks

${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`).join("\n")}
`;

writeFileSync(join(root, "docs", "IMAGE_VERIFICATION_REPORT.md"), markdown, "utf8");

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error(`Image verification failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Image verification passed: ${checks.length}/${checks.length}`);

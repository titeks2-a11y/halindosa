import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deriveProductImageUrlFromPurchaseUrl, isCategoryFallbackImage } from "./image-url-utils.mjs";

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
const verifiedPurchaseLinks = read("data/verifiedPurchaseLinks.ts");
const verifiedProductImages = read("data/verifiedProductImages.ts");
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

const verifiedUrlsById = new Map(
  [...verifiedPurchaseLinks.matchAll(/(d\d+):\s*\{[\s\S]*?url:\s*"([^"]+)"/g)].map((match) => [match[1], match[2]])
);
const verifiedImagesById = new Map(
  [...verifiedProductImages.matchAll(/(d\d+):\s*\{[\s\S]*?url:\s*"([^"]+)"/g)].map((match) => [match[1], match[2]])
);
const dealLines = mockDeals.split(/\r?\n/).filter((line) => /deal\("d\d+"/.test(line));
const explicitImageLines = dealLines.filter((line) => {
  const id = line.match(/deal\("(d\d+)"/)?.[1] ?? "";
  const quotedValues = [...line.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  const hasImageCandidate = quotedValues.some((value) => {
    const lower = value.toLowerCase();

    return value.startsWith("/deal-images/") || value.startsWith("/images/") || (/^https?:\/\//.test(value) && /\.(png|jpe?g|webp|avif)(?:[?#].*)?$/.test(lower));
  });
  const derivedImage = deriveProductImageUrlFromPurchaseUrl(verifiedUrlsById.get(id) ?? quotedValues.find((value) => /^https?:\/\//.test(value)));

  return verifiedImagesById.has(id) || hasImageCandidate || Boolean(derivedImage);
});
const explicitImageRate = dealLines.length ? Math.round((explicitImageLines.length / dealLines.length) * 100) : 0;

if (explicitImageRate >= 25) {
  pass("explicit image floor", `명시 이미지 또는 파생 가능 이미지 라인이 ${explicitImageLines.length}/${dealLines.length}개(${explicitImageRate}%)입니다.`);
} else {
  fail("explicit image floor", `명시 이미지 커버리지가 ${explicitImageRate}%로 25% 기준보다 낮습니다.`);
}

const fallbackAssetByCategory = new Map(fallbackAssets.map((item) => [item.category, item.asset]));
const visibleImageAudit = {
  total: 0,
  officialImageCount: 0,
  generatedPlaceholderCount: 0,
  fallbackMissingCount: 0,
  renderableImageCount: 0,
  renderableImageRate: 0,
  officialImageRate: 0,
  missingImageIds: [],
  typeCounts: {
    official: 0,
    generated: 0,
    fallback: 0
  }
};

for (const line of dealLines) {
  const quotedValues = [...line.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  const id = quotedValues[0] ?? "";
  const category = quotedValues[3] ?? "기타";
  const imageCandidates = quotedValues.filter((value) => {
    const lower = value.toLowerCase();
    return value.startsWith("/deal-images/") || value.startsWith("/images/") || (/^https?:\/\//.test(value) && /\.(png|jpe?g|webp|avif)(?:[?#].*)?$/.test(lower));
  });
  const verifiedOfficialImage = verifiedImagesById.get(id) ?? "";
  const explicitOfficialImage = verifiedOfficialImage || imageCandidates.find((value) => !isCategoryFallbackImage(value)) || "";
  const explicitGeneratedImage = imageCandidates.find((value) => isCategoryFallbackImage(value)) ?? "";
  const derivedImage = deriveProductImageUrlFromPurchaseUrl(verifiedUrlsById.get(id) ?? quotedValues.find((value) => /^https?:\/\//.test(value)));
  const generatedImage = explicitGeneratedImage || fallbackAssetByCategory.get(category) || fallbackAssetByCategory.get("기타") || "";
  const resolvedType = explicitOfficialImage || derivedImage ? "official" : generatedImage ? "generated" : "fallback";

  visibleImageAudit.total += 1;
  visibleImageAudit.typeCounts[resolvedType] += 1;

  if (resolvedType === "official") visibleImageAudit.officialImageCount += 1;
  if (resolvedType === "generated") visibleImageAudit.generatedPlaceholderCount += 1;
  if (resolvedType === "fallback") {
    visibleImageAudit.fallbackMissingCount += 1;
    visibleImageAudit.missingImageIds.push(id);
  } else {
    visibleImageAudit.renderableImageCount += 1;
  }
}

visibleImageAudit.renderableImageRate = visibleImageAudit.total ? Math.round((visibleImageAudit.renderableImageCount / visibleImageAudit.total) * 100) : 0;
visibleImageAudit.officialImageRate = visibleImageAudit.total ? Math.round((visibleImageAudit.officialImageCount / visibleImageAudit.total) * 100) : 0;

if (visibleImageAudit.renderableImageRate === 100 && visibleImageAudit.fallbackMissingCount === 0) {
  pass(
    "publishable image exposure audit",
    `노출 상품 ${visibleImageAudit.total}개 모두 공식/파생/생성 이미지로 렌더링 가능합니다.`
  );
} else {
  fail(
    "publishable image exposure audit",
    `이미지 없이 노출될 수 있는 상품이 ${visibleImageAudit.fallbackMissingCount}개 있습니다: ${visibleImageAudit.missingImageIds.join(", ")}`
  );
}

if (visibleImageAudit.officialImageRate >= 25) {
  pass("official image operating floor", `공식/파생 이미지 비율이 ${visibleImageAudit.officialImageRate}%입니다.`);
} else {
  fail("official image operating floor", `공식/파생 이미지 비율이 ${visibleImageAudit.officialImageRate}%로 25% 기준보다 낮습니다.`);
}

if (includesAll(mockDeals, ["verifiedProductImages", "verifiedImage?.url", "deriveProductImageUrlFromPurchaseUrl"])) {
  pass("verified product image priority", "검증된 공식 상품/혜택 이미지가 명시 이미지와 생성 placeholder보다 먼저 적용됩니다.");
} else {
  fail("verified product image priority", "mock 데이터 정규화가 verifiedProductImages를 우선 사용하지 않습니다.");
}

const finalFailed = checks.filter((check) => !check.ok);
const report = {
  generatedAt: new Date().toISOString(),
  ok: finalFailed.length === 0,
  totalChecks: checks.length,
  passedChecks: checks.length - finalFailed.length,
  failedChecks: finalFailed.length,
  explicitImageRate,
  visibleImageAudit,
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
| Renderable visible image rate | ${visibleImageAudit.renderableImageRate}% |
| Official/derived image rate | ${visibleImageAudit.officialImageRate}% |
| Official/derived images | ${visibleImageAudit.officialImageCount} |
| Generated placeholders | ${visibleImageAudit.generatedPlaceholderCount} |
| Missing image fallback | ${visibleImageAudit.fallbackMissingCount} |
| Generated placeholder assets | ${fallbackAssets.length} |

## Checks

${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`).join("\n")}
`;

writeFileSync(join(root, "docs", "IMAGE_VERIFICATION_REPORT.md"), markdown, "utf8");

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (finalFailed.length) {
  console.error(`Image verification failed: ${finalFailed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Image verification passed: ${checks.length}/${checks.length}`);

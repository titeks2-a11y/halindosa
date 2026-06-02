import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const mockDeals = readFileSync(join(root, "data", "mockDeals.ts"), "utf8");
const verifiedPurchaseLinks = readFileSync(join(root, "data", "verifiedPurchaseLinks.ts"), "utf8");
const ranking = readFileSync(join(root, "lib", "deals", "ranking.ts"), "utf8");
const homePage = readFileSync(join(root, "app", "page.tsx"), "utf8");
const components = [
  ["QuickDealCard", join(root, "components", "QuickDealCard.tsx")],
  ["DealCard", join(root, "components", "DealCard.tsx")],
  ["LiveDealFeed", join(root, "components", "LiveDealFeed.tsx")]
];

const issues = [];
const warnings = [];
const localImages = new Set();
const remoteImages = new Set();
const dealLines = mockDeals.split(/\r?\n/).filter((line) => /deal\("d\d+"/.test(line));
let dealsWithoutExplicitImage = 0;
const hasCategoryFallback = /categoryFallbackImages/.test(mockDeals) && /displayImageUrl\s*=/.test(mockDeals);
const fallbackCategoryCounts = new Map();
const categoryFallbackAssets = [...mockDeals.matchAll(/"[^"]+":\s*"(?<asset>\/deal-images\/category-[^"]+\.svg)"/g)].map((match) => match.groups?.asset).filter(Boolean);
const verifiedUrlsById = new Map(
  [...verifiedPurchaseLinks.matchAll(/(d\d+):\s*\{[\s\S]*?url:\s*"([^"]+)"/g)].map((match) => [match[1], match[2]])
);

function getCaseInsensitiveParam(url, name) {
  const target = name.toLowerCase();

  for (const [key, value] of url.searchParams.entries()) {
    if (key.toLowerCase() === target) return value;
  }

  return "";
}

function deriveProductImageUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "item.gmarket.co.kr" || host.endsWith(".gmarket.co.kr")) {
      const goodsCode = getCaseInsensitiveParam(url, "goodsCode") || getCaseInsensitiveParam(url, "goodscode");

      if (/^\d{5,}$/.test(goodsCode)) return `https://gdimg.gmarket.co.kr/${goodsCode}/still/600`;
    }
  } catch {
    return "";
  }

  return "";
}

for (const line of dealLines) {
  const quotedValues = [...line.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  const id = quotedValues[0] ?? "";
  const category = quotedValues[3] ?? "기타";
  const imageCandidates = quotedValues.filter((value) => {
    const lower = value.toLowerCase();
    return value.startsWith("/deal-images/") || value.startsWith("/images/") || /^https?:\/\//.test(value) && /\.(png|jpe?g|webp|avif)(?:[?#].*)?$/.test(lower);
  });
  const derivedImage = deriveProductImageUrl(verifiedUrlsById.get(id) ?? quotedValues.find((value) => /^https?:\/\//.test(value)));

  if (derivedImage && !imageCandidates.includes(derivedImage)) {
    imageCandidates.push(derivedImage);
  }

  if (!imageCandidates.length) {
    dealsWithoutExplicitImage += 1;
    fallbackCategoryCounts.set(category, (fallbackCategoryCounts.get(category) ?? 0) + 1);
  }

  for (const image of imageCandidates) {
    if (image.startsWith("/")) localImages.add(image);
    if (/^https?:\/\//.test(image)) remoteImages.add(image);
  }
}

for (const image of categoryFallbackAssets) {
  localImages.add(image);
}

for (const image of localImages) {
  const cleanPath = image.split("?")[0];
  const publicPath = join(root, "public", cleanPath.replace(/^\//, ""));
  if (!existsSync(publicPath)) {
    issues.push(`${image}: public 폴더에 이미지 파일이 없습니다.`);
  }
}

for (const [name, file] of components) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("getDealImageSrc")) {
    warnings.push(`${name}: 로컬 프록시 이미지 유틸(getDealImageSrc)을 사용하지 않습니다.`);
  }
  if (!/loading\s*=\s*["']lazy["']/.test(source)) {
    issues.push(`${name}: 상품 이미지에 loading="lazy"가 필요합니다.`);
  }
  if (!/decoding\s*=\s*["']async["']/.test(source)) {
    issues.push(`${name}: 상품 이미지에 decoding="async"가 필요합니다.`);
  }
  if (!/object-cover/.test(source)) {
    issues.push(`${name}: 상품 썸네일 비율 유지를 위해 object-cover가 필요합니다.`);
  }
}

const explicitImageRate = dealLines.length ? Math.round(((dealLines.length - dealsWithoutExplicitImage) / dealLines.length) * 100) : 0;
const effectiveImageCount = hasCategoryFallback ? dealLines.length : dealLines.length - dealsWithoutExplicitImage;
const effectiveImageRate = dealLines.length ? Math.round((effectiveImageCount / dealLines.length) * 100) : 0;
if (!hasCategoryFallback && explicitImageRate < 70) {
  warnings.push(`명시 이미지 커버리지가 낮습니다: ${explicitImageRate}%. 이미지 없는 상품은 카드 fallback이 사용됩니다.`);
}

if (!ranking.includes("getDealImageQualityScore") || !ranking.includes("hasRealDealImage") || !ranking.includes("isRealDealImageUrl")) {
  issues.push("상품 랭킹이 공용 이미지 판별 유틸로 실상품 이미지와 카테고리 fallback 이미지를 구분해야 합니다.");
}

if (!homePage.includes("getCommercialDealScore(deal)")) {
  issues.push("홈 상단 정렬이 공용 이미지 품질 랭킹을 사용해야 합니다.");
}

const report = `# 할인도사 Image Quality Report

Generated: ${new Date().toISOString()}
Status: ${issues.length ? "FAIL" : "PASS"}

## Summary

| Metric | Value |
| --- | ---: |
| 전체 상품 수 | ${dealLines.length} |
| 명시 이미지 상품 수 | ${dealLines.length - dealsWithoutExplicitImage} |
| 이미지 없는 상품 수 | ${dealsWithoutExplicitImage} |
| 명시 이미지 커버리지 | ${explicitImageRate}% |
| 카테고리 fallback 적용 | ${hasCategoryFallback ? "예" : "아니오"} |
| 실제 렌더링 이미지 커버리지 | ${effectiveImageRate}% |
| 로컬 이미지 수 | ${localImages.size} |
| 원격 이미지 수 | ${remoteImages.size} |
| fallback 카테고리 수 | ${fallbackCategoryCounts.size} |

## Image Policy

- 상품 이미지는 고정 비율 컨테이너 안에서 object-cover로 렌더링합니다.
- 로컬 개발에서 일부 커뮤니티 CDN 이미지는 /api/image 프록시를 거칩니다.
- 이미지가 없는 상품은 카테고리별 할인도사 브랜드 썸네일을 자동 적용하되, 실제 운영 데이터에서는 상품 이미지 보강을 우선합니다.
- G마켓 검증 구매 상세 URL은 상품 코드 기반 공식 이미지 CDN URL을 자동 파생해 category fallback보다 먼저 사용합니다.
- 홈 상단 랭킹은 실상품 이미지 보유 상품에 가산점을 주고 카테고리 fallback 상품의 상단 쏠림을 줄입니다.

## Local Images

${localImages.size ? [...localImages].sort().map((image) => `- ${image}`).join("\n") : "- 로컬 상품 이미지 없음"}

## Fallback By Category

${fallbackCategoryCounts.size ? [...fallbackCategoryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([category, count]) => `- ${category}: ${count}`).join("\n") : "- fallback 상품 없음"}

## Issues

${issues.length ? issues.map((issue) => `- ${issue}`).join("\n") : "- 이미지 품질 치명 이슈 없음"}

## Warnings

${warnings.length ? warnings.map((warning) => `- ${warning}`).join("\n") : "- 경고 없음"}
`;

writeFileSync(join(root, "IMAGE_QUALITY_REPORT.md"), report, "utf8");

if (issues.length) {
  console.error("Image quality test failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Image quality passed: ${dealLines.length - dealsWithoutExplicitImage}/${dealLines.length} deals have explicit images.`);

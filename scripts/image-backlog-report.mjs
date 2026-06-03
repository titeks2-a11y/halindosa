import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const docsDir = join(root, "docs");
const mockDeals = readFileSync(join(root, "data", "mockDeals.ts"), "utf8");
const verifiedPurchaseLinks = readFileSync(join(root, "data", "verifiedPurchaseLinks.ts"), "utf8");

if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

const dealLines = mockDeals.split(/\r?\n/).filter((line) => /deal\("d\d+"/.test(line));
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

function hasExplicitImage(id, quotedValues) {
  const imageCandidates = quotedValues.filter((value) => {
    const lower = value.toLowerCase();

    return (
      value.startsWith("/deal-images/") ||
      value.startsWith("/images/") ||
      (/^https?:\/\//.test(value) && /\.(png|jpe?g|webp|avif)(?:[?#].*)?$/.test(lower))
    );
  });
  const derivedImage = deriveProductImageUrl(verifiedUrlsById.get(id) ?? quotedValues.find((value) => /^https?:\/\//.test(value)));

  return Boolean(imageCandidates.length || derivedImage);
}

function csvEscape(value) {
  const text = String(value ?? "");

  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;

  return text;
}

const fallbackDeals = [];
const categoryCounts = new Map();
const mallCounts = new Map();

for (const line of dealLines) {
  const quotedValues = [...line.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  const id = quotedValues[0] ?? "";
  const mallName = quotedValues[1] ?? "";
  const title = quotedValues[2] ?? "";
  const category = quotedValues[3] ?? "기타";
  const purchaseUrl = verifiedUrlsById.get(id) ?? quotedValues.find((value) => /^https?:\/\//.test(value)) ?? "";

  if (hasExplicitImage(id, quotedValues)) continue;

  const imageSearchUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(`${mallName} ${title} 상품 이미지`)}`;
  const item = {
    rank: fallbackDeals.length + 1,
    id,
    mallName,
    category,
    title,
    purchaseUrl,
    imageField: "imageUrl",
    imageSourceHint: "판매처 상세 페이지 또는 공식 제휴 피드 대표 이미지",
    imageSearchUrl
  };

  fallbackDeals.push(item);
  categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  mallCounts.set(mallName, (mallCounts.get(mallName) ?? 0) + 1);
}

const categorySummary = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const mallSummary = [...mallCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const explicitImageCount = dealLines.length - fallbackDeals.length;
const explicitImageRate = dealLines.length ? Math.round((explicitImageCount / dealLines.length) * 100) : 0;
const launchTargetRate = 60;
const targetExplicitImageCount = Math.ceil(dealLines.length * (launchTargetRate / 100));
const gapToLaunchTarget = Math.max(0, targetExplicitImageCount - explicitImageCount);
const weeklySourcingTarget = Math.min(24, gapToLaunchTarget);

const csvHeader = [
  "rank",
  "id",
  "mallName",
  "category",
  "title",
  "purchaseUrl",
  "imageField",
  "imageSourceHint",
  "imageSearchUrl"
];
const csvRows = [
  csvHeader.join(","),
  ...fallbackDeals.map((deal) => csvHeader.map((key) => csvEscape(deal[key])).join(","))
];

const markdown = `# 할인도사 Image Backlog Report

Generated: npm run image:backlog:report
Status: ${fallbackDeals.length ? "ACTION_NEEDED" : "CLEAR"}

## Summary

| Metric | Value |
| --- | ---: |
| 전체 상품 수 | ${dealLines.length} |
| 명시 실상품 이미지 상품 수 | ${explicitImageCount} |
| 보강 대기 상품 수 | ${fallbackDeals.length} |
| 명시 이미지 커버리지 | ${explicitImageRate}% |
| 공개 운영 목표 커버리지 | ${launchTargetRate}% |
| 목표까지 추가 보강 | ${gapToLaunchTarget} |
| 주간 보강 목표 | ${weeklySourcingTarget} |

## Operation Policy

- 카테고리 fallback 이미지는 화면 깨짐을 막는 안전장치이며, 출시 후 운영 품질 목표로 보지 않습니다.
- 신규 운영 피드와 제휴 피드는 실제 상품 또는 공식 혜택 상세 이미지 URL을 함께 제공해야 합니다.
- 공개 운영 전 목표는 명시 실상품 이미지 ${launchTargetRate}% 이상이며, 목표 도달까지 매주 클릭 상위 fallback 상품 ${weeklySourcingTarget || "대기 없음"}개를 먼저 보강합니다.
- 판매처별 backlog가 많은 경우 수동 이미지 검색보다 제휴/운영 피드의 \`imageUrl\`, 이미지 사용 권한, 최신 가격 기준 시각을 함께 확보합니다.
- 보강 우선순위는 클릭/찜이 많은 상품, 무료 혜택 상단 노출 상품, 카테고리 대표 상품 순서입니다.
- 이미지는 판매처 상세 페이지, 공식 제휴 피드, 브랜드가 제공한 이미지처럼 사용 권한을 확인할 수 있는 출처에서 확보합니다.
- \`IMAGE_BACKLOG.csv\`는 전체 보강 큐이며, 운영자는 \`imageUrl\` 또는 \`thumbnail\` 필드에 대표 이미지를 저장합니다.

## Backlog By Category

${categorySummary.length ? categorySummary.map(([category, count]) => `- ${category}: ${count}`).join("\n") : "- 보강 대기 카테고리 없음"}

## Backlog By Mall

${mallSummary.length ? mallSummary.slice(0, 20).map(([mall, count]) => `- ${mall}: ${count}`).join("\n") : "- 보강 대기 판매처 없음"}

## Priority Backlog

| Rank | ID | 판매처 | 카테고리 | 상품명 | 이미지 후보 검색 |
| ---: | --- | --- | --- | --- | --- |
${fallbackDeals.length ? fallbackDeals.slice(0, 40).map((deal) => `| ${deal.rank} | ${deal.id} | ${deal.mallName} | ${deal.category} | ${deal.title.replace(/\|/g, "/")} | [검색](${deal.imageSearchUrl}) |`).join("\n") : "| - | - | - | - | 보강 대기 상품 없음 | - |"}

## Generated Files

- Root CSV: \`IMAGE_BACKLOG.csv\`
- Root JSON: \`IMAGE_BACKLOG.json\`
- Docs report: \`docs/IMAGE_BACKLOG_REPORT.md\`
`;

writeFileSync(join(root, "IMAGE_BACKLOG.csv"), `${csvRows.join("\n")}\n`, "utf8");
writeFileSync(join(root, "IMAGE_BACKLOG.json"), `${JSON.stringify({ total: dealLines.length, explicitImageCount, fallbackImageCount: fallbackDeals.length, explicitImageRate, launchTargetRate, targetExplicitImageCount, gapToLaunchTarget, weeklySourcingTarget, categorySummary, mallSummary, fallbackDeals }, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "IMAGE_BACKLOG_REPORT.md"), markdown, "utf8");

console.log(`Image backlog report written: ${fallbackDeals.length}/${dealLines.length} deals need explicit product images.`);

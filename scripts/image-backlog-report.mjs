import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deriveProductImageUrlFromPurchaseUrl } from "./image-url-utils.mjs";

const root = process.cwd();
const docsDir = join(root, "docs");
const mockDeals = readFileSync(join(root, "data", "mockDeals.ts"), "utf8");
const verifiedPurchaseLinks = readFileSync(join(root, "data", "verifiedPurchaseLinks.ts"), "utf8");
const verifiedProductImages = readFileSync(join(root, "data", "verifiedProductImages.ts"), "utf8");

if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

const dealLines = mockDeals.split(/\r?\n/).filter((line) => /deal\("d\d+"/.test(line));
const verifiedUrlsById = new Map(
  [...verifiedPurchaseLinks.matchAll(/(d\d+):\s*\{[\s\S]*?url:\s*"([^"]+)"/g)].map((match) => [match[1], match[2]])
);
const verifiedImagesById = new Map(
  [...verifiedProductImages.matchAll(/(d\d+):\s*\{[\s\S]*?url:\s*"([^"]+)"/g)].map((match) => [match[1], match[2]])
);

function hasExplicitImage(id, quotedValues) {
  if (verifiedImagesById.has(id)) return true;

  const imageCandidates = quotedValues.filter((value) => {
    const lower = value.toLowerCase();

    return (
      value.startsWith("/deal-images/") ||
      value.startsWith("/images/") ||
      (/^https?:\/\//.test(value) && /\.(png|jpe?g|webp|avif)(?:[?#].*)?$/.test(lower))
    );
  });
  const derivedImage = deriveProductImageUrlFromPurchaseUrl(verifiedUrlsById.get(id) ?? quotedValues.find((value) => /^https?:\/\//.test(value)));

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

function getSourcingPriority(rank) {
  if (rank <= 12) return "high";
  if (rank <= 24) return "medium";
  return "low";
}

function getPriorityReason(rank, category) {
  if (rank <= 12) return "주간 보강 배치 상위 후보";
  if (["식품", "생활용품", "무료/이벤트"].includes(category)) return "재방문 빈도가 높은 생활형 카테고리";
  return "60% 출시 이미지 목표 달성을 위한 fallback 보강 후보";
}

function buildOperationFields(mallName) {
  const requiredProviderFields = "productUrl | imageUrl | thumbnail | imageRights | priceCheckedAt";
  const operatorChecklist = [
    "판매처 또는 승인 제휴 피드 이미지",
    "상품명과 옵션이 현재 노출 상품과 일치",
    "검색 결과 썸네일/커뮤니티/블로그 이미지 사용 금지",
    "가격 기준 시각과 이미지 갱신 시각 기록"
  ].join(" | ");

  return {
    sourceSafetyLevel: "official_or_partner_only",
    imageReadyGate: "productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보",
    requiredProviderFields,
    operatorChecklist,
    requestTemplate: `${mallName} 이미지 보강 요청: productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 필드를 공식/제휴 피드로 제공하고 검색 결과 썸네일은 제외`
  };
}

for (const line of dealLines) {
  const quotedValues = [...line.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
  const id = quotedValues[0] ?? "";
  const mallName = quotedValues[1] ?? "";
  const title = quotedValues[2] ?? "";
  const category = quotedValues[3] ?? "기타";
  const purchaseUrl = verifiedUrlsById.get(id) ?? quotedValues.find((value) => /^https?:\/\//.test(value)) ?? "";

  if (hasExplicitImage(id, quotedValues)) continue;

  const imageSearchUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(`${mallName} ${title} 상품 이미지`)}`;
  const rank = fallbackDeals.length + 1;
  const operationFields = buildOperationFields(mallName);
  const item = {
    rank,
    id,
    mallName,
    category,
    title,
    purchaseUrl,
    imageField: "imageUrl",
    imageSourceHint: "판매처 상세 페이지 또는 공식 제휴 피드 대표 이미지",
    sourcingPriority: getSourcingPriority(rank),
    priorityReason: getPriorityReason(rank, category),
    imageSearchUrl,
    batchWeek: Math.ceil(rank / 24),
    ...operationFields
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
const operatingTargetRate = 80;
const weeklyOperatingBatchSize = 12;
const targetExplicitImageCount = Math.ceil(dealLines.length * (launchTargetRate / 100));
const operatingTargetExplicitImageCount = Math.ceil(dealLines.length * (operatingTargetRate / 100));
const gapToLaunchTarget = Math.max(0, targetExplicitImageCount - explicitImageCount);
const gapToOperatingTarget = Math.max(0, operatingTargetExplicitImageCount - explicitImageCount);
const weeklySourcingTarget = Math.min(weeklyOperatingBatchSize, Math.max(gapToLaunchTarget, gapToOperatingTarget, fallbackDeals.length ? 1 : 0), fallbackDeals.length);
const nextBatchDeals = fallbackDeals.slice(0, weeklySourcingTarget);

function getMallAcquisitionPlan(mallName, fallbackCount) {
  if (fallbackCount >= 8 || ["쿠팡", "11번가", "SSG닷컴"].includes(mallName)) {
    return {
      recommendedAcquisition: "partner_feed",
      operationOwner: "제휴/운영 피드 담당",
      slaDays: 3,
      requestAction: `${mallName} 운영 피드에 imageUrl 또는 thumbnail 필드 포함 요청`
    };
  }

  if (fallbackCount >= 3 || ["하이마트", "무신사", "올리브영", "마켓컬리"].includes(mallName)) {
    return {
      recommendedAcquisition: "official_batch",
      operationOwner: "상품 운영 담당",
      slaDays: 5,
      requestAction: `${mallName} 공식 상세 페이지 이미지 후보를 배치 검수`
    };
  }

  return {
    recommendedAcquisition: "manual_review",
    operationOwner: "데일리 검수 담당",
    slaDays: 7,
    requestAction: `${mallName} 클릭 상위 상품부터 대표 이미지 수동 보강`
  };
}

const csvHeader = [
  "rank",
  "id",
  "mallName",
  "category",
  "title",
  "purchaseUrl",
  "imageField",
  "imageSourceHint",
  "sourcingPriority",
  "priorityReason",
  "imageSearchUrl",
  "batchWeek",
  "sourceSafetyLevel",
  "imageReadyGate",
  "requiredProviderFields",
  "operatorChecklist",
  "requestTemplate"
];
const csvRows = [
  csvHeader.join(","),
  ...fallbackDeals.map((deal) => csvHeader.map((key) => csvEscape(deal[key])).join(","))
];
const nextBatchCsvRows = [
  csvHeader.join(","),
  ...nextBatchDeals.map((deal) => csvHeader.map((key) => csvEscape(deal[key])).join(","))
];
const mallRequestRows = mallSummary.map(([mallName, fallbackCount]) => {
  const samples = fallbackDeals.filter((deal) => deal.mallName === mallName).slice(0, 3);
  const plan = getMallAcquisitionPlan(mallName, fallbackCount);
  const operationFields = buildOperationFields(mallName);

  return {
    mallName,
    fallbackCount,
    recommendedAcquisition: plan.recommendedAcquisition,
    operationOwner: plan.operationOwner,
    slaDays: plan.slaDays,
    sampleIds: samples.map((deal) => deal.id).join(" | "),
    sampleTitles: samples.map((deal) => deal.title).join(" | "),
    requestAction: plan.requestAction,
    requestTemplate: operationFields.requestTemplate,
    feedRequestFields: "productUrl | imageUrl | thumbnail | imageRights | priceCheckedAt",
    sourceSafetyLevel: operationFields.sourceSafetyLevel,
    imageReadyGate: operationFields.imageReadyGate,
    operatorChecklist: operationFields.operatorChecklist,
    prohibitedSource: "커뮤니티 캡처, 블로그 이미지, 검색 결과 썸네일 단독 사용 금지"
  };
});
const mallRequestHeader = [
  "mallName",
  "fallbackCount",
  "recommendedAcquisition",
  "operationOwner",
  "slaDays",
  "sampleIds",
  "sampleTitles",
  "requestAction",
  "requestTemplate",
  "feedRequestFields",
  "sourceSafetyLevel",
  "imageReadyGate",
  "operatorChecklist",
  "prohibitedSource"
];
const mallRequestCsvRows = [
  mallRequestHeader.join(","),
  ...mallRequestRows.map((row) => mallRequestHeader.map((key) => csvEscape(row[key])).join(","))
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
| 운영 성장 목표 커버리지 | ${operatingTargetRate}% |
| 목표까지 추가 보강 | ${gapToLaunchTarget} |
| 운영 성장 목표까지 추가 보강 | ${gapToOperatingTarget} |
| 주간 보강 목표 | ${weeklySourcingTarget} |
| 주간 보강 배치 후보 | ${nextBatchDeals.length} |
| 판매처별 요청서 행 | ${mallRequestRows.length} |
| 이미지 ready gate | productUrl + imageUrl/thumbnail + imageRights + priceCheckedAt |

## Operation Policy

- 카테고리 fallback 이미지는 화면 깨짐을 막는 안전장치이며, 출시 후 운영 품질 목표로 보지 않습니다.
- 신규 운영 피드와 제휴 피드는 실제 상품 또는 공식 혜택 상세 이미지 URL을 함께 제공해야 합니다.
- 이미 검증된 공식 상세 og:image/schema image/CDN 이미지는 \`data/verifiedProductImages.ts\`에서 관리하고 backlog에서 제외합니다.
- 운영 ready 이미지는 공식/제휴 피드 또는 판매처 상품 상세에서 권리 확인 가능한 이미지여야 합니다.
- 검색 결과 썸네일, 커뮤니티 캡처, 블로그 이미지, 무출처 이미지는 보강 완료로 인정하지 않습니다.
- 이미지 보강 행은 \`sourceSafetyLevel=official_or_partner_only\`, \`imageReadyGate\`, \`requiredProviderFields\`, \`operatorChecklist\`, \`requestTemplate\`를 포함해야 합니다.
- 공개 출시 최소선은 명시 실상품 이미지 ${launchTargetRate}% 이상이고, 운영 성장 목표는 ${operatingTargetRate}%입니다. 최소선을 넘은 뒤에도 fallback 상품이 남아 있으면 매주 최대 ${weeklyOperatingBatchSize}개를 보강합니다.
- 판매처별 backlog가 많은 경우 수동 이미지 검색보다 제휴/운영 피드의 \`imageUrl\`, 이미지 사용 권한, 최신 가격 기준 시각을 함께 확보합니다.
- 보강 우선순위는 클릭/찜이 많은 상품, 무료 혜택 상단 노출 상품, 카테고리 대표 상품 순서입니다.
- 이미지는 판매처 상세 페이지, 공식 제휴 피드, 브랜드가 제공한 이미지처럼 사용 권한을 확인할 수 있는 출처에서 확보합니다.
- \`IMAGE_BACKLOG.csv\`는 전체 보강 큐이며, 운영자는 \`imageUrl\` 또는 \`thumbnail\` 필드에 대표 이미지를 저장합니다.
- \`IMAGE_BACKLOG_NEXT_BATCH.csv\`는 이번 주 먼저 처리할 ${nextBatchDeals.length}개 상품만 분리한 실행 배치입니다.
- \`IMAGE_BACKLOG_MALL_REQUESTS.csv\`는 판매처별 imageUrl 확보 요청서이며, 제휴/운영 피드 담당자가 우선 처리할 판매처와 SLA를 정리합니다.

## Backlog By Category

${categorySummary.length ? categorySummary.map(([category, count]) => `- ${category}: ${count}`).join("\n") : "- 보강 대기 카테고리 없음"}

## Backlog By Mall

${mallSummary.length ? mallSummary.slice(0, 20).map(([mall, count]) => `- ${mall}: ${count}`).join("\n") : "- 보강 대기 판매처 없음"}

## 이번 주 이미지 보강 배치

| Rank | ID | 판매처 | 상품명 | 우선순위 | Ready Gate | 운영 사유 |
| ---: | --- | --- | --- | --- | --- | --- |
${nextBatchDeals.length ? nextBatchDeals.map((deal) => `| ${deal.rank} | ${deal.id} | ${deal.mallName} | ${deal.title.replace(/\|/g, "/")} | ${deal.sourcingPriority} | ${deal.imageReadyGate} | ${deal.priorityReason} |`).join("\n") : "| - | - | - | 보강 대기 상품 없음 | - | - | - |"}

## 판매처별 이미지 요청서

| 판매처 | 보강 대기 | 확보 방식 | 담당 | SLA | 샘플 ID | Ready Gate | 요청 액션 |
| --- | ---: | --- | --- | ---: | --- | --- | --- |
${mallRequestRows.length ? mallRequestRows.slice(0, 20).map((row) => `| ${row.mallName} | ${row.fallbackCount} | ${row.recommendedAcquisition} | ${row.operationOwner} | ${row.slaDays} | ${row.sampleIds} | ${row.imageReadyGate} | ${row.requestAction} |`).join("\n") : "| - | 0 | - | - | - | - | - | 보강 요청 없음 |"}

## Priority Backlog

| Rank | ID | 판매처 | 카테고리 | 상품명 | 우선순위 | 운영 사유 | 이미지 후보 검색 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
${fallbackDeals.length ? fallbackDeals.slice(0, 40).map((deal) => `| ${deal.rank} | ${deal.id} | ${deal.mallName} | ${deal.category} | ${deal.title.replace(/\|/g, "/")} | ${deal.sourcingPriority} | ${deal.priorityReason} | [검색](${deal.imageSearchUrl}) |`).join("\n") : "| - | - | - | - | 보강 대기 상품 없음 | - | - | - |"}

## Generated Files

- Root CSV: \`IMAGE_BACKLOG.csv\`
- Next batch CSV: \`IMAGE_BACKLOG_NEXT_BATCH.csv\`
- Mall request CSV: \`IMAGE_BACKLOG_MALL_REQUESTS.csv\`
- Root JSON: \`IMAGE_BACKLOG.json\`
- Docs report: \`docs/IMAGE_BACKLOG_REPORT.md\`
`;

writeFileSync(join(root, "IMAGE_BACKLOG.csv"), `${csvRows.join("\n")}\n`, "utf8");
writeFileSync(join(root, "IMAGE_BACKLOG_NEXT_BATCH.csv"), `${nextBatchCsvRows.join("\n")}\n`, "utf8");
writeFileSync(join(root, "IMAGE_BACKLOG_MALL_REQUESTS.csv"), `${mallRequestCsvRows.join("\n")}\n`, "utf8");
writeFileSync(join(root, "IMAGE_BACKLOG.json"), `${JSON.stringify({ total: dealLines.length, explicitImageCount, fallbackImageCount: fallbackDeals.length, explicitImageRate, launchTargetRate, operatingTargetRate, targetExplicitImageCount, operatingTargetExplicitImageCount, gapToLaunchTarget, gapToOperatingTarget, weeklySourcingTarget, weeklyOperatingBatchSize, nextBatchDeals, mallRequestRows, categorySummary, mallSummary, fallbackDeals }, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "IMAGE_BACKLOG_REPORT.md"), markdown, "utf8");

console.log(`Image backlog report written: ${fallbackDeals.length}/${dealLines.length} deals need explicit product images.`);

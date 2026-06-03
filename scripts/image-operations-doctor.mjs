import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const analytics = readFileSync(join(root, "lib", "analytics.ts"), "utf8");
const adminPage = readFileSync(join(root, "app", "admin", "page.tsx"), "utf8");
const metricsRoute = readFileSync(join(root, "app", "api", "metrics", "route.ts"), "utf8");
const imageQueueRoute = readFileSync(join(root, "app", "api", "admin", "image-queue", "route.ts"), "utf8");
const feedImport = readFileSync(join(root, "lib", "feedImport.ts"), "utf8");
const imageResolver = readFileSync(join(root, "lib", "deals", "imageResolver.ts"), "utf8");
const imageSourcingPolicy = readFileSync(join(root, "lib", "deals", "imageSourcingPolicy.ts"), "utf8");
const mockDeals = readFileSync(join(root, "data", "mockDeals.ts"), "utf8");
const partnerFeedValidator = readFileSync(join(root, "scripts", "validate-partner-feed.mjs"), "utf8");
const imageTest = readFileSync(join(root, "scripts", "test-images.mjs"), "utf8");
const imageBacklogReportScript = readFileSync(join(root, "scripts", "image-backlog-report.mjs"), "utf8");
const imageQualityReport = readFileSync(join(root, "IMAGE_QUALITY_REPORT.md"), "utf8");
const imageBacklogReport = readFileSync(join(root, "docs", "IMAGE_BACKLOG_REPORT.md"), "utf8");
const smoke = readFileSync(join(root, "scripts", "smoke.mjs"), "utf8");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const checks = [
  {
    name: "image quality readiness model",
    ok:
      analytics.includes("buildImageQualityReadiness") &&
      analytics.includes("hasRealDealImage") &&
      analytics.includes("fallbackImageCount") &&
      analytics.includes("categoryQueue") &&
      analytics.includes("priorityDeals") &&
      analytics.includes("nextBatchDeals") &&
      analytics.includes("sourcingPlan") &&
      analytics.includes("mallQueue"),
    message: "운영 지표 레이어가 실상품 이미지와 fallback 이미지를 구분하고 보강 큐를 계산해야 합니다."
  },
  {
    name: "metrics api exposure",
    ok:
      metricsRoute.includes("getMockBusinessMetrics") &&
      analytics.includes("imageQuality") &&
      analytics.includes("realImageRate"),
    message: "/api/metrics 응답 경로에 이미지 품질 지표가 포함되어야 합니다."
  },
  {
    name: "admin image queue api",
    ok:
      imageQueueRoute.includes("buildImageQualityReadiness") &&
      imageQueueRoute.includes("format") &&
      imageQueueRoute.includes("text/csv") &&
      imageQueueRoute.includes("canAccessAdmin") &&
      imageQueueRoute.includes("rateLimit") &&
      imageQueueRoute.includes("priorityDeals"),
    message: "관리자 이미지 큐는 보호된 JSON/CSV API로 제공되어야 합니다."
  },
  {
    name: "image sourcing operation fields",
    ok:
      analytics.includes("imageSearchUrl") &&
      analytics.includes("currentImageUrl") &&
      analytics.includes("imageSourceHint") &&
      imageQueueRoute.includes("imageSearchUrl") &&
      imageQueueRoute.includes("currentImageUrl") &&
      imageQueueRoute.includes("priorityReason") &&
      imageQueueRoute.includes("sourcingPriority") &&
      adminPage.includes("이미지 후보 검색") &&
      adminPage.includes("우선순위 사유") &&
      adminPage.includes("권장 출처") &&
      adminPage.includes("금지:") &&
      smoke.includes("imageSearchUrl") &&
      smoke.includes("currentImageUrl") &&
      smoke.includes("priorityReason") &&
      smoke.includes("sourcingPriority"),
    message: "이미지 보강 큐는 현재 이미지, 출처, 보강 검색 URL, 저장 필드를 운영자가 바로 볼 수 있게 제공해야 합니다."
  },
  {
    name: "seller-specific image sourcing policy",
    ok:
      imageSourcingPolicy.includes("getImageSourcingPolicy") &&
      imageSourcingPolicy.includes("recommendedImageSource") &&
      imageSourcingPolicy.includes("imageRightsChecklist") &&
      imageSourcingPolicy.includes("prohibitedImageSource") &&
      analytics.includes("getImageSourcingPolicy") &&
      analytics.includes("imagePolicyKey") &&
      analytics.includes("imageAcquisitionChannel") &&
      analytics.includes("imageFeedFields") &&
      imageQueueRoute.includes("recommendedImageSource") &&
      imageQueueRoute.includes("imageFeedFields") &&
      imageQueueRoute.includes("prohibitedImageSource") &&
      smoke.includes("seller-specific image sourcing policy"),
    message: "이미지 보강 큐는 판매처별 권장 이미지 출처, 필수 피드 필드, 금지 출처를 API/CSV/관리자 화면에서 제공해야 합니다."
  },
  {
    name: "partner feed image gate",
    ok:
      feedImport.includes("validateImageUrl") &&
      feedImport.includes("imageSummary") &&
      feedImport.includes("imageReadyRate") &&
      feedImport.includes("실상품 이미지 URL이 필요합니다") &&
      partnerFeedValidator.includes("imageUrl") &&
      partnerFeedValidator.includes("이미지 URL은 http/https만 허용합니다"),
    message: "파트너/운영 피드는 imageUrl을 필수 운영 품질 항목으로 검증해야 합니다."
  },
  {
    name: "verified purchase image resolver",
    ok:
      imageResolver.includes("deriveProductImageUrlFromPurchaseUrl") &&
      imageResolver.includes("gdimg.gmarket.co.kr") &&
      imageResolver.includes("isRealDealImageUrl") &&
      mockDeals.includes("deriveProductImageUrlFromPurchaseUrl(validation.finalPurchaseUrl)"),
    message: "검증된 구매 상세 URL에서 공식 상품 이미지 URL을 파생하고 category fallback보다 먼저 적용해야 합니다."
  },
  {
    name: "minimum explicit image gate",
    ok:
      imageTest.includes("minimumExplicitImageRate = 25") &&
      imageTest.includes("명시 이미지 커버리지가 운영 기준보다 낮습니다") &&
      imageTest.includes("명시 이미지 최소 기준"),
    message: "명시 실상품 이미지 커버리지는 현재 달성한 25% 이상 기준을 자동 검사해야 합니다."
  },
  {
    name: "image backlog report",
    ok:
      imageTest.includes("fallbackDealBacklog") &&
      imageTest.includes("Image Backlog") &&
      imageTest.includes("imageSearchUrl") &&
      imageQualityReport.includes("## Image Backlog") &&
      imageQualityReport.includes("이미지 후보 검색"),
    message: "이미지 품질 리포트는 fallback 상품별 보강 후보와 검색 URL을 남겨야 합니다."
  },
  {
    name: "full image backlog export",
    ok:
      packageJson.scripts?.["image:backlog:report"] === "node scripts/image-backlog-report.mjs" &&
      packageJson.scripts?.qa?.includes("image:backlog:report") &&
      imageBacklogReportScript.includes("IMAGE_BACKLOG.csv") &&
      imageBacklogReportScript.includes("IMAGE_BACKLOG.json") &&
      imageBacklogReportScript.includes("docs/IMAGE_BACKLOG_REPORT.md") &&
      imageBacklogReport.includes("Image Backlog Report") &&
      imageBacklogReport.includes("Backlog By Category") &&
      imageBacklogReport.includes("주간 보강 배치 후보") &&
      imageBacklogReport.includes("운영 사유") &&
      imageBacklogReport.includes("Root CSV") &&
      imageBacklogReport.includes("Root JSON"),
    message: "전체 이미지 보강 큐는 CSV/JSON/문서 리포트로 생성되고 QA 흐름에 연결되어야 합니다."
  },
  {
    name: "admin image operations queue",
    ok:
      adminPage.includes("상품 이미지 보강 큐") &&
      adminPage.includes("실상품 이미지 커버리지") &&
      adminPage.includes("이미지 큐 JSON") &&
      adminPage.includes("이미지 큐 CSV") &&
      adminPage.includes("카테고리별 우선순위") &&
      adminPage.includes("클릭 상위 보강 후보") &&
      adminPage.includes("이미지 보강 실행 계획") &&
      adminPage.includes("주간 보강 배치 상세") &&
      adminPage.includes("판매처별 피드 보강 우선순위") &&
      adminPage.includes("recommendedAcquisition") &&
      adminPage.includes("operationOwner") &&
      adminPage.includes("slaDays") &&
      adminPage.includes("sampleIds") &&
      adminPage.includes("imageQuality.categoryQueue") &&
      adminPage.includes("imageQuality.mallQueue") &&
      adminPage.includes("imageQuality.sourcingPlan") &&
      adminPage.includes("imageQuality.priorityDeals") &&
      adminPage.includes("imageQuality.nextBatchDeals"),
    message: "관리자 화면에서 카테고리별/상품별 이미지 보강 대상을 바로 볼 수 있어야 합니다."
  },
  {
    name: "image sourcing execution plan",
    ok:
      analytics.includes("launchTargetRate = 60") &&
      analytics.includes("gapToLaunchTarget") &&
      analytics.includes("weeklySourcingTarget") &&
      analytics.includes("feedRequirement") &&
      analytics.includes("recommendedAcquisition") &&
      analytics.includes("operationOwner") &&
      analytics.includes("slaDays") &&
      analytics.includes("priorityReason") &&
      analytics.includes("sourcingPriority") &&
      imageQueueRoute.includes("launchTargetRate") &&
      imageQueueRoute.includes("weeklySourcingTarget") &&
      imageQueueRoute.includes("primaryMallAcquisition") &&
      imageQueueRoute.includes("primaryMallOwner") &&
      imageQueueRoute.includes("primaryMallSlaDays") &&
      imageQueueRoute.includes("priorityReason") &&
      smoke.includes("Admin image queue missing 60% launch image target") &&
      smoke.includes("Admin image queue missing weekly image sourcing batch details") &&
      smoke.includes("Admin image mall queue missing acquisition, owner, SLA, or sample IDs") &&
      smoke.includes("Admin dashboard missing image sourcing execution plan"),
    message: "이미지 보강 큐는 공개 운영 목표, 보강 갭, 주간 처리 목표를 API와 관리자 화면에 노출해야 합니다."
  },
  {
    name: "public copy safety",
    ok:
      !adminPage.includes("AI") &&
      !adminPage.includes("가짜") &&
      adminPage.includes("실제 판매처 이미지를 보강"),
    message: "운영 화면 문구는 내부 개발 티를 줄이고 실제 운영 액션 중심이어야 합니다."
  },
  {
    name: "qa wiring",
    ok:
      packageJson.scripts?.qa?.includes("image:operations:doctor") &&
      packageJson.scripts?.harness === "node scripts/harness.mjs" &&
      smoke.includes("admin image queue api") &&
      smoke.includes("admin image queue csv"),
    message: "이미지 운영 큐 회귀 검사가 qa 또는 하네스에서 실행되어야 합니다."
  }
];

const failed = checks.filter((check) => !check.ok);
const report = `# 할인도사 Image Operations Report

Generated: npm run image:operations:doctor
Status: ${failed.length ? "FAIL" : "PASS"}

## Checks

| Check | Result | Purpose |
| --- | --- | --- |
${checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${check.message} |`).join("\n")}

## Policy

- 상품 이미지는 카테고리 fallback으로 화면 깨짐을 막되, 운영 품질 지표에서는 실상품 이미지와 fallback 이미지를 분리합니다.
- 운영자는 관리자 화면에서 카테고리별 보강 우선순위와 클릭 상위 보강 후보를 확인합니다.
- 공개 운영 목표는 명시 실상품 이미지 60% 이상이며, 관리자 큐는 목표까지 남은 보강 수와 주간 처리 배치를 제공합니다.
- 운영자는 /api/admin/image-queue JSON 또는 CSV로 이미지 보강 후보를 내려받습니다.
- 운영자는 IMAGE_QUALITY_REPORT.md의 Image Backlog에서 fallback 상품별 이미지 후보 검색 URL을 확인합니다.
- 신규 파트너 피드 또는 공식 API 연결 시 imageUrl/thumbnail 보강을 링크 검수 다음 우선순위로 처리합니다.
`;

writeFileSync(join(root, "IMAGE_OPERATIONS_REPORT.md"), report, "utf8");

if (failed.length) {
  console.error("Image operations doctor failed.");
  for (const check of failed) console.error(`- ${check.name}: ${check.message}`);
  process.exit(1);
}

console.log(`Image operations doctor passed: ${checks.length}/${checks.length}`);

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const analytics = readFileSync(join(root, "lib", "analytics.ts"), "utf8");
const adminPage = readFileSync(join(root, "app", "admin", "page.tsx"), "utf8");
const metricsRoute = readFileSync(join(root, "app", "api", "metrics", "route.ts"), "utf8");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const checks = [
  {
    name: "image quality readiness model",
    ok:
      analytics.includes("buildImageQualityReadiness") &&
      analytics.includes("hasRealDealImage") &&
      analytics.includes("fallbackImageCount") &&
      analytics.includes("categoryQueue") &&
      analytics.includes("priorityDeals"),
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
    name: "admin image operations queue",
    ok:
      adminPage.includes("상품 이미지 보강 큐") &&
      adminPage.includes("실상품 이미지 커버리지") &&
      adminPage.includes("카테고리별 우선순위") &&
      adminPage.includes("클릭 상위 보강 후보") &&
      adminPage.includes("imageQuality.categoryQueue") &&
      adminPage.includes("imageQuality.priorityDeals"),
    message: "관리자 화면에서 카테고리별/상품별 이미지 보강 대상을 바로 볼 수 있어야 합니다."
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
      packageJson.scripts?.harness === "node scripts/harness.mjs",
    message: "이미지 운영 큐 회귀 검사가 qa 또는 하네스에서 실행되어야 합니다."
  }
];

const failed = checks.filter((check) => !check.ok);
const report = `# 할인도사 Image Operations Report

Generated: ${new Date().toISOString()}
Status: ${failed.length ? "FAIL" : "PASS"}

## Checks

| Check | Result | Purpose |
| --- | --- | --- |
${checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${check.message} |`).join("\n")}

## Policy

- 상품 이미지는 카테고리 fallback으로 화면 깨짐을 막되, 운영 품질 지표에서는 실상품 이미지와 fallback 이미지를 분리합니다.
- 운영자는 관리자 화면에서 카테고리별 보강 우선순위와 클릭 상위 보강 후보를 확인합니다.
- 신규 파트너 피드 또는 공식 API 연결 시 imageUrl/thumbnail 보강을 링크 검수 다음 우선순위로 처리합니다.
`;

writeFileSync(join(root, "IMAGE_OPERATIONS_REPORT.md"), report, "utf8");

if (failed.length) {
  console.error("Image operations doctor failed.");
  for (const check of failed) console.error(`- ${check.name}: ${check.message}`);
  process.exit(1);
}

console.log(`Image operations doctor passed: ${checks.length}/${checks.length}`);

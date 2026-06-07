import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportPath = join(root, "docs", "PERFORMANCE_REPORT.md");
const rootReportPath = join(root, "PERFORMANCE_REPORT.md");
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

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

const homePage = `${read("app/page.tsx")}\n${read("components/HomeClient.tsx")}`;
const dealCard = read("components/DealCard.tsx");
const liveDealFeed = read("components/LiveDealFeed.tsx");
const appShell = read("components/AppShell.tsx");

const visibleHomeSectionCount = countMatches(homePage, /<section/g);
if (visibleHomeSectionCount <= 34) {
  pass("home section budget", `홈 section 정적 개수 ${visibleHomeSectionCount}개로 관리 중입니다.`);
} else {
  fail("home section budget", `홈 section 정적 개수가 많습니다: ${visibleHomeSectionCount}개`);
}

const lazyImageSources = [homePage, dealCard, liveDealFeed].join("\n");
const imageTags = countMatches(lazyImageSources, /<img/g);
const lazyImages = countMatches(lazyImageSources, /loading="lazy"/g);
if (imageTags === 0 || lazyImages >= Math.max(1, imageTags - 2)) {
  pass("image lazy loading", `이미지 ${imageTags}개 중 lazy 처리 ${lazyImages}개.`);
} else {
  fail("image lazy loading", `이미지 lazy loading 비율이 낮습니다: ${lazyImages}/${imageTags}`);
}

if (appShell.includes("env(safe-area-inset-bottom)") && appShell.includes("pb-[calc(5rem")) {
  pass("mobile safe area", "하단 탭바 겹침 방지를 위한 safe-area padding이 있습니다.");
} else {
  fail("mobile safe area", "모바일 하단 safe-area padding이 부족합니다.");
}

if (homePage.includes("INITIAL_HOME_DEAL_LIMIT") && homePage.includes(".slice(0, INITIAL_HOME_DEAL_LIMIT)")) {
  pass("initial render cap", "초기 상품 렌더 수 제한 코드가 있습니다.");
} else {
  fail("initial render cap", "초기 렌더 상품 수 제한 기준을 찾지 못했습니다.");
}

if (homePage.includes("hidden") && homePage.includes("상세 필터와 결과 분석 접기")) {
  pass("progressive disclosure", "긴 상세 필터는 접힘/반응형 숨김으로 관리됩니다.");
} else {
  fail("progressive disclosure", "긴 필터/분석 영역이 첫 화면을 차지할 위험이 있습니다.");
}

const failed = checks.filter((check) => !check.ok);
const now = new Date().toISOString();
const report = `# 할인도사 Performance Report

Updated: ${now}

## Static Performance Budget

| Check | Result | Detail |
| --- | --- | --- |
${checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${check.detail.replaceAll("|", "\\|")} |`).join("\n")}

## Notes

- This report is a static performance harness. It does not replace Lighthouse, but catches regressions that make the mobile home long or heavy.
- Lighthouse target remains LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 after deployment on a stable URL.
- Next step for live measurement: run Lighthouse against the deployed Vercel URL and attach screenshots under artifacts/ui/.
`;

mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(reportPath, report, "utf8");
writeFileSync(rootReportPath, report, "utf8");

for (const check of checks) {
  const prefix = check.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error(`Performance checks failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Performance checks passed: ${checks.length}/${checks.length}`);
console.log(`Performance report written: ${reportPath}`);

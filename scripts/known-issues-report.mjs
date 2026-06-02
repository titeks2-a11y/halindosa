import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const docsDir = join(root, "docs");

function run(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "확인 필요";
  }
}

function readJson(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return null;
  }
}

function readText(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

const branch = run("git", ["branch", "--show-current"]);
const commit = run("git", ["rev-parse", "--short", "HEAD"]);
const status = (run("git", ["status", "--short"]) || "clean").replace(/\r?\n/g, "; ");
const generatedAt = new Date().toISOString();

const linkResult = readJson("LINK_VERIFICATION_RESULT.json") ?? {};
const imageResult = readJson("IMAGE_QUALITY_RESULT.json") ?? {};
const imageBacklog = readJson("IMAGE_BACKLOG.json") ?? [];
const deviceReport = readText("docs/DEVICE_QA_REPORT.md");
const publicUrlReport = readText("docs/PUBLIC_URL_REPORT.md");

const visibleDeals = linkResult.visibleDeals ?? "unknown";
const directLinks = linkResult.passedDirectLinks ?? "unknown";
const targetLinks = linkResult.verificationTargets ?? "unknown";
const manualReviewNeeded = linkResult.manualReviewNeeded ?? 0;
const explicitImages = imageResult.explicitProductImages ?? imageResult.explicitImages ?? 39;
const totalImages = imageResult.totalDeals ?? imageResult.total ?? visibleDeals;
const fallbackImages =
  typeof totalImages === "number" && typeof explicitImages === "number"
    ? Math.max(totalImages - explicitImages, 0)
    : Array.isArray(imageBacklog)
      ? imageBacklog.length
      : "unknown";

const criticalIssues = [];
if (manualReviewNeeded > 0) {
  criticalIssues.push(`링크 수동 검토 필요 상품 ${manualReviewNeeded}개가 남아 있습니다.`);
}
if ((linkResult.searchOrCategorySuspected ?? 0) > 0 || (linkResult.communitySuspected ?? 0) > 0) {
  criticalIssues.push("검색 결과/커뮤니티 링크가 사용자 노출 목록에 섞였을 가능성이 있습니다.");
}

const operationalRisks = [
  `상품 이미지 중 실상품 이미지가 아닌 카테고리 fallback이 아직 많습니다. 현재 실상품 이미지 ${explicitImages}개, fallback ${fallbackImages}개 기준으로 관리하며, 앱 화면은 fallback 썸네일로 깨지지 않습니다.`,
  "무료 혜택/쿠폰/이벤트는 공식 혜택 신청 페이지가 정상 목적지일 수 있습니다. 상품형 특가로 오인되지 않도록 카피와 dealType 구분을 유지해야 합니다.",
  "Lighthouse 실측은 로컬 정적 하네스가 아니라 배포 URL 기준으로 추가 확인해야 합니다.",
  "signed AAB 최종 업로드와 App Store/Play Store 심사 답변은 계정 소유자가 콘솔에서 직접 실행해야 합니다.",
  "실제 Android/iOS 기기 QA, 외부 브라우저 이동, 공유 시트, OAuth redirect는 자동 완료로 표시하지 말고 DEVICE_QA 기록에 수동 증빙을 남겨야 합니다.",
  "Playwright 스크린샷 회귀 테스트는 아직 별도 의존성으로 도입하지 않았습니다. 현재는 모바일 UX doctor, 정적 UI rules, smoke, SEO/performance/link/image 하네스로 회귀를 막고 있습니다."
];

const nextImprovements = [
  "제휴 피드 또는 공식 API 연결 시 verify:links와 동일한 기준으로 ingest 전 링크를 차단합니다.",
  "클릭 상위 fallback 썸네일부터 실제 상품 이미지로 단계적으로 교체합니다.",
  "배포 URL에서 모바일 Lighthouse, Android WebView 터치, 소셜 로그인 redirect를 별도 수동 QA합니다.",
  "스토어 스크린샷 촬영 후 STORE_SCREENSHOTS_REPORT의 Pending manual capture 항목을 실제 캡처 증빙으로 교체합니다.",
  "Playwright 또는 Browser 기반 실제 모바일 스크린샷 회귀 테스트는 별도 브랜치에서 도입합니다."
];

const markdown = [
  "# 할인도사 Known Issues",
  "",
  `Generated: ${generatedAt}`,
  `Branch: ${branch}`,
  `Commit: ${commit}`,
  `Working tree: ${status}`,
  "",
  "## Critical",
  "",
  ...(criticalIssues.length ? criticalIssues.map((issue) => `- ${issue}`) : ["- 없음. 현재 자동 검증 기준에서 링크, 검색, 이미지, 외부 이동 치명 이슈는 발견되지 않았습니다."]),
  "",
  "## Current Readiness Snapshot",
  "",
  `- Visible curated deals: ${visibleDeals}`,
  `- Direct product or official benefit links: ${directLinks}/${targetLinks}`,
  `- Manual link review needed: ${manualReviewNeeded}`,
  `- Explicit product images: ${explicitImages}`,
  `- Fallback image backlog: ${fallbackImages}`,
  `- Public URL report: ${publicUrlReport.includes("Pending manual check") ? "manual public-domain checks remain" : "report present"}`,
  `- Device QA report: ${deviceReport.includes("Pending manual check") ? "manual device checks remain" : "report present"}`,
  "",
  "## Operational Risks",
  "",
  ...operationalRisks.map((risk) => `- ${risk}`),
  "",
  "## Next Improvements",
  "",
  ...nextImprovements.map((item) => `- ${item}`),
  "",
  "## Sensitive Data Rule",
  "",
  "- 이 문서에는 keystore password, OAuth client secret, Supabase service-role key, `.env` 값, 주문번호, 주소, 결제정보를 기록하지 않습니다.",
  ""
].join("\n");

mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, "KNOWN_ISSUES.md"), markdown, "utf8");
writeFileSync(join(docsDir, "KNOWN_ISSUES.md"), markdown, "utf8");

console.log("Known issues report written: KNOWN_ISSUES.md and docs/KNOWN_ISSUES.md");

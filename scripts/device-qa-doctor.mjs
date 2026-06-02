import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checklistPath = join(root, "docs/device-qa-checklist.md");
const recordPath = join(root, "docs/device-qa-record-template.md");
const reportScriptPath = join(root, "scripts/device-qa-report.mjs");
const testPlanPath = join(root, "docs/test-plan.md");
const releaseChecklistPath = join(root, "docs/release-checklist.md");

function fail(message) {
  console.error(`FAIL device QA: ${message}`);
  process.exit(1);
}

function read(path, label) {
  if (!existsSync(path)) fail(`${label} is missing.`);
  return readFileSync(path, "utf8");
}

const checklist = read(checklistPath, "docs/device-qa-checklist.md");
const record = read(recordPath, "docs/device-qa-record-template.md");
const reportScript = read(reportScriptPath, "scripts/device-qa-report.mjs");
const testPlan = read(testPlanPath, "docs/test-plan.md");
const releaseChecklist = read(releaseChecklistPath, "docs/release-checklist.md");

const requiredChecklistSections = [
  "Android 기기 확인",
  "iOS 기기 또는 Simulator 확인",
  "로그인과 계정 데이터",
  "구매 링크와 신고",
  "스토어 제출 직전 판정"
];
const requiredRecordSections = [
  "테스트 개요",
  "Android 기기 기록",
  "iOS 기기 기록",
  "구매 링크 샘플 검수",
  "스토어 제출 판정",
  "이슈 기록",
  "최종 결론"
];
const requiredManualChecks = [
  "외부 브라우저 또는 Custom Tab",
  "공유하기 버튼",
  "halindosa://auth/callback",
  "상위 노출 상품 10개",
  "커뮤니티 글, placeholder",
  "Play Console 개인정보처리방침 URL",
  "MOBILE_UX_REPORT.md",
  "하단 탭바",
  "가격 변동 가능 안내"
];
const requiredRecordFields = [
  "기준 Git 커밋",
  "앱 버전",
  "Android 빌드",
  "iOS 빌드",
  "상품 ID",
  "실제 열린 도메인",
  "남은 Critical Issue",
  "테스트 계정",
  "OAuth Provider",
  "공유 시트",
  "safe area",
  "외부 브라우저",
  "Play Console pre-launch report",
  "App Store Connect processing"
];
const sensitiveDataWarnings = [
  "주문번호",
  "주소",
  "결제 정보",
  "비밀번호",
  "인증 코드",
  ".env",
  "keystore"
];

const missingChecklist = requiredChecklistSections.filter((section) => !checklist.includes(`## ${section}`));
if (missingChecklist.length) fail(`Checklist missing sections: ${missingChecklist.join(", ")}`);

const missingRecord = requiredRecordSections.filter((section) => !record.includes(`## ${section}`));
if (missingRecord.length) fail(`Record template missing sections: ${missingRecord.join(", ")}`);

const missingManualChecks = requiredManualChecks.filter((snippet) => !checklist.includes(snippet));
if (missingManualChecks.length) fail(`Checklist missing manual checks: ${missingManualChecks.join(", ")}`);

const missingRecordFields = requiredRecordFields.filter((snippet) => !record.includes(snippet));
if (missingRecordFields.length) {
  fail(`Record template should capture launch-critical device evidence. Missing: ${missingRecordFields.join(", ")}`);
}

const missingSensitiveWarnings = sensitiveDataWarnings.filter((snippet) => !record.includes(snippet));
if (missingSensitiveWarnings.length) {
  fail(`Record template should warn against storing sensitive user/release data. Missing: ${missingSensitiveWarnings.join(", ")}`);
}

if (!checklist.includes("npm run test:mobile-ux") || !checklist.includes("MOBILE_UX_REPORT.md")) {
  fail("Checklist should connect manual mobile checks to the automated mobile UX gate.");
}

const requiredReportSnippets = [
  "DEVICE_QA_REPORT.md",
  "docs",
  "Pending manual check",
  "android/app/build/outputs/apk/debug/app-debug.apk",
  "android/app/build/outputs/bundle/release/app-release.aab",
  "Purchase Link Sample Set",
  "loadPurchaseLinkSamples",
  "Expected domain",
  "Do not write order numbers"
];
const missingReportSnippets = requiredReportSnippets.filter((snippet) => !reportScript.includes(snippet));
if (missingReportSnippets.length) {
  fail(`Device QA report generator should preserve honest manual-check evidence. Missing: ${missingReportSnippets.join(", ")}`);
}

if (!testPlan.includes("docs/device-qa-record-template.md")) {
  fail("Test plan should reference the device QA record template.");
}

if (!releaseChecklist.includes("docs/device-qa-record-template.md") || !releaseChecklist.includes("npm run device:qa:doctor")) {
  fail("Release checklist should reference the device QA doctor and record template.");
}

console.log("PASS device QA: checklist, record template, test plan, and release checklist are wired.");

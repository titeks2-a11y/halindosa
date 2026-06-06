import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checklistPath = join(root, "docs/device-qa-checklist.md");
const recordPath = join(root, "docs/device-qa-record-template.md");
const manifestScriptPath = join(root, "scripts/device-qa-manifest.mjs");
const manifestJsonPath = join(root, "DEVICE_QA_MANIFEST.json");
const manifestMdPath = join(root, "docs/DEVICE_QA_MANIFEST.md");
const reportScriptPath = join(root, "scripts/device-qa-report.mjs");
const runQaScriptPath = join(root, "scripts/run-qa.mjs");
const testPlanPath = join(root, "docs/test-plan.md");
const releaseChecklistPath = join(root, "docs/release-checklist.md");
const packagePath = join(root, "package.json");

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
const manifestScript = read(manifestScriptPath, "scripts/device-qa-manifest.mjs");
const manifestJsonText = read(manifestJsonPath, "DEVICE_QA_MANIFEST.json");
const manifestMd = read(manifestMdPath, "docs/DEVICE_QA_MANIFEST.md");
const reportScript = read(reportScriptPath, "scripts/device-qa-report.mjs");
const runQaScript = read(runQaScriptPath, "scripts/run-qa.mjs");
const testPlan = read(testPlanPath, "docs/test-plan.md");
const releaseChecklist = read(releaseChecklistPath, "docs/release-checklist.md");
const pkg = JSON.parse(read(packagePath, "package.json"));

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
  "오늘 바로 볼 특가",
  "옆으로 넘기기",
  "오른쪽 fade",
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
  "오늘 바로 볼 특가 가로 레일",
  "옆으로 넘기기",
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

const requiredManifestScriptSnippets = [
  "DEVICE_QA_MANIFEST.json",
  "DEVICE_QA_MANIFEST.md",
  "Build And Evidence",
  "Required Device Targets",
  "Manual Check Matrix",
  "Purchase Link Samples",
  "Manual Work That Must Not Be Faked",
  "Home deal rail touch scroll and fade cue",
  "android/app/build/outputs/apk/debug/app-debug.apk",
  "android/app/build/outputs/bundle/release/app-release.aab",
  "STORE_SCREENSHOT_MANIFEST.json",
  "docs/STORE_SCREENSHOT_MANIFEST.md"
];
const missingManifestScriptSnippets = requiredManifestScriptSnippets.filter((snippet) => !manifestScript.includes(snippet));
if (missingManifestScriptSnippets.length) {
  fail(`Device QA manifest generator should preserve launch evidence and manual-check scope. Missing: ${missingManifestScriptSnippets.join(", ")}`);
}

let manifestJson;
try {
  manifestJson = JSON.parse(manifestJsonText);
} catch {
  fail("DEVICE_QA_MANIFEST.json should be valid JSON.");
}

const requiredManifestJsonFields = [
  "generatedBy",
  "checklist",
  "recordTemplate",
  "buildAndEvidence",
  "deviceTargets",
  "requiredManualAreas",
  "purchaseLinkSamples",
  "sensitiveDataRule"
];
const missingManifestJsonFields = requiredManifestJsonFields.filter((field) => !(field in manifestJson));
if (missingManifestJsonFields.length) {
  fail(`DEVICE_QA_MANIFEST.json missing fields: ${missingManifestJsonFields.join(", ")}`);
}

const requiredManifestMdSnippets = [
  "Device QA Execution Manifest",
  "Build And Evidence",
  "Required Device Targets",
  "Manual Check Matrix",
  "Home deal rail touch scroll and fade cue",
  "Purchase Link Samples",
  "Sensitive Data Rule",
  "Manual Work That Must Not Be Faked",
  "docs/device-qa-record-template.md",
  "docs/device-qa-checklist.md"
];
const missingManifestMdSnippets = requiredManifestMdSnippets.filter((snippet) => !manifestMd.includes(snippet));
if (missingManifestMdSnippets.length) {
  fail(`docs/DEVICE_QA_MANIFEST.md missing launch-critical sections: ${missingManifestMdSnippets.join(", ")}`);
}

const qaReleaseScript = String(pkg.scripts?.["qa:release"] ?? "");
const qaReleaseRunsManifest =
  qaReleaseScript.includes("device:qa:manifest") ||
  (qaReleaseScript.includes("run-qa.mjs") && qaReleaseScript.includes("--release") && runQaScript.includes('"device:qa:manifest"'));

if (!pkg.scripts?.["device:qa:manifest"] || !qaReleaseRunsManifest) {
  fail("package.json should expose device:qa:manifest and include it directly or through run-qa.mjs --release.");
}

const requiredReportSnippets = [
  "DEVICE_QA_REPORT.md",
  "docs",
  "DEVICE_QA_MANIFEST.json",
  "docs/DEVICE_QA_MANIFEST.md",
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

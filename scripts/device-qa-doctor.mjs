import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checklistPath = join(root, "docs/device-qa-checklist.md");
const recordPath = join(root, "docs/device-qa-record-template.md");
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
  "Play Console 개인정보처리방침 URL"
];

const missingChecklist = requiredChecklistSections.filter((section) => !checklist.includes(`## ${section}`));
if (missingChecklist.length) fail(`Checklist missing sections: ${missingChecklist.join(", ")}`);

const missingRecord = requiredRecordSections.filter((section) => !record.includes(`## ${section}`));
if (missingRecord.length) fail(`Record template missing sections: ${missingRecord.join(", ")}`);

const missingManualChecks = requiredManualChecks.filter((snippet) => !checklist.includes(snippet));
if (missingManualChecks.length) fail(`Checklist missing manual checks: ${missingManualChecks.join(", ")}`);

if (!record.includes("기준 Git 커밋") || !record.includes("상품 ID") || !record.includes("실제 열린 도메인") || !record.includes("남은 Critical Issue")) {
  fail("Record template should capture commit, product link samples, actual domains, and critical issue status.");
}

if (!testPlan.includes("docs/device-qa-record-template.md")) {
  fail("Test plan should reference the device QA record template.");
}

if (!releaseChecklist.includes("docs/device-qa-record-template.md") || !releaseChecklist.includes("npm run device:qa:doctor")) {
  fail("Release checklist should reference the device QA doctor and record template.");
}

console.log("PASS device QA: checklist, record template, test plan, and release checklist are wired.");

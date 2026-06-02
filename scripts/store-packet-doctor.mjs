import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const packetPath = "docs/store-submission-packet.md";

const requiredFiles = [
  "docs/play-store-listing.md",
  "docs/app-store-checklist.md",
  "docs/privacy-policy-draft.md",
  "docs/terms-draft.md",
  "docs/data-safety-guide.md",
  "docs/content-rating-guide.md",
  "docs/store-review-notes.md",
  "docs/store-assets-guide.md",
  "docs/device-qa-record-template.md",
  "docs/release-evidence.md",
  "docs/PUBLIC_URL_REPORT.md",
  "docs/STORE_METADATA_REPORT.md",
  "docs/STORE_ASSETS_REPORT.md",
  "docs/STORE_SCREENSHOTS_REPORT.md",
  "docs/STORE_SCREENSHOT_MANIFEST.md",
  "docs/STORE_SUBMISSION_REPORT.md",
  "docs/STORE_HANDOFF_REPORT.md",
  "docs/STORE_CONSOLE_FIELDS.md",
  "docs/STORE_MANUAL_CHECKLIST.md",
  "docs/RELEASE_NOTES.md",
  "docs/SUPPORT_PLAYBOOK.md",
  "docs/KNOWN_ISSUES.md",
  "android/app/build/outputs/apk/debug/app-debug.apk",
  "android/app/build/outputs/bundle/release/app-release.aab",
  "assets/store/play-store-icon-512.png",
  "assets/store/feature-graphic-1024x500.png",
  "STORE_SCREENSHOT_MANIFEST.json",
  "STORE_HANDOFF_REPORT.md",
  "STORE_CONSOLE_FIELDS.json",
  "STORE_MANUAL_CHECKLIST.md",
  "STORE_MANUAL_CHECKLIST.json",
  "RELEASE_NOTES.md",
  "RELEASE_NOTES.json",
  "SUPPORT_PLAYBOOK.md",
  "SUPPORT_PLAYBOOK.json",
  "KNOWN_ISSUES.md",
  "ios/App/App/PrivacyInfo.xcprivacy"
];

const requiredCommands = [
  "npm run env:doctor",
  "node scripts/env-doctor.mjs --strict",
  "npm run env:doctor:production",
  "npm run test:env",
  "npm run public:url:doctor",
  "npm run device:qa:doctor",
  "npm run device:qa:report",
  "npm run store:metadata:doctor",
  "npm run store:assets:doctor",
  "npm run store:screenshots:manifest",
  "npm run store:screenshots:doctor",
  "npm run store:submission:report",
  "npm run qa:release",
  "npm run store:console:fields",
  "npm run store:manual:checklist",
  "npm run store:manual:doctor",
  "npm run store:handoff:report",
  "npm run release:notes",
  "npm run support:playbook",
  "npm run known:issues",
  "npm run android:bundle",
  "npm run release:evidence",
  "npm run release:doctor"
];

const requiredCopy = [
  "Play Console 복사 입력 블록",
  "App Store Connect 복사 입력 블록",
  "테스트 계정: 필요 없음",
  "Demo Account: 필요 없음",
  "직접 상품을 판매하거나 결제를 처리하지 않습니다",
  "https://halindosa.com/privacy",
  "https://halindosa.com/support",
  "signed AAB",
  "Play Console pre-launch report",
  "App Store Connect processing"
];

const blockedCopy = ["localhost", "127.0.0.1", "example.com", "YOUR-VERCEL-DOMAIN"];

const mirroredReports = [
  ["PUBLIC_URL_REPORT.md", "docs/PUBLIC_URL_REPORT.md"],
  ["STORE_METADATA_REPORT.md", "docs/STORE_METADATA_REPORT.md"],
  ["STORE_ASSETS_REPORT.md", "docs/STORE_ASSETS_REPORT.md"],
  ["STORE_SCREENSHOTS_REPORT.md", "docs/STORE_SCREENSHOTS_REPORT.md"],
  ["STORE_SUBMISSION_REPORT.md", "docs/STORE_SUBMISSION_REPORT.md"],
  ["STORE_HANDOFF_REPORT.md", "docs/STORE_HANDOFF_REPORT.md"],
  ["STORE_MANUAL_CHECKLIST.md", "docs/STORE_MANUAL_CHECKLIST.md"],
  ["RELEASE_NOTES.md", "docs/RELEASE_NOTES.md"],
  ["SUPPORT_PLAYBOOK.md", "docs/SUPPORT_PLAYBOOK.md"],
  ["KNOWN_ISSUES.md", "docs/KNOWN_ISSUES.md"],
  ["STORE_PACKET_REPORT.md", "docs/STORE_PACKET_REPORT.md"]
];

function fail(message) {
  console.error(`FAIL store packet: ${message}`);
  process.exit(1);
}

function read(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) fail(`${path} is missing.`);
  return readFileSync(fullPath, "utf8");
}

function exists(path) {
  return existsSync(join(root, path));
}

const packet = read(packetPath);
const missingFileReferences = requiredFiles.filter((file) => !packet.includes(file));
const missingExistingFiles = requiredFiles.filter((file) => !exists(file));
const missingCommands = requiredCommands.filter((command) => !packet.includes(command));
const missingCopy = requiredCopy.filter((copy) => !packet.includes(copy));
const blocked = blockedCopy.filter((copy) => packet.includes(copy));
const mismatchedMirrors = mirroredReports.filter(([rootPath, docsPath]) => {
  if (!exists(rootPath) || !exists(docsPath)) return false;
  return read(rootPath) !== read(docsPath);
});

if (missingFileReferences.length) fail(`Packet missing file references: ${missingFileReferences.join(", ")}`);
if (missingExistingFiles.length) fail(`Referenced files are missing: ${missingExistingFiles.join(", ")}`);
if (missingCommands.length) fail(`Packet missing commands: ${missingCommands.join(", ")}`);
if (missingCopy.length) fail(`Packet missing store copy: ${missingCopy.join(", ")}`);
if (blocked.length) fail(`Packet should not include local/example origins: ${blocked.join(", ")}`);
if (mismatchedMirrors.length) {
  fail(`Root/docs mirrored reports differ: ${mismatchedMirrors.map(([rootPath, docsPath]) => `${rootPath} != ${docsPath}`).join(", ")}`);
}

const rows = requiredFiles.map((file) => `| \`${file}\` | ${exists(file) ? "present" : "missing"} | ${packet.includes(file) ? "referenced" : "missing reference"} |`);
const commandRows = requiredCommands.map((command) => `| \`${command}\` | ${packet.includes(command) ? "referenced" : "missing"} |`);
const mirrorRows = mirroredReports.map(([rootPath, docsPath]) => {
  const rootExists = exists(rootPath);
  const docsExists = exists(docsPath);
  const same = rootExists && docsExists && read(rootPath) === read(docsPath);
  return `| \`${rootPath}\` | \`${docsPath}\` | ${rootExists && docsExists ? "present" : "missing"} | ${same ? "same" : "review"} |`;
});

const report = [
  "# Store Submission Packet QA Report",
  "",
  "This report verifies that the store submission packet points to the expected non-secret files, reports, commands, and reviewer copy.",
  "",
  "## File References",
  "",
  "| File | Status | Packet reference |",
  "| --- | --- | --- |",
  ...rows,
  "",
  "## Command References",
  "",
  "| Command | Packet reference |",
  "| --- | --- |",
  ...commandRows,
  "",
  "## Mirrored Report Consistency",
  "",
  "| Root report | Docs report | Status | Content |",
  "| --- | --- | --- | --- |",
  ...mirrorRows,
  "",
  "## Reviewer Copy Checks",
  "",
  "- Guest access and no-demo-account copy: PASS",
  "- External seller/payment handling copy: PASS",
  "- Public privacy/support URL placeholders: PASS",
  "- Signed AAB and store processing manual checks: PASS",
  "- Root/docs mirrored report consistency: PASS",
  "- Localhost/example domain scan: PASS",
  "",
  "## Manual Work That Must Not Be Faked",
  "",
  "- The packet proves repository readiness only; it does not prove Play Console or App Store Connect submission has happened.",
  "- Keep signed AAB keystore secrets, store-console credentials, OAuth client secrets, and support mailbox passwords outside Git.",
  "- Re-run `npm run store:packet:doctor` after changing any store document, release report, binary path, or submission command.",
  ""
].join("\n");

mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "STORE_PACKET_REPORT.md"), report, "utf8");
writeFileSync(join(root, "docs", "STORE_PACKET_REPORT.md"), report, "utf8");

console.log("PASS store packet: submission packet references required files, commands, reviewer copy, and non-secret reports.");

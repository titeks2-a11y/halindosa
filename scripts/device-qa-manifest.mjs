import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const docsDir = join(root, "docs");

if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

function run(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "확인 필요";
  }
}

function fileStatus(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) return { path: relativePath, status: "missing", bytes: 0 };

  return { path: relativePath, status: "present", bytes: statSync(absolutePath).size };
}

function readIfPresent(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) return "";
  return readFileSync(absolutePath, "utf8");
}

function hostFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function loadPurchaseLinkSamples(limit = 10) {
  const dealsText = readIfPresent("data/mockDeals.ts");
  const verifiedText = readIfPresent("data/verifiedPurchaseLinks.ts");
  const verified = new Map();
  const verifiedPattern = /\n\s*(d\d+):\s*\{\s*url:\s*"([^"]+)"/g;
  let verifiedMatch;

  while ((verifiedMatch = verifiedPattern.exec(verifiedText))) {
    verified.set(verifiedMatch[1], verifiedMatch[2]);
  }

  const samples = [];
  const dealPattern = /deal\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/g;
  let dealMatch;

  while ((dealMatch = dealPattern.exec(dealsText)) && samples.length < limit) {
    const [, id, mall, title] = dealMatch;
    const url = verified.get(id);
    if (!url) continue;

    samples.push({
      order: samples.length + 1,
      id,
      mall,
      title,
      expectedHost: hostFromUrl(url),
      expectedType: /event|benefit|coupon|membership|discount|campaign/i.test(url) ? "official_benefit" : "product_detail",
      appRoute: `/deals/${id}`,
      redirectRoute: `/go/${id}?source=device_qa`
    });
  }

  return samples;
}

const commit = run("git", ["rev-parse", "--short", "HEAD"]);
const branch = run("git", ["branch", "--show-current"]);
const version = JSON.parse(readIfPresent("package.json") || "{}").version ?? "확인 필요";
const artifacts = [
  fileStatus("android/app/build/outputs/apk/debug/app-debug.apk"),
  fileStatus("android/app/build/outputs/bundle/release/app-release.aab"),
  fileStatus("MOBILE_UX_REPORT.md"),
  fileStatus("docs/release-evidence.md"),
  fileStatus("STORE_SCREENSHOT_MANIFEST.json"),
  fileStatus("docs/STORE_SCREENSHOT_MANIFEST.md")
];
const deviceTargets = [
  {
    id: "android-emulator",
    label: "Android Emulator",
    installPath: "APK / AAB / Play internal",
    requiredChecks: ["home_safe_area", "purchase_link", "share_sheet", "favorites_recent", "policy_links"]
  },
  {
    id: "android-real-device",
    label: "실제 Android 기기",
    installPath: "APK / AAB / Play internal",
    requiredChecks: ["home_safe_area", "purchase_link", "share_sheet", "favorites_recent", "oauth_callback", "offline_recovery"]
  },
  {
    id: "ios-simulator",
    label: "iPhone Simulator 또는 실제 iPhone",
    installPath: "Xcode Run / TestFlight",
    requiredChecks: ["ios_safe_area", "safari_or_browser", "share_sheet", "oauth_deeplink", "privacy_manifest"]
  }
];
const purchaseLinkSamples = loadPurchaseLinkSamples(10);
const requiredCommands = [
  "npm run qa:release",
  "npm run release:doctor",
  "npm run device:qa:doctor",
  "npm run device:qa:report",
  "npm run test:mobile-ux"
];
const manualEvidenceRules = [
  "실제 기기 결과를 통과로 꾸미지 않고 확인한 항목만 기록",
  "주문번호, 주소, 결제 정보, 비밀번호, 인증 코드, .env, keystore, service-role key 기록 금지",
  "OAuth는 Provider 이름, redirect 통과 여부, 오류 요약만 기록",
  "구매 링크 샘플은 앱 UI에서 열고 실제 열린 도메인을 기록",
  "남은 Critical Issue가 있으면 출시 가능으로 판정하지 않음"
];

const manifest = {
  generatedBy: "npm run device:qa:manifest",
  checklist: "docs/device-qa-checklist.md",
  recordTemplate: "docs/device-qa-record-template.md",
  branch,
  commit,
  version,
  buildAndEvidence: artifacts,
  deviceTargets,
  requiredManualAreas: [
    "Android safe area",
    "Purchase link external browser",
    "Share sheet",
    "Favorites and recent persistence",
    "OAuth callback",
    "iOS safe area and sharing",
    "Public privacy URL",
    "Top purchase links"
  ],
  purchaseLinkSamples,
  requiredCommands,
  manualEvidenceRules,
  sensitiveDataRule:
    "Do not record order numbers, addresses, payment data, passwords, auth codes, .env values, service-role keys, or keystore passwords."
};

const markdown = `# Device QA Execution Manifest

Generated: npm run device:qa:manifest

This manifest turns the launch-device checklist into concrete targets, commands, artifacts, and purchase-link samples. It does not claim that manual device QA has passed.

## Baseline

| Item | Value |
| --- | --- |
| Branch | \`${branch}\` |
| Commit | \`${commit}\` |
| App version | \`${version}\` |
| Record template | \`docs/device-qa-record-template.md\` |
| Checklist | \`docs/device-qa-checklist.md\` |

## Build And Evidence

| Artifact | Status | Bytes |
| --- | --- | ---: |
${artifacts.map((artifact) => `| \`${artifact.path}\` | ${artifact.status} | ${artifact.bytes} |`).join("\n")}

## Required Commands Before Manual QA

${requiredCommands.map((command) => `- \`${command}\``).join("\n")}

## Required Device Targets

| Target | Install path | Required checks |
| --- | --- | --- |
${deviceTargets.map((target) => `| ${target.label} | ${target.installPath} | ${target.requiredChecks.join(", ")} |`).join("\n")}

## Manual Check Matrix

| Area | Android Emulator | Real Android | iOS Simulator/TestFlight |
| --- | --- | --- | --- |
| Safe area and bottom tabs | Required | Required | Required |
| Purchase link opens external browser | Required | Required | Required |
| Native share sheet | Required | Required | Required |
| Favorites and recent persistence | Required | Required | Required |
| OAuth callback or deep link | Optional | Required | Required |
| Public privacy/support URL | Required | Required | Required |
| Store screenshot story consistency | Required | Required | Required |

## Purchase Link Samples

Open these deals through the app UI and write the actual destination domain into \`docs/device-qa-record-template.md\`.

| # | Deal ID | Seller | Expected host | Type | App route | Redirect route |
| ---: | --- | --- | --- | --- | --- | --- |
${purchaseLinkSamples.map((sample) => `| ${sample.order} | ${sample.id} | ${sample.mall} | ${sample.expectedHost} | ${sample.expectedType} | \`${sample.appRoute}\` | \`${sample.redirectRoute}\` |`).join("\n")}

## Sensitive Data Rule

Do not record order numbers, addresses, payment data, passwords, auth codes, \`.env\` values, service-role keys, or keystore passwords.

## Manual Evidence Rules

${manualEvidenceRules.map((rule) => `- ${rule}`).join("\n")}

## Manual Work That Must Not Be Faked

- This manifest is a plan and evidence checklist, not proof that QA passed.
- Keep the final device QA record separate from secrets, credentials, order data, and private keystore information.
- Re-run \`npm run device:qa:manifest\`, \`npm run device:qa:report\`, and \`npm run release:doctor\` after changing release builds, purchase samples, OAuth settings, or store screenshots.
`;

writeFileSync(join(root, "DEVICE_QA_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "DEVICE_QA_MANIFEST.md"), markdown, "utf8");

console.log(`Device QA manifest written: ${deviceTargets.length} targets, ${purchaseLinkSamples.length} purchase samples.`);

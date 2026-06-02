import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();

function run(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "확인 필요";
  }
}

function fileStatus(relativePath) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) return { exists: false, size: "missing" };
  const bytes = statSync(fullPath).size;
  if (bytes >= 1024 * 1024) return { exists: true, size: `${(bytes / (1024 * 1024)).toFixed(2)}MB` };
  if (bytes >= 1024) return { exists: true, size: `${Math.round(bytes / 1024)}KB` };
  return { exists: true, size: `${bytes}B` };
}

function reportStatus(relativePath, expectedText = "PASS") {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) return "missing";
  const content = statSync(fullPath).size ? "present" : "empty";
  if (content === "empty") return "empty";
  const text = readFileSync(fullPath, "utf8");
  return text.includes(expectedText) ? "PASS evidence present" : "present, review manually";
}

function loadJson(relativePath) {
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return null;
  }
}

const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const branch = run("git", ["branch", "--show-current"]);
const commit = run("git", ["rev-parse", "--short", "HEAD"]);
const workingTree = (run("git", ["status", "--short"]) || "clean").replace(/\r?\n/g, "; ");
const linkResult = loadJson("LINK_VERIFICATION_RESULT.json");
const linkSummary = linkResult
  ? [
      `- Curated visible deals: ${linkResult.visibleDeals ?? "unknown"}`,
      `- Direct product or official benefit links: ${linkResult.passedDirectLinks ?? "unknown"}/${linkResult.verificationTargets ?? "unknown"}`,
      `- Product detail URLs: ${linkResult.productDetailUrls ?? "unknown"}`,
      `- Official benefit URLs: ${linkResult.officialBenefitUrls ?? "unknown"}`,
      `- Search/category/community URLs exposed: ${(linkResult.searchOrCategorySuspected ?? 0) + (linkResult.communitySuspected ?? 0)}`,
      `- Manual link review needed: ${linkResult.manualReviewNeeded ?? "unknown"}`
    ]
  : ["- Link verification JSON is missing. Run `npm run links:report` before final submission review."];

const artifacts = [
  ["Android release AAB", "android/app/build/outputs/bundle/release/app-release.aab", "Build artifact only; final Play upload still needs private signing confirmation"],
  ["Android debug APK", "android/app/build/outputs/apk/debug/app-debug.apk", "Internal install smoke only"],
  ["Play Store icon", "assets/store/play-store-icon-512.png", "Play Console listing"],
  ["Feature graphic", "assets/store/feature-graphic-1024x500.png", "Play Console listing"],
  ["iOS app icon", "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", "Xcode archive check"],
  ["iOS privacy manifest", "ios/App/App/PrivacyInfo.xcprivacy", "App Store privacy review"]
];

const verificationReports = [
  ["Commercial audit", "docs/AUDIT_REPORT.md"],
  ["Environment doctor", "docs/ENV_DOCTOR_REPORT.md"],
  ["Public URL submission", "docs/PUBLIC_URL_REPORT.md"],
  ["Store metadata QA", "docs/STORE_METADATA_REPORT.md"],
  ["Store asset QA", "docs/STORE_ASSETS_REPORT.md"],
  ["Store screenshot QA", "docs/STORE_SCREENSHOTS_REPORT.md"],
  ["Device QA readiness", "docs/DEVICE_QA_REPORT.md"],
  ["Harness", "docs/HARNESS_REPORT.md"],
  ["Mobile UX", "MOBILE_UX_REPORT.md"],
  ["Link verification", "LINK_VERIFICATION_REPORT.md"],
  ["Image quality", "IMAGE_QUALITY_REPORT.md"],
  ["Performance", "docs/PERFORMANCE_REPORT.md"],
  ["Release evidence", "docs/release-evidence.md"]
];

const docs = [
  ["Play Store listing", "docs/play-store-listing.md"],
  ["App Store checklist", "docs/app-store-checklist.md"],
  ["Privacy policy draft", "docs/privacy-policy-draft.md"],
  ["Terms draft", "docs/terms-draft.md"],
  ["Data safety guide", "docs/data-safety-guide.md"],
  ["Content rating guide", "docs/content-rating-guide.md"],
  ["Store review notes", "docs/store-review-notes.md"],
  ["Device QA record template", "docs/device-qa-record-template.md"]
];

const manualItems = [
  "Create or select the release keystore outside Git and generate the final signed AAB.",
  "Deploy the public domain and confirm `/privacy`, `/support`, `/sitemap.xml`, and `/robots.txt` from an external network.",
  "Configure Supabase OAuth providers and confirm `halindosa://auth/callback` on real devices.",
  "Run Android real-device QA and record results in `docs/device-qa-record-template.md`.",
  "Upload store screenshots and verify they avoid guarantee language and internal metrics.",
  "Review Play Console pre-launch report and App Store Connect processing before public rollout."
];

const lines = [
  "# Store Submission Readiness Report",
  "",
  "This report is a non-secret handoff snapshot for Play Console and App Store Connect submission.",
  "",
  "## Snapshot",
  "",
  `- Generated by: \`npm run store:submission:report\``,
  `- Branch: \`${branch}\``,
  `- Commit: \`${commit}\``,
  `- Working tree: ${workingTree}`,
  `- App version: ${pkg.version}`,
  `- App name: 할인도사`,
  `- Package / bundle id: com.halindosa.app`,
  "",
  "## Binary And Store Assets",
  "",
  "| Item | Path | Status | Size | Use |",
  "| --- | --- | --- | ---: | --- |",
  ...artifacts.map(([label, path, use]) => {
    const status = fileStatus(path);
    return `| ${label} | \`${path}\` | ${status.exists ? "present" : "missing"} | ${status.size} | ${use} |`;
  }),
  "",
  "## Signing And Upload Readiness",
  "",
  "- Android release signing is intentionally not certified by this repository report because keystore files and passwords must stay outside Git.",
  "- Run `npm run android:signing:doctor` locally before upload, then create the final signed AAB with Android Studio or a private `android/keystore.properties` file.",
  "- Treat `android/app/build/outputs/bundle/release/app-release.aab` as a build artifact until the private keystore signing step is confirmed.",
  "- Do not commit `android/keystore.properties`, `.jks`, `.keystore`, `.p12`, passwords, or Play Console upload credentials.",
  "",
  "## Link Coverage Snapshot",
  "",
  ...linkSummary,
  "",
  "## Verification Reports",
  "",
  "| Check | Path | Status |",
  "| --- | --- | --- |",
  ...verificationReports.map(([label, path]) => `| ${label} | \`${path}\` | ${reportStatus(path)} |`),
  "",
  "## Store Documents",
  "",
  "| Document | Path | Status |",
  "| --- | --- | --- |",
  ...docs.map(([label, path]) => {
    const status = fileStatus(path);
    return `| ${label} | \`${path}\` | ${status.exists ? "present" : "missing"} |`;
  }),
  "",
  "## Manual Work That Must Not Be Faked",
  "",
  ...manualItems.map((item) => `- ${item}`),
  "",
  "## Sensitive Data Rule",
  "",
  "Do not store keystore passwords, service-role keys, OAuth client secrets, `.env` values, tester passwords, payment information, addresses, or order numbers in this repository or in store-submission screenshots.",
  ""
].join("\n");

mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "STORE_SUBMISSION_REPORT.md"), lines, "utf8");
writeFileSync(join(root, "docs", "STORE_SUBMISSION_REPORT.md"), lines, "utf8");

console.log("Store submission readiness report written: STORE_SUBMISSION_REPORT.md and docs/STORE_SUBMISSION_REPORT.md");

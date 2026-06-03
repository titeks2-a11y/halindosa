import { existsSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const MB = 1024 * 1024;

const budgets = {
  // Raw static export includes prerendered HTML/RSC payload for the offline Android bundle.
  // Keep the Play Store-facing AAB budget strict while allowing the uncompressed export to
  // reflect the current 140 verified deal seed and policy/store pages.
  outTotal: 70 * MB,
  largestHtml: 4 * MB,
  largestJs: 500 * 1024,
  largestCss: 300 * 1024,
  debugApk: 25 * MB,
  releaseAab: 15 * MB,
  storeAsset: 1.5 * MB
};

async function listFiles(dir) {
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) return listFiles(fullPath);
      if (!entry.isFile()) return [];
      return [fullPath];
    })
  );

  return files.flat();
}

function sizeOf(path) {
  return existsSync(path) ? statSync(path).size : 0;
}

function formatBytes(bytes) {
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function assertBudget(name, actual, limit, target = "") {
  const label = target ? `${name} (${target})` : name;
  if (actual > limit) {
    fail(`FAIL ${label}: ${formatBytes(actual)} exceeds ${formatBytes(limit)}`);
  } else {
    console.log(`PASS ${label}: ${formatBytes(actual)} / ${formatBytes(limit)}`);
  }
}

const outDir = join(root, "out");
const outFiles = await listFiles(outDir);

if (!outFiles.length) {
  fail("FAIL static export: out directory is missing. Run npm run build:android first.");
} else {
  const totalOut = outFiles.reduce((sum, file) => sum + sizeOf(file), 0);
  const largestHtml = outFiles.filter((file) => file.endsWith(".html")).sort((a, b) => sizeOf(b) - sizeOf(a))[0];
  const largestJs = outFiles.filter((file) => file.endsWith(".js")).sort((a, b) => sizeOf(b) - sizeOf(a))[0];
  const largestCss = outFiles.filter((file) => file.endsWith(".css")).sort((a, b) => sizeOf(b) - sizeOf(a))[0];

  assertBudget("static export total", totalOut, budgets.outTotal, "out");
  if (largestHtml) assertBudget("largest HTML", sizeOf(largestHtml), budgets.largestHtml, relative(root, largestHtml));
  if (largestJs) assertBudget("largest JS", sizeOf(largestJs), budgets.largestJs, relative(root, largestJs));
  if (largestCss) assertBudget("largest CSS", sizeOf(largestCss), budgets.largestCss, relative(root, largestCss));
}

assertBudget("debug APK", sizeOf(join(root, "android/app/build/outputs/apk/debug/app-debug.apk")), budgets.debugApk);
assertBudget("release AAB", sizeOf(join(root, "android/app/build/outputs/bundle/release/app-release.aab")), budgets.releaseAab);

const storeAssets = [
  "assets/store/play-store-icon-512.png",
  "assets/store/feature-graphic-1024x500.png",
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
];

for (const asset of storeAssets) {
  const size = sizeOf(join(root, asset));
  if (!size) {
    fail(`FAIL store asset (${asset}): missing`);
  } else {
    assertBudget("store asset", size, budgets.storeAsset, asset);
  }
}

if (process.exitCode) {
  console.error("Performance budget failed.");
  process.exit(process.exitCode);
}

console.log("Performance budget passed.");

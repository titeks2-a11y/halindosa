import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredAssets = [
  {
    label: "Play Store icon",
    path: "assets/store/play-store-icon-512.png",
    width: 512,
    height: 512,
    maxBytes: 1024 * 1024
  },
  {
    label: "Play Store feature graphic",
    path: "assets/store/feature-graphic-1024x500.png",
    width: 1024,
    height: 500,
    maxBytes: 1024 * 1024
  },
  {
    label: "PWA 192 icon",
    path: "public/halindosa-icon-192.png",
    width: 192,
    height: 192,
    maxBytes: 512 * 1024
  },
  {
    label: "PWA 512 icon",
    path: "public/halindosa-icon-512.png",
    width: 512,
    height: 512,
    maxBytes: 1024 * 1024
  },
  {
    label: "iOS App Store icon",
    path: "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    width: 1024,
    height: 1024,
    maxBytes: 1024 * 1024
  }
];

function readPngDimensions(path) {
  const buffer = readFileSync(path);
  const pngSignature = "89504e470d0a1a0a";

  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error("PNG 파일이 아닙니다.");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

let failed = false;
const reportRows = [];

for (const asset of requiredAssets) {
  const fullPath = join(root, asset.path);

  if (!existsSync(fullPath)) {
    failed = true;
    console.error(`FAIL ${asset.label}: missing ${asset.path}`);
    reportRows.push(`| ${asset.label} | \`${asset.path}\` | missing | ${asset.width}x${asset.height} | missing | FAIL |`);
    continue;
  }

  try {
    const dimensions = readPngDimensions(fullPath);
    const size = statSync(fullPath).size;
    const dimensionOk = dimensions.width === asset.width && dimensions.height === asset.height;
    const sizeOk = size <= asset.maxBytes;

    if (!dimensionOk) {
      failed = true;
      console.error(`FAIL ${asset.label}: expected ${asset.width}x${asset.height}, got ${dimensions.width}x${dimensions.height}`);
      reportRows.push(`| ${asset.label} | \`${asset.path}\` | ${dimensions.width}x${dimensions.height} | ${asset.width}x${asset.height} | ${formatBytes(size)} | FAIL |`);
      continue;
    }

    if (!sizeOk) {
      failed = true;
      console.error(`FAIL ${asset.label}: ${formatBytes(size)} exceeds ${formatBytes(asset.maxBytes)}`);
      reportRows.push(`| ${asset.label} | \`${asset.path}\` | ${dimensions.width}x${dimensions.height} | ${asset.width}x${asset.height} | ${formatBytes(size)} | FAIL |`);
      continue;
    }

    console.log(`PASS ${asset.label}: ${dimensions.width}x${dimensions.height}, ${formatBytes(size)}`);
    reportRows.push(`| ${asset.label} | \`${asset.path}\` | ${dimensions.width}x${dimensions.height} | ${asset.width}x${asset.height} | ${formatBytes(size)} | PASS |`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${asset.label}: ${error instanceof Error ? error.message : String(error)}`);
    reportRows.push(`| ${asset.label} | \`${asset.path}\` | unreadable | ${asset.width}x${asset.height} | unknown | FAIL |`);
  }
}

const report = [
  "# Store Asset QA Report",
  "",
  "This report records non-secret Play Store, PWA, and iOS app icon asset readiness.",
  "",
  "## Asset Dimension Checks",
  "",
  "| Asset | Path | Actual dimensions | Required dimensions | Size | Status |",
  "| --- | --- | --- | --- | ---: | --- |",
  ...reportRows,
  "",
  "## Manual Work That Must Not Be Faked",
  "",
  "- Review the final icon at small sizes in Play Console and App Store Connect before submission.",
  "- Confirm the feature graphic does not include unauthorized third-party logos, personal data, or guarantee language.",
  "- Regenerate brand assets with `npm run store:assets:generate` only after confirming the source artwork is approved.",
  "- Do not commit store-console credentials, signing secrets, or unpublished partner branding approvals.",
  ""
].join("\n");

mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "STORE_ASSETS_REPORT.md"), report, "utf8");
writeFileSync(join(root, "docs", "STORE_ASSETS_REPORT.md"), report, "utf8");

if (failed) {
  console.error("Store asset doctor failed.");
  process.exit(1);
}

console.log("Store asset doctor passed.");

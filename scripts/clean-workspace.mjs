import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const workspaceRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const shouldDelete = args.has("--delete");
const includeAndroidBuild = args.has("--android-build");
const includeAndroidReleaseBundles = args.has("--android-release-bundles");
const includeAndroidWebAssets = args.has("--android-web-assets");
const includeIosBuild = args.has("--ios-build");
const includeCapacitorPluginBuilds = args.has("--capacitor-plugin-builds");
const includeReports = args.has("--reports");
const reportsOnly =
  includeReports &&
  !includeAndroidBuild &&
  !includeAndroidReleaseBundles &&
  !includeAndroidWebAssets &&
  !includeIosBuild &&
  !includeCapacitorPluginBuilds;

const targets = reportsOnly
  ? []
  : [
      ".next",
      "out",
      ".turbo",
      ".eslintcache",
      ".dev-server.log",
      ".dev-server.err.log",
      ".codex-dev-server.out.log",
      ".codex-dev-server.err.log",
    ];

if (includeAndroidBuild) {
  targets.push("android/.gradle", "android/app/build", "android/build");
}

if (includeAndroidReleaseBundles) {
  targets.push("android/app/release");
}

if (includeAndroidWebAssets) {
  targets.push("android/app/src/main/assets/public", "android/app/src/main/assets/capacitor.config.json");
}

if (includeIosBuild) {
  targets.push("ios/App/App/public", "ios/App/build", "ios/App/DerivedData", "ios/build");
}

if (includeReports) {
  targets.push("reports");
}

async function addCapacitorPluginBuildTargets() {
  if (!includeCapacitorPluginBuilds) return;

  const capacitorRoot = resolveInsideWorkspace("node_modules/@capacitor");
  let plugins = [];
  try {
    plugins = await readdir(capacitorRoot, { withFileTypes: true });
  } catch {
    return;
  }

  for (const plugin of plugins) {
    if (!plugin.isDirectory()) continue;
    targets.push(path.join("node_modules", "@capacitor", plugin.name, "android", "build"));
    targets.push(path.join("node_modules", "@capacitor", plugin.name, "capacitor", "build"));
  }
}

function resolveInsideWorkspace(target) {
  const resolved = path.resolve(workspaceRoot, target);
  const relative = path.relative(workspaceRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to clean outside workspace: ${target}`);
  }
  return resolved;
}

async function getSizeBytes(targetPath) {
  try {
    const info = await stat(targetPath);
    if (info.isFile()) {
      return info.size;
    }
    if (info.isDirectory()) {
      const entries = await readdir(targetPath, { withFileTypes: true });
      const sizes = await Promise.all(
        entries.map((entry) => getSizeBytes(path.join(targetPath, entry.name)))
      );
      return sizes.reduce((sum, size) => sum + size, 0);
    }
  } catch {
    return 0;
  }
  return 0;
}

let removed = 0;
let found = 0;

await addCapacitorPluginBuildTargets();

for (const target of targets) {
  const targetPath = resolveInsideWorkspace(target);
  try {
    await stat(targetPath);
    found += 1;
  } catch {
    console.log(`skip  ${target}`);
    continue;
  }

  if (!shouldDelete) {
    const size = await getSizeBytes(targetPath);
    const sizeLabel = size ? ` (${(size / 1024 / 1024).toFixed(1)} MB)` : "";
    console.log(`would remove  ${target}${sizeLabel}`);
    continue;
  }

  await rm(targetPath, { recursive: true, force: true });
  removed += 1;
  console.log(`removed  ${target}`);
}

if (!shouldDelete) {
  console.log(`\nDry run complete. ${found} generated target(s) found.`);
  console.log("Run `npm run clean:artifacts` to remove web build artifacts.");
  console.log("Run `npm run clean:artifacts:android` to also remove Android build outputs.");
  console.log("Run `npm run clean:release-bundles` to remove generated APK/AAB release copies.");
  console.log("Run `npm run clean:artifacts:mobile` to also remove regenerated Android/iOS build outputs.");
  console.log("Run `npm run clean:artifacts:deep` to also remove Capacitor plugin build caches.");
  console.log("Run `npm run clean:reports` to remove regenerated QA/release report outputs.");
} else {
  if (includeReports) {
    const reportsDir = resolveInsideWorkspace("reports");
    await mkdir(reportsDir, { recursive: true });
    await writeFile(path.join(reportsDir, ".gitkeep"), "\n", "utf8");
  }
  console.log(`\nClean complete. Removed ${removed} generated target(s).`);
}

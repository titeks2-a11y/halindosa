import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");

const ignoredTopLevelDirs = new Set([".git", "node_modules"]);
const generatedTargets = [
  ".next",
  "out",
  ".turbo",
  ".eslintcache",
  ".dev-server.log",
  ".dev-server.err.log",
  ".codex-dev-server.out.log",
  ".codex-dev-server.err.log",
  "android/.gradle",
  "android/app/build",
  "android/build",
  "android/app/src/main/assets/public",
  "android/app/src/main/assets/capacitor.config.json",
  "ios/App/App/public",
  "ios/App/build",
  "ios/App/DerivedData",
  "ios/build"
];

function resolveInsideWorkspace(target) {
  const resolved = path.resolve(root, target);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to inspect outside workspace: ${target}`);
  }
  return resolved;
}

async function getSizeBytes(targetPath) {
  try {
    const info = await stat(targetPath);
    if (info.isFile()) return info.size;
    if (!info.isDirectory()) return 0;

    const entries = await readdir(targetPath, { withFileTypes: true });
    const sizes = await Promise.all(
      entries.map((entry) => getSizeBytes(path.join(targetPath, entry.name)))
    );
    return sizes.reduce((sum, size) => sum + size, 0);
  } catch {
    return 0;
  }
}

async function inspectTopLevelDirectories() {
  const entries = await readdir(root, { withFileTypes: true });
  const rows = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || ignoredTopLevelDirs.has(entry.name)) continue;
    const size = await getSizeBytes(path.join(root, entry.name));
    rows.push({ path: entry.name, size });
  }

  return rows.sort((a, b) => b.size - a.size);
}

async function inspectLargeFiles() {
  const rows = [];

  async function walk(currentDir, relativeDir = "") {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!relativeDir && ignoredTopLevelDirs.has(entry.name)) continue;
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.join(relativeDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
        continue;
      }

      if (!entry.isFile()) continue;
      const info = await stat(absolutePath);
      rows.push({ path: relativePath.replaceAll(path.sep, "/"), size: info.size });
    }
  }

  await walk(root);
  return rows.sort((a, b) => b.size - a.size).slice(0, 15);
}

async function inspectGeneratedTargets() {
  const rows = [];

  for (const target of generatedTargets) {
    const resolved = resolveInsideWorkspace(target);
    const size = await getSizeBytes(resolved);
    if (size > 0) rows.push({ path: target, size });
  }

  return rows.sort((a, b) => b.size - a.size);
}

function formatBytes(bytes) {
  if (!bytes) return "0B";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}

function printRows(title, rows, limit = rows.length) {
  console.log(`\n${title}`);
  if (!rows.length) {
    console.log("- none");
    return;
  }

  for (const row of rows.slice(0, limit)) {
    console.log(`- ${row.path}: ${formatBytes(row.size)}`);
  }
}

const [generated, topLevelDirs, largeFiles] = await Promise.all([
  inspectGeneratedTargets(),
  inspectTopLevelDirectories(),
  inspectLargeFiles()
]);

const generatedSize = generated.reduce((sum, item) => sum + item.size, 0);
const sourceSize = topLevelDirs.reduce((sum, item) => sum + item.size, 0);

console.log("Workspace health");
console.log(`- Source/runtime footprint excluding .git and node_modules: ${formatBytes(sourceSize)}`);
console.log(`- Regenerable artifact footprint: ${formatBytes(generatedSize)}`);
console.log(`- Regenerable artifact count: ${generated.length}`);

printRows("Regenerable artifacts", generated);
printRows("Largest top-level directories", topLevelDirs, 10);
printRows("Largest workspace files", largeFiles, 15);

if (generated.length) {
  console.log("\nRecommended cleanup");
  console.log("- npm run clean:artifacts");
  console.log("- npm run clean:artifacts:mobile");
  console.log("- npm run clean:artifacts:deep");
}

if (strict && generated.length) {
  console.error("\nFAIL workspace strict health: regenerable artifacts are present.");
  process.exit(1);
}

console.log(`\nPASS workspace health${strict ? " strict" : ""}: no blocking workspace issue found.`);

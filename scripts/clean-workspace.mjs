import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const workspaceRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const shouldDelete = args.has("--delete");
const includeAndroidBuild = args.has("--android-build");

const targets = [
  ".next",
  "out",
  ".turbo",
  ".eslintcache",
  ".codex-dev-server.out.log",
  ".codex-dev-server.err.log",
];

if (includeAndroidBuild) {
  targets.push("android/app/build", "android/build");
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
} else {
  console.log(`\nClean complete. Removed ${removed} generated target(s).`);
}

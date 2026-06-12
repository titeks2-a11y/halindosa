import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    env: {
      ...process.env,
      ...env
    },
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status ?? 1}`);
  }
}

const disableRunId = `${Date.now()}-${process.pid}`;
const temporarilyDisabled = [
  ["app", "api"],
  ["app", "go"],
  ["app", "admin"],
  ["app", "reports"],
  ["app", "robots.ts"],
  ["app", "sitemap.ts"],
  ["app", "manifest.ts"]
].map((segments) => {
  const source = join(process.cwd(), ...segments);
  const basename = segments[segments.length - 1];
  const legacyDestination = join(process.cwd(), ...segments.slice(0, -1), `_${basename}.capacitor-disabled`);
  const destination = join(process.cwd(), ...segments.slice(0, -1), `_${basename}.capacitor-disabled-${disableRunId}`);

  return { source, destination, legacyDestination };
});
const moved = [];
const appPagePath = join(process.cwd(), "app", "page.tsx");
let originalAppPage = "";

try {
  rmSync(join(process.cwd(), ".next"), { force: true, maxRetries: 5, recursive: true, retryDelay: 500 });

  for (const entry of temporarilyDisabled) {
    if (!existsSync(entry.source) && existsSync(entry.legacyDestination)) {
      renameSync(entry.legacyDestination, entry.source);
    }
  }

  for (const entry of temporarilyDisabled) {
    if (existsSync(entry.source)) {
      renameSync(entry.source, entry.destination);
      moved.push(entry);
    }
  }

  if (existsSync(appPagePath)) {
    originalAppPage = readFileSync(appPagePath, "utf8");
    const exportSafeAppPage = originalAppPage.replace(
      /\nexport const dynamic = "force-dynamic";\nexport const revalidate = 0;\nexport const fetchCache = "force-no-store";\n/,
      "\n"
    );
    if (exportSafeAppPage !== originalAppPage) {
      writeFileSync(appPagePath, exportSafeAppPage, "utf8");
    }
  }

  run(process.execPath, [join(process.cwd(), "node_modules", "next", "dist", "bin", "next"), "build"], {
    CAPACITOR_BUILD: "true",
    DEAL_DATA_MODE: process.env.DEAL_DATA_MODE ?? "mock",
    DEAL_PROVIDER: process.env.DEAL_PROVIDER ?? "mock"
  });
} finally {
  if (originalAppPage) {
    writeFileSync(appPagePath, originalAppPage, "utf8");
  }

  for (const entry of moved.reverse()) {
    if (existsSync(entry.destination)) {
      renameSync(entry.destination, entry.source);
    }
  }
}

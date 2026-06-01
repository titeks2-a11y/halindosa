import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const loopbackHost = ["127", "0", "0", "1"].join(".");
const baseUrl = process.env.SMOKE_BASE_URL ?? `http://${loopbackHost}:3000`;
const healthUrl = `${baseUrl}/api/health`;
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? 45000);

function run(file, args, options = {}) {
  const result = spawnSync(file, args, {
    stdio: "inherit",
    ...options
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function waitForHealth() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.ok) return;
      }
    } catch {
      // Keep waiting until Next.js is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Health check timed out: ${healthUrl}`);
}

function stopProcessTree(child) {
  if (!child.pid) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore"
    });
    return;
  }

  child.kill("SIGTERM");
}

run(process.execPath, ["scripts/stop-dev-server.mjs"]);

const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const devServer = spawn(process.execPath, [nextBin, "dev", "--hostname", loopbackHost, "--port", "3000"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1"
  }
});

try {
  await waitForHealth();
  run(process.execPath, ["scripts/smoke.mjs"], {
    env: {
      ...process.env,
      SMOKE_BASE_URL: baseUrl
    }
  });
} finally {
  stopProcessTree(devServer);
}

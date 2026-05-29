import { spawn, spawnSync } from "node:child_process";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const healthUrl = `${baseUrl}/api/health`;
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? 45000);

function commandParts(command) {
  if (process.platform === "win32") return ["cmd.exe", ["/d", "/s", "/c", command]];
  return ["sh", ["-c", command]];
}

function run(command, options = {}) {
  const [file, args] = commandParts(command);
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

run("npm run stop:dev");

const [devFile, devArgs] = commandParts("npm run dev -- --hostname 127.0.0.1 --port 3000");
const devServer = spawn(devFile, devArgs, {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1"
  }
});

try {
  await waitForHealth();
  run("npm run smoke", {
    env: {
      ...process.env,
      SMOKE_BASE_URL: baseUrl
    }
  });
} finally {
  stopProcessTree(devServer);
}

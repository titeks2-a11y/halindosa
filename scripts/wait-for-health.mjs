const url = process.env.HEALTH_URL ?? "http://127.0.0.1:3000/api/health";
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? 30000);
const startedAt = Date.now();

while (Date.now() - startedAt < timeoutMs) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.ok) {
        console.log(`Health check ready: ${url}`);
        process.exit(0);
      }
    }
  } catch {
    // Keep waiting until timeout.
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.error(`Health check timed out: ${url}`);
process.exit(1);

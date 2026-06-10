import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const snapshotPath = join(root, "data", "refreshedDeals.json");
const reportPath = join(root, "reports", "home-runtime-snapshot.json");
const docReportPath = join(root, "docs", "HOME_RUNTIME_SNAPSHOT_REPORT.md");
const markerToken = `halindosa-runtime-${Date.now()}`;
const markerTitle = `할인도사 실시간 반영 검증 ${markerToken}`;
const requestTimeoutMs = 90_000;
const checks = [];
let childProcess = null;

function pass(name, detail = "") {
  checks.push({ name, ok: true, detail });
}

function fail(name, detail = "") {
  checks.push({ name, ok: false, detail });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function stopServer() {
  if (!childProcess?.pid) return;

  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(childProcess.pid), "/T", "/F"], { stdio: "ignore" });
      return;
    }
  } catch {
    // Fall back to a normal kill below.
  }

  try {
    childProcess.kill("SIGTERM");
  } catch {
    // Nothing else to do.
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache"
    }
  });
  const text = await response.text();
  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON from ${url}, got ${text.slice(0, 120)}`);
  }

  return {
    status: response.status,
    cacheControl: response.headers.get("cache-control") ?? "",
    data
  };
}

async function waitForApi(baseUrl) {
  const startedAt = Date.now();
  let lastError = "";

  while (Date.now() - startedAt < requestTimeoutMs) {
    try {
      const result = await fetchJson(`${baseUrl}/api/home?limit=1&verifiedOnly=true&ts=${Date.now()}`);
      if (result.status === 200 && result.data?.ok) return result;
      lastError = `status=${result.status} ok=${String(result.data?.ok)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await sleep(1_000);
  }

  throw new Error(`Timed out waiting for /api/home. Last error: ${lastError}`);
}

async function tryExistingApi(baseUrl) {
  try {
    const result = await fetchJson(`${baseUrl}/api/home?limit=1&verifiedOnly=true&ts=${Date.now()}`);
    return result.status === 200 && result.data?.ok ? result : null;
  } catch {
    return null;
  }
}

function buildMarkerDeal(sourceDeal) {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
  const finalUrl = sourceDeal.finalUrl || sourceDeal.finalPurchaseUrl || sourceDeal.productUrl || sourceDeal.purchaseUrl || sourceDeal.link;

  return {
    ...sourceDeal,
    id: markerToken,
    title: markerTitle,
    description: "실행 중인 서버가 refreshedDeals.json 변경을 즉시 읽는지 검증하기 위한 임시 항목입니다.",
    benefitSummary: "실시간 스냅샷 반영 검증",
    originalPrice: sourceDeal.originalPrice || 12_900,
    salePrice: sourceDeal.salePrice || 9_900,
    discountRate: sourceDeal.discountRate || 23,
    discountAmount: sourceDeal.discountAmount || 3_000,
    mallName: sourceDeal.mallName || sourceDeal.mall || "검증 쇼핑몰",
    mall: sourceDeal.mall || sourceDeal.mallName || "검증 쇼핑몰",
    category: sourceDeal.category || "생활용품",
    createdAt: now,
    updatedAt: now,
    verifiedAt: now,
    lastCheckedAt: now,
    expireAt: expiresAt,
    expiresAt,
    finalUrl,
    finalPurchaseUrl: sourceDeal.finalPurchaseUrl || finalUrl,
    productUrl: sourceDeal.productUrl || finalUrl,
    purchaseUrl: sourceDeal.purchaseUrl || finalUrl,
    link: sourceDeal.link || finalUrl,
    sourceUrl: sourceDeal.sourceUrl || finalUrl,
    originalUrl: sourceDeal.originalUrl || finalUrl,
    affiliateUrl: sourceDeal.affiliateUrl || "",
    linkType: "product",
    availability: "active",
    validationStatus: "passed",
    validationReason: "runtime snapshot refresh test",
    isHidden: false,
    publishable: true,
    verified: true,
    isSoldOut: false,
    isExpired: false,
    isHot: true,
    isFreeShipping: true,
    isEndingSoon: false,
    dealType: sourceDeal.dealType || "freeShipping",
    source: sourceDeal.source || "runtime-snapshot-test",
    sourceName: sourceDeal.sourceName || sourceDeal.mallName || sourceDeal.mall || "검증 쇼핑몰",
    qualityScore: Math.max(95, Number(sourceDeal.qualityScore ?? 0)),
    priorityScore: Math.max(95, Number(sourceDeal.priorityScore ?? 0)),
    imageType: ["official", "generated"].includes(sourceDeal.imageType) ? sourceDeal.imageType : "generated",
    imageUrl: sourceDeal.imageUrl || sourceDeal.thumbnail || "/deal-images/category-living.svg",
    thumbnail: sourceDeal.thumbnail || sourceDeal.imageUrl || "/deal-images/category-living.svg",
    tags: Array.from(new Set([...(Array.isArray(sourceDeal.tags) ? sourceDeal.tags : []), "실시간검증", markerToken]))
  };
}

function writeReport(port, baseUrl, details) {
  const failed = checks.filter((check) => !check.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    ok: failed.length === 0,
    totalChecks: checks.length,
    passedChecks: checks.length - failed.length,
    failedChecks: failed.length,
    markerToken,
    markerTitle,
    port,
    baseUrl,
    details,
    checks
  };
  const markdown = `# Home Runtime Snapshot Report

Generated: ${report.generatedAt}
Status: ${report.ok ? "PASS" : "FAIL"}
Runtime marker: \`${markerToken}\`

## Summary

| Check | Result | Detail |
| --- | --- | --- |
${checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${String(check.detail || "").replaceAll("|", "\\|")} |`).join("\n")}

## Policy

- \`data/refreshedDeals.json\` must be read at request time, not frozen at build time.
- \`/api/home\` must return no-store headers and reflect a newly collected verified deal without restarting the app.
- The temporary marker is restored immediately after the test, so production seed data is not changed by this doctor.
`;

  mkdirSync(join(root, "reports"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(docReportPath, markdown, "utf8");
}

async function main() {
  const originalSnapshotText = readFileSync(snapshotPath, "utf8");
  const snapshot = JSON.parse(originalSnapshotText);
  const deals = Array.isArray(snapshot.deals) ? snapshot.deals : [];
  const sourceDeal = deals.find((deal) => deal?.finalUrl && /^https?:\/\//.test(deal.finalUrl)) ?? deals[0];

  if (!sourceDeal) {
    fail("source deal available", "data/refreshedDeals.json에 기준으로 복제할 상품이 없습니다.");
    writeReport(0, "", {});
    process.exit(1);
  }

  const markerDeal = buildMarkerDeal(sourceDeal);
  const mutatedSnapshot = {
    ...snapshot,
    generatedAt: new Date().toISOString(),
    deals: [markerDeal, ...deals.filter((deal) => deal.id !== markerDeal.id)],
    visibleDealIds: [markerDeal.id, ...(Array.isArray(snapshot.visibleDealIds) ? snapshot.visibleDealIds.filter((id) => id !== markerDeal.id) : deals.map((deal) => deal.id))]
  };
  const npmCommand = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
  let port = 3000;
  let baseUrl = "http://localhost:3000";
  let ready = await tryExistingApi(baseUrl);
  if (!ready) {
    baseUrl = "http://127.0.0.1:3000";
    ready = await tryExistingApi(baseUrl);
  }
  const childLogs = [];

  if (!ready) {
    port = await findFreePort();
    baseUrl = `http://127.0.0.1:${port}`;
    const npmArgs =
      process.platform === "win32"
        ? ["/d", "/s", "/c", "npm", "run", "dev", "--", "-H", "127.0.0.1", "-p", String(port)]
        : ["run", "dev", "--", "-H", "127.0.0.1", "-p", String(port)];

    childProcess = spawn(npmCommand, npmArgs, {
      cwd: root,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    childProcess.stdout.on("data", (chunk) => childLogs.push(String(chunk)));
    childProcess.stderr.on("data", (chunk) => childLogs.push(String(chunk)));
  } else {
    childLogs.push("Using existing Next dev server at http://127.0.0.1:3000\n");
  }

  let details = {};

  try {
    ready = ready ?? (await waitForApi(baseUrl));
    if (/no-store/i.test(ready.cacheControl) && /no-cache/i.test(ready.cacheControl)) {
      pass("api no-store cache policy", ready.cacheControl);
    } else {
      fail("api no-store cache policy", `Cache-Control=${ready.cacheControl || "missing"}`);
    }

    const before = await fetchJson(`${baseUrl}/api/home?q=${encodeURIComponent(markerToken)}&limit=5&verifiedOnly=true&ts=${Date.now()}`);
    const beforeCount = Array.isArray(before.data?.deals) ? before.data.deals.length : 0;
    if (beforeCount === 0) {
      pass("marker absent before refresh", "임시 마커를 쓰기 전에는 홈 API 검색 결과에 나타나지 않습니다.");
    } else {
      fail("marker absent before refresh", `beforeCount=${beforeCount}`);
    }

    writeFileSync(snapshotPath, `${JSON.stringify(mutatedSnapshot, null, 2)}\n`, "utf8");
    await sleep(250);

    const after = await fetchJson(`${baseUrl}/api/home?q=${encodeURIComponent(markerToken)}&limit=5&verifiedOnly=true&ts=${Date.now()}`);
    const afterDeals = Array.isArray(after.data?.deals) ? after.data.deals : [];
    const marker = afterDeals.find((deal) => deal.id === markerDeal.id);
    if (marker?.title === markerTitle && marker?.publishable === true && marker?.validationStatus === "passed") {
      pass("marker visible after snapshot update", "서버 재시작 없이 refreshedDeals.json 변경이 /api/home에 즉시 반영됩니다.");
    } else {
      fail("marker visible after snapshot update", `afterIds=${afterDeals.map((deal) => deal.id).join(", ") || "none"}`);
    }

    writeFileSync(snapshotPath, originalSnapshotText, "utf8");
    await sleep(250);

    const restored = await fetchJson(`${baseUrl}/api/home?q=${encodeURIComponent(markerToken)}&limit=5&verifiedOnly=true&ts=${Date.now()}`);
    const restoredCount = Array.isArray(restored.data?.deals) ? restored.data.deals.length : 0;
    if (restoredCount === 0) {
      pass("marker removed after restore", "원본 스냅샷 복구 후 임시 항목이 홈 API에서 사라집니다.");
    } else {
      fail("marker removed after restore", `restoredCount=${restoredCount}`);
    }

    details = {
      beforeCount,
      afterCount: afterDeals.length,
      restoredCount,
      cacheControl: ready.cacheControl,
      serverLogTail: childLogs.join("").slice(-2000)
    };
  } catch (error) {
    writeFileSync(snapshotPath, originalSnapshotText, "utf8");
    fail("runtime snapshot mutation", error instanceof Error ? error.message : String(error));
    details = {
      serverLogTail: childLogs.join("").slice(-4000)
    };
  } finally {
    writeFileSync(snapshotPath, originalSnapshotText, "utf8");
    stopServer();
  }

  writeReport(port, baseUrl, details);

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length) {
    console.error(`Home runtime snapshot doctor failed: ${failed.length}/${checks.length}`);
    process.exit(1);
  }

  console.log(`Home runtime snapshot doctor passed: ${checks.length}/${checks.length}`);
}

await main();

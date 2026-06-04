import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { parseFeedUrlList } from "./feed-url-utils.mjs";

const root = process.cwd();
const managedFiles = [
  "data/refreshedNewsDeals.json",
  "reports/news-deals.json",
  "reports/feed-transition.json",
  "docs/FEED_TRANSITION_REPORT.md"
];
const feedEnvKeys = [
  "DEAL_NEWS_FEED_URLS",
  "DEAL_NEWS_RSS_URLS",
  "DEAL_EVENT_NEWS_FEED_URLS",
  "OFFICIAL_EVENT_FEED_URLS",
  "DEAL_EVENT_FEED_URLS",
  "PUBLIC_COUPON_FEED_URLS"
];

function backupFile(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : null;
}

function restoreFile(path, content) {
  const fullPath = join(root, path);
  if (content === null) {
    if (existsSync(fullPath)) rmSync(fullPath);
    return;
  }

  writeFileSync(fullPath, content, "utf8");
}

function buildEnv(overrides = {}) {
  const env = { ...process.env };
  for (const key of feedEnvKeys) env[key] = "";
  return { ...env, ...overrides };
}

function runNode(script, env) {
  return new Promise((resolve) => {
    const child = spawn("node", [script], {
      cwd: root,
      env,
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      resolve({ status: 1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", (status) => {
      resolve({ status, stdout, stderr });
    });
  });
}

function readReport() {
  return JSON.parse(readFileSync(join(root, "reports/news-deals.json"), "utf8"));
}

function readFeedTransitionReport() {
  return JSON.parse(readFileSync(join(root, "reports/feed-transition.json"), "utf8"));
}

function assert(condition, message, result) {
  if (condition) return;

  const details = result
    ? [
        `exit: ${result.status}`,
        result.stdout ? `stdout:\n${result.stdout}` : "",
        result.stderr ? `stderr:\n${result.stderr}` : ""
      ].filter(Boolean).join("\n")
    : "";
  throw new Error(`${message}${details ? `\n${details}` : ""}`);
}

function assertFeedUrlParser() {
  const parsed = parseFeedUrlList("https://feed.example/a.json?tags=mart,coupon, https://feed.example/b.rss");
  assert(parsed.length === 2, "feed URL parser should split comma-delimited URLs only at URL boundaries");
  assert(parsed[0] === "https://feed.example/a.json?tags=mart,coupon", "feed URL parser should preserve commas inside query values");
  assert(parsed[1] === "https://feed.example/b.rss", "feed URL parser should keep the second comma-delimited URL");

  const jsonArray = parseFeedUrlList("[\"https://feed.example/a.json\",\"https://feed.example/b.json\"]");
  assert(jsonArray.length === 2, "feed URL parser should support JSON array env values");

  const dataUrl = parseFeedUrlList("data:application/json;base64,eyJpdGVtcyI6W119");
  assert(dataUrl.length === 1 && dataUrl[0].includes("base64,"), "feed URL parser should preserve data URL payload commas");
}

function startFeedServer(sampleRaw) {
  const invalidPayload = "not-a-halindosa-feed";
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname === "/valid.json") {
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(sampleRaw);
      return;
    }

    if (pathname === "/broken.txt") {
      response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(invalidPayload);
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("missing");
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("failed_to_start_feed_server"));
        return;
      }

      resolve({
        validFeedUrl: `http://127.0.0.1:${address.port}/valid.json`,
        invalidFeedUrl: `http://127.0.0.1:${address.port}/broken.txt`,
        close: () => new Promise((closeResolve, closeReject) => server.close((error) => (error ? closeReject(error) : closeResolve())))
      });
    });
  });
}

const backups = Object.fromEntries(managedFiles.map((path) => [path, backupFile(path)]));
let feedServer = null;

try {
  assertFeedUrlParser();
  const sampleRaw = readFileSync(join(root, "data/newsFeed.sample.json"), "utf8");
  feedServer = await startFeedServer(sampleRaw);

  const validEnv = buildEnv({ DEAL_NEWS_FEED_URLS: `${feedServer.validFeedUrl}?tags=mart,coupon` });
  const validRefresh = await runNode("scripts/refresh-news-deals.mjs", validEnv);
  assert(validRefresh.status === 0, "configured valid DEAL_NEWS_FEED_URLS should refresh successfully", validRefresh);

  const validVerify = await runNode("scripts/verify-news-deals.mjs", validEnv);
  assert(validVerify.status === 0, "configured valid DEAL_NEWS_FEED_URLS should verify successfully", validVerify);

  const validReport = readReport();
  const validNewsProvider = validReport.providerStats?.find((provider) => provider.provider === "news");
  assert(validReport.ok === true, "valid configured feed should leave the news report passing");
  assert(Array.isArray(validReport.gates?.configuredFeedErrors), "valid report should expose configuredFeedErrors");
  assert(validReport.gates.configuredFeedErrors.length === 0, "valid configured feed should have zero configuredFeedErrors");
  assert(validNewsProvider?.configured === true, "valid configured feed should mark the news provider as configured");
  assert(Number(validNewsProvider?.errorCount ?? 999) === 0, "valid configured feed should have zero provider errors");

  const parserEnv = buildEnv({
    DEAL_NEWS_FEED_URLS: `${feedServer.validFeedUrl}?tags=mart,coupon`,
    PUBLIC_COUPON_FEED_URLS: `["${feedServer.validFeedUrl}/public-a.json","${feedServer.validFeedUrl}/public-b.json"]`
  });
  const feedTransition = await runNode("scripts/feed-transition-report.mjs", parserEnv);
  assert(feedTransition.status === 0, "feed transition report should accept shared feed URL parser inputs", feedTransition);

  const feedTransitionReport = readFeedTransitionReport();
  const transitionNewsProvider = feedTransitionReport.providers?.find((provider) => provider.provider === "news");
  const transitionCouponProvider = feedTransitionReport.providers?.find((provider) => provider.provider === "public_coupon");
  assert(transitionNewsProvider?.feedUrls === 1, "feed transition should preserve commas inside query values as one URL");
  assert(transitionCouponProvider?.feedUrls === 2, "feed transition should count JSON array feed URLs");

  const invalidEnv = buildEnv({ DEAL_NEWS_FEED_URLS: feedServer.invalidFeedUrl });
  const invalidRefresh = await runNode("scripts/refresh-news-deals.mjs", invalidEnv);
  assert(invalidRefresh.status === 0, "broken configured feed should not crash refresh because seed fallback remains available", invalidRefresh);

  const invalidVerify = await runNode("scripts/verify-news-deals.mjs", invalidEnv);
  assert(invalidVerify.status !== 0, "broken configured feed should fail verify:news through configuredFeedErrors", invalidVerify);

  const invalidReport = readReport();
  const invalidNewsProvider = invalidReport.providerStats?.find((provider) => provider.provider === "news");
  assert(invalidReport.ok === false, "broken configured feed should make the news report fail");
  assert(Array.isArray(invalidReport.gates?.configuredFeedErrors), "broken feed report should expose configuredFeedErrors");
  assert(invalidReport.gates.configuredFeedErrors.length > 0, "broken configured feed should produce configuredFeedErrors");
  assert(invalidReport.gates.configuredFeedErrors.some((provider) => provider.provider === "news"), "broken feed errors should include the news provider");
  assert(invalidNewsProvider?.configured === true, "broken configured feed should still mark the news provider as configured");
  assert(Number(invalidNewsProvider?.errorCount ?? 0) > 0, "broken configured feed should increment provider errorCount");

  console.log("PASS configured news feed error gate regression");
  console.log("- valid configured JSON feed passes refresh and verify");
  console.log("- broken configured feed fails verify:news via configuredFeedErrors");
  console.log("- data/refreshedNewsDeals.json and reports/news-deals.json were restored");
} finally {
  if (feedServer) await feedServer.close();
  for (const [path, content] of Object.entries(backups)) restoreFile(path, content);
}

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { writeJson } from "./news-deal-utils.mjs";

const root = process.cwd();
const generatedAt = new Date().toISOString();

function runStep(name, command, args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  return {
    name,
    command: `${command} ${args.join(" ")}`,
    ok: result.status === 0,
    status: result.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

const steps = [
  runStep("refresh:deals", process.execPath, ["scripts/refresh-deals.mjs"]),
  runStep("refresh:news", process.execPath, ["scripts/refresh-news-deals.mjs"]),
  runStep("verify:links", process.execPath, ["scripts/verify-product-links-live.mjs", "--body"]),
  runStep("verify:products", process.execPath, ["scripts/verify-products.mjs"]),
  runStep("verify:news", process.execPath, ["scripts/verify-news-deals.mjs"])
];

const refreshDeals = readJson("reports/refresh-deals.json", {});
const newsDeals = readJson("reports/news-deals.json", {});
const linkValidation = readJson("reports/link-validation.json", {});
const productQuality = readJson("reports/product-quality.json", {});
const ok = steps.every((step) => step.ok) && newsDeals.ok !== false;

const report = {
  ok,
  generatedAt,
  productDealsCount: productQuality.totalProducts ?? linkValidation.totalDeals ?? refreshDeals.totalCount ?? refreshDeals.visibleCount ?? 0,
  visibleProductDealsCount: productQuality.visibleProducts ?? linkValidation.visibleDeals ?? refreshDeals.visibleCount ?? 0,
  publishableProductDealsCount: linkValidation.exposureAudit?.publishableItems ?? productQuality.visibleProducts ?? refreshDeals.visibleCount ?? 0,
  hiddenProductDealsCount: productQuality.hiddenProducts ?? linkValidation.excludedDeals ?? refreshDeals.hiddenCount ?? 0,
  newsDealsCount: newsDeals.visibleCount ?? 0,
  insertedCount: (refreshDeals.insertedCount ?? 0) + (newsDeals.visibleCount ?? 0),
  updatedCount: refreshDeals.updatedCount ?? 0,
  hiddenCount: (refreshDeals.hiddenCount ?? 0) + (newsDeals.hiddenCount ?? 0),
  expiredCount: newsDeals.expiredCount ?? 0,
  failedCount: (refreshDeals.failedCount ?? 0) + (newsDeals.failedCount ?? 0),
  providerStats: {
    product: refreshDeals.providerStats ?? [],
    news: newsDeals.providerStats ?? []
  },
  linkQuality: linkValidation.summary ?? linkValidation,
  productQuality,
  newsQuality: newsDeals,
  steps
};

writeJson("reports/refresh-all.json", report);

for (const step of steps) {
  console.log(`${step.ok ? "PASS" : "FAIL"} ${step.name}`);
  if (!step.ok && step.stderr) console.error(step.stderr);
}

console.log("Refresh-all report written: reports/refresh-all.json");

if (!ok) {
  console.error("refresh:all failed. See reports/refresh-all.json");
  process.exit(1);
}

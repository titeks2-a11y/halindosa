import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportsDir = join(root, "reports");
mkdirSync(reportsDir, { recursive: true });

function runStep(name, args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  return {
    name,
    command: `node ${args.join(" ")}`,
    ok: result.status === 0,
    status: result.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function readReport(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

const steps = [
  runStep("link-validation", ["scripts/verify-product-links.mjs"]),
  runStep("product-quality", ["scripts/verify-products.mjs"])
];
const linkValidation = readReport("reports/link-validation.json");
const productQuality = readReport("reports/product-quality.json");
const summary = {
  generatedAt: new Date().toISOString(),
  pipeline: [
    "collect providers",
    "normalize urls",
    "trace redirects/static URL class",
    "remove search links",
    "detect sold-out/ended signals",
    "calculate priority score",
    "write reports",
    "expose only active validated deals"
  ],
  ok: steps.every((step) => step.ok),
  steps,
  reports: {
    linkValidation,
    productQuality
  }
};

writeFileSync(join(reportsDir, "refresh-deals.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

for (const step of steps) {
  const prefix = step.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${step.name}`);
  if (step.stdout) console.log(step.stdout);
  if (step.stderr) console.error(step.stderr);
}

if (!summary.ok) {
  console.error("Deal refresh pipeline failed. See reports/refresh-deals.json.");
  process.exit(1);
}

console.log("Deal refresh pipeline passed.");
console.log("- reports/link-validation.json");
console.log("- reports/product-quality.json");
console.log("- reports/refresh-deals.json");

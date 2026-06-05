import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const strict = args.includes("--strict") || process.env.DEAL_LINK_LIVE_STRICT === "true";
const bodyProbe = args.includes("--body") || process.env.DEAL_LINK_BODY_PROBE === "true";
const contentStrict = args.includes("--content-strict") || process.env.DEAL_LINK_CONTENT_STRICT === "true";
const timeoutMs = process.env.DEAL_LINK_TIMEOUT_MS ?? "5000";

const env = {
  ...process.env,
  DEAL_LINK_LIVE_PROBE: "true",
  DEAL_LINK_LIVE_STRICT: strict ? "true" : "false",
  DEAL_LINK_BODY_PROBE: bodyProbe ? "true" : "false",
  DEAL_LINK_CONTENT_STRICT: contentStrict ? "true" : "false",
  DEAL_LINK_TIMEOUT_MS: timeoutMs
};

if (dryRun) {
  console.log("Live product link verification is configured.");
  console.log(`- DEAL_LINK_LIVE_PROBE=${env.DEAL_LINK_LIVE_PROBE}`);
  console.log(`- DEAL_LINK_LIVE_STRICT=${env.DEAL_LINK_LIVE_STRICT}`);
  console.log(`- DEAL_LINK_BODY_PROBE=${env.DEAL_LINK_BODY_PROBE}`);
  console.log(`- DEAL_LINK_CONTENT_STRICT=${env.DEAL_LINK_CONTENT_STRICT}`);
  console.log(`- DEAL_LINK_TIMEOUT_MS=${env.DEAL_LINK_TIMEOUT_MS}`);
  console.log("- Pass --strict to fail on live HTTP failures.");
  console.log("- Pass --body to scan a small response body for sold-out, title/meta, price, and purchase/action signals.");
  console.log("- Pass --content-strict with --body to fail when an accessible body has no product/benefit match signal.");
  process.exit(0);
}

const result = spawnSync(process.execPath, [join(root, "scripts", "verify-product-links.mjs")], {
  cwd: root,
  env,
  stdio: "inherit"
});

process.exit(result.status ?? 1);

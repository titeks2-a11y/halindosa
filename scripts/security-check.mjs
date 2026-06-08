import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const reportPath = join(root, "reports", "security-check.json");
const docsPath = join(root, "docs", "SECURITY_CHECK_REPORT.md");
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".yml", ".yaml", ".example"]);
const excludedDirs = new Set([".git", ".next", "node_modules", "out", "android", "ios"]);
const secretPatterns = [
  /sk_live_[A-Za-z0-9]{16,}/,
  /AIza[0-9A-Za-z_-]{20,}/,
  /xox[baprs]-[0-9A-Za-z-]{20,}/,
  /SG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/
];
const requiredEnvKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "ADMIN_TOKEN",
  "ADMIN_EXPORT_TOKEN",
  "COUPANG_ACCESS_KEY",
  "COUPANG_SECRET_KEY",
  "NAVER_CLIENT_ID",
  "NAVER_CLIENT_SECRET",
  "ELEVENST_API_KEY",
  "BENEFIT_REFRESH_FEED_URLS",
  "BENEFIT_REFRESH_APPROVED_HOSTS",
  "HALINDOSA_APPROVED_FEED_HOSTS"
];

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (excludedDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path, files);
      continue;
    }
    const relativePath = relative(root, path).replace(/\\/g, "/");
    const extension = entry.name.includes(".env") ? ".example" : entry.name.slice(entry.name.lastIndexOf("."));
    if (!textExtensions.has(extension)) continue;
    if (statSync(path).size > 800_000) continue;
    files.push({ path, relativePath, source: read(path) });
  }
  return files;
}

function addCheck(checks, name, ok, detail) {
  checks.push({ name, ok, detail });
}

const packageJson = JSON.parse(read(join(root, "package.json")) || "{}");
const envExample = read(join(root, ".env.example"));
const freebiesApi = read(join(root, "app", "api", "freebies", "route.ts"));
const benefitEventsApi = read(join(root, "app", "api", "benefits", "events", "route.ts"));
const freeBenefitEvents = read(join(root, "lib", "freeBenefitEvents.ts"));
const newsLinkPolicy = read(join(root, "lib", "deals", "newsLinkPolicy.ts"));
const goNewsRoute = read(join(root, "app", "go", "news", "[id]", "route.ts"));
const cronRoute = read(join(root, "app", "api", "cron", "refresh", "route.ts"));
const harness = read(join(root, "scripts", "harness.mjs"));
const runQa = read(join(root, "scripts", "run-qa.mjs"));
const files = walk(root);
const checks = [];

const missingEnv = requiredEnvKeys.filter((key) => !new RegExp(`^${key}=`, "m").test(envExample));
addCheck(checks, "env example coverage", missingEnv.length === 0, missingEnv.length ? `Missing env keys: ${missingEnv.join(", ")}` : "Client/public and server-only env keys are documented.");

const packageScripts = packageJson.scripts ?? {};
const scriptIssues = [];
if (packageScripts["refresh:benefits"] !== "node scripts/refresh-benefits.mjs") scriptIssues.push("refresh:benefits");
if (packageScripts["verify:benefits"] !== "node scripts/verify-benefit-events.mjs") scriptIssues.push("verify:benefits");
if (packageScripts["security:check"] !== "node scripts/security-check.mjs") scriptIssues.push("security:check");
if (!String(packageScripts.qa ?? "").includes("security:check") && !runQa.includes('"security:check"')) scriptIssues.push("qa includes security:check");
if (!harness.includes('"security:check"')) scriptIssues.push("harness includes security:check");
addCheck(checks, "security scripts wired", scriptIssues.length === 0, scriptIssues.length ? `Missing script wiring: ${scriptIssues.join(", ")}` : "refresh:benefits, verify:benefits, and security:check are wired into QA/harness.");

addCheck(
  checks,
  "free benefit model",
  existsSync(join(root, "types", "freeBenefitEvent.ts")) &&
    freeBenefitEvents.includes("sanitizeBenefitText") &&
    freeBenefitEvents.includes("normalizeBenefitTitle") &&
    freeBenefitEvents.includes("isSafeBenefitEventUrl") &&
    freeBenefitEvents.includes("privateHostPattern"),
  "FreeBenefitEvent model, sanitizer, dedupe title normalizer, official URL guard, and SSRF private host guard are present."
);

addCheck(
  checks,
  "freebies api guard",
  freebiesApi.includes("rateLimit(") &&
    freebiesApi.includes("getClientKey(request, \"freebies\")") &&
    freebiesApi.includes("requestId") &&
    !freebiesApi.includes("error.message") &&
    freebiesApi.includes("FREEBIES_LOAD_FAILED"),
  "Public freebies API has rate limiting, request IDs, and generic error output."
);

addCheck(
  checks,
  "free benefit events api guard",
  benefitEventsApi.includes("rateLimit(") &&
    benefitEventsApi.includes("getClientKey(request, \"benefit-events\")") &&
    benefitEventsApi.includes("requestId") &&
    benefitEventsApi.includes("isPublishableFreeBenefitEvent") &&
    benefitEventsApi.includes("BENEFIT_EVENTS_LOAD_FAILED") &&
    benefitEventsApi.includes("mode: \"no-store\"") &&
    !benefitEventsApi.includes("error.message"),
  "Public free benefit event API has rate limiting, request IDs, publishable-only filtering, no-store cache policy, and generic error output."
);

addCheck(
  checks,
  "cron secret guard",
  cronRoute.includes("CRON_SECRET") && /authorization/i.test(cronRoute) && cronRoute.includes("x-cron-secret") && cronRoute.includes("rateLimit("),
  "Cron refresh route requires secret/admin auth and rate limit."
);

addCheck(
  checks,
  "official redirect allowlist",
  newsLinkPolicy.includes("approvedNewsHostList") &&
    newsLinkPolicy.includes("blockedNewsHosts") &&
    newsLinkPolicy.includes("searchPatterns") &&
    goNewsRoute.includes("resolveNewsDealDestinationUrl") &&
    goNewsRoute.includes("findVisibleNewsDealById"),
  "Official benefit redirects use visible deal lookup and approved-host destination policy."
);

const riskyHtml = files
  .filter((file) => file.relativePath.startsWith("app/") || file.relativePath.startsWith("components/") || file.relativePath.startsWith("lib/"))
  .filter((file) => file.source.includes("dangerouslySetInnerHTML"))
  .filter((file) => !(file.source.includes('type="application/ld+json"') && file.source.includes("replace(/</g")));
addCheck(checks, "xss rendering guard", riskyHtml.length === 0, riskyHtml.length ? `Unsafe dangerouslySetInnerHTML usage: ${riskyHtml.map((file) => file.relativePath).join(", ")}` : "No unsafe HTML rendering found; JSON-LD escapes '<'.");

const publicSecretLeaks = files
  .flatMap((file) => {
    const matches = [];
    const publicSecretRegex = /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|ADMIN|CRON|TOKEN)[A-Z0-9_]*/g;
    for (const match of file.source.matchAll(publicSecretRegex)) {
      matches.push(`${file.relativePath}:${match[0]}`);
    }
    return matches;
  })
  .filter((item) => !item.includes(".env.example:NEXT_PUBLIC_AUTH_REDIRECT_URL"));
addCheck(checks, "public env secret separation", publicSecretLeaks.length === 0, publicSecretLeaks.length ? `Suspicious NEXT_PUBLIC secret names: ${publicSecretLeaks.slice(0, 10).join(", ")}` : "No NEXT_PUBLIC server-secret style variables found.");

const hardcodedSecrets = [];
for (const file of files) {
  if (file.relativePath === ".env.example") continue;
  for (const pattern of secretPatterns) {
    if (pattern.test(file.source)) {
      hardcodedSecrets.push(file.relativePath);
      break;
    }
  }
}
addCheck(checks, "hardcoded secret scan", hardcodedSecrets.length === 0, hardcodedSecrets.length ? `Potential hardcoded secrets: ${hardcodedSecrets.slice(0, 15).join(", ")}` : "No common high-risk token patterns found in tracked source files.");

const failed = checks.filter((check) => !check.ok);
const report = {
  ok: failed.length === 0,
  generatedAt: new Date().toISOString(),
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  checks
};
const docs = `# Security Check Report

Generated: ${report.generatedAt}

| Metric | Value |
| --- | ---: |
| Checks | ${report.totalChecks} |
| Passed | ${report.passedChecks} |
| Failed | ${report.failedChecks} |

## Checks

${checks.map((check) => `- ${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`).join("\n")}
`;

mkdirSync(join(root, "reports"), { recursive: true });
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(docsPath, `${docs}\n`, "utf8");

if (failed.length) {
  console.error(`security:check failed: ${failed.map((check) => check.name).join(", ")}`);
  process.exit(1);
}

console.log(`security:check passed: ${report.passedChecks}/${report.totalChecks}`);

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const result =
  process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", "npm audit --json"], { encoding: "utf8" })
    : spawnSync("npm", ["audit", "--json"], { encoding: "utf8" });

const output = result.stdout || result.stderr;

if (!output) {
  console.error(result.error ? result.error.message : "npm audit produced no output");
  process.exit(1);
}

const auditJson = JSON.parse(output);
const vulnerabilities = auditJson.metadata?.vulnerabilities ?? {};
const high = vulnerabilities.high ?? 0;
const critical = vulnerabilities.critical ?? 0;
const total = vulnerabilities.total ?? 0;
const auditReport = [
  "# Commercial Audit Report",
  "",
  "This report records the non-secret npm audit summary used before commercial deployment.",
  "",
  "| Severity | Count |",
  "| --- | ---: |",
  `| critical | ${critical} |`,
  `| high | ${high} |`,
  `| moderate | ${vulnerabilities.moderate ?? 0} |`,
  `| low | ${vulnerabilities.low ?? 0} |`,
  `| info | ${vulnerabilities.info ?? 0} |`,
  `| total | ${total} |`,
  "",
  total === 0 ? "Status: PASS - no npm audit vulnerabilities remain." : "Status: FAIL - resolve npm audit vulnerabilities before commercial deployment.",
  ""
].join("\n");

writeFileSync(join(process.cwd(), "AUDIT_REPORT.md"), auditReport, "utf8");
mkdirSync(join(process.cwd(), "docs"), { recursive: true });
writeFileSync(join(process.cwd(), "docs", "AUDIT_REPORT.md"), auditReport, "utf8");

console.log(`Audit summary: total=${total}, high=${high}, critical=${critical}`);

if (total > 0) {
  console.error("All npm audit vulnerabilities must be resolved before commercial deployment.");
  process.exit(1);
}

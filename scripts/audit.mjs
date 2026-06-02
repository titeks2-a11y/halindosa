import { spawnSync } from "node:child_process";

const result =
  process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", "npm audit --json"], { encoding: "utf8" })
    : spawnSync("npm", ["audit", "--json"], { encoding: "utf8" });

const output = result.stdout || result.stderr;

if (!output) {
  console.error(result.error ? result.error.message : "npm audit produced no output");
  process.exit(1);
}

const report = JSON.parse(output);
const vulnerabilities = report.metadata?.vulnerabilities ?? {};
const high = vulnerabilities.high ?? 0;
const critical = vulnerabilities.critical ?? 0;
const total = vulnerabilities.total ?? 0;

console.log(`Audit summary: total=${total}, high=${high}, critical=${critical}`);

if (total > 0) {
  console.error("All npm audit vulnerabilities must be resolved before commercial deployment.");
  process.exit(1);
}

import fs from "node:fs";

const homePage = fs.readFileSync("app/page.tsx", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");
const smoke = fs.readFileSync("scripts/smoke.mjs", "utf8");
const runbook = fs.readFileSync("docs/RUNBOOK.md", "utf8");

const requiredSnippets = [
  "dealScanBarItems",
  "deals.filter(isVerifiedPurchaseLink).length",
  "deals.filter(isFreeShippingDeal).length",
  "deals.filter((deal) => deal.isHot).length",
  "setVerifiedOnly((current) => !current)",
  "setFreeShippingOnly((current) => !current)",
  "setHotOnly((current) => !current)",
  'setSort("price")',
  'setSort("discount")',
  'aria-label="상품 목록 빠른 스캔"',
  'aria-pressed={item.active}',
  "낮은 가격 후보",
  "할인율 최고"
];

const issues = [];

for (const snippet of requiredSnippets) {
  if (!homePage.includes(snippet)) {
    issues.push(`home list scan missing snippet: ${snippet}`);
  }
}

if (!smoke.includes("Home page missing product list scan shortcuts")) {
  issues.push("smoke test should assert product list scan shortcuts");
}

if (!packageJson.includes("home:list-scan:doctor")) {
  issues.push("package.json should expose home:list-scan:doctor");
}

if (!packageJson.includes("npm run home:list-scan:doctor")) {
  issues.push("qa script should run home:list-scan:doctor");
}

if (!runbook.includes("상품 목록 빠른 스캔")) {
  issues.push("RUNBOOK should document product list scan operation");
}

if (issues.length) {
  console.error("Home list scan doctor failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Home list scan doctor passed.");
console.log("- Product list scan shortcuts are wired to verified, free shipping, hot, price, and discount states.");
console.log("- Smoke and runbook coverage are present.");

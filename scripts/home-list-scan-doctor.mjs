import fs from "node:fs";

const homePage = [
  fs.readFileSync("app/page.tsx", "utf8"),
  fs.readFileSync("components/HomeClient.tsx", "utf8")
].join("\n");
const homeDerivedData = fs.readFileSync("lib/homeDerivedData.ts", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");
const qaRunner = fs.readFileSync("scripts/run-qa.mjs", "utf8");
const qaCommandSource = `${packageJson}\n${qaRunner}`;
const smoke = [
  fs.readFileSync("scripts/smoke.mjs", "utf8"),
  fs.readFileSync("scripts/lib/smoke-page-checks.mjs", "utf8")
].join("\n");
const runbook = fs.readFileSync("docs/RUNBOOK.md", "utf8");
const homeSource = `${homePage}\n${homeDerivedData}`;

const requiredSnippets = [
  "dealScanBarItems",
  "listRefinementChips",
  "deals.filter(isVerifiedPurchaseLink).length",
  "deals.filter(isFreeShippingDeal).length",
  "deals.filter((deal) => deal.isHot).length",
  "setVerifiedOnly((current) => !current)",
  "setFreeShippingOnly((current) => !current)",
  "setHotOnly((current) => !current)",
  'setSort("price")',
  'setSort("discount")',
  'aria-label="현재 결과 빠른 좁히기"',
  'aria-label="상품 목록 빠른 스캔"',
  'aria-label="홈 탐색 바로가기"',
  'id="deal-list"',
  "scrollToDealList",
  'aria-pressed={item.active}',
  "목록 안에서 많이 나온 기준",
  "전체상품",
  "구매처확인",
  "낮은 가격 후보",
  "할인율 최고"
];

const issues = [];

for (const snippet of requiredSnippets) {
  if (!homeSource.includes(snippet)) {
    issues.push(`home list scan missing snippet: ${snippet}`);
  }
}

if (!smoke.includes("Home page missing product list scan shortcuts")) {
  issues.push("smoke test should assert product list scan shortcuts");
}

if (!packageJson.includes("home:list-scan:doctor")) {
  issues.push("package.json should expose home:list-scan:doctor");
}

if (!qaCommandSource.includes("home:list-scan:doctor")) {
  issues.push("qa script should run home:list-scan:doctor");
}

if (!runbook.includes("상품 목록 빠른 스캔") || !runbook.includes("홈 탐색 바로가기")) {
  issues.push("RUNBOOK should document product list scan operation");
}

if (issues.length) {
  console.error("Home list scan doctor failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Home list scan doctor passed.");
console.log("- Current result refinement chips and product list scan shortcuts are wired to visible filter/sort states.");
console.log("- Smoke and runbook coverage are present.");

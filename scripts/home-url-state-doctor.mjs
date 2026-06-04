import fs from "node:fs";

const homePage = fs.readFileSync("app/page.tsx", "utf8");
const homeUrlState = fs.readFileSync("lib/homeUrlState.ts", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");
const smoke = [
  fs.readFileSync("scripts/smoke.mjs", "utf8"),
  fs.readFileSync("scripts/lib/smoke-page-checks.mjs", "utf8")
].join("\n");
const homeUrlSource = `${homePage}\n${homeUrlState}`;

const requiredUrlState = [
  {
    name: "category",
    read: ['params.get("category")', "setCategory(initialCategory)"],
    write: ['params.set("category", category)']
  },
  {
    name: "query",
    read: ['params.get("q")', "setQuery(initialQuery)"],
    write: ['params.set("q", query.trim())']
  },
  {
    name: "sort",
    read: ['params.get("sort")', "setSort(initialSort)"],
    write: ['params.set("sort", sort)']
  },
  {
    name: "freeShippingOnly",
    read: ['params.get("freeShipping") ?? params.get("freeShippingOnly")', "setFreeShippingOnly(true)"],
    write: ['params.set("freeShippingOnly", "true")']
  },
  {
    name: "hotOnly",
    read: ['params.get("hotOnly")', "setHotOnly(true)"],
    write: ['params.set("hotOnly", "true")']
  },
  {
    name: "endingSoonOnly",
    read: ['params.get("endingSoon") ?? params.get("endingSoonOnly")', "setEndingSoonOnly(true)"],
    write: ['params.set("endingSoonOnly", "true")']
  },
  {
    name: "verifiedOnly",
    read: ['params.get("verified") ?? params.get("verifiedOnly")', "setVerifiedOnly(true)"],
    write: ['params.set("verifiedOnly", "true")']
  },
  {
    name: "mall",
    read: ['params.get("mall")', "setMallFilter(initialMall)"],
    write: ['params.set("mall", mallFilter)']
  },
  {
    name: "priceBand",
    read: ['params.get("priceBand")', "setPriceBand(initialPriceBand)"],
    write: ['params.set("priceBand", priceBand)']
  },
  {
    name: "dealType",
    read: ['params.get("dealType")', "setBenefitFilter(initialBenefitType)"],
    write: ['params.set("dealType", benefitFilter)']
  }
];

const issues = [];

for (const item of requiredUrlState) {
  for (const snippet of item.read) {
    if (!homeUrlSource.includes(snippet)) issues.push(`${item.name}: missing URL restore snippet "${snippet}"`);
  }

  for (const snippet of item.write) {
    if (!homeUrlSource.includes(snippet)) issues.push(`${item.name}: missing URL persistence snippet "${snippet}"`);
  }
}

if (!homePage.includes("window.history.replaceState")) {
  issues.push("home URL state should use history.replaceState instead of hash scrolling or full reloads");
}

if (!homePage.includes("setHasAppliedInitialParams(true)")) {
  issues.push("home URL state should wait for initial params before fetching and persisting filters");
}

if (!smoke.includes("verifiedOnly=true") || !smoke.includes("구매링크 확인")) {
  issues.push("smoke test should cover restored verifiedOnly URL state");
}

if (!packageJson.includes("home:url-state:doctor")) {
  issues.push("package.json should expose home:url-state:doctor");
}

if (issues.length) {
  console.error("Home URL state doctor failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Home URL state doctor passed.");
console.log("- Home search/filter URL params are restored and persisted symmetrically.");
console.log("- verifiedOnly URL state is covered by smoke tests.");

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const defaultOrigin = "https://halindosa.com";
const origin = normalizeOrigin(process.env.VERCEL_DEPLOYMENT_URL || process.env.NEXT_PUBLIC_SITE_URL || defaultOrigin);
const apiHomePath = "/api/home?limit=8&verifiedOnly=true";
const apiDealsPath = "/api/deals?limit=8&verifiedOnly=true";
const apiFreebiesPath = "/api/freebies?limit=12";
const cronRefreshDryRunPath = "/api/cron/refresh?dryRun=true";
const cronBenefitsDryRunPath = "/api/cron/benefits?dryRun=true";
const redirectProbePath = "/go/d014?from=vercel-doctor";

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

function normalizeOrigin(value) {
  const input = String(value || defaultOrigin).trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(input)) return `https://${input}`;
  return input;
}

function run(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function getVercelProjectInfo() {
  const projectPath = join(root, ".vercel", "project.json");
  if (!existsSync(projectPath)) return { linked: false };

  try {
    const project = JSON.parse(readFileSync(projectPath, "utf8"));
    return {
      linked: true,
      orgIdPresent: Boolean(project.orgId),
      projectIdPresent: Boolean(project.projectId)
    };
  } catch {
    return { linked: false, invalidProjectJson: true };
  }
}

function isBadExternalUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const pathAndSearch = `${url.pathname}${url.search}`.toLowerCase();

    if (pathAndSearch === "/" || pathAndSearch === "" || pathAndSearch === "/main") return true;
    if (/community|ppomppu|fmkorea|quasarzone|clien|ruliweb|dcinside|blog\.naver|news\.naver/i.test(host)) return true;
    if (/\/search|\/np\/search|query=|keyword=|shopping\/search|msearch|result/i.test(pathAndSearch)) return true;
    return false;
  } catch {
    return true;
  }
}

function getDestinationUrl(item) {
  return String(item?.finalPurchaseUrl || item?.finalUrl || item?.purchaseUrl || item?.productUrl || item?.eventUrl || item?.affiliateUrl || item?.link || "").trim();
}

function hasRenderableImage(item) {
  const imageUrl = String(item?.thumbnail || item?.imageUrl || "").trim();
  if (!imageUrl) return false;
  if (imageUrl.startsWith("/deal-images/")) return true;
  if (imageUrl.startsWith("/images/")) return true;
  return /^https?:\/\//i.test(imageUrl);
}

function isPublishableProductDeal(deal) {
  const destination = getDestinationUrl(deal);

  return (
    deal?.publishable === true &&
    deal?.availability === "active" &&
    deal?.validationStatus === "passed" &&
    deal?.isHidden !== true &&
    Number(deal?.qualityScore ?? 0) >= 55 &&
    hasRenderableImage(deal) &&
    /^https?:\/\//i.test(destination) &&
    !isBadExternalUrl(destination)
  );
}

function isPublishableNewsDeal(deal) {
  const destination = getDestinationUrl(deal);

  return (
    deal?.publishable === true &&
    deal?.availability === "active" &&
    deal?.validationStatus === "passed" &&
    deal?.isHidden !== true &&
    Number(deal?.qualityScore ?? 0) >= 70 &&
    hasRenderableImage(deal) &&
    /^https?:\/\//i.test(destination) &&
    !isBadExternalUrl(destination)
  );
}

function isPublishableFreebie(item) {
  const destination = getDestinationUrl(item);
  const activeStatus = item?.status === "active" || item?.availability === "active";
  const explicitPublishable = item?.publishable !== false;

  return (
    activeStatus &&
    item?.validationStatus === "passed" &&
    item?.isHidden !== true &&
    explicitPublishable &&
    Number(item?.qualityScore ?? 0) >= 70 &&
    hasRenderableImage(item) &&
    /^https?:\/\//i.test(destination) &&
    !isBadExternalUrl(destination)
  );
}

function isPublicPolicyFreebie(item) {
  const text = [item?.title, item?.summary, item?.category, item?.benefitType, item?.sourceName, item?.brandName, item?.sourceType, item?.tags?.join?.(" ")].join(" ");
  return /정부|공공|지자체|복지|정책|지원사업|서울시|공공서비스|K-MOOC|케이무크|문화가\s*있는\s*날|HRD|정부24|복지로|publicFree|approved_public/i.test(text);
}

async function fetchText(path, options = {}) {
  const url = path.startsWith("http") ? path : `${origin}${path}`;
  const startedAt = Date.now();
  const response = await fetch(url, {
    method: "GET",
    redirect: options.redirect ?? "follow",
    headers: {
      "user-agent": "halindosa-vercel-deployment-doctor/1.0"
    },
    signal: AbortSignal.timeout(Number(process.env.VERCEL_DOCTOR_TIMEOUT_MS ?? 15000))
  });
  const text = await response.text();

  return {
    url,
    ok: response.ok,
    status: response.status,
    elapsedMs: Date.now() - startedAt,
    cacheControl: response.headers.get("cache-control") ?? "",
    contentType: response.headers.get("content-type") ?? "",
    location: response.headers.get("location") ?? "",
    xVercelId: response.headers.get("x-vercel-id") ?? "",
    bodyPreview: text.slice(0, 240),
    text
  };
}

function isSameDeploymentHost(value) {
  try {
    const target = new URL(value);
    const deployment = new URL(origin);
    const clean = (host) => host.replace(/^www\./, "").toLowerCase();
    return clean(target.hostname) === clean(deployment.hostname);
  } catch {
    return false;
  }
}

async function fetchRedirectChain(path) {
  const chain = [];
  let current = `${origin}${path}`;

  for (let index = 0; index < 5; index += 1) {
    const probe = await fetchText(current, { redirect: "manual" });
    chain.push({
      url: probe.url,
      status: probe.status,
      location: probe.location,
      cacheControl: probe.cacheControl,
      xVercelId: probe.xVercelId
    });

    if (![301, 302, 303, 307, 308].includes(probe.status) || !probe.location) {
      return { probe, chain, finalLocation: probe.location || current };
    }

    const next = new URL(probe.location, current).toString();
    if (!isSameDeploymentHost(next)) return { probe, chain, finalLocation: next };
    current = next;
  }

  return { probe: null, chain, finalLocation: current, exhausted: true };
}

function parseJsonProbe(probe) {
  try {
    return JSON.parse(probe.text);
  } catch {
    return null;
  }
}

function pass(name, detail) {
  return { name, ok: true, detail };
}

function fail(name, detail) {
  return { name, ok: false, detail };
}

const checks = [];
const probes = {};
const project = getVercelProjectInfo();
const branch = run("git", ["branch", "--show-current"]);
const commit = run("git", ["rev-parse", "--short", "HEAD"]);
const rawStatus = run("git", ["status", "--short"]);
const statusLines = rawStatus ? rawStatus.split(/\r?\n/).filter(Boolean) : [];
const status =
  statusLines.length === 0
    ? "clean"
    : `${statusLines.length} changed file(s): ${statusLines
        .slice(0, 8)
        .map((line) => line.trim())
        .join("; ")}${statusLines.length > 8 ? `; ... +${statusLines.length - 8} more` : ""}`;

probes.root = await fetchText("/");
checks.push(
  probes.root.ok && /text\/html/i.test(probes.root.contentType)
    ? pass("root page", `${probes.root.status} HTML response from ${origin}.`)
    : fail("root page", `Expected 200 HTML, got ${probes.root.status}.`)
);

probes.homeApi = await fetchText(apiHomePath);
const homeJson = parseJsonProbe(probes.homeApi);
checks.push(
  probes.homeApi.ok && homeJson?.ok === true
    ? pass("home api status", `/api/home returned 200 JSON with ok=true.`)
    : fail("home api status", `/api/home should return 200 JSON; got ${probes.homeApi.status}.`)
);
checks.push(
  /no-store/i.test(probes.homeApi.cacheControl)
    ? pass("home api no-store", `Cache-Control=${probes.homeApi.cacheControl}`)
    : fail("home api no-store", `/api/home should include no-store Cache-Control; got "${probes.homeApi.cacheControl || "(missing)"}".`)
);
checks.push(
  Array.isArray(homeJson?.deals) && homeJson.deals.length > 0
    ? pass("home api deals", `/api/home returned ${homeJson.deals.length} deals.`)
    : fail("home api deals", "/api/home did not return visible deals.")
);
checks.push(
  Array.isArray(homeJson?.newsDeals) && homeJson.newsDeals.length > 0
    ? pass("home api official benefits", `/api/home returned ${homeJson.newsDeals.length} official benefits/news deals.`)
    : fail("home api official benefits", "/api/home did not return visible official benefits/news deals.")
);
checks.push(
  homeJson?.cachePolicy?.mode === "no-store" && homeJson?.freshness?.generatedAt && homeJson?.freshness?.channels
    ? pass("home api realtime metadata", `/api/home exposes cachePolicy=no-store and channel freshness metadata.`)
    : fail("home api realtime metadata", "/api/home should expose cachePolicy=no-store and freshness.channels metadata.")
);
const homeDeals = Array.isArray(homeJson?.deals) ? homeJson.deals : [];
const homeNewsDeals = Array.isArray(homeJson?.newsDeals) ? homeJson.newsDeals : [];
const invalidHomeDeals = homeDeals.filter((deal) => !isPublishableProductDeal(deal));
const invalidHomeNewsDeals = homeNewsDeals.filter((deal) => !isPublishableNewsDeal(deal));
checks.push(
  invalidHomeDeals.length === 0
    ? pass("home product exposure policy", "No invalid, hidden, stale, search, homepage, community, low-quality, or image-less product deal leaked from /api/home.")
    : fail("home product exposure policy", `${invalidHomeDeals.length} invalid product deal(s) leaked from /api/home: ${invalidHomeDeals.map((deal) => deal.id).join(", ")}`)
);
checks.push(
  invalidHomeNewsDeals.length === 0
    ? pass("home official benefit exposure policy", "No invalid, hidden, stale, search, homepage, community, low-quality, or image-less official benefit leaked from /api/home.")
    : fail("home official benefit exposure policy", `${invalidHomeNewsDeals.length} invalid official benefit(s) leaked from /api/home: ${invalidHomeNewsDeals.map((deal) => deal.id).join(", ")}`)
);

probes.dealsApi = await fetchText(apiDealsPath);
const dealsJson = parseJsonProbe(probes.dealsApi);
const deals = Array.isArray(dealsJson?.deals) ? dealsJson.deals : [];
const invalidDeals = deals.filter((deal) => !isPublishableProductDeal(deal));
checks.push(
  probes.dealsApi.ok && deals.length > 0
    ? pass("deals api status", `/api/deals returned ${deals.length} verified deals.`)
    : fail("deals api status", `/api/deals should return verified deals; got ${probes.dealsApi.status}.`)
);
checks.push(
  invalidDeals.length === 0
    ? pass("deals publishable policy", "No search, homepage, community, sold-out, low-quality, image-less, or non-publishable deal leaked from /api/deals.")
    : fail("deals publishable policy", `${invalidDeals.length} invalid deal(s) leaked from /api/deals: ${invalidDeals.map((deal) => deal.id).join(", ")}`)
);

probes.freebiesApi = await fetchText(apiFreebiesPath);
const freebiesJson = parseJsonProbe(probes.freebiesApi);
const freebies = Array.isArray(freebiesJson?.freebies) ? freebiesJson.freebies : [];
const events = Array.isArray(freebiesJson?.events) ? freebiesJson.events : [];
const invalidFreebies = freebies.filter((item) => !isPublishableFreebie(item));
const invalidFreebieEvents = events.filter((item) => !isPublishableFreebie(item));
const publicPolicyFreebies = [...freebies, ...events].filter((item) => isPublicPolicyFreebie(item));
checks.push(
  probes.freebiesApi.ok && freebiesJson?.ok === true
    ? pass("freebies api status", `/api/freebies returned 200 JSON with ok=true.`)
    : fail("freebies api status", `/api/freebies should return 200 JSON; got ${probes.freebiesApi.status}.`)
);
checks.push(
  /no-store/i.test(probes.freebiesApi.cacheControl)
    ? pass("freebies api no-store", `Cache-Control=${probes.freebiesApi.cacheControl}`)
    : fail("freebies api no-store", `/api/freebies should include no-store Cache-Control; got "${probes.freebiesApi.cacheControl || "(missing)"}".`)
);
checks.push(
  freebies.length > 0 && events.length > 0
    ? pass("freebies api data", `/api/freebies returned ${freebies.length} freebie cards and ${events.length} event cards.`)
    : fail("freebies api data", "/api/freebies did not return visible freebie and event cards.")
);
checks.push(
  freebiesJson?.cachePolicy?.mode === "no-store" && freebiesJson?.freshnessLabel && freebiesJson?.nextRefreshAt
    ? pass("freebies api realtime metadata", `/api/freebies exposes cachePolicy=no-store, freshness label, and next refresh metadata.`)
    : fail("freebies api realtime metadata", "/api/freebies should expose no-store cache policy and freshness metadata.")
);
checks.push(
  invalidFreebies.length === 0 && invalidFreebieEvents.length === 0
    ? pass("freebies publishable policy", "No search, homepage, community, expired, hidden, low-quality, image-less, or non-publishable free benefit leaked from /api/freebies.")
    : fail(
        "freebies publishable policy",
        `${invalidFreebies.length + invalidFreebieEvents.length} invalid free benefit item(s) leaked from /api/freebies: ${[...invalidFreebies, ...invalidFreebieEvents]
          .map((item) => item.id)
          .join(", ")}`
      )
);
checks.push(
  publicPolicyFreebies.length === 0 && freebiesJson?.exposurePolicy?.publicPolicyBenefits === "excluded_from_default"
    ? pass("freebies consumer-first default policy", "Default /api/freebies response excludes public/policy benefits unless explicitly requested.")
    : fail(
        "freebies consumer-first default policy",
        `Default /api/freebies leaked ${publicPolicyFreebies.length} public/policy item(s) or did not expose the exclusion policy.`
      )
);

probes.cronRefreshGuard = await fetchText(cronRefreshDryRunPath);
checks.push(
  probes.cronRefreshGuard.status === 401
    ? pass("cron refresh public guard", "/api/cron/refresh rejects unauthenticated dry-run probes on the public deployment.")
    : fail("cron refresh public guard", `/api/cron/refresh should return 401 without CRON_SECRET or admin token; got ${probes.cronRefreshGuard.status}.`)
);

probes.cronBenefitsGuard = await fetchText(cronBenefitsDryRunPath);
checks.push(
  probes.cronBenefitsGuard.status === 401
    ? pass("cron benefits public guard", "/api/cron/benefits rejects unauthenticated dry-run probes on the public deployment.")
    : fail("cron benefits public guard", `/api/cron/benefits should return 401 without CRON_SECRET or admin token; got ${probes.cronBenefitsGuard.status}.`)
);

const redirectChain = await fetchRedirectChain(redirectProbePath);
probes.goRedirect = {
  ...(redirectChain.probe ?? {}),
  url: `${origin}${redirectProbePath}`,
  status: redirectChain.probe?.status ?? 0,
  location: redirectChain.finalLocation,
  chain: redirectChain.chain
};
checks.push(
  probes.goRedirect.location && !isSameDeploymentHost(probes.goRedirect.location)
    ? pass("go redirect status", `/go/d014 reached an external destination after ${redirectChain.chain.length} hop(s).`)
    : fail("go redirect status", `/go/d014 should reach an external verified destination; got ${probes.goRedirect.status}.`)
);
checks.push(
  probes.goRedirect.location && !isBadExternalUrl(probes.goRedirect.location)
    ? pass("go redirect destination", `Destination host=${new URL(probes.goRedirect.location).hostname}`)
    : fail("go redirect destination", `Bad or missing destination: ${probes.goRedirect.location || "(missing)"}`)
);

const firstOfficialBenefit = homeNewsDeals.find((deal) => typeof deal?.id === "string" && deal.id);
if (firstOfficialBenefit) {
  const officialRedirectChain = await fetchRedirectChain(`/go/news/${encodeURIComponent(firstOfficialBenefit.id)}?from=vercel-doctor`);
  probes.officialBenefitRedirect = {
    ...(officialRedirectChain.probe ?? {}),
    url: `${origin}/go/news/${firstOfficialBenefit.id}?from=vercel-doctor`,
    status: officialRedirectChain.probe?.status ?? 0,
    location: officialRedirectChain.finalLocation,
    chain: officialRedirectChain.chain
  };
  checks.push(
    probes.officialBenefitRedirect.location && !isSameDeploymentHost(probes.officialBenefitRedirect.location)
      ? pass("official benefit redirect status", `/go/news/${firstOfficialBenefit.id} reached an external official destination after ${officialRedirectChain.chain.length} hop(s).`)
      : fail("official benefit redirect status", `/go/news/${firstOfficialBenefit.id} should reach an external official destination; got ${probes.officialBenefitRedirect.status}.`)
  );
  checks.push(
    probes.officialBenefitRedirect.location && !isBadExternalUrl(probes.officialBenefitRedirect.location)
      ? pass("official benefit redirect destination", `Destination host=${new URL(probes.officialBenefitRedirect.location).hostname}`)
      : fail("official benefit redirect destination", `Bad or missing official benefit destination: ${probes.officialBenefitRedirect.location || "(missing)"}`)
  );
} else {
  checks.push(fail("official benefit redirect status", "/api/home did not expose an official benefit id to probe through /go/news."));
}

const ok = checks.every((check) => check.ok);
const report = {
  ok,
  generatedAt: new Date().toISOString(),
  origin,
  branch,
  commit,
  workingTree: status,
  workingTreeChangedFileCount: statusLines.length,
  project,
  environment: {
    vercelTokenPresent: Boolean(process.env.VERCEL_TOKEN),
    vercelOrgIdPresent: Boolean(process.env.VERCEL_ORG_ID),
    vercelProjectIdPresent: Boolean(process.env.VERCEL_PROJECT_ID)
  },
  summary: {
    totalChecks: checks.length,
    passedChecks: checks.filter((check) => check.ok).length,
    failedChecks: checks.filter((check) => !check.ok).length,
    rootStatus: probes.root.status,
    homeApiStatus: probes.homeApi.status,
    dealsApiStatus: probes.dealsApi.status,
    freebiesApiStatus: probes.freebiesApi.status,
    goRedirectStatus: probes.goRedirect.status,
    officialBenefitRedirectStatus: probes.officialBenefitRedirect?.status ?? 0,
    homeApiCacheControl: probes.homeApi.cacheControl,
    freebiesApiCacheControl: probes.freebiesApi.cacheControl,
    cronRefreshGuardStatus: probes.cronRefreshGuard.status,
    cronBenefitsGuardStatus: probes.cronBenefitsGuard.status,
    homeProductDeals: homeDeals.length,
    homeOfficialBenefits: homeNewsDeals.length,
    freebies: freebies.length,
    freebieEvents: events.length,
    publicPolicyFreebies: publicPolicyFreebies.length
  },
  checks,
  probes: Object.fromEntries(
    Object.entries(probes).map(([key, probe]) => [
      key,
      {
        url: probe.url,
        status: probe.status,
        ok: probe.ok,
        elapsedMs: probe.elapsedMs,
        cacheControl: probe.cacheControl,
        contentType: probe.contentType,
        location: probe.location,
        redirectChain: probe.chain ?? undefined,
        xVercelId: probe.xVercelId,
        bodyPreview: probe.bodyPreview
      }
    ])
  )
};

const rows = checks.map((check) => `| ${check.ok ? "PASS" : "FAIL"} | ${check.name} | ${check.detail.replace(/\|/g, "\\|")} |`).join("\n");
const markdown = `# Vercel Deployment Doctor

Generated: ${report.generatedAt}

Status: ${ok ? "PASS" : "BLOCKED"}

## Target

- Origin: \`${origin}\`
- Branch: \`${branch}\`
- Commit: \`${commit}\`
- Working tree: ${status}
- Vercel project linked locally: ${project.linked ? "yes" : "no"}
- Vercel token present in shell: ${process.env.VERCEL_TOKEN ? "yes" : "no"}

## Summary

- Checks: ${report.summary.passedChecks}/${report.summary.totalChecks}
- Root: ${report.summary.rootStatus}
- Home API: ${report.summary.homeApiStatus}
- Deals API: ${report.summary.dealsApiStatus}
- Freebies API: ${report.summary.freebiesApiStatus}
- /go redirect: ${report.summary.goRedirectStatus}
- Official benefit /go redirect: ${report.summary.officialBenefitRedirectStatus}
- Home API Cache-Control: \`${report.summary.homeApiCacheControl || "(missing)"}\`
- Freebies API Cache-Control: \`${report.summary.freebiesApiCacheControl || "(missing)"}\`
- Cron refresh public guard: ${report.summary.cronRefreshGuardStatus}
- Cron benefits public guard: ${report.summary.cronBenefitsGuardStatus}
- Home product deals checked: ${report.summary.homeProductDeals}
- Home official benefits checked: ${report.summary.homeOfficialBenefits}
- Freebies checked: ${report.summary.freebies}
- Freebie events checked: ${report.summary.freebieEvents}
- Public/policy freebies in default response: ${report.summary.publicPolicyFreebies}

## Checks

| Result | Check | Detail |
| --- | --- | --- |
${rows}

## Required Fix If Blocked

If \`/api/home\` returns 404 while the root page returns 200, the public domain is serving an older/static deployment. Link this GitHub repository to the Vercel project, set Framework Preset to Next.js, Build Command to \`npm run build\`, leave Output Directory empty, configure production environment variables, and redeploy \`main\`.
`;

writeFileSync(join(reportsDir, "vercel-deployment.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "VERCEL_DEPLOYMENT_REPORT.md"), markdown, "utf8");

if (!ok) {
  console.error("Vercel deployment doctor blocked.");
  for (const check of checks.filter((item) => !item.ok)) {
    console.error(`- ${check.name}: ${check.detail}`);
  }
  console.error("- reports/vercel-deployment.json");
  console.error("- docs/VERCEL_DEPLOYMENT_REPORT.md");
  process.exit(1);
}

console.log("Vercel deployment doctor passed.");
console.log(`- Origin: ${origin}`);
console.log(`- Checks: ${report.summary.passedChecks}/${report.summary.totalChecks}`);
console.log(`- Home API Cache-Control: ${report.summary.homeApiCacheControl}`);
console.log("- reports/vercel-deployment.json");
console.log("- docs/VERCEL_DEPLOYMENT_REPORT.md");

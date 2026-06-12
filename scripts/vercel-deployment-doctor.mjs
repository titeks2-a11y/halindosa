import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const defaultOrigin = "https://halindosa.com";
const origin = normalizeOrigin(process.env.VERCEL_DEPLOYMENT_URL || process.env.NEXT_PUBLIC_SITE_URL || defaultOrigin);
const canonicalOrigins = getCanonicalOrigins(origin);
const apiHomePath = "/api/home?limit=8&verifiedOnly=true";
const apiHealthPath = "/api/health";
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

function getCanonicalOrigins(primaryOrigin) {
  return Array.from(new Set([primaryOrigin, "https://halindosa.com", "https://www.halindosa.com"].map(normalizeOrigin)));
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
  if (item?.benefitType === "publicFree" || item?.benefitType === "public_free" || item?.benefitType === "education") return true;
  const text = [item?.title, item?.summary, item?.category, item?.sourceName, item?.brandName, item?.tags?.join?.(" ")].join(" ");
  return /정부|공공|지자체|복지|정책|지원사업|서울시|공공서비스|K-MOOC|케이무크|문화가\s*있는\s*날|HRD|정부24|복지로/i.test(text);
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
    contentSecurityPolicy: response.headers.get("content-security-policy") ?? "",
    strictTransportSecurity: response.headers.get("strict-transport-security") ?? "",
    xFrameOptions: response.headers.get("x-frame-options") ?? "",
    xContentTypeOptions: response.headers.get("x-content-type-options") ?? "",
    referrerPolicy: response.headers.get("referrer-policy") ?? "",
    permissionsPolicy: response.headers.get("permissions-policy") ?? "",
    requestId: response.headers.get("x-request-id") ?? "",
    rateLimitRemaining: response.headers.get("x-ratelimit-remaining") ?? "",
    location: response.headers.get("location") ?? "",
    xVercelId: response.headers.get("x-vercel-id") ?? "",
    bodyPreview: text.slice(0, 240),
    text
  };
}

async function fetchJsonFromOrigin(candidateOrigin, path) {
  const target = `${candidateOrigin}${path}`;
  try {
    const probe = await fetchText(target);
    const body = parseJsonProbe(probe);
    return {
      origin: candidateOrigin,
      status: probe.status,
      ok: probe.ok,
      requestId: probe.requestId,
      rateLimitRemaining: probe.rateLimitRemaining,
      cacheControl: probe.cacheControl,
      xVercelId: probe.xVercelId,
      bodyOk: body?.ok === true,
      bodyRequestId: body?.requestId ?? "",
      bodyPreview: probe.bodyPreview
    };
  } catch (error) {
    return {
      origin: candidateOrigin,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function hasLiveApiContract(row) {
  return Boolean(row?.ok && row?.bodyOk === true && row?.bodyRequestId && row?.requestId && row?.rateLimitRemaining && /no-store/i.test(row?.cacheControl || ""));
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
const expectedDeployCommit = String(process.env.EXPECTED_DEPLOY_COMMIT || "").trim();
const requireDeployCommit = /^(1|true|yes)$/i.test(String(process.env.REQUIRE_DEPLOY_COMMIT || ""));
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
checks.push(
  /default-src 'self'/i.test(probes.root.contentSecurityPolicy) &&
    /frame-ancestors 'none'/i.test(probes.root.contentSecurityPolicy) &&
    /object-src 'none'/i.test(probes.root.contentSecurityPolicy) &&
    /max-age=63072000/i.test(probes.root.strictTransportSecurity) &&
    probes.root.xFrameOptions === "DENY" &&
    probes.root.xContentTypeOptions === "nosniff" &&
    /strict-origin-when-cross-origin/i.test(probes.root.referrerPolicy) &&
    /camera=\(\)/i.test(probes.root.permissionsPolicy)
    ? pass("root security headers", "Production HTML response includes CSP, HSTS, frame, MIME, referrer, and permissions headers.")
    : fail("root security headers", "Production HTML response is missing one or more required security headers.")
);
const rootHtml = probes.root.text;
const rootOfficialBenefitLinks = (rootHtml.match(/href="\/go\/news\//g) ?? []).length;
const rootClaimConditionLabels = ["쿠폰 받기", "무료 혜택", "샘플 신청", "무료체험", "기프티콘", "포인트 적립", "가입 혜택", "조건 확인"].filter((label) =>
  rootHtml.includes(label)
);
const rootVisibleRenderOk = !rootHtml.includes('id="S:0"') && !rootHtml.includes("할인도사 화면을 불러오는 중");
checks.push(
  rootVisibleRenderOk
    ? pass("root free benefit visible render", "Production homepage renders real free-benefit cards without a hidden streamed shell or sticky loading fallback.")
    : fail("root free benefit visible render", "Production homepage should not ship hidden streamed content or the global loading fallback to customers.")
);
checks.push(
  rootHtml.includes("무료혜택 메인") && rootHtml.includes("실시간 검증됨") && rootOfficialBenefitLinks >= 3
    ? pass("root free benefit hero", `Production homepage renders the free-benefit-first hero with ${rootOfficialBenefitLinks} official benefit links.`)
    : fail("root free benefit hero", "Production homepage should render the free-benefit-first hero, realtime verification copy, and /go/news official benefit links.")
);
checks.push(
  rootHtml.includes("검증 ") && rootClaimConditionLabels.length >= 1
    ? pass("root free benefit claim badges", `Production homepage renders visible verification time and claim-condition labels: ${rootClaimConditionLabels.join(", ")}.`)
    : fail("root free benefit claim badges", "Production homepage should show visible verification time and customer-facing claim-condition labels on official benefit cards.")
);

probes.homeApi = await fetchText(apiHomePath);
const homeJson = parseJsonProbe(probes.homeApi);
probes.healthApi = await fetchText(apiHealthPath);
const healthJson = parseJsonProbe(probes.healthApi);
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
checks.push(
  homeJson?.requestId && probes.homeApi.requestId && probes.homeApi.rateLimitRemaining
    ? pass("home api abuse guard", "/api/home exposes requestId and rate-limit headers on the public deployment.")
    : fail("home api abuse guard", "/api/home is not serving the latest requestId/rate-limit contract; production may be stale.")
);
checks.push(
  healthJson?.checks?.homepageVisibleRenderGuard === true && healthJson?.checks?.homepageLoadingFallbackBlocked === true
    ? pass("health homepage render guard", "/api/health confirms the homepage visible-render guard is active in the deployed runtime.")
    : fail("health homepage render guard", "/api/health should confirm homepageVisibleRenderGuard and homepageLoadingFallbackBlocked before the app is considered current.")
);
checks.push(
  healthJson?.checks?.freeBenefitRankingOk === true &&
    Number(healthJson?.checks?.freeBenefitClaimReadyCount ?? 0) >= 40 &&
    Number(healthJson?.checks?.freeBenefitTopClaimReadyCount ?? 0) >= 16 &&
    Number(healthJson?.checks?.freeBenefitTopTypeDiversity ?? 0) >= 7 &&
    Number(healthJson?.checks?.freeBenefitExactDuplicateGroupCount ?? 1) === 0 &&
    Number(healthJson?.checks?.freeBenefitRecentlyCheckedCount ?? 0) >= 120 &&
    Number(healthJson?.checks?.freeBenefitStaleCheckedCount ?? 1) === 0 &&
    Number(healthJson?.checks?.freeBenefitMissingCheckedAtCount ?? 1) === 0 &&
    Number(healthJson?.checks?.freeBenefitOfficialHostDiversity ?? 0) >= 80
    ? pass(
        "health claim-ready benefit ranking",
        `/api/health confirms claim-ready free-benefit quality: ${healthJson.checks.freeBenefitClaimReadyCount} claim-ready, ${healthJson.checks.freeBenefitTopClaimReadyCount} top easy-claim, ${healthJson.checks.freeBenefitTopTypeDiversity} top types, ${healthJson.checks.freeBenefitRecentlyCheckedCount} recently checked.`
      )
    : fail("health claim-ready benefit ranking", "/api/health should expose passing freeBenefitRankingOk, claim-ready count, easy first-screen count, type diversity, zero exact duplicates, recent verification, zero stale checks, and official host diversity.")
);
checks.push(
  healthJson?.checks?.officialSourceFeedActivationOk === true &&
    ["seed_ready", "live_feed_ready"].includes(healthJson?.checks?.officialSourceFeedActivationStatus) &&
    Number(healthJson?.checks?.officialSourceFeedActivationPassedChecks ?? -1) === Number(healthJson?.checks?.officialSourceFeedActivationTotalChecks ?? -2) &&
    Number(healthJson?.checks?.officialSourceFeedEnvRecommendedLaneCount ?? 0) >= 8 &&
    Number(healthJson?.checks?.officialSourceVisibleOfficialBenefits ?? 0) >= 95 &&
    Number(healthJson?.checks?.officialSourceConsumerSourceRate ?? 0) >= 60 &&
    Number(healthJson?.checks?.officialSourcePublicPolicySourceRate ?? 100) <= 35
    ? pass(
        "health free benefit source activation",
        `/api/health confirms official free-benefit source activation is ${healthJson.checks.officialSourceFeedActivationStatus}, checks ${healthJson.checks.officialSourceFeedActivationPassedChecks}/${healthJson.checks.officialSourceFeedActivationTotalChecks}, ${healthJson.checks.officialSourceFeedEnvRecommendedLaneCount} recommended lanes.`
      )
    : fail(
        "health free benefit source activation",
        "/api/health should expose passing officialSourceFeedActivationOk, safe activation status, passing activation checks, recommended feed lanes, visible official benefit count, and consumer-first source mix."
      )
);
const deployedCommit =
  String(homeJson?.deployment?.commit || healthJson?.deployment?.commit || "").trim();
const deployedShortCommit =
  String(homeJson?.deployment?.shortCommit || healthJson?.deployment?.shortCommit || "").trim();
const expectedShortCommit = expectedDeployCommit.slice(0, 8);
checks.push(
  deployedCommit || deployedShortCommit
    ? pass("deployment commit metadata", `Public APIs expose deployed commit ${deployedShortCommit || deployedCommit.slice(0, 8)}.`)
    : requireDeployCommit
      ? fail("deployment commit metadata", "/api/home or /api/health must expose deployment.commit before production verification can prove the latest commit is live.")
      : pass("deployment commit metadata", "Deployment commit metadata is not available on this public deployment yet; strict commit verification is disabled.")
);
if (expectedDeployCommit || requireDeployCommit) {
  const matchesExpected =
    Boolean(expectedShortCommit) &&
    (deployedCommit.startsWith(expectedShortCommit) ||
      deployedShortCommit === expectedShortCommit ||
      expectedDeployCommit.startsWith(deployedShortCommit));
  checks.push(
    matchesExpected
      ? pass("deployed commit matches expected", `Expected ${expectedShortCommit}; public deployment reports ${deployedShortCommit || deployedCommit.slice(0, 8)}.`)
      : fail(
          "deployed commit matches expected",
          `Expected deployed commit ${expectedShortCommit || "(missing)"}, but public deployment reports ${deployedShortCommit || deployedCommit || "(missing)"}.`
        )
  );
}
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
  dealsJson?.requestId && probes.dealsApi.requestId && probes.dealsApi.rateLimitRemaining
    ? pass("deals api abuse guard", "/api/deals exposes requestId and rate-limit headers on the public deployment.")
    : fail("deals api abuse guard", "/api/deals is not serving the latest requestId/rate-limit contract; production may be stale.")
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
  freebiesJson?.requestId && probes.freebiesApi.requestId && probes.freebiesApi.rateLimitRemaining
    ? pass("freebies api abuse guard", "/api/freebies exposes requestId and rate-limit headers on the public deployment.")
    : fail("freebies api abuse guard", "/api/freebies is not serving requestId/rate-limit headers.")
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

probes.canonicalOriginApis = {
  url: canonicalOrigins.join(", "),
  status: 0,
  ok: false,
  rows: []
};
for (const candidateOrigin of canonicalOrigins) {
  const [homeRow, dealsRow, freebiesRow] = await Promise.all([
    fetchJsonFromOrigin(candidateOrigin, `${apiHomePath}&originProbe=canonical`),
    fetchJsonFromOrigin(candidateOrigin, `${apiDealsPath}&originProbe=canonical`),
    fetchJsonFromOrigin(candidateOrigin, `${apiFreebiesPath}&originProbe=canonical`)
  ]);
  probes.canonicalOriginApis.rows.push({ origin: candidateOrigin, home: homeRow, deals: dealsRow, freebies: freebiesRow });
}
probes.canonicalOriginApis.ok = probes.canonicalOriginApis.rows.every(
  (row) => hasLiveApiContract(row.home) && hasLiveApiContract(row.deals) && hasLiveApiContract(row.freebies)
);
checks.push(
  probes.canonicalOriginApis.ok
    ? pass("canonical production api contracts", `Apex/www production APIs expose requestId, rate-limit headers, and no-store responses on ${canonicalOrigins.length} origin(s).`)
    : fail(
        "canonical production api contracts",
        `At least one production origin is stale or missing requestId/rate-limit headers: ${probes.canonicalOriginApis.rows
          .filter((row) => !hasLiveApiContract(row.home) || !hasLiveApiContract(row.deals) || !hasLiveApiContract(row.freebies))
          .map((row) => row.origin)
          .join(", ")}`
      )
);

probes.cronRefreshGuard = await fetchText(cronRefreshDryRunPath);
checks.push(
  probes.cronRefreshGuard.status === 401 || probes.cronRefreshGuard.status === 429
    ? pass("cron refresh public guard", `/api/cron/refresh rejects unauthenticated dry-run probes on the public deployment with ${probes.cronRefreshGuard.status}.`)
    : fail("cron refresh public guard", `/api/cron/refresh should reject unauthenticated probes with 401 or rate-limit with 429; got ${probes.cronRefreshGuard.status}.`)
);

probes.cronBenefitsGuard = await fetchText(cronBenefitsDryRunPath);
checks.push(
  probes.cronBenefitsGuard.status === 401 || probes.cronBenefitsGuard.status === 429
    ? pass("cron benefits public guard", `/api/cron/benefits rejects unauthenticated dry-run probes on the public deployment with ${probes.cronBenefitsGuard.status}.`)
    : fail("cron benefits public guard", `/api/cron/benefits should reject unauthenticated probes with 401 or rate-limit with 429; got ${probes.cronBenefitsGuard.status}.`)
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
    healthApiStatus: probes.healthApi.status,
    homeApiRequestId: probes.homeApi.requestId,
    deployedCommit: deployedShortCommit || (deployedCommit ? deployedCommit.slice(0, 8) : ""),
    expectedDeployCommit: expectedShortCommit,
    dealsApiRequestId: probes.dealsApi.requestId,
    freebiesApiRequestId: probes.freebiesApi.requestId,
    goRedirectStatus: probes.goRedirect.status,
    officialBenefitRedirectStatus: probes.officialBenefitRedirect?.status ?? 0,
    homeApiCacheControl: probes.homeApi.cacheControl,
    freebiesApiCacheControl: probes.freebiesApi.cacheControl,
    cronRefreshGuardStatus: probes.cronRefreshGuard.status,
    cronBenefitsGuardStatus: probes.cronBenefitsGuard.status,
    canonicalOriginCount: probes.canonicalOriginApis.rows.length,
    canonicalOriginContractPassed: probes.canonicalOriginApis.ok,
    rootOfficialBenefitLinks,
    rootClaimConditionLabels: rootClaimConditionLabels.length,
    rootVisibleRenderOk,
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
        contentSecurityPolicy: probe.contentSecurityPolicy,
        strictTransportSecurity: probe.strictTransportSecurity,
        xFrameOptions: probe.xFrameOptions,
        xContentTypeOptions: probe.xContentTypeOptions,
        referrerPolicy: probe.referrerPolicy,
        permissionsPolicy: probe.permissionsPolicy,
        requestId: probe.requestId,
        rateLimitRemaining: probe.rateLimitRemaining,
        deploymentCommit: probe.deploymentCommit,
        location: probe.location,
        redirectChain: probe.chain ?? undefined,
        xVercelId: probe.xVercelId,
        bodyPreview: probe.bodyPreview,
        rows: probe.rows
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
- Health API: ${report.summary.healthApiStatus}
- Deployed commit: ${report.summary.deployedCommit || "(missing)"}
- Expected deploy commit: ${report.summary.expectedDeployCommit || "(not enforced)"}
- Home API Request ID: ${report.summary.homeApiRequestId || "(missing)"}
- Deals API Request ID: ${report.summary.dealsApiRequestId || "(missing)"}
- Freebies API Request ID: ${report.summary.freebiesApiRequestId || "(missing)"}
- /go redirect: ${report.summary.goRedirectStatus}
- Official benefit /go redirect: ${report.summary.officialBenefitRedirectStatus}
- Home API Cache-Control: \`${report.summary.homeApiCacheControl || "(missing)"}\`
- Freebies API Cache-Control: \`${report.summary.freebiesApiCacheControl || "(missing)"}\`
- Cron refresh public guard: ${report.summary.cronRefreshGuardStatus}
- Cron benefits public guard: ${report.summary.cronBenefitsGuardStatus}
- Canonical production API contracts: ${report.summary.canonicalOriginContractPassed ? "passed" : "blocked"} (${report.summary.canonicalOriginCount} origin(s))
- Root free-benefit visible render: ${report.summary.rootVisibleRenderOk ? "passed" : "blocked"}
- Root official benefit links: ${report.summary.rootOfficialBenefitLinks}
- Root claim-condition label types: ${report.summary.rootClaimConditionLabels}
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

If \`/api/home\` is missing \`requestId\`, \`X-Request-Id\`, or \`X-RateLimit-Remaining\`, the public domain is serving an older deployment even if GitHub Actions reported a green deploy. Link this GitHub repository to the Vercel project, set Framework Preset to Next.js, Build Command to \`npm run build\`, leave Output Directory empty, configure production environment variables, and redeploy \`main\`.
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

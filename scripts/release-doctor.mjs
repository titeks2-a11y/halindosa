import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checks, fail, fileSize, homeSource, pass, root, run, smokeSource, smokeSourceSync, text, withQaRunnerScripts } from "./lib/release-doctor-harness.mjs";
import { checkSigningAndArtifacts, checkStoreAssets } from "./lib/release-doctor-native-assets.mjs";
import { checkNewsDealPipeline } from "./lib/release-doctor-news-pipeline.mjs";
import { checkUiAccessibility } from "./lib/release-doctor-ui-accessibility.mjs";
import { checkOperationalDataSurfaces } from "./lib/release-doctor-operational-data.mjs";

const MIN_OFFICIAL_BENEFITS = 95;

function isCiNetworkAdvisoryOnlySourceReadiness(sourceReadiness = {}) {
  const failedGateCount = Number(sourceReadiness.failedGateCount ?? 0);
  const advisoryFailedGateCount = Number(sourceReadiness.advisoryFailedGateCount ?? 0);
  const blockedLiveIssues = Number(sourceReadiness.blockedLiveIssues ?? 0);
  const feedEnvFailedCount = Number(sourceReadiness.feedEnvFailedCount ?? 0);
  const visibleOfficialBenefits = Number(sourceReadiness.visibleOfficialBenefits ?? 0);
  const officialSourceCandidates = Number(sourceReadiness.officialSourceCandidates ?? 0);

  return (
    officialSourceCandidates >= 30 &&
    visibleOfficialBenefits >= MIN_OFFICIAL_BENEFITS &&
    blockedLiveIssues === 0 &&
    feedEnvFailedCount === 0 &&
    failedGateCount <= advisoryFailedGateCount
  );
}

function isCleanCustomerLinkLaunchGate(report = {}) {
  const actual = report.actual ?? {};
  const liveSummary = report.liveProbeReviewSummary ?? {};
  const hardFailures = Number(liveSummary.exposedHardFailureCount ?? liveSummary.hardFailureCount ?? actual.liveHardFailures ?? 0);
  const sellerUnavailable = Number(
    liveSummary.exposedSellerUnavailableSignals ?? liveSummary.sellerUnavailableSignals ?? actual.sellerUnavailableSignals ?? 0
  );

  return (
    Number(actual.exposedSearchLinks ?? 1) === 0 &&
    Number(actual.exposedSoldOutLinks ?? 1) === 0 &&
    Number(actual.failedExposureItems ?? 1) === 0 &&
    Number(actual.exposedBrokenLinks ?? 0) === 0 &&
    Number(actual.exposedInvalidUrls ?? 0) === 0 &&
    Number(actual.exposedNonPublishableItems ?? 0) === 0 &&
    hardFailures === 0 &&
    sellerUnavailable === 0
  );
}

function hasFreshOrReviewableManualEvidence(report = {}) {
  const actual = report.actual ?? {};
  const reviewed = Number(actual.manualEvidenceReviewedItems ?? 0);
  const fresh = Number(actual.freshManualEvidence ?? 0);
  const stale = Number(actual.staleManualEvidence ?? 0);
  const missing = Number(actual.missingManualEvidence ?? 0);
  const maxAgeDays = Number(actual.manualEvidenceMaxAgeDays ?? 0);

  return maxAgeDays === 7 && (fresh === reviewed || (isCleanCustomerLinkLaunchGate(report) && stale + missing <= reviewed));
}

async function checkPackage() {
  const pkg = withQaRunnerScripts(JSON.parse(await text("package.json")));
  const lock = JSON.parse(await text("package-lock.json"));
  const androidGradle = await text("android/app/build.gradle");
  const iosProject = await text("ios/App/App.xcodeproj/project.pbxproj");
  const harness = await text("scripts/harness.mjs");
  const audit = await text("scripts/audit.mjs");
  const securityCheck = await text("scripts/security-check.mjs");
  const verifyBenefitEvents = await text("scripts/verify-benefit-events.mjs");
  const freeBenefitApiContractDoctor = await text("scripts/free-benefit-api-contract-doctor.mjs");
  const freeBenefitTypes = await text("types/freeBenefitEvent.ts");
  const firstPartyFeedRoute = await text("app/api/feeds/free-benefits/route.ts");
  const sourceFeedEnvDoctorScript = await text("scripts/source-feed-env-doctor.mjs");
  const sourceStarterPackScript = await text("scripts/free-benefit-feed-starter-pack.mjs");
  const sourceFeedHandoffScript = await text("scripts/free-benefit-feed-handoff.mjs");
  const benefitRefreshWorkflow = await text(".github/workflows/benefit-refresh-scheduler.yml");
  const workspaceDoctor = await text("scripts/workspace-health-doctor.mjs");
  const envExample = await text(".env.example");
  const readme = await text("README.md");
  const runbook = await text("docs/RUNBOOK.md");
  const securityCheckReport = existsSync(join(root, "docs/SECURITY_CHECK_REPORT.md"))
    ? readFileSync(join(root, "docs/SECURITY_CHECK_REPORT.md"), "utf8")
    : "";
  const requiredScripts = [
    "build",
    "build:android",
    "workspace:doctor",
    "workspace:doctor:strict",
    "clean:artifacts:dry",
    "clean:artifacts",
    "clean:reports:dry",
    "clean:reports",
    "cap:sync",
    "cap:sync:ios",
    "cap:open",
    "cap:open:ios",
    "android:doctor",
    "android:debug",
    "android:bundle",
    "android:signing:doctor",
    "admin:auth:doctor",
    "qa:release",
    "perf:budget",
    "device:qa:manifest",
    "device:qa:doctor",
    "device:qa:report",
    "env:doctor",
    "env:doctor:production",
    "test:env",
    "feed:validate",
    "feed:production:doctor",
    "verify:links",
    "verify:links:live",
    "verify:products",
    "link:policy:regression",
    "exposure:doctor",
    "surface:publishable:doctor",
    "link:launch:gate",
    "link:revalidation:report",
    "live:probe:review",
    "refresh:deals",
    "refresh:news",
    "refresh:freebies",
    "refresh:events",
    "verify:news",
    "benefit:priority:doctor",
    "benefit:category:doctor",
    "benefit:operations:report",
    "benefit:collection:report",
    "benefit:model:doctor",
    "benefit:api-contract",
    "benefit:ranking:doctor",
    "benefit:first-party-feed:report",
    "benefit:event:contract",
    "news:freshness:doctor",
    "news:revalidation:report",
    "news:preview",
    "test:news-feed-errors",
    "test:news-feed-dry-run",
    "news:feed:live",
    "refresh:all",
    "health:readiness",
    "push:readiness:report",
    "push:delivery:doctor",
    "push:delivery:audit",
    "official:alerts:report",
    "source:catalog:report",
    "source:breadth:doctor",
    "source:starter:pack",
    "source:live:doctor",
    "source:onboarding:plan",
    "source:feed-env:doctor",
    "source:activation:doctor",
    "source:readiness:report",
    "test:mobile-ux",
    "test:mobile-compact",
    "home:realtime:doctor",
    "home:runtime-snapshot:doctor",
    "test:home-realtime",
    "verify:images",
    "links:report",
    "store:metadata:doctor",
    "store:submission:report",
    "store:packet:doctor",
    "store:console:fields",
    "store:manual:checklist",
    "store:manual:doctor",
    "store:handoff:report",
    "store:assets:generate",
    "store:assets:doctor",
    "store:screenshots:manifest",
    "store:screenshots:doctor",
    "public:url:doctor",
    "release:evidence",
    "release:notes",
    "support:playbook",
    "known:issues"
  ];
  const missing = requiredScripts.filter((script) => !pkg.scripts?.[script]);

  if (missing.length) fail("package scripts", `Missing scripts: ${missing.join(", ")}`);
  else if (!pkg.scripts?.qa?.includes("admin:auth:doctor") || !pkg.scripts?.qa?.includes("verify:links") || !pkg.scripts?.qa?.includes("verify:links:live") || !pkg.scripts?.qa?.includes("verify:products") || !pkg.scripts?.qa?.includes("link:policy:regression") || !pkg.scripts?.qa?.includes("exposure:doctor") || !pkg.scripts?.qa?.includes("surface:publishable:doctor") || !pkg.scripts?.qa?.includes("link:launch:gate") || !pkg.scripts?.qa?.includes("link:revalidation:report") || !pkg.scripts?.qa?.includes("live:probe:review") || !pkg.scripts?.qa?.includes("refresh:deals") || !pkg.scripts?.qa?.includes("refresh:news") || !pkg.scripts?.qa?.includes("refresh:freebies") || !pkg.scripts?.qa?.includes("refresh:events") || !pkg.scripts?.qa?.includes("verify:news") || !pkg.scripts?.qa?.includes("benefit:priority:doctor") || !pkg.scripts?.qa?.includes("benefit:category:doctor") || !pkg.scripts?.qa?.includes("benefit:operations:report") || !pkg.scripts?.qa?.includes("benefit:collection:report") || !pkg.scripts?.qa?.includes("benefit:model:doctor") || !pkg.scripts?.qa?.includes("benefit:api-contract") || !pkg.scripts?.qa?.includes("benefit:ranking:doctor") || !pkg.scripts?.qa?.includes("benefit:first-party-feed:report") || !pkg.scripts?.qa?.includes("benefit:event:contract") || !pkg.scripts?.qa?.includes("news:freshness:doctor") || !pkg.scripts?.qa?.includes("news:revalidation:report") || !pkg.scripts?.qa?.includes("test:news-feed-errors") || !pkg.scripts?.qa?.includes("test:news-feed-dry-run") || !pkg.scripts?.qa?.includes("refresh:all") || !pkg.scripts?.qa?.includes("health:readiness") || !pkg.scripts?.qa?.includes("push:readiness:report") || !pkg.scripts?.qa?.includes("push:delivery:doctor") || !pkg.scripts?.qa?.includes("push:delivery:audit") || !pkg.scripts?.qa?.includes("official:alerts:report") || !pkg.scripts?.qa?.includes("source:catalog:report") || !pkg.scripts?.qa?.includes("source:breadth:doctor") || !pkg.scripts?.qa?.includes("source:starter:pack") || !pkg.scripts?.qa?.includes("source:live:doctor") || !pkg.scripts?.qa?.includes("source:onboarding:plan") || !pkg.scripts?.qa?.includes("source:feed-env:doctor") || !pkg.scripts?.qa?.includes("source:activation:doctor") || !pkg.scripts?.qa?.includes("source:readiness:report") || !pkg.scripts?.qa?.includes("home:realtime:doctor") || !pkg.scripts?.qa?.includes("test:home-realtime") || !pkg.scripts?.qa?.includes("test:mobile-compact") || !pkg.scripts?.qa?.includes("verify:images") || !pkg.scripts?.["admin:auth:doctor"]?.includes("admin-auth-doctor.mjs") || !pkg.scripts?.["link:policy:regression"]?.includes("link-quality-regression.mjs") || !pkg.scripts?.["surface:publishable:doctor"]?.includes("publishable-surface-doctor.mjs") || !pkg.scripts?.["link:launch:gate"]?.includes("link-launch-gate.mjs") || !pkg.scripts?.["link:revalidation:report"]?.includes("link-revalidation-priority-report.mjs") || !pkg.scripts?.["live:probe:review"]?.includes("live-probe-review-report.mjs") || !pkg.scripts?.["news:revalidation:report"]?.includes("news-revalidation-priority-report.mjs") || !pkg.scripts?.["benefit:priority:doctor"]?.includes("consumer-benefit-priority-doctor.mjs") || !pkg.scripts?.["benefit:category:doctor"]?.includes("free-benefit-category-coverage-doctor.mjs") || !pkg.scripts?.["benefit:operations:report"]?.includes("free-benefit-operations-report.mjs") || !pkg.scripts?.["benefit:collection:report"]?.includes("free-benefit-collection-lanes-report.mjs") || !pkg.scripts?.["benefit:model:doctor"]?.includes("free-benefit-runtime-model-doctor.mjs") || !pkg.scripts?.["benefit:api-contract"]?.includes("free-benefit-api-contract-doctor.mjs") || !pkg.scripts?.["benefit:ranking:doctor"]?.includes("free-benefit-ranking-doctor.mjs") || !pkg.scripts?.["benefit:first-party-feed:report"]?.includes("first-party-free-benefit-feed-report.mjs") || !pkg.scripts?.["benefit:event:contract"]?.includes("free-benefit-event-contract-doctor.mjs") || !pkg.scripts?.["refresh:freebies"]?.includes("refresh-official-benefit-slice.mjs freebies") || !pkg.scripts?.["refresh:events"]?.includes("refresh-official-benefit-slice.mjs events") || !pkg.scripts?.["refresh:all"]?.includes("refresh-all.mjs") || !pkg.scripts?.["health:readiness"]?.includes("health-readiness-report.mjs") || !pkg.scripts?.["push:readiness:report"]?.includes("push-readiness-report.mjs") || !pkg.scripts?.["push:delivery:doctor"]?.includes("push-delivery-policy-doctor.mjs") || !pkg.scripts?.["push:delivery:audit"]?.includes("push-delivery-audit-doctor.mjs") || !pkg.scripts?.["official:alerts:report"]?.includes("official-benefit-alert-report.mjs") || !pkg.scripts?.["news:freshness:doctor"]?.includes("news-freshness-doctor.mjs") || !pkg.scripts?.["source:catalog:report"]?.includes("official-source-catalog-report.mjs") || !pkg.scripts?.["source:breadth:doctor"]?.includes("free-benefit-source-breadth-doctor.mjs") || !pkg.scripts?.["source:starter:pack"]?.includes("free-benefit-feed-starter-pack.mjs") || !pkg.scripts?.["source:live:doctor"]?.includes("official-source-live-doctor.mjs") || !pkg.scripts?.["source:onboarding:plan"]?.includes("source-onboarding-plan.mjs") || !pkg.scripts?.["source:feed-env:doctor"]?.includes("source-feed-env-doctor.mjs") || !pkg.scripts?.["source:activation:doctor"]?.includes("source-feed-activation-doctor.mjs") || !pkg.scripts?.["source:readiness:report"]?.includes("source-readiness-report.mjs") || !pkg.scripts?.["home:realtime:doctor"]?.includes("home-realtime-doctor.mjs") || !pkg.scripts?.["home:runtime-snapshot:doctor"]?.includes("home-runtime-snapshot-doctor.mjs") || !pkg.scripts?.["test:home-realtime"]?.includes("home-realtime-doctor.mjs") || !pkg.scripts?.["test:home-realtime"]?.includes("home-runtime-snapshot-doctor.mjs") || !pkg.scripts?.["test:mobile-compact"]?.includes("test-mobile-ux.mjs") || !pkg.scripts?.["verify:images"]?.includes("verify-images.mjs") || !harness.includes("test:mobile-ux") || !harness.includes("test:mobile-compact") || !harness.includes("home:realtime:doctor") || !harness.includes("test:home-realtime") || !harness.includes("verify:images") || !harness.includes("benefit:priority:doctor") || !harness.includes("benefit:category:doctor") || !harness.includes("benefit:operations:report") || !harness.includes("benefit:collection:report") || !harness.includes("benefit:model:doctor") || !harness.includes("benefit:api-contract") || !harness.includes("benefit:ranking:doctor") || !harness.includes("benefit:first-party-feed:report") || !harness.includes("benefit:event:contract") || !pkg.scripts?.qa?.includes("test:mobile-ux") || !pkg.scripts?.["env:doctor:production"]?.includes("--production") || !pkg.scripts?.["qa:release"]?.includes("health:readiness") || !pkg.scripts?.["qa:release"]?.includes("audit:commercial") || !pkg.scripts?.["qa:release"]?.includes("test:env") || !pkg.scripts?.["qa:release"]?.includes("device:qa:manifest") || !pkg.scripts?.["qa:release"]?.includes("device:qa:doctor") || !pkg.scripts?.["qa:release"]?.includes("device:qa:report") || !pkg.scripts?.["qa:release"]?.includes("android:signing:doctor") || !pkg.scripts?.["qa:release"]?.includes("public:url:doctor") || !pkg.scripts?.["qa:release"]?.includes("feed:validate") || !pkg.scripts?.["qa:release"]?.includes("feed:production:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:metadata:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:submission:report") || !pkg.scripts?.["qa:release"]?.includes("store:packet:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:console:fields") || !pkg.scripts?.["qa:release"]?.includes("store:manual:checklist") || !pkg.scripts?.["qa:release"]?.includes("store:manual:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:handoff:report") || !pkg.scripts?.["qa:release"]?.includes("release:notes") || !pkg.scripts?.["qa:release"]?.includes("support:playbook") || !pkg.scripts?.["qa:release"]?.includes("known:issues") || !pkg.scripts?.["qa:release"]?.includes("store:assets:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:screenshots:manifest") || !pkg.scripts?.["qa:release"]?.includes("store:screenshots:doctor") || !pkg.scripts?.["qa:release"]?.includes("perf:budget")) {
    fail("package scripts", "qa, harness, and qa:release should include admin auth doctor, refresh:all, health readiness, mobile UX, commercial security audit, device QA manifest/doctor/report, Android signing doctor, public URL doctor, partner feed validator, production feed doctor, store metadata doctor, store submission/packet/console/handoff reports, store asset doctor, store screenshot manifest/doctor, and performance budget before store submission.");
  } else {
    pass("package scripts", "Android, iOS, environment, mobile UX, commercial security, and performance release command flow is available.");
  }

  if (
    !String(pkg.scripts?.["workspace:doctor"] ?? "").includes("workspace-health-doctor.mjs") ||
    !String(pkg.scripts?.["workspace:doctor:strict"] ?? "").includes("--strict") ||
    !String(pkg.scripts?.["clean:reports"] ?? "").includes("--delete --reports") ||
    !workspaceDoctor.includes("Dirty regenerated report/data summary") ||
    !workspaceDoctor.includes("data snapshots") ||
    !workspaceDoctor.includes("root evidence") ||
    !workspaceDoctor.includes("docs evidence") ||
    !workspaceDoctor.includes("reports/") ||
    !readme.includes("Dirty regenerated report/data summary") ||
    !runbook.includes("Dirty regenerated report/data summary")
  ) {
    fail("workspace hygiene tooling", "Workspace doctor and cleanup docs must summarize regenerated report/data churn by root evidence, docs evidence, reports/, and data snapshots.");
  } else {
    pass("workspace hygiene tooling", "Workspace doctor, cleanup scripts, README, and runbook distinguish generated report/data churn before staging.");
  }

  const benefitSecurityGateMissing = [
    ["refresh:benefits", "refresh-benefits.mjs"],
    ["verify:benefits", "verify-benefit-events.mjs"],
    ["benefit:priority:doctor", "consumer-benefit-priority-doctor.mjs"],
    ["benefit:category:doctor", "free-benefit-category-coverage-doctor.mjs"],
    ["benefit:operations:report", "free-benefit-operations-report.mjs"],
    ["benefit:collection:report", "free-benefit-collection-lanes-report.mjs"],
    ["benefit:model:doctor", "free-benefit-runtime-model-doctor.mjs"],
    ["benefit:api-contract", "free-benefit-api-contract-doctor.mjs"],
    ["benefit:ranking:doctor", "free-benefit-ranking-doctor.mjs"],
    ["benefit:event:contract", "free-benefit-event-contract-doctor.mjs"],
    ["security:check", "security-check.mjs"]
  ].filter(([scriptName, expected]) => !String(pkg.scripts?.[scriptName] ?? "").includes(expected));
  const benefitSecurityPolicyMissing = [
    ["source catalog data", "data\", \"officialSourceCatalog.json"],
    ["official source catalog guard", "official source catalog guard"],
    ["unsafe source URL detector", "hasUnsafeOfficialSourceUrl"],
    ["official benefit policy detector", "hasOfficialBenefitPolicyText"],
    ["duplicate official URL detector", "findDuplicateOfficialSourceUrls"],
    ["security report catalog evidence", "official source catalog guard"]
  ].filter(([, expected], index) => {
    const source = index === 5 ? securityCheckReport : securityCheck;
    return !source.includes(expected);
  });
  if (
    benefitSecurityGateMissing.length ||
    benefitSecurityPolicyMissing.length ||
    !envExample.includes("OFFICIAL_EVENT_FEED_URLS=") ||
    !envExample.includes("PUBLIC_COUPON_FEED_URLS=") ||
    !envExample.includes("BENEFIT_REFRESH_FEED_URLS=") ||
    !envExample.includes("CONVENIENCE_BENEFIT_FEED_URLS=") ||
    !envExample.includes("BEAUTY_SAMPLE_FEED_URLS=") ||
    !envExample.includes("CAFE_FRANCHISE_COUPON_FEED_URLS=") ||
    !envExample.includes("PAY_POINT_BENEFIT_FEED_URLS=") ||
    !envExample.includes("PET_SAMPLE_FEED_URLS=") ||
    !envExample.includes("SIGNUP_GIFT_FEED_URLS=") ||
    !envExample.includes("HALINDOSA_APPROVED_FEED_HOSTS=") ||
    !envExample.includes("BENEFIT_REFRESH_APPROVED_HOSTS=") ||
    !envExample.includes("HALINDOSA_ALLOW_DATA_FEED_URLS=false") ||
    !envExample.includes("https://www.halindosa.com/api/feeds/free-benefits") ||
    !envExample.includes("official JSON/RSS/API feeds for free-benefit growth") ||
    !String(pkg.scripts?.qa ?? "").includes("refresh:benefits") ||
    !String(pkg.scripts?.qa ?? "").includes("verify:benefits") ||
    !String(pkg.scripts?.qa ?? "").includes("benefit:priority:doctor") ||
    !String(pkg.scripts?.qa ?? "").includes("benefit:category:doctor") ||
    !String(pkg.scripts?.qa ?? "").includes("benefit:operations:report") ||
    !String(pkg.scripts?.qa ?? "").includes("benefit:model:doctor") ||
    !String(pkg.scripts?.qa ?? "").includes("benefit:api-contract") ||
    !String(pkg.scripts?.qa ?? "").includes("benefit:ranking:doctor") ||
    !String(pkg.scripts?.qa ?? "").includes("benefit:event:contract") ||
    !String(pkg.scripts?.qa ?? "").includes("security:check") ||
    !harness.includes("benefit:category:doctor") ||
    !harness.includes("benefit:operations:report") ||
    !harness.includes("benefit:model:doctor") ||
    !harness.includes("benefit:api-contract") ||
    !harness.includes("benefit:ranking:doctor") ||
    !harness.includes("benefit:event:contract") ||
    !harness.includes("benefit:priority:doctor") ||
    !harness.includes("security:check") ||
    !smokeSourceSync().includes("requiredFreeBenefitRuntimeFields") ||
    !smokeSourceSync().includes("assertFreeBenefitRuntimeFields") ||
    !smokeSourceSync().includes("requiredStandardFreeBenefitFields") ||
    !smokeSourceSync().includes("assertStandardFreeBenefits") ||
    !smokeSourceSync().includes("/api/feeds/free-benefits?limit=16") ||
    !smokeSourceSync().includes("halindosa_first_party_verified_feed") ||
    !smokeSourceSync().includes("HalindosaFreeBenefitFeedItem") ||
    !smokeSourceSync().includes("canonicalUrl") ||
    !smokeSourceSync().includes("claimUrl") ||
    !smokeSourceSync().includes("dedupeKey") ||
    !smokeSourceSync().includes("deadlineStatus") ||
    !smokeSourceSync().includes("displayBadges") ||
    !smokeSourceSync().includes("official_verified") ||
    !freeBenefitApiContractDoctor.includes("first-party free benefit feed contract") ||
    !freeBenefitApiContractDoctor.includes("searchLinksAllowed: false") ||
    !freeBenefitApiContractDoctor.includes("homepageLinksAllowed: false") ||
    !freeBenefitApiContractDoctor.includes("communityLinksAllowed: false") ||
    !freeBenefitTypes.includes("export interface FirstPartyFreeBenefitFeedItem") ||
    !freeBenefitTypes.includes("FreeBenefitDeadlineStatus") ||
    !freeBenefitTypes.includes("linkTrust: \"official_verified\"") ||
    !freeBenefitTypes.includes("claimUrl: string") ||
    !freeBenefitTypes.includes("displayBadges: string[]") ||
    !freeBenefitTypes.includes("dedupeKey: string") ||
    !freeBenefitTypes.includes("publishable: true") ||
    !firstPartyFeedRoute.includes("HalindosaFreeBenefitFeedItem") ||
    !firstPartyFeedRoute.includes("FirstPartyFreeBenefitFeedItem") ||
    !firstPartyFeedRoute.includes("qualityGate") ||
    !firstPartyFeedRoute.includes("canonicalUrlRequired") ||
    !firstPartyFeedRoute.includes("searchLinksAllowed: false") ||
    !firstPartyFeedRoute.includes("homepageLinksAllowed: false") ||
    !firstPartyFeedRoute.includes("communityLinksAllowed: false") ||
    !sourceFeedEnvDoctorScript.includes("firstPartyFeedHosts") ||
    !sourceFeedEnvDoctorScript.includes("first_party_verified_feed_host") ||
    !sourceStarterPackScript.includes("https://www.halindosa.com/api/feeds/free-benefits") ||
    !sourceFeedHandoffScript.includes("https://www.halindosa.com/api/feeds/free-benefits") ||
    !benefitRefreshWorkflow.includes("/api/feeds/free-benefits?limit=12") ||
    !benefitRefreshWorkflow.includes("halindosa_first_party_verified_feed") ||
    !benefitRefreshWorkflow.includes("publishableOnly") ||
    !benefitRefreshWorkflow.includes("first-party free benefit item") ||
    !benefitRefreshWorkflow.includes("canonicalUrl") ||
    !benefitRefreshWorkflow.includes("dedupeKey") ||
    !benefitRefreshWorkflow.includes("deadlineStatus") ||
    !benefitRefreshWorkflow.includes("displayBadges") ||
    !benefitRefreshWorkflow.includes("linkTrust") ||
    !benefitRefreshWorkflow.includes("official_verified") ||
    !["finalUrl", "claimUrl", "claimCtaLabel", "claimAccessLevel", "claimAccessLabel", "requiresLogin", "requiresPurchase", "isEveryoneReward", "isFirstComeFirstServed", "isInstantClaim"].every((field) =>
      smokeSourceSync().includes(`"${field}"`)
    ) ||
    !smokeSourceSync().includes("claimAccess=instant") ||
    !smokeSourceSync().includes("runtimeReadiness?.instantClaimCount") ||
    !smokeSourceSync().includes("runtimeReadiness?.claimAccessLevelCounts") ||
    !["freeTrial", "signup", "checkIn", "roulette", "gifticon", "pointCashback"].every((type) => verifyBenefitEvents.includes(`"${type}"`))
  ) {
    fail(
      "free benefit security gates",
      `Missing free-benefit/security launch gates: ${
        [
          ...benefitSecurityGateMissing.map(([scriptName]) => scriptName),
          ...benefitSecurityPolicyMissing.map(([name]) => name)
        ].join(", ") || "qa/harness wiring"
      }`
    );
  } else {
    pass("free benefit security gates", "refresh:benefits, verify:benefits, benefit:priority:doctor, benefit:category:doctor, benefit:operations:report, benefit:model:doctor, benefit:api-contract, benefit:ranking:doctor, benefit:event:contract, official source catalog security guard, runtime API field smoke checks, and security:check are wired into qa, harness, and release doctor policy.");
  }

  if (!pkg.dependencies?.["@capacitor/ios"]) fail("Capacitor iOS dependency", "Missing @capacitor/ios.");
  else pass("Capacitor iOS dependency", pkg.dependencies["@capacitor/ios"]);

  if (!pkg.dependencies?.["@supabase/supabase-js"]) fail("Supabase Auth dependency", "Missing @supabase/supabase-js.");
  else pass("Supabase Auth dependency", pkg.dependencies["@supabase/supabase-js"]);

  const versionIssues = [];
  if (pkg.version !== "1.0.1") versionIssues.push(`package.json version is ${pkg.version}`);
  if (lock.version !== pkg.version) versionIssues.push(`package-lock root version is ${lock.version}`);
  if (lock.packages?.[""]?.version !== pkg.version) {
    versionIssues.push(`package-lock package version is ${lock.packages?.[""]?.version ?? "missing"}`);
  }
  if (!androidGradle.includes(`versionName "${pkg.version}"`)) {
    versionIssues.push(`Android versionName does not match ${pkg.version}`);
  }
  if (!iosProject.includes(`MARKETING_VERSION = ${pkg.version};`)) {
    versionIssues.push(`iOS MARKETING_VERSION does not match ${pkg.version}`);
  }

  if (versionIssues.length) fail("release version alignment", versionIssues.join("; "));
  else pass("release version alignment", `Web, lockfile, Android, and iOS versions are aligned at ${pkg.version}.`);

  if (
    !audit.includes("total > 0") ||
    !audit.includes("All npm audit vulnerabilities must be resolved before commercial deployment.") ||
    !audit.includes("AUDIT_REPORT.md") ||
    !audit.includes("docs")
  ) {
    fail("commercial audit zero-vulnerability gate", "audit:commercial should fail when any npm audit vulnerability remains and write non-secret audit reports.");
  } else {
    pass("commercial audit zero-vulnerability gate", "audit:commercial requires npm audit total vulnerabilities to be 0 and writes non-secret audit reports.");
  }
}

async function checkCiWorkflow() {
  const path = ".github/workflows/ci.yml";
  if (!existsSync(join(root, path))) {
    fail("github ci workflow", "Missing .github/workflows/ci.yml.");
    return;
  }

  const workflow = await text(path);
  const runbook = await text("docs/RUNBOOK.md");
  const requiredWorkflowSnippets = [
    'branches: ["main", "codex/**"]',
    "concurrency:",
    "group: ci-${{ github.workflow }}-${{ github.ref }}",
    "cancel-in-progress: true",
    "npm ci",
    "npm run audit:commercial",
    "npm run test:env",
    "npm run public:url:doctor",
    "npm run lint",
    "npm run test:mobile-ux",
    "npm run home:realtime:doctor",
    "npm run security:check",
    "npm run benefit:priority:doctor",
    "npm run benefit:category:doctor",
    "npm run benefit:api-contract",
    "npm run benefit:event:contract",
    "npm run test:seo",
    "npm run test:perf",
    "npm run release:prepare:reports:ci",
    "npm run release:doctor",
    "npm run build",
    "actions/upload-artifact@v4",
    "halindosa-verification-reports",
    "AUDIT_REPORT.md",
    "docs/AUDIT_REPORT.md",
    "ENV_DOCTOR_REPORT.md",
    "docs/ENV_DOCTOR_REPORT.md",
    "PUBLIC_URL_REPORT.md",
    "docs/PUBLIC_URL_REPORT.md",
    "STORE_METADATA_REPORT.md",
    "docs/STORE_METADATA_REPORT.md",
    "STORE_ASSETS_REPORT.md",
    "docs/STORE_ASSETS_REPORT.md",
    "DEVICE_QA_MANIFEST.json",
    "docs/DEVICE_QA_MANIFEST.md",
    "DEVICE_QA_REPORT.md",
    "docs/DEVICE_QA_REPORT.md",
    "STORE_SUBMISSION_REPORT.md",
    "docs/STORE_SUBMISSION_REPORT.md",
    "STORE_PACKET_REPORT.md",
    "docs/STORE_PACKET_REPORT.md",
    "STORE_CONSOLE_FIELDS.json",
    "docs/STORE_CONSOLE_FIELDS.md",
    "STORE_MANUAL_CHECKLIST.json",
    "STORE_MANUAL_CHECKLIST.md",
    "docs/STORE_MANUAL_CHECKLIST.md",
    "STORE_HANDOFF_REPORT.md",
    "docs/STORE_HANDOFF_REPORT.md",
    "RELEASE_NOTES.json",
    "RELEASE_NOTES.md",
    "docs/RELEASE_NOTES.md",
    "SUPPORT_PLAYBOOK.json",
    "SUPPORT_PLAYBOOK.md",
    "docs/SUPPORT_PLAYBOOK.md",
    "KNOWN_ISSUES.md",
    "docs/KNOWN_ISSUES.md",
    "STORE_SCREENSHOTS_REPORT.md",
    "docs/STORE_SCREENSHOTS_REPORT.md",
    "STORE_SCREENSHOT_MANIFEST.json",
    "docs/STORE_SCREENSHOT_MANIFEST.md",
    "reports/health-readiness.json",
    "docs/HEALTH_READINESS_REPORT.md",
    "reports/official-benefit-alerts.json",
    "docs/OFFICIAL_BENEFIT_ALERTS_REPORT.md",
    "docs/release-evidence.md"
  ];
  const missingWorkflowSnippets = requiredWorkflowSnippets.filter((snippet) => !workflow.includes(snippet));
  const requiredRunbookSnippets = ["codex/**", "AUDIT_REPORT.md", "npm run test:env", "ENV_DOCTOR_REPORT.md", "PUBLIC_URL_REPORT.md", "npm run store:metadata:doctor", "STORE_METADATA_REPORT.md", "npm run store:assets:doctor", "STORE_ASSETS_REPORT.md", "npm run store:packet:doctor", "STORE_PACKET_REPORT.md", "npm run store:console:fields", "STORE_CONSOLE_FIELDS", "npm run store:manual:checklist", "STORE_MANUAL_CHECKLIST", "npm run store:manual:doctor", "npm run store:handoff:report", "STORE_HANDOFF_REPORT.md", "npm run release:notes", "RELEASE_NOTES", "npm run support:playbook", "SUPPORT_PLAYBOOK", "npm run known:issues", "KNOWN_ISSUES", "npm run store:screenshots:manifest", "STORE_SCREENSHOT_MANIFEST", "npm run store:screenshots:doctor", "STORE_SCREENSHOTS_REPORT.md", "npm run health:readiness", "HEALTH_READINESS_REPORT.md", "reports/health-readiness.json", "npm run exposure:doctor", "reports/exposure-policy.json", "npm run device:qa:manifest", "DEVICE_QA_MANIFEST", "npm run device:qa:report", "DEVICE_QA_REPORT.md", "npm run store:submission:report", "STORE_SUBMISSION_REPORT.md", "npm run public:url:doctor", "npm run harness", "npm run release:doctor", "halindosa-verification-reports", "GitHub Actions `CI`", "Vercel Production Deploy", "자동 취소"];
  const missingRunbookSnippets = requiredRunbookSnippets.filter((snippet) => !runbook.includes(snippet));

  if (missingWorkflowSnippets.length || missingRunbookSnippets.length) {
    fail(
      "github ci workflow",
      `CI should run commercial audit, env regression, public URL doctor, launch regression gates, release report preparation, release doctor, production build, and upload verification reports on main/codex branches. Missing workflow: ${missingWorkflowSnippets.join(", ") || "none"}; runbook: ${missingRunbookSnippets.join(", ") || "none"}`
    );
  } else {
    pass("github ci workflow", "GitHub Actions runs commercial audit, env regression, public URL doctor, launch regression gates, release report preparation, release doctor, production build, and uploads verification reports on main and codex branches.");
  }

  const vercelWorkflowPath = ".github/workflows/vercel-production-deploy.yml";
  if (!existsSync(join(root, vercelWorkflowPath))) {
    fail("vercel production deploy workflow", "Missing .github/workflows/vercel-production-deploy.yml.");
  } else {
    const vercelWorkflow = await text(vercelWorkflowPath);
    const deployGuide = await text("README_DEPLOY.md");
    const vercelDeploymentDoctor = await text("scripts/vercel-deployment-doctor.mjs");
    const deploymentStatusReport = await text("scripts/deployment-status-report.mjs");
    const packageJson = await text("package.json");
    const qaRunner = await text("scripts/run-qa.mjs");
    const harness = await text("scripts/harness.mjs");
    const adminDeploymentStatusApi = await text("app/api/admin/deployment-status/route.ts");
    const adminHrefs = await text("lib/adminDashboardHrefs.ts");
    const adminPage = await text("app/admin/page.tsx");
    const smoke = await text("scripts/smoke.mjs");
    const requiredVercelWorkflowSnippets = [
      'branches: ["main"]',
      "concurrency:",
      "group: vercel-production-${{ github.ref }}",
      "cancel-in-progress: true",
      "VERCEL_TOKEN",
      "VERCEL_ORG_ID",
      "VERCEL_PROJECT_ID",
      "npm run refresh:news",
      "npm run verify:news",
      "npm run refresh:deals",
      "npm run verify:links",
      "npm run benefit:api-contract",
      "npm run test:home-realtime",
      "npm run test:mobile-compact",
      "npm run smoke:local",
      "npm run release:doctor",
      "npx vercel pull --yes --environment=production",
      "npx vercel build --prod",
      "npx vercel deploy --prebuilt --prod",
      "npm run vercel:doctor",
      "vercel-production-deployment-evidence"
    ];
    const requiredDeployGuideSnippets = [
      "GitHub Actions 자동 프로덕션 배포",
      "VERCEL_TOKEN",
      "VERCEL_ORG_ID",
      "VERCEL_PROJECT_ID",
      "Vercel Project ID",
      "npm run deployment:status",
      "npm run vercel:doctor",
      "/api/home?limit=3&verifiedOnly=true"
    ];
    const missingVercelWorkflow = requiredVercelWorkflowSnippets.filter((snippet) => !vercelWorkflow.includes(snippet));
    const missingDeployGuide = requiredDeployGuideSnippets.filter((snippet) => !deployGuide.includes(snippet));
    const requiredVercelDoctorSnippets = [
      "root free benefit visible render",
      "id=\"S:0\"",
      "할인도사 화면을 불러오는 중",
      "rootVisibleRenderOk",
      "health homepage render guard",
      "homepageVisibleRenderGuard",
      "homepageLoadingFallbackBlocked",
      "health claim-ready benefit ranking",
      "freeBenefitRankingOk",
      "freeBenefitClaimReadyCount",
      "freeBenefitInstantClaimCount",
      "freeBenefitTopClaimReadyCount",
      "freeBenefitTopInstantClaimCount",
      "freeBenefitTopTypeDiversity",
      "freeBenefitExactDuplicateGroupCount",
      "freeBenefitRecentlyCheckedCount",
      "freeBenefitStaleCheckedCount",
      "freeBenefitMissingCheckedAtCount",
      "freeBenefitOfficialHostDiversity",
      "freeBenefitAverageQualityScore",
      "freeBenefitAverageFreshnessScore",
      "freeBenefitAverageOfficialScore",
      "freeBenefitAverageUrgencyScore",
      "freeBenefitAverageRewardScore",
      "freeBenefitInstantClaimShare",
      "freeBenefitClaimAccessLevelCounts"
    ];
    const missingVercelDoctor = requiredVercelDoctorSnippets.filter((snippet) => !vercelDeploymentDoctor.includes(snippet));
    const requiredDeploymentStatusSnippets = [
      "reports/deployment-status.json",
      "docs/DEPLOYMENT_STATUS.md",
      "deployment.shortCommit",
      "latestIsLive",
      "feedMode",
      "configuredFeedUrlCount",
      "externalFeedItemCount",
      "latestPreviewPromotion",
      "androidWebViewUpdate",
      "recommendedNextActions"
    ];
    const missingDeploymentStatus = [
      ...requiredDeploymentStatusSnippets.filter((snippet) => !deploymentStatusReport.includes(snippet)),
      ...(!packageJson.includes('"deployment:status"') ? ["package.json deployment:status"] : []),
      ...(!qaRunner.includes('"deployment:status"') ? ["qa deployment:status"] : []),
      ...(!harness.includes('["deployment:status", ["run", "deployment:status"]]') ? ["harness deployment:status"] : []),
      ...(!adminDeploymentStatusApi.includes("canAccessAdminRequest") || !adminDeploymentStatusApi.includes("buildDeploymentStatusCsv") ? ["admin deployment status api"] : []),
      ...(!adminHrefs.includes("deploymentStatusApiHref") || !adminHrefs.includes("/api/admin/deployment-status?format=csv") ? ["admin deployment status hrefs"] : []),
      ...(!adminPage.includes("배포 · 앱 반영 상태") || !adminPage.includes("deploymentStatusApiHref") || !adminPage.includes("Android WebView") ? ["admin deployment status panel"] : []),
      ...(!smoke.includes("admin deployment status api") || !smoke.includes("/api/admin/deployment-status") || !smoke.includes("latestIsLive") || !smoke.includes("webviewUpdate") || !smoke.includes("latestPreviewPromotion") ? ["smoke deployment status api"] : [])
    ];

    if (missingVercelWorkflow.length || missingDeployGuide.length || missingVercelDoctor.length || missingDeploymentStatus.length) {
      fail(
        "vercel production deploy workflow",
        `Production deploy workflow should validate launch gates, expose deployment status, deploy with Vercel secrets, and run vercel:doctor. Missing workflow: ${missingVercelWorkflow.join(", ") || "none"}; guide: ${missingDeployGuide.join(", ") || "none"}; vercel doctor: ${missingVercelDoctor.join(", ") || "none"}; deployment status: ${missingDeploymentStatus.join(", ") || "none"}`
      );
    } else {
      pass("vercel production deploy workflow", "GitHub Actions production deploy workflow validates launch gates, records deployment status, deploys Vercel with repository secrets, and runs vercel:doctor evidence checks including visible home free-benefit render.");
    }
  }

  const prTemplatePath = ".github/pull_request_template.md";
  if (!existsSync(join(root, prTemplatePath))) {
    fail("github pr template", "Missing .github/pull_request_template.md.");
    return;
  }

  const prTemplate = await text(prTemplatePath);
  const requiredPrSnippets = [
    "npm run harness",
    "npm run test:env",
    "npm run public:url:doctor",
    "npm run release:doctor",
    "npm run store:manual:doctor",
    "실제 상품 상세 URL 또는 공식 혜택 상세 URL",
    "검색 결과, 대표몰, 커뮤니티/블로그/뉴스 원문 단독 링크",
    "개인정보, 환경변수, keystore",
    "비회원 사용자가 홈, 검색, 카테고리",
    "docs/OAUTH_SETUP.md",
    "모바일 390px",
    "docs/STORE_CONSOLE_FIELDS.md",
    "docs/STORE_MANUAL_CHECKLIST.md",
    "docs/STORE_HANDOFF_REPORT.md"
  ];
  const missingPrSnippets = requiredPrSnippets.filter((snippet) => !prTemplate.includes(snippet));

  if (missingPrSnippets.length) {
    fail("github pr template", `PR template should preserve launch safety checks. Missing: ${missingPrSnippets.join(", ")}`);
  } else if (!runbook.includes(".github/pull_request_template.md")) {
    fail("github pr template", "RUNBOOK should reference the PR launch safety checklist.");
  } else {
    pass("github pr template", "PR template covers launch safety, verified links, guest access, secrets, OAuth/policy impact, and mobile layout checks.");
  }

  const issueTemplateFiles = [
    ".github/ISSUE_TEMPLATE/deal-link-report.md",
    ".github/ISSUE_TEMPLATE/app-bug-report.md",
    ".github/ISSUE_TEMPLATE/store-submission-blocker.md",
    ".github/ISSUE_TEMPLATE/config.yml"
  ];
  const missingIssueTemplates = issueTemplateFiles.filter((file) => !existsSync(join(root, file)));
  if (missingIssueTemplates.length) {
    fail("github issue templates", `Missing issue templates: ${missingIssueTemplates.join(", ")}`);
    return;
  }

  const dealIssue = await text(".github/ISSUE_TEMPLATE/deal-link-report.md");
  const appIssue = await text(".github/ISSUE_TEMPLATE/app-bug-report.md");
  const storeIssue = await text(".github/ISSUE_TEMPLATE/store-submission-blocker.md");
  const issueConfig = await text(".github/ISSUE_TEMPLATE/config.yml");
  const requiredDealIssueSnippets = ["가격이 다름", "품절 또는 옵션 선택 불가", "링크 오류", "할인도사 상품 ID", "판매처에서 확인한 가격/혜택", "개인정보 주의"];
  const requiredAppIssueSnippets = ["재현 순서", "플랫폼: Web / Android / iOS", "외부 판매처 이동", "GitHub Actions artifact", "개인정보 주의"];
  const requiredStoreIssueSnippets = ["스토어 제출 Blocker", "Play Console signed AAB 업로드", "App Store Connect Archive 업로드", "docs/STORE_MANUAL_CHECKLIST.md", "docs/STORE_CONSOLE_FIELDS.md", "docs/STORE_HANDOFF_REPORT.md", "OAuth/Supabase Provider 설정", "민감정보 주의", "keystore 비밀번호", "OAuth client secret"];
  const requiredIssueConfigSnippets = ["blank_issues_enabled: false", "https://github.com/titeks2-a11y/halindosa/issues/new/choose"];
  const missingIssueSnippets = [
    ...requiredDealIssueSnippets.filter((snippet) => !dealIssue.includes(snippet)).map((snippet) => `deal:${snippet}`),
    ...requiredAppIssueSnippets.filter((snippet) => !appIssue.includes(snippet)).map((snippet) => `app:${snippet}`),
    ...requiredStoreIssueSnippets.filter((snippet) => !storeIssue.includes(snippet)).map((snippet) => `store:${snippet}`),
    ...requiredIssueConfigSnippets.filter((snippet) => !issueConfig.includes(snippet)).map((snippet) => `config:${snippet}`)
  ];

  if (missingIssueSnippets.length) {
    fail("github issue templates", `Issue templates should capture link/price reports, app bugs, evidence, and privacy cautions. Missing: ${missingIssueSnippets.join(", ")}`);
  } else if (!runbook.includes(".github/ISSUE_TEMPLATE")) {
    fail("github issue templates", "RUNBOOK should reference the GitHub issue templates.");
  } else {
    pass("github issue templates", "Issue templates capture deal link/price reports, app bugs, reproduction evidence, and privacy cautions.");
  }
}

async function checkSecurityPolicy() {
  const path = "SECURITY.md";
  if (!existsSync(join(root, path))) {
    fail("security policy", "Missing SECURITY.md.");
    return;
  }

  const policy = await text(path);
  const runbook = await text("docs/RUNBOOK.md");
  const requiredSnippets = [
    "Do not open a public issue",
    "GitHub Security Advisory",
    "security/advisories/new",
    "Supabase service-role keys",
    "ADMIN_EXPORT_TOKEN",
    "keystore",
    "Open redirect",
    "npm run harness",
    "npm run release:doctor"
  ];
  const missing = requiredSnippets.filter((snippet) => !policy.includes(snippet));

  if (missing.length) {
    fail("security policy", `SECURITY.md should document private vulnerability reporting, secret handling, redirect risk, and release verification. Missing: ${missing.join(", ")}`);
  } else if (!runbook.includes("SECURITY.md") || !runbook.includes("GitHub Security Advisory")) {
    fail("security policy", "RUNBOOK should reference SECURITY.md and private vulnerability reporting.");
  } else {
    pass("security policy", "SECURITY.md documents private vulnerability reporting, secret handling, redirect risk, and release verification.");
  }
}

function isGeneratedReleaseSnapshotCommit(subject) {
  return /refresh .*release evidence/i.test(subject) || /refresh .*store release handoff docs/i.test(subject) || /refresh .*launch handoff/i.test(subject);
}

function isCiOnlyCommit(subject) {
  return /^ci(?:\(.+\))?:/i.test(subject);
}

async function checkReleaseEvidenceFreshness() {
  const evidencePath = "docs/release-evidence.md";
  if (!existsSync(join(root, evidencePath))) {
    fail("release evidence freshness", "docs/release-evidence.md is missing.");
    return;
  }

  const evidence = await text(evidencePath);
  const currentCommit = run("git", ["rev-parse", "--short", "HEAD"]);
  const parentCommit = run("git", ["rev-parse", "--short", "HEAD~1"]);
  const currentSubject = run("git", ["log", "-1", "--pretty=%s"]);
  const status = run("git", ["status", "--short"]);
  const evidenceCommit = evidence.match(/최신 커밋:\s*([a-f0-9]+)/)?.[1] ?? "";
  const isSnapshotCommit = isGeneratedReleaseSnapshotCommit(currentSubject);
  const isCiCommit = isCiOnlyCommit(currentSubject);

  if (!currentCommit || !evidenceCommit) {
    fail("release evidence freshness", "Release evidence should include the current short git commit.");
  } else if (status) {
    pass("release evidence freshness", `Working tree has pending changes; clean release candidates must refresh evidence after the final commit. Current document points at ${evidenceCommit}.`);
  } else if (isSnapshotCommit && evidenceCommit === parentCommit) {
    pass("release evidence freshness", `Release evidence snapshot was refreshed for parent release commit ${parentCommit}.`);
  } else if (isCiCommit) {
    pass("release evidence freshness", `CI-only commit ${currentCommit} does not require regenerating store evidence; document points at ${evidenceCommit}.`);
  } else if (currentCommit !== evidenceCommit) {
    fail("release evidence freshness", `Release evidence is stale: document has ${evidenceCommit}, current commit is ${currentCommit}. Run npm run release:evidence after final QA.`);
  } else {
    pass("release evidence freshness", `Release evidence points at current commit ${currentCommit}.`);
  }
}

async function checkGeneratedReportFreshness() {
  const reports = [
    {
      name: "store manual checklist freshness",
      file: "docs/STORE_MANUAL_CHECKLIST.md",
      command: "npm run store:manual:checklist",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "device qa report freshness",
      file: "docs/DEVICE_QA_REPORT.md",
      command: "npm run device:qa:report",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "store screenshots report freshness",
      file: "docs/STORE_SCREENSHOTS_REPORT.md",
      command: "npm run store:screenshots:doctor",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "known issues freshness",
      file: "docs/KNOWN_ISSUES.md",
      command: "npm run known:issues",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "public url report freshness",
      file: "docs/PUBLIC_URL_REPORT.md",
      command: "npm run public:url:doctor",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "store submission report freshness",
      file: "docs/STORE_SUBMISSION_REPORT.md",
      command: "npm run store:submission:report",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "store console fields freshness",
      file: "docs/STORE_CONSOLE_FIELDS.md",
      command: "npm run store:console:fields",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "store handoff report freshness",
      file: "docs/STORE_HANDOFF_REPORT.md",
      command: "npm run store:handoff:report",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "release notes freshness",
      file: "docs/RELEASE_NOTES.md",
      command: "npm run release:notes",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "support playbook freshness",
      file: "docs/SUPPORT_PLAYBOOK.md",
      command: "npm run support:playbook",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    },
    {
      name: "store packet report freshness",
      file: "docs/STORE_PACKET_REPORT.md",
      command: "npm run store:packet:doctor",
      pattern: /Commit:\s*`?([a-f0-9]+)`?/
    }
  ];

  const currentCommit = run("git", ["rev-parse", "--short", "HEAD"]);
  const parentCommit = run("git", ["rev-parse", "--short", "HEAD~1"]);
  const currentSubject = run("git", ["log", "-1", "--pretty=%s"]);
  const status = run("git", ["status", "--short"]);
  const isRefreshCommit = isGeneratedReleaseSnapshotCommit(currentSubject);
  const isCiCommit = isCiOnlyCommit(currentSubject);

  for (const report of reports) {
    if (!existsSync(join(root, report.file))) {
      fail(report.name, `${report.file} is missing.`);
      continue;
    }

    const body = await text(report.file);
    const reportCommit = body.match(report.pattern)?.[1] ?? "";

    if (!currentCommit || !reportCommit) {
      fail(report.name, `${report.file} should include a short git commit. Run ${report.command}.`);
    } else if (status) {
      pass(report.name, `Working tree has pending changes; clean release candidates must refresh ${report.file} after the final commit. Current document points at ${reportCommit}.`);
    } else if (isRefreshCommit && reportCommit === parentCommit) {
      pass(report.name, `${report.file} snapshot was refreshed for parent release commit ${parentCommit}.`);
    } else if (isCiCommit) {
      pass(report.name, `CI-only commit ${currentCommit} does not require regenerating ${report.file}; document points at ${reportCommit}.`);
    } else if (currentCommit !== reportCommit) {
      fail(report.name, `${report.file} is stale: document has ${reportCommit}, current commit is ${currentCommit}. Run ${report.command} after final QA.`);
    } else {
      pass(report.name, `${report.file} points at current commit ${currentCommit}.`);
    }
  }
}

async function checkRepositorySafety() {
  const gitignore = await text(".gitignore");
  const requiredIgnores = [
    "node_modules/",
    ".next/",
    "out/",
    ".env",
    ".env*.local",
    "android/local.properties",
    "android/keystore.properties",
    "android/app/google-services.json",
    "*.jks",
    "*.keystore",
    "*.apk",
    "*.aab",
    "ios/App/Pods/",
    "ios/App/build/",
    "ios/App/App.xcodeproj/xcuserdata/",
    "GoogleService-Info.plist"
  ];
  const missingIgnores = requiredIgnores.filter((entry) => !gitignore.includes(entry));

  if (missingIgnores.length) fail("gitignore release safety", `Missing ignore entries: ${missingIgnores.join(", ")}`);
  else pass("gitignore release safety", "Sensitive local files and build artifacts are ignored.");

  let trackedFiles = [];

  try {
    trackedFiles = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    pass("tracked secret scan", "Git metadata unavailable; skip tracked file scan.");
    return;
  }

  const sensitivePatterns = [
    /(^|\/)\.env(\.|$)/,
    /(^|\/)keystore\.properties$/,
    /(^|\/)local\.properties$/,
    /(^|\/)google-services\.json$/,
    /(^|\/)GoogleService-Info\.plist$/,
    /\.(jks|keystore|p12|mobileprovision|apk|aab)$/i,
    /(^|\/)(node_modules|\.next|out|dist|build)\//
  ];
  const allowedSensitiveExamples = new Set([".env.example", "android/keystore.properties.example"]);
  const trackedSensitive = trackedFiles.filter(
    (file) => !allowedSensitiveExamples.has(file) && sensitivePatterns.some((pattern) => pattern.test(file))
  );

  if (trackedSensitive.length) fail("tracked secret scan", `Tracked sensitive/build files: ${trackedSensitive.join(", ")}`);
  else pass("tracked secret scan", "No tracked env, keystore, service config, or build artifact files found.");
}

async function checkEnvExample() {
  const envPath = ".env.example";

  if (!existsSync(join(root, envPath))) {
    fail("env example", "Missing .env.example.");
    return;
  }

  const env = await text(envPath);
  const requiredKeys = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_AUTH_REDIRECT_URL",
    "NEXT_PUBLIC_APP_SCHEME",
    "NEXT_PUBLIC_APP_NAME",
    "NEXT_PUBLIC_APP_ENV",
    "NEXT_PUBLIC_SUPPORT_EMAIL",
    "DEAL_DATA_MODE",
    "DEAL_PROVIDER",
    "DEAL_LIVE_KEYWORDS",
    "NAVER_CLIENT_ID",
    "NAVER_CLIENT_SECRET",
    "DEAL_FEED_URLS",
    "DEAL_PRODUCTION_FEED_URLS",
    "DEAL_PARTNER_FEED_URLS",
    "DEAL_NEWS_RSS_URLS",
    "DEAL_COMMUNITY_RSS_URLS",
    "PPOMPPU_HOTDEAL_ENABLE",
    "COUPANG_ACCESS_KEY",
    "COUPANG_SECRET_KEY",
    "ELEVENST_API_KEY",
    "DEAL_REFRESH_LIVE_PROBE",
    "DEAL_LINK_LIVE_PROBE",
    "DEAL_LINK_LIVE_STRICT",
    "DEAL_LINK_BODY_PROBE",
    "DEAL_LINK_TIMEOUT_MS",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "AFFILIATE_SUB_ID",
    "DEFAULT_AFFILIATE_URL_TEMPLATE",
    "COUPANG_PARTNERS_URL_TEMPLATE",
    "AFFILIATE_URL_TEMPLATES",
    "TRACKING_SALT",
    "ADMIN_EXPORT_TOKEN",
    "CRON_SECRET",
    "CRON_REFRESH_TIMEOUT_MS"
  ];
  const missingKeys = requiredKeys.filter((key) => !new RegExp(`^${key}=`, "m").test(env));

  if (missingKeys.length) fail("env example", `Missing keys: ${missingKeys.join(", ")}`);
  else pass("env example", "Commercial deployment environment keys are documented.");

  if (!env.includes("Leave empty to use mock fallback locally")) {
    fail("env fallback guidance", ".env.example should explain API-key-free fallback behavior.");
  } else {
    pass("env fallback guidance", "External API keys can be left blank for fallback operation.");
  }

  const envDoctor = await text("scripts/env-doctor.mjs");
  const envDoctorTest = await text("scripts/test-env-doctor.mjs");
  if (
    !envDoctor.includes("isValidPublicUrl") ||
    !envDoctor.includes("--production") ||
    !envDoctor.includes('url.protocol === "https:"') ||
    !envDoctor.includes("redirectUrl.origin === siteUrl.origin") ||
    !envDoctor.includes('"/auth/callback"') ||
    !envDoctor.includes("isValidAppScheme") ||
    !envDoctor.includes("isValidEmail") ||
    !envDoctor.includes("URL values must be https in production")
  ) {
    fail("env doctor format validation", "Environment doctor should validate HTTPS/public URLs, /auth/callback redirect path, app scheme, and support email format.");
  } else {
    pass("env doctor format validation", "Environment doctor validates HTTPS/public URLs, /auth/callback redirect path, app scheme, and support email format.");
  }

  if (
    !envDoctorTest.includes("production rejects localhost site url") ||
    !envDoctorTest.includes("production rejects mismatched auth callback origin") ||
    !envDoctorTest.includes("production rejects unsafe app scheme") ||
    !envDoctorTest.includes("Environment doctor tests passed") ||
    !envDoctorTest.includes("ENV_DOCTOR_REPORT.md") ||
    !envDoctorTest.includes("docs")
  ) {
    fail("env doctor regression tests", "Environment doctor tests should cover localhost, callback origin mismatch, unsafe app scheme, success output, and non-secret report generation.");
  } else {
    pass("env doctor regression tests", "Environment doctor tests cover production URL, callback origin, app scheme regressions, and report generation.");
  }

  const dataModeMatch = env.match(/^DEAL_DATA_MODE=(.+)$/m);
  const providerMatch = env.match(/^DEAL_PROVIDER=(.+)$/m);
  const supportedModes = ["mock", "staging", "production", "hybrid"];
  const invalidModes = [dataModeMatch?.[1], providerMatch?.[1]].filter((mode) => mode && !supportedModes.includes(mode));

  if (!env.includes("mock | staging | production | hybrid") || invalidModes.length) {
    fail("env data mode values", `.env.example should document and use supported runtime modes only. Invalid: ${invalidModes.join(", ") || "comment mismatch"}`);
  } else {
    pass("env data mode values", "Data provider mode examples match the repository runtime modes.");
  }
}

async function checkPublicContact() {
  const publicFiles = [
    "app/page.tsx",
    "components/HomeClient.tsx",
    "app/mypage/page.tsx",
    "app/support/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "components/CommercialFooter.tsx",
    "lib/support.ts"
  ];
  const bodies = await Promise.all(publicFiles.map(async (file) => [file, await text(file)]));
  const filesWithExampleContact = bodies.filter(([, body]) => body.includes("halindosa.example"));

  if (filesWithExampleContact.length) {
    fail("public contact", `Example support contact still appears in: ${filesWithExampleContact.map(([file]) => file).join(", ")}`);
  } else {
    pass("public contact", "No .example support contact is exposed in public app files.");
  }

  const support = await text("lib/support.ts");
  if (!support.includes("NEXT_PUBLIC_SUPPORT_EMAIL") || !support.includes("support@halindosa.com")) {
    fail("support email config", "Support email should be centralized with a production-looking fallback.");
  } else {
    pass("support email config", "Support email is centralized and configurable.");
  }
}

async function checkAuthSurface() {
  const authProvider = await text("components/AuthProvider.tsx");
  const authForm = await text("components/AuthForm.tsx");
  const accountPanel = await text("components/AccountPanel.tsx");
  const socialLoginButtons = await text("components/SocialLoginButtons.tsx");
  const authRedirect = await text("lib/auth/redirect.ts");
  const memberSync = await text("lib/memberSync.ts");
  const accountDeleteRoute = await text("app/api/account/delete/route.ts");
  const supabaseServer = await text("lib/auth/supabaseServer.ts");
  const deepLinkHandler = await text("components/AuthDeepLinkHandler.tsx");
  const recentDealMarker = await text("components/RecentDealMarker.tsx");
  const dealDetailPage = await text("app/deals/[id]/page.tsx");
  const benefitCheckIn = await text("lib/benefitCheckIn.ts");
  const claimedBenefits = await text("lib/claimedBenefits.ts");
  const loginPage = await text("app/login/page.tsx");
  const signupPage = await text("app/signup/page.tsx");
  const supabaseClient = await text("lib/auth/supabaseClient.ts");
  const schema = await text("docs/supabase-schema.sql");
  const smoke = await smokeSource();

  if (!supabaseClient.includes("createClient") || !supabaseClient.includes("persistSession") || !authProvider.includes("onAuthStateChange")) {
    fail("Supabase auth client", "Supabase browser auth should create a persisted client and subscribe to auth state.");
  } else {
    pass("Supabase auth client", "Supabase Auth client persists session and exposes auth state.");
  }

  const requiredAuthCopy = ["signUp", "signInWithPassword", "비밀번호는 8자 이상", "이미 가입된 이메일"];
  const missingAuthCopy = requiredAuthCopy.filter((snippet) => !authForm.includes(snippet));
  if (missingAuthCopy.length || !loginPage.includes("AuthForm") || !signupPage.includes("AuthForm")) {
    fail("auth pages", `Login/signup pages or form missing snippets: ${missingAuthCopy.join(", ") || "page wiring"}`);
  } else {
    pass("auth pages", "Login and signup pages support email/password auth, nickname, and error states.");
  }

  const mypagePage = await text("app/mypage/page.tsx");

  if (!accountPanel.includes("favoriteCategories") || !accountPanel.includes("notificationConsent") || !accountPanel.includes("marketingConsent")) {
    fail("member profile settings", "Mypage account panel should support nickname, favorite categories, and consent settings.");
  } else if (!accountPanel.includes("계정 활동 요약") || !accountPanel.includes("accountSummaryCards") || !accountPanel.includes("구매 링크 확인 특가 보기")) {
    fail("member profile settings", "Mypage account panel should summarize saved deals, recent views, categories, and next actions.");
  } else if (
    !accountPanel.includes("AccountCarryoverPlan") ||
    !accountPanel.includes("accountCarryoverPlan") ||
    !accountPanel.includes("비회원 저장을 계정으로 이어보기") ||
    !accountPanel.includes("저장한 기록만 로그인하면 이어집니다") ||
    !accountPanel.includes("readBenefitReturnReservations") ||
    !accountPanel.includes("재방문 예약") ||
    !smoke.includes("Mypage missing account carryover plan")
  ) {
    fail("member profile settings", "Mypage should make local-to-account carryover clear without gating non-member browsing.");
  } else if (!accountPanel.includes("내 혜택 저장 루틴") || !accountPanel.includes("찜한 혜택 다시 보기") || !accountPanel.includes("최근 본 상품 이어보기") || !accountPanel.includes("가입해야만 볼 수 있는 혜택은 없습니다")) {
    fail("member profile settings", "Mypage should explain optional benefit saving routines for non-members and members.");
  } else if (
    !accountPanel.includes("RecentOfficialBenefitsPanel") ||
    !accountPanel.includes("readRecentNewsBenefitIds") ||
    !accountPanel.includes("마이 최근 본 공식 혜택") ||
    !accountPanel.includes("공식 이벤트와 쿠폰 혜택도 다시 이어봅니다") ||
    !accountPanel.includes("mypage-recent-benefit") ||
    accountPanel.includes("href={deal.finalUrl}") ||
    !smoke.includes("Mypage missing recent official benefit panel")
  ) {
    fail("member profile settings", "Mypage should let users continue official event/coupon benefits through /go/news/[id] with local fallback.");
  } else if (
    !accountPanel.includes("AccountClaimEffortBoard") ||
    !accountPanel.includes("buildClaimEffortSummary") ||
    !accountPanel.includes("getClaimEffort") ||
    !accountPanel.includes("마이 혜택 수령 난이도") ||
    !accountPanel.includes("오늘 먼저 챙길 혜택을 쉬운 순서로 정리") ||
    !accountPanel.includes("간편 수령") ||
    !accountPanel.includes("조건 확인") ||
    !accountPanel.includes("마감 주의") ||
    !smoke.includes("Mypage missing account claim effort board")
  ) {
    fail("member profile settings", "Mypage should connect account saving value to claim-effort guidance without gating non-member browsing.");
  } else if (!accountPanel.includes("이번 주 혜택 루틴 기록") || !accountPanel.includes("홈에서 오늘 루틴 계속하기") || !accountPanel.includes("BenefitCheckInSummary") || !benefitCheckIn.includes("halindosa:benefit-check-in") || !smoke.includes("Mypage missing weekly benefit routine record")) {
    fail("member profile settings", "Mypage should surface the local daily benefit routine record from the shared check-in store.");
  } else if (!accountPanel.includes("readClaimedBenefits") || !accountPanel.includes("오늘 챙김") || !accountPanel.includes("누적 혜택") || !claimedBenefits.includes("halindosa:claimed-benefits") || !smoke.includes("Mypage missing claimed benefit record summary")) {
    fail("member profile settings", "Mypage should summarize locally claimed benefit records for non-member retention.");
  } else if (!mypagePage.includes("설정 점검 요약") || !mypagePage.includes("내 데이터와 알림을 한눈에 관리") || !mypagePage.includes("가격/품절 정보 신고")) {
    fail("member profile settings", "Mypage should summarize account, alert, consent, support, and report management paths.");
  } else {
    pass("member profile settings", "Mypage prepares member profile, interest categories, consent settings, activity summary, and settings hub.");
  }

  if (!socialLoginButtons.includes("signInWithOAuth") || !socialLoginButtons.includes("google") || !socialLoginButtons.includes("kakao") || !socialLoginButtons.includes("naver")) {
    fail("social login buttons", "Login/signup forms should expose Google, Kakao, and Naver-ready OAuth actions.");
  } else if (!authRedirect.includes("getRuntimeAuthRedirectUrl") || !authRedirect.includes("getSafeNextPath") || !authRedirect.includes("halindosa")) {
    fail("social login redirect safety", "OAuth redirects should support web/app runtimes and block open redirect next paths.");
  } else {
    pass("social login redirect safety", "Social login buttons use safe web/app OAuth redirect URLs.");
  }

  if (!memberSync.includes("syncFavoritesWithSupabase") || !memberSync.includes("syncRecentDealsWithSupabase") || !memberSync.includes("toggleFavoriteSynced") || !memberSync.includes("savePreferencesSynced")) {
    fail("member data sync", "Favorites, recent views, and preferences should sync to Supabase with local fallback.");
  } else {
    pass("member data sync", "Favorites, recent views, and member preferences sync to Supabase with graceful fallback.");
  }

  if (!recentDealMarker.includes("recordRecentDealView(dealId)") || !dealDetailPage.includes("<RecentDealMarker dealId={deal.id}")) {
    fail("recent deal detail marker", "Deal detail views should record recent products with Supabase/local fallback.");
  } else {
    pass("recent deal detail marker", "Deal detail views record recent products with Supabase/local fallback.");
  }

  if (!accountPanel.includes("회원 탈퇴") || !supabaseServer.includes("SUPABASE_SERVICE_ROLE_KEY") || !accountDeleteRoute.includes("auth.admin.deleteUser") || !accountDeleteRoute.includes("authorization") || !accountDeleteRoute.includes("deal_click_logs")) {
    fail("account deletion", "Account deletion should verify the logged-in user, delete member data, anonymize click logs, and delete auth user server-side.");
  } else {
    pass("account deletion", "Mypage account deletion uses a server route with service-role-only cleanup and click-log anonymization.");
  }

  if (!deepLinkHandler.includes("appUrlOpen") || !deepLinkHandler.includes("auth/callback") || !deepLinkHandler.includes("/auth/callback")) {
    fail("native OAuth deep link handler", "Capacitor app URL opens should route halindosa://auth/callback into /auth/callback.");
  } else {
    pass("native OAuth deep link handler", "Capacitor OAuth deep links are bridged into the web callback route.");
  }

  const requiredTables = [
    "user_profiles",
    "user_favorite_deals",
    "user_recent_deals",
    "deal_click_logs",
    "price_drop_alerts",
    "deals",
    "deal_validation_logs",
    "provider_runs",
    "admin_actions",
    "push_subscriptions",
    "deal_engagement_rollups",
    "deal_popularity_snapshots",
    "push_notification_queue"
  ];
  const missingTables = requiredTables.filter((table) => !schema.includes(table));
  if (missingTables.length) {
    fail("member database schema", `Missing Supabase tables: ${missingTables.join(", ")}`);
  } else if (!schema.includes("users manage own favorites") || !schema.includes("users manage own recent deals") || !schema.includes("user_id null") || !schema.includes("favorites as") || !schema.includes("recent_views as")) {
    fail("member database schema", "Supabase schema should include RLS for own favorites/recent data, deletion anonymization notes, and compatibility views.");
  } else {
    pass("member database schema", "Supabase schema includes profiles, favorites, recent deals, clicks, price alerts, engagement rollups, provider logs, admin audit, and push notification queue.");
  }

  if (!smoke.includes("auth pages") || !smoke.includes("oauth callback") || !smoke.includes("account deletion guard")) {
    fail("auth smoke coverage", "Smoke tests should cover login/signup pages, onboarding/callback, and account deletion guardrails.");
  } else {
    pass("auth smoke coverage", "Smoke tests cover login/signup pages, onboarding/callback, and account deletion guardrails.");
  }
}

async function checkPublicClaimCopy() {
  const publicFiles = [
    "app/page.tsx",
    "components/HomeClient.tsx",
    "app/admin/page.tsx",
    "app/deals/[id]/page.tsx",
    "components/FeaturedDealSections.tsx",
    "components/DealCard.tsx",
    "data/dealChannels.ts",
    "lib/priceHistory.ts",
    "docs/play-store-listing.md"
  ];
  const blockedPhrases = ["무조건 최저가", "100% 실시간 보장", "공식 판매처 보장", "수익 보장", "최저가 의심 상품", "최근 최저가", "최저가 수준", "최저 현재가"];
  const absolutePriceClaim = "최저가";
  const findings = [];

  for (const file of publicFiles) {
    const body = await text(file);
    for (const phrase of blockedPhrases) {
      if (body.includes(phrase)) findings.push(`${file}: ${phrase}`);
    }
    if (!file.startsWith("docs/") && body.includes(absolutePriceClaim)) findings.push(`${file}: ${absolutePriceClaim}`);
  }

  if (findings.length) {
    fail("public claim copy", `Risky public phrases found: ${findings.join(", ")}`);
  } else {
    pass("public claim copy", "Public UI and listing copy avoids absolute price/availability guarantees.");
  }

  const customerFacingFiles = [
    "app/page.tsx",
    "components/HomeClient.tsx",
    "app/mypage/page.tsx",
    "app/guide/page.tsx",
    "app/support/page.tsx",
    "app/favorites/page.tsx",
    "app/reports/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "components/CommercialFooter.tsx",
    "components/DealCard.tsx",
    "components/LiveDealFeed.tsx",
    "components/FeaturedDealSections.tsx",
    "components/LocalDataControls.tsx",
    "components/PurchaseConfirmSheet.tsx",
    "components/PurchaseSafetyChecklist.tsx",
    "components/ReportForm.tsx",
    "components/SocialLoginButtons.tsx"
  ];
  const internalPhrases = [
    "상업화 준비 체크",
    "헬스체크 API",
    "이벤트 추적 API",
    "SEO/정책 페이지",
    "실시간 특가 업데이트 구조",
    "운영 검수 큐",
    "운영 검수용",
    "Supabase 계정",
    "Naver Developers",
    "커스텀 OIDC",
    "dry-run",
    "운영 계정 기능",
    "계정 동기화 준비 중",
    "확장할 수 있습니다",
    "현재 계정 기능을 준비",
    "현재 빠른 로그인 준비",
    "현재 계정 로그인을 준비",
    "상업화"
  ];
  const internalFindings = [];

  for (const file of customerFacingFiles) {
    const body = await text(file);
    for (const phrase of internalPhrases) {
      if (body.includes(phrase)) internalFindings.push(`${file}: ${phrase}`);
    }
  }

  if (internalFindings.length) {
    fail("customer-facing product copy", `Internal/developer copy found in customer-facing surfaces: ${internalFindings.join(", ")}`);
  } else {
    pass("customer-facing product copy", "Customer-facing app surfaces avoid internal launch, API, and SEO wording.");
  }

  const purchaseTrustCopyFiles = [
    "README_DEPLOY.md",
    "app/guide/page.tsx",
    "app/page.tsx",
    "components/HomeClient.tsx",
    "data/mockDeals.ts",
    "docs/RUNBOOK.md",
    "docs/app-store-checklist.md",
    "docs/device-qa-checklist.md",
    "docs/device-qa-record-template.md",
    "docs/launch-day-checklist.md",
    "docs/link-coverage-report.md",
    "docs/store-submission-packet.md",
    "docs/test-plan.md",
    "lib/affiliate.ts",
    "lib/deals/normalizer.ts",
    "lib/deals/quality.ts"
  ];
  const outdatedPurchaseTrustPhrases = [
    "판매처 검색 확인",
    "판매처 검색으로 확인",
    "판매처 검색 링크",
    "허용된 fallback",
    "검색 fallback 상품 1개",
    "상품 상세 링크 43개",
    "80% 이상 보강률",
    "검수 완료된 실제 상품 상세 링크가 43"
  ];
  const outdatedPurchaseTrustFindings = [];

  for (const file of purchaseTrustCopyFiles) {
    const body = await text(file);
    for (const phrase of outdatedPurchaseTrustPhrases) {
      if (body.includes(phrase)) outdatedPurchaseTrustFindings.push(`${file}: ${phrase}`);
    }
  }

  if (outdatedPurchaseTrustFindings.length) {
    fail("purchase trust copy regression guard", `Outdated purchase trust copy found: ${outdatedPurchaseTrustFindings.join(", ")}`);
  } else {
    pass("purchase trust copy regression guard", "Customer and launch docs use verified product/official benefit URL copy instead of search-fallback wording.");
  }

  const accountModelFiles = [
    "app/page.tsx",
    "components/HomeClient.tsx",
    "app/mypage/page.tsx",
    "app/guide/page.tsx",
    "components/LocalDataControls.tsx",
    "docs/play-store-listing.md",
    "docs/app-store-checklist.md",
    "docs/content-rating-guide.md",
    "docs/data-safety-guide.md",
    "docs/privacy-policy-draft.md"
  ];
  const staleAccountPhrases = [
    "회원가입 없음",
    "현재 회원가입 없이",
    "별도 회원 서버에 저장하지 않습니다",
    "계정 기능 도입 전",
    "찜 목록은 기기 내 저장",
    "회원가입 없이 동작",
    "이 기기에만 저장됩니다"
  ];
  const staleAccountFindings = [];

  for (const file of accountModelFiles) {
    const body = await text(file);
    for (const phrase of staleAccountPhrases) {
      if (body.includes(phrase)) staleAccountFindings.push(`${file}: ${phrase}`);
    }
  }

  if (staleAccountFindings.length) {
    fail("account model copy", `Stale pre-auth copy found: ${staleAccountFindings.join(", ")}`);
  } else {
    pass("account model copy", "Store docs and public app copy reflect optional login with account sync.");
  }
}

async function checkPartnerFeedSafety() {
  const feedImport = await text("lib/feedImport.ts");
  const smoke = await smokeSource();
  const linkValidator = await text("lib/deals/linkValidator.ts");
  const normalizer = await text("lib/deals/normalizer.ts");
  const types = await text("types/deal.ts");
  const mockDeals = await text("data/mockDeals.ts");
  const verifiedPurchaseLinks = await text("data/verifiedPurchaseLinks.ts");
  const partnerFeedValidator = await text("scripts/validate-partner-feed.mjs");

  if (!feedImport.includes("placeholder 또는 커뮤니티 게시글 링크는 운영 피드로 등록할 수 없습니다.")) {
    fail("partner feed unsafe link guard", "Partner feed import should reject placeholder/community links.");
  } else if (!smoke.includes("partner feed import blocks unsafe links")) {
    fail("partner feed unsafe link guard", "Smoke tests should cover unsafe partner feed links.");
  } else if (
    !feedImport.includes("getPrimaryPurchaseUrl") ||
    !feedImport.includes("item.verifiedProductUrl?.trim()") ||
    !feedImport.includes("item.originalUrl?.trim()") ||
    !feedImport.includes("item.eventUrl?.trim()") ||
    !feedImport.includes("finalPurchaseUrl") ||
    !feedImport.includes("sourceName") ||
    !feedImport.includes("sourceUrl") ||
    !feedImport.includes("benefitSummary") ||
    !feedImport.includes("conditionReadyRate") ||
    !feedImport.includes("isSearchOrHomeOnlyUrl") ||
    !feedImport.includes("looksLikeProductDetailUrl") ||
    !feedImport.includes("looksLikeOfficialBenefitDetailUrl") ||
    !feedImport.includes("blog.naver.com") ||
    !feedImport.includes("중복 외부 ID") ||
    !feedImport.includes("검색 결과 fallback은 운영 노출 전에 실제 상품/혜택 상세 URL로 보강해야 합니다.") ||
    !feedImport.includes("rows,") ||
    !feedImport.includes("readyItems") ||
    !feedImport.includes("fixReport") ||
    !feedImport.includes("eligibilityChecklist") ||
    !feedImport.includes("claimSteps") ||
    !feedImport.includes("partner-008") ||
    !feedImport.includes("foodDelivery") ||
    !feedImport.includes("convenienceStore") ||
    !feedImport.includes("mart") ||
    !partnerFeedValidator.includes("수령 전 체크리스트는 3개 이상 필요합니다.") ||
    !partnerFeedValidator.includes("회원가입 필요 여부를 true/false") ||
    !partnerFeedValidator.includes("블로그/뉴스 원문 단독 링크") ||
    !partnerFeedValidator.includes("looksLikeOfficialBenefitDetail") ||
    !mockDeals.includes("rawSourceUrl") ||
    !mockDeals.includes("isCommunitySource") ||
    !smoke.includes("Partner productUrl should normalize as a verified purchase link") ||
    !smoke.includes("Import benefit condition summary should be ready") ||
    !smoke.includes("Expected search fallback validation issue") ||
    !smoke.includes("Expected duplicate feed row validation issue") ||
    !smoke.includes("Import dry-run should expose needs_fix row summaries") ||
    !smoke.includes("Import dry-run should expose ready items for production feed handoff") ||
    !smoke.includes("Import dry-run should expose needs_fix items for operator repair") ||
    !smoke.includes("Sample feed API missing V2 benefit sample feed rows") ||
    !smoke.includes("should separate community source URL from final purchase URL")
  ) {
    fail("partner feed purchase link fields", "Partner feed import should accept canonical purchase URL, source, benefit type, and claim-condition fields with readiness reporting.");
  } else {
    pass("partner feed unsafe link guard", "Partner feed import rejects unsafe links and accepts canonical product URL, source, and benefit condition fields.");
  }

  const requiredLinkFields = ["linkVerified", "finalUrl", "checkedAt", "purchaseConfidence", "purchaseLinkVerified", "finalPurchaseUrl", "validationCode", "publishable"];
  const missingTypeFields = requiredLinkFields.filter((field) => !types.includes(field));
  const missingSmokeFields = requiredLinkFields.filter((field) => !smoke.includes(field));

  if (!linkValidator.includes("export function validatePurchaseLink") || !linkValidator.includes("export async function probePurchaseLink") || !linkValidator.includes("isKnownProductDetailUrl") || !linkValidator.includes("isSearchOrCategoryUrl")) {
    fail("purchase link validator", "lib/deals/linkValidator.ts should classify product detail, search/category, home, placeholder, community links, and support optional HTTP probing.");
  } else if (
    !normalizer.includes("validatePurchaseLink") ||
    !normalizer.includes("input.affiliateUrl") ||
    !normalizer.includes("input.verifiedProductUrl") ||
    !normalizer.includes("input.searchUrl") ||
    !normalizer.includes("sanitizePublicAuxiliaryUrl") ||
    !smoke.includes("exposed a public searchUrl fallback") ||
    !smoke.includes("exposed a public sourceUrl search fallback") ||
    missingTypeFields.length ||
    missingSmokeFields.length
  ) {
    fail("purchase link validator", `Purchase link fields should be typed, normalized, and smoke-tested. Missing type: ${missingTypeFields.join(", ") || "none"}, smoke: ${missingSmokeFields.join(", ") || "none"}`);
  } else {
    pass("purchase link validator", "Deal normalization exposes purchase link verification fields and smoke tests cover them.");
  }

  const dealCount = [...mockDeals.matchAll(/deal\("d\d+"/g)].length;
  const verifiedCount = [...verifiedPurchaseLinks.matchAll(/^\s*d\d+:/gm)].length;
  const verifiedRate = dealCount ? Math.round((verifiedCount / dealCount) * 100) : 0;
  const linkReport = existsSync(join(root, "docs/link-coverage-report.md")) ? await text("docs/link-coverage-report.md") : "";

    if (verifiedCount < 90 || verifiedRate < 100) {
      fail("verified purchase link coverage", `Expected all 90 curated deals to have verified direct seller/product links, got ${verifiedCount}/${dealCount} (${verifiedRate}%).`);
    } else if (!smoke.includes("verified direct purchase link coverage")) {
      fail("verified purchase link coverage", "Smoke tests should assert the verified direct purchase link coverage threshold.");
  } else if (!linkReport.includes(`검증된 실제 구매 상세 URL: ${verifiedCount}개`) || !linkReport.includes(`검증 커버리지: ${verifiedRate}%`) || !linkReport.includes("보강 대기 상품")) {
    fail("verified purchase link coverage", "docs/link-coverage-report.md should be refreshed with current verified link coverage and review queue.");
  } else {
      pass("verified purchase link coverage", `${verifiedCount}/${dealCount} curated deals have manually reviewed product detail URLs (${verifiedRate}%).`);
    }

    const requiredBenefitExamples = [
      "BC카드 페이북",
      "카카오페이 편의점",
      "토스 출석체크",
      "T멤버십",
      "BHC 앱 치킨 첫 주문",
      "아이챌린지 베이비",
      "메가박스 공식 영화",
      "현대카드 M포인트",
      "카카오톡 선물하기",
      "티켓링크 전시"
    ];
    const requiredVerifiedBenefitIds = ["d053:", "d054:", "d055:", "d056:", "d057:", "d058:", "d059:", "d060:"];
    const missingBenefitExamples = [
      ...requiredBenefitExamples.filter((snippet) => !mockDeals.includes(snippet)),
      ...requiredVerifiedBenefitIds.filter((snippet) => !verifiedPurchaseLinks.includes(snippet))
    ];

    if (missingBenefitExamples.length || !smoke.includes('["point", "foodDelivery", "experience"]') || !smoke.includes("benefit filter should return deals")) {
      fail("benefit data density", `Mock benefits should include verified apptech, pay, membership, delivery, sample, and invitation examples. Missing: ${missingBenefitExamples.join(", ") || "smoke coverage"}`);
    } else {
      pass("benefit data density", "Mock benefits include verified apptech, pay, membership, delivery, sample, and invitation examples.");
  }
}

async function checkSearchAndPurchaseFlow() {
  const search = await text("lib/deals/search.ts");
  const repository = await text("lib/deals/dealRepository.ts");
  const homePage = await homeSource();
  const smoke = await smokeSource();
  const verifyLinks = await text("scripts/verify-product-links.mjs");
  const catalogDoctor = await text("scripts/catalog-quality-doctor.mjs");
  const searchQualityDoctor = await text("scripts/search-quality-doctor.mjs");
  const purchaseNavigationDoctor = await text("scripts/purchase-navigation-doctor.mjs");
  const detailNavigationDoctor = await text("scripts/detail-navigation-doctor.mjs");
  const homeUrlStateDoctor = await text("scripts/home-url-state-doctor.mjs");
  const packageJson = `${await text("package.json")}\n${await text("scripts/run-qa.mjs")}`;
  const featured = await text("components/FeaturedDealSections.tsx");
  const liveFeed = await text("components/LiveDealFeed.tsx");
  const homeDealGrid = await text("components/home/HomeDealGrid.tsx");
  const quickDealCard = await text("components/QuickDealCard.tsx");
  const homeFreebieHero = await text("components/home/HomeFreebieHero.tsx");
  const benefitEventsRoute = await text("app/api/benefits/events/route.ts");
  const homeApiRoute = await text("app/api/home/route.ts");
  const freebiesApiRoute = await text("app/api/freebies/route.ts");
  const homeRuntimeSource = `${homePage}\n${homeDealGrid}\n${quickDealCard}\n${homeFreebieHero}`;

  if (
    !search.includes("normalizeSearchText") ||
    !search.includes("compactSearchText") ||
    !search.includes("dealMatchesSearch") ||
    !repository.includes("dealMatchesSearch") ||
    !homePage.includes("window.history.replaceState") ||
    !smoke.includes("Spaced Korean search should match compact product names") ||
    !search.includes("searchAliasesSource") ||
    !searchQualityDoctor.includes("Search quality doctor passed") ||
    !searchQualityDoctor.includes("생필품") ||
    !searchQualityDoctor.includes("무배") ||
    !searchQualityDoctor.includes("앱테크") ||
    !packageJson.includes("search:doctor") ||
    (!packageJson.includes("catalog:doctor") || !packageJson.includes("search:doctor"))
  ) {
    fail("search purchase discovery", "Search should normalize Korean spacing, share logic between API/home, persist query params, support daily Korean synonym searches, and be smoke-tested.");
  } else {
    pass("search purchase discovery", "Search normalizes Korean spacing, mall/brand/tag text, daily synonym terms, URL state, and smoke coverage.");
  }

  if (
    !verifyLinks.includes("Product link verification passed") ||
    !verifyLinks.includes("검색/카테고리 링크입니다") ||
    !verifyLinks.includes("커뮤니티 또는 placeholder") ||
    !verifyLinks.includes("allowedSources") ||
    !verifyLinks.includes("evidence 검수 근거") ||
    !verifyLinks.includes("Distinct purchase hosts") ||
    !verifyLinks.includes("hasProductDetailSignal") ||
    !verifyLinks.includes("hasClaimOrBenefitSignal") ||
    !verifyLinks.includes("Product detail URLs") ||
    !verifyLinks.includes("Official benefit/event URLs") ||
    !catalogDoctor.includes("minimums") ||
    !catalogDoctor.includes("requiredCategories") ||
    !catalogDoctor.includes("requiredDealTypes") ||
    !packageJson.includes("catalog:report") ||
    !purchaseNavigationDoctor.includes("window.open(redirectUrl") ||
    !purchaseNavigationDoctor.includes("buildNativeSafeDealUrl") ||
    !purchaseNavigationDoctor.includes("Browser.open") ||
    !purchaseNavigationDoctor.includes("quickDealCard") ||
    !purchaseNavigationDoctor.includes("disabled={!linkAvailable}") ||
    !purchaseNavigationDoctor.includes("판매처 이동 전 확인") ||
    !detailNavigationDoctor.includes("Detail navigation doctor passed") ||
    !detailNavigationDoctor.includes('target="_blank"') ||
    !detailNavigationDoctor.includes('rel="noopener noreferrer"') ||
    !homeUrlStateDoctor.includes("requiredUrlState") ||
    !homeUrlStateDoctor.includes("verifiedOnly") ||
    !homeUrlStateDoctor.includes("window.history.replaceState") ||
    !packageJson.includes("catalog:doctor") ||
    !packageJson.includes("purchase:navigation:doctor") ||
    !packageJson.includes("detail:navigation:doctor") ||
    !packageJson.includes("home:url-state:doctor") ||
    !packageJson.includes("home:realtime:doctor") ||
    (!packageJson.includes("purchase:navigation:doctor") || !packageJson.includes("detail:navigation:doctor")) ||
    featured.includes('href="#all-deals"') ||
    liveFeed.includes('href="#all-deals"') ||
    homePage.includes('getElementById("all-deals")') ||
    homePage.includes('href="#all-deals"') ||
    !homePage.includes("혜택 검색") ||
    !homePage.includes("무료혜택·쿠폰부터 바로 좁혀보세요") ||
    !homePage.includes("refreshHomeNow") ||
    !homePage.includes("fetchDeals(undefined, true)") ||
    !homePage.includes("무료혜택 다음에 볼 상품") ||
    !homePage.includes("instantDealRail") ||
    !homeRuntimeSource.includes("QuickDealCard") ||
    !quickDealCard.includes("구매하기") ||
    !quickDealCard.includes('target="_blank"') ||
    !homeRuntimeSource.includes("상품 이동은 모두 새 탭") ||
    !homeRuntimeSource.includes("카테고리 바로가기") ||
    !homeRuntimeSource.includes("quickCategoryShortcuts") ||
    !homePage.includes("data-home-required-free-benefit-categories") ||
    !homePage.includes("data-home-free-benefit-category-representatives") ||
    !homePage.includes("buildFreeBenefitCategoryCoverageReport") ||
    !homeFreebieHero.includes("data-home-required-free-benefit-categories") ||
    !homeFreebieHero.includes("data-home-free-benefit-category-representatives") ||
    !homeFreebieHero.includes("categoryRepresentativeBenefits") ||
    !homeFreebieHero.includes("claimEaseScore") ||
    !homeFreebieHero.includes("claimUrgencyLabel") ||
    !homeFreebieHero.includes("requiredCategoryCoverage") ||
    !homeApiRoute.includes("requiredCategoryCoverage") ||
    !homeApiRoute.includes("categoryCandidateGroups") ||
    !homeApiRoute.includes("buildFreeBenefitCategoryCoverageReport") ||
    !freebiesApiRoute.includes("requiredCategoryCoverage") ||
    !freebiesApiRoute.includes("categoryCandidateGroups") ||
    !smoke.includes("required free benefit category coverage") ||
    !benefitEventsRoute.includes("isPublishableFreeBenefitEvent") ||
    !benefitEventsRoute.includes("getClientKey(request, \"benefit-events\")") ||
    !benefitEventsRoute.includes("BENEFIT_EVENTS_LOAD_FAILED") ||
    !benefitEventsRoute.includes("publishableOnly: true") ||
    !benefitEventsRoute.includes("rankingPolicy") ||
    !benefitEventsRoute.includes("runtimeReadiness") ||
    !benefitEventsRoute.includes("buildFreeBenefitEventRuntimeReadiness") ||
    !benefitEventsRoute.includes("claimCtaLabel") ||
    !benefitEventsRoute.includes("claimAccessLabel") ||
    !benefitEventsRoute.includes("trustBadges") ||
    !benefitEventsRoute.includes("noPurchaseOnly") ||
    !smoke.includes("free benefit events api") ||
    !smoke.includes("runtimeReadiness") ||
    !smoke.includes("/api/benefits/events?limit=12&type=all") ||
    !smoke.includes("sort=noPurchase&noPurchaseOnly=true")
  ) {
    fail("purchase link new-tab guard", "Verified product link script, catalog quality doctor, detail new-tab doctor, URL state doctor, top quick search, free benefit event API, and scroll-free purchase discovery links should be present.");
  } else {
    pass("purchase link new-tab guard", "Verified product link, catalog quality, purchase navigation, detail new-tab, URL state, and free benefit event API scripts are present; top search is visible and product discovery CTAs avoid hash-scroll links.");
  }
}



async function checkCapacitor() {
  const config = await text("capacitor.config.ts");
  const nextConfig = await text("next.config.mjs");
  const androidBuildScript = await text("scripts/build-android.mjs");

  if (!config.includes("appId: 'com.halindosa.app'")) fail("capacitor appId", "Expected com.halindosa.app.");
  else pass("capacitor appId", "com.halindosa.app");

  if (!config.includes("appName: '할인도사'")) fail("capacitor appName", "Expected 할인도사.");
  else pass("capacitor appName", "할인도사");

  if (!config.includes("webDir: 'out'")) fail("capacitor webDir", "Expected out.");
  else pass("capacitor webDir", "out");

  if (
    !config.includes("defaultAppWebUrl = 'https://www.halindosa.com'") ||
    !config.includes("url: appWeb.origin") ||
    !config.includes("allowNavigation: ['halindosa.com', 'www.halindosa.com']") ||
    !config.includes("errorPath: 'offline.html'")
  ) {
    fail("Capacitor production WebView", "Android/iOS app should load https://www.halindosa.com with a Halindosa-only navigation allowlist and local error fallback.");
  } else {
    pass("Capacitor production WebView", "Native shells load the production Halindosa web app and keep local export fallback.");
  }

  if (!nextConfig.includes("isCapacitorBuild") || !nextConfig.includes("? {}") || !androidBuildScript.includes("DEAL_DATA_MODE")) {
    fail("Capacitor export stability", "Capacitor export should avoid unsupported headers and set DEAL_DATA_MODE.");
  } else {
    pass("Capacitor export stability", "Capacitor static export avoids unsupported headers and uses runtime data mode.");
  }
}

async function checkAndroid() {
  const gradle = await text("android/app/build.gradle");
  const strings = await text("android/app/src/main/res/values/strings.xml");
  const manifest = await text("android/app/src/main/AndroidManifest.xml");
  const androidConfigXml = await text("android/app/src/main/res/xml/config.xml");

  if (!gradle.includes('applicationId "com.halindosa.app"')) fail("Android applicationId", "Expected com.halindosa.app.");
  else pass("Android applicationId", "com.halindosa.app");

  if (!gradle.includes("versionCode 2")) fail("Android versionCode", "Expected versionCode 2.");
  else pass("Android versionCode", "2");

  if (!gradle.includes('versionName "1.0.1"')) fail("Android versionName", "Expected versionName 1.0.1.");
  else pass("Android versionName", "1.0.1");

  if (!strings.includes("<string name=\"app_name\">할인도사</string>")) fail("Android app label", "Expected 할인도사 app_name.");
  else pass("Android app label", "할인도사");

  const hasInternet = manifest.includes("android.permission.INTERNET");
  const forbiddenPermissions = ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "CAMERA", "RECORD_AUDIO", "READ_CONTACTS"].filter((permission) =>
    manifest.includes(permission)
  );

  if (!hasInternet) fail("Android permissions", "INTERNET permission is required for external pages.");
  else if (forbiddenPermissions.length) fail("Android permissions", `Unexpected permissions: ${forbiddenPermissions.join(", ")}`);
  else pass("Android permissions", "Only expected network permission found.");

  if (!manifest.includes('android:usesCleartextTraffic="false"') || !manifest.includes('android:networkSecurityConfig="@xml/network_security_config"')) {
    fail("Android WebView network security", "Production app should disable cleartext traffic and reference network_security_config.");
  } else if (!existsSync(join(root, "android/app/src/main/res/xml/network_security_config.xml"))) {
    fail("Android WebView network security", "Missing network_security_config.xml.");
  } else if (androidConfigXml.includes('<access origin="*"')) {
    fail("Android WebView domain allowlist", "config.xml should not allow wildcard access origins.");
  } else if (!androidConfigXml.includes("https://halindosa.com") || !androidConfigXml.includes("https://www.halindosa.com")) {
    fail("Android WebView domain allowlist", "config.xml should allow only Halindosa HTTPS domains.");
  } else {
    pass("Android WebView network security", "HTTPS-only WebView access is restricted to Halindosa domains.");
  }

  if (!manifest.includes('android:scheme="halindosa"') || !manifest.includes('android:host="auth"') || !manifest.includes('android:pathPrefix="/callback"')) {
    fail("Android auth deep link", "AndroidManifest should register halindosa://auth/callback.");
  } else {
    pass("Android auth deep link", "halindosa://auth/callback intent-filter is registered.");
  }

  const iconFiles = [
    "android/app/src/main/res/mipmap-mdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-hdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
  ];
  const missingIcons = iconFiles.filter((file) => !existsSync(join(root, file)));
  if (missingIcons.length) fail("Android icons", `Missing: ${missingIcons.join(", ")}`);
  else pass("Android icons", "Launcher icon densities are present.");

  if (!existsSync(join(root, "android/app/src/main/res/drawable/splash.png"))) fail("Android splash", "Missing drawable/splash.png.");
  else pass("Android splash", "Splash image exists.");
}

async function checkIos() {
  const project = "ios/App/App.xcodeproj/project.pbxproj";
  const plist = "ios/App/App/Info.plist";
  const privacyManifest = "ios/App/App/PrivacyInfo.xcprivacy";
  const icon = "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png";
  const splash = "ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png";

  if (!existsSync(join(root, project))) {
    fail("iOS project", "Run npx cap add ios on a machine with Capacitor iOS support.");
    return;
  }
  pass("iOS project", "ios/App is present.");

  if (!existsSync(join(root, plist))) {
    fail("iOS Info.plist", "Missing ios/App/App/Info.plist.");
    return;
  }

  const pbx = await text(project);
  const info = await text(plist);
  const privacy = existsSync(join(root, privacyManifest)) ? await text(privacyManifest) : "";

  if (!pbx.includes("PRODUCT_BUNDLE_IDENTIFIER = com.halindosa.app;")) fail("iOS bundle identifier", "Expected com.halindosa.app.");
  else pass("iOS bundle identifier", "com.halindosa.app");

  if (!pbx.includes("CURRENT_PROJECT_VERSION = 2;")) fail("iOS build number", "Expected CURRENT_PROJECT_VERSION 2.");
  else pass("iOS build number", "2");

  if (!pbx.includes("MARKETING_VERSION = 1.0.1;")) fail("iOS version", "Expected MARKETING_VERSION 1.0.1.");
  else pass("iOS version", "1.0.1");

  if (!info.includes("<string>할인도사</string>")) fail("iOS display name", "Expected 할인도사.");
  else pass("iOS display name", "할인도사");

  if (!info.includes("CFBundleURLTypes") || !info.includes("<string>halindosa</string>")) {
    fail("iOS auth deep link", "Info.plist should register halindosa URL scheme.");
  } else {
    pass("iOS auth deep link", "halindosa URL scheme is registered.");
  }

  if (fileSize(icon) <= 0) fail("iOS app icon", "Missing AppIcon-512@2x.png.");
  else pass("iOS app icon", "App Store icon asset is present.");

  if (fileSize(splash) <= 0) fail("iOS splash", "Missing Splash.imageset splash image.");
  else pass("iOS splash", "Splash image asset is present.");

  const restrictedPrivacyKeys = [
    "NSUserTrackingUsageDescription",
    "NSCameraUsageDescription",
    "NSMicrophoneUsageDescription",
    "NSLocationWhenInUseUsageDescription",
    "NSLocationAlwaysAndWhenInUseUsageDescription",
    "NSContactsUsageDescription",
    "NSPhotoLibraryUsageDescription"
  ].filter((key) => info.includes(key));

  if (restrictedPrivacyKeys.length) fail("iOS privacy permissions", `Unexpected keys: ${restrictedPrivacyKeys.join(", ")}`);
  else pass("iOS privacy permissions", "No tracking, camera, microphone, location, contacts, or photo permissions declared.");

  if (!privacy) {
    fail("iOS privacy manifest", "Missing ios/App/App/PrivacyInfo.xcprivacy.");
  } else if (!pbx.includes("PrivacyInfo.xcprivacy in Resources") || !privacy.includes("<key>NSPrivacyTracking</key>") || !privacy.includes("<false/>") || !privacy.includes("<key>NSPrivacyCollectedDataTypes</key>")) {
    fail("iOS privacy manifest", "PrivacyInfo.xcprivacy should be bundled and declare no tracking or collected data for V1.");
  } else {
    pass("iOS privacy manifest", "PrivacyInfo.xcprivacy is bundled and declares no tracking or collected data for V1.");
  }
}

async function checkPolicyAndStoreDocs() {
  const requiredFiles = [
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "app/guide/page.tsx",
    "app/support/page.tsx",
    "docs/play-store-listing.md",
    "docs/release-checklist.md",
    "docs/privacy-policy-draft.md",
    "docs/terms-draft.md",
    "docs/data-safety-guide.md",
    "docs/content-rating-guide.md",
    "docs/test-plan.md",
    "docs/roadmap.md",
    "docs/store-assets-guide.md",
    "docs/admin-system-design.md",
    "docs/monetization.md",
    "docs/push-notification-design.md",
    "docs/seo-strategy.md",
    "docs/competitor-analysis.md",
    "docs/analytics-plan.md",
    "docs/data-source-runbook.md",
    "docs/app-store-checklist.md",
    "docs/release-evidence.md",
    "docs/launch-day-checklist.md",
    "docs/weekly-operation-guide.md",
    "docs/customer-support-guide.md",
    "docs/v1-1-roadmap.md",
    "docs/OAUTH_SETUP.md",
    "docs/DEEPLINK_AUTH.md",
    "docs/ACCOUNT_DELETION.md",
    "docs/device-qa-checklist.md",
    "docs/device-qa-record-template.md",
    "docs/deployment-env-checklist.md",
    "docs/store-submission-packet.md",
    "docs/store-review-notes.md",
    "docs/link-coverage-report.md",
    "README.md",
    "docs/RUNBOOK.md",
    "scripts/env-doctor.mjs"
  ];
  const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

  if (missing.length) fail("policy and store docs", `Missing: ${missing.join(", ")}`);
  else pass("policy and store docs", "Required policy/listing drafts are present.");

  const requiredContent = [
    {
      name: "store metadata guard",
      file: "scripts/store-metadata-doctor.mjs",
      phrases: ["Play Store short description should be 1-80 characters", "Risky store metadata phrases", "App Store checklist should include bundle id", "npm run env:doctor:production", "npm run test:env", "npm run public:url:doctor"]
    },
    {
      name: "device qa record guard",
      file: "scripts/device-qa-doctor.mjs",
      phrases: ["device QA", "launch-critical device evidence", "sensitive user/release data", "docs/device-qa-record-template.md"]
    },
    {
      name: "privacy policy content",
      file: "app/privacy/page.tsx",
      phrases: ["회원가입 없이", "기기 또는 브라우저 저장소", "분석 및 제휴 추적", "보관 기간", "처리 위탁 및 제3자 제공", "외부 링크", "사용자 권리", "가격 오류"]
    },
    {
      name: "terms content",
      file: "app/terms/page.tsx",
      phrases: ["정보 제공 서비스", "판매처 페이지의 최종 조건", "직접 처리하지 않습니다", "제휴 링크 또는 광고 링크"]
    },
    {
      name: "service guide content",
      file: "app/guide/page.tsx",
      phrases: ["직접 상품을 판매하지 않습니다", "구매 전 꼭 확인하세요", "외부 판매처 이동 방식", "제휴 파라미터", "계정과 데이터 관리", "회원 탈퇴", "신고와 고객 문의"]
    },
    {
      name: "support page content",
      file: "app/support/page.tsx",
      phrases: ["고객센터", "가격·품절·링크 신고", "구매 전 확인 기준", "이메일 문의", "자주 묻는 질문", "개인정보처리방침", "이용약관", "마이 설정"]
    },
    {
      name: "data safety guide content",
      file: "docs/data-safety-guide.md",
      phrases: ["수집하지 않음", "앱 내 결제 없음", "처리 위탁 및 외부 서비스", "데이터 삭제", "보관 기간", "개인정보처리방침 URL"]
    },
    {
      name: "privacy policy draft content",
      file: "docs/privacy-policy-draft.md",
      phrases: ["보관 기간", "처리 위탁 및 제3자 제공", "삭제 방법", "Supabase", "통계용 클릭 로그"]
    },
    {
      name: "test plan content",
      file: "docs/test-plan.md",
      phrases: ["자동 검증", "수동 확인", "데이터/링크 신뢰도", "테스트 종료 기준", "링크 검수 큐", "docs/device-qa-checklist.md", "test:mobile-ux", "MOBILE_UX_REPORT.md", "무료혜택 다음에 볼 상품", "오른쪽 fade", "옆으로 넘기기"]
    },
    {
      name: "readme qa guidance",
      file: "README.md",
      phrases: ["모바일 UX", "test:mobile-ux", "MOBILE_UX_REPORT.md", "외부 링크/이미지/이미지 운영 doctor", "release:doctor", "무료혜택 다음에 볼 상품", "오른쪽 fade", "옆으로 넘기기"]
    },
    {
      name: "runbook harness guidance",
      file: "docs/RUNBOOK.md",
      phrases: ["모바일 UX compact first-screen 검사", "MOBILE_UX_REPORT.md", "test:mobile-ux", "qa", "harness", "무료혜택 다음에 볼 상품", "오른쪽 fade", "옆으로 넘기기"]
    },
    {
      name: "oauth setup content",
      file: "docs/OAUTH_SETUP.md",
      phrases: ["Google Provider", "Kakao Provider", "Naver Provider", "Redirect URLs", "halindosa://auth/callback"]
    },
    {
      name: "deep link auth content",
      file: "docs/DEEPLINK_AUTH.md",
      phrases: ["Android 설정", "iOS 설정", "Supabase에 등록할 Redirect URL", "출시 전 테스트 체크리스트"]
    },
    {
      name: "account deletion content",
      file: "docs/ACCOUNT_DELETION.md",
      phrases: ["SUPABASE_SERVICE_ROLE_KEY", "user_favorite_deals", "user_recent_deals", "deal_click_logs", "auth.users"]
    },
    {
      name: "release evidence content",
      file: "docs/release-evidence.md",
      phrases: ["릴리즈 증빙", "최신 커밋", "Release AAB", "Commercial audit report", "Environment doctor report", "Public URL submission report", "Store metadata QA report", "Store asset QA report", "Store submission packet QA report", "Store console fields manifest", "Store manual submission checklist", "Store launch handoff report", "Release notes", "Support playbook", "Known issues report", "Store screenshot QA report", "Store screenshot manifest", "Device QA execution manifest", "Device QA readiness report", "Store submission readiness report", "Harness report", "Image backlog report", "Image backlog CSV", "Image backlog next batch CSV", "Image backlog mall request CSV", "npm run image:backlog:report", "npm run store:screenshots:manifest", "npm run store:console:fields", "npm run store:manual:checklist", "npm run store:manual:doctor", "npm run store:handoff:report", "npm run release:notes", "npm run support:playbook", "npm run known:issues", "npm run device:qa:manifest", "npm run harness", "npm run env:doctor:production", "npm run test:env", "npm run public:url:doctor", "Android signing doctor", "device QA doctor", "자동 검증 범위", "남은 수동 확인", "공개 개인정보처리방침/고객지원 URL"]
    },
    {
      name: "release checklist content",
      file: "docs/release-checklist.md",
      phrases: ["npm run env:doctor:production", "npm run test:env", "npm run public:url:doctor", "public URL doctor", "공개 개인정보처리방침/고객지원 URL", "/privacy", "/support", "/sitemap.xml", "/robots.txt", "signed AAB", "무료혜택 다음에 볼 상품", "오른쪽 fade", "옆으로 넘기기"]
    },
    {
      name: "launch day checklist content",
      file: "docs/launch-day-checklist.md",
      phrases: ["제출 24시간 전", "npm run test:env", "npm run env:doctor:production", "npm run public:url:doctor", "개인정보처리방침/고객지원 공개 URL", "/sitemap.xml", "고객지원 공개 URL", "Play Console 제출", "App Store Connect 제출", "출시 당일 운영 순서", "출시 후 72시간"]
    },
    {
      name: "store screenshot storyboard content",
      file: "docs/store-assets-guide.md",
      phrases: ["스크린샷 스토리보드", "오늘 먼저 볼 특가를 한눈에", "스크린샷 금지 요소", "내부 점수"]
    },
    {
      name: "store asset qa report content",
      file: "docs/STORE_ASSETS_REPORT.md",
      phrases: ["Store Asset QA Report", "Asset Dimension Checks", "Play Store icon", "Play Store feature graphic", "iOS App Store icon", "Manual Work That Must Not Be Faked"]
    },
    {
      name: "store screenshot qa report content",
      file: "docs/STORE_SCREENSHOTS_REPORT.md",
      phrases: ["Store Screenshot QA Report", "Generated by: `npm run store:screenshots:doctor`", "Branch:", "Commit:", "Working tree:", "Screenshot Capture Board", "npm run store:screenshots:manifest", "Required Scenes", "home", "search", "detail", "favorites", "notifications", "mypage", "Screenshot Safety Checklist", "Manual Work That Must Not Be Faked"]
    },
    {
      name: "store screenshot manifest content",
      file: "docs/STORE_SCREENSHOT_MANIFEST.md",
      phrases: ["Store Screenshot Capture Manifest", "Required Viewports", "Play Store phone", "App Store iPhone 6.7", "Scene File Names", "01-home-play-1080x1920.png", "06-mypage-appstore-1290x2796.png", "Manual Work That Must Not Be Faked"]
    },
    {
      name: "device qa execution manifest content",
      file: "docs/DEVICE_QA_MANIFEST.md",
      phrases: ["Device QA Execution Manifest", "Build And Evidence", "Required Device Targets", "Manual Check Matrix", "Purchase Link Samples", "Sensitive Data Rule", "Manual Work That Must Not Be Faked"]
    },
    {
      name: "device qa readiness report content",
      file: "docs/DEVICE_QA_REPORT.md",
      phrases: ["Device QA Readiness Report", "Generated by: `npm run device:qa:report`", "Branch:", "Commit:", "Working tree:", "Manual Device Checks Still Required", "Pending manual check", "Purchase Link Sample Set", "Sensitive Data Rule"]
    },
    {
      name: "device qa checklist content",
      file: "docs/device-qa-checklist.md",
      phrases: ["Android 기기 확인", "iOS 기기 또는 Simulator 확인", "로그인과 계정 데이터", "구매 링크와 신고", "스토어 제출 직전 판정", "docs/device-qa-record-template.md", "npm run device:qa:manifest", "docs/DEVICE_QA_MANIFEST.md", "npm run test:mobile-ux", "MOBILE_UX_REPORT.md", "무료혜택 다음에 볼 상품", "오른쪽 fade", "옆으로 넘기기"]
    },
    {
      name: "device qa record template content",
      file: "docs/device-qa-record-template.md",
      phrases: ["테스트 개요", "Android 기기 기록", "iOS 기기 기록", "구매 링크 샘플 검수", "남은 Critical Issue", "기록 보안 원칙", "실기기 QA 매니페스트", "npm run device:qa:manifest", "주문번호", "keystore", "무료혜택 다음에 볼 상품 가로 레일", "오른쪽 fade", "옆으로 넘기기"]
    },
    {
      name: "deployment env checklist content",
      file: "docs/deployment-env-checklist.md",
      phrases: ["npm run env:doctor", "node scripts/env-doctor.mjs --strict", "npm run env:doctor:production", "npm run test:env", "NEXT_PUBLIC_SITE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DEAL_DATA_MODE", "npm run public:url:doctor", "공개 개인정보처리방침 URL"]
    },
    {
      name: "public url submission report content",
      file: "docs/PUBLIC_URL_REPORT.md",
      phrases: ["Public URL Submission Report", "Generated by: `npm run public:url:doctor`", "Branch:", "Commit:", "Working tree:", "Expected Production URLs", "Privacy policy", "Customer support", "sitemap.xml", "robots.txt", "Pending manual check", "Manual Work That Must Not Be Faked"]
    },
    {
      name: "store metadata qa report content",
      file: "docs/STORE_METADATA_REPORT.md",
      phrases: ["Store Metadata QA Report", "Length Checks", "Play short description", "Required Review Copy", "Risky Phrase Scan", "Manual Work That Must Not Be Faked"]
    },
    {
      name: "store submission packet content",
      file: "docs/store-submission-packet.md",
      phrases: ["Android release AAB", "Play Store 등록 문구", "App Store Connect 입력값", "공개 URL 제출 리포트", "스토어 메타데이터 QA 리포트", "스토어 이미지 QA 리포트", "스토어 스크린샷 QA 리포트", "스토어 스크린샷 촬영 매니페스트", "실기기 QA 실행 매니페스트", "스토어 제출 준비 리포트", "스토어 제출 패킷 QA 리포트", "스토어 콘솔 입력 필드 매니페스트", "수동 제출 체크리스트", "스토어 출시 인수인계 리포트", "릴리즈 노트", "고객지원 플레이북", "Known Issues 리포트", "docs/PUBLIC_URL_REPORT.md", "docs/STORE_METADATA_REPORT.md", "docs/STORE_ASSETS_REPORT.md", "docs/STORE_SCREENSHOTS_REPORT.md", "docs/STORE_SCREENSHOT_MANIFEST.md", "STORE_SCREENSHOT_MANIFEST.json", "docs/DEVICE_QA_MANIFEST.md", "DEVICE_QA_MANIFEST.json", "docs/STORE_SUBMISSION_REPORT.md", "docs/STORE_PACKET_REPORT.md", "docs/STORE_CONSOLE_FIELDS.md", "STORE_CONSOLE_FIELDS.json", "docs/STORE_MANUAL_CHECKLIST.md", "STORE_MANUAL_CHECKLIST.md", "STORE_MANUAL_CHECKLIST.json", "docs/STORE_HANDOFF_REPORT.md", "STORE_HANDOFF_REPORT.md", "docs/RELEASE_NOTES.md", "RELEASE_NOTES.md", "RELEASE_NOTES.json", "docs/SUPPORT_PLAYBOOK.md", "SUPPORT_PLAYBOOK.md", "SUPPORT_PLAYBOOK.json", "docs/KNOWN_ISSUES.md", "KNOWN_ISSUES.md", "npm run store:submission:report", "npm run store:packet:doctor", "npm run store:console:fields", "npm run store:manual:checklist", "npm run store:manual:doctor", "npm run store:handoff:report", "npm run release:notes", "npm run support:playbook", "npm run known:issues", "npm run store:assets:doctor", "npm run store:screenshots:manifest", "npm run store:screenshots:doctor", "npm run device:qa:manifest", "node scripts/env-doctor.mjs --strict", "npm run env:doctor:production", "npm run test:env", "npm run public:url:doctor", "docs/device-qa-checklist.md", "docs/store-review-notes.md", "실제 구매 링크 또는 공식 혜택 상세 URL", "테스트 계정: 필요 없음", "Demo Account: 필요 없음", "Play Console 복사 입력 블록", "App Store Connect 복사 입력 블록", "https://halindosa.com/privacy", "https://halindosa.com/support"]
    },
    {
      name: "store console fields content",
      file: "docs/STORE_CONSOLE_FIELDS.md",
      phrases: ["Store Console Field Manifest", "Play Console Fields", "Play Console App Access Copy", "비회원으로 대부분의 기능", "테스트 계정은 필요하지 않습니다", "App Store Connect Fields", "App Store Review Notes Copy", "No demo account is required", "Manual Work That Must Not Be Faked", "Sensitive Data Rule", "https://halindosa.com/privacy", "https://halindosa.com/support"]
    },
    {
      name: "store manual checklist content",
      file: "docs/STORE_MANUAL_CHECKLIST.md",
      phrases: ["Store Manual Submission Checklist", "Play Console에 signed AAB 업로드", "공개 개인정보처리방침과 고객지원 URL 외부 접속 확인", "Android/iOS 실기기 QA 기록 작성", "스토어 스크린샷 촬영 및 콘솔 업로드", "Google/Kakao/Naver OAuth Provider 운영 Redirect URL 설정", "Manual Work That Must Not Be Faked", "Do not mark Play Console or App Store Connect upload complete", "STORE_CONSOLE_FIELDS", "STORE_SUBMISSION_REPORT"]
    },
    {
      name: "store handoff report content",
      file: "docs/STORE_HANDOFF_REPORT.md",
      phrases: ["Store Launch Handoff Report", "Release Candidate", "Binary And Store Asset Map", "Verification Report Map", "Purchase Link Readiness", "Device And Screenshot Scope", "Store console fields", "Release notes", "docs/KNOWN_ISSUES.md", "Command Sequence", "External Work That Remains Manual", "Manual Work That Must Not Be Faked", "Sensitive Data Rule"]
    },
    {
      name: "release notes content",
      file: "docs/RELEASE_NOTES.md",
      phrases: ["할인도사 Release Notes", "User-Facing Release Notes", "Launch Candidate Highlights", "Link And Data Readiness Snapshot", "Operator Notes", "Verification Artifacts", "Manual Work That Must Not Be Faked", "직접 결제하지 않고 외부 판매처", "실제 상품 상세 URL 또는 공식 혜택 상세 URL", "Do not claim Play Console or App Store Connect submission has passed"]
    },
    {
      name: "support playbook content",
      file: "docs/SUPPORT_PLAYBOOK.md",
      phrases: ["할인도사 Support Playbook", "Triage Table", "User Reply Macros", "가격이 다름", "품절 또는 옵션 선택 불가", "링크 오류 또는 다른 상품으로 이동", "개인정보/계정/삭제 문의", "스토어 심사/제출 문의", "Escalation Rules", "Sensitive Data Rule", "OAuth client secrets", "keystore passwords"]
    },
    {
      name: "known issues content",
      file: "docs/KNOWN_ISSUES.md",
      phrases: ["할인도사 Known Issues", "Critical", "Current Readiness Snapshot", "Operational Risks", "Next Improvements", "Sensitive Data Rule", "Direct product or official benefit links", "Explicit product images", "Fallback image backlog", "Official benefit official images", "manual device checks remain", "keystore password", "OAuth client secret", "Supabase service-role key"]
    },
    {
      name: "store packet qa report content",
      file: "docs/STORE_PACKET_REPORT.md",
      phrases: ["Store Submission Packet QA Report", "Generated by: `npm run store:packet:doctor`", "Branch:", "Commit:", "Working tree:", "File References", "Command References", "Mirrored Report Consistency", "Root/docs mirrored report consistency: PASS", "Reviewer Copy Checks", "Manual Work That Must Not Be Faked"]
    },
    {
      name: "store submission readiness report content",
      file: "docs/STORE_SUBMISSION_REPORT.md",
      phrases: ["Store Submission Readiness Report", "Generated by: `npm run store:submission:report`", "Branch:", "Commit:", "Working tree:", "Signing And Upload Readiness", "Link Coverage Snapshot", "Public URL submission", "Store metadata QA", "Store asset QA", "Store screenshot QA", "final Play upload still needs private signing confirmation", "Direct product or official benefit links", "Manual Work That Must Not Be Faked", "Sensitive Data Rule"]
    },
    {
      name: "store review notes content",
      file: "docs/store-review-notes.md",
      phrases: ["앱 접근 방식", "심사자 확인 경로", "외부 구매 링크 안내", "Google Play 앱 액세스", "App Store Review Notes", "비회원으로 대부분의 기능", "테스트 계정은 필요하지 않습니다", "No demo account is required"]
    },
    {
      name: "link coverage report content",
      file: "docs/link-coverage-report.md",
      phrases: ["구매 링크 커버리지 보고서", "검증된 실제 구매 상세 URL", "판매처별 현황", "보강 대기 상품", "신규 상품 URL 검수 체크리스트", "실패 사유별 조치", "기본 큐레이션에는 보강 대기 상품이 없으며", "검색 결과 URL을 실제 구매 상세 링크처럼 꾸미지"]
    },
    {
      name: "catalog quality report content",
      file: "docs/catalog-quality-report.md",
      phrases: ["상품 DB 품질 보고서", "카테고리 분포", "혜택 유형 분포", "판매처 상위 20개", "다음 상품 보강 우선순위"]
    },
    {
      name: "customer support guide content",
      file: "docs/customer-support-guide.md",
      phrases: ["가격이 다름", "품절 또는 링크 오류", "개인정보/정책 문의", "스토어 심사/제출 문의", "docs/SUPPORT_PLAYBOOK.md", "SUPPORT_PLAYBOOK.json", "OAuth client secret", "Supabase service-role key", "store-submission-blocker", "docs/STORE_MANUAL_CHECKLIST.md"]
    }
  ];

  for (const item of requiredContent) {
    if (!existsSync(join(root, item.file))) {
      fail(item.name, `Missing ${item.file}.`);
      continue;
    }

    const body = await text(item.file);
    const missingPhrases = item.phrases.filter((phrase) => !body.includes(phrase));

    if (missingPhrases.length) fail(item.name, `Missing phrases in ${item.file}: ${missingPhrases.join(", ")}`);
    else pass(item.name, `${item.file} includes launch-critical policy copy.`);
  }
}

async function checkCustomerNavigationSimplification() {
  const bottomNav = await text("components/BottomNavigation.tsx");
  const topNav = await text("components/TopNavigation.tsx");
  const mypage = await text("app/mypage/page.tsx");
  const popularPage = await text("app/popular/page.tsx");
  const dealsRoute = await text("app/api/deals/route.ts");
  const issues = [];

  if (!bottomNav.includes("grid-cols-4")) issues.push("bottom navigation should use four tabs");
  for (const phrase of ['href: "/free-benefits"', 'href: "/notifications"', 'href: "/favorites"', "badge:"]) {
    if (bottomNav.includes(phrase)) issues.push(`bottom navigation still exposes ${phrase}`);
  }

  for (const required of ['href: "/"', 'href: "/popular"', 'href: "/categories"', 'href: "/mypage"']) {
    if (!bottomNav.includes(required) || !topNav.includes(required)) issues.push(`top/bottom navigation missing ${required}`);
  }

  for (const phrase of ['href: "/free-benefits"', 'href: "/notifications"', 'href: "/favorites"', "무료혜택", "badge:"]) {
    if (topNav.includes(phrase)) issues.push(`top navigation still exposes ${phrase}`);
  }

  const blockedMypagePhrases = ["Android 패키지", "개인정보처리방침 준비", "이용약관 준비", "앱 아이콘/스플래시", "앱 버전"];
  const mypageFindings = blockedMypagePhrases.filter((phrase) => mypage.includes(phrase));
  if (mypageFindings.length) issues.push(`mypage still has developer/release wording: ${mypageFindings.join(", ")}`);

  if (!popularPage.includes('target="_blank"') || !popularPage.includes('rel="noopener noreferrer"') || !popularPage.includes("/go/${deal.id}")) {
    issues.push("popular page purchase links should open /go/[id] in a new tab with noopener");
  }

  if (!dealsRoute.includes('verifiedOnly: searchParams.get("verifiedOnly") !== "false"')) {
    issues.push("/api/deals should default customer results to verified links unless explicitly disabled");
  }

  if (issues.length) fail("customer navigation simplification", issues.join("; "));
  else pass("customer navigation simplification", "Customer navigation is reduced to home/popular/categories/my and default deal API favors verified purchase links.");
}

function checkRefreshDealPipeline() {
  const refreshPath = join(root, "reports/refresh-deals.json");
  const snapshotPath = join(root, "data/refreshedDeals.json");
  const adminRoutePath = "app/api/admin/deal-quality/route.ts";
  const exposureRoutePath = "app/api/admin/exposure-policy/route.ts";
  const linkLaunchGateRoutePath = "app/api/admin/link-launch-gate/route.ts";
  const adminPanelPath = "components/AdminDealQualityPanel.tsx";
  const providerTypes = readFileSync(join(root, "lib/deals/providers/types.ts"), "utf8");
  const providerRegistry = readFileSync(join(root, "lib/deals/providers/providerRegistry.ts"), "utf8");
  const dealRepository = readFileSync(join(root, "lib/deals/dealRepository.ts"), "utf8");
  const operationOverrides = existsSync(join(root, "lib/deals/operationOverrides.ts")) ? readFileSync(join(root, "lib/deals/operationOverrides.ts"), "utf8") : "";
  const reportsLib = existsSync(join(root, "lib/reports.ts")) ? readFileSync(join(root, "lib/reports.ts"), "utf8") : "";
  const reportsRoute = existsSync(join(root, "app/api/reports/route.ts")) ? readFileSync(join(root, "app/api/reports/route.ts"), "utf8") : "";
  const refreshScript = readFileSync(join(root, "scripts/refresh-deals.mjs"), "utf8");
  const adminRoute = existsSync(join(root, adminRoutePath)) ? readFileSync(join(root, adminRoutePath), "utf8") : "";
  const exposureRoute = existsSync(join(root, exposureRoutePath)) ? readFileSync(join(root, exposureRoutePath), "utf8") : "";
  const linkLaunchGateRoute = existsSync(join(root, linkLaunchGateRoutePath)) ? readFileSync(join(root, linkLaunchGateRoutePath), "utf8") : "";
  const adminPanel = existsSync(join(root, adminPanelPath)) ? readFileSync(join(root, adminPanelPath), "utf8") : "";
  const adminPage = [
    readFileSync(join(root, "app/admin/page.tsx"), "utf8"),
    readFileSync(join(root, "components/AdminNewsCollectionPanel.tsx"), "utf8"),
    readFileSync(join(root, "components/AdminExposurePolicyPanel.tsx"), "utf8"),
    readFileSync(join(root, "components/AdminLinkLaunchGatePanel.tsx"), "utf8")
  ].join("\n");
  const smoke = smokeSourceSync();
  const gitignore = existsSync(join(root, ".gitignore")) ? readFileSync(join(root, ".gitignore"), "utf8") : "";
  const exposureDoctorScript = readFileSync(join(root, "scripts/exposure-policy-doctor.mjs"), "utf8");
  const linkLaunchGateScriptPath = join(root, "scripts/link-launch-gate.mjs");
  const linkLaunchGateScript = existsSync(linkLaunchGateScriptPath) ? readFileSync(linkLaunchGateScriptPath, "utf8") : "";
  const exposureReportPath = join(root, "reports/exposure-policy.json");
  const exposureReport = existsSync(exposureReportPath) ? JSON.parse(readFileSync(exposureReportPath, "utf8")) : {};
  const linkLaunchGateReportPath = join(root, "reports/link-launch-gate.json");
  const linkLaunchGateReport = existsSync(linkLaunchGateReportPath) ? JSON.parse(readFileSync(linkLaunchGateReportPath, "utf8")) : {};
  const issues = [];

  if (!existsSync(refreshPath)) {
    issues.push("reports/refresh-deals.json missing");
  } else {
    const report = JSON.parse(readFileSync(refreshPath, "utf8"));
    const requiredFields = ["fetchedCount", "normalizedCount", "insertedCount", "updatedCount", "hiddenCount", "failedCount", "providerStats", "liveProbe", "policy", "failureReasons", "revalidationQueue", "generatedAt"];
    const missingFields = requiredFields.filter((field) => !(field in report));

    if (missingFields.length) issues.push(`refresh report missing ${missingFields.join(", ")}`);
    if (!Array.isArray(report.providerStats) || !report.providerStats.length) issues.push("providerStats should include provider collection status");
    if (!report.liveProbe || typeof report.liveProbe !== "object") issues.push("refresh report should include liveProbe HTTP/redirect summary");
    if (report.policy?.source !== "data/linkQualityPolicy.json") issues.push("refresh report should record shared link policy source");
    if (!report.revalidationQueue || typeof report.revalidationQueue.total !== "number") issues.push("refresh report should include report-driven revalidation queue evidence");
    if ((report.reports?.linkValidation?.searchOrCategorySuspected ?? 0) !== 0) issues.push("refresh report still has search/category links");
    if ((report.reports?.linkValidation?.exposedSoldOutLinks ?? 0) !== 0) issues.push("refresh report still has exposed sold-out/ended link signals");
  }

  if (!existsSync(snapshotPath)) issues.push("data/refreshedDeals.json missing");
  if (!existsSync(join(root, adminRoutePath)) || !existsSync(join(root, adminPanelPath))) {
    issues.push("admin deal quality API/panel missing");
  }
  if (!existsSync(join(root, exposureRoutePath))) {
    issues.push("admin exposure policy API missing");
  }
  if (!existsSync(join(root, linkLaunchGateRoutePath))) {
    issues.push("admin link launch gate API missing");
  }
  if (
    !linkLaunchGateScript.includes("failedExposureItems") ||
    !linkLaunchGateScript.includes("reports/link-validation.json") ||
    !linkLaunchGateScript.includes("reports/live-probe-review.json") ||
    !linkLaunchGateScript.includes("manualEvidenceSummary") ||
    !linkLaunchGateScript.includes("staleManualEvidence") ||
    !linkLaunchGateScript.includes("missingManualEvidence") ||
    !linkLaunchGateScript.includes("LINK_LAUNCH_GATE.md")
  ) {
    issues.push("link launch gate script should audit product exposure rows, fresh manual evidence, and write JSON/Markdown release evidence");
  }
  if (
    !isCleanCustomerLinkLaunchGate(linkLaunchGateReport) ||
    !hasFreshOrReviewableManualEvidence(linkLaunchGateReport) ||
    (linkLaunchGateReport.manualEvidenceSummary?.freshManualEvidenceCount ?? -1) !== (linkLaunchGateReport.actual?.freshManualEvidence ?? -2)
  ) {
    issues.push("reports/link-launch-gate.json should prove zero exposed search, sold-out, failed, broken, invalid, or non-publishable links; protected seller links must stay in the review queue with manual evidence metadata");
  }
  if (
    !linkLaunchGateRoute.includes("getLinkLaunchGateReport") ||
    !linkLaunchGateRoute.includes("buildLinkLaunchGateCsv") ||
    !linkLaunchGateRoute.includes("canAccessAdminRequest") ||
    !linkLaunchGateRoute.includes("text/csv") ||
    !adminPage.includes("최종 링크 출시 게이트") ||
    !adminPage.includes("출시 게이트 CSV") ||
    !adminPage.includes("Play Store 제출 판정") ||
    !adminPage.includes("reports/link-launch-gate.json") ||
    !adminPage.includes("수동 검수") ||
    !adminPage.includes("stale") ||
    !adminPage.includes("missing") ||
    !smoke.includes("admin link launch gate api") ||
    !smoke.includes("admin link launch gate csv") ||
    !smoke.includes("Link launch gate should expose zero search links") ||
    !smoke.includes("Link launch gate should enforce 7-day manual evidence freshness") ||
    !smoke.includes("summary,fresh_manual_evidence")
  ) {
    issues.push("admin link launch gate API/page should expose JSON/CSV final launch evidence and smoke-test zero search/sold-out/broken/invalid links plus fresh manual evidence");
  }

  for (const phrase of ["fetchDeals", "normalizeDeal", "validateDeal", "dedupeDeal"]) {
    if (!providerTypes.includes(phrase)) issues.push(`provider interface missing ${phrase}`);
    if (!refreshScript.includes(phrase === "fetchDeals" ? "collectProviderItems" : phrase.replace("Deal", ""))) {
      issues.push(`refresh script missing ${phrase} pipeline evidence`);
    }
  }

  if (!refreshScript.includes("COUPANG_PARTNER_FEED_URLS") || !refreshScript.includes("NAVER_CLIENT_ID") || !refreshScript.includes("ELEVENST_PARTNER_FEED_URLS")) {
    issues.push("refresh script should support Coupang/Naver/11st approved feeds or API keys");
  }

  if (!refreshScript.includes("DEAL_REFRESH_LIVE_PROBE") || !refreshScript.includes("DEAL_LINK_BODY_PROBE") || !refreshScript.includes("probeFinalUrl")) {
    issues.push("refresh script should track optional live HTTP probes, body sold-out detection, redirects, and final URLs");
  }

  if (!providerTypes.includes("fetchProviderJsonFeeds") || !providerRegistry.includes("fetchProviderDealsSafely")) {
    issues.push("runtime provider registry should fetch approved API/feed providers safely");
  }

  if (!dealRepository.includes("fetchRefreshedSnapshotDeals") || !dealRepository.includes("fetchProviderDealsSafely") || !dealRepository.includes("mergeUniqueDeals")) {
    issues.push("deal repository should merge refreshed snapshots and provider registry deals into customer-visible data");
  }

  if (!dealRepository.includes("applyLinkValidationExposureOverride")) {
    issues.push("deal repository should apply link-validation hidden/mismatch exposure overrides before customer-visible filtering");
  }

  if (
    !operationOverrides.includes("hideDealManually") ||
    !operationOverrides.includes("restoreDealManually") ||
    !operationOverrides.includes("readDealOperationOverrides") ||
    !operationOverrides.includes("readDealOperationOverridesLive") ||
    !operationOverrides.includes("writeDealOperationOverrides") ||
    !operationOverrides.includes("recordDealOperationActionWithPersistence") ||
    !operationOverrides.includes("listRevalidationDealIds") ||
    !operationOverrides.includes("revalidate") ||
    !operationOverrides.includes("rest/v1/admin_actions") ||
    !operationOverrides.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    !operationOverrides.includes("dealOperationOverrides.local.json") ||
    !operationOverrides.includes("auditLog") ||
    !operationOverrides.includes("applyDealOperationOverrides") ||
    !dealRepository.includes("readDealOperationOverridesLive") ||
    !dealRepository.includes("applyDealOperationOverrides") ||
    !adminRoute.includes("recordDealOperationActionWithPersistence") ||
    !adminRoute.includes("manualOverrideAudit") ||
    !adminRoute.includes("manualOverrideStorage") ||
    !adminRoute.includes("manual_override_audit") ||
    !adminRoute.includes("revalidation_queue") ||
    !adminRoute.includes("getLinkValidationReport") ||
    !adminRoute.includes("link_validation_evidence") ||
    !adminRoute.includes("link_validation_revalidation_queue") ||
    !adminRoute.includes("supabase_admin_actions") ||
    !adminPanel.includes("재검증 큐") ||
    !adminPanel.includes("링크 증거 등급") ||
    !adminPanel.includes("라이브 우선 재검증") ||
    !refreshScript.includes("revalidationQueue") ||
    !reportsLib.includes("shouldPrioritizeReportForRevalidation") ||
    !reportsRoute.includes("shouldPrioritizeReportForRevalidation") ||
    !reportsRoute.includes("recordDealOperationActionWithPersistence") ||
    !adminPage.includes("readDealOperationOverridesLive") ||
    !adminPage.includes("getLinkValidationReport") ||
    !gitignore.includes("data/dealOperationOverrides.local.json") ||
    !smoke.includes("admin manual hide affects public exposure") ||
    !smoke.includes("Manually hidden deal should not be exposed in public deal API") ||
    !smoke.includes("persistent override audit log") ||
    !smoke.includes("Supabase admin_actions storage readiness") ||
    !smoke.includes("Expected hidden redirect 404")
  ) {
    issues.push("admin manual hide should use a persisted local plus Supabase-ready operation overlay, expose audit/storage evidence, ignore local override files, and smoke-test public API plus redirect blocking before release.");
  }

  if (
    !adminRoute.includes("format") ||
    !adminRoute.includes("buildDealQualityCsv") ||
    !adminRoute.includes("text/csv") ||
    !adminRoute.includes("link_validation") ||
    !adminPanel.includes("품질 CSV") ||
    !smoke.includes("admin deal quality csv") ||
    !smoke.includes("Deal quality CSV missing provider")
  ) {
    issues.push("admin deal quality API/panel should export provider stats, failure reasons, manual hidden ids, and link validation as CSV");
  }

  if (
    !exposureRoute.includes("getExposurePolicyReport") ||
    !exposureRoute.includes("buildExposurePolicyCsv") ||
    !exposureRoute.includes("text/csv") ||
    !exposureDoctorScript.includes("auditedItems: auditedItems.map") ||
    !exposureReport.auditedItems ||
    exposureReport.auditedItems.length < 140 ||
    !exposureReport.liveProbe ||
    typeof exposureReport.liveProbe.enabled !== "boolean" ||
    !exposureReport.liveProbeReviewSummary ||
    (exposureReport.liveProbeReviewSummary.exposedHardFailureCount ?? exposureReport.liveProbeReviewSummary.hardFailureCount ?? 1) !== 0 ||
    !exposureReport.liveProbeFailureReasonCounts ||
    !exposureReport.liveProbeHostFailureCounts ||
    !adminPage.includes("노출 정책 감사") ||
    !adminPage.includes("노출 감사 CSV") ||
    !adminPage.includes("상품별 노출 감사 샘플") ||
    !adminPage.includes("라이브 HTTP 검증") ||
    !adminPage.includes("노출 강한 실패") ||
    !adminPage.includes("총 강한 실패") ||
    !adminPage.includes("노출 품절 본문") ||
    !adminPage.includes("접근 보호 신호") ||
    !adminPage.includes("라이브 실패 사유 분포") ||
    !adminPage.includes("reports/exposure-policy.json") ||
    !smoke.includes("admin exposure policy api") ||
    !smoke.includes("admin exposure policy csv") ||
    !smoke.includes("product-level audited rows") ||
    !smoke.includes("live probe summary") ||
    !smoke.includes("hard live probe failures") ||
    !smoke.includes("live probe host failure counts") ||
    !smoke.includes("live probe failure reason counts") ||
    !smoke.includes("badExposedItems === 0")
  ) {
    issues.push("admin exposure policy API/page should surface product-level exposure audit rows, CSV export, and smoke-test zero bad exposed links");
  }

  if (issues.length) fail("deal refresh pipeline", issues.join("; "));
  else pass("deal refresh pipeline", "Provider collection, normalization, dedupe, validation, reports, snapshot, admin operations, and deal quality CSV export are wired.");
}

function checkHealthReadinessReport() {
  const requiredFiles = [
    "scripts/health-readiness-report.mjs",
    "lib/operations/healthReadiness.ts",
    "app/api/health/route.ts",
    "app/api/admin/health-readiness/route.ts",
    "components/AdminHealthReadinessPanel.tsx",
    "reports/health-readiness.json",
    "docs/HEALTH_READINESS_REPORT.md"
  ];
  const issues = [];
  const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
  if (missing.length) issues.push(`missing files: ${missing.join(", ")}`);

  const packageJson = withQaRunnerScripts(JSON.parse(readFileSync(join(root, "package.json"), "utf8")));
  const runbook = existsSync(join(root, "docs/RUNBOOK.md")) ? readFileSync(join(root, "docs/RUNBOOK.md"), "utf8") : "";
  const roadmap = existsSync(join(root, "docs/roadmap.md")) ? readFileSync(join(root, "docs/roadmap.md"), "utf8") : "";
  const releaseEvidence = existsSync(join(root, "scripts/release-evidence.mjs")) ? readFileSync(join(root, "scripts/release-evidence.mjs"), "utf8") : "";
  const healthScript = existsSync(join(root, "scripts/health-readiness-report.mjs")) ? readFileSync(join(root, "scripts/health-readiness-report.mjs"), "utf8") : "";
  const publicHealthRoute = existsSync(join(root, "app/api/health/route.ts")) ? readFileSync(join(root, "app/api/health/route.ts"), "utf8") : "";
  const healthApiRoute = existsSync(join(root, "app/api/admin/health-readiness/route.ts")) ? readFileSync(join(root, "app/api/admin/health-readiness/route.ts"), "utf8") : "";
  const adminPage = [
    existsSync(join(root, "app/admin/page.tsx")) ? readFileSync(join(root, "app/admin/page.tsx"), "utf8") : "",
    existsSync(join(root, "components/AdminNewsCollectionPanel.tsx")) ? readFileSync(join(root, "components/AdminNewsCollectionPanel.tsx"), "utf8") : "",
    existsSync(join(root, "lib/adminDashboardHrefs.ts")) ? readFileSync(join(root, "lib/adminDashboardHrefs.ts"), "utf8") : ""
  ].join("\n");
  const adminHealthPanel = existsSync(join(root, "components/AdminHealthReadinessPanel.tsx")) ? readFileSync(join(root, "components/AdminHealthReadinessPanel.tsx"), "utf8") : "";
  const smokeScript = smokeSourceSync();
  const docsReport = existsSync(join(root, "docs/HEALTH_READINESS_REPORT.md")) ? readFileSync(join(root, "docs/HEALTH_READINESS_REPORT.md"), "utf8") : "";
  const report = existsSync(join(root, "reports/health-readiness.json")) ? JSON.parse(readFileSync(join(root, "reports/health-readiness.json"), "utf8")) : {};

  if (!packageJson.scripts?.["health:readiness"]?.includes("health-readiness-report.mjs")) {
    issues.push("package scripts should expose health:readiness");
  }
  if (!String(packageJson.scripts?.qa ?? "").includes("refresh:all") || !String(packageJson.scripts?.qa ?? "").includes("health:readiness")) {
    issues.push("qa should run refresh:all before health:readiness");
  }
  if (!String(packageJson.scripts?.["qa:release"] ?? "").includes("health:readiness")) {
    issues.push("qa:release should include health:readiness before release submission reports");
  }
  for (const phrase of ["productVerificationRate", "official benefit category coverage", "official feed source mix counters", "configured empty feed watch", "official feed canary", "provider risk gate", "official source readiness gate", "first-party free benefit feed", "first-party-free-benefit-feed.json", "consumerPublishableItems", "homepageLikeItems", "source-readiness.json", "refresh all pipeline", "cron refresh operations", "cron benefits operations", "reports/health-readiness.json", "docs/HEALTH_READINESS_REPORT.md"]) {
    if (!healthScript.includes(phrase)) issues.push(`health readiness script missing ${phrase}`);
  }
  if (!publicHealthRoute.includes("getOfficialSourceReadiness") || !publicHealthRoute.includes("officialSourceReadinessOk") || !publicHealthRoute.includes("officialSourceCandidates") || !publicHealthRoute.includes("officialBenefitFeedExternalItemCount") || !publicHealthRoute.includes("officialBenefitFeedSeedCount") || !publicHealthRoute.includes("officialBenefitFeedConfiguredEmptyCount") || !publicHealthRoute.includes("officialBenefitFeedCanaryStatus")) {
    issues.push("public health API should expose official source readiness summary");
  }
  if (!healthApiRoute.includes("getHealthReadinessReport") || !healthApiRoute.includes("canAccessAdmin") || !healthApiRoute.includes("admin-health-readiness")) {
    issues.push("admin health readiness API should be protected and return the generated report");
  }
  if (!adminPage.includes("AdminHealthReadinessPanel") || !adminPage.includes("healthReadinessApiHref") || !adminPage.includes("/api/admin/health-readiness")) {
    issues.push("admin page should expose health readiness panel and API link");
  }
  for (const phrase of ["운영 헬스 리포트", "검증 상품·공식 혜택 출시 게이트", "공식 혜택 카테고리 커버리지", "공식 혜택 Provider 위험도", "First-party 무료혜택 feed", "소비자형 공식 혜택", "링크 품질", "차단 신호", "공식 소스 통합 준비도", "source mix", "외부 feed", "feed 공백", "feed canary", "refresh:all", "cron refresh"]) {
    if (!adminHealthPanel.includes(phrase)) issues.push(`admin health readiness panel missing ${phrase}`);
  }
  if (!smokeScript.includes("admin health readiness api") || !smokeScript.includes("/api/admin/health-readiness") || !smokeScript.includes("운영 헬스 리포트") || !smokeScript.includes("Health API missing official external feed item count") || !smokeScript.includes("Health API missing configured empty feed count") || !smokeScript.includes("Health API missing official feed canary status") || !smokeScript.includes("Admin health readiness should expose cron refresh status") || !smokeScript.includes("Admin health readiness should expose passing source readiness") || !smokeScript.includes("Admin health readiness should expose passing first-party free benefit feed status") || !smokeScript.includes("Admin health readiness checks missing first-party free benefit feed gate") || !smokeScript.includes("Admin dashboard missing cron benefits operation status")) {
    issues.push("smoke tests should cover admin health readiness API and dashboard panel");
  }
  if (!releaseEvidence.includes("HEALTH_READINESS_REPORT.md") || !releaseEvidence.includes("health-readiness.json")) {
    issues.push("release evidence should list health readiness artifacts");
  }
  for (const phrase of ["npm run health:readiness", "HEALTH_READINESS_REPORT.md", "reports/health-readiness.json"]) {
    if (!runbook.includes(phrase)) issues.push(`RUNBOOK missing ${phrase}`);
  }
  if (!roadmap.includes("운영 헬스 리포트") || !roadmap.includes("health:readiness")) {
    issues.push("roadmap should document the operational health readiness gate");
  }
  if (!docsReport.includes("운영 헬스 리포트") || !docsReport.includes("검색 링크 노출") || !docsReport.includes("카테고리 커버리지") || !docsReport.includes("공식 혜택 source mix") || !docsReport.includes("공식 feed canary") || !docsReport.includes("공식 혜택 Provider 상태") || !docsReport.includes("공식 혜택 Provider 위험도") || !docsReport.includes("공식 소스 통합 준비도") || !docsReport.includes("First-party 무료혜택 feed") || !docsReport.includes("검색 링크/대표몰/중복") || !docsReport.includes("자동 refresh cron 운영") || !docsReport.includes("무료혜택 cron 운영")) {
    issues.push("docs/HEALTH_READINESS_REPORT.md should summarize search exposure, category coverage, official benefit source mix, official benefit provider status, source readiness, provider risk, cron refresh, and benefits cron operation");
  }

  if (report.ok !== true) issues.push("health readiness report should pass");
  if ((report.score ?? 0) < 100) issues.push(`health readiness score should be 100, got ${report.score ?? "missing"}`);
  if ((report.product?.productDealsCount ?? 0) < 140) issues.push("health readiness should preserve at least 140 product deals");
  if ((report.product?.productVerificationRate ?? 0) < 99) issues.push("health readiness product verification rate should be >=99%");
  if ((report.product?.searchLinks ?? 0) !== 0) issues.push("health readiness should show zero search links");
  if ((report.product?.soldOutProducts ?? 0) !== 0) issues.push("health readiness should show zero sold-out product exposure");
  if ((report.officialBenefits?.visibleCount ?? 0) < MIN_OFFICIAL_BENEFITS) issues.push(`health readiness should show at least ${MIN_OFFICIAL_BENEFITS} official benefits`);
  if (!Array.isArray(report.officialBenefits?.activeProviders) || report.officialBenefits.activeProviders.length < 4) {
    issues.push("health readiness should expose active official benefit providers");
  }
  if (!Array.isArray(report.officialBenefits?.providerStats) || report.officialBenefits.providerStats.length < 4) {
    issues.push("health readiness should expose official benefit provider stats");
  }
  if (
    typeof report.officialBenefits?.sourceMix?.seedCount !== "number" ||
    typeof report.officialBenefits?.sourceMix?.feedItemCount !== "number" ||
    typeof report.officialBenefits?.sourceMix?.feedSuccessCount !== "number" ||
    typeof report.officialBenefits?.sourceMix?.collectedCount !== "number" ||
    typeof report.officialBenefits?.sourceMix?.feedItemRate !== "number" ||
    typeof report.officialBenefits?.sourceMix?.configuredEmptyFeedCount !== "number" ||
    !Array.isArray(report.officialBenefits?.sourceMix?.configuredEmptyFeedProviders)
  ) {
    issues.push("health readiness should expose official benefit source mix counters");
  }
  if (
    Array.isArray(report.officialBenefits?.providerStats) &&
    report.officialBenefits.providerStats.some(
      (provider) =>
        typeof provider.seedCount !== "number" ||
        typeof provider.feedItemCount !== "number" ||
        typeof provider.feedSuccessCount !== "number" ||
        typeof provider.collectedCount !== "number" ||
        typeof provider.feedItemRate !== "number" ||
        typeof provider.configuredEmptyFeed !== "boolean"
    )
  ) {
    issues.push("health readiness provider stats should expose source mix counters");
  }
  if (
    !["seed_fallback_only", "live_feed_ready"].includes(report.officialBenefits?.feedCanary?.status) ||
    report.officialBenefits?.feedCanary?.ok !== true ||
    !["fresh", "due"].includes(report.officialBenefits?.feedCanary?.freshnessStatus) ||
    report.officialBenefits?.feedCanary?.releaseBlocking !== false ||
    typeof report.officialBenefits?.feedCanary?.staleHours !== "number"
  ) {
    issues.push("health readiness feed canary should pass with seed fallback or live feed ready status and non-stale freshness evidence");
  }
  if (!Array.isArray(report.officialBenefits?.providerRisks) || report.officialBenefits.providerRisks.length < 4) {
    issues.push("health readiness should expose official benefit provider risks");
  }
  if ((report.officialBenefits?.providerRiskSummary?.danger ?? 999) !== 0) {
    issues.push("health readiness should show zero danger official benefit providers");
  }
  const sourceReadinessLaunchSafe =
    (report.sourceReadiness?.ok === true && report.sourceReadiness?.launchGateStatus === "passed") ||
    isCiNetworkAdvisoryOnlySourceReadiness(report.sourceReadiness);
  if (!sourceReadinessLaunchSafe) {
    issues.push("health readiness should include a passing official source readiness gate");
  }
  if ((report.sourceReadiness?.officialSourceCandidates ?? 0) < 30 || (report.sourceReadiness?.visibleOfficialBenefits ?? 0) < MIN_OFFICIAL_BENEFITS) {
    issues.push("health readiness source readiness summary should preserve official source and benefit counts");
  }
  if (!report.sourceReadiness || typeof report.sourceReadiness !== "object") {
    issues.push("health readiness source readiness summary should be present for operator review");
  }
  if (report.firstPartyFreeBenefitFeed?.ok !== true) {
    issues.push("health readiness should expose passing first-party free benefit feed status");
  }
  if (report.firstPartyFreeBenefitFeed?.endpoint !== "/api/feeds/free-benefits" || report.firstPartyFreeBenefitFeed?.source !== "data/refreshedNewsDeals.json") {
    issues.push("health readiness should expose the first-party free benefit feed endpoint and source");
  }
  if ((report.firstPartyFreeBenefitFeed?.publishableItems ?? 0) < 100 || (report.firstPartyFreeBenefitFeed?.consumerPublishableItems ?? 0) < 80) {
    issues.push("health readiness first-party feed should preserve publishable and consumer-first free benefit counts");
  }
  if (
    (report.firstPartyFreeBenefitFeed?.blockedSearchLinkItems ?? 999) !== 0 ||
    (report.firstPartyFreeBenefitFeed?.homepageLikeItems ?? 999) !== 0 ||
    (report.firstPartyFreeBenefitFeed?.duplicateGroups ?? 999) !== 0
  ) {
    issues.push("health readiness first-party feed should expose zero search, homepage-like, and duplicate benefit groups");
  }
  if ((report.firstPartyFreeBenefitFeed?.officialRate ?? 0) < 90 || (report.firstPartyFreeBenefitFeed?.averageQualityScore ?? 0) < 90) {
    issues.push("health readiness first-party feed should preserve official link rate and average quality score");
  }
  if ((report.firstPartyFreeBenefitFeed?.topCandidateCount ?? 0) < 10 || (report.firstPartyFreeBenefitFeed?.consumerHostCount ?? 0) < 20 || (report.firstPartyFreeBenefitFeed?.consumerCategoryCount ?? 0) < 8) {
    issues.push("health readiness first-party feed should expose candidate, host, and category diversity");
  }
  if ((report.officialBenefits?.readyCategories ?? 0) < (report.officialBenefits?.requiredCategories ?? 10)) {
    issues.push("health readiness should show all official benefit categories ready");
  }
  if ((report.officialBenefits?.hiddenCount ?? 0) !== 0 || (report.officialBenefits?.expiredCount ?? 0) !== 0 || (report.officialBenefits?.officialMissingCount ?? 0) !== 0 || (report.officialBenefits?.failedCount ?? 0) !== 0) {
    issues.push("health readiness should show zero hidden, expired, non-official, or failed official benefits");
  }
  if ((report.officialBenefits?.freshnessHours ?? 999) > 24) issues.push("health readiness official benefit report should be fresher than 24h");
  if (report.refreshAll?.ok !== true || (report.refreshAll?.failedSteps ?? []).length) {
    issues.push("health readiness should require refresh:all success and zero failed steps");
  }
  if (!["healthy", "manual_refresh_ready"].includes(report.cronRefresh?.status) || report.cronRefresh?.ok !== true) {
    issues.push(`health readiness should show cron refresh launch-safe status, got ${report.cronRefresh?.status ?? "missing"}`);
  }
  if (report.cronRefresh?.protected !== true || report.cronRefresh?.schedule !== "0 18 * * *" || report.cronRefresh?.reportPath !== "reports/cron-refresh.json") {
    issues.push("health readiness should expose protected daily cron refresh report metadata");
  }
  if ((report.cronRefresh?.productDealsCount ?? 0) < 140 || (report.cronRefresh?.newsDealsCount ?? 0) < MIN_OFFICIAL_BENEFITS) {
    issues.push("health readiness cron refresh summary should preserve product/news counts");
  }
  if (!["healthy", "manual_refresh_ready"].includes(report.cronBenefits?.status) || report.cronBenefits?.ok !== true) {
    issues.push(`health readiness should show cron benefits launch-safe status, got ${report.cronBenefits?.status ?? "missing"}`);
  }
  if (
    report.cronBenefits?.protected !== true ||
    report.cronBenefits?.schedule !== "0 21 * * *" ||
    report.cronBenefits?.reportPath !== "reports/cron-benefits.json" ||
    report.cronBenefits?.refreshReportPath !== "reports/benefits-refresh.json" ||
    report.cronBenefits?.eventsReportPath !== "reports/free-benefit-events.json"
  ) {
    issues.push("health readiness should expose protected daily cron benefits report metadata");
  }
  if ((report.cronBenefits?.visibleActiveEvents ?? 0) < 100 || (report.cronBenefits?.sourceCount ?? 0) < 90 || (report.cronBenefits?.hostCount ?? 0) < 70) {
    issues.push("health readiness cron benefits summary should preserve active event, source, and host counts");
  }

  if (issues.length) fail("operational health readiness", issues.join("; "));
  else pass("operational health readiness", "Health readiness report proves product links, official benefits, first-party feed quality, category coverage, provider risk, freshness, refresh:all, cron refresh, and benefits cron status are launch-ready.");
}

function checkDailyOperationsReport() {
  const requiredFiles = [
    "scripts/daily-operations-report.mjs",
    "lib/operations/dailyOperations.ts",
    "app/api/admin/daily-operations/route.ts",
    "reports/daily-operations.json",
    "docs/DAILY_OPERATIONS_REPORT.md"
  ];
  const issues = [];
  const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
  if (missing.length) issues.push(`missing files: ${missing.join(", ")}`);

  const packageJson = existsSync(join(root, "package.json")) ? withQaRunnerScripts(JSON.parse(readFileSync(join(root, "package.json"), "utf8"))) : {};
  const dailyScript = existsSync(join(root, "scripts/daily-operations-report.mjs")) ? readFileSync(join(root, "scripts/daily-operations-report.mjs"), "utf8") : "";
  const dailyApi = existsSync(join(root, "app/api/admin/daily-operations/route.ts")) ? readFileSync(join(root, "app/api/admin/daily-operations/route.ts"), "utf8") : "";
  const dailyLib = existsSync(join(root, "lib/operations/dailyOperations.ts")) ? readFileSync(join(root, "lib/operations/dailyOperations.ts"), "utf8") : "";
  const adminPage = [
    existsSync(join(root, "app/admin/page.tsx")) ? readFileSync(join(root, "app/admin/page.tsx"), "utf8") : "",
    existsSync(join(root, "components/AdminNewsCollectionPanel.tsx")) ? readFileSync(join(root, "components/AdminNewsCollectionPanel.tsx"), "utf8") : "",
    existsSync(join(root, "components/AdminCronRefreshPanel.tsx")) ? readFileSync(join(root, "components/AdminCronRefreshPanel.tsx"), "utf8") : ""
  ].join("\n");
  const smokeScript = smokeSourceSync();
  const runbook = existsSync(join(root, "docs/RUNBOOK.md")) ? readFileSync(join(root, "docs/RUNBOOK.md"), "utf8") : "";
  const roadmap = existsSync(join(root, "docs/roadmap.md")) ? readFileSync(join(root, "docs/roadmap.md"), "utf8") : "";
  const docsReport = existsSync(join(root, "docs/DAILY_OPERATIONS_REPORT.md")) ? readFileSync(join(root, "docs/DAILY_OPERATIONS_REPORT.md"), "utf8") : "";
  const report = existsSync(join(root, "reports/daily-operations.json")) ? JSON.parse(readFileSync(join(root, "reports/daily-operations.json"), "utf8")) : {};

  if (packageJson.scripts?.["daily:operations:report"] !== "node scripts/daily-operations-report.mjs") {
    issues.push("package scripts should expose daily:operations:report");
  }
  if (!String(packageJson.scripts?.qa ?? "").includes("daily:operations:report")) {
    issues.push("qa should regenerate daily operations report");
  }
  for (const phrase of ["검증 구매 링크", "공식 혜택 노출", "refresh:all", "공식 소스 준비도", "release doctor", "reports/daily-operations.json", "docs/DAILY_OPERATIONS_REPORT.md"]) {
    if (!dailyScript.includes(phrase)) issues.push(`daily operations script missing ${phrase}`);
  }
  if (!dailyLib.includes("getDailyOperationsReport") || !dailyLib.includes("exposedSearchLinks") || !dailyLib.includes("priorityQueue")) {
    issues.push("daily operations library should expose report, search-link count, and priority queue");
  }
  if (!dailyApi.includes("canAccessAdminRequest") || !dailyApi.includes("format") || !dailyApi.includes("text/csv") || !dailyApi.includes("admin-daily-operations")) {
    issues.push("daily operations admin API should be protected and support CSV export");
  }
  if (!adminPage.includes("일일 운영 리포트") || !adminPage.includes("dailyOperationsApiHref") || !adminPage.includes("dailyOperationsCsvHref") || !adminPage.includes("오늘 우선 처리 큐")) {
    issues.push("admin page should expose daily operations report JSON, CSV, gates, and priority queue");
  }
  if (!smokeScript.includes("admin daily operations api") || !smokeScript.includes("/api/admin/daily-operations") || !smokeScript.includes("Admin daily operations should show zero exposed search links")) {
    issues.push("smoke tests should cover daily operations admin API and dashboard panel");
  }
  for (const phrase of ["npm run daily:operations:report", "reports/daily-operations.json", "docs/DAILY_OPERATIONS_REPORT.md"]) {
    if (!runbook.includes(phrase)) issues.push(`RUNBOOK missing ${phrase}`);
  }
  if (!roadmap.includes("일일 운영 리포트") || !roadmap.includes("daily:operations:report")) {
    issues.push("roadmap should document daily operations report");
  }
  for (const phrase of ["할인도사 일일 운영 리포트", "검색 링크 노출", "품절/종료 상품 노출", "우선 처리 큐", "검색 결과, 대표몰, 커뮤니티 원문"]) {
    if (!docsReport.includes(phrase)) issues.push(`docs/DAILY_OPERATIONS_REPORT.md missing ${phrase}`);
  }

  const dailySourceReadinessLaunchSafe =
    report.summary?.officialSourceLaunchGateStatus === "passed" ||
    isCiNetworkAdvisoryOnlySourceReadiness({
      officialSourceCandidates: report.summary?.officialSourceCandidates,
      visibleOfficialBenefits: report.summary?.visibleOfficialBenefits,
      blockedLiveIssues: report.summary?.officialSourceBlockedLiveIssues,
      feedEnvFailedCount: report.summary?.officialSourceFeedEnvFailedCount,
      failedGateCount: report.summary?.officialSourceFailedGateCount,
      advisoryFailedGateCount: report.summary?.officialSourceAdvisoryFailedGateCount
    });
  const dailyGates = Array.isArray(report.gates) ? report.gates : [];
  const dailyGatesLaunchSafe =
    dailyGates.length >= 6 &&
    dailyGates.every((gate) => gate.ok === true || (/공식 소스|official source/i.test(String(gate.name)) && dailySourceReadinessLaunchSafe));
  const dailyReportLaunchSafe =
    report.ok === true ||
    (dailySourceReadinessLaunchSafe &&
      dailyGatesLaunchSafe &&
      Number(report.summary?.exposedSearchLinks ?? 1) === 0 &&
      Number(report.summary?.exposedSoldOutLinks ?? 1) === 0 &&
      Number(report.summary?.visibleOfficialBenefits ?? 0) >= MIN_OFFICIAL_BENEFITS);
  if (!dailyReportLaunchSafe) issues.push("daily operations report should pass or contain only advisory official source reachability issues with clean customer exposure");
  if ((report.summary?.productDealsCount ?? 0) < 140) issues.push("daily operations should preserve at least 140 product deals");
  if ((report.summary?.verifiedProductLinks ?? 0) < 140) issues.push("daily operations should preserve verified product links");
  if ((report.summary?.exposedSearchLinks ?? 1) !== 0) issues.push("daily operations should show zero exposed search links");
  if ((report.summary?.exposedSoldOutLinks ?? 1) !== 0) issues.push("daily operations should show zero exposed sold-out links");
  if ((report.summary?.visibleOfficialBenefits ?? 0) < MIN_OFFICIAL_BENEFITS) issues.push(`daily operations should show at least ${MIN_OFFICIAL_BENEFITS} official benefits`);
  if (report.summary?.refreshAllOk !== true || (report.summary?.refreshAllFailedCount ?? 1) !== 0) {
    issues.push("daily operations should require passing refresh:all with zero failures");
  }
  if ((report.summary?.officialSourceCandidates ?? 0) < 30 || !dailySourceReadinessLaunchSafe) {
    issues.push("daily operations should expose passing official source readiness");
  }
  const dailyReleasePendingNames = Array.isArray(report.summary?.releaseDoctorFailedCheckNames)
    ? report.summary.releaseDoctorFailedCheckNames
    : [];
  const dailyReleaseDoctorReady =
    report.summary?.releaseDoctorReadyForDaily === true ||
    (dailyReleasePendingNames.length > 0 && dailyReleasePendingNames.every((name) => name === "daily operations readiness"));
  if (!dailyReleaseDoctorReady) {
    issues.push("daily operations should preserve clean release doctor evidence or only the daily operations circular bootstrap state");
  }
  if (!dailyGatesLaunchSafe) {
    issues.push("daily operations gates should all pass except CI-only official source reachability advisories");
  }
  if (!Array.isArray(report.priorityQueue) || report.priorityQueue.length < 3) {
    issues.push("daily operations should include a priority queue");
  }

  if (issues.length) fail("daily operations readiness", issues.join("; "));
  else pass("daily operations readiness", "Daily operations report ties verified links, official benefits, refresh:all, source readiness, cron/push, admin API, CSV export, and store release gates into a daily operator queue.");
}

function checkFreeBenefitOperationsReport() {
  const requiredFiles = [
    "scripts/free-benefit-operations-report.mjs",
    "lib/operations/freeBenefitOperations.ts",
    "lib/operations/firstPartyFreeBenefitFeed.ts",
    "app/api/admin/free-benefit-operations/route.ts",
    "app/api/admin/first-party-free-benefit-feed/route.ts",
    "lib/operations/freeBenefitCategoryCoverage.ts",
    "app/api/admin/free-benefit-category-coverage/route.ts",
    "docs/FREE_BENEFIT_OPERATIONS_REPORT.md"
  ];
  const issues = [];
  const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
  if (missing.length) issues.push(`missing files: ${missing.join(", ")}`);

  const packageJson = existsSync(join(root, "package.json")) ? withQaRunnerScripts(JSON.parse(readFileSync(join(root, "package.json"), "utf8"))) : {};
  const operationScript = existsSync(join(root, "scripts/free-benefit-operations-report.mjs")) ? readFileSync(join(root, "scripts/free-benefit-operations-report.mjs"), "utf8") : "";
  const operationLib = existsSync(join(root, "lib/operations/freeBenefitOperations.ts")) ? readFileSync(join(root, "lib/operations/freeBenefitOperations.ts"), "utf8") : "";
  const firstPartyFeedLib = existsSync(join(root, "lib/operations/firstPartyFreeBenefitFeed.ts")) ? readFileSync(join(root, "lib/operations/firstPartyFreeBenefitFeed.ts"), "utf8") : "";
  const rankingLib = existsSync(join(root, "lib/operations/freeBenefitRanking.ts")) ? readFileSync(join(root, "lib/operations/freeBenefitRanking.ts"), "utf8") : "";
  const categoryCoverageLib = existsSync(join(root, "lib/operations/freeBenefitCategoryCoverage.ts")) ? readFileSync(join(root, "lib/operations/freeBenefitCategoryCoverage.ts"), "utf8") : "";
  const operationApi = existsSync(join(root, "app/api/admin/free-benefit-operations/route.ts")) ? readFileSync(join(root, "app/api/admin/free-benefit-operations/route.ts"), "utf8") : "";
  const firstPartyFeedApi = existsSync(join(root, "app/api/admin/first-party-free-benefit-feed/route.ts")) ? readFileSync(join(root, "app/api/admin/first-party-free-benefit-feed/route.ts"), "utf8") : "";
  const rankingApi = existsSync(join(root, "app/api/admin/free-benefit-ranking/route.ts")) ? readFileSync(join(root, "app/api/admin/free-benefit-ranking/route.ts"), "utf8") : "";
  const categoryCoverageApi = existsSync(join(root, "app/api/admin/free-benefit-category-coverage/route.ts")) ? readFileSync(join(root, "app/api/admin/free-benefit-category-coverage/route.ts"), "utf8") : "";
  const adminPage = existsSync(join(root, "app/admin/page.tsx")) ? readFileSync(join(root, "app/admin/page.tsx"), "utf8") : "";
  const adminHrefs = existsSync(join(root, "lib/adminDashboardHrefs.ts")) ? readFileSync(join(root, "lib/adminDashboardHrefs.ts"), "utf8") : "";
  const smokeScript = smokeSourceSync();
  const smokeAdminChecks = existsSync(join(root, "scripts/lib/smoke-admin-checks.mjs")) ? readFileSync(join(root, "scripts/lib/smoke-admin-checks.mjs"), "utf8") : "";
  const docsReport = existsSync(join(root, "docs/FREE_BENEFIT_OPERATIONS_REPORT.md")) ? readFileSync(join(root, "docs/FREE_BENEFIT_OPERATIONS_REPORT.md"), "utf8") : "";

  if (packageJson.scripts?.["benefit:operations:report"] !== "node scripts/free-benefit-operations-report.mjs") {
    issues.push("package scripts should expose benefit:operations:report");
  }
  if (!String(packageJson.scripts?.qa ?? "").includes("benefit:operations:report")) {
    issues.push("qa should regenerate free benefit operations report");
  }
  for (const phrase of ["visibleOfficialBenefitItems", "newOfficialBenefitItems", "excludedOfficialBenefitItems", "expiredExcludedItems", "officialLinkRate", "exposedSearchLinks", "exposedNonOfficialLinks", "brokenImages", "topCandidates", "operatorActionQueue", "docs/FREE_BENEFIT_OPERATIONS_REPORT.md"]) {
    if (!operationScript.includes(phrase)) issues.push(`free benefit operations script missing ${phrase}`);
  }
  for (const phrase of ["getFreeBenefitOperationsReport", "buildFreeBenefitOperationsCsv", "visibleOfficialBenefitItems", "topCandidates", "operatorActionQueue"]) {
    if (!operationLib.includes(phrase)) issues.push(`free benefit operations lib missing ${phrase}`);
  }
  if (!operationApi.includes("canAccessAdminRequest") || !operationApi.includes("getFreeBenefitOperationsReport") || !operationApi.includes("format") || !operationApi.includes("text/csv") || !operationApi.includes("admin-free-benefit-operations")) {
    issues.push("free benefit operations admin API should be protected and support CSV export");
  }
  for (const phrase of ["buildFirstPartyFreeBenefitFeedReport", "buildFirstPartyFreeBenefitFeedCsv", "consumerPublishableItems", "publicPolicyPublishableItems", "blockedSearchLinkItems", "homepageLikeItems", "consumerHostCounts", "topCandidates", "claimUrl"]) {
    if (!firstPartyFeedLib.includes(phrase)) issues.push(`first-party free benefit feed lib missing ${phrase}`);
  }
  if (!firstPartyFeedApi.includes("canAccessAdminRequest") || !firstPartyFeedApi.includes("buildFirstPartyFreeBenefitFeedReport") || !firstPartyFeedApi.includes("format") || !firstPartyFeedApi.includes("text/csv") || !firstPartyFeedApi.includes("admin-first-party-free-benefit-feed") || !firstPartyFeedApi.includes("no-store")) {
    issues.push("first-party free benefit feed admin API should be protected, no-store, and support CSV export");
  }
  for (const phrase of ["buildFreeBenefitRankingReport", "buildFreeBenefitRankingCsv", "exactDuplicateGroupCount", "maxTopBrandRepeat", "topCandidates", "qualityScore", "officialScore", "urgencyScore", "rewardScore", "claimReadyCount", "instantClaimCount", "topInstantClaimCount", "claimAccessLevelCounts", "topClaimReadyCount", "topBenefitTypeDiversity", "claimReadyCandidates", "claimEaseScore", "claimUrgencyLabel", "claimAccessLevel", "claimAccessLabel", "operationalReadiness", "recentlyCheckedCount", "staleCheckedCount", "officialHostDiversity", "instantClaimShare"]) {
    if (!rankingLib.includes(phrase)) issues.push(`free benefit ranking lib missing ${phrase}`);
  }
  for (const phrase of ["buildFreeBenefitCategoryCoverageReport", "buildFreeBenefitCategoryCoverageCsv", "freeBenefitRequiredCategories", "visibleActiveBenefits", "categoryCoverage", "categoryCandidateGroups", "claimEaseScore", "claimUrgencyLabel", "topCandidates"]) {
    if (!categoryCoverageLib.includes(phrase)) issues.push(`free benefit category coverage lib missing ${phrase}`);
  }
  if (!rankingApi.includes("canAccessAdminRequest") || !rankingApi.includes("buildFreeBenefitRankingReport") || !rankingApi.includes("format") || !rankingApi.includes("text/csv") || !rankingApi.includes("admin-free-benefit-ranking")) {
    issues.push("free benefit ranking admin API should be protected and support CSV export");
  }
  if (!categoryCoverageApi.includes("canAccessAdminRequest") || !categoryCoverageApi.includes("buildFreeBenefitCategoryCoverageReport") || !categoryCoverageApi.includes("format") || !categoryCoverageApi.includes("text/csv") || !categoryCoverageApi.includes("admin-free-benefit-category-coverage")) {
    issues.push("free benefit category coverage admin API should be protected and support CSV export");
  }
  if (!adminHrefs.includes("freeBenefitOperationsApiHref") || !adminHrefs.includes("/api/admin/free-benefit-operations?format=csv")) {
    issues.push("admin dashboard href builder should expose free benefit operations JSON and CSV links");
  }
  if (!adminHrefs.includes("firstPartyFreeBenefitFeedApiHref") || !adminHrefs.includes("/api/admin/first-party-free-benefit-feed?format=csv")) {
    issues.push("admin dashboard href builder should expose first-party free benefit feed JSON and CSV links");
  }
  if (!adminHrefs.includes("freeBenefitRankingApiHref") || !adminHrefs.includes("/api/admin/free-benefit-ranking?format=csv")) {
    issues.push("admin dashboard href builder should expose free benefit ranking JSON and CSV links");
  }
  if (!adminHrefs.includes("freeBenefitCategoryCoverageApiHref") || !adminHrefs.includes("/api/admin/free-benefit-category-coverage?format=csv")) {
    issues.push("admin dashboard href builder should expose free benefit category coverage JSON and CSV links");
  }
  for (const phrase of ["무료혜택 운영 리포트", "freeBenefitOperationsApiHref", "freeBenefitOperationsCsvHref", "오늘 무료혜택 운영 액션 큐", "상위 노출 후보", "검색 링크"]) {
    if (!adminPage.includes(phrase)) issues.push(`admin page missing free benefit operations panel phrase: ${phrase}`);
  }
  for (const phrase of ["first-party 무료혜택 feed 운영", "firstPartyFreeBenefitFeedApiHref", "firstPartyFreeBenefitFeedCsvHref", "소비자형 공식 도메인", "first-party feed 상위 후보"]) {
    if (!adminPage.includes(phrase)) issues.push(`admin page missing first-party free benefit feed panel phrase: ${phrase}`);
  }
  for (const phrase of ["무료혜택 랭킹 리포트", "freeBenefitRankingApiHref", "freeBenefitRankingCsvHref", "정확 중복", "첫 화면 상위 후보", "첫 화면 반복", "24시간 검증", "공식 도메인", "바로받기 비율", "즉시 수령"]) {
    if (!adminPage.includes(phrase)) issues.push(`admin page missing free benefit ranking panel phrase: ${phrase}`);
  }
  for (const phrase of ["무료혜택 카테고리 커버리지", "freeBenefitCategoryCoverageApiHref", "freeBenefitCategoryCoverageCsvHref", "필수 혜택 카테고리 10종", "카테고리별 상위 후보", "전원증정"]) {
    if (!adminPage.includes(phrase)) issues.push(`admin page missing free benefit category coverage panel phrase: ${phrase}`);
  }
  if (!smokeScript.includes("admin free benefit operations api") || !smokeScript.includes("/api/admin/free-benefit-operations") || !smokeScript.includes("Admin free benefit operations should show zero search links") || !smokeScript.includes("operatorActionQueue")) {
    issues.push("smoke tests should cover free benefit operations admin API and CSV");
  }
  if (!smokeScript.includes("admin first party free benefit feed api") || !smokeScript.includes("/api/admin/first-party-free-benefit-feed") || !smokeScript.includes("consumerHostCounts") || !smokeScript.includes("First-party feed should expose zero search links") || !smokeScript.includes("consumer official HTTPS benefits")) {
    issues.push("smoke tests should cover first-party free benefit feed admin API and CSV");
  }
  if (!smokeAdminChecks.includes("first-party 무료혜택 feed 운영") || !smokeAdminChecks.includes("first-party JSON") || !smokeAdminChecks.includes("first-party CSV") || !smokeAdminChecks.includes("소비자형 공식 도메인")) {
    issues.push("admin dashboard smoke checks should cover first-party free benefit feed operations panel");
  }
  if (!smokeScript.includes("admin free benefit ranking api") || !smokeScript.includes("/api/admin/free-benefit-ranking") || !smokeScript.includes("Admin dashboard missing free benefit ranking and diversity panel") || !smokeScript.includes("exactDuplicateGroupCount") || !smokeScript.includes("claimReadyCount") || !smokeScript.includes("instantClaimCount") || !smokeScript.includes("claim_access") || !smokeScript.includes("claim_ready_candidate") || !smokeScript.includes("operationalReadiness") || !smokeScript.includes("recentlyCheckedCount")) {
    issues.push("smoke tests should cover free benefit ranking admin API, CSV, and dashboard panel");
  }
  if (!smokeScript.includes("admin free benefit category coverage api") || !smokeScript.includes("/api/admin/free-benefit-category-coverage") || !smokeScript.includes("Admin dashboard missing free benefit required category coverage panel") || !smokeScript.includes("categoryCoverage") || !smokeScript.includes("categoryCandidateGroups")) {
    issues.push("smoke tests should cover free benefit category coverage admin API, CSV, and dashboard panel");
  }
  for (const phrase of ["무료혜택 운영 리포트", "노출 가능한 공식 무료혜택", "24시간 내 신규/갱신 무료혜택", "만료 제외 후보", "공식 링크 비율", "검색 링크 노출", "비공식 링크 노출", "오늘 운영 액션 큐", "상위 노출 후보"]) {
    if (!docsReport.includes(phrase)) issues.push(`docs/FREE_BENEFIT_OPERATIONS_REPORT.md missing ${phrase}`);
  }

  if (issues.length) fail("free benefit operations readiness", issues.join("; "));
  else pass("free benefit operations readiness", "Free benefit operations report, protected admin API, CSV export, QA wiring, and smoke coverage are launch-ready.");
}

function checkCronRefreshPipeline() {
  const issues = [];
  const routePath = join(root, "app/api/cron/refresh/route.ts");
  const route = existsSync(routePath) ? readFileSync(routePath, "utf8") : "";
  const benefitsRoutePath = join(root, "app/api/cron/benefits/route.ts");
  const benefitsRoute = existsSync(benefitsRoutePath) ? readFileSync(benefitsRoutePath, "utf8") : "";
  const cronOperations = existsSync(join(root, "lib/operations/cronRefresh.ts")) ? readFileSync(join(root, "lib/operations/cronRefresh.ts"), "utf8") : "";
  const healthRoute = existsSync(join(root, "app/api/health/route.ts")) ? readFileSync(join(root, "app/api/health/route.ts"), "utf8") : "";
  const adminPage = [
    existsSync(join(root, "app/admin/page.tsx")) ? readFileSync(join(root, "app/admin/page.tsx"), "utf8") : "",
    existsSync(join(root, "components/AdminNewsCollectionPanel.tsx")) ? readFileSync(join(root, "components/AdminNewsCollectionPanel.tsx"), "utf8") : "",
    existsSync(join(root, "components/AdminCronRefreshPanel.tsx")) ? readFileSync(join(root, "components/AdminCronRefreshPanel.tsx"), "utf8") : ""
  ].join("\n");
  const vercelConfig = existsSync(join(root, "vercel.json")) ? JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) : {};
  const envExample = existsSync(join(root, ".env.example")) ? readFileSync(join(root, ".env.example"), "utf8") : "";
  const smokeScript = smokeSourceSync();
  const packageJson = existsSync(join(root, "package.json")) ? withQaRunnerScripts(JSON.parse(readFileSync(join(root, "package.json"), "utf8"))) : {};
  const cronDoctor = existsSync(join(root, "scripts/cron-refresh-doctor.mjs")) ? readFileSync(join(root, "scripts/cron-refresh-doctor.mjs"), "utf8") : "";
  const cronReadinessReport = existsSync(join(root, "reports/cron-refresh-readiness.json")) ? JSON.parse(readFileSync(join(root, "reports/cron-refresh-readiness.json"), "utf8")) : null;
  const cronReadinessDocs = existsSync(join(root, "docs/CRON_REFRESH_READINESS.md")) ? readFileSync(join(root, "docs/CRON_REFRESH_READINESS.md"), "utf8") : "";
  const runbook = existsSync(join(root, "docs/RUNBOOK.md")) ? readFileSync(join(root, "docs/RUNBOOK.md"), "utf8") : "";
  const roadmap = existsSync(join(root, "docs/roadmap.md")) ? readFileSync(join(root, "docs/roadmap.md"), "utf8") : "";

  if (!route) {
    issues.push("cron refresh route is missing");
  } else {
    for (const phrase of ["CRON_SECRET", "canRunCronRefresh", "spawnSync", "scripts/refresh-all.mjs", "scripts/news-feed-live-pipeline.mjs", "resolvePipelineMode", "mode=liveFeed", "dry_run", "rateLimit", "reports/cron-refresh.json"]) {
      if (!route.includes(phrase)) issues.push(`cron refresh route missing ${phrase}`);
    }
  }
  if (!benefitsRoute) {
    issues.push("cron benefits route is missing");
  } else {
    for (const phrase of ["CRON_SECRET", "canRunBenefitsCron", "spawnSync", "scripts/refresh-benefits.mjs", "dry_run", "rateLimit", "reports/cron-benefits.json", "reports/free-benefit-events.json"]) {
      if (!benefitsRoute.includes(phrase)) issues.push(`cron benefits route missing ${phrase}`);
    }
  }

  const cron = Array.isArray(vercelConfig.crons) ? vercelConfig.crons.find((item) => item.path === "/api/cron/refresh") : null;
  if (!cron || cron.schedule !== "0 18 * * *") {
    issues.push("vercel.json should schedule /api/cron/refresh once daily for Vercel Hobby compatibility");
  }
  const benefitsCron = Array.isArray(vercelConfig.crons) ? vercelConfig.crons.find((item) => item.path === "/api/cron/benefits") : null;
  if (!benefitsCron || benefitsCron.schedule !== "0 21 * * *") {
    issues.push("vercel.json should schedule /api/cron/benefits once daily for Vercel Hobby compatibility");
  }

  for (const key of ["CRON_SECRET", "CRON_REFRESH_TIMEOUT_MS"]) {
    if (!envExample.includes(`${key}=`)) issues.push(`env example missing ${key}`);
  }

  if (packageJson.scripts?.["cron:refresh:doctor"] !== "node scripts/cron-refresh-doctor.mjs" || !packageJson.scripts?.qa?.includes("cron:refresh:doctor")) {
    issues.push("package scripts should expose cron:refresh:doctor and include it in qa");
  }
  if (!cronDoctor.includes("cron-refresh-readiness.json") || !cronDoctor.includes("CRON_REFRESH_READINESS.md") || !cronDoctor.includes("refresh-all evidence") || !cronDoctor.includes("live feed evidence") || !cronDoctor.includes("/api/cron/benefits")) {
    issues.push("cron refresh doctor should write JSON/docs readiness evidence and verify refresh:all plus live feed evidence");
  }
  if (cronReadinessReport?.ok !== true || cronReadinessReport?.endpoint !== "/api/cron/refresh" || cronReadinessReport?.schedule !== "0 18 * * *") {
    issues.push("reports/cron-refresh-readiness.json should prove protected daily cron readiness");
  }
  if (cronReadinessReport?.livePipelineOk !== true || (cronReadinessReport?.livePipelineOfficialBenefits ?? 0) < MIN_OFFICIAL_BENEFITS) {
    issues.push("reports/cron-refresh-readiness.json should prove live feed pipeline evidence");
  }
  if (!cronReadinessDocs.includes("Cron Refresh Readiness") || !cronReadinessDocs.includes("dryRun=true") || !cronReadinessDocs.includes("mode=liveFeed") || !cronReadinessDocs.includes("/api/cron/benefits") || !cronReadinessDocs.includes("CRON_SECRET")) {
    issues.push("docs/CRON_REFRESH_READINESS.md should document dry-run, mode=liveFeed, /api/cron/benefits, and CRON_SECRET operation");
  }

  if (!cronOperations.includes("getCronRefreshOperationsReport") || !cronOperations.includes("reports/cron-refresh.json") || !cronOperations.includes("reports/news-feed-live-pipeline.json") || !cronOperations.includes("livePipelineOk") || !cronOperations.includes("manual_refresh_ready")) {
    issues.push("cron refresh operations report should summarize last run, live feed evidence, fallback manual readiness, and report path");
  }
  if (!cronOperations.includes("benefitsEndpoint") || !cronOperations.includes("reports/cron-benefits.json") || !cronOperations.includes("reports/benefits-refresh.json") || !cronOperations.includes("reports/free-benefit-events.json") || !cronOperations.includes("benefitsVisibleActiveEvents")) {
    issues.push("cron refresh operations report should expose dedicated benefits cron status, reports, and visible active event evidence");
  }
  if (!healthRoute.includes("getCronRefreshOperationsReport") || !healthRoute.includes("cronRefreshStatus") || !healthRoute.includes("cronRefreshProtected") || !healthRoute.includes("cronRefreshProductDealsCount") || !healthRoute.includes("cronRefreshLivePipelineStatus")) {
    issues.push("Health API should expose cron refresh status, protection evidence, deal counts, and live feed status");
  }
  if (
    !healthRoute.includes("cronBenefitsStatus") ||
    !healthRoute.includes("cronBenefitsProtected") ||
    !healthRoute.includes("cronBenefitsVisibleActiveEvents") ||
    !healthRoute.includes("cronBenefitsSourceCount") ||
    !healthRoute.includes("githubBenefitSchedulerWorkflow") ||
    !healthRoute.includes("githubBenefitSchedulerCadenceMinutes") ||
    !healthRoute.includes("githubLiveFeedSchedulerCadenceMinutes")
  ) {
    issues.push("Health API should expose dedicated cron benefits status, protection evidence, active event count, source breadth, and GitHub 30-minute scheduler evidence");
  }
  if (
    !healthRoute.includes("buildFirstPartyFreeBenefitFeedReport") ||
    !healthRoute.includes("firstPartyFreeBenefitFeedOk") ||
    !healthRoute.includes("firstPartyFreeBenefitFeedConsumerCount") ||
    !healthRoute.includes("firstPartyFreeBenefitFeedSearchLinkCount") ||
    !healthRoute.includes("firstPartyFreeBenefitFeedHomepageLikeCount") ||
    !healthRoute.includes("firstPartyFreeBenefitFeedDuplicateGroups") ||
    !healthRoute.includes("firstPartyFreeBenefitFeedOfficialRate") ||
    !healthRoute.includes("firstPartyFreeBenefitFeedAverageQualityScore")
    || !healthRoute.includes("firstPartyFreeBenefitFeedTopCandidateClaimUrlCount")
  ) {
    issues.push("Health API should expose first-party free benefit feed publishability, official rate, quality, duplicate, search-link, and homepage-link evidence");
  }
  if (!adminPage.includes("자동 refresh cron 운영") || !adminPage.includes("cronRefreshDryRunHref") || !adminPage.includes("cronLiveFeedDryRunHref") || !adminPage.includes("cronBenefitsDryRunHref") || !adminPage.includes("liveFeed dry-run") || !adminPage.includes("benefits dry-run") || !adminPage.includes("CRON_SECRET")) {
    issues.push("Admin dashboard should expose cron refresh operation status, liveFeed dry-run, benefits dry-run, and auth guidance");
  }

  if (!smokeScript.includes("cron refresh api guard") || !smokeScript.includes("/api/cron/refresh?dryRun=true") || !smokeScript.includes("/api/cron/refresh?dryRun=true&mode=liveFeed") || !smokeScript.includes("/api/cron/benefits?dryRun=true") || !smokeScript.includes("Expected cron refresh without token to be 401")) {
    issues.push("smoke should verify cron refresh auth guard, default dry-run, liveFeed dry-run, and benefits dry-run response");
  }
  if (
    !smokeScript.includes("Admin dashboard missing cron refresh operation board") ||
    !smokeScript.includes("Health API missing cron refresh status") ||
    !smokeScript.includes("Health API missing cron live feed pipeline status") ||
    !smokeScript.includes("Health API missing cron benefits status") ||
    !smokeScript.includes("Health API should expose 30-minute GitHub benefit refresh cadence") ||
    !smokeScript.includes("Health API should expose hourly GitHub live-feed refresh cadence") ||
    !smokeScript.includes("Health API missing passing first-party free benefit feed status") ||
    !smokeScript.includes("Health API found first-party free benefit search links") ||
    !smokeScript.includes("Health API found first-party duplicate benefit groups")
  ) {
    issues.push("smoke should verify cron refresh admin, health, live feed, benefits cron visibility, and GitHub scheduler cadence");
  }
  if (!runbook.includes("/api/cron/refresh") || !runbook.includes("/api/cron/benefits") || !runbook.includes("mode=liveFeed") || !runbook.includes("CRON_SECRET") || !runbook.includes("reports/cron-refresh.json")) {
    issues.push("RUNBOOK should document protected cron refresh, benefits refresh, and live feed operation");
  }
  if (!roadmap.includes("cron refresh") && !roadmap.includes("Cron refresh")) {
    issues.push("roadmap should document cron refresh automation");
  }

  if (issues.length) fail("cron refresh automation", issues.join("; "));
  else pass("cron refresh automation", "Protected daily cron refresh endpoint, dedicated benefits cron endpoint, explicit live feed mode, Vercel Hobby-compatible schedules, dry-run smoke guard, env keys, and runbook guidance are wired.");
}

function checkAdminAuthHardening() {
  const issues = [];
  const packageJson = existsSync(join(root, "package.json")) ? withQaRunnerScripts(JSON.parse(readFileSync(join(root, "package.json"), "utf8"))) : {};
  const adminAuth = existsSync(join(root, "lib/adminAuth.ts")) ? readFileSync(join(root, "lib/adminAuth.ts"), "utf8") : "";
  const doctor = existsSync(join(root, "scripts/admin-auth-doctor.mjs")) ? readFileSync(join(root, "scripts/admin-auth-doctor.mjs"), "utf8") : "";
  const smoke = smokeSourceSync();
  const smokeHarness = existsSync(join(root, "scripts/lib/smoke-harness.mjs")) ? readFileSync(join(root, "scripts/lib/smoke-harness.mjs"), "utf8") : "";
  const smokeSource = `${smoke}\n${smokeHarness}`;
  const smokeLocal = existsSync(join(root, "scripts/smoke-local.mjs")) ? readFileSync(join(root, "scripts/smoke-local.mjs"), "utf8") : "";
  const report = existsSync(join(root, "reports/admin-auth.json")) ? JSON.parse(readFileSync(join(root, "reports/admin-auth.json"), "utf8")) : null;
  const runbook = existsSync(join(root, "docs/RUNBOOK.md")) ? readFileSync(join(root, "docs/RUNBOOK.md"), "utf8") : "";
  const adminApiRoutes = [
    "app/api/admin/daily-queue/route.ts",
    "app/api/admin/daily-operations/route.ts",
    "app/api/admin/deal-quality/route.ts",
    "app/api/admin/export/route.ts",
    "app/api/admin/exposure-policy/route.ts",
    "app/api/admin/health-readiness/route.ts",
    "app/api/admin/image-queue/route.ts",
    "app/api/admin/import/route.ts",
    "app/api/admin/link-launch-gate/route.ts",
    "app/api/admin/news-operations/route.ts",
    "app/api/admin/notification-campaigns/route.ts",
    "app/api/admin/official-alerts/route.ts",
    "app/api/admin/push-readiness/route.ts",
    "app/api/admin/push/send/route.ts",
    "app/api/admin/reports/route.ts",
    "app/api/admin/source-breadth/route.ts",
    "app/api/admin/source-live/route.ts",
    "app/api/admin/source-onboarding/route.ts",
    "app/api/admin/source-feed-activation/route.ts",
    "app/api/admin/source-feed-handoff/route.ts",
    "app/api/admin/source-starter-pack/route.ts",
    "app/api/cron/refresh/route.ts"
  ];

  if (packageJson.scripts?.["admin:auth:doctor"] !== "node scripts/admin-auth-doctor.mjs" || !String(packageJson.scripts?.qa ?? "").includes("admin:auth:doctor")) {
    issues.push("package scripts should expose admin:auth:doctor and include it in qa");
  }
  for (const phrase of ["getAdminTokenFromRequest", "canAccessAdminRequest", "x-admin-token", "x-admin-export-token", "x-halindosa-admin-token", "Bearer"]) {
    if (!adminAuth.includes(phrase)) issues.push(`lib/adminAuth.ts missing ${phrase}`);
  }
  if (!doctor.includes("routesWithLegacyDirectCall") || !doctor.includes("Authorization: Bearer") || !doctor.includes("reports/admin-auth.json")) {
    issues.push("admin auth doctor should scan protected routes and write reports/admin-auth.json");
  }
  if (!smokeSource.includes("SMOKE_ADMIN_TOKEN") || !smokeSource.includes("x-admin-token") || !smokeSource.includes("Expected cron refresh header auth 200")) {
    issues.push("smoke should exercise protected admin APIs and cron header auth with x-admin-token");
  }
  if (!smokeLocal.includes("ADMIN_EXPORT_TOKEN") || !smokeLocal.includes("SMOKE_ADMIN_TOKEN")) {
    issues.push("smoke-local should run with local admin protection enabled");
  }
  for (const routePath of adminApiRoutes) {
    const route = existsSync(join(root, routePath)) ? readFileSync(join(root, routePath), "utf8") : "";
    if (!route) {
      issues.push(`${routePath} missing`);
    } else if (!route.includes("canAccessAdminRequest")) {
      issues.push(`${routePath} should use canAccessAdminRequest`);
    }
  }
  if (report?.ok !== true || Number(report?.protectedRouteCount ?? 0) < 10 || report?.routesWithLegacyDirectCall?.length) {
    issues.push("reports/admin-auth.json should prove request-aware admin auth coverage");
  }
  if (!runbook.includes("Authorization: Bearer $ADMIN_EXPORT_TOKEN") || !runbook.includes("x-admin-token") || !runbook.includes("쿼리 token")) {
    issues.push("RUNBOOK should document preferred header-based admin auth and query token compatibility");
  }

  if (issues.length) fail("admin auth hardening", issues.join("; "));
  else pass("admin auth hardening", "Admin and cron APIs use request-aware token extraction, header-based auth, query-token compatibility, and a QA/release doctor gate.");
}

await checkPackage();
await checkCiWorkflow();
await checkSecurityPolicy();
await checkRepositorySafety();
await checkEnvExample();
await checkPublicContact();
await checkAuthSurface();
await checkPublicClaimCopy();
await checkPartnerFeedSafety();
await checkSearchAndPurchaseFlow();
await checkUiAccessibility();
await checkOperationalDataSurfaces();
await checkCapacitor();
await checkAndroid();
await checkIos();
await checkPolicyAndStoreDocs();
await checkReleaseEvidenceFreshness();
await checkGeneratedReportFreshness();
await checkCustomerNavigationSimplification();
checkRefreshDealPipeline();
checkNewsDealPipeline();
checkAdminAuthHardening();
checkCronRefreshPipeline();
checkHealthReadinessReport();
checkDailyOperationsReport();
checkFreeBenefitOperationsReport();
checkSigningAndArtifacts();
checkStoreAssets();

for (const check of checks) {
  const prefix = check.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

const failures = checks.filter((check) => !check.ok);
const releaseDoctorReport = {
  generatedAt: new Date().toISOString(),
  totalChecks: checks.length,
  passedChecks: checks.length - failures.length,
  failedChecks: failures.length,
  ok: failures.length === 0,
  checks
};

mkdirSync(join(root, "reports"), { recursive: true });
writeFileSync(join(root, "reports", "release-doctor.json"), `${JSON.stringify(releaseDoctorReport, null, 2)}\n`, "utf8");

if (failures.length) {
  console.error(`Release doctor failed: ${failures.length}/${checks.length}`);
  for (const failure of failures) {
    const message = `${failure.name}: ${failure.detail ?? "No detail"}`
      .replace(/%/g, "%25")
      .replace(/\r/g, "%0D")
      .replace(/\n/g, "%0A");
    console.error(`::error title=Release doctor failure::${message}`);
  }
  process.exit(1);
}

console.log(`Release doctor passed: ${checks.length}/${checks.length}`);


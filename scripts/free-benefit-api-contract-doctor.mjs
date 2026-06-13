import { readFileSync } from "node:fs";

const files = {
  dto: "lib/freeBenefitDto.ts",
  freebiesApi: "app/api/freebies/route.ts",
  eventsApi: "app/api/benefits/events/route.ts",
  homeApi: "app/api/home/route.ts",
  homeTypes: "lib/homeApi.ts",
  eventModel: "lib/freeBenefitEvents.ts",
  qa: "scripts/run-qa.mjs"
};

function read(path) {
  return readFileSync(path, "utf8");
}

function pass(name, detail) {
  console.log(`PASS ${name} - ${detail}`);
}

function fail(name, detail) {
  console.error(`FAIL ${name} - ${detail}`);
  process.exitCode = 1;
}

function includesAll(source, required) {
  return required.every((text) => source.includes(text));
}

const dto = read(files.dto);
const freebiesApi = read(files.freebiesApi);
const eventsApi = read(files.eventsApi);
const homeApi = read(files.homeApi);
const homeTypes = read(files.homeTypes);
const eventModel = read(files.eventModel);
const qa = read(files.qa);

const requiredFields = [
  "id",
  "brand",
  "title",
  "description",
  "benefitType",
  "rewardValue",
  "startDate",
  "endDate",
  "sourceUrl",
  "officialUrl",
  "finalUrl",
  "claimUrl",
  "imageUrl",
  "status",
  "isOfficial",
  "isFree",
  "isVerified",
  "qualityScore",
  "freshnessScore",
  "officialScore",
  "urgencyScore",
  "rewardScore",
  "lastCheckedAt",
  "createdAt",
  "updatedAt",
  "tags",
  "sourceName",
  "sourceDomain",
  "validationStatus",
  "validationReason",
  "verifiedAt",
  "claimCtaLabel",
  "claimAccessLevel",
  "claimAccessLabel",
  "requiresLogin",
  "requiresPurchase",
  "isEveryoneReward",
  "isFirstComeFirstServed"
];

const requiredBenefitCategories = [
  "everyone",
  "firstCome",
  "sample",
  "freeTrial",
  "coupon",
  "gifticon",
  "pointCashback",
  "freeShipping",
  "signup"
];

const requiredDeadlineFilters = ["today", "week", "soon"];

if (
  includesAll(dto, [
    "export interface StandardFreeBenefit",
    "requiredStandardFreeBenefitFields",
    "getMissingStandardFreeBenefitFields",
    "isCompleteStandardFreeBenefit",
    "toStandardFreeBenefit",
    "toStandardFreeBenefits",
    ...requiredFields
  ])
) {
  pass("standard free benefit dto", "API-ready free benefit fields are mapped from FreeBenefitEvent and guarded by a shared completeness helper.");
} else {
  fail("standard free benefit dto", "StandardFreeBenefit is missing one or more required launch fields or the shared completeness helper.");
}

if (includesAll(freebiesApi, ["toStandardFreeBenefits", "const freeBenefits = toStandardFreeBenefits(events)", "freeBenefits,"])) {
  pass("freebies api standard field", "/api/freebies exposes freeBenefits alongside legacy freebies/events.");
} else {
  fail("freebies api standard field", "/api/freebies does not expose the standard freeBenefits field.");
}

if (
  includesAll(freebiesApi, [
    "parseDeadline",
    "getDeadlineWindowMs",
    "deadlineCategoryCounts",
    "filteredDeadlineCategoryCounts",
    "eventType",
    "claimAccess",
    "noPurchaseOnly",
    ...requiredDeadlineFilters,
    ...requiredBenefitCategories
  ])
) {
  pass("freebies api filters", "/api/freebies supports event type, claim effort, no-purchase, and today/week/soon deadline filters.");
} else {
  fail("freebies api filters", "/api/freebies is missing one or more free-benefit category or deadline filter contracts.");
}

if (includesAll(eventsApi, ["toStandardFreeBenefits", "const freeBenefits = toStandardFreeBenefits(events)", "freeBenefits,"])) {
  pass("benefit events api standard field", "/api/benefits/events exposes freeBenefits alongside events.");
} else {
  fail("benefit events api standard field", "/api/benefits/events does not expose the standard freeBenefits field.");
}

if (
  includesAll(eventsApi, [
    "parseDeadline",
    "getDeadlineWindowMs",
    "deadlineCategoryCounts",
    "filteredDeadlineCategoryCounts",
    "benefitTypeIds",
    "claimAccess",
    "noPurchaseOnly",
    ...requiredDeadlineFilters
  ]) &&
  includesAll(eventModel, ["freeBenefitEventCategories", "requiredRuntimeCategoryIds", ...requiredBenefitCategories])
) {
  pass("benefit events api filters", "/api/benefits/events supports required free-benefit categories and today/week/soon deadline filters.");
} else {
  fail("benefit events api filters", "/api/benefits/events is missing one or more category or deadline filter contracts.");
}

if (includesAll(homeApi, ["toStandardFreeBenefits", "const standardFreeBenefits = toStandardFreeBenefits(freeBenefitEvents)", "freeBenefits: standardFreeBenefits"])) {
  pass("home api standard field", "/api/home exposes the same standard freeBenefits contract for WebView runtime snapshots.");
} else {
  fail("home api standard field", "/api/home does not expose the standard freeBenefits field.");
}

if (includesAll(homeApi, ["deadlineCategoryCounts", "requiredCategoryCoverage", "categoryCandidateGroups"])) {
  pass("home api free benefit navigation metadata", "/api/home carries deadline and category coverage metadata for mobile free-benefit rails.");
} else {
  fail("home api free benefit navigation metadata", "/api/home should expose deadlineCategoryCounts and requiredCategoryCoverage for first-screen free-benefit navigation.");
}

if (includesAll(homeTypes, ["StandardFreeBenefit", "freeBenefits?: StandardFreeBenefit[]"])) {
  pass("client api types", "Shared home API response types include standard freeBenefits.");
} else {
  fail("client api types", "Shared API response types do not include standard freeBenefits.");
}

if (includesAll(qa, ["benefit:api-contract", "benefit:model:doctor"])) {
  pass("model contract pairing", "Standard API contract and runtime model doctors are both wired into QA.");
} else {
  fail("model contract pairing", "QA should run both benefit:api-contract and benefit:model:doctor.");
}

if (qa.includes("benefit:api-contract")) {
  pass("qa wiring", "The standard free benefit API contract doctor is wired into npm run qa.");
} else {
  fail("qa wiring", "benefit:api-contract is not wired into npm run qa.");
}

if (process.exitCode) process.exit(process.exitCode);

console.log("Free benefit API contract doctor passed.");

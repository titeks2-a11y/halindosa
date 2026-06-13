import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const readinessPath = join(root, "lib", "operations", "sourceFeedEnvReadiness.ts");
const reportPath = join(root, "reports", "source-feed-env-readiness.json");

const requiredLanes = [
  "오늘 바로 받는 무료혜택",
  "편의점 1+1·2+1",
  "뷰티 샘플·체험",
  "카페·외식 쿠폰",
  "쇼핑몰·브랜드 쿠폰",
  "페이·포인트·캐시백",
  "전원증정·선착순",
  "출석체크·룰렛·미션",
  "신규가입·웰컴 쿠폰",
  "기프티콘·문화초대권",
  "반려동물·체험단",
  "선택 운영: 공공·문화 무료"
];

const requiredEnvKeys = [
  "BENEFIT_REFRESH_FEED_URLS",
  "PUBLIC_COUPON_FEED_URLS",
  "CONVENIENCE_BENEFIT_FEED_URLS",
  "BEAUTY_SAMPLE_FEED_URLS",
  "CAFE_FRANCHISE_COUPON_FEED_URLS",
  "PAY_POINT_BENEFIT_FEED_URLS",
  "SIGNUP_GIFT_FEED_URLS",
  "PET_SAMPLE_FEED_URLS",
  "OPTIONAL_PUBLIC_BENEFIT_FEED_URLS"
];

function readText(path) {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf8");
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const source = readText(readinessPath);
const report = readJson(reportPath);
const issues = [];

if (!source.includes("const defaultActivationLanes")) {
  issues.push("sourceFeedEnvReadiness fallback lanes are missing.");
}

if (!source.includes("recommendedLaneCount: defaultActivationLanes.length")) {
  issues.push("fallback recommendedLaneCount must be derived from defaultActivationLanes.length.");
}

if (!source.includes("recommendedFirstLanes: defaultActivationLanes")) {
  issues.push("fallback recommendedFirstLanes must use defaultActivationLanes.");
}

if (!source.includes("operatorChecklist: defaultOperatorChecklist")) {
  issues.push("fallback operator checklist must be preserved.");
}

for (const lane of requiredLanes) {
  if (!source.includes(lane)) issues.push(`fallback lane missing: ${lane}`);
}

for (const envKey of requiredEnvKeys) {
  if (!source.includes(envKey)) issues.push(`fallback env key missing: ${envKey}`);
}

if (report) {
  const lanes = report.activationReadiness?.recommendedFirstLanes;
  if (!Array.isArray(lanes) || lanes.length < requiredLanes.length) {
    issues.push(`source feed env report should expose at least ${requiredLanes.length} activation lanes.`);
  } else {
    const labels = new Set(lanes.map((lane) => lane.label));
    for (const lane of requiredLanes) {
      if (!labels.has(lane)) issues.push(`source feed env report missing lane: ${lane}`);
    }
  }

  const checklist = report.activationReadiness?.operatorChecklist;
  if (!Array.isArray(checklist) || checklist.length < 4) {
    issues.push("source feed env report operator checklist is too thin.");
  }
}

if (issues.length) {
  console.error("Source feed env runtime doctor failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Source feed env runtime doctor passed.");
console.log(`- fallback lanes: ${requiredLanes.length}`);
console.log(`- required env keys: ${requiredEnvKeys.length}`);
console.log("- reports/source-feed-env-readiness.json compatible");

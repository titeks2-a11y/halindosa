import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = "reports/push-delivery-policy.json";
const docsPath = "docs/PUSH_DELIVERY_POLICY.md";

function read(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

function getZonedHour(date, timezone) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", hourCycle: "h23" }).format(date));
}

function isQuietHour(date, policy) {
  const hour = getZonedHour(date, policy.timezone);
  const { startHour, endHour } = policy.quietHours;
  return startHour < endHour ? hour >= startHour && hour < endHour : hour >= startHour || hour < endHour;
}

function nextAllowedAt(date, policy) {
  if (!isQuietHour(date, policy)) return date.toISOString();
  const next = new Date(date);
  for (let attempt = 0; attempt < 36; attempt += 1) {
    next.setMinutes(next.getMinutes() + 30, 0, 0);
    if (!isQuietHour(next, policy)) return next.toISOString();
  }
  next.setUTCHours(next.getUTCHours() + 12, 0, 0, 0);
  return next.toISOString();
}

function evaluate(input, policy) {
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date("2026-06-03T03:00:00.000Z");
  const tokenCount = input.tokens.length;
  const maxTokens = input.dryRun ? policy.maxTokensPerRequest.dryRun : policy.maxTokensPerRequest.live;
  const quiet = isQuietHour(scheduledAt, policy);
  const priority = input.priority ?? "medium";
  const reasons = [];
  const warnings = [];

  if (!tokenCount) reasons.push("no_tokens");
  if (tokenCount > maxTokens) reasons.push("token_limit_exceeded");
  if (!input.dryRun && policy.requiresExplicitConsent && !input.confirmedConsent) reasons.push("missing_explicit_consent");
  if (!input.dryRun && quiet && !policy.priorityRules[priority].canBypassQuietHours) reasons.push("quiet_hours");
  if (input.dryRun && quiet) warnings.push("dry_run_during_quiet_hours");
  if (!input.dryRun && policy.requiresDryRunBeforeLive && !input.confirmedConsent) reasons.push("dry_run_required_before_live");

  return {
    ok: reasons.length === 0,
    mode: input.dryRun ? "dry_run" : "live",
    tokenCount,
    maxTokens,
    isQuietHours: quiet,
    nextAllowedAt: nextAllowedAt(scheduledAt, policy),
    reasons,
    warnings
  };
}

function pass(name, detail) {
  return { name, ok: true, detail };
}

function fail(name, detail) {
  return { name, ok: false, detail };
}

const policy = readJson("data/notificationDeliveryPolicy.json", null);
const deliveryPolicyLib = read("lib/notificationDeliveryPolicy.ts");
const pushNotifications = read("lib/pushNotifications.ts");
const pushSendRoute = read("app/api/admin/push/send/route.ts");
const adminPushPanel = read("components/AdminPushDryRunPanel.tsx");
const packageJson = readJson("package.json", {});
const runbook = read("docs/RUNBOOK.md");
const releaseDoctor = read("scripts/release-doctor.mjs");

const scenarios = policy
  ? [
      {
        name: "quiet live send blocked",
        decision: evaluate({ tokens: ["token-a"], dryRun: false, confirmedConsent: true, priority: "critical", scheduledAt: "2026-06-03T14:30:00.000Z" }, policy),
        expectOk: false,
        expectReason: "quiet_hours"
      },
      {
        name: "business hour consented live send allowed",
        decision: evaluate({ tokens: ["token-a"], dryRun: false, confirmedConsent: true, priority: "high", scheduledAt: "2026-06-03T02:00:00.000Z" }, policy),
        expectOk: true
      },
      {
        name: "live send without consent blocked",
        decision: evaluate({ tokens: ["token-a"], dryRun: false, confirmedConsent: false, priority: "medium", scheduledAt: "2026-06-03T02:00:00.000Z" }, policy),
        expectOk: false,
        expectReason: "missing_explicit_consent"
      },
      {
        name: "dry-run during quiet hours allowed with warning",
        decision: evaluate({ tokens: ["token-a"], dryRun: true, priority: "low", scheduledAt: "2026-06-03T14:30:00.000Z" }, policy),
        expectOk: true,
        expectWarning: "dry_run_during_quiet_hours"
      },
      {
        name: "live token limit blocked",
        decision: evaluate({ tokens: Array.from({ length: policy.maxTokensPerRequest.live + 1 }, (_, index) => `token-${index}`), dryRun: false, confirmedConsent: true, priority: "high", scheduledAt: "2026-06-03T02:00:00.000Z" }, policy),
        expectOk: false,
        expectReason: "token_limit_exceeded"
      }
    ]
  : [];

const scenarioChecks = scenarios.map((scenario) => {
  const ok =
    scenario.decision.ok === scenario.expectOk &&
    (!scenario.expectReason || scenario.decision.reasons.includes(scenario.expectReason)) &&
    (!scenario.expectWarning || scenario.decision.warnings.includes(scenario.expectWarning));
  return ok
    ? pass(scenario.name, JSON.stringify(scenario.decision))
    : fail(scenario.name, JSON.stringify(scenario.decision));
});

const checks = [
  policy?.timezone === "Asia/Seoul" && policy?.quietHours?.startHour === 22 && policy?.quietHours?.endHour === 8
    ? pass("policy timezone and quiet hours", "22:00-07:59 KST live sends are blocked.")
    : fail("policy timezone and quiet hours", "notification delivery policy should define Asia/Seoul quiet hours 22-8."),
  policy?.requiresExplicitConsent === true && policy?.requiresDryRunBeforeLive === true
    ? pass("consent and dry-run requirement", "Live sends require explicit consent and dry-run-first operation.")
    : fail("consent and dry-run requirement", "policy should require explicit consent and dry-run before live sends."),
  deliveryPolicyLib.includes("evaluateNotificationDelivery") &&
    deliveryPolicyLib.includes("isNotificationQuietHour") &&
    deliveryPolicyLib.includes("getNextNotificationAllowedAt")
    ? pass("runtime policy library", "Runtime notification delivery policy evaluator is present.")
    : fail("runtime policy library", "lib/notificationDeliveryPolicy.ts should expose runtime policy helpers."),
  pushNotifications.includes("evaluateNotificationDelivery") &&
    pushNotifications.includes("deliveryPolicy") &&
    pushNotifications.includes("if (!deliveryPolicy.ok)") &&
    pushNotifications.includes("알림 발송 정책으로 차단")
    ? pass("send adapter policy enforcement", "sendPushNotification blocks unsafe live sends before FCM.")
    : fail("send adapter policy enforcement", "sendPushNotification should enforce delivery policy before FCM."),
  pushSendRoute.includes("confirmedConsent") && pushSendRoute.includes("scheduledAt") && pushSendRoute.includes("priority")
    ? pass("admin send API policy fields", "Admin push send route passes consent, scheduledAt, and priority to the adapter.")
    : fail("admin send API policy fields", "Admin push send route should pass delivery policy fields."),
  adminPushPanel.includes("동의 받은 테스트 토큰") && adminPushPanel.includes("deliveryPolicy") && adminPushPanel.includes("confirmConsent")
    ? pass("admin panel consent UX", "Admin dry-run panel requires consent confirmation for live tests and shows policy output.")
    : fail("admin panel consent UX", "Admin dry-run panel should expose consent confirmation and policy output."),
  packageJson.scripts?.["push:delivery:doctor"] === "node scripts/push-delivery-policy-doctor.mjs" &&
    String(packageJson.scripts?.qa ?? "").includes("push:delivery:doctor")
    ? pass("package script wiring", "push:delivery:doctor is part of QA.")
    : fail("package script wiring", "package.json should expose push:delivery:doctor and include it in qa."),
  runbook.includes("PUSH_DELIVERY_POLICY.md") && runbook.includes("quiet hours") && runbook.includes("동의 받은 테스트 토큰")
    ? pass("runbook delivery policy", "Runbook documents quiet hours and consent-safe push operation.")
    : fail("runbook delivery policy", "Runbook should document push delivery policy."),
  releaseDoctor.includes("push-delivery-policy.json") && releaseDoctor.includes("push:delivery:doctor")
    ? pass("release doctor coverage", "Release doctor checks push delivery policy evidence.")
    : fail("release doctor coverage", "Release doctor should check push delivery policy evidence."),
  ...scenarioChecks
];

const failures = checks.filter((check) => !check.ok);
const report = {
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  policy,
  scenarios: scenarios.map((scenario) => ({
    name: scenario.name,
    ok: scenario.decision.ok,
    reasons: scenario.decision.reasons,
    warnings: scenario.decision.warnings,
    nextAllowedAt: scenario.decision.nextAllowedAt
  })),
  checks,
  issues: failures.map((check) => `${check.name}: ${check.detail}`)
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const docsLines = [
  "# Push Delivery Policy",
  "",
  "할인도사는 실제 FCM 발송 전에도 사용자 피로도와 심사 리스크를 낮추기 위해 발송 정책을 코드와 QA에 연결합니다.",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- Timezone: ${policy?.timezone ?? "-"}`,
  `- Quiet hours: ${policy?.quietHours?.startHour ?? "-"}:00-${policy?.quietHours?.endHour ?? "-"}:00`,
  `- Live token limit: ${policy?.maxTokensPerRequest?.live ?? "-"}`,
  `- Dry-run token limit: ${policy?.maxTokensPerRequest?.dryRun ?? "-"}`,
  `- Daily campaign cap per user: ${policy?.dailyCampaignCapPerUser ?? "-"}`,
  "",
  "## Checks",
  "",
  "| Check | Status | Detail |",
  "| --- | --- | --- |",
  ...checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${String(check.detail).replace(/\|/g, "/")} |`),
  "",
  "## Scenarios",
  "",
  "| Scenario | Result | Reasons | Warnings | Next Allowed |",
  "| --- | --- | --- | --- | --- |",
  ...report.scenarios.map((scenario) => `| ${scenario.name} | ${scenario.ok ? "allowed" : "blocked"} | ${scenario.reasons.join(", ") || "-"} | ${scenario.warnings.join(", ") || "-"} | ${scenario.nextAllowedAt} |`),
  "",
  "## 운영 원칙",
  "",
  "- 실제 발송은 명시 동의가 확인된 토큰만 사용합니다.",
  "- 22:00-07:59 KST에는 live send를 차단하고 다음 안전 시간대로 재예약합니다.",
  "- FCM 키 설정 전에는 dry-run과 앱 내 알림 큐만 운영합니다.",
  "- 긴급 캠페인도 quiet hours를 우회하지 않습니다.",
  ""
];
writeFileSync(join(root, docsPath), `${docsLines.join("\n")}\n`, "utf8");

if (failures.length) {
  console.error("Push delivery policy doctor failed.");
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Push delivery policy doctor passed.");
console.log(`- ${reportPath}`);
console.log(`- ${docsPath}`);

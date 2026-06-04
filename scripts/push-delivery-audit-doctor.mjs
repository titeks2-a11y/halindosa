import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = "reports/push-delivery-audit.json";
const docsPath = "docs/PUSH_DELIVERY_AUDIT.md";

function read(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function readJson(path, fallback) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) return fallback;

  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function pass(name, detail) {
  return { name, ok: true, detail };
}

function fail(name, detail) {
  return { name, ok: false, detail };
}

function includesAll(source, snippets) {
  return snippets.every((snippet) => source.includes(snippet));
}

function auditScenario({ id, mode, status, reasons = [], sent = 0, failed = 0 }) {
  return {
    eventId: `push-audit-sample-${id}`,
    createdAt: "2026-06-03T02:00:00.000Z",
    mode,
    status,
    campaignId: `campaign-${id}`,
    dealId: id === "official-benefit" ? "" : "d001",
    benefitId: id === "official-benefit" ? "news-001" : "",
    sourceKind: id === "official-benefit" ? "official_benefit" : "product_deal",
    alertType: id === "quiet-hours" ? "ending_soon" : "free_event",
    priority: id === "quiet-hours" ? "critical" : "high",
    scheduledAt: id === "quiet-hours" ? "2026-06-03T14:30:00.000Z" : "2026-06-03T02:00:00.000Z",
    tokenCount: 1,
    attempted: 1,
    sent,
    failed,
    confirmedConsent: status !== "blocked" || !reasons.includes("missing_explicit_consent"),
    blockedReasons: reasons,
    policyWarnings: mode === "dry_run" ? [] : [],
    nextAllowedAt: id === "quiet-hours" ? "2026-06-03T23:00:00.000Z" : "2026-06-03T02:00:00.000Z",
    message: status === "blocked" ? `정책 차단: ${reasons.join(", ")}` : "감사 가능한 발송 후보"
  };
}

const schema = read("docs/supabase-schema.sql");
const pushDeliveryAuditLib = read("lib/pushDeliveryAudit.ts");
const pushNotifications = read("lib/pushNotifications.ts");
const adminPushPanel = read("components/AdminPushDryRunPanel.tsx");
const pushNotificationDesign = read("docs/push-notification-design.md");
const runbook = read("docs/RUNBOOK.md");
const packageJson = readJson("package.json", {});
const releaseDoctor = read("scripts/release-doctor.mjs");

const scenarios = [
  auditScenario({ id: "dry-run", mode: "dry_run", status: "allowed" }),
  auditScenario({ id: "missing-consent", mode: "live", status: "blocked", reasons: ["missing_explicit_consent"], failed: 1 }),
  auditScenario({ id: "quiet-hours", mode: "live", status: "blocked", reasons: ["quiet_hours"], failed: 1 }),
  auditScenario({ id: "official-benefit", mode: "dry_run", status: "allowed" })
];
const statusCounts = scenarios.reduce((counts, scenario) => {
  counts[scenario.status] = (counts[scenario.status] ?? 0) + 1;
  return counts;
}, {});
const blockedReasonCounts = scenarios.reduce((counts, scenario) => {
  for (const reason of scenario.blockedReasons) counts[reason] = (counts[reason] ?? 0) + 1;
  return counts;
}, {});

const checks = [
  includesAll(schema, [
    "create table if not exists public.push_delivery_logs",
    "token_count integer",
    "blocked_reasons text[]",
    "policy_warnings text[]",
    "alter table public.push_delivery_logs enable row level security",
    "service manages push delivery logs"
  ])
    ? pass("database audit table", "push_delivery_logs table, indexes, and service-role RLS policy are present.")
    : fail("database audit table", "push_delivery_logs table or RLS policy is missing."),
  !schema.includes("fcm_token text") || schema.includes("push_subscriptions")
    ? pass("token separation", "Push tokens remain in subscriptions; delivery logs store counts and policy evidence only.")
    : fail("token separation", "Delivery logs should not store raw FCM token values."),
  includesAll(pushDeliveryAuditLib, [
    "PushDeliveryAuditEntry",
    "buildPushDeliveryAuditEntry",
    "summarizePushDeliveryAudit",
    "blockedReasons",
    "policyWarnings"
  ])
    ? pass("runtime audit model", "Runtime audit entry builder and summary helper are present.")
    : fail("runtime audit model", "Push delivery audit runtime model is incomplete."),
  includesAll(pushNotifications, ["buildPushDeliveryAuditEntry", "deliveryAudit", "withDeliveryAudit"])
    ? pass("send adapter audit output", "sendPushNotification returns a deliveryAudit entry for every result path.")
    : fail("send adapter audit output", "sendPushNotification should attach deliveryAudit to all results."),
  includesAll(adminPushPanel, ["감사 로그 후보", "deliveryAudit", "blockedReasons"])
    ? pass("admin audit visibility", "Admin dry-run panel shows audit event id, status, and blocked reasons.")
    : fail("admin audit visibility", "Admin dry-run panel should display deliveryAudit evidence."),
  includesAll(pushNotificationDesign, ["push_delivery_logs", "토큰 원문은 저장하지", "push:delivery:audit"])
    ? pass("design documentation", "Push design document covers audit log storage and token minimization.")
    : fail("design documentation", "Push design document should describe push_delivery_logs and token minimization."),
  includesAll(runbook, ["push:delivery:audit", "PUSH_DELIVERY_AUDIT.md", "push_delivery_logs"])
    ? pass("runbook documentation", "Runbook includes push delivery audit command and output.")
    : fail("runbook documentation", "Runbook should document push delivery audit operation."),
  packageJson.scripts?.["push:delivery:audit"] === "node scripts/push-delivery-audit-doctor.mjs" &&
    String(packageJson.scripts?.qa ?? "").includes("push:delivery:audit")
    ? pass("package script wiring", "push:delivery:audit is wired into QA.")
    : fail("package script wiring", "package.json should expose push:delivery:audit and include it in qa."),
  releaseDoctor.includes("push-delivery-audit.json") && releaseDoctor.includes("push:delivery:audit")
    ? pass("release doctor coverage", "release:doctor checks push delivery audit evidence.")
    : fail("release doctor coverage", "release:doctor should check push delivery audit evidence.")
];

const failures = checks.filter((check) => !check.ok);
const report = {
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  sampleEvents: scenarios,
  statusCounts,
  blockedReasonCounts,
  tokenStoragePolicy: "push_delivery_logs stores token counts, not raw FCM tokens.",
  checks,
  issues: failures.map((check) => `${check.name}: ${check.detail}`)
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const docsLines = [
  "# Push Delivery Audit",
  "",
  "FCM/Web Push 발송 전환 시 운영자가 dry-run, 차단, 실패, 성공을 추적할 수 있도록 남기는 감사 리포트입니다. 토큰 원문은 저장하지 않고 대상 수와 정책 판단만 기록합니다.",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- 상태: ${report.ok ? "PASS" : "FAIL"}`,
  `- 샘플 감사 이벤트: ${report.sampleEvents.length}개`,
  `- 차단 사유: ${Object.entries(report.blockedReasonCounts).map(([reason, count]) => `${reason} ${count}`).join(", ") || "없음"}`,
  "",
  "## Checks",
  "",
  "| Check | Status | Detail |",
  "| --- | --- | --- |",
  ...checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${String(check.detail).replace(/\|/g, "/")} |`),
  "",
  "## Sample Audit Events",
  "",
  "| Event | Mode | Status | Source | Alert | Reasons | Token Count |",
  "| --- | --- | --- | --- | --- | --- | ---: |",
  ...scenarios.map((scenario) => `| ${scenario.eventId} | ${scenario.mode} | ${scenario.status} | ${scenario.sourceKind} | ${scenario.alertType} | ${scenario.blockedReasons.join(", ") || "-"} | ${scenario.tokenCount} |`),
  "",
  "## 운영 원칙",
  "",
  "- 실제 토큰 값은 `push_subscriptions`에만 저장하고 delivery log에는 저장하지 않습니다.",
  "- `push_delivery_logs`는 service role 작업자만 insert/update/select합니다.",
  "- live send 차단 사유는 `blocked_reasons`와 `policy_warnings`로 남겨 다음 발송 시간과 동의 상태를 추적합니다.",
  "- 관리자 dry-run 화면은 API 응답의 `deliveryAudit.eventId`로 운영자가 같은 발송 시도를 추적할 수 있게 합니다.",
  ""
];
writeFileSync(join(root, docsPath), `${docsLines.join("\n")}\n`, "utf8");

if (failures.length) {
  console.error("Push delivery audit doctor failed.");
  for (const issue of report.issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Push delivery audit doctor passed.");
console.log(`- ${reportPath}`);
console.log(`- ${docsPath}`);

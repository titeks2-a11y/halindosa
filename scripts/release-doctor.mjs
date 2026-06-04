import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function pass(name, detail = "") {
  checks.push({ name, ok: true, detail });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

async function text(path) {
  return readFile(join(root, path), "utf8");
}

function fileSize(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? statSync(fullPath).size : 0;
}

function run(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

async function checkPackage() {
  const pkg = JSON.parse(await text("package.json"));
  const lock = JSON.parse(await text("package-lock.json"));
  const androidGradle = await text("android/app/build.gradle");
  const iosProject = await text("ios/App/App.xcodeproj/project.pbxproj");
  const harness = await text("scripts/harness.mjs");
  const audit = await text("scripts/audit.mjs");
  const requiredScripts = [
    "build",
    "build:android",
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
    "link:launch:gate",
    "refresh:deals",
    "refresh:news",
    "verify:news",
    "news:freshness:doctor",
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
    "source:live:doctor",
    "source:onboarding:plan",
    "source:feed-env:doctor",
    "source:readiness:report",
    "test:mobile-ux",
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
  else if (!pkg.scripts?.qa?.includes("admin:auth:doctor") || !pkg.scripts?.qa?.includes("verify:links") || !pkg.scripts?.qa?.includes("verify:links:live") || !pkg.scripts?.qa?.includes("verify:products") || !pkg.scripts?.qa?.includes("link:policy:regression") || !pkg.scripts?.qa?.includes("exposure:doctor") || !pkg.scripts?.qa?.includes("link:launch:gate") || !pkg.scripts?.qa?.includes("refresh:deals") || !pkg.scripts?.qa?.includes("refresh:news") || !pkg.scripts?.qa?.includes("verify:news") || !pkg.scripts?.qa?.includes("news:freshness:doctor") || !pkg.scripts?.qa?.includes("test:news-feed-errors") || !pkg.scripts?.qa?.includes("test:news-feed-dry-run") || !pkg.scripts?.qa?.includes("refresh:all") || !pkg.scripts?.qa?.includes("health:readiness") || !pkg.scripts?.qa?.includes("push:readiness:report") || !pkg.scripts?.qa?.includes("push:delivery:doctor") || !pkg.scripts?.qa?.includes("push:delivery:audit") || !pkg.scripts?.qa?.includes("official:alerts:report") || !pkg.scripts?.qa?.includes("source:catalog:report") || !pkg.scripts?.qa?.includes("source:live:doctor") || !pkg.scripts?.qa?.includes("source:onboarding:plan") || !pkg.scripts?.qa?.includes("source:feed-env:doctor") || !pkg.scripts?.qa?.includes("source:readiness:report") || !pkg.scripts?.["admin:auth:doctor"]?.includes("admin-auth-doctor.mjs") || !pkg.scripts?.["link:policy:regression"]?.includes("link-quality-regression.mjs") || !pkg.scripts?.["link:launch:gate"]?.includes("link-launch-gate.mjs") || !pkg.scripts?.["refresh:all"]?.includes("refresh-all.mjs") || !pkg.scripts?.["health:readiness"]?.includes("health-readiness-report.mjs") || !pkg.scripts?.["push:readiness:report"]?.includes("push-readiness-report.mjs") || !pkg.scripts?.["push:delivery:doctor"]?.includes("push-delivery-policy-doctor.mjs") || !pkg.scripts?.["push:delivery:audit"]?.includes("push-delivery-audit-doctor.mjs") || !pkg.scripts?.["official:alerts:report"]?.includes("official-benefit-alert-report.mjs") || !pkg.scripts?.["news:freshness:doctor"]?.includes("news-freshness-doctor.mjs") || !pkg.scripts?.["source:catalog:report"]?.includes("official-source-catalog-report.mjs") || !pkg.scripts?.["source:live:doctor"]?.includes("official-source-live-doctor.mjs") || !pkg.scripts?.["source:onboarding:plan"]?.includes("source-onboarding-plan.mjs") || !pkg.scripts?.["source:feed-env:doctor"]?.includes("source-feed-env-doctor.mjs") || !pkg.scripts?.["source:readiness:report"]?.includes("source-readiness-report.mjs") || !harness.includes("test:mobile-ux") || !pkg.scripts?.qa?.includes("test:mobile-ux") || !pkg.scripts?.["env:doctor:production"]?.includes("--production") || !pkg.scripts?.["qa:release"]?.includes("health:readiness") || !pkg.scripts?.["qa:release"]?.includes("audit:commercial") || !pkg.scripts?.["qa:release"]?.includes("test:env") || !pkg.scripts?.["qa:release"]?.includes("device:qa:manifest") || !pkg.scripts?.["qa:release"]?.includes("device:qa:doctor") || !pkg.scripts?.["qa:release"]?.includes("device:qa:report") || !pkg.scripts?.["qa:release"]?.includes("android:signing:doctor") || !pkg.scripts?.["qa:release"]?.includes("public:url:doctor") || !pkg.scripts?.["qa:release"]?.includes("feed:validate") || !pkg.scripts?.["qa:release"]?.includes("feed:production:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:metadata:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:submission:report") || !pkg.scripts?.["qa:release"]?.includes("store:packet:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:console:fields") || !pkg.scripts?.["qa:release"]?.includes("store:manual:checklist") || !pkg.scripts?.["qa:release"]?.includes("store:manual:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:handoff:report") || !pkg.scripts?.["qa:release"]?.includes("release:notes") || !pkg.scripts?.["qa:release"]?.includes("support:playbook") || !pkg.scripts?.["qa:release"]?.includes("known:issues") || !pkg.scripts?.["qa:release"]?.includes("store:assets:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:screenshots:manifest") || !pkg.scripts?.["qa:release"]?.includes("store:screenshots:doctor") || !pkg.scripts?.["qa:release"]?.includes("perf:budget")) {
    fail("package scripts", "qa, harness, and qa:release should include admin auth doctor, refresh:all, health readiness, mobile UX, commercial security audit, device QA manifest/doctor/report, Android signing doctor, public URL doctor, partner feed validator, production feed doctor, store metadata doctor, store submission/packet/console/handoff reports, store asset doctor, store screenshot manifest/doctor, and performance budget before store submission.");
  } else {
    pass("package scripts", "Android, iOS, environment, mobile UX, commercial security, and performance release command flow is available.");
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
    "npm ci",
    "npm run audit:commercial",
    "npm run test:env",
    "npm run public:url:doctor",
    "npm run store:metadata:doctor",
    "npm run store:assets:doctor",
    "npm run device:qa:manifest",
    "npm run device:qa:report",
    "npm run store:submission:report",
    "npm run store:packet:doctor",
    "npm run store:console:fields",
    "npm run store:manual:checklist",
    "npm run store:manual:doctor",
    "npm run store:handoff:report",
    "npm run release:notes",
    "npm run support:playbook",
    "npm run known:issues",
    "npm run store:screenshots:manifest",
    "npm run store:screenshots:doctor",
    "npm run health:readiness",
    "npm run official:alerts:report",
    "npm run harness",
    "npm run release:doctor",
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
  const requiredRunbookSnippets = ["codex/**", "AUDIT_REPORT.md", "npm run test:env", "ENV_DOCTOR_REPORT.md", "PUBLIC_URL_REPORT.md", "npm run store:metadata:doctor", "STORE_METADATA_REPORT.md", "npm run store:assets:doctor", "STORE_ASSETS_REPORT.md", "npm run store:packet:doctor", "STORE_PACKET_REPORT.md", "npm run store:console:fields", "STORE_CONSOLE_FIELDS", "npm run store:manual:checklist", "STORE_MANUAL_CHECKLIST", "npm run store:manual:doctor", "npm run store:handoff:report", "STORE_HANDOFF_REPORT.md", "npm run release:notes", "RELEASE_NOTES", "npm run support:playbook", "SUPPORT_PLAYBOOK", "npm run known:issues", "KNOWN_ISSUES", "npm run store:screenshots:manifest", "STORE_SCREENSHOT_MANIFEST", "npm run store:screenshots:doctor", "STORE_SCREENSHOTS_REPORT.md", "npm run health:readiness", "HEALTH_READINESS_REPORT.md", "reports/health-readiness.json", "npm run exposure:doctor", "reports/exposure-policy.json", "npm run device:qa:manifest", "DEVICE_QA_MANIFEST", "npm run device:qa:report", "DEVICE_QA_REPORT.md", "npm run store:submission:report", "STORE_SUBMISSION_REPORT.md", "npm run public:url:doctor", "npm run harness", "npm run release:doctor", "halindosa-verification-reports"];
  const missingRunbookSnippets = requiredRunbookSnippets.filter((snippet) => !runbook.includes(snippet));

  if (missingWorkflowSnippets.length || missingRunbookSnippets.length) {
    fail(
      "github ci workflow",
      `CI should run commercial audit, env regression, public URL doctor, harness, release doctor, and upload verification reports on main/codex branches. Missing workflow: ${missingWorkflowSnippets.join(", ") || "none"}; runbook: ${missingRunbookSnippets.join(", ") || "none"}`
    );
  } else {
    pass("github ci workflow", "GitHub Actions runs commercial audit, env regression, public URL doctor, harness, release doctor, and uploads verification reports on main and codex branches.");
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

  if (!currentCommit || !evidenceCommit) {
    fail("release evidence freshness", "Release evidence should include the current short git commit.");
  } else if (status) {
    pass("release evidence freshness", `Working tree has pending changes; clean release candidates must refresh evidence after the final commit. Current document points at ${evidenceCommit}.`);
  } else if (/refresh .*release evidence/i.test(currentSubject) && evidenceCommit === parentCommit) {
    pass("release evidence freshness", `Release evidence snapshot was refreshed for parent release commit ${parentCommit}.`);
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
  const isRefreshCommit = /refresh .*release evidence/i.test(currentSubject);

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
  const smoke = await text("scripts/smoke.mjs");

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
    !smoke.includes("Mypage missing recent official benefit panel")
  ) {
    fail("member profile settings", "Mypage should let users continue official event/coupon benefits with local fallback.");
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
  const smoke = await text("scripts/smoke.mjs");
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

  const requiredLinkFields = ["linkVerified", "finalUrl", "checkedAt", "purchaseConfidence", "purchaseLinkVerified", "finalPurchaseUrl"];
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
      "네이버페이 첫 결제",
      "토스 출석체크",
      "T멤버십",
      "배달앱 첫 주문",
      "무료 샘플 체험단",
      "무료 초대권",
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
  const homePage = await text("app/page.tsx");
  const smoke = await text("scripts/smoke.mjs");
  const verifyLinks = await text("scripts/verify-product-links.mjs");
  const catalogDoctor = await text("scripts/catalog-quality-doctor.mjs");
  const searchQualityDoctor = await text("scripts/search-quality-doctor.mjs");
  const purchaseNavigationDoctor = await text("scripts/purchase-navigation-doctor.mjs");
  const detailNavigationDoctor = await text("scripts/detail-navigation-doctor.mjs");
  const homeUrlStateDoctor = await text("scripts/home-url-state-doctor.mjs");
  const packageJson = await text("package.json");
  const featured = await text("components/FeaturedDealSections.tsx");
  const liveFeed = await text("components/LiveDealFeed.tsx");
  const quickDealCard = await text("components/QuickDealCard.tsx");

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
    !packageJson.includes("npm run catalog:doctor && npm run search:doctor")
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
    !packageJson.includes("npm run purchase:navigation:doctor && npm run detail:navigation:doctor") ||
    featured.includes('href="#all-deals"') ||
    liveFeed.includes('href="#all-deals"') ||
    homePage.includes('getElementById("all-deals")') ||
    homePage.includes('href="#all-deals"') ||
    !homePage.includes("빠른 상품 검색") ||
    !homePage.includes("오늘 바로 볼 특가") ||
    !homePage.includes("instantDealRail") ||
    !homePage.includes("QuickDealCard") ||
    !quickDealCard.includes("구매하기") ||
    !quickDealCard.includes('target="_blank"') ||
    !homePage.includes("상품 이동은 모두 새 탭") ||
    !homePage.includes("카테고리 바로가기") ||
    !homePage.includes("quickCategoryShortcuts")
  ) {
    fail("purchase link new-tab guard", "Verified product link script, catalog quality doctor, detail new-tab doctor, URL state doctor, top quick search, and scroll-free purchase discovery links should be present.");
  } else {
    pass("purchase link new-tab guard", "Verified product link, catalog quality, purchase navigation, detail new-tab, and URL state scripts are present; top search is visible and product discovery CTAs avoid hash-scroll links.");
  }
}

async function checkUiAccessibility() {
  const dealCard = await text("components/DealCard.tsx");
  const quickDealCard = await text("components/QuickDealCard.tsx");
  const dealDetailPage = await text("app/deals/[id]/page.tsx");
  const dealTrustBadge = await text("components/DealTrustBadge.tsx");
  const purchaseConfirmSheet = await text("components/PurchaseConfirmSheet.tsx");
  const purchaseLinkOverview = await text("components/PurchaseLinkOverview.tsx");
  const purchaseReadinessSummary = await text("components/PurchaseReadinessSummary.tsx");
  const purchaseSafetyChecklist = await text("components/PurchaseSafetyChecklist.tsx");
  const benefitConditionChecklist = await text("components/BenefitConditionChecklist.tsx");
  const priceAlertPanel = await text("components/PriceAlertPanel.tsx");
  const adminReportQueue = await text("components/AdminReportQueue.tsx");
  const reportsPage = await text("app/reports/page.tsx");
  const reportForm = await text("components/ReportForm.tsx");
  const reportsApi = await text("app/api/reports/route.ts");
  const adminReportsRoute = await text("app/api/admin/reports/route.ts");
  const reportsLib = await text("lib/reports.ts");
  const reportSla = await text("lib/reportSla.ts");
  const bottomNav = await text("components/BottomNav.tsx");
  const bottomNavigation = await text("components/BottomNavigation.tsx");
  const commercialFooter = await text("components/CommercialFooter.tsx");
  const categoryTabs = await text("components/CategoryTabs.tsx");
  const searchBar = await text("components/SearchBar.tsx");
  const searchDiscoveryPanel = await text("components/SearchDiscoveryPanel.tsx");
  const sortSelect = await text("components/SortSelect.tsx");
  const dealDetailActions = await text("components/DealDetailActions.tsx");
  const localDataControls = await text("components/LocalDataControls.tsx");
  const appInstallGuide = await text("components/AppInstallGuide.tsx");
  const shareUrl = await text("lib/shareUrl.ts");
  const topNavigation = await text("components/TopNavigation.tsx");
  const liveDealFeed = await text("components/LiveDealFeed.tsx");
  const hotSignalSection = await text("components/HotSignalSection.tsx");
  const trueDealSpotlight = await text("components/TrueDealSpotlight.tsx");
  const benefitDiscoverySections = await text("components/BenefitDiscoverySections.tsx");
  const benefitDecisionGuide = await text("lib/deals/benefitDecisionGuide.ts");
  const benefitCheckInCard = await text("components/BenefitCheckInCard.tsx");
  const benefitCheckIn = await text("lib/benefitCheckIn.ts");
  const priceAlertList = await text("components/PriceAlertList.tsx");
  const priceAlerts = await text("lib/priceAlerts.ts");
  const homePage = await text("app/page.tsx");
  const favoritesPage = await text("app/favorites/page.tsx");
  const notFoundPage = await text("app/not-found.tsx");
  const loadingPage = await text("app/loading.tsx");
  const errorPage = await text("app/error.tsx");
  const storePreviewPage = await text("app/store-preview/page.tsx");
  const storeScreenshotScenes = await text("data/storeScreenshotScenes.ts");
  const tailwindConfig = await text("tailwind.config.ts");
  const globalsCss = await text("app/globals.css");
  const authForm = await text("components/AuthForm.tsx");
  const commercializationPage = await text("app/commercialization/page.tsx");
  const imageQualityReport = await text("IMAGE_QUALITY_REPORT.md");
  const imageBacklogReport = await text("docs/IMAGE_BACKLOG_REPORT.md");
  const mobileUxReport = await text("MOBILE_UX_REPORT.md");
  const imageTest = await text("scripts/test-images.mjs");
  const imageOperationsDoctor = await text("scripts/image-operations-doctor.mjs");
  const harnessReport = await text("HARNESS_REPORT.md");
  const harnessScript = await text("scripts/harness.mjs");
  const smoke = await text("scripts/smoke.mjs");
  const packageJson = await text("package.json");
  const adminPage = await text("app/admin/page.tsx");
  const runbook = await text("docs/RUNBOOK.md");
  const roadmap = await text("docs/roadmap.md");
  const commerceBadge = await text("components/ui/CommerceBadge.tsx");
  const commerceButton = await text("components/ui/CommerceButton.tsx");
  const commerceCard = await text("components/ui/CommerceCard.tsx");
  const commerceSectionHeader = await text("components/ui/CommerceSectionHeader.tsx");
  const realtimeNewsSection = await text("components/RealtimeNewsDealsSection.tsx");

  if (
    !tailwindConfig.includes('red: "#ff2b2b"') ||
    !tailwindConfig.includes('coral: "#ff6a4a"') ||
    !tailwindConfig.includes('gold: "#f7c948"') ||
    !tailwindConfig.includes('navy: "#121b35"') ||
    (!tailwindConfig.includes("shadow:") && !tailwindConfig.includes("brand:")) ||
    !globalsCss.includes("--brand-red: #ff2b2b") ||
    !globalsCss.includes("--brand-coral: #ff6a4a") ||
    !globalsCss.includes("--brand-gold: #f7c948") ||
    !globalsCss.includes("--brand-navy: #121b35") ||
    !globalsCss.includes(".premium-gradient") ||
    !homePage.includes("shadow-brand") ||
    !commercializationPage.includes("bg-dossa-red") ||
    !authForm.includes("bg-dossa-red") ||
    !commerceBadge.includes("CommerceBadge") ||
    !commerceButton.includes("commerceButtonClassName") ||
    !commerceCard.includes("CommerceCard") ||
    !commerceSectionHeader.includes("CommerceSectionHeader") ||
    !realtimeNewsSection.includes("CommerceSectionHeader") ||
    !realtimeNewsSection.includes("commerceButtonClassName")
  ) {
    fail("v2 brand color system", "Brand tokens should use bright red plus coral, gold, navy, and warm commerce support colors across Tailwind, globals, shared commerce UI primitives, home, auth, and launch readiness surfaces.");
  } else {
    pass("v2 brand color system", "Premium red, coral, gold, navy, and warm commerce tokens are centralized and used across shared commerce UI primitives, home, auth, and launch readiness surfaces.");
  }

  const requiredSnippets = [
    "aria-pressed={isFavorite}",
    "alt={deal.title}",
    "판매처 이동 전 확인",
    "상세 정보와 가격 신고 보기",
    "상세 보기",
    "판매처 확인",
    "구매 전 체크",
    "출처와 신고 상태",
    "sourceLabel",
    "reportLabel",
    "reportReviewItems",
    "신고 처리 기준",
    "운영 점검 큐",
    "바로 신고",
    "purchaseCheckItems"
  ];
  const missingSnippets = requiredSnippets.filter((snippet) => !dealCard.includes(snippet));

  if (missingSnippets.length) {
    fail("deal card accessibility", `Missing snippets: ${missingSnippets.join(", ")}`);
  } else {
    pass("deal card accessibility", "Deal images and icon buttons expose product-specific accessible labels.");
  }

  if (!liveDealFeed.includes('href={`/deals/${deal.id}`}') || !dealCard.includes("판매처 확인")) {
    fail("deal commerce actions", "Deal cards and live rows should expose clear detail and seller confirmation paths.");
  } else {
    pass("deal commerce actions", "Deal cards and live rows expose clear detail and seller confirmation paths.");
  }

  if (
    !adminReportQueue.includes("특가 품질 신고 큐") ||
    !adminReportQueue.includes("권장 처리") ||
    !adminReportQueue.includes("링크 오류") ||
    !adminReportQueue.includes("우선 검수") ||
    !adminReportQueue.includes("목표 처리 시간") ||
    !adminReportQueue.includes("처리 목표") ||
    !adminReportQueue.includes("SLA 초과") ||
    !adminReportQueue.includes("SLA 우선 처리 목록") ||
    !adminReportQueue.includes("operationActionLabels") ||
    !reportForm.includes("신고 처리 예상 안내") ||
    !reportForm.includes("목표 처리:") ||
    !reportsPage.includes("신고 처리 흐름") ||
    !reportsPage.includes("링크와 종료 정보는 우선 확인합니다") ||
    !reportsPage.includes("reportFlowCards") ||
    !reportsPage.includes("getReportResolutionPlan") ||
    !reportsLib.includes("getReportResolutionPlan") ||
    !reportsLib.includes("dealReports.local.json") ||
    !reportsLib.includes("writeReportsToDisk") ||
    !reportsLib.includes("getSupabaseDealReportsConfig") ||
    !reportsLib.includes("fetchSupabaseDealReports") ||
    !reportsLib.includes("saveDealReportWithPersistence") ||
    !reportsLib.includes("updateDealReportStatusWithPersistence") ||
    !reportsLib.includes("getReportStorageStatus") ||
    !reportsLib.includes("supabaseConfigured") ||
    !reportsLib.includes("deal_reports") ||
    !reportSla.includes("buildReportSlaSummary") ||
    !reportSla.includes("slaHoursByReason") ||
    !reportSla.includes("SLA 초과 신고") ||
    !reportSla.includes("priorityReports") ||
    !adminReportsRoute.includes("buildReportSlaSummary") ||
    !adminReportsRoute.includes("operationAction") ||
    !adminReportsRoute.includes("recordDealOperationActionWithPersistence") ||
    !adminReportsRoute.includes("listDealReportsLive") ||
    !adminReportsRoute.includes("getReportSummaryLive") ||
    !reportsApi.includes("saveDealReportWithPersistence") ||
    !adminPage.includes("getReportSummaryLive") ||
    !adminPage.includes("listDealReportsLive") ||
    !adminPage.includes("reportSlaSummary") ||
    !adminPage.includes("SLA 초과 신고") ||
    !adminReportQueue.includes("저장 방식") ||
    !adminReportQueue.includes("Supabase 신고 저장") ||
    !adminReportQueue.includes("operationActions") ||
    !adminReportQueue.includes("노출 숨김") ||
    !adminReportQueue.includes("노출 복구") ||
    !reportsApi.includes("plan: getReportResolutionPlan") ||
    !smoke.includes("Report API missing resolution plan metadata") ||
    !smoke.includes("Admin reports API missing persisted queue storage metadata") ||
    !smoke.includes("Admin reports API missing Supabase storage readiness flag") ||
    !smoke.includes("Admin reports API missing SLA summary") ||
    !smoke.includes("Admin dashboard missing report SLA triage queue") ||
    !smoke.includes("Report update should record a matching hide operation") ||
    !runbook.includes("Supabase `deal_reports`") ||
    !runbook.includes("storage.supabaseConfigured") ||
    !roadmap.includes("Supabase `deal_reports`") ||
    !smoke.includes("Report page missing public report workflow summary") ||
    !smoke.includes("Admin dashboard missing deal quality report queue")
  ) {
    fail("admin report priority workflow", "Admin/report surfaces should expose reason-specific expectations, persistent queue storage, product hide/restore operations, SLA, recommended actions, and smoke coverage.");
  } else {
    pass("admin report priority workflow", "Admin/report surfaces prioritize link error, sold-out, and expired reports with persistent queue storage, product hide/restore operations, SLA, and recommended actions.");
  }

  const requiredEmptyStateSnippets = [
    "조건 초기화하고 전체 특가 보기",
    "홈에서 특가 둘러보기",
    "가격과 재고는 판매처에서 변동",
    "검색 결과 없음 복구",
    "바로 다시 찾아볼 검색어",
    "먼저 볼 만한 검증 특가"
  ];
  const missingEmptyStateSnippets = requiredEmptyStateSnippets.filter((snippet) => !homePage.includes(snippet));

  if (missingEmptyStateSnippets.length) {
    fail("empty state UX", `Missing snippets: ${missingEmptyStateSnippets.join(", ")}`);
  } else if (
    !notFoundPage.includes("페이지를 찾을 수 없습니다") ||
    !notFoundPage.includes("고객센터에서 문의하기") ||
    !loadingPage.includes("할인도사 화면을 불러오는 중") ||
    !loadingPage.includes("animate-pulse") ||
    !errorPage.includes("일시적으로 화면을 불러오지 못했습니다") ||
    !errorPage.includes("다시 시도") ||
    !smoke.includes("not found page") ||
    !smoke.includes("home empty search recovery")
  ) {
    fail("empty state UX", "Global not-found, loading, and error states should be branded, actionable, and covered by smoke tests.");
  } else {
    pass("empty state UX", "Search, favorites, not-found, loading, and error states include branded next actions.");
  }

  if (
    !storePreviewPage.includes("스크린샷 촬영 보드") ||
    !storePreviewPage.includes("index: false") ||
    !storeScreenshotScenes.includes("오늘 먼저 볼 특가") ||
    !storeScreenshotScenes.includes("검색과 필터") ||
    !storeScreenshotScenes.includes("구매 전 상세 확인") ||
    !storeScreenshotScenes.includes("마감임박과 무료배송") ||
    !smoke.includes("store screenshot preview")
  ) {
    fail("store screenshot preview", "Store screenshot capture board should be noindex, cover six scenes, and be smoke-tested.");
  } else {
    pass("store screenshot preview", "Store screenshot capture board covers launch screenshots and is smoke-tested.");
  }

  if (
    !favoritesPage.includes("favoriteFilterOptions") ||
    !favoritesPage.includes("favoriteSortOptions") ||
    !favoritesPage.includes("isSavedBenefitDeal") ||
    !favoritesPage.includes("저장한 특가 빠르게 보기") ||
    !favoritesPage.includes("저장 상품 정렬") ||
    !favoritesPage.includes("무료·쿠폰 혜택") ||
    !favoritesPage.includes("무료혜택 더 저장") ||
    !favoritesPage.includes("구매 링크 확인") ||
    !favoritesPage.includes("setFavoriteFilter") ||
    !favoritesPage.includes("setFavoriteSort") ||
    !favoritesPage.includes('aria-label="찜한 특가 정렬 방식"')
  ) {
    fail("favorites filter UX", "Favorites page should let users filter and sort saved deals by verified link, urgency, shipping, discount, deadline, and price.");
  } else {
    pass("favorites filter UX", "Favorites page supports saved-deal filtering and sorting by verified link, urgency, shipping, discount, deadline, and price.");
  }

  if (
    !appInstallGuide.includes("beforeinstallprompt") ||
    !appInstallGuide.includes("buildPublicAppShareUrl") ||
    !appInstallGuide.includes("홈 화면에 할인도사 고정") ||
    !appInstallGuide.includes("앱으로 설치하기") ||
    !appInstallGuide.includes("공유 링크 복사") ||
    !appInstallGuide.includes('role="status"') ||
    !appInstallGuide.includes('aria-live="polite"')
  ) {
    fail("app install guide", "Mypage should provide install, home-screen, share, and accessible status guidance.");
  } else if (!(await text("app/mypage/page.tsx")).includes("<AppInstallGuide />") || !smoke.includes("Mypage missing app install guide")) {
    fail("app install guide", "Mypage app install guide should be wired into the page and covered by smoke tests.");
  } else {
    pass("app install guide", "Mypage offers install/share guidance with public share URLs and accessible feedback.");
  }

  if (dealTrustBadge.includes("/99")) {
    fail("public trust badge copy", "DealTrustBadge should not expose internal numeric confidence scores.");
  } else if (!dealTrustBadge.includes("getPurchaseTrustChecklist") || !dealTrustBadge.includes("구매 전 신뢰 체크")) {
    fail("public trust badge copy", "DealTrustBadge should show a customer-facing purchase trust checklist without internal scores.");
  } else {
    pass("public trust badge copy", "Public trust badges use plain labels and purchase trust checklist instead of internal scores.");
  }

  if (purchaseConfirmSheet.includes("신뢰도 {deal.purchaseConfidence}") || purchaseConfirmSheet.includes("purchaseConfidence}")) {
    fail("purchase confirmation score copy", "Purchase confirmation should not expose internal numeric confidence scores.");
  } else if (!purchaseConfirmSheet.includes("이동 예정 판매처") || !purchaseConfirmSheet.includes("resolveDealDestinationUrl") || !purchaseConfirmSheet.includes("판매처 도메인이 예상과 다르면")) {
    fail("purchase confirmation destination disclosure", "Purchase confirmation should show the destination host and warn users to stop if the seller domain looks wrong.");
  } else {
    pass("purchase confirmation score copy", "Purchase confirmation uses plain link status labels and shows the destination host before external navigation.");
  }

  if (
    !purchaseSafetyChecklist.includes("구매 전 10초 체크") ||
    !purchaseSafetyChecklist.includes("최종 결제 금액") ||
    !purchaseSafetyChecklist.includes("정보 신고")
  ) {
    fail("purchase safety checklist", "Deal detail and guide should provide a reusable purchase safety checklist with report CTA.");
  } else {
    pass("purchase safety checklist", "Reusable purchase safety checklist guides users through final price, shipping, return, and report checks.");
  }

  if (
    !dealCard.includes("benefitConditionItems") ||
    !dealCard.includes("혜택 조건") ||
    !dealCard.includes("회원가입") ||
    !dealCard.includes("선착순") ||
    !dealCard.includes("배송비") ||
    !dealCard.includes("쿠폰 조건") ||
    !smoke.includes("Home page deal cards missing benefit condition summary")
  ) {
    fail("deal card benefit condition summary", "Deal cards should expose signup, first-come, shipping, and coupon conditions before users open a detail page.");
  } else {
    pass("deal card benefit condition summary", "Deal cards expose signup, first-come, shipping, and coupon conditions before users open a detail page.");
  }

  if (
    !dealDetailPage.includes("<BenefitConditionChecklist") ||
    !benefitConditionChecklist.includes('aria-label="혜택 조건 확인"') ||
    !benefitConditionChecklist.includes("선착순 여부") ||
    !benefitConditionChecklist.includes("회원가입 필요 여부") ||
    !benefitConditionChecklist.includes("배송비 여부") ||
    !benefitConditionChecklist.includes("쿠폰 조건") ||
    !benefitConditionChecklist.includes("claimFlowSteps") ||
    !benefitConditionChecklist.includes("혜택 받기 전 3단계") ||
    !benefitConditionChecklist.includes("조건 확인부터 신고까지 한 흐름으로 봅니다") ||
    !benefitConditionChecklist.includes("판매처에서 최종 확인") ||
    !benefitConditionChecklist.includes("혜택 신고") ||
    !smoke.includes("Detail page missing benefit condition checklist") ||
    !smoke.includes("Detail page missing benefit claim flow steps")
  ) {
    fail("benefit condition checklist", "Deal detail should explain freebie, coupon, shipping, signup, first-come, and report conditions before users claim a benefit.");
  } else {
    pass("benefit condition checklist", "Deal detail explains benefit type, signup, shipping, coupon, first-come, expiry, and report conditions before users claim a benefit.");
  }

  if (
    !dealDetailPage.includes("<PurchaseReadinessSummary") ||
    !purchaseReadinessSummary.includes('aria-label="구매 정보 확인 요약"') ||
    !purchaseReadinessSummary.includes("예정 도메인") ||
    !purchaseReadinessSummary.includes("getLinkStatusLabel") ||
    !purchaseReadinessSummary.includes("판매처 도메인이 예상과 다르면") ||
    !dealDetailPage.includes("상품 품질 안내") ||
    !dealDetailPage.includes("신고 누적") ||
    !smoke.includes("Detail page missing quality notice summary") ||
    !smoke.includes("Detail page missing purchase trust checklist")
  ) {
    fail("purchase readiness summary", "Deal detail should summarize price timing, link status, quality notice, report count, trust checklist, and destination domain before purchase.");
  } else {
    pass("purchase readiness summary", "Deal detail summarizes price timing, link status, quality notice, report count, trust checklist, and destination domain before purchase.");
  }

  if (
    !dealDetailPage.includes("관련 특가도 구매 전 체크") ||
    !dealDetailPage.includes("같은 카테고리 보기") ||
    !dealDetailPage.includes("관련 특가 이미지") ||
    !dealDetailPage.includes("getTimeLeft(related.expiresAt)") ||
    !smoke.includes("commerce-ready related deal section")
  ) {
    fail("related deal discovery UX", "Deal detail should present related deals with images, timing, category navigation, and purchase-minded copy.");
  } else {
    pass("related deal discovery UX", "Deal detail presents related deals with images, timing, category navigation, and purchase-minded copy.");
  }

  if (
    !bottomNav.includes("getNavAriaLabel") ||
    !bottomNavigation.includes("getNavAriaLabel") ||
    !bottomNav.includes('aria-label="주요 메뉴"') ||
    !bottomNavigation.includes('aria-label="주요 메뉴"') ||
    !bottomNavigation.includes("grid-cols-4") ||
    !bottomNavigation.includes("/popular") ||
    !bottomNav.includes("aria-current") ||
    !bottomNavigation.includes("aria-current")
  ) {
    fail("bottom navigation accessibility", "Bottom navigation should expose four named menus, active state, and explicit button/link labels.");
  } else {
    pass("bottom navigation accessibility", "Route navigation and in-page navigation expose the simplified primary menus, active state, and explicit labels.");
  }

  if (!topNavigation.includes('aria-label="주요 메뉴"') || !topNavigation.includes('aria-label="상품명, 쇼핑몰, 카테고리 검색"') || !topNavigation.includes('aria-label="특가 정보 새로고침"')) {
    fail("top navigation accessibility", "Desktop top navigation should name the menu, search box, and refresh button.");
  } else {
    pass("top navigation accessibility", "Desktop top navigation names the menu, search box, and refresh button.");
  }

  if (!liveDealFeed.includes('alt={`${deal.title} 상품 이미지`}') || !hotSignalSection.includes('alt={`${signal.title} 할인 정보 이미지`}') || !hotSignalSection.includes("event.preventDefault()")) {
    fail("live card media accessibility", "Live deal and signal cards should expose meaningful image alt text and keyboard activation.");
  } else {
    pass("live card media accessibility", "Live deal and signal cards expose meaningful image alt text and keyboard activation.");
  }

  const imageSurfaces = [
    ["DealCard", dealCard],
    ["LiveDealFeed", liveDealFeed],
    ["HotSignalSection", hotSignalSection],
    ["DealDetailPage", dealDetailPage]
  ];
  const imagePerformanceMissing = imageSurfaces
    .filter(([, body]) => !body.includes("getDealImageSrc(") || !body.includes('decoding="async"') || !body.includes('referrerPolicy="no-referrer"'))
    .map(([name]) => name);

  if (imagePerformanceMissing.length) {
    fail("deal image loading hints", `Missing image proxy/loading hints: ${imagePerformanceMissing.join(", ")}`);
  } else if (
    !quickDealCard.includes("구매 전 한눈에") ||
    !quickDealCard.includes("checkedAt") ||
    !quickDealCard.includes("timeLeft") ||
    !quickDealCard.includes("링크 확인") ||
    !quickDealCard.includes("가격 요약") ||
    !quickDealCard.includes("압축 가격 카드") ||
    !quickDealCard.includes("aspect-[4/3]") ||
    !quickDealCard.includes("% 할인") ||
    !quickDealCard.includes("아낌") ||
    !smoke.includes("Home page missing quick deal card purchase snapshot") ||
    !smoke.includes("Home page missing quick deal card price summary")
  ) {
    fail("deal image loading hints", "Quick deal cards should expose compact purchase and price summaries with link status, checked time, deadline, discount rate, and savings.");
  } else if (!dealCard.includes('loading="lazy"') || !liveDealFeed.includes('loading="lazy"') || !hotSignalSection.includes('loading="lazy"') || !dealDetailPage.includes('loading="eager"')) {
    fail("deal image loading hints", "List images should lazy-load and detail hero image should eagerly load.");
  } else {
    pass("deal image loading hints", "Deal list, live feed, signal, and detail images use proxy helpers and browser loading hints, while quick cards expose compact purchase snapshots.");
  }

  if (
    !packageJson.includes('"test:images"') ||
    !packageJson.includes('"image:backlog:report"') ||
    !packageJson.includes('"image:operations:doctor"') ||
    !packageJson.includes("npm run test:images") ||
    !packageJson.includes("npm run image:backlog:report") ||
    !packageJson.includes("npm run image:operations:doctor") ||
    !imageTest.includes("minimumExplicitImageRate = 25") ||
    !imageTest.includes("fallbackDealBacklog") ||
    !imageOperationsDoctor.includes("minimum explicit image gate") ||
    !imageOperationsDoctor.includes("image backlog report") ||
    !imageOperationsDoctor.includes("full image backlog export") ||
    !imageOperationsDoctor.includes("image sourcing execution plan") ||
    !imageQualityReport.includes("| 명시 이미지 최소 기준 | 25% |") ||
    !imageQualityReport.includes("## Image Backlog") ||
    !imageQualityReport.includes("이미지 후보 검색") ||
    !imageBacklogReport.includes("Image Backlog Report") ||
    !imageBacklogReport.includes("Backlog By Category") ||
    !imageBacklogReport.includes("Root CSV") ||
    !imageBacklogReport.includes("Next batch CSV") ||
    !imageBacklogReport.includes("Mall request CSV") ||
    !imageBacklogReport.includes("이번 주 이미지 보강 배치") ||
    !imageBacklogReport.includes("판매처별 이미지 요청서") ||
    !harnessReport.includes("Image quality passed: 39/140 deals have explicit images.")
  ) {
    fail("deal image quality coverage gate", "Release QA should enforce the 25% explicit product image floor, record current coverage evidence, and keep an actionable fallback image backlog.");
  } else {
    pass("deal image quality coverage gate", "QA, image operations doctor, and release evidence enforce the 25% explicit product image floor with 39/140 current coverage, an actionable fallback image backlog, and a 60% launch sourcing plan.");
  }

  if (
    !harnessScript.includes('["release:doctor", ["run", "release:doctor"]]') ||
    !harnessScript.includes('["test:mobile-ux", ["run", "test:mobile-ux"]]') ||
    !harnessScript.includes('writeFileSync(join(root, "docs", "HARNESS_REPORT.md")') ||
    !harnessScript.includes('writeFileSync(join(root, "HARNESS_REPORT.md")') ||
    !harnessReport.includes("Image quality passed: 39/140 deals have explicit images.")
  ) {
    fail("harness release gate coverage", "Harness should execute mobile UX, release:doctor, write root/docs reports, and preserve image-quality evidence.");
  } else {
    pass("harness release gate coverage", "Harness executes mobile UX, release:doctor, writes root/docs reports, and preserves image-quality evidence.");
  }

  const mobileUxReportRequired = [
    "Generated: npm run test:mobile-ux",
    "Status: PASS",
    "mobile shell width and safe area",
    "bottom nav compactness",
    "compact search",
    "single home search entry",
    "home first screen budget",
    "category rail compactness",
    "filter rail consolidation",
    "quick card scanability",
    "live row compact actions",
    "toast does not cover bottom nav",
    "상단 \"오늘 바로 볼 특가\" 레일",
    "snap-x/snap-start",
    "오른쪽 fade/넘기기 신호"
  ];
  const mobileUxMissing = mobileUxReportRequired.filter((phrase) => !mobileUxReport.includes(phrase));

  if (mobileUxMissing.length || mobileUxReport.includes("Generated: 2026-")) {
    fail("mobile ux report coverage", `Mobile UX report should be stable and include all compact mobile gates. Missing: ${mobileUxMissing.join(", ") || "none"}`);
  } else {
    pass("mobile ux report coverage", "Mobile UX report records the stable 10-gate compact first-screen regression suite.");
  }

  if (
    !searchBar.includes('aria-label="상품명, 쇼핑몰, 카테고리 검색"') ||
    !searchBar.includes('type="search"') ||
    !searchBar.includes('enterKeyHint="search"') ||
    !searchBar.includes('role="status"') ||
    !searchBar.includes('aria-live="polite"') ||
    !searchBar.includes("검색어 빠른 초기화 지원") ||
    !searchBar.includes('aria-label="추천 검색어"') ||
    !searchBar.includes("onSelectSuggestion") ||
    !searchDiscoveryPanel.includes('aria-label="검색 도우미"') ||
    !searchDiscoveryPanel.includes("인기 검색어") ||
    !searchDiscoveryPanel.includes("최근 검색어") ||
    !homePage.includes("recentSearchStorageKey") ||
    !homePage.includes("highIntentSearchKeywords") ||
    !homePage.includes("quickSearchSuggestions") ||
    !homePage.includes("searchResultSnapshot") ||
    !homePage.includes('aria-label="검색 결과 핵심 요약"') ||
    !smoke.includes("Home page missing high-intent lifestyle search suggestions") ||
    !homePage.includes("selectSearchKeyword") ||
    !sortSelect.includes('aria-label="특가 정렬 방식"') ||
    !categoryTabs.includes("aria-pressed={active}") ||
    !categoryTabs.includes("카테고리")
  ) {
    fail("search filter accessibility", "Search, sort, and category controls should expose accessible names and selected state.");
  } else if (
    !homePage.includes('aria-label="쇼핑몰 필터"') ||
    !homePage.includes('aria-label="가격대 필터"') ||
    !homePage.includes("전체 가격대") ||
    !homePage.includes("혜택 유형 필터") ||
    !homePage.includes("무료배송만 보기") ||
    !homePage.includes("구매링크 확인된 특가만 보기") ||
    !homePage.includes("검색과 필터 조건 초기화")
  ) {
    fail("search filter accessibility", "Home filter controls should expose accessible names and toggle state labels.");
  } else if (
    !homePage.includes("filterOutcomeCards") ||
    !homePage.includes("resultInsightCards") ||
    !homePage.includes('aria-label="결과 바로 판단 카드"') ||
    !homePage.includes("판매처 집중") ||
    !homePage.includes("카테고리 집중") ||
    !homePage.includes("안전 이동") ||
    !homePage.includes("searchPurposePresets") ||
    !homePage.includes('aria-label="혜택 목적 빠른 필터"') ||
    !homePage.includes("무료, 쿠폰, 앱테크, 문화 초대권을 한 번에 좁힙니다") ||
    !homePage.includes("검증 링크만") ||
    !homePage.includes('aria-label="조건별 결과 요약"') ||
    !homePage.includes("현재 필터가 보여주는 혜택을 먼저 해석합니다") ||
    !homePage.includes("현재 조건으로 볼 혜택") ||
    !homePage.includes("마감 전 확인") ||
    !homePage.includes("배송비 부담 낮음") ||
    !homePage.includes("filterActionQueue") ||
    !homePage.includes('aria-label="현재 결과 바로 실행 큐"') ||
    !homePage.includes("지금 조건에서 먼저 눌러볼 혜택을 골랐습니다") ||
    !homePage.includes("dealScanBarItems") ||
    !homePage.includes('aria-label="상품 목록 빠른 스캔"') ||
    !homePage.includes("낮은 가격 후보") ||
    !homePage.includes("할인율 최고") ||
    !homePage.includes("listComparisonCards") ||
    !homePage.includes('aria-label="현재 목록 가격 비교"') ||
    !homePage.includes('aria-label="심화 혜택 탐색 접기"') ||
    !homePage.includes("상품 목록을 먼저 보고, 필요할 때 혜택 분석을 펼치세요") ||
    !homePage.includes('aria-label="상세 필터와 결과 분석 접기"') ||
    !homePage.includes("상품 목록을 먼저 보고, 더 좁힐 때 펼치세요") ||
    !homePage.includes('aria-label="상품 목록 적용 조건 빠른 해제"') ||
    !homePage.includes("조건을 눌러 바로 해제하고 같은 목록에서 다시 비교합니다.") ||
    !homePage.includes("가격으로 먼저 고를 4가지 후보") ||
    !homePage.includes("절약액 큼") ||
    !homePage.includes("마감 먼저") ||
    !packageJson.includes("home:list-scan:doctor") ||
    !smoke.includes("Home page missing purpose quick benefit filters") ||
    !smoke.includes("Home page missing filter outcome summary") ||
    !smoke.includes("Home page missing filter action queue") ||
    !smoke.includes("Home page missing product list scan shortcuts") ||
    !smoke.includes("Home page missing product list price comparison shortcuts")
  ) {
    fail("search filter accessibility", "Home filters should summarize result decision cards, purpose presets, result quality, purchase link readiness, deadline, shipping outcomes, next action queue, list scan shortcuts, and price comparison shortcuts.");
  } else {
    pass("search filter accessibility", "Search, sort, category, mall, price, benefit type, result decision cards, purpose quick filters, outcome summary, next action queue, list scan, and price comparison shortcut controls expose accessible names and state.");
  }

    if (
      !homePage.includes("<BenefitDiscoverySections") ||
      !homePage.includes("<DailyBenefitChecklist") ||
      !homePage.includes("<BenefitCheckInCard") ||
        !homePage.includes("<BenefitPlaybook") ||
        !homePage.includes("<TrueDealSpotlight") ||
        !benefitCheckInCard.includes("오늘 혜택 출석 체크") ||
        !benefitCheckInCard.includes("비회원도 기기에만 출석 기록을 저장합니다") ||
        !benefitCheckInCard.includes("오늘 챙긴 혜택 기록") ||
        !benefitCheckInCard.includes("completedMissions") ||
        !benefitCheckInCard.includes("toggleMission") ||
        !benefitCheckInCard.includes("무료 혜택 전용 탭에서 이번 주 루틴 보기") ||
        !benefitCheckIn.includes("halindosa:benefit-check-in") ||
        !homePage.includes("ClaimedBenefitHomeSummary") ||
        !homePage.includes("readClaimedBenefits") ||
        !homePage.includes("readBenefitReturnReservations") ||
        !homePage.includes("readBenefitVisitStreak") ||
        !homePage.includes("missionSteps") ||
        !homePage.includes("오늘 챙긴 혜택 요약") ||
        !homePage.includes("홈 무료 혜택 방문 요약") ||
        !homePage.includes("무료 혜택 방문 루틴 계속하기") ||
        !homePage.includes("홈 오늘 혜택 미션") ||
        !homePage.includes("무료 혜택 1개 챙기기") ||
        !homePage.includes("쿠폰 1개 저장하기") ||
        !homePage.includes("내일 볼 루틴 예약") ||
        !homePage.includes("아직 챙길 만한 무료 혜택") ||
        !homePage.includes("홈 재방문 예약 요약") ||
        !homePage.includes("재방문 루틴 더 저장") ||
        !benefitDiscoverySections.includes("무료혜택 TOP 5") ||
        !benefitDiscoverySections.includes("쿠폰·앱테크 TOP 5") ||
        !benefitDiscoverySections.includes("appTechHomeDeals") ||
        !benefitDiscoverySections.includes("오늘 눌러둘 적립 혜택") ||
        !benefitDiscoverySections.includes("포인트 루틴 보기") ||
        !benefitDiscoverySections.includes("앱테크 적립 혜택 확인") ||
        !benefitDiscoverySections.includes("오늘 혜택 1분 시작") ||
        !benefitDiscoverySections.includes("앱을 열자마자 무료, 쿠폰, 생활비, 마감 순서로 바로 갑니다") ||
        !smoke.includes("Home page missing one-minute benefit start rail") ||
        !benefitDiscoverySections.includes("quickBenefitEntries") ||
        !benefitDiscoverySections.includes("10초 혜택 바로가기") ||
        !benefitDiscoverySections.includes("오늘 받을 혜택을 바로 고르세요") ||
        !benefitDiscoverySections.includes("getDailyBenefitRankings") ||
        !benefitDiscoverySections.includes("getBenefitSummaryStats") ||
        !benefitDiscoverySections.includes("오늘 절약 요약") ||
        !benefitDiscoverySections.includes("오늘 절약 후보") ||
        !benefitDiscoverySections.includes("getHomeBenefitRiskReview") ||
        !benefitDiscoverySections.includes("홈 혜택 헛걸음 방지") ||
        !benefitDiscoverySections.includes("누르기 전 놓치기 쉬운 조건을 먼저 봅니다") ||
        !benefitDiscoverySections.includes("숨은 비용 먼저 보기") ||
        !smoke.includes("Home page missing benefit risk review rail") ||
        !benefitDiscoverySections.includes("getTodaySavingsReceipt") ||
        !benefitDiscoverySections.includes("오늘 절약 영수증") ||
        !benefitDiscoverySections.includes("쿠폰 절약") ||
        !benefitDiscoverySections.includes("배송비 절약") ||
        !benefitDiscoverySections.includes("getDailyClaimPlan") ||
        !benefitDiscoverySections.includes("3분 혜택 루틴") ||
        !benefitDiscoverySections.includes("오늘 받을 수 있는 혜택 루틴") ||
        !benefitDiscoverySections.includes("getTodayBenefitMissions") ||
        !benefitDiscoverySections.includes("오늘 혜택 미션 보드") ||
        !benefitDiscoverySections.includes("처음 들어왔다면 이 3가지만 먼저 보세요") ||
        !smoke.includes("Home page missing linked daily benefit mission progress") ||
        !benefitDiscoverySections.includes("getDailyActionQueue") ||
        !benefitDiscoverySections.includes("오늘 바로 실행할 혜택 액션 큐") ||
        !benefitDiscoverySections.includes("무료 수령, 쿠폰 적용, 생활 혜택, 마감 확인 순서로 봅니다") ||
        !benefitDiscoverySections.includes("무료 혜택 받기") ||
        !benefitDiscoverySections.includes("쿠폰 조건 보기") ||
        !benefitDiscoverySections.includes("생활 혜택 보기") ||
        !benefitDiscoverySections.includes("마감 혜택 확인") ||
        !homePage.includes("todayBenefitQueue") ||
        !homePage.includes('aria-label="첫 화면 혜택 우선순위 큐"') ||
        !homePage.includes("오늘 받을 혜택 큐") ||
        !homePage.includes("스크롤 전에 먼저 고를 5가지") ||
        !homePage.includes("무료, 쿠폰, 무배, 마감, 실제 구매처 이동을 한 화면에서 빠르게 좁힙니다") ||
        !homePage.includes("무료 혜택 먼저") ||
        !homePage.includes("쿠폰·포인트 적용") ||
        !homePage.includes("배송비 줄이기") ||
        !homePage.includes("구매처 바로 이동") ||
        !homePage.includes("firstVisitDecisionGuide") ||
        !homePage.includes("buildBenefitDecisionGuide") ||
        !homePage.includes('aria-label="첫 방문 혜택 판단 가이드"') ||
        !homePage.includes("오늘 먼저 챙길 혜택 판단표") ||
        !homePage.includes("무료로 받을 것, 결제 전 적용할 것, 오늘 끝날 것, 바로 이동할 상품") ||
        !benefitDecisionGuide.includes("돈 안 쓰고 받을 것") ||
        !benefitDecisionGuide.includes("구매처가 확인된 것") ||
        !benefitDiscoverySections.includes("sortByFavoriteSignal") ||
        !benefitDiscoverySections.includes("회원들이 많이 찜한 혜택") ||
        !benefitDiscoverySections.includes("내 찜 {favoriteCount}개") ||
      !trueDealSpotlight.includes("오늘의 진짜 특가") ||
      !trueDealSpotlight.includes("scoreDeal") ||
      !trueDealSpotlight.includes("절약 예상") ||
      !homePage.includes("dealMatchesInterestCategory") ||
      !homePage.includes("관심 카테고리 추천") ||
      !homePage.includes("비회원도 모두 보고") ||
      !homePage.includes("quickInterestOptions") ||
      !homePage.includes("toggleQuickInterest") ||
      !homePage.includes("홈 빠른 관심 설정") ||
      !homePage.includes("비회원 기기 저장") ||
      !homePage.includes("savePreferencesSynced") ||
      !homePage.includes("fetchRemotePreferences") ||
      !homePage.includes("openBenefitFilter") ||
      !homePage.includes("openBenefitPreset") ||
      !homePage.includes("onShowVerified") ||
      !homePage.includes("dealType") ||
      !smoke.includes("Home page missing V2 benefit-first discovery section") ||
        !smoke.includes("Home page missing daily benefit checklist") ||
        !smoke.includes("Home page missing benefit check-in card") ||
        !smoke.includes("Home page missing daily benefit completion record") ||
        !smoke.includes("Home page missing claimed benefit summary") ||
        !smoke.includes("Home page missing free benefit visit streak summary") ||
        !smoke.includes("Home page missing return reservation summary") ||
        !smoke.includes("Home page missing free coupon top ranking section") ||
        !smoke.includes("Home page missing apptech reward routine rail") ||
        !smoke.includes("Home page missing fast benefit shortcut rail") ||
        !smoke.includes("Home page missing daily savings summary") ||
        !smoke.includes("Home page missing daily savings receipt") ||
        !smoke.includes("Home page missing daily claim routine") ||
        !smoke.includes("Home page missing first-visit benefit mission board") ||
        !smoke.includes("Home page missing daily benefit action queue") ||
        !smoke.includes("Home page missing first-screen benefit priority queue") ||
        !smoke.includes("Home page missing compressed benefit queue guidance") ||
        !smoke.includes("Home page missing compressed benefit queue actions") ||
        !smoke.includes("Home page missing first-visit benefit decision guide") ||
        !smoke.includes("Home page missing first-visit decision guide cards") ||
        !smoke.includes("Home page missing member favorite benefit section") ||
        !smoke.includes("Home page missing interest category personalization") ||
        !smoke.includes("Home page missing quick interest setup") ||
        !smoke.includes("Home page missing true deal spotlight") ||
      !smoke.includes("Home page missing coupon event apptech playbook") ||
      !smoke.includes("benefit type filter api")
    ) {
      fail("v2 benefit discovery UX", "Home should expose V2 free benefit/coupon discovery, interest personalization, and smoke-test the benefit type filter.");
    } else {
      pass("v2 benefit discovery UX", "Home exposes free benefit, coupon, apptech, daily checklist, true deal spotlight, interest personalization, mart, and rising benefit discovery with a verified benefit filter.");
    }

  if (
    !homePage.includes("clearRecentDealsSynced") ||
    !homePage.includes("최근 기록 관리") ||
    !homePage.includes("기록 비우기") ||
    !smoke.includes("recent deal management actions")
  ) {
    fail("recent deal management UX", "Home should let returning users continue, clear, and manage recently viewed deals.");
  } else {
    pass("recent deal management UX", "Home lets returning users continue, clear, and manage recently viewed deals.");
  }

  if (
    !homePage.includes("mallHighlights") ||
    !homePage.includes("openMall") ||
    !homePage.includes("쇼핑몰별 특가 바로가기") ||
    !homePage.includes("자주 쓰는 판매처만 골라보기") ||
    !homePage.includes("해당 쇼핑몰 특가만 바로 필터링")
  ) {
    fail("mall discovery UX", "Home should expose a seller-first discovery surface linked to mall filters.");
  } else {
    pass("mall discovery UX", "Home exposes seller-first discovery cards tied to mall filters.");
  }

  if (
    !homePage.includes("<PurchaseLinkOverview") ||
    !homePage.includes("openReviewNeededDeals") ||
    !purchaseLinkOverview.includes('aria-label="구매 이동 안내"') ||
    !purchaseLinkOverview.includes("구매처 바로 확인 상품을 먼저 보여드려요") ||
    !purchaseLinkOverview.includes("판매처 확인 단계") ||
    !smoke.includes("Home page missing purchase link overview")
  ) {
    fail("purchase link overview UX", "Home should explain verified purchase links and review-needed links in customer-facing copy.");
  } else {
    pass("purchase link overview UX", "Home explains verified purchase and seller-confirmation link paths without exposing internal coverage ratios.");
  }

  if (
    !dealDetailActions.includes("aria-pressed={isFavorite}") ||
    !dealDetailActions.includes('role="status"') ||
    !dealDetailActions.includes('aria-live="polite"') ||
    !dealDetailActions.includes("특가 링크를 복사했습니다.") ||
    !dealDetailActions.includes("공유 기능을 사용할 수 없습니다.")
  ) {
    fail("detail action feedback", "Deal detail favorite and share actions should expose state, accessible names, and user feedback.");
  } else {
    pass("detail action feedback", "Deal detail favorite and share actions expose state, accessible names, and user feedback.");
  }

  if (
    !shareUrl.includes("buildPublicDealShareUrl") ||
    !shareUrl.includes("buildPublicAppShareUrl") ||
    !shareUrl.includes("isLocalOrNativeOrigin") ||
    !shareUrl.includes("!isLocalOrNativeOrigin(configured)") ||
    !shareUrl.includes("NEXT_PUBLIC_SITE_URL") ||
    !homePage.includes("buildPublicDealShareUrl") ||
    !homePage.includes("buildPublicAppShareUrl") ||
    !dealDetailActions.includes("buildPublicDealShareUrl") ||
    !favoritesPage.includes("buildPublicDealShareUrl") ||
    !localDataControls.includes("buildPublicAppShareUrl")
  ) {
    fail("public share url safety", "Share flows should use public web URLs instead of native/local origins.");
  } else {
    pass("public share url safety", "Home, detail, favorites, and app sharing use public web URLs that avoid native/local origins.");
  }

  if (
    !dealDetailPage.includes("<PriceAlertPanel") ||
    !priceAlerts.includes("halindosa:price-alerts") ||
    !priceAlertList.includes("readStoredPriceAlerts") ||
    !priceAlertList.includes("removeStoredPriceAlert") ||
    !priceAlertList.includes("저장한 가격 알림") ||
    !priceAlertPanel.includes("실제 푸시 발송은 운영 서버와 FCM 연결 후 활성화") ||
    !priceAlertList.includes("실제 푸시 발송은 FCM 연결 후 별도 동의") ||
    !priceAlertPanel.includes('role="status"') ||
    !priceAlertList.includes('role="status"') ||
    priceAlertPanel.includes("Notification.requestPermission") ||
    priceAlertList.includes("Notification.requestPermission")
  ) {
    fail("price alert readiness", "Deal detail and notifications should support device-saved price alert intent without requesting push permission in V1.");
  } else {
    pass("price alert readiness", "Deal detail and notifications manage price alert intent locally and keep real push permission for a later FCM release.");
  }

  const requiredFooterSnippets = ['href="/guide"', 'href="/support"', 'href="/terms"', 'href="/privacy"', "flex-wrap"];
  const missingFooterSnippets = requiredFooterSnippets.filter((snippet) => !commercialFooter.includes(snippet));
  if (missingFooterSnippets.length) {
    fail("policy footer navigation", `Missing snippets: ${missingFooterSnippets.join(", ")}`);
  } else {
    pass("policy footer navigation", "Purchase caution, service guide, terms, and privacy links remain reachable on narrow mobile screens.");
  }
}

async function checkOperationalDataSurfaces() {
  const dealsRoute = await text("app/api/deals/route.ts");
  const homePage = await text("app/page.tsx");
  const sitemap = await text("app/sitemap.ts");
  const featuredSections = await text("components/FeaturedDealSections.tsx");
  const dealCard = await text("components/DealCard.tsx");
  const liveDealFeed = await text("components/LiveDealFeed.tsx");
  const purchaseConfirmSheet = await text("components/PurchaseConfirmSheet.tsx");
  const dealDetailActions = await text("components/DealDetailActions.tsx");
  const quality = await text("lib/deals/quality.ts");
  const linkValidator = await text("lib/deals/linkValidator.ts");
  const providerTypes = await text("lib/deals/providers/types.ts");
  const affiliate = await text("lib/affiliate.ts");
  const dealRepository = await text("lib/deals/dealRepository.ts");
  const categoriesPage = await text("app/categories/page.tsx");
  const notificationsPage = await text("app/notifications/page.tsx");
  const interestAlertPreview = await text("components/InterestAlertPreview.tsx");
  const officialBenefitAlertPreview = await text("components/OfficialBenefitAlertPreview.tsx");
  const homeOfficialBenefitAlertRail = await text("components/HomeOfficialBenefitAlertRail.tsx");
  const officialBenefitAlertsRoute = await text("app/api/benefits/official-alerts/route.ts");
  const officialBenefitAlertQueue = await text("lib/deals/officialBenefitAlertQueue.ts");
  const notificationPreferences = await text("components/NotificationPreferences.tsx");
  const notificationPreferencesLib = await text("lib/notificationPreferences.ts");
  const benefitVisitStreakSummary = await text("components/BenefitVisitStreakSummary.tsx");
  const claimedBenefitAlertSummary = await text("components/ClaimedBenefitAlertSummary.tsx");
  const benefitReturnReservationList = await text("components/BenefitReturnReservationList.tsx");
  const benefitReturnReservations = await text("lib/benefitReturnReservations.ts");
  const favoritesPage = await text("app/favorites/page.tsx");
  const localDataControls = await text("components/LocalDataControls.tsx");
  const accountPanel = await text("components/AccountPanel.tsx");
  const claimedBenefits = await text("lib/claimedBenefits.ts");
  const adminPage = await text("app/admin/page.tsx");
  const runbook = await text("docs/RUNBOOK.md");
  const roadmap = await text("docs/roadmap.md");
  const adminExportRoute = await text("app/api/admin/export/route.ts");
  const adminDailyQueueRoute = await text("app/api/admin/daily-queue/route.ts");
  const commercializationPage = await text("app/commercialization/page.tsx");
  const schema = await text("docs/supabase-schema.sql");
  const analytics = await text("lib/analytics.ts");
  const healthRoute = await text("app/api/health/route.ts");
  const todayBenefitsRoute = await text("app/api/benefits/today/route.ts");
  const weeklyCalendarRoute = await text("app/api/benefits/calendar/route.ts");
  const dailyBriefingRoute = await text("app/api/benefits/briefing/route.ts");
  const dailyRoutineRoute = await text("app/api/benefits/routine/route.ts");
  const benefitDecisionGuideRoute = await text("app/api/benefits/decision-guide/route.ts");
  const benefitClaimEffortRoute = await text("app/api/benefits/claim-effort/route.ts");
  const personalizedBenefitsRoute = await text("app/api/benefits/personalized/route.ts");
  const todayBenefitQueue = await text("lib/deals/todayBenefitQueue.ts");
  const benefitDecisionGuide = await text("lib/deals/benefitDecisionGuide.ts");
  const claimEffort = await text("lib/deals/claimEffort.ts");
  const weeklyBenefitCalendar = await text("lib/deals/weeklyBenefitCalendar.ts");
  const dailyBenefitBriefing = await text("lib/deals/dailyBenefitBriefing.ts");
  const dailyRoutinePlan = await text("lib/deals/dailyRoutinePlan.ts");
  const personalizedBenefitQueue = await text("lib/deals/personalizedBenefitQueue.ts");
  const envReadiness = await text("lib/operations/envReadiness.ts");
  const smoke = await text("scripts/smoke.mjs");
  const redirectUrl = await text("lib/redirectUrl.ts");
  const goRoute = await text("app/go/[id]/route.ts");
  const dealTypes = await text("types/deal.ts");
  const normalizer = await text("lib/deals/normalizer.ts");
  const mockDeals = await text("data/mockDeals.ts");
  const claimGuide = await text("lib/deals/claimGuide.ts");
  const freeBenefitsPage = await text("app/free-benefits/page.tsx");
  const freeBenefitsClient = await text("components/FreeBenefitsClient.tsx");
  const benefitSavingsDiary = await text("components/BenefitSavingsDiary.tsx");
  const savingsDiary = await text("lib/savingsDiary.ts");
  const benefitVisitStreak = await text("lib/benefitVisitStreak.ts");
  const trust = await text("lib/deals/trust.ts");
  const sourcesRoute = await text("app/api/sources/route.ts");
  const productionProvider = await text("lib/deals/providers/productionProvider.ts");
  const dataSourceRunbook = await text("docs/data-source-runbook.md");
  const partnerFeedValidator = await text("scripts/validate-partner-feed.mjs");
  const productionFeedDoctor = await text("scripts/production-feed-doctor.mjs");
  const partnerFeedDryRunPanel = await text("components/PartnerFeedDryRunPanel.tsx");
  const feedImport = await text("lib/feedImport.ts");
  const officialSourceCatalogReportScript = await text("scripts/official-source-catalog-report.mjs");
  const feedTransitionReportScript = await text("scripts/feed-transition-report.mjs");
  const officialSourceCatalogDoc = existsSync(join(root, "docs/OFFICIAL_SOURCE_CATALOG.md"))
    ? readFileSync(join(root, "docs/OFFICIAL_SOURCE_CATALOG.md"), "utf8")
    : "";
  const officialSourceCatalogReport = existsSync(join(root, "reports/official-source-catalog.json"))
    ? JSON.parse(readFileSync(join(root, "reports/official-source-catalog.json"), "utf8"))
    : {};
  const officialSourceLiveDoctorScript = await text("scripts/official-source-live-doctor.mjs");
  const officialSourceLiveReadiness = await text("lib/operations/sourceLiveReadiness.ts");
  const adminSourceLiveRoute = await text("app/api/admin/source-live/route.ts");
  const officialSourceLiveDoc = existsSync(join(root, "docs/OFFICIAL_SOURCE_LIVE_CHECK.md"))
    ? readFileSync(join(root, "docs/OFFICIAL_SOURCE_LIVE_CHECK.md"), "utf8")
    : "";
  const officialSourceLiveReport = existsSync(join(root, "reports/official-source-live-check.json"))
    ? JSON.parse(readFileSync(join(root, "reports/official-source-live-check.json"), "utf8"))
    : {};
  const sourceOnboardingPlanScript = await text("scripts/source-onboarding-plan.mjs");
  const sourceFeedEnvDoctorScript = await text("scripts/source-feed-env-doctor.mjs");
  const sourceReadinessReportScript = await text("scripts/source-readiness-report.mjs");
  const sourceOnboardingPlanReadiness = await text("lib/operations/sourceOnboardingPlan.ts");
  const sourceFeedEnvReadiness = await text("lib/operations/sourceFeedEnvReadiness.ts");
  const sourceReadinessReportReadiness = await text("lib/operations/sourceReadiness.ts");
  const adminSourceOnboardingRoute = await text("app/api/admin/source-onboarding/route.ts");
  const adminSourceFeedEnvRoute = await text("app/api/admin/source-feed-env/route.ts");
  const adminSourceReadinessRoute = await text("app/api/admin/source-readiness/route.ts");
  const sourceOnboardingPlanDoc = existsSync(join(root, "docs/SOURCE_ONBOARDING_PLAN.md"))
    ? readFileSync(join(root, "docs/SOURCE_ONBOARDING_PLAN.md"), "utf8")
    : "";
  const sourceOnboardingEnvTemplate = existsSync(join(root, "reports/source-onboarding-env-template.env"))
    ? readFileSync(join(root, "reports/source-onboarding-env-template.env"), "utf8")
    : "";
  const sourceOnboardingPlanReport = existsSync(join(root, "reports/source-onboarding-plan.json"))
    ? JSON.parse(readFileSync(join(root, "reports/source-onboarding-plan.json"), "utf8"))
    : {};
  const sourceFeedEnvReport = existsSync(join(root, "reports/source-feed-env-readiness.json"))
    ? JSON.parse(readFileSync(join(root, "reports/source-feed-env-readiness.json"), "utf8"))
    : {};
  const sourceReadinessReport = existsSync(join(root, "reports/source-readiness.json"))
    ? JSON.parse(readFileSync(join(root, "reports/source-readiness.json"), "utf8"))
    : {};
  const sourceFeedEnvDoc = existsSync(join(root, "docs/SOURCE_FEED_ENV_REPORT.md"))
    ? readFileSync(join(root, "docs/SOURCE_FEED_ENV_REPORT.md"), "utf8")
    : "";
  const sourceReadinessDoc = existsSync(join(root, "docs/SOURCE_READINESS_REPORT.md"))
    ? readFileSync(join(root, "docs/SOURCE_READINESS_REPORT.md"), "utf8")
    : "";
  const envExample = existsSync(join(root, ".env.example")) ? readFileSync(join(root, ".env.example"), "utf8") : "";
  const officialSourceStatusCounts = officialSourceLiveReport.statusCounts ?? {};
  const officialSourceBlockingLiveCount =
    Number(officialSourceLiveReport.needsReviewCount ?? 0) +
    Number(officialSourceLiveReport.timeoutCount ?? 0) +
    Number(officialSourceLiveReport.networkErrorCount ?? 0) +
    Number(officialSourceLiveReport.staleOrRemovedCount ?? 0) +
    Number(officialSourceStatusCounts.server_error ?? 0);
  const officialSourceHighPriorityOk =
    Number(officialSourceLiveReport.highPriorityReachableOrGuarded ?? 0) >= Number(officialSourceLiveReport.highPrioritySources ?? 0);
  const officialSourceCatalogThinCategories = Array.isArray(officialSourceCatalogReport.thinCategories)
    ? officialSourceCatalogReport.thinCategories
    : [];
  const officialSourceCatalogMissingCategories = Array.isArray(officialSourceCatalogReport.missingCategories)
    ? officialSourceCatalogReport.missingCategories
    : [];
  const notificationCampaigns = await text("lib/notificationCampaigns.ts");
  const pushReadiness = await text("lib/pushReadiness.ts");
  const pushNotifications = await text("lib/pushNotifications.ts");
  const pushReadinessReportScript = await text("scripts/push-readiness-report.mjs");
  const notificationDeliveryPolicy = await text("lib/notificationDeliveryPolicy.ts");
  const pushDeliveryPolicyDoctor = await text("scripts/push-delivery-policy-doctor.mjs");
  const pushDeliveryAudit = await text("lib/pushDeliveryAudit.ts");
  const pushDeliveryAuditDoctor = await text("scripts/push-delivery-audit-doctor.mjs");
  const officialBenefitAlertReportScript = await text("scripts/official-benefit-alert-report.mjs");
  const adminOfficialAlertsRoute = await text("app/api/admin/official-alerts/route.ts");
  const adminNotificationCampaignsRoute = await text("app/api/admin/notification-campaigns/route.ts");
  const adminPushReadinessRoute = await text("app/api/admin/push-readiness/route.ts");
  const adminPushDryRunPanel = await text("components/AdminPushDryRunPanel.tsx");
  const adminPushSendRoute = await text("app/api/admin/push/send/route.ts");
  const pushReadinessReportPath = join(root, "reports/push-readiness.json");
  const pushReadinessReport = existsSync(pushReadinessReportPath) ? JSON.parse(readFileSync(pushReadinessReportPath, "utf8")) : {};
  const pushDeliveryPolicyReportPath = join(root, "reports/push-delivery-policy.json");
  const pushDeliveryPolicyReport = existsSync(pushDeliveryPolicyReportPath) ? JSON.parse(readFileSync(pushDeliveryPolicyReportPath, "utf8")) : {};
  const pushDeliveryAuditReportPath = join(root, "reports/push-delivery-audit.json");
  const pushDeliveryAuditReport = existsSync(pushDeliveryAuditReportPath) ? JSON.parse(readFileSync(pushDeliveryAuditReportPath, "utf8")) : {};
  const officialBenefitAlertReportPath = join(root, "reports/official-benefit-alerts.json");
  const officialBenefitAlertReport = existsSync(officialBenefitAlertReportPath) ? JSON.parse(readFileSync(officialBenefitAlertReportPath, "utf8")) : {};
  const officialBenefitAlertReportDoc = existsSync(join(root, "docs/OFFICIAL_BENEFIT_ALERTS_REPORT.md"))
    ? readFileSync(join(root, "docs/OFFICIAL_BENEFIT_ALERTS_REPORT.md"), "utf8")
    : "";

  const staticDataImports = [
    ["app/categories/page.tsx", categoriesPage],
    ["app/notifications/page.tsx", notificationsPage]
  ].filter(([, body]) => body.includes('from "@/data/mockDeals"'));

  if (staticDataImports.length) {
    fail("operational data surfaces", `Pages still bypass Deal repository: ${staticDataImports.map(([file]) => file).join(", ")}`);
  } else if (!categoriesPage.includes("await getDeals()") || !notificationsPage.includes("await getDeals()") || !favoritesPage.includes("/api/deals?sort=latest")) {
    fail("operational data surfaces", "Categories, notifications, and favorites pages should read through Deal repository/API.");
  } else {
    pass("operational data surfaces", "Category, notification, and favorites pages use the Deal repository/API instead of static mock-only arrays.");
  }

  if (
    !categoriesPage.includes("featuredCategories") ||
    !categoriesPage.includes("categoryGroups") ||
    !categoriesPage.includes("benefitQuickLinks") ||
    !categoriesPage.includes("생활 혜택 빠른 지도") ||
    !categoriesPage.includes("무료 샘플·0원 혜택") ||
    !categoriesPage.includes("앱테크·포인트 적립") ||
    !categoriesPage.includes("문화 초대권·무료 관람") ||
    !categoriesPage.includes("추천 탐색") ||
    !categoriesPage.includes("구매 링크 확인이 많은 영역부터 보기") ||
    !categoriesPage.includes("purposeJourneys") ||
    !categoriesPage.includes("오늘 목적별 탐색 루틴") ||
    !categoriesPage.includes("무엇을 아끼고 싶은지부터 고르세요") ||
    !categoriesPage.includes("앱테크 적립 루틴") ||
    !categoriesPage.includes("문화 초대권 보기") ||
    !categoriesPage.includes("purposeRecommendationQueue") ||
    !categoriesPage.includes("혜택 목적별 추천 큐") ||
    !categoriesPage.includes("오늘 아낄 목적에 맞춰 대표 혜택부터 봅니다") ||
    !categoriesPage.includes("지금 무료로 받을 것") ||
    !categoriesPage.includes("결제 전 적용할 것") ||
    !categoriesPage.includes("매일 적립할 것") ||
    !categoriesPage.includes("무료 관람할 것") ||
    !categoriesPage.includes("생활비 줄일 것") ||
    !categoriesPage.includes("오늘 놓치면 아쉬운 것") ||
    !categoriesPage.includes("benefitComparisonRows") ||
    !categoriesPage.includes("혜택 유형별 비교표") ||
    !categoriesPage.includes("무료·쿠폰·포인트를 비교해서 고르세요") ||
    !categoriesPage.includes("활성 혜택") ||
    !categoriesPage.includes("마감 신호") ||
    !categoriesPage.includes("categoryBenefitMatrix") ||
    !categoriesPage.includes("카테고리별 오늘 혜택 요약") ||
    !categoriesPage.includes("무료·쿠폰·마감 신호가 많은 영역부터 보세요") ||
    !categoriesPage.includes("예상 절약 후보") ||
    !categoriesPage.includes("categoryClaimEffortMap") ||
    !categoriesPage.includes("카테고리별 수령 난이도") ||
    !categoriesPage.includes("처음이라면 받기 쉬운 영역부터 시작하세요") ||
    !categoriesPage.includes("간편 수령") ||
    !categoriesPage.includes("조건 확인") ||
    !categoriesPage.includes("마감 주의") ||
    !categoriesPage.includes("categoryRiskMap") ||
    !categoriesPage.includes("카테고리 조건 점검 지도") ||
    !categoriesPage.includes("숨은 비용·가입·마감 신호를 카테고리별로 봅니다") ||
    !smoke.includes("Categories page missing purpose recommendation queue") ||
    !smoke.includes("Categories page missing benefit comparison matrix") ||
    !smoke.includes("Categories page missing benefit type quick map") ||
    !smoke.includes("Categories page missing culture and apptech benefit journeys") ||
    !smoke.includes("Categories page missing category claim effort map") ||
    !smoke.includes("Categories page missing category claim effort metrics") ||
    !smoke.includes("Categories page missing category condition risk map")
  ) {
    fail("category discovery UX", "Categories page should group channels and surface verified-link-first, benefit-type, and claim-effort discovery.");
  } else {
    pass("category discovery UX", "Categories page groups channels and surfaces verified-link-first, benefit-type, and claim-effort discovery.");
  }

  if (
    !notificationsPage.includes("<PriceAlertList") ||
    !notificationsPage.includes("<BenefitVisitStreakSummary") ||
    !benefitVisitStreakSummary.includes("readBenefitVisitStreak") ||
    !benefitVisitStreakSummary.includes("무료 혜택 방문 알림 요약") ||
    !benefitVisitStreakSummary.includes("무료 혜택을 다시 확인할 타이밍입니다") ||
    !notificationsPage.includes("<ClaimedBenefitAlertSummary") ||
    !claimedBenefitAlertSummary.includes("readClaimedBenefits") ||
    !claimedBenefitAlertSummary.includes("챙긴 혜택 알림 요약") ||
    !claimedBenefitAlertSummary.includes("아직 챙길 만한 혜택") ||
    !claimedBenefitAlertSummary.includes("nextAlertQueue") ||
    !claimedBenefitAlertSummary.includes("챙긴 혜택 다음 알림 후보") ||
    !claimedBenefitAlertSummary.includes("무료 혜택 다시 알림") ||
    !claimedBenefitAlertSummary.includes("쿠폰·포인트 재확인") ||
    !claimedBenefitAlertSummary.includes("마감 전 확인 알림") ||
    !notificationsPage.includes("<BenefitReturnReservationList") ||
    !benefitReturnReservations.includes("benefitReturnReservationUpdatedEvent") ||
    !benefitReturnReservations.includes("window.dispatchEvent") ||
    !benefitReturnReservationList.includes("readBenefitReturnReservations") ||
    !benefitReturnReservationList.includes("benefitReturnReservationUpdatedEvent") ||
    !benefitReturnReservationList.includes("저장한 재방문 혜택 알림") ||
    !benefitReturnReservationList.includes("기기에 저장한 무료·쿠폰·마감 루틴을 이어봅니다") ||
    !benefitReturnReservationList.includes("오늘 이어볼 재방문 루틴 요약") ||
    !benefitReturnReservationList.includes("window.addEventListener(\"focus\"") ||
    !benefitReturnReservationList.includes("재방문 루틴 추가") ||
    !notificationsPage.includes("<InterestAlertPreview") ||
    !interestAlertPreview.includes("readLocalPreferences") ||
    !interestAlertPreview.includes("readLocalFavoriteIds") ||
    !interestAlertPreview.includes("readRecentDealIds") ||
    !interestAlertPreview.includes("readNotificationPreferenceCategories") ||
    !interestAlertPreview.includes("notificationPreferenceUpdatedEvent") ||
    !interestAlertPreview.includes("buildPersonalizedBenefitQueue") ||
    !homePage.includes("<PriceAlertList") ||
    !localDataControls.includes("priceAlertStorageKey") ||
    !localDataControls.includes("가격 알림 조건") ||
    !localDataControls.includes("benefitCheckInStorageKey") ||
    !localDataControls.includes("혜택 출석 기록") ||
    !localDataControls.includes("benefitVisitStreakStorageKey") ||
    !localDataControls.includes("무료 혜택 방문 기록") ||
    !accountPanel.includes("readBenefitVisitStreak") ||
    !accountPanel.includes("무료 혜택 방문 루틴 이어보기") ||
    !localDataControls.includes("claimedBenefitStorageKey") ||
    !localDataControls.includes("챙긴 혜택 기록") ||
    !localDataControls.includes("notificationPreferenceStorageKey") ||
    !localDataControls.includes("관심 알림 카테고리") ||
    !localDataControls.includes("benefitReturnReservationStorageKey") ||
    !localDataControls.includes("재방문 예약") ||
    !accountPanel.includes("priceAlertStorageKey") ||
    !accountPanel.includes("notificationPreferenceStorageKey") ||
    !accountPanel.includes("benefitReturnReservationUpdatedEvent") ||
    !homePage.includes("benefitReturnReservationUpdatedEvent") ||
    !freeBenefitsClient.includes("benefitReturnReservationUpdatedEvent")
  ) {
    fail("price alert data surface", "Notifications, in-app alert tab, account deletion, and local data controls should expose saved price alerts, benefit check-in records, claimed benefit records, return reservations, live same-tab refresh events, and deletion scope.");
  } else {
    pass("price alert data surface", "Saved price alerts, benefit check-in records, claimed benefit records, and return reservations are visible in-app, refresh across same-tab events, and are included in local/account data deletion controls.");
  }

  if (
    !notificationsPage.includes("알림 운영 방식") ||
    !notificationsPage.includes("priorityAlerts") ||
    !notificationsPage.includes("ClaimedBenefitAlertSummary") ||
    !claimedBenefitAlertSummary.includes("무료 혜택 더 챙기기") ||
    !smoke.includes("Notifications page missing free benefit visit alert summary") ||
    !smoke.includes("Notifications page missing claimed benefit alert summary") ||
    !smoke.includes("Notifications page missing claimed benefit next alert queue") ||
    !smoke.includes("Notifications page missing saved benefit return reservation list") ||
    !smoke.includes("Notifications page missing return reservation routine summary") ||
    !notificationsPage.includes("오늘 먼저 확인할 알림") ||
    !notificationsPage.includes("마감과 인기 반응이 겹친 특가부터 보기") ||
    !notificationsPage.includes("dailyAlertQueues") ||
    !notificationsPage.includes("alertActionSteps") ||
    !notificationsPage.includes("alertConditionBoard") ||
    !notificationsPage.includes("비회원 알림 조건 요약") ||
    !notificationsPage.includes("가입 없이도 오늘 볼 알림 조건을 먼저 고릅니다") ||
    !notificationsPage.includes("무료·체험 조건") ||
    !notificationsPage.includes("찜·가격 알림 조건") ||
    !notificationsPage.includes("getAlertClaimEffort") ||
    !notificationsPage.includes("alertClaimEffortQueues") ||
    !notificationsPage.includes("알림 수령 난이도") ||
    !notificationsPage.includes("지금 열어볼 알림을 받기 쉬운 순서로 정리했습니다") ||
    !notificationsPage.includes("간편 수령 알림") ||
    !notificationsPage.includes("조건 확인 알림") ||
    !notificationsPage.includes("마감 주의 알림") ||
    !notificationsPage.includes("오늘 알림 실행 순서") ||
    !notificationsPage.includes("앱을 열면 이 순서로 혜택을 확인하세요") ||
    !notificationsPage.includes("InterestAlertPreview") ||
    !notificationsPage.includes("alertTimeSlots") ||
    !notificationsPage.includes("오늘 알림 시간표") ||
    !notificationsPage.includes("푸시 없이도 하루 세 번 열어볼 이유를 만듭니다") ||
    !notificationsPage.includes("아침 9시") ||
    !notificationsPage.includes("마감 전 22시") ||
    !notificationsPage.includes("buildTodayBenefitQueue") ||
    !notificationsPage.includes("buildBenefitDecisionGuide") ||
    !notificationsPage.includes("알림 혜택 판단표") ||
    !notificationsPage.includes("오늘 먼저 열어볼 알림을 4가지로 좁혔습니다") ||
    !notificationsPage.includes("판단표 API 보기") ||
    !notificationsPage.includes("API 기준 오늘 혜택 큐") ||
    !notificationsPage.includes("OfficialBenefitAlertPreview") ||
    !notificationsPage.includes("비회원 기준 혜택 큐") ||
    !notificationsPage.includes("오늘 알림 큐") ||
    !interestAlertPreview.includes("관심 카테고리 알림") ||
    !interestAlertPreview.includes("관심 설정하기") ||
    !interestAlertPreview.includes("알림 개인화 추천 API") ||
    !interestAlertPreview.includes("개인화 API 보기") ||
    !interestAlertPreview.includes("favoriteId") ||
    !interestAlertPreview.includes("recentId") ||
    !interestAlertPreview.includes("기기 저장 알림 신호") ||
    !interestAlertPreview.includes("찜 반영") ||
    !interestAlertPreview.includes("최근 본 상품") ||
    !interestAlertPreview.includes("비회원도 기기에 관심 알림 카테고리를 저장") ||
    !interestAlertPreview.includes("interestAlertPlan") ||
    !interestAlertPreview.includes("관심 알림 실행 카드") ||
    !interestAlertPreview.includes("무료·체험 먼저") ||
    !interestAlertPreview.includes("마감 전 확인") ||
    !officialBenefitAlertPreview.includes("공식 혜택 알림 후보") ||
    !officialBenefitAlertPreview.includes("공식 페이지 이동만 포함") ||
    !officialBenefitAlertPreview.includes("공식 혜택 알림 API") ||
    !officialBenefitAlertPreview.includes("공식 알림 API 보기") ||
    !officialBenefitAlertPreview.includes("/api/benefits/official-alerts") ||
    !officialBenefitAlertPreview.includes("recentNewsBenefitUpdatedEvent") ||
    !officialBenefitAlertPreview.includes("rememberRecentNewsBenefitId") ||
    !officialBenefitAlertPreview.includes("/go/news/") ||
    !officialBenefitAlertPreview.includes("target=\"_blank\"") ||
    !officialBenefitAlertPreview.includes("최근 본 공식 혜택") ||
    !homePage.includes("HomeOfficialBenefitAlertRail") ||
    !homeOfficialBenefitAlertRail.includes("오늘 다시 볼 공식 혜택") ||
    !homeOfficialBenefitAlertRail.includes("재방문 혜택 큐") ||
    !homeOfficialBenefitAlertRail.includes("관심 카테고리 공식 혜택") ||
    !homeOfficialBenefitAlertRail.includes("buildOfficialBenefitAlertQueue") ||
    !homeOfficialBenefitAlertRail.includes("readNotificationPreferenceCategories") ||
    !homeOfficialBenefitAlertRail.includes("recentNewsBenefitUpdatedEvent") ||
    !homeOfficialBenefitAlertRail.includes("rememberRecentNewsBenefitId") ||
    !homeOfficialBenefitAlertRail.includes("/go/news/") ||
    !homeOfficialBenefitAlertRail.includes("target=\"_blank\"") ||
    !homeOfficialBenefitAlertRail.includes("noopener noreferrer") ||
    !officialBenefitAlertsRoute.includes("buildOfficialBenefitAlertQueue") ||
    !officialBenefitAlertsRoute.includes("getVisibleNewsDeals") ||
    !officialBenefitAlertsRoute.includes("recentNewsId") ||
    !officialBenefitAlertQueue.includes("newsDealMatchesNotificationInterest") ||
    !officialBenefitAlertQueue.includes("isHttpUrl") ||
    !officialBenefitAlertQueue.includes("parseTime") ||
    !officialBenefitAlertQueue.includes("lastCheckedAt") ||
    !officialBenefitAlertQueue.includes("freshnessBoost") ||
    !officialBenefitAlertQueue.includes("officialHost") ||
    !officialBenefitAlertQueue.includes("matchedInterests") ||
    !officialBenefitAlertQueue.includes("redirectUrl: `/go/news/${deal.id}`") ||
    !officialBenefitAlertQueue.includes("실제 푸시는 별도 동의") ||
    !notificationPreferences.includes("알림 받을 카테고리") ||
    !notificationPreferences.includes("writeInAppNotificationPreferences") ||
    !notificationPreferences.includes("notificationCategoryOptions") ||
    !notificationPreferencesLib.includes("notificationPreferenceUpdatedEvent") ||
    !notificationPreferencesLib.includes("defaultNotificationCategories") ||
    !notificationPreferencesLib.includes("legacySignals") ||
    !notificationsPage.includes("무료 혜택 알림") ||
    !notificationsPage.includes("쿠폰·포인트 알림") ||
    !notificationsPage.includes("비회원도 모두 볼 수 있고") ||
    !notificationsPage.includes("권한 요청 없이 먼저 쓸 수 있게 준비했습니다") ||
    !notificationsPage.includes("실제 푸시 알림은 별도 동의") ||
    !notificationsPage.includes("알림 기준 보기") ||
    !smoke.includes("Notifications page missing non-member alert condition board") ||
    !smoke.includes("Notifications page missing alert claim effort board") ||
    !smoke.includes("Notifications page missing alert claim effort cards") ||
    !smoke.includes("Notifications page missing shared today benefit API queue") ||
    !smoke.includes("Notifications page missing shared benefit decision guide") ||
    !smoke.includes("Notifications page missing decision guide API action") ||
    !smoke.includes("Notifications page missing alert action routine") ||
    !smoke.includes("Notifications page missing alert time routine") ||
    !smoke.includes("Notifications page missing interest alert action cards") ||
    !smoke.includes("Notifications page missing official benefit alert preview") ||
    !smoke.includes("official benefit alerts api") ||
    !smoke.includes("Official benefit alert items missing official host or matched interests") ||
    !smoke.includes("Notifications page missing local notification category preferences") ||
    !smoke.includes("Notifications page missing favorite and recent signal personalization summary") ||
    !smoke.includes("Notifications page missing reusable personalized recommendation API card") ||
    notificationsPage.includes("Notification.requestPermission")
  ) {
    fail("notification launch readiness UX", "Notifications page should explain the V1 in-app alert flow without requesting push permission.");
  } else {
    pass("notification launch readiness UX", "Notifications page explains the in-app alert flow and keeps real push permission for a later release.");
  }

  const adminRawTerms = ["mock, staging, production", "· score "].filter((term) => adminPage.includes(term));
  if (adminRawTerms.length) {
    fail("admin product copy", `Admin page still exposes raw internal terms: ${adminRawTerms.join(", ")}`);
  } else if (
    !adminPage.includes("VER 2.0 혜택 운영") ||
    !adminPage.includes("혜택 데이터 품질 요약") ||
    !adminPage.includes("혜택형 콘텐츠") ||
    !adminPage.includes("점검 우선") ||
    !adminPage.includes("dailyOperationCheckIn") ||
    !adminPage.includes("오늘 운영 체크인") ||
    !adminPage.includes("무료·쿠폰·링크·재방문 루틴을 먼저 점검합니다") ||
    !smoke.includes("Admin dashboard missing daily operations check-in") ||
    !adminPage.includes("buildBenefitDecisionGuide") ||
    !adminPage.includes("운영 혜택 판단표") ||
    !adminPage.includes("고객이 오늘 먼저 보는 4가지 기준을 운영 큐로 점검합니다") ||
    !adminPage.includes("decisionGuideOperationActions") ||
    !adminPage.includes("판단표 API 보기") ||
    !smoke.includes("Admin dashboard missing shared benefit decision operation board") ||
    !smoke.includes("Admin dashboard missing decision guide operation actions") ||
    !adminPage.includes("buildClaimEffortSummary") ||
    !adminPage.includes("claimEffortOperationQueue") ||
    !adminPage.includes("수령 난이도 운영 큐") ||
    !adminPage.includes("비회원 기준으로 먼저 받을 혜택부터 점검합니다") ||
    !adminPage.includes("수령 난이도 API 보기") ||
    !analytics.includes("claimEffortSummary") ||
    !analytics.includes("claimEffortOperationQueue") ||
    !smoke.includes("Admin dashboard missing claim effort operation queue") ||
    !smoke.includes("Metrics missing claim effort operation queue") ||
    !adminPage.includes("오늘 혜택 운영 액션 큐") ||
    !adminPage.includes("신고·종료·링크 보강") ||
    !adminPage.includes("benefitConditionAudit") ||
    !adminPage.includes("혜택 조건 완성도 점검") ||
    !adminPage.includes("제공처·배송비·가입·선착순·쿠폰 조건") ||
    !analytics.includes("conditionAudit") ||
    !analytics.includes("readinessRate") ||
    !analytics.includes("conditionOperationQueue") ||
    !analytics.includes("missingClaimGuideCount") ||
    !adminPage.includes("혜택 조건 보강 우선순위") ||
    !adminPage.includes("수령 단계, 조건 체크") ||
    !adminPage.includes("VER 2.0 재방문 운영") ||
    !adminPage.includes("매일 재방문 루틴 점검") ||
    !adminPage.includes("재방문 점수") ||
    !adminPage.includes("다음 재방문 개선 액션") ||
    !adminPage.includes("buildWeeklyBenefitCalendar") ||
    !adminPage.includes("주간 혜택 편성 캘린더") ||
    !adminPage.includes("요일별로 채워야 할 재방문 루틴") ||
    !smoke.includes("Admin dashboard missing weekly benefit calendar operation board") ||
    !smoke.includes("Admin dashboard missing benefit quality operation summary") ||
    !smoke.includes("Metrics missing benefit condition audit queue") ||
    !smoke.includes("Metrics missing benefit condition operation queue")
  ) {
    fail("admin product copy", "Admin page should expose V2 benefit operation quality, condition operation, and retention summaries with smoke coverage.");
  } else {
    pass("admin product copy", "Admin dashboard avoids raw internal source copy and exposes V2 benefit operation quality, condition operation, and retention readiness.");
  }

  if (
    !notificationCampaigns.includes("buildOfficialBenefitNotificationCampaigns") ||
    !notificationCampaigns.includes('sourceKind: "official_benefit"') ||
    !notificationCampaigns.includes("benefitIds") ||
    !notificationCampaigns.includes("sourceNames") ||
    !notificationCampaigns.includes("selectTopNewsBenefits") ||
    !adminNotificationCampaignsRoute.includes("getVisibleNewsDeals") ||
    !adminNotificationCampaignsRoute.includes("officialBenefitCampaigns") ||
    !adminNotificationCampaignsRoute.includes("productCampaigns") ||
    !adminPage.includes("productNotificationCampaigns") ||
    !adminPage.includes("officialBenefitNotificationCampaigns") ||
    !adminPage.includes("검증 상품 캠페인") ||
    !adminPage.includes("공식 혜택 캠페인") ||
    !adminPage.includes("공식 이벤트/공공/쿠폰 페이지가 검증된 혜택만 푸시 후보로 편성합니다") ||
    !smoke.includes("admin notification campaigns api") ||
    !smoke.includes("source_kind === \"official_benefit\"")
  ) {
    fail("official benefit notification campaign queue", "Official news/event benefits should feed a separate notification campaign queue with API, admin UI, and smoke coverage.");
  } else {
    pass("official benefit notification campaign queue", "Official news/event benefits feed a separate notification campaign queue with product campaigns preserved.");
  }

  const defaultInterestCoverage = Array.isArray(officialBenefitAlertReport.interestCoverage)
    ? officialBenefitAlertReport.interestCoverage.filter((item) => ["무료/체험", "쿠폰/이벤트", "마트/편의점", "영화/문화"].includes(item.interest))
    : [];

  if (
    !officialBenefitAlertReportScript.includes("reports/official-benefit-alerts.json") ||
    !officialBenefitAlertReportScript.includes("docs/OFFICIAL_BENEFIT_ALERTS_REPORT.md") ||
    !officialBenefitAlertReportScript.includes("redirectSafety") ||
    !officialBenefitAlertReportScript.includes("buildRegressionScenarios") ||
    !officialBenefitAlertReportScript.includes("regression-search-link") ||
    !officialBenefitAlertReportScript.includes("regression-unsafe-url") ||
    !officialBenefitAlertReportScript.includes("regression-invalid-date") ||
    !officialBenefitAlertReportScript.includes("/go/news/") ||
    !officialBenefitAlertReportScript.includes("defaultInterests") ||
    !adminOfficialAlertsRoute.includes("canAccessAdminRequest") ||
    !adminOfficialAlertsRoute.includes("official-benefit-alerts.json") ||
    !adminOfficialAlertsRoute.includes("format\") === \"csv\"") ||
    !adminPage.includes("officialAlertsApiHref") ||
    !adminPage.includes("officialAlertsCsvHref") ||
    !adminPage.includes("공식 혜택 알림 후보") ||
    officialBenefitAlertReport.ok !== true ||
    (officialBenefitAlertReport.totals?.activeOfficialBenefits ?? 0) < 40 ||
    (officialBenefitAlertReport.defaultQueue?.recommendedBenefits ?? 0) < 6 ||
    officialBenefitAlertReport.redirectSafety?.ok !== true ||
    officialBenefitAlertReport.regression?.ok !== true ||
    !Array.isArray(officialBenefitAlertReport.regression?.checks) ||
    officialBenefitAlertReport.regression.checks.some((check) => check.ok !== true) ||
    !Array.isArray(officialBenefitAlertReport.regression?.rejectedIds) ||
    !officialBenefitAlertReport.regression.rejectedIds.includes("regression-search-link") ||
    !officialBenefitAlertReport.regression.rejectedIds.includes("regression-unsafe-url") ||
    defaultInterestCoverage.length < 4 ||
    defaultInterestCoverage.some((item) => Number(item.matchedCount ?? 0) < 1) ||
    !officialBenefitAlertReportDoc.includes("공식 혜택 알림 후보 리포트") ||
    !officialBenefitAlertReportDoc.includes("/go/news/[id]") ||
    !officialBenefitAlertReportDoc.includes("기본 관심 카테고리 커버리지") ||
    !officialBenefitAlertReportDoc.includes("회귀 방지 샘플") ||
    !officialBenefitAlertReportDoc.includes("검색 링크, unsafe URL, 종료·숨김·판매 중단 혜택") ||
    !runbook.includes("official:alerts:report") ||
    !runbook.includes("/api/benefits/official-alerts") ||
    !roadmap.includes("official:alerts:report") ||
    !smoke.includes("admin official benefit alerts api") ||
    !smoke.includes("Admin dashboard missing official benefit alert operations panel")
  ) {
    fail("official benefit alert operations report", "Official benefit alert candidates should have a QA report, docs, protected admin API/CSV, default interest coverage, and /go/news redirect safety evidence.");
  } else {
    pass("official benefit alert operations report", "Official benefit alert candidates have a QA report, docs, protected admin API/CSV, default interest coverage, and /go/news redirect safety evidence.");
  }

  if (
    !adminPage.includes("<AdminPushDryRunPanel") ||
    !adminPage.includes("pushSendApiHref") ||
    !adminPushDryRunPanel.includes("FCM 테스트 발송 dry-run") ||
    !adminPushDryRunPanel.includes("dry-run으로만 검증") ||
    !adminPushDryRunPanel.includes("실제 발송 확인") ||
    !adminPushDryRunPanel.includes("동의 받은 테스트 토큰") ||
    !adminPushDryRunPanel.includes("confirmLiveSend") ||
    !adminPushDryRunPanel.includes("confirmConsent") ||
    !adminPushDryRunPanel.includes("push.configured && confirmLiveSend && confirmConsent") ||
    !adminPushDryRunPanel.includes("tokens.length") ||
    !adminPushDryRunPanel.includes("deliveryPolicy") ||
    !adminPushSendRoute.includes("campaignId") ||
    !adminPushSendRoute.includes("benefitId") ||
    !adminPushSendRoute.includes("sourceKind") ||
    !adminPushSendRoute.includes("confirmedConsent") ||
    !adminPushSendRoute.includes("scheduledAt") ||
    !adminPushSendRoute.includes("priority") ||
    !pushNotifications.includes("PushAlertType") ||
    !pushNotifications.includes("evaluateNotificationDelivery") ||
    !pushNotifications.includes("deliveryPolicy") ||
    !pushNotifications.includes("campaignId: input.campaignId") ||
    !pushNotifications.includes("sourceKind: input.sourceKind") ||
    !smoke.includes("admin push dry-run api") ||
    !smoke.includes("Admin dashboard missing push dry-run panel")
  ) {
    fail("admin push dry-run operation", "Admin should expose a safe FCM dry-run panel and preserve campaign/benefit payload fields.");
  } else {
    pass("admin push dry-run operation", "Admin exposes safe FCM dry-run controls with campaign and official benefit payload fields.");
  }

  if (
    !pushReadiness.includes("buildPushSubscriptionReadiness") ||
    !pushReadiness.includes("notificationCategoryOptions") ||
    !pushReadiness.includes("consentChecklist") ||
    !pushReadiness.includes("segmentCoverage") ||
    !pushReadiness.includes("push_subscriptions") ||
    !pushReadiness.includes("push_notification_queue") ||
    !pushReadinessReportScript.includes("reports/push-readiness.json") ||
    !pushReadinessReportScript.includes("docs/PUSH_READINESS_REPORT.md") ||
    !pushReadinessReportScript.includes("dry_run_ready") ||
    !pushDeliveryPolicyDoctor.includes("reports/push-delivery-policy.json") ||
    !pushDeliveryPolicyDoctor.includes("docs/PUSH_DELIVERY_POLICY.md") ||
    !pushDeliveryPolicyDoctor.includes("quiet live send blocked") ||
    !pushDeliveryAudit.includes("buildPushDeliveryAuditEntry") ||
    !pushDeliveryAudit.includes("summarizePushDeliveryAudit") ||
    !pushDeliveryAuditDoctor.includes("reports/push-delivery-audit.json") ||
    !pushDeliveryAuditDoctor.includes("docs/PUSH_DELIVERY_AUDIT.md") ||
    !pushDeliveryAuditDoctor.includes("token counts, not raw FCM tokens") ||
    !notificationDeliveryPolicy.includes("evaluateNotificationDelivery") ||
    !notificationDeliveryPolicy.includes("isNotificationQuietHour") ||
    !notificationDeliveryPolicy.includes("getNextNotificationAllowedAt") ||
    pushDeliveryPolicyReport.ok !== true ||
    pushDeliveryAuditReport.ok !== true ||
    !Array.isArray(pushDeliveryAuditReport.sampleEvents) ||
    pushDeliveryAuditReport.sampleEvents.length < 3 ||
    !String(pushDeliveryAuditReport.tokenStoragePolicy ?? "").includes("token counts") ||
    !String(pushDeliveryPolicyReport.policy?.timezone ?? "").includes("Asia/Seoul") ||
    (pushDeliveryPolicyReport.policy?.quietHours?.startHour ?? 0) !== 22 ||
    (pushDeliveryPolicyReport.policy?.quietHours?.endHour ?? 0) !== 8 ||
    pushReadinessReport.ok !== true ||
    pushReadinessReport.launchStatus === "needs_work" ||
    (pushReadinessReport.queueRows ?? 0) < 30 ||
    (pushReadinessReport.readySegments ?? 0) < 10 ||
    !schema.includes("benefit_id text") ||
    !schema.includes("source_kind text not null default 'product_deal'") ||
    !schema.includes("campaign_id text") ||
    !schema.includes("dry_run_only boolean not null default true") ||
    !schema.includes("create table if not exists public.push_delivery_logs") ||
    !schema.includes("blocked_reasons text[]") ||
    !schema.includes("service manages push delivery logs") ||
    !adminPushReadinessRoute.includes("buildPushSubscriptionReadiness") ||
    !adminPushReadinessRoute.includes("canAccessAdmin") ||
    !adminPushReadinessRoute.includes("rateLimit") ||
    !adminPage.includes("pushSubscriptionReadiness") ||
    !adminPage.includes("푸시 구독·동의 준비도") ||
    !adminPage.includes("관심 카테고리 세그먼트") ||
    !adminPage.includes("동의/철회 체크") ||
    !adminPage.includes("pushReadinessApiHref") ||
    !smoke.includes("admin push readiness api") ||
    !smoke.includes("Push readiness should expose push subscription table readiness")
  ) {
    fail("push subscription readiness operation", "Push readiness should expose consent, subscription, category segment, queue row, protected admin API evidence, delivery audit logs, and file reports before real FCM launch.");
  } else {
    pass("push subscription readiness operation", "Push readiness exposes consent, subscription, category segment, queue row, protected admin API evidence, delivery audit logs, and file reports before real FCM launch.");
  }

  if (
    !analytics.includes("buildBenefitRetentionPlan") ||
    !analytics.includes("dailyRoutineSlots") ||
    !analytics.includes("weeklyRoutineReady") ||
    !analytics.includes("retentionScore") ||
    !analytics.includes("buildPersonalizationReadiness") ||
    !analytics.includes("personalizationReadiness") ||
    !analytics.includes("buildPersonalizedBenefitQueue") ||
    !analytics.includes("officialBenefitProviderRisk") ||
    !analytics.includes("officialBenefitFeedTransition") ||
    !analytics.includes("feedItemCount") ||
    !analytics.includes("feedItemRate") ||
    !analytics.includes("configuredEmptyFeedCount") ||
    !analytics.includes("getNewsOperationsReport") ||
    !commercializationPage.includes("benefitRetention") ||
    !commercializationPage.includes("개인화 추천 출시 준비도") ||
    !commercializationPage.includes("다음 개인화 개선 액션") ||
    !commercializationPage.includes("Provider 위험도 운영 준비도") ||
    !adminPage.includes("benefitRetention") ||
    !adminPage.includes("VER 2.0 개인화 추천 운영") ||
    !adminPage.includes("개인화 추천 개선 액션") ||
    !smoke.includes("Metrics missing benefit retention score") ||
    !smoke.includes("Metrics missing personalization readiness rate") ||
    !smoke.includes("Metrics missing official benefit provider risk details") ||
    !smoke.includes("Metrics missing official benefit feed transition providers") ||
    !smoke.includes("Metrics missing official external feed item count") ||
    !smoke.includes("Commercialization page missing benefit retention readiness") ||
    !smoke.includes("Commercialization page missing personalization readiness") ||
    !smoke.includes("Commercialization page missing official benefit provider risk readiness") ||
    !smoke.includes("Admin dashboard missing benefit retention operation summary") ||
    !smoke.includes("Admin dashboard missing personalization readiness operation summary")
  ) {
    fail("benefit retention metrics", "Metrics, admin, and commercialization pages should expose daily routine, personalization readiness, and official benefit provider risk for V2 retention operations.");
  } else {
    pass("benefit retention metrics", "Metrics, admin, and commercialization pages expose daily routine, personalization readiness, and official benefit provider risk for V2 retention operations.");
  }

  if (
    !healthRoute.includes("operationalStatus") ||
    !healthRoute.includes("verifiedLinkRate") ||
    !healthRoute.includes("claimGuideRate") ||
    !healthRoute.includes("buildClaimEffortSummary") ||
    !healthRoute.includes("getNewsOperationsReport") ||
    !healthRoute.includes("claimEffortReady") ||
    !healthRoute.includes("claimEffortEasyCount") ||
    !healthRoute.includes("freeBenefitDeals") ||
    !healthRoute.includes("buildPersonalizationReadiness") ||
    !healthRoute.includes("personalizationReadyRate") ||
    !healthRoute.includes("personalizationQueuesReady") ||
    !healthRoute.includes("getOperationalEnvReadiness") ||
    !healthRoute.includes("operationalEnvReadyRate") ||
    !healthRoute.includes("officialBenefitFresh") ||
    !healthRoute.includes("officialBenefitFreshnessHours") ||
    !healthRoute.includes("officialBenefitVisibleCount") ||
    !healthRoute.includes("officialBenefitReadyCategories") ||
    !healthRoute.includes("officialBenefitRefreshAllOk") ||
    !healthRoute.includes("officialBenefitProviderRiskOk") ||
    !healthRoute.includes("officialBenefitProviderDangerCount") ||
    !healthRoute.includes("officialBenefitFeedTransitionStatus") ||
    !healthRoute.includes("officialBenefitFeedReadinessRate") ||
    !healthRoute.includes("officialBenefitFeedExternalItemCount") ||
    !healthRoute.includes("officialBenefitFeedSeedCount") ||
    !healthRoute.includes("officialBenefitFeedExternalItemRate") ||
    !healthRoute.includes("officialBenefitFeedConfiguredEmptyCount") ||
    !analytics.includes("operationalEnvReadiness") ||
    !envReadiness.includes("getOperationalEnvReadiness") ||
    !envReadiness.includes("NEXT_PUBLIC_SITE_URL") ||
    !envReadiness.includes("ADMIN_EXPORT_TOKEN") ||
    !commercializationPage.includes("운영 환경 설정 준비도") ||
    !commercializationPage.includes("운영 환경 다음 액션") ||
    !smoke.includes("Health API missing V2 operational readiness") ||
    !smoke.includes("Health API claim guide rate is below launch threshold") ||
    !smoke.includes("Health API missing claim effort readiness") ||
    !smoke.includes("Health API missing personalization readiness rate") ||
    !smoke.includes("Health API missing operational env readiness rate") ||
    !smoke.includes("Health API official benefit feed is stale") ||
    !smoke.includes("Health API missing official benefit category coverage") ||
    !smoke.includes("Health API official benefit provider risk should be launch-safe") ||
    !smoke.includes("Health API missing official benefit feed transition status") ||
    !smoke.includes("Health API missing official external feed item count") ||
    !smoke.includes("Metrics missing operational env readiness rate") ||
    !smoke.includes("Commercialization page missing operational env readiness")
  ) {
    fail("operational health checks", "Health API should expose V2 link, free benefit, claim-guide, personalization, official benefit feed freshness, provider risk, and deployment environment readiness with smoke coverage.");
  } else {
    pass("operational health checks", "Health API exposes V2 link, free benefit, claim-guide, personalization, official benefit feed freshness, provider risk, and deployment environment readiness with smoke coverage.");
  }

  if (
    !todayBenefitsRoute.includes("buildTodayBenefitQueue") ||
    !todayBenefitQueue.includes("free-first") ||
    !todayBenefitQueue.includes("coupon-before-pay") ||
    !todayBenefitQueue.includes("apptech-point") ||
    !todayBenefitQueue.includes("verified-purchase") ||
    !todayBenefitQueue.includes("audience: \"guest\"") ||
    !todayBenefitQueue.includes("loginRequiredFor") ||
    !todayBenefitQueue.includes("redirectUrl: `/go/${deal.id}`") ||
    !adminDailyQueueRoute.includes("buildTodayBenefitQueue") ||
    !adminDailyQueueRoute.includes("operationAction") ||
    !adminDailyQueueRoute.includes("canAccessAdmin") ||
    !adminPage.includes("운영 큐 JSON 보기") ||
    !weeklyCalendarRoute.includes("buildWeeklyBenefitCalendar") ||
    !dailyBriefingRoute.includes("buildDailyBenefitBriefing") ||
    !dailyRoutineRoute.includes("buildDailyRoutinePlan") ||
    !benefitDecisionGuideRoute.includes("buildBenefitDecisionGuide") ||
    !benefitDecisionGuideRoute.includes("audience: \"guest\"") ||
    !benefitClaimEffortRoute.includes("buildClaimEffortSummary") ||
    !benefitClaimEffortRoute.includes("audience: \"guest\"") ||
    !personalizedBenefitsRoute.includes("buildPersonalizedBenefitQueue") ||
    !weeklyBenefitCalendar.includes("operationNote") ||
    !weeklyBenefitCalendar.includes("recommendedSurface") ||
    !dailyBenefitBriefing.includes("buildTodayBenefitQueue") ||
    !dailyBenefitBriefing.includes("buildWeeklyBenefitCalendar") ||
    !dailyBenefitBriefing.includes("audience: \"guest\"") ||
    !dailyRoutinePlan.includes("buildTodayBenefitQueue") ||
    !dailyRoutinePlan.includes("오늘 3분 혜택 루틴") ||
    !dailyRoutinePlan.includes("audience: \"guest\"") ||
    !benefitDecisionGuide.includes("돈 안 쓰고 받을 것") ||
    !benefitDecisionGuide.includes("결제 전 적용할 것") ||
    !benefitDecisionGuide.includes("오늘 놓치기 쉬운 것") ||
    !benefitDecisionGuide.includes("구매처가 확인된 것") ||
    !claimEffort.includes("buildClaimEffortSummary") ||
    !claimEffort.includes("간편 수령") ||
    !claimEffort.includes("조건 확인") ||
    !claimEffort.includes("마감 주의") ||
    !freeBenefitsClient.includes('from "@/lib/deals/claimEffort"') ||
    !accountPanel.includes('from "@/lib/deals/claimEffort"') ||
    !personalizedBenefitQueue.includes("dealMatchesPersonalInterest") ||
    !personalizedBenefitQueue.includes("audience: \"guest\"") ||
    !personalizedBenefitQueue.includes("personalizedSignals") ||
    !homePage.includes("buildDailyBenefitBriefing") ||
    !homePage.includes("buildDailyRoutinePlan") ||
    !homePage.includes("buildBenefitDecisionGuide") ||
    !homePage.includes("buildPersonalizedBenefitQueue") ||
    !homePage.includes("오늘 혜택 브리핑") ||
    !homePage.includes("브리핑 API 보기") ||
    !homePage.includes("루틴 API 보기") ||
    !homePage.includes("개인화 혜택 추천 API") ||
    !freeBenefitsClient.includes("buildWeeklyBenefitCalendar") ||
    !freeBenefitsPage.includes("getDeals") ||
    !smoke.includes("today benefits api") ||
    !smoke.includes("admin daily benefit queue api") ||
    !smoke.includes("weekly benefit calendar api") ||
    !smoke.includes("daily benefit briefing api") ||
    !smoke.includes("daily benefit routine api") ||
    !smoke.includes("benefit decision guide api") ||
    !smoke.includes("benefit claim effort api") ||
    !smoke.includes("personalized benefits api") ||
    !smoke.includes("Today benefits API should keep guest access") ||
    !smoke.includes("Weekly benefit calendar should keep guest access") ||
    !smoke.includes("Daily benefit briefing should keep guest access") ||
    !smoke.includes("Daily benefit routine should keep guest access") ||
    !smoke.includes("Benefit decision guide should keep guest access") ||
    !smoke.includes("Benefit claim effort should keep guest access") ||
    !smoke.includes("Personalized benefits should keep guest access") ||
    !smoke.includes("Home page missing daily benefit briefing") ||
    !smoke.includes("Home page missing daily routine API and step summary") ||
    !smoke.includes("Home page missing full five-step daily benefit routine") ||
    !smoke.includes("Home page missing reusable personalized benefit API card") ||
    !smoke.includes("Today benefits API missing optional login boundary") ||
    !smoke.includes("Admin daily queue missing operation actions")
  ) {
    fail("today benefits api", "Daily benefit API, weekly calendar API, daily briefing API, daily routine API, claim-effort API, personalized benefit API, and protected admin operation queue should expose guest-accessible free, coupon, apptech, and verified purchase routines with smoke coverage.");
  } else {
    pass("today benefits api", "Daily benefit API, weekly calendar API, daily briefing API, daily routine API, claim-effort API, personalized benefit API, and protected admin operation queue expose guest-accessible free, coupon, apptech, and verified purchase routines with smoke coverage.");
  }

  if (!dealsRoute.includes("normalizeDeals(mockDeals") || dealsRoute.includes("mock 데이터로 대체")) {
    fail("api fallback normalization", "Deals API fallback should normalize canonical fields and avoid public mock wording.");
  } else {
    pass("api fallback normalization", "Deals API fallback keeps canonical fields and user-facing fallback copy.");
  }

  if (!dealsRoute.includes("priceBand") || !dealRepository.includes("getPriceBandRange") || !smoke.includes("priceBand=under10000")) {
    fail("price filter data path", "Deals API, repository, and smoke tests should support price band filtering.");
  } else {
    pass("price filter data path", "Deals API and repository support commercial price band filtering.");
  }

  if (!quality.includes("export function isVerifiedPurchaseLink") || !quality.includes("export function getLinkQualityScore") || !quality.includes("export function getDealQualityNotice") || !quality.includes("export function getPurchaseTrustChecklist")) {
    fail("shared link quality rules", "Link verification and scoring should be centralized in lib/deals/quality.ts.");
  } else if (
    !dealRepository.includes("isVerifiedPurchaseLink") ||
    !homePage.includes("isVerifiedPurchaseLink") ||
    !featuredSections.includes("getLinkQualityScore") ||
    !dealCard.includes("isVerifiedPurchaseLink") ||
    !dealCard.includes("getDealQualityNotice") ||
    !dealCard.includes("품질 안내") ||
    !liveDealFeed.includes("isVerifiedPurchaseLink") ||
    !purchaseConfirmSheet.includes("isVerifiedPurchaseLink")
  ) {
    fail("shared link quality rules", "Home, repository, featured sections, cards, live feed, and purchase confirmation should use shared link quality rules and customer-facing quality notices.");
  } else {
    pass("shared link quality rules", "Verified purchase filtering, scoring, trust labels, and customer-facing quality notices use shared link quality rules.");
  }

  const linkPolicy = JSON.parse(await text("data/linkQualityPolicy.json"));
  const verifyLinksScript = await text("scripts/verify-product-links.mjs");
  const verifyLinksLiveScript = await text("scripts/verify-product-links-live.mjs");
  const verifyProductsScript = await text("scripts/verify-products.mjs");
  const linkQualityRegressionScript = await text("scripts/link-quality-regression.mjs");
  const exposureDoctorScript = await text("scripts/exposure-policy-doctor.mjs");
  const refreshDealsScript = await text("scripts/refresh-deals.mjs");
  const linkReport = JSON.parse(await text("reports/link-validation.json"));
  const productReport = JSON.parse(await text("reports/product-quality.json"));
  const linkRegressionReport = JSON.parse(await text("reports/link-quality-regression.json"));
  const exposureReport = JSON.parse(await text("reports/exposure-policy.json"));
  const linkPolicyIssues = [];

  for (const key of ["blockedHosts", "searchPatterns", "unavailableTextPatterns", "productDetailSignals", "officialBenefitUrlSignals", "exposurePolicy", "launchGate"]) {
    if (!(key in linkPolicy)) linkPolicyIssues.push(`policy missing ${key}`);
  }

  for (const [label, source] of [
    ["link validator", linkValidator],
    ["provider types", providerTypes],
    ["verify links", verifyLinksScript],
    ["verify products", verifyProductsScript],
    ["link quality regression", linkQualityRegressionScript],
    ["refresh deals", refreshDealsScript],
    ["exposure doctor", exposureDoctorScript]
  ]) {
    if (!source.includes("linkQualityPolicy")) linkPolicyIssues.push(`${label} should read linkQualityPolicy`);
  }

  if (linkReport.policy?.source !== "data/linkQualityPolicy.json") linkPolicyIssues.push("link-validation report should record policy source");
  if (!Array.isArray(linkReport.auditedItems) || !linkReport.auditedItems.length) linkPolicyIssues.push("link-validation report should include product-level auditedItems");
  const requiredAuditFields = [
    "id",
    "title",
    "mallName",
    "category",
    "source",
    "sourceName",
    "originalUrl",
    "finalUrl",
    "affiliateUrl",
    "eventUrl",
    "linkType",
    "availability",
    "validationStatus",
    "validationReason",
    "lastCheckedAt",
    "priorityScore",
    "isHidden"
  ];
  const auditedItemsMissingFields = Array.isArray(linkReport.auditedItems)
    ? linkReport.auditedItems.filter((item) => requiredAuditFields.some((field) => !(field in item))).slice(0, 5)
    : [];
  if (auditedItemsMissingFields.length) {
    linkPolicyIssues.push(`link-validation auditedItems should include launch audit fields for every product: ${auditedItemsMissingFields.map((item) => item.id ?? "unknown").join(", ")}`);
  }
  if (!linkReport.exposureAudit || linkReport.exposureAudit.searchItems !== 0 || linkReport.exposureAudit.soldOutItems !== 0) {
    linkPolicyIssues.push("link-validation report should include zero-search, zero-sold-out exposureAudit");
  }
  if (!linkReport.httpStatusSummary || !("http404" in linkReport.httpStatusSummary) || !("robotsBlocked" in linkReport.httpStatusSummary)) {
    linkPolicyIssues.push("link-validation report should record HTTP/redirect summary");
  }
  if (
    linkReport.launchGate?.passed !== true ||
    (linkReport.launchGate?.actual?.exposedSearchLinks ?? 1) !== 0 ||
    (linkReport.launchGate?.actual?.exposedSoldOutLinks ?? 1) !== 0 ||
    (linkReport.launchGate?.actual?.exposedBrokenLinks ?? 1) !== 0 ||
    (linkReport.launchGate?.actual?.exposedInvalidUrls ?? 1) !== 0
  ) {
    linkPolicyIssues.push("link-validation report should include a passed launchGate with zero exposed search, sold-out, broken, and invalid URLs");
  }
  if (
    !linkReport.liveProbeReviewSummary ||
    !("hardFailureCount" in linkReport.liveProbeReviewSummary) ||
    !("transientNetworkCount" in linkReport.liveProbeReviewSummary) ||
    !("accessProtectedCount" in linkReport.liveProbeReviewSummary) ||
    !linkReport.liveProbeReasonCounts ||
    !linkReport.liveProbeHostFailureCounts
  ) {
    linkPolicyIssues.push("link-validation report should separate hard live failures from seller access protections");
  }
  if ((linkReport.liveProbeReviewSummary?.hardFailureCount ?? 0) !== 0 || (linkReport.liveProbeReviewSummary?.sellerUnavailableSignals ?? 0) !== 0) {
    linkPolicyIssues.push("link-validation live probe should have zero hard failures and zero unavailable-text signals for launch");
  }
  if (!linkReport.liveProbe?.enabled || (linkReport.liveProbe?.checked ?? 0) < (linkReport.totalDeals ?? 0)) {
    linkPolicyIssues.push("link-validation report should include a non-strict live probe pass over every curated deal before release evidence is accepted");
  }
  for (const field of ["http404", "http410", "http5xx", "timeout", "robotsBlocked", "unavailableText", "redirected", "finalUrlChanged"]) {
    if (!(field in (linkReport.httpStatusSummary ?? {}))) {
      linkPolicyIssues.push(`link-validation report missing live HTTP metric ${field}`);
    }
  }
  if (!verifyLinksLiveScript.includes("DEAL_LINK_LIVE_PROBE") || !verifyLinksLiveScript.includes("--strict") || !verifyLinksLiveScript.includes("--body")) {
    linkPolicyIssues.push("verify:links:live should expose optional live probe, strict mode, and body probe controls");
  }
  if (productReport.policy?.source !== "data/linkQualityPolicy.json") linkPolicyIssues.push("product-quality report should record policy source");
  if (!linkQualityRegressionScript.includes("coupang search blocked") || !linkQualityRegressionScript.includes("sold out evidence blocked") || !linkQualityRegressionScript.includes("official benefit allowed")) {
    linkPolicyIssues.push("link quality regression should cover search, sold-out, community, unsafe, and official benefit samples");
  }
  if (linkRegressionReport.ok !== true) linkPolicyIssues.push("link-quality-regression report should pass");
  if (
    (linkRegressionReport.summary?.exposedSearchLinks ?? 1) !== 0 ||
    (linkRegressionReport.summary?.exposedSoldOutLinks ?? 1) !== 0 ||
    (linkRegressionReport.summary?.badExposedItems ?? 1) !== 0
  ) {
    linkPolicyIssues.push("link-quality-regression report should prove zero exposed search, sold-out, and bad exposed items");
  }
  if ((linkRegressionReport.summary?.samplePassed ?? 0) < 8) {
    linkPolicyIssues.push("link-quality-regression should pass all bad/good URL samples");
  }
  if (
    !quality.includes("getDealExposureDecision") ||
    !quality.includes("isPolicySearchLikeUrl") ||
    !quality.includes("isPolicyHomeOnlyUrl") ||
    !quality.includes("isPolicyBlockedHost") ||
    !quality.includes("missing_final_url")
  ) {
    linkPolicyIssues.push("shared quality rules should block unsafe final URLs before exposure");
  }
  if (!exposureReport.ok || exposureReport.summary?.badExposedItems !== 0 || exposureReport.summary?.searchLinksExposed !== 0 || exposureReport.summary?.soldOutExposed !== 0 || exposureReport.launchGate?.passed !== true) {
    linkPolicyIssues.push("exposure-policy report should prove zero bad/search/sold-out exposed items");
  }
  if (
    !exposureDoctorScript.includes("buildSyntheticExposureScenarios") ||
    !exposureDoctorScript.includes("synthetic-search-url") ||
    !exposureDoctorScript.includes("synthetic-unsafe-url") ||
    !exposureDoctorScript.includes("synthetic-community-url")
  ) {
    linkPolicyIssues.push("exposure-policy doctor should include synthetic bad-public-exposure scenarios");
  }
  if (
    exposureReport.syntheticExposureScenarios?.ok !== true ||
    (exposureReport.syntheticExposureScenarios?.blockedNegativeSamples ?? 0) < 8 ||
    !Array.isArray(exposureReport.syntheticExposureScenarios?.results) ||
    !exposureReport.syntheticExposureScenarios.results.some((item) => item.id === "synthetic-search-url" && item.issues?.includes("search_or_category_url")) ||
    !exposureReport.syntheticExposureScenarios.results.some((item) => item.id === "synthetic-unsafe-url" && item.issues?.includes("unsafe_protocol_or_invalid_url"))
  ) {
    linkPolicyIssues.push("exposure-policy report should prove synthetic search, unsafe, sold-out, hidden, community, and missing-final-url samples are blocked");
  }
  if ((linkReport.exposedSearchLinks ?? 0) !== 0 || (productReport.searchLinks ?? 0) !== 0) linkPolicyIssues.push("search links should be zero");
  if ((linkReport.exposedSoldOutLinks ?? 0) !== 0 || (productReport.soldOutProducts ?? 0) !== 0) linkPolicyIssues.push("sold-out/ended links should be zero");

  if (linkPolicyIssues.length) {
    fail("link validation policy system", linkPolicyIssues.join("; "));
  } else {
    pass("link validation policy system", "Runtime validators, provider intake, refresh pipeline, QA scripts, non-strict live probes, and reports share the link quality policy with zero exposed search or sold-out links.");
  }

  const requiredOfficialOutboundHosts = [
    "kakaopay.com",
    "payco.com",
    "tmembership.co.kr",
    "cgv.co.kr",
    "bgfretail.com",
    "homeplus.co.kr",
    "yogiyo.co.kr",
    "hyundaicard.com",
    "shinhancard.com",
    "bhc.co.kr",
    "pay.naver.com"
  ];
  const missingOfficialOutboundHosts = requiredOfficialOutboundHosts.filter((host) => !affiliate.includes(`"${host}"`));

  if (missingOfficialOutboundHosts.length || !smoke.includes('["d060", "cgv.co.kr"]') || !smoke.includes('["d073", "hyundaicard.com"]') || !smoke.includes('["d115", "bhc.co.kr"]')) {
    fail(
      "official benefit outbound allowlist",
      `Verified official benefit links should remain openable through redirect routes. Missing hosts: ${missingOfficialOutboundHosts.join(", ") || "smoke coverage"}`
    );
  } else {
    pass("official benefit outbound allowlist", "Verified official benefit domains are allowlisted and smoke-tested through redirect routes.");
  }

  if (
    !trust.includes("export function getDealSourceReadiness") ||
    !trust.includes("verifiedRate") ||
    !trust.includes("conditionReadyCount") ||
    !productionProvider.includes("getConfiguredProductionFeedUrls") ||
    !productionProvider.includes("getEnvFeedUrls") ||
    !productionProvider.includes("DEAL_PRODUCTION_FEED_URLS") ||
    !productionProvider.includes("validatePartnerFeed") ||
    !productionProvider.includes("normalizePartnerFeed") ||
    !productionProvider.includes("AbortController") ||
    !sourcesRoute.includes("operationPolicy") ||
    !sourcesRoute.includes("getEnvFeedUrls") ||
    !sourcesRoute.includes("configuredProductionFeeds") ||
    !sourcesRoute.includes("allowedSources") ||
    !sourcesRoute.includes("blockedSources") ||
    !sourcesRoute.includes("getNewsOperationsReport") ||
    !sourcesRoute.includes("officialBenefitProviderReadiness") ||
    !sourcesRoute.includes("officialBenefitProviderRiskOk") ||
    !sourcesRoute.includes("officialSourceCatalog") ||
    !sourcesRoute.includes("getOfficialSourceCatalogSummary") ||
    !sourcesRoute.includes("thinCategories") ||
    !sourcesRoute.includes("allowedUse") ||
    !sourcesRoute.includes("blockedUse") ||
    !sourcesRoute.includes("configuredFeedUrls") ||
    !officialSourceCatalogReportScript.includes("data/officialSourceCatalog.json") ||
    !officialSourceCatalogReportScript.includes("requiredCategories") ||
    !officialSourceCatalogReportScript.includes("requiredProviders") ||
    !officialSourceCatalogReportScript.includes("blocked_or_placeholder_host") ||
    !officialSourceCatalogReportScript.includes("search_or_result_url") ||
    !officialSourceCatalogReportScript.includes("home_or_landing_url") ||
    !officialSourceCatalogReportScript.includes("getEnvFeedUrls") ||
    !feedTransitionReportScript.includes("getEnvFeedUrls") ||
    !officialSourceCatalogDoc.includes("공식 소스 카탈로그") ||
    officialSourceCatalogReport.ok !== true ||
    (officialSourceCatalogReport.catalogCount ?? 0) < 30 ||
    (officialSourceCatalogReport.highPriorityCount ?? 0) < 10 ||
    (officialSourceCatalogReport.missingCategories ?? []).length > 0 ||
    (officialSourceCatalogReport.thinCategories ?? []).length > 0 ||
    (officialSourceCatalogReport.missingProviders ?? []).length > 0 ||
    !adminPage.includes("운영 피드 전환 준비도") ||
    !adminPage.includes("공식 API·제휴 피드로 바꿀 때 볼 품질 기준") ||
    !adminPage.includes("파트너 피드 사전 검수 리포트") ||
    !adminPage.includes("ready / needs_fix 행을 먼저 분리합니다") ||
    !adminPage.includes("feed:validate --report") ||
    !adminPage.includes("운영 반영 전 목표는 100%") ||
    !adminPage.includes("PartnerFeedDryRunPanel") ||
    !partnerFeedDryRunPanel.includes("운영 피드 붙여넣기 검증") ||
    !partnerFeedDryRunPanel.includes("dry-run 검증 실행") ||
    !partnerFeedDryRunPanel.includes("/api/admin/import") ||
    !partnerFeedDryRunPanel.includes("needs_fix") ||
    !partnerFeedDryRunPanel.includes("invalid=0") ||
    !partnerFeedDryRunPanel.includes("행별 검수 결과") ||
    !partnerFeedDryRunPanel.includes("수정 필요 필드") ||
    !partnerFeedDryRunPanel.includes("result?.rows") ||
    !partnerFeedDryRunPanel.includes("primaryUrlField") ||
    !partnerFeedDryRunPanel.includes("ready JSON 내보내기") ||
    !partnerFeedDryRunPanel.includes("needs_fix 리포트 내보내기") ||
    !feedImport.includes("readyItems") ||
    !feedImport.includes("fixReport") ||
    !dataSourceRunbook.includes("Production JSON Feed") ||
    !dataSourceRunbook.includes("DEAL_PRODUCTION_FEED_URLS") ||
    !dataSourceRunbook.includes("npm run feed:validate") ||
    !dataSourceRunbook.includes("--report") ||
    !dataSourceRunbook.includes("readyRate=100") ||
    !dataSourceRunbook.includes("dealType") ||
    !dataSourceRunbook.includes("benefitSummary") ||
    !dataSourceRunbook.includes("sourceName") ||
    !partnerFeedValidator.includes("DEAL_PRODUCTION_FEED_URLS") ||
    !partnerFeedValidator.includes("writeReport") ||
    !partnerFeedValidator.includes("readyRate") ||
    !partnerFeedValidator.includes("needs_fix") ||
    !partnerFeedValidator.includes("커뮤니티 원문 또는 placeholder") ||
    !partnerFeedValidator.includes("실제 상품/혜택 상세 URL") ||
    !partnerFeedValidator.includes("allowedDealTypes") ||
    !partnerFeedValidator.includes("혜택 유형 dealType") ||
    !partnerFeedValidator.includes("사용자가 바로 이해할 혜택 요약") ||
    !partnerFeedValidator.includes("혜택/특가 마감 시간") ||
    !partnerFeedValidator.includes("Partner feed validation passed") ||
    !dataSourceRunbook.includes("npm run feed:production:doctor") ||
    !productionFeedDoctor.includes("DEAL_DATA_MODE") ||
    !productionFeedDoctor.includes("DEAL_PRODUCTION_FEED_URLS") ||
    !productionFeedDoctor.includes("source === \"production\"") ||
    !productionFeedDoctor.includes("configuredProductionFeeds") ||
    !productionFeedDoctor.includes("blocked-community") ||
    !productionFeedDoctor.includes("Production feed doctor passed") ||
    !smoke.includes("Sources API missing source readiness summary") ||
    !smoke.includes("Sources API missing configured production feed count") ||
    !smoke.includes("Sources API missing official benefit provider readiness details") ||
    !smoke.includes("Sources API missing official benefit feed transition providers") ||
    !smoke.includes("Sources API missing official external feed item count") ||
    !smoke.includes("sources csv export") ||
    !smoke.includes("Sources CSV missing source catalog rows") ||
    !smoke.includes("Sources CSV missing feed transition rows") ||
    !smoke.includes("Sources CSV missing official feed source mix columns") ||
    !sourcesRoute.includes("officialBenefitFeedTransitionReadiness") ||
    !sourcesRoute.includes("feedItemCount") ||
    !sourcesRoute.includes("feedItemRate") ||
    !sourcesRoute.includes("configuredEmptyFeed") ||
    !sourcesRoute.includes("configuredOfficialBenefitFeeds") ||
    !sourcesRoute.includes("buildSourcesCsv") ||
    !sourcesRoute.includes("text/csv") ||
    !sourcesRoute.includes("source_catalog") ||
    !sourcesRoute.includes("feed_transition") ||
    !adminPage.includes("/api/sources?format=csv") ||
    !dataSourceRunbook.includes("/api/sources?format=csv") ||
    !officialSourceCatalogReportScript.includes("reports/official-source-catalog.csv") ||
    !officialSourceCatalogReportScript.includes("source_catalog") ||
    !officialSourceCatalogReportScript.includes("feed_transition") ||
    !officialSourceCatalogDoc.includes("CSV 리포트") ||
    !officialSourceLiveDoctorScript.includes("non_strict_live_readiness") ||
    !officialSourceLiveDoctorScript.includes("reports/official-source-live-check.csv") ||
    !officialSourceLiveDoctorScript.includes("waf_or_permission_guarded") ||
    !sourceOnboardingPlanScript.includes("reports/source-onboarding-plan.csv") ||
    !sourceOnboardingPlanScript.includes("reports/source-onboarding-env-template.env") ||
    !sourceOnboardingPlanScript.includes("buildEnvPlan") ||
    !sourceOnboardingPlanScript.includes("buildEnvTemplate") ||
    !sourceOnboardingPlanScript.includes("공식 API, RSS, 제휴 feed") ||
    !sourceFeedEnvDoctorScript.includes("source-feed-env-readiness.json") ||
    !sourceFeedEnvDoctorScript.includes("HALINDOSA_APPROVED_FEED_HOSTS") ||
    !sourceFeedEnvDoctorScript.includes("not_machine_readable_feed") ||
    !sourceFeedEnvDoctorScript.includes("unlisted_feed_host") ||
    !sourceFeedEnvDoctorScript.includes("community_or_blog_host") ||
    !sourceFeedEnvDoctorScript.includes("policyRegressionSamples") ||
    !sourceReadinessReportScript.includes("source-readiness.json") ||
    !sourceReadinessReportScript.includes("source-feed-env-readiness.json") ||
    !sourceReadinessReportScript.includes("operatorNextActions") ||
    !sourceReadinessReportScript.includes("officialUrl") ||
    !sourceReadinessReportScript.includes("finalUrl") ||
    !sourceReadinessReportScript.includes("httpStatus") ||
    !sourceReadinessReportScript.includes("검색 결과, 커뮤니티 원문") ||
    !envExample.includes("HALINDOSA_APPROVED_FEED_HOSTS") ||
    !envExample.includes("HALINDOSA_ALLOW_DATA_FEED_URLS") ||
    !sourceOnboardingPlanReadiness.includes("envPlan") ||
    !sourceOnboardingPlanReadiness.includes("envTemplate") ||
    !sourceOnboardingPlanReadiness.includes("getOfficialSourceOnboardingPlan") ||
    !sourceFeedEnvReadiness.includes("getOfficialSourceFeedEnvReadiness") ||
    !sourceFeedEnvReadiness.includes("SourceFeedEnvReadinessReport") ||
    !sourceFeedEnvReadiness.includes("source-feed-env-readiness.json") ||
    !sourceReadinessReportReadiness.includes("getOfficialSourceReadiness") ||
    !sourceReadinessReportReadiness.includes("SourceReadinessReport") ||
    !sourceReadinessReportReadiness.includes("source-readiness.json") ||
    !adminSourceOnboardingRoute.includes("canAccessAdmin") ||
    !adminSourceOnboardingRoute.includes("format === \"csv\"") ||
    !adminSourceOnboardingRoute.includes("format === \"env\"") ||
    !adminSourceOnboardingRoute.includes("source-onboarding-plan.csv") ||
    !adminSourceOnboardingRoute.includes("halindosa-source-feed-template.env") ||
    !adminSourceFeedEnvRoute.includes("canAccessAdminRequest") ||
    !adminSourceFeedEnvRoute.includes("admin-source-feed-env") ||
    !adminSourceFeedEnvRoute.includes("getOfficialSourceFeedEnvReadiness") ||
    !adminSourceReadinessRoute.includes("canAccessAdminRequest") ||
    !adminSourceReadinessRoute.includes("admin-source-readiness") ||
    !adminSourceReadinessRoute.includes("getOfficialSourceReadiness") ||
    !adminSourceReadinessRoute.includes("format === \"csv\"") ||
    !adminSourceReadinessRoute.includes("text/csv") ||
    !adminSourceReadinessRoute.includes("officialUrl=") ||
    !adminSourceReadinessRoute.includes("finalUrl=") ||
    !officialSourceLiveReadiness.includes("getOfficialSourceLiveReport") ||
    !adminSourceLiveRoute.includes("canAccessAdmin") ||
    !adminSourceLiveRoute.includes("format === \"csv\"") ||
    !adminSourceLiveRoute.includes("official-source-live-check.csv") ||
    !adminPage.includes("공식 소스 live 접근성") ||
    !adminPage.includes("protected/guarded 소스") ||
    !adminPage.includes("/api/admin/source-live") ||
    !adminPage.includes("공식 소스 온보딩 우선순위") ||
    !adminPage.includes("다음 연결 우선순위 TOP 10") ||
    !adminPage.includes("/api/admin/source-onboarding") ||
    !adminPage.includes("feed env") ||
    !adminPage.includes("공식 feed 환경변수 안전성") ||
    !adminPage.includes("feed env JSON") ||
    !adminPage.includes("/api/admin/source-feed-env") ||
    !adminPage.includes("공식 소스 통합 준비도") ||
    !adminPage.includes("오늘 공식 feed 전환 판단") ||
    !adminPage.includes("/api/admin/source-readiness") ||
    !adminPage.includes("source readiness CSV") ||
    !adminPage.includes("공식 소스 보류 증빙") ||
    !adminPage.includes("HTTP 상태") ||
    !adminPage.includes("운영 사유") ||
    !adminPage.includes("officialUrl") ||
    !adminPage.includes("finalUrl") ||
    !smoke.includes("admin source live readiness api") ||
    !smoke.includes("Admin source live report should use non-strict live readiness mode") ||
    !smoke.includes("admin source onboarding plan api") ||
    !smoke.includes("Admin source onboarding plan should pass") ||
    !smoke.includes("admin source onboarding env template") ||
    !smoke.includes("admin source feed env readiness api") ||
    !smoke.includes("Admin source feed env report should pass") ||
    !smoke.includes("admin source readiness rollup api") ||
    !smoke.includes("Admin source readiness report should pass") ||
    !smoke.includes("admin source readiness rollup csv") ||
    !smoke.includes("Admin dashboard missing source readiness guarded-source evidence table") ||
    !officialSourceLiveDoc.includes("공식 소스 라이브 접근성 점검") ||
    !officialSourceLiveDoc.includes("무단 크롤링을 수행하지 않으며") ||
    officialSourceLiveReport.ok !== true ||
    officialSourceLiveReport.mode !== "non_strict_live_readiness" ||
    (officialSourceCatalogReport.catalogCount ?? 0) < 30 ||
    officialSourceCatalogMissingCategories.length > 0 ||
    officialSourceCatalogThinCategories.length > 0 ||
    (officialSourceLiveReport.totalSources ?? 0) < 30 ||
    officialSourceBlockingLiveCount > 0 ||
    !officialSourceHighPriorityOk ||
    sourceOnboardingPlanReport.ok !== true ||
    (sourceOnboardingPlanReport.totalSources ?? 0) < 30 ||
    (sourceOnboardingPlanReport.blockedLiveIssues ?? 0) > 0 ||
    !Array.isArray(sourceOnboardingPlanReport.topActions) ||
    sourceOnboardingPlanReport.topActions.length < 5 ||
    !Array.isArray(sourceOnboardingPlanReport.envPlan) ||
    sourceOnboardingPlanReport.envPlan.length < 5 ||
    !String(sourceOnboardingPlanReport.envTemplate ?? "").includes("OFFICIAL_EVENT_FEED_URLS") ||
    !sourceOnboardingEnvTemplate.includes("OFFICIAL_EVENT_FEED_URLS") ||
    !sourceOnboardingEnvTemplate.includes("검색 결과, 커뮤니티 원문") ||
    sourceFeedEnvReport.ok !== true ||
    !Array.isArray(sourceFeedEnvReport.checkedKeys) ||
    sourceFeedEnvReport.checkedKeys.length < 6 ||
    !sourceFeedEnvReport.policy?.machineReadableFeedRequired ||
    !sourceFeedEnvReport.policy?.officialCatalogHostOrApprovedPartnerHostRequired ||
    !Array.isArray(sourceFeedEnvReport.allowedCatalogHosts) ||
    sourceFeedEnvReport.allowedCatalogHosts.length < 25 ||
    !Array.isArray(sourceFeedEnvReport.policyRegressionSamples) ||
    sourceFeedEnvReport.policyRegressionSamples.some((sample) => sample.passed !== true) ||
    sourceReadinessReport.ok !== true ||
    sourceReadinessReport.launchGateStatus !== "passed" ||
    (sourceReadinessReport.summary?.officialSourceCandidates ?? 0) < 30 ||
    (sourceReadinessReport.summary?.visibleOfficialBenefits ?? 0) < 40 ||
    (sourceReadinessReport.summary?.feedEnvFailedCount ?? 1) !== 0 ||
    (sourceReadinessReport.summary?.blockedLiveIssues ?? 1) !== 0 ||
    !Array.isArray(sourceReadinessReport.gates) ||
    sourceReadinessReport.gates.length < 6 ||
    sourceReadinessReport.gates.some((gate) => gate.ok !== true) ||
    !Array.isArray(sourceReadinessReport.operatorNextActions) ||
    sourceReadinessReport.operatorNextActions.length < 3 ||
    !sourceOnboardingPlanDoc.includes("공식 소스 온보딩 우선순위") ||
    !sourceOnboardingPlanDoc.includes("다음 연결 우선순위 TOP 10") ||
    !sourceOnboardingPlanDoc.includes("환경변수 연결 템플릿") ||
    !sourceFeedEnvDoc.includes("공식 feed 환경변수 안전성 리포트") ||
    !sourceFeedEnvDoc.includes("정책 회귀 샘플") ||
    !sourceFeedEnvDoc.includes("검색 결과, 커뮤니티 원문") ||
    !sourceReadinessDoc.includes("공식 소스 통합 준비도") ||
    !sourceReadinessDoc.includes("검색 결과, 커뮤니티 원문") ||
    !sourceReadinessDoc.includes("npm run source:readiness:report") ||
    !dataSourceRunbook.includes("source:feed-env:doctor") ||
    !dataSourceRunbook.includes("source:readiness:report") ||
    !smoke.includes("Sources API found danger official benefit provider risk") ||
    !smoke.includes("Admin dashboard missing partner feed validation report board") ||
    !smoke.includes("Admin dashboard missing paste-in feed dry-run panel") ||
    !smoke.includes("Admin dashboard missing row-level feed dry-run review summary") ||
    !smoke.includes("Admin dashboard missing feed dry-run export actions") ||
    !smoke.includes("partner feed sample validation api")
  ) {
    fail("source readiness operation", "Sources API, official source catalog, live source accessibility report, production provider, docs, production feed doctor, and admin dashboard should expose source readiness, official benefit provider readiness, safe production JSON feed loading, allowed source policy, blocked source policy, verified link quality, at least 30 official source candidates, no thin categories, no stale/timeout/network/server-error source candidates, and high-priority source coverage for production feed transition.");
  } else {
    pass("source readiness operation", "Sources API, official source catalog, live source accessibility report, production provider, docs, production feed doctor, and admin dashboard expose source readiness, official benefit provider readiness, safe production JSON feed policy, 30+ official source candidates, and clean live accessibility gates for official API, RSS, and partner feed transition.");
  }

  if (!dealRepository.includes("export async function findDealByIdLive") || /findDealByIdLive[\s\S]{0,180}findDealById\(id\)[\s\S]{0,80}await getDeals/.test(dealRepository)) {
    fail("live deal detail source", "Live deal detail lookup should query the Deal repository provider before falling back to cached/default data.");
  } else {
    pass("live deal detail source", "Deal detail lookup reads provider data first and only falls back to cached/default data when necessary.");
  }

  if (!quality.includes("getLinkReviewPriority") || !quality.includes("reviewReason") || !adminPage.includes("priorityLabels") || !adminPage.includes("linkReviewSummary") || !adminPage.includes("오늘 처리할 링크 작업") || !adminPage.includes("현재 이동 URL")) {
    fail("admin link review workflow", "Admin link review queue should expose priority, reason, confidence, and current destination URL.");
  } else if (
    !adminPage.includes("CSV 다운로드") ||
    !smoke.includes("finalPurchaseUrl") ||
    !smoke.includes("reviewPriority") ||
    !adminExportRoute.includes("buildTodayBenefitQueue") ||
    !adminExportRoute.includes("dailyQueueSections") ||
    !adminExportRoute.includes("dailyQueueAction") ||
    !adminPage.includes("오늘 혜택 큐 CSV 준비") ||
    !smoke.includes("CSV missing daily benefit queue export fields")
  ) {
    fail("admin link review export", "Admin CSV export should include link review status, priority, destination, and daily benefit queue operation fields.");
  } else {
    pass("admin link review workflow", "Admin link review queue and CSV export expose priority, reason, confidence, current destination URL, and daily benefit queue operation fields.");
  }

  const commercializationSnippets = [
    "할인도사 출시 준비 보드",
    "출시 직전 체크",
    "실제 운영 전환",
    "Supabase OAuth Provider",
    "남은 링크 검수",
    "구매 링크 확인율",
    "출시 준비 단계",
    "다음 우선 조치",
    "오늘 혜택 큐 운영 준비도",
    "홈, 알림 센터, 향후 푸시가 같은",
    "비회원 열람 큐",
    "API 응답 확인",
    "출시 전 혜택 판단표 준비도",
    "고객이 먼저 누르는 4가지 혜택 축",
    "무료 수령",
    "결제 전 쿠폰",
    "마감 혜택",
    "구매처 확인 상품",
    "판단표 API 확인",
    "혜택 데이터 품질 요약",
    "무료·쿠폰·포인트",
    "신고/종료 점검",
    "운영 액션 큐",
    "출시 전 먼저 점검할 혜택 유형",
    "매일 재방문 루틴 준비도",
    "재방문 점수",
    "다음 재방문 개선 액션",
    "주간 재방문 혜택 캘린더",
    "포인트, 무료 샘플, 쿠폰, 장보기",
    "캘린더 API 확인",
    "가입 없는 혜택"
  ];
  const missingCommercializationSnippets = commercializationSnippets.filter((snippet) => !commercializationPage.includes(snippet));
  if (
    missingCommercializationSnippets.length ||
    !commercializationPage.includes("buildBenefitDecisionGuide") ||
    !commercializationPage.includes("launchDecisionActions") ||
    !commercializationPage.includes("claimEffortLaunchQueue") ||
    !commercializationPage.includes("수령 난이도 출시 점검") ||
    !commercializationPage.includes("간편 수령, 조건 확인, 마감 주의 균형") ||
    !commercializationPage.includes("수령 난이도 API 확인") ||
    !commercializationPage.includes("buildTodayBenefitQueue") ||
    !commercializationPage.includes("buildWeeklyBenefitCalendar") ||
    !smoke.includes("Commercialization page missing launch benefit decision readiness") ||
    !smoke.includes("Commercialization page missing launch decision action axes") ||
    !smoke.includes("Commercialization page missing claim effort launch readiness") ||
    !smoke.includes("Commercialization page missing daily benefit queue readiness") ||
    !smoke.includes("Commercialization page missing weekly benefit calendar readiness")
  ) {
    fail("commercial launch readiness page", `Missing snippets: ${missingCommercializationSnippets.join(", ")}`);
  } else {
    pass("commercial launch readiness page", "Commercialization page exposes launch readiness metrics, daily benefit queue readiness, retention readiness, external setup, and remaining link review risk.");
  }

  const requiredCommercialDealFields = [
    "productUrl",
    "searchUrl",
    "originalUrl",
    "clickCount",
    "likeCount",
    "isSoldOut",
    "updatedAt",
    "dealType",
    "benefitSummary",
    "sourceName",
    "sourceUrl",
    "reliabilityScore",
    "isVerified",
    "isExpired",
    "savingsAmount",
    "savingsRate",
    "subCategory",
    "verifiedProductUrl",
    "lastVerifiedAt",
    "viewCount",
    "reportCount",
    "isFirstComeFirstServed",
    "requiresSignup",
    "shippingFee",
    "couponCondition",
    "minimumOrderAmount",
    "isStackable",
    "claimCta",
    "eligibilityChecklist",
    "claimSteps",
    "claimWarning"
  ];
  const missingCommercialDealFields = requiredCommercialDealFields.filter((field) => !dealTypes.includes(field));
  if (missingCommercialDealFields.length) {
    fail("commercial deal fields", `Missing Deal fields: ${missingCommercialDealFields.join(", ")}`);
  } else {
    pass("commercial deal fields", "Deal type includes product/search URL split and commercial engagement fields.");
  }

  if (
    !claimGuide.includes("buildBenefitClaimGuide") ||
    !normalizer.includes("buildBenefitClaimGuide") ||
    !mockDeals.includes("buildBenefitClaimGuide") ||
    !smoke.includes("missing eligibilityChecklist") ||
    !smoke.includes("missing claimSteps") ||
    !smoke.includes("missing claimWarning")
  ) {
    fail("structured benefit claim guide", "Deals should include structured eligibility checklist, claim steps, and warning text from a shared claim guide.");
  } else {
    pass("structured benefit claim guide", "Deals expose structured eligibility checklist, claim steps, and warning text for benefit claim UX.");
  }

  if (
    !freeBenefitsPage.includes("FreeBenefitsClient") ||
    !freeBenefitsClient.includes("무료 혜택 전용 탭") ||
    !freeBenefitsClient.includes("무료 샘플") ||
    !freeBenefitsClient.includes("체험단") ||
    !freeBenefitsClient.includes("편의점") ||
    !freeBenefitsClient.includes("배달/외식") ||
    !freeBenefitsClient.includes("무료 혜택 검색") ||
    !freeBenefitsClient.includes("무료 혜택 정렬") ||
    !freeBenefitsClient.includes("수령 전 30초 확인") ||
    !freeBenefitsClient.includes("무료 혜택도 조건을 알고 받아야 합니다") ||
    !freeBenefitsClient.includes("문화 초대권 찾기") ||
    !freeBenefitsClient.includes("초대권 보기") ||
    !freeBenefitsClient.includes("배송비 확인") ||
    !freeBenefitsClient.includes("benefitReadinessPlan") ||
    !freeBenefitsClient.includes("혜택 준비물 체크") ||
    !freeBenefitsClient.includes("받기 전 필요한 조건만 먼저 정리합니다") ||
    !freeBenefitsClient.includes("회원가입 없이 받을 혜택") ||
    !freeBenefitsClient.includes("쿠폰 조건 확인 필요") ||
    !freeBenefitsClient.includes("filteredReadinessSummary") ||
    !freeBenefitsClient.includes("현재 결과 혜택 판단 요약") ||
    !freeBenefitsClient.includes("검색 결과를 받기 쉬운 조건부터 다시 정리합니다") ||
    !freeBenefitsClient.includes("바로 받을 가능성") ||
    !freeBenefitsClient.includes("실제 링크 확인") ||
    !freeBenefitsClient.includes("filteredRiskReview") ||
    !freeBenefitsClient.includes("혜택 헛걸음 방지 점검") ||
    !freeBenefitsClient.includes("현재 결과에서 놓치기 쉬운 조건을 먼저 봅니다") ||
    !freeBenefitsClient.includes("숨은 비용 확인") ||
    !freeBenefitsClient.includes("선착순·마감 위험") ||
    !freeBenefitsClient.includes("couponEventBoard") ||
    !freeBenefitsClient.includes("쿠폰·이벤트 조건 보드") ||
    !freeBenefitsClient.includes("최소 주문 금액") ||
    !freeBenefitsClient.includes("중복 가능 여부") ||
    !freeBenefitsClient.includes("배달앱 쿠폰") ||
    !freeBenefitsClient.includes("페이·카드·포인트") ||
    !freeBenefitsClient.includes("appTechRewardDeals") ||
    !freeBenefitsClient.includes("앱테크·페이·멤버십") ||
    !freeBenefitsClient.includes("매일 눌러 챙길 적립 혜택을 따로 모았습니다") ||
    !freeBenefitsClient.includes("앱테크 혜택 바로 받기") ||
    !freeBenefitsClient.includes("markBenefitVisit") ||
    !freeBenefitsClient.includes("무료 혜택 출석 기록") ||
    !freeBenefitsClient.includes("오늘도 혜택을 확인한 기록을 기기에 남겼습니다") ||
    !benefitVisitStreak.includes("halindosa:benefit-visit-streak") ||
    !benefitVisitStreak.includes("currentStreak") ||
    !freeBenefitsClient.includes("cultureInviteDeals") ||
    !freeBenefitsClient.includes("문화 무료 초대권") ||
    !freeBenefitsClient.includes("영화·전시·공연 혜택도 놓치지 않게 모았습니다") ||
    !freeBenefitsClient.includes("문화 혜택 바로 확인") ||
    !freeBenefitsClient.includes("문화 초대권 종료 신고") ||
    !freeBenefitsClient.includes("문화 초대권 링크 오류 신고") ||
    !freeBenefitsClient.includes("zeroCostStarterPack") ||
    !freeBenefitsClient.includes("0원 혜택 스타터팩") ||
    !freeBenefitsClient.includes("처음 왔다면 이 혜택부터 확인하세요") ||
    !freeBenefitsClient.includes("무료 혜택만 보기") ||
    !freeBenefitsClient.includes("0원 혜택 바로 받기") ||
    !freeBenefitsClient.includes("스타터팩은 결제 부담이 낮은 혜택") ||
    !freeBenefitsClient.includes("수령 전 체크") ||
    !freeBenefitsClient.includes("deal.eligibilityChecklist") ||
    !freeBenefitsClient.includes("혜택 수령 단계") ||
    !freeBenefitsClient.includes("deal.claimSteps") ||
    !freeBenefitsClient.includes("deal.claimWarning") ||
    !freeBenefitsClient.includes("오늘 무료 혜택 루틴") ||
    !freeBenefitsClient.includes("돈 쓰기 전에 이 순서로 챙기세요") ||
    !freeBenefitsClient.includes("오늘 우선 확인 큐") ||
    !freeBenefitsClient.includes("weeklyRoutineProgress") ||
    !freeBenefitsClient.includes("이번 주 혜택 루틴 진행률") ||
    !freeBenefitsClient.includes("챙김, 찜, 재방문 예약을 한눈에 이어갑니다") ||
    !freeBenefitsClient.includes("루틴 완료") ||
    (!freeBenefitsClient.includes("weeklyBenefitPlan") || !freeBenefitsClient.includes("buildWeeklyBenefitCalendar")) ||
    !freeBenefitsClient.includes("이번 주 혜택 캘린더") ||
    !freeBenefitsClient.includes("매일 들어와서 챙길 이유를 만들었습니다") ||
    !weeklyBenefitCalendar.includes("출석·포인트 적립") ||
    !weeklyBenefitCalendar.includes("마트·편의점 행사") ||
    !weeklyBenefitCalendar.includes("토") ||
    !weeklyBenefitCalendar.includes("일") ||
    !freeBenefitsClient.includes("fiveMinuteChecklist") ||
    !freeBenefitsClient.includes("5분 혜택 체크리스트") ||
    !freeBenefitsClient.includes("처음 들어온 사용자가 바로 따라할 순서") ||
    !freeBenefitsClient.includes("applyChecklistPreset") ||
    !freeBenefitsClient.includes("benefitGuardrails") ||
    !freeBenefitsClient.includes("혜택별 최종 확인 기준") ||
    !freeBenefitsClient.includes("buildBenefitDecisionGuide") ||
    !freeBenefitsClient.includes("sharedBenefitDecisionGuide") ||
    !freeBenefitsClient.includes("무료혜택 공통 판단표") ||
    !freeBenefitsClient.includes("홈·알림과 같은 기준으로 오늘 받을 혜택을 고릅니다") ||
    !freeBenefitsClient.includes("applySharedDecisionGuide") ||
    !freeBenefitsClient.includes("판단표 API 보기") ||
    !freeBenefitsClient.includes("decisionCards") ||
    !freeBenefitsClient.includes("무료 혜택 빠른 판단") ||
    !freeBenefitsClient.includes("받기 전에 가장 중요한 조건만 먼저 고르세요") ||
    !freeBenefitsClient.includes("getPriorityScore") ||
    !freeBenefitsClient.includes("getPriorityReason") ||
    !freeBenefitsClient.includes("결제 전 쿠폰 챙기기") ||
    !freeBenefitsClient.includes("가입 없이 받기") ||
    !freeBenefitsClient.includes("선착순 혜택") ||
    !freeBenefitsClient.includes("ClaimEffortFilter") ||
    !freeBenefitsClient.includes("getClaimEffort") ||
    !freeBenefitsClient.includes("claimEffortSummary") ||
    !freeBenefitsClient.includes("무료 혜택 수령 난이도") ||
    !freeBenefitsClient.includes("헛걸음 줄이도록 받기 쉬운 순서로 고릅니다") ||
    !freeBenefitsClient.includes("간편 수령") ||
    !freeBenefitsClient.includes("조건 확인") ||
    !freeBenefitsClient.includes("마감 주의") ||
    !freeBenefitsClient.includes("진행 중만 보기") ||
    !freeBenefitsClient.includes("activeBenefitCount") ||
    !freeBenefitsClient.includes("종료·품절 가능 혜택") ||
    !freeBenefitsClient.includes("sourceOverview") ||
    !freeBenefitsClient.includes("혜택 출처·조건 점검") ||
    !freeBenefitsClient.includes("받기 전에 출처와 조건을 먼저 봅니다") ||
    !freeBenefitsClient.includes("dailyMissionCards") ||
    !freeBenefitsClient.includes("오늘 혜택 미션") ||
    !freeBenefitsClient.includes("하루에 세 가지만 챙기면 충분합니다") ||
    !freeBenefitsClient.includes("무료 혜택 1개 챙기기") ||
    !freeBenefitsClient.includes("쿠폰 1개 저장하기") ||
    !freeBenefitsClient.includes("내일 볼 루틴 예약") ||
    !freeBenefitsClient.includes("내가 챙긴 혜택 기록") ||
    !freeBenefitsClient.includes("오늘 실제로 챙긴 혜택을 남겨보세요") ||
    !freeBenefitsClient.includes("buildPersonalizedBenefitQueue") ||
    !freeBenefitsClient.includes("무료혜택 개인화 이어보기") ||
    !freeBenefitsClient.includes("개인화 API 보기") ||
    !freeBenefitsClient.includes("claimedFollowUpPlan") ||
    !freeBenefitsClient.includes("챙긴 혜택 다음 방문 이어보기") ||
    !freeBenefitsClient.includes("오늘 기록을 기준으로 내일 볼 혜택을 정리합니다") ||
    !freeBenefitsClient.includes("아직 안 챙긴 무료 혜택") ||
    !freeBenefitsClient.includes("결제 전 다시 볼 쿠폰") ||
    !freeBenefitsClient.includes("마감 전 놓치기 쉬운 혜택") ||
    !freeBenefitsClient.includes("nextVisitPlan") ||
    !freeBenefitsClient.includes("내일 다시 볼 혜택 예약") ||
    !freeBenefitsClient.includes("오늘 챙긴 뒤 다음 방문 순서를 남깁니다") ||
    !freeBenefitsClient.includes("내일 아침 먼저 볼 혜택") ||
    !freeBenefitsClient.includes("퇴근 전 확인할 쿠폰") ||
    !freeBenefitsClient.includes("마감 전 재확인") ||
    !freeBenefitsClient.includes("readBenefitReturnReservations") ||
    !freeBenefitsClient.includes("benefitReturnPlan") ||
    !freeBenefitsClient.includes("내 혜택 재방문 예약함") ||
    !freeBenefitsClient.includes("비회원도 기기에만 다음 방문 루틴을 저장합니다") ||
    !freeBenefitsClient.includes("아침 무료 혜택") ||
    !freeBenefitsClient.includes("저녁 쿠폰 점검") ||
    !freeBenefitsClient.includes("toggleClaimed") ||
    !freeBenefitsClient.includes("claimedBenefitIds") ||
    !claimedBenefits.includes("toggleClaimedBenefit") ||
    !claimedBenefits.includes("halindosa:claimed-benefits") ||
    !claimedBenefits.includes("claimedBenefitUpdatedEvent") ||
    !benefitSavingsDiary.includes("claimedBenefitUpdatedEvent") ||
    !claimedBenefitAlertSummary.includes("claimedBenefitUpdatedEvent") ||
    !accountPanel.includes("claimedBenefitUpdatedEvent") ||
    !homePage.includes("claimedBenefitUpdatedEvent") ||
    !freeBenefitsClient.includes("BenefitSavingsDiary") ||
    !accountPanel.includes("BenefitSavingsDiary") ||
    !benefitSavingsDiary.includes("절약 다이어리") ||
    !benefitSavingsDiary.includes("다음 절약 행동") ||
    !savingsDiary.includes("buildSavingsDiarySummary") ||
    !freeBenefitsClient.includes("제공처 확인") ||
    !freeBenefitsClient.includes("실제 링크 확인") ||
    !freeBenefitsClient.includes("배송비:") ||
    !freeBenefitsClient.includes("혜택 조건 요약") ||
    !freeBenefitsClient.includes("최소금액:") ||
    !freeBenefitsClient.includes("혜택 찜") ||
    !freeBenefitsClient.includes("toggleFavorite(deal.id)") ||
    !freeBenefitsClient.includes("혜택 공유") ||
    !freeBenefitsClient.includes("shareDeal(deal)") ||
    !freeBenefitsClient.includes("reason=expired") ||
    !freeBenefitsClient.includes("reason=sold_out") ||
    !freeBenefitsClient.includes("품절 신고") ||
    !freeBenefitsClient.includes("deal.claimCta") ||
    !smoke.includes("free benefits page") ||
    !smoke.includes("Free benefits page missing visit streak record") ||
    !smoke.includes("Free benefits page missing pre-claim condition summary") ||
    !smoke.includes("Free benefits page missing culture invitation quick filter") ||
    !smoke.includes("Free benefits page missing daily benefit mission") ||
    !smoke.includes("Free benefits page missing benefit readiness checklist") ||
    !smoke.includes("Free benefits page missing readiness filter actions") ||
    !smoke.includes("Free benefits page missing filtered readiness summary") ||
    !smoke.includes("Free benefits page missing wasted-visit prevention review") ||
    !smoke.includes("Free benefits page missing coupon event condition board") ||
    !smoke.includes("Free benefits page missing apptech reward routine rail") ||
    !smoke.includes("Free benefits page missing culture invitation benefit rail") ||
    !smoke.includes("Free benefits page missing zero-cost starter pack") ||
    !smoke.includes("Free benefits page missing zero-cost starter pack actions") ||
    !smoke.includes("Free benefits page missing structured benefit claim guide") ||
    !smoke.includes("Free benefits page missing priority benefit queue") ||
    !smoke.includes("Free benefits page missing weekly routine progress") ||
    !smoke.includes("Free benefits page missing weekly benefit calendar") ||
    !smoke.includes("Free benefits page missing guided benefit checklist") ||
    !smoke.includes("Free benefits page missing shared benefit decision guide") ||
    !smoke.includes("Free benefits page missing shared decision guide API action") ||
    !smoke.includes("Free benefits page missing quick decision rail") ||
    !smoke.includes("Free benefits page missing source and condition trust summary") ||
    !smoke.includes("Free benefits page missing claimed benefit tracking") ||
    !smoke.includes("Free benefits page missing savings diary") ||
    !smoke.includes("Mypage missing savings diary") ||
    !smoke.includes("Free benefits page missing personalized follow-up queue") ||
    !smoke.includes("Free benefits page missing claimed benefit follow-up plan") ||
    !smoke.includes("Free benefits page missing next visit benefit plan") ||
    !smoke.includes("Free benefits page missing local return reservation board") ||
    !smoke.includes("Free benefits page missing top-level favorite action") ||
    !smoke.includes("Free benefits page missing top-level share action") ||
    !smoke.includes("Free benefits page missing sold-out and link-error report actions") ||
    !smoke.includes("Free benefits page missing claim effort filter") ||
    !smoke.includes("Free benefits page missing claim effort cards") ||
    !smoke.includes("Free benefits page missing active-benefit status filter")
  ) {
    fail("free benefits dedicated page", "Free benefit discovery should have an available page, claimed-benefit tracking, priority queue, weekly routine, claim-effort filters, active-benefit filter, and smoke coverage.");
  } else {
    pass("free benefits dedicated page", "Free benefits, coupons, convenience store, mart, delivery, point offers, claimed-benefit tracking, today's priority queue, weekly routine, claim-effort filtering, and active-benefit filtering remain available without occupying primary navigation.");
  }

  if (!redirectUrl.includes("/go/") || !goRoute.includes("recordDealClick") || !goRoute.includes("buildOutboundUrl")) {
    fail("go redirect route", "Purchase buttons should use /go/[dealId], record clicks, and resolve outbound URL server-side.");
  } else {
    pass("go redirect route", "Purchase redirect uses /go/[dealId] with click logging and server-side outbound URL resolution.");
  }

  if (
    !redirectUrl.includes("buildNativeSafeDealUrl") ||
    !redirectUrl.includes("resolveDealDestinationUrl") ||
    !homePage.includes("buildNativeSafeDealUrl") ||
    !dealDetailActions.includes("buildNativeSafeDealUrl") ||
    !favoritesPage.includes("buildNativeSafeDealUrl")
  ) {
    fail("native purchase navigation", "Capacitor static builds should fall back to a safe external product URL when /go is unavailable.");
  } else {
    pass("native purchase navigation", "Native purchase buttons keep web redirect tracking when available and fall back to a safe product URL in static app bundles.");
  }

  if (!sitemap.includes("/commercialization") || !sitemap.includes("/guide") || !sitemap.includes("/support") || !sitemap.includes("/privacy")) {
    fail("launch sitemap coverage", "Sitemap should include public guide, support, privacy, and commercialization readiness pages.");
  } else {
    pass("launch sitemap coverage", "Sitemap includes service guide, support, privacy, and commercialization readiness pages.");
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
      phrases: ["자동 검증", "수동 확인", "데이터/링크 신뢰도", "테스트 종료 기준", "링크 검수 큐", "docs/device-qa-checklist.md", "test:mobile-ux", "MOBILE_UX_REPORT.md", "오늘 바로 볼 특가", "오른쪽 fade", "옆으로 넘기기"]
    },
    {
      name: "readme qa guidance",
      file: "README.md",
      phrases: ["모바일 UX", "test:mobile-ux", "MOBILE_UX_REPORT.md", "외부 링크/이미지/이미지 운영 doctor", "release:doctor", "오늘 바로 볼 특가", "오른쪽 fade", "옆으로 넘기기"]
    },
    {
      name: "runbook harness guidance",
      file: "docs/RUNBOOK.md",
      phrases: ["모바일 UX compact first-screen 검사", "MOBILE_UX_REPORT.md", "test:mobile-ux", "qa", "harness", "오늘 바로 볼 특가", "오른쪽 fade", "옆으로 넘기기"]
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
      phrases: ["npm run env:doctor:production", "npm run test:env", "npm run public:url:doctor", "public URL doctor", "공개 개인정보처리방침/고객지원 URL", "/privacy", "/support", "/sitemap.xml", "/robots.txt", "signed AAB", "오늘 바로 볼 특가", "오른쪽 fade", "옆으로 넘기기"]
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
      phrases: ["Android 기기 확인", "iOS 기기 또는 Simulator 확인", "로그인과 계정 데이터", "구매 링크와 신고", "스토어 제출 직전 판정", "docs/device-qa-record-template.md", "npm run device:qa:manifest", "docs/DEVICE_QA_MANIFEST.md", "npm run test:mobile-ux", "MOBILE_UX_REPORT.md", "오늘 바로 볼 특가", "오른쪽 fade", "옆으로 넘기기"]
    },
    {
      name: "device qa record template content",
      file: "docs/device-qa-record-template.md",
      phrases: ["테스트 개요", "Android 기기 기록", "iOS 기기 기록", "구매 링크 샘플 검수", "남은 Critical Issue", "기록 보안 원칙", "실기기 QA 매니페스트", "npm run device:qa:manifest", "주문번호", "keystore", "오늘 바로 볼 특가 가로 레일", "오른쪽 fade", "옆으로 넘기기"]
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
      phrases: ["할인도사 Known Issues", "Critical", "Current Readiness Snapshot", "Operational Risks", "Next Improvements", "Sensitive Data Rule", "Direct product or official benefit links", "Fallback image backlog", "manual device checks remain", "keystore password", "OAuth client secret", "Supabase service-role key"]
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

function checkSigningAndArtifacts() {
  const keystoreExample = "android/keystore.properties.example";
  const keystore = "android/keystore.properties";
  const aab = "android/app/build/outputs/bundle/release/app-release.aab";
  const apk = "android/app/build/outputs/apk/debug/app-debug.apk";
  const signingDoctor = "scripts/android-signing-doctor.mjs";

  if (!existsSync(join(root, keystoreExample))) fail("keystore example", "Missing android/keystore.properties.example.");
  else pass("keystore example", "Example signing config is present.");

  if (!existsSync(join(root, signingDoctor))) {
    fail("Android signing doctor", "Missing scripts/android-signing-doctor.mjs.");
  } else {
    const signingDoctorBody = readFileSync(join(root, signingDoctor), "utf8");
    const requiredSigningDoctorSnippets = [
      "android/app/build.gradle signing setup is incomplete",
      "Tracked signing secret files found",
      "android/keystore.properties.example",
      "signingConfig signingConfigs.release",
      "storePassword=CHANGE_ME"
    ];
    const missingSigningDoctorSnippets = requiredSigningDoctorSnippets.filter((snippet) => !signingDoctorBody.includes(snippet));

    if (missingSigningDoctorSnippets.length) {
      fail("Android signing doctor", `Signing doctor should guard Gradle signing, examples, and tracked secrets. Missing: ${missingSigningDoctorSnippets.join(", ")}`);
    } else {
      pass("Android signing doctor", "Signing doctor guards Gradle release signing, local secret ignores, example file, docs, and tracked signing secrets.");
    }
  }

  if (!existsSync(join(root, keystore))) {
    pass("release keystore", "Not committed. Create android/keystore.properties locally or use Android Studio signing wizard.");
  } else {
    pass("release keystore", "Local keystore.properties exists. Keep it private.");
  }

  if (fileSize(aab) <= 0) fail("release AAB", "Run npm run android:bundle to generate app-release.aab.");
  else pass("release AAB", `${aab} (${fileSize(aab)} bytes)`);

  if (fileSize(apk) <= 0) fail("debug APK", "Run npm run android:debug to generate app-debug.apk.");
  else pass("debug APK", `${apk} (${fileSize(apk)} bytes)`);
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

function checkStoreAssets() {
  const sourceAssets = ["assets/store/halindosa-logo-source.jpg", "scripts/generate-brand-assets.ps1"];
  const requiredPngAssets = [
    ["Play Store icon", "assets/store/play-store-icon-512.png", 512, 512],
    ["Play Store feature graphic", "assets/store/feature-graphic-1024x500.png", 1024, 500],
    ["PWA 192 icon", "public/halindosa-icon-192.png", 192, 192],
    ["PWA 512 icon", "public/halindosa-icon-512.png", 512, 512],
    ["iOS App Store icon", "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", 1024, 1024]
  ];
  const missingSource = sourceAssets.filter((file) => fileSize(file) <= 0);
  const issues = [];
  const assetGenerator = readFileSync(join(root, "scripts/generate-brand-assets.ps1"), "utf8");
  const androidColors = readFileSync(join(root, "android/app/src/main/res/values/colors.xml"), "utf8");
  const androidLauncherBackground = readFileSync(join(root, "android/app/src/main/res/values/ic_launcher_background.xml"), "utf8");

  if (!assetGenerator.includes("#FF173F") || !assetGenerator.includes("feature-graphic-1024x500.png") || !assetGenerator.includes("AppIcon-512@2x.png")) {
    issues.push("brand asset generator should create bright red store, PWA, Android, and iOS assets");
  }

  if (!androidColors.includes("#FF173F") || !androidColors.includes("#FF2A4F") || !androidLauncherBackground.includes("#FF173F")) {
    issues.push("Android icon and splash colors should use the bright V2 red tokens");
  }

  for (const [label, asset, width, height] of requiredPngAssets) {
    const fullPath = join(root, asset);

    if (!existsSync(fullPath)) {
      issues.push(`${label} missing: ${asset}`);
      continue;
    }

    try {
      const buffer = readFileSync(fullPath);
      const isPng = buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
      const actualWidth = isPng ? buffer.readUInt32BE(16) : 0;
      const actualHeight = isPng ? buffer.readUInt32BE(20) : 0;

      if (!isPng) issues.push(`${label} should be PNG: ${asset}`);
      else if (actualWidth !== width || actualHeight !== height) issues.push(`${label} expected ${width}x${height}, got ${actualWidth}x${actualHeight}`);
    } catch (error) {
      issues.push(`${label} unreadable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (missingSource.length || issues.length) fail("store assets", [...missingSource.map((file) => `Missing source: ${file}`), ...issues].join("; "));
  else pass("store assets", "Store icon, feature graphic, PWA, Android, and iOS assets have launch-ready dimensions and bright red generation support.");
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
  const refreshScript = readFileSync(join(root, "scripts/refresh-deals.mjs"), "utf8");
  const adminRoute = existsSync(join(root, adminRoutePath)) ? readFileSync(join(root, adminRoutePath), "utf8") : "";
  const exposureRoute = existsSync(join(root, exposureRoutePath)) ? readFileSync(join(root, exposureRoutePath), "utf8") : "";
  const linkLaunchGateRoute = existsSync(join(root, linkLaunchGateRoutePath)) ? readFileSync(join(root, linkLaunchGateRoutePath), "utf8") : "";
  const adminPanel = existsSync(join(root, adminPanelPath)) ? readFileSync(join(root, adminPanelPath), "utf8") : "";
  const adminPage = readFileSync(join(root, "app/admin/page.tsx"), "utf8");
  const smoke = readFileSync(join(root, "scripts/smoke.mjs"), "utf8");
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
    const requiredFields = ["fetchedCount", "normalizedCount", "insertedCount", "updatedCount", "hiddenCount", "failedCount", "providerStats", "liveProbe", "policy", "failureReasons", "generatedAt"];
    const missingFields = requiredFields.filter((field) => !(field in report));

    if (missingFields.length) issues.push(`refresh report missing ${missingFields.join(", ")}`);
    if (!Array.isArray(report.providerStats) || !report.providerStats.length) issues.push("providerStats should include provider collection status");
    if (!report.liveProbe || typeof report.liveProbe !== "object") issues.push("refresh report should include liveProbe HTTP/redirect summary");
    if (report.policy?.source !== "data/linkQualityPolicy.json") issues.push("refresh report should record shared link policy source");
    if ((report.reports?.linkValidation?.searchOrCategorySuspected ?? 0) !== 0) issues.push("refresh report still has search/category links");
    if ((report.reports?.linkValidation?.soldOutOrEndedSuspected ?? 0) !== 0) issues.push("refresh report still has sold-out/ended link signals");
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
  if (!linkLaunchGateScript.includes("failedExposureItems") || !linkLaunchGateScript.includes("reports/link-validation.json") || !linkLaunchGateScript.includes("LINK_LAUNCH_GATE.md")) {
    issues.push("link launch gate script should audit product exposure rows and write JSON/Markdown release evidence");
  }
  if (linkLaunchGateReport.ok !== true || (linkLaunchGateReport.actual?.exposedSearchLinks ?? 1) !== 0 || (linkLaunchGateReport.actual?.exposedSoldOutLinks ?? 1) !== 0 || (linkLaunchGateReport.actual?.failedExposureItems ?? 1) !== 0) {
    issues.push("reports/link-launch-gate.json should prove zero exposed search, sold-out, and failed exposure items");
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
    !smoke.includes("admin link launch gate api") ||
    !smoke.includes("admin link launch gate csv") ||
    !smoke.includes("Link launch gate should expose zero search links")
  ) {
    issues.push("admin link launch gate API/page should expose JSON/CSV final launch evidence and smoke-test zero search/sold-out/broken/invalid links");
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

  if (
    !operationOverrides.includes("hideDealManually") ||
    !operationOverrides.includes("restoreDealManually") ||
    !operationOverrides.includes("readDealOperationOverrides") ||
    !operationOverrides.includes("readDealOperationOverridesLive") ||
    !operationOverrides.includes("writeDealOperationOverrides") ||
    !operationOverrides.includes("recordDealOperationActionWithPersistence") ||
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
    !adminRoute.includes("supabase_admin_actions") ||
    !adminPage.includes("readDealOperationOverridesLive") ||
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
    (exposureReport.liveProbeReviewSummary.hardFailureCount ?? 1) !== 0 ||
    !exposureReport.liveProbeFailureReasonCounts ||
    !exposureReport.liveProbeHostFailureCounts ||
    !adminPage.includes("노출 정책 감사") ||
    !adminPage.includes("노출 감사 CSV") ||
    !adminPage.includes("상품별 노출 감사 샘플") ||
    !adminPage.includes("라이브 HTTP 검증") ||
    !adminPage.includes("강한 실패 신호") ||
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

function checkNewsDealPipeline() {
  const requiredFiles = [
    "lib/deals/providers/newsProvider.ts",
    "lib/deals/feedUrls.ts",
    "lib/deals/providers/eventNewsProvider.ts",
    "lib/deals/providers/officialEventProvider.ts",
    "lib/deals/providers/publicCouponProvider.ts",
    "lib/deals/newsOperations.ts",
    "lib/deals/newsOverrides.ts",
    "lib/deals/newsLinkPolicy.ts",
    "lib/operations/newsFeedDryRun.ts",
    "lib/operations/newsFeedPreview.ts",
    "scripts/refresh-news-deals.mjs",
    "scripts/verify-news-deals.mjs",
    "scripts/news-freshness-doctor.mjs",
    "scripts/news-feed-contract-doctor.mjs",
    "scripts/news-feed-canary.mjs",
    "scripts/news-feed-live-pipeline.mjs",
    "scripts/news-feed-preview.mjs",
    "scripts/test-news-feed-error-gate.mjs",
    "scripts/test-news-feed-dry-run.mjs",
    "scripts/feed-url-utils.mjs",
    "scripts/refresh-all.mjs",
    "data/newsDeals.seed.json",
    "data/newsFeed.sample.json",
    "data/newsFeed.sample.rss.xml",
    "data/refreshedNewsDeals.json",
    "reports/news-deals.json",
    "reports/news-freshness.json",
    "reports/news-feed-canary.json",
    "reports/news-feed-live-pipeline.json",
    "reports/news-feed-preview.json",
    "docs/NEWS_FRESHNESS_REPORT.md",
    "docs/NEWS_FEED_CANARY_REPORT.md",
    "docs/NEWS_FEED_LIVE_PIPELINE.md",
    "docs/NEWS_FEED_PREVIEW_REPORT.md",
    "docs/news-feed-contract.md",
    "reports/refresh-all.json",
    "app/api/news-deals/route.ts",
    "app/go/news/[id]/route.ts",
    "app/api/admin/news-operations/route.ts",
    "app/api/admin/news-feed-canary/route.ts",
    "app/api/admin/news-feed-live/route.ts",
    "app/api/admin/news-feed-preview/route.ts",
    "components/NewsFeedDryRunPanel.tsx",
    "components/RealtimeNewsDealsSection.tsx"
  ];
  const issues = [];
  const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
  if (missing.length) issues.push(`missing files: ${missing.join(", ")}`);

  const envExample = readFileSync(join(root, ".env.example"), "utf8");
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const refreshScript = existsSync(join(root, "scripts/refresh-news-deals.mjs")) ? readFileSync(join(root, "scripts/refresh-news-deals.mjs"), "utf8") : "";
  const verifyScript = existsSync(join(root, "scripts/verify-news-deals.mjs")) ? readFileSync(join(root, "scripts/verify-news-deals.mjs"), "utf8") : "";
  const freshnessScript = existsSync(join(root, "scripts/news-freshness-doctor.mjs")) ? readFileSync(join(root, "scripts/news-freshness-doctor.mjs"), "utf8") : "";
  const feedDoctorScript = existsSync(join(root, "scripts/news-feed-contract-doctor.mjs")) ? readFileSync(join(root, "scripts/news-feed-contract-doctor.mjs"), "utf8") : "";
  const feedCanaryScript = existsSync(join(root, "scripts/news-feed-canary.mjs")) ? readFileSync(join(root, "scripts/news-feed-canary.mjs"), "utf8") : "";
  const feedLivePipelineScript = existsSync(join(root, "scripts/news-feed-live-pipeline.mjs")) ? readFileSync(join(root, "scripts/news-feed-live-pipeline.mjs"), "utf8") : "";
  const feedPreviewScript = existsSync(join(root, "scripts/news-feed-preview.mjs")) ? readFileSync(join(root, "scripts/news-feed-preview.mjs"), "utf8") : "";
  const feedPreviewOperation = existsSync(join(root, "lib/operations/newsFeedPreview.ts")) ? readFileSync(join(root, "lib/operations/newsFeedPreview.ts"), "utf8") : "";
  const feedDryRunOperation = existsSync(join(root, "lib/operations/newsFeedDryRun.ts")) ? readFileSync(join(root, "lib/operations/newsFeedDryRun.ts"), "utf8") : "";
  const feedPreviewReport = existsSync(join(root, "reports/news-feed-preview.json")) ? JSON.parse(readFileSync(join(root, "reports/news-feed-preview.json"), "utf8")) : {};
  const feedCanaryReport = existsSync(join(root, "reports/news-feed-canary.json")) ? JSON.parse(readFileSync(join(root, "reports/news-feed-canary.json"), "utf8")) : {};
  const feedLivePipelineReport = existsSync(join(root, "reports/news-feed-live-pipeline.json")) ? JSON.parse(readFileSync(join(root, "reports/news-feed-live-pipeline.json"), "utf8")) : {};
  const feedCanaryGeneratedAt = Date.parse(String(feedCanaryReport.generatedAt ?? ""));
  const feedCanaryAgeHours = Number.isFinite(feedCanaryGeneratedAt)
    ? Math.round(((Date.now() - feedCanaryGeneratedAt) / (60 * 60 * 1000)) * 10) / 10
    : Number.POSITIVE_INFINITY;
  const feedCanaryStaleHours = Number(feedCanaryReport.staleHours ?? 24);
  const feedCanaryFreshEnough = Number.isFinite(feedCanaryAgeHours) && feedCanaryAgeHours <= feedCanaryStaleHours;
  const feedLivePipelineGeneratedAt = Date.parse(String(feedLivePipelineReport.generatedAt ?? ""));
  const feedLivePipelineAgeHours = Number.isFinite(feedLivePipelineGeneratedAt)
    ? Math.round(((Date.now() - feedLivePipelineGeneratedAt) / (60 * 60 * 1000)) * 10) / 10
    : Number.POSITIVE_INFINITY;
  const feedLivePipelineFreshEnough = Number.isFinite(feedLivePipelineAgeHours) && feedLivePipelineAgeHours <= 24;
  const feedCanaryDocs = existsSync(join(root, "docs/NEWS_FEED_CANARY_REPORT.md")) ? readFileSync(join(root, "docs/NEWS_FEED_CANARY_REPORT.md"), "utf8") : "";
  const feedLivePipelineDocs = existsSync(join(root, "docs/NEWS_FEED_LIVE_PIPELINE.md")) ? readFileSync(join(root, "docs/NEWS_FEED_LIVE_PIPELINE.md"), "utf8") : "";
  const feedPreviewDocs = existsSync(join(root, "docs/NEWS_FEED_PREVIEW_REPORT.md")) ? readFileSync(join(root, "docs/NEWS_FEED_PREVIEW_REPORT.md"), "utf8") : "";
  const configuredFeedErrorTest = existsSync(join(root, "scripts/test-news-feed-error-gate.mjs")) ? readFileSync(join(root, "scripts/test-news-feed-error-gate.mjs"), "utf8") : "";
  const feedDryRunTest = existsSync(join(root, "scripts/test-news-feed-dry-run.mjs")) ? readFileSync(join(root, "scripts/test-news-feed-dry-run.mjs"), "utf8") : "";
  const feedDryRunRegressionReport = existsSync(join(root, "reports/news-feed-dry-run-regression.json")) ? JSON.parse(readFileSync(join(root, "reports/news-feed-dry-run-regression.json"), "utf8")) : {};
  const feedUrlParser = existsSync(join(root, "lib/deals/feedUrls.ts")) ? readFileSync(join(root, "lib/deals/feedUrls.ts"), "utf8") : "";
  const scriptFeedUrlParser = existsSync(join(root, "scripts/feed-url-utils.mjs")) ? readFileSync(join(root, "scripts/feed-url-utils.mjs"), "utf8") : "";
  const newsUtils = existsSync(join(root, "scripts/news-deal-utils.mjs")) ? readFileSync(join(root, "scripts/news-deal-utils.mjs"), "utf8") : "";
  const newsDealTypes = existsSync(join(root, "types/newsDeal.ts")) ? readFileSync(join(root, "types/newsDeal.ts"), "utf8") : "";
  const refreshAllScript = existsSync(join(root, "scripts/refresh-all.mjs")) ? readFileSync(join(root, "scripts/refresh-all.mjs"), "utf8") : "";
  const newsProvider = existsSync(join(root, "lib/deals/providers/newsProvider.ts")) ? readFileSync(join(root, "lib/deals/providers/newsProvider.ts"), "utf8") : "";
  const eventNewsProvider = existsSync(join(root, "lib/deals/providers/eventNewsProvider.ts")) ? readFileSync(join(root, "lib/deals/providers/eventNewsProvider.ts"), "utf8") : "";
  const officialEventProvider = existsSync(join(root, "lib/deals/providers/officialEventProvider.ts")) ? readFileSync(join(root, "lib/deals/providers/officialEventProvider.ts"), "utf8") : "";
  const publicCouponProvider = existsSync(join(root, "lib/deals/providers/publicCouponProvider.ts")) ? readFileSync(join(root, "lib/deals/providers/publicCouponProvider.ts"), "utf8") : "";
  const newsFeedContract = existsSync(join(root, "docs/news-feed-contract.md")) ? readFileSync(join(root, "docs/news-feed-contract.md"), "utf8") : "";
  const homePage = readFileSync(join(root, "app/page.tsx"), "utf8");
  const adminPage = readFileSync(join(root, "app/admin/page.tsx"), "utf8");
  const adminNewsOperationsPanel = existsSync(join(root, "components/AdminNewsOperationsPanel.tsx"))
    ? readFileSync(join(root, "components/AdminNewsOperationsPanel.tsx"), "utf8")
    : "";
  const newsFeedDryRunPanel = existsSync(join(root, "components/NewsFeedDryRunPanel.tsx"))
    ? readFileSync(join(root, "components/NewsFeedDryRunPanel.tsx"), "utf8")
    : "";
  const adminNewsOperationsRoute = existsSync(join(root, "app/api/admin/news-operations/route.ts"))
    ? readFileSync(join(root, "app/api/admin/news-operations/route.ts"), "utf8")
    : "";
  const adminNewsFeedCanaryRoute = existsSync(join(root, "app/api/admin/news-feed-canary/route.ts"))
    ? readFileSync(join(root, "app/api/admin/news-feed-canary/route.ts"), "utf8")
    : "";
  const adminNewsFeedLiveRoute = existsSync(join(root, "app/api/admin/news-feed-live/route.ts"))
    ? readFileSync(join(root, "app/api/admin/news-feed-live/route.ts"), "utf8")
    : "";
  const adminNewsFeedPreviewRoute = existsSync(join(root, "app/api/admin/news-feed-preview/route.ts"))
    ? readFileSync(join(root, "app/api/admin/news-feed-preview/route.ts"), "utf8")
    : "";
  const newsOperations = existsSync(join(root, "lib/deals/newsOperations.ts")) ? readFileSync(join(root, "lib/deals/newsOperations.ts"), "utf8") : "";
  const realtimeNewsSection = existsSync(join(root, "components/RealtimeNewsDealsSection.tsx")) ? readFileSync(join(root, "components/RealtimeNewsDealsSection.tsx"), "utf8") : "";
  const homeOfficialBenefitAlertRail = existsSync(join(root, "components/HomeOfficialBenefitAlertRail.tsx"))
    ? readFileSync(join(root, "components/HomeOfficialBenefitAlertRail.tsx"), "utf8")
    : "";
  const newsRedirectRoute = existsSync(join(root, "app/go/news/[id]/route.ts")) ? readFileSync(join(root, "app/go/news/[id]/route.ts"), "utf8") : "";
  const newsLinkPolicy = existsSync(join(root, "lib/deals/newsLinkPolicy.ts")) ? readFileSync(join(root, "lib/deals/newsLinkPolicy.ts"), "utf8") : "";
  const smokeScript = existsSync(join(root, "scripts/smoke.mjs")) ? readFileSync(join(root, "scripts/smoke.mjs"), "utf8") : "";

  for (const key of ["DEAL_NEWS_FEED_URLS", "DEAL_NEWS_RSS_URLS", "DEAL_EVENT_NEWS_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"]) {
    if (!envExample.includes(key)) issues.push(`env example missing ${key}`);
  }

  if (!packageJson.scripts?.["refresh:news"] || !packageJson.scripts?.["verify:news"] || !packageJson.scripts?.["news:freshness:doctor"] || !packageJson.scripts?.["news:feed:doctor"] || !packageJson.scripts?.["news:feed:canary"] || !packageJson.scripts?.["news:feed:live"] || !packageJson.scripts?.["test:news-feed-errors"] || !packageJson.scripts?.["test:news-feed-dry-run"] || !packageJson.scripts?.["refresh:all"]) {
    issues.push("package scripts should expose refresh:news, verify:news, news:freshness:doctor, news:feed:doctor, news:feed:canary, news:feed:live, test:news-feed-errors, test:news-feed-dry-run, and refresh:all");
  }
  if (!String(packageJson.scripts?.qa ?? "").includes("news:freshness:doctor") || !String(packageJson.scripts?.qa ?? "").includes("news:feed:doctor") || !String(packageJson.scripts?.qa ?? "").includes("news:feed:canary") || !String(packageJson.scripts?.qa ?? "").includes("test:news-feed-errors") || !String(packageJson.scripts?.qa ?? "").includes("test:news-feed-dry-run")) {
    issues.push("qa should include news:freshness:doctor, news:feed:doctor, news:feed:canary, test:news-feed-errors, and test:news-feed-dry-run");
  }

  for (const phrase of ["not_approved_official_url", "search_or_result_url", "expired_event", "official_event_seed_and_approved_feeds"]) {
    if (!refreshScript.includes(phrase) && !verifyScript.includes(phrase) && !newsUtils.includes(phrase)) {
      issues.push(`news verification missing ${phrase}`);
    }
  }
  for (const phrase of ["buildPolicyRegressionScenarios", "news-regression-search-url", "news-regression-community-url", "news-regression-news-only-url", "news-regression-expired-event", "news-regression-unsafe-url"]) {
    if (!verifyScript.includes(phrase)) issues.push(`verify:news missing policy regression sample ${phrase}`);
  }
  for (const field of ["source", "mallName", "originalUrl", "affiliateUrl", "eventUrl", "linkType", "availability", "validationReason", "priorityScore"]) {
    if (!newsDealTypes.includes(`${field}:`) && !newsDealTypes.includes(`${field}?:`)) {
      issues.push(`NewsDeal type missing launch quality field ${field}`);
    }
    if (!newsUtils.includes(field)) {
      issues.push(`news normalization/validation missing launch quality field ${field}`);
    }
    if (!verifyScript.includes(field)) {
      issues.push(`verify:news missing launch quality field gate ${field}`);
    }
  }

  for (const step of ["refresh-deals.mjs", "refresh-news-deals.mjs", "verify-product-links.mjs", "verify-products.mjs", "verify-news-deals.mjs"]) {
    if (!refreshAllScript.includes(step)) issues.push(`refresh:all missing ${step}`);
  }
  if (
    !newsProvider.includes("createJsonFeedNewsProvider") ||
    !newsProvider.includes("fetchJsonNewsFeed") ||
    !newsProvider.includes("fetchNewsFeed") ||
    !newsProvider.includes("parseNewsFeedXmlItems") ||
    !newsProvider.includes("extractOfficialUrlFromBlock") ||
    !newsProvider.includes("isApprovedOfficialNewsUrl") ||
    !newsProvider.includes("AbortController") ||
    !eventNewsProvider.includes("DEAL_EVENT_NEWS_FEED_URLS") ||
    !officialEventProvider.includes("OFFICIAL_EVENT_FEED_URLS") ||
    !officialEventProvider.includes("DEAL_EVENT_FEED_URLS") ||
    !publicCouponProvider.includes("PUBLIC_COUPON_FEED_URLS") ||
    !feedDoctorScript.includes("data/newsFeed.sample.json") ||
    !feedDoctorScript.includes("data/newsFeed.sample.rss.xml") ||
    !feedDoctorScript.includes("sample-rss-news-with-official-link") ||
    !feedDoctorScript.includes("official href to finalUrl") ||
    !feedDoctorScript.includes("parseNewsFeedXmlItems") ||
    !feedDoctorScript.includes("validateNewsDeal") ||
    !feedPreviewScript.includes("officialLinkPromotedCount") ||
    !feedPreviewScript.includes("contract_sample_preview") ||
    !feedPreviewScript.includes("configured_feed_preview") ||
    !feedPreviewScript.includes("reports/news-feed-preview.json") ||
    !feedPreviewOperation.includes("getNewsFeedPreviewReport") ||
    !feedPreviewOperation.includes("officialLinkPromotedCount") ||
    !feedPreviewOperation.includes("exposedSearchLinkCount") ||
    !feedPreviewOperation.includes("nextActions") ||
    !feedDryRunOperation.includes("dryRunNewsFeedPreview") ||
    !feedDryRunOperation.includes("parseNewsFeedXmlItems") ||
    !feedDryRunOperation.includes("isApprovedOfficialNewsUrl") ||
    !feedDryRunOperation.includes("search_or_result_url") ||
    !feedDryRunOperation.includes("blocked_news_or_community_context_url") ||
    !adminNewsFeedPreviewRoute.includes("canAccessAdminRequest") ||
    !adminNewsFeedPreviewRoute.includes("buildPreviewCsv") ||
    !adminNewsFeedPreviewRoute.includes("text/csv") ||
    !adminNewsFeedPreviewRoute.includes("getNewsFeedPreviewReport") ||
    !adminNewsFeedPreviewRoute.includes("POST") ||
    !adminNewsFeedPreviewRoute.includes("dryRunNewsFeedPreview") ||
    !feedPreviewDocs.includes("뉴스 본문 공식 링크 승격") ||
    feedPreviewReport.officialLinkPromotedCount < 1 ||
    feedPreviewReport.summary?.exposedSearchLinkCount !== 0 ||
    feedPreviewReport.summary?.exposedNonOfficialLinkCount !== 0 ||
    !feedUrlParser.includes("parseFeedUrlList") ||
    !feedUrlParser.includes("JSON.parse") ||
    !feedUrlParser.includes("[;,](?=") ||
    !scriptFeedUrlParser.includes("parseFeedUrlList") ||
    !scriptFeedUrlParser.includes("JSON.parse") ||
    !scriptFeedUrlParser.includes("[;,](?=") ||
    !configuredFeedErrorTest.includes("not-a-halindosa-feed") ||
    !configuredFeedErrorTest.includes("/broken.txt") ||
    !configuredFeedErrorTest.includes("tags=mart,coupon") ||
    !configuredFeedErrorTest.includes("base64,") ||
    !configuredFeedErrorTest.includes("configuredFeedErrors") ||
    !configuredFeedErrorTest.includes("seedCount") ||
    !configuredFeedErrorTest.includes("feedItemCount") ||
    !configuredFeedErrorTest.includes("feedSuccessCount") ||
    !configuredFeedErrorTest.includes("collectedCount") ||
    !configuredFeedErrorTest.includes("configuredEmptyFeed") ||
    !configuredFeedErrorTest.includes("DEAL_NEWS_FEED_URLS") ||
    !configuredFeedErrorTest.includes("verify-news-deals.mjs") ||
    !feedDryRunTest.includes("dry-run-negative-search-url") ||
    !feedDryRunTest.includes("dry-run-negative-news-only") ||
    !feedDryRunTest.includes("dry-run-negative-expired-official") ||
    !feedDryRunTest.includes("news-feed-dry-run-regression.json") ||
    feedDryRunRegressionReport.ok !== true ||
    feedDryRunRegressionReport.hiddenCount < 3 ||
    !freshnessScript.includes("reports/news-freshness.json") ||
    !feedCanaryScript.includes("reports/news-feed-canary.json") ||
    !feedCanaryScript.includes("configured_empty_feed") ||
    !feedCanaryScript.includes("live_feed_ready") ||
    !feedCanaryScript.includes("seed_fallback_only") ||
    !feedLivePipelineScript.includes("source-feed-env-doctor.mjs") ||
    !feedLivePipelineScript.includes("news-feed-canary.mjs") ||
    !feedLivePipelineScript.includes("refresh-news-deals.mjs") ||
    !feedLivePipelineScript.includes("verify-news-deals.mjs") ||
    !feedLivePipelineScript.includes("refresh-all.mjs") ||
    !feedLivePipelineScript.includes("verify-product-links-live.mjs") ||
    !feedLivePipelineScript.includes("health-readiness-report.mjs") ||
    !feedLivePipelineScript.includes("reports/news-feed-live-pipeline.json") ||
    !adminNewsFeedCanaryRoute.includes("canAccessAdminRequest") ||
    !adminNewsFeedCanaryRoute.includes("buildFeedCanaryCsv") ||
    !adminNewsFeedCanaryRoute.includes("text/csv") ||
    !adminNewsFeedCanaryRoute.includes("getNewsOperationsReport") ||
    !adminNewsFeedLiveRoute.includes("canAccessAdminRequest") ||
    !adminNewsFeedLiveRoute.includes("buildLivePipelineCsv") ||
    !adminNewsFeedLiveRoute.includes("text/csv") ||
    !adminNewsFeedLiveRoute.includes("news-feed-live-pipeline.json") ||
    !freshnessScript.includes("expiredVisibleCount") ||
    !freshnessScript.includes("expiringWithin14Days") ||
    !freshnessScript.includes("lastCheckedAt") ||
    !freshnessScript.includes("officialSourceCandidates")
  ) {
    issues.push("official benefit providers should support seed fallback plus approved JSON/RSS/Atom feed ingestion with a contract doctor, canary, freshness doctor, and configured feed error regression");
  }
  if (
    feedCanaryReport.ok !== true ||
    !["seed_fallback_only", "live_feed_ready"].includes(feedCanaryReport.status) ||
    !["fresh", "due", "stale", "missing"].includes(feedCanaryReport.freshnessStatus) ||
    typeof feedCanaryReport.staleHours !== "number" ||
    !feedCanaryFreshEnough ||
    typeof feedCanaryReport.configuredFeedUrls !== "number" ||
    typeof feedCanaryReport.visibleCandidateCount !== "number"
  ) {
    issues.push("news feed canary report should pass, be fresher than the stale threshold, and expose configured feed URL and visible candidate counters");
  }
  if (
    feedLivePipelineReport.ok !== true ||
    !["seed_launch_ready", "live_feed_ready"].includes(feedLivePipelineReport.status) ||
    !feedLivePipelineFreshEnough ||
    typeof feedLivePipelineReport.configuredUrlCount !== "number" ||
    !["fresh", "due"].includes(feedLivePipelineReport.canary?.freshnessStatus) ||
    Number(feedLivePipelineReport.officialBenefits?.visibleCount ?? 0) < 40 ||
    Number(feedLivePipelineReport.officialBenefits?.exposedSearchLinkCount ?? 1) !== 0 ||
    Number(feedLivePipelineReport.officialBenefits?.exposedNonOfficialLinkCount ?? 1) !== 0 ||
    Number(feedLivePipelineReport.officialBenefits?.expiredCount ?? 1) !== 0
  ) {
    issues.push("news feed live pipeline should pass recently and prove official benefits expose no search, non-official, or expired links");
  }
  if (!adminPage.includes("canary JSON") || !adminPage.includes("canary CSV") || !smokeScript.includes("admin news feed canary api")) {
    issues.push("admin dashboard and smoke tests should expose protected official feed canary JSON/CSV checks");
  }
  if (!adminPage.includes("live JSON") || !adminPage.includes("live CSV") || !smokeScript.includes("admin news feed live pipeline api")) {
    issues.push("admin dashboard and smoke tests should expose protected official feed live pipeline JSON/CSV checks");
  }
  for (const phrase of ["공식 혜택 Feed Canary", "신선도", "연결된 feed URL", "설정 feed 공백", "npm run news:feed:canary"]) {
    if (!feedCanaryDocs.includes(phrase)) issues.push(`news feed canary docs missing ${phrase}`);
  }
  for (const phrase of ["실시간 공식 feed 운영 파이프라인", "npm run news:feed:live", "검색 결과 URL", "공식 혜택", "canary"]) {
    if (!feedLivePipelineDocs.includes(phrase)) issues.push(`news feed live pipeline docs missing ${phrase}`);
  }
  for (const phrase of ["공식 혜택 Feed 계약", "검색 결과 URL", "커뮤니티", "finalUrl", "RSS", "Atom", "본문 안 공식 링크", "npm run refresh:news", "configuredFeedErrors", "설정된 운영 feed"]) {
    if (!newsFeedContract.includes(phrase)) issues.push(`news feed contract docs missing ${phrase}`);
  }

  if (!homePage.includes("RealtimeNewsDealsSection") || !homePage.includes("/api/news-deals?limit=8") || !homePage.includes("refreshNewsDeals") || !homePage.includes("120_000")) {
    issues.push("home should show verified realtime discount news section from /api/news-deals with live refresh");
  }
  if (
    !realtimeNewsSection.includes("/go/news/") ||
    !newsRedirectRoute.includes("resolveNewsDealDestinationUrl") ||
    !newsRedirectRoute.includes("recordDealClick") ||
    !newsLinkPolicy.includes("approvedNewsHosts") ||
    !newsLinkPolicy.includes("officialSourceCatalog") ||
    !newsLinkPolicy.includes("approvedNewsHostSet")
  ) {
    issues.push("official news benefit clicks should pass through /go/news/[id] with link policy and click logging");
  }
  if (
    !homePage.includes("HomeOfficialBenefitAlertRail") ||
    !homeOfficialBenefitAlertRail.includes("readRecentNewsBenefitIds") ||
    !homeOfficialBenefitAlertRail.includes("recentNewsBenefitUpdatedEvent") ||
    !homeOfficialBenefitAlertRail.includes("재방문 혜택 큐") ||
    !homeOfficialBenefitAlertRail.includes("오늘 다시 볼 공식 혜택") ||
    !homeOfficialBenefitAlertRail.includes("관심 카테고리 공식 혜택") ||
    !homeOfficialBenefitAlertRail.includes("officialHost") ||
    !homeOfficialBenefitAlertRail.includes("target=\"_blank\"") ||
    !homeOfficialBenefitAlertRail.includes("noopener noreferrer")
  ) {
    issues.push("home should keep recent official benefit and interest news return queues");
  }

  if (!adminPage.includes("뉴스 수집 현황") || !adminPage.includes("운영 리포트 API 보기") || !adminPage.includes("Provider 위험도 CSV") || !adminPage.includes("공식 feed preview") || !adminPage.includes("Preview JSON") || !adminPage.includes("뉴스 본문 공식 링크 승격") || !adminPage.includes("NewsFeedDryRunPanel") || !adminPage.includes("공식 피드 전환 준비도") || !adminPage.includes("Provider별 성공/실패") || !adminPage.includes("실시간 feed") || !adminPage.includes("성공 feed") || !adminPage.includes("feed 공백") || !adminPage.includes("최근 20개 수집 로그") || !adminPage.includes("수동 숨김/복구/재검증 구조") || !adminPage.includes("캠페인 API 보기")) {
    issues.push("admin should expose news collection status, provider logs, CSV export, manual actions, and notification campaign operation links");
  }
  if (
    !adminPage.includes("AdminNewsOperationsPanel") ||
    !adminPage.includes("newsOperationsCsvHref") ||
    !adminNewsOperationsRoute.includes("format") ||
    !adminNewsOperationsRoute.includes("buildNewsOperationsCsv") ||
    !adminNewsOperationsRoute.includes("text/csv") ||
    !adminNewsOperationsRoute.includes("provider_risk") ||
    !adminNewsOperationsRoute.includes("feed_source_mix") ||
    !adminNewsOperationsRoute.includes("seed=") ||
    !adminNewsOperationsRoute.includes("feed=") ||
    !adminNewsOperationsRoute.includes("feed_transition") ||
    !adminNewsOperationsRoute.includes("renewal_queue") ||
    !adminNewsOperationsRoute.includes("watch_queue") ||
    !adminNewsOperationsRoute.includes("replacementCandidates") ||
    !smokeScript.includes("Admin news operations CSV should use text/csv") ||
    !smokeScript.includes("admin news feed preview api") ||
    !smokeScript.includes("Admin news feed preview CSV should use text/csv") ||
    !smokeScript.includes("Admin dashboard missing official news feed preview panel") ||
    !smokeScript.includes("Admin news feed dry-run should pass official RSS sample") ||
    !smokeScript.includes("Admin news feed dry-run should block search URL sample") ||
    !smokeScript.includes("Admin news feed dry-run should block news-only sample") ||
    !smokeScript.includes("Admin news feed dry-run should block expired official sample") ||
    !smokeScript.includes("Admin news feed dry-run should reject oversized source") ||
    !smokeScript.includes("Admin dashboard missing official news paste dry-run panel") ||
    !newsFeedDryRunPanel.includes("공식 뉴스·혜택 feed 붙여넣기 검증") ||
    !newsFeedDryRunPanel.includes("공식 feed dry-run 실행") ||
    !newsFeedDryRunPanel.includes("hiddenRows") ||
    !newsFeedDryRunPanel.includes("visibleRows") ||
    !adminNewsOperationsPanel.includes("공식 혜택 수동 운영") ||
    !adminNewsOperationsPanel.includes("runAction") ||
    !adminNewsOperationsPanel.includes("action: NewsOperationAction") ||
    !adminNewsOperationsPanel.includes("수동 숨김") ||
    !adminNewsOperationsPanel.includes("재검증 기록") ||
    !adminNewsOperationsPanel.includes("필수 혜택 카테고리 커버리지") ||
    !adminNewsOperationsPanel.includes("issueCount") ||
    !adminNewsOperationsPanel.includes("thin") ||
    !adminNewsOperationsPanel.includes("refresh:all 운영 상태") ||
    !adminNewsOperationsPanel.includes("Provider 위험도") ||
    !adminNewsOperationsPanel.includes("실패 사유별 운영 액션") ||
    !adminNewsOperationsPanel.includes("수집 로그 바로 점검") ||
    !adminNewsOperationsPanel.includes("getFailureReasonAction") ||
    !adminNewsOperationsPanel.includes("failureReasonTop10") ||
    !adminNewsOperationsPanel.includes("recentLogs") ||
    !adminNewsOperationsPanel.includes("priorityScore") ||
    !adminNewsOperationsPanel.includes("availability") ||
    !adminNewsOperationsPanel.includes("linkType") ||
    !adminNewsOperationsPanel.includes("신선도 운영") ||
    !adminNewsOperationsPanel.includes("다음 refresh 권장") ||
    !adminNewsOperationsPanel.includes("만료 임박 대체 큐") ||
    !adminNewsOperationsPanel.includes("추천 대체 소스") ||
    !adminNewsOperationsPanel.includes("renewalQueue") ||
    !adminNewsOperationsPanel.includes("operatorNextActions") ||
    !adminPage.includes("공식 혜택 다음 운영 액션") ||
    !newsOperations.includes("categoryCoverage") ||
    !newsOperations.includes("operationalRisks") ||
    !newsOperations.includes("getNewsFreshnessState") ||
    !newsOperations.includes("newsRefreshCadenceHours") ||
    !newsOperations.includes("operatorNextActions") ||
    !newsOperations.includes("providerRisks") ||
    !newsOperations.includes("providerRiskSummary") ||
    !newsOperations.includes("freshnessQueues") ||
    !newsOperations.includes("newsFreshnessReportPath") ||
    !newsOperations.includes("attachReplacementCandidates") ||
    !newsOperations.includes("getOfficialSourceOnboardingPlan") ||
    !newsOperations.includes("feedTransitionReadiness") ||
    !newsOperations.includes("buildFeedTransitionReadiness") ||
    !newsOperations.includes("seedCount") ||
    !newsOperations.includes("feedItemCount") ||
    !newsOperations.includes("feedSuccessCount") ||
    !newsOperations.includes("collectedCount") ||
    !newsOperations.includes("feedItemRate") ||
    !newsOperations.includes("configuredEmptyFeed") ||
    !refreshScript.includes("seedCount") ||
    !refreshScript.includes("feedItemCount") ||
    !refreshScript.includes("feedSuccessCount") ||
    !refreshScript.includes("collectedCount") ||
    !refreshScript.includes("configuredEmptyFeed") ||
    !newsOperations.includes("getEnvFeedUrls") ||
    !newsOperations.includes("DEAL_NEWS_FEED_URLS") ||
    !newsOperations.includes("getProviderRisk") ||
    !newsOperations.includes("requiredNewsCategories") ||
    !newsOperations.includes("minimumCategoryDealCount") ||
    !verifyScript.includes("minimumCategoryDealCount") ||
    !verifyScript.includes("thinCategories") ||
    !verifyScript.includes("policyRegression") ||
    !verifyScript.includes("configuredFeedErrors") ||
    !verifyScript.includes("searchLinkTypeExposure") ||
    !verifyScript.includes("inactiveVisibleExposure") ||
    !verifyScript.includes("missingQualityFieldCount") ||
    !newsOperations.includes("priorityScore") ||
    !newsOperations.includes("availability") ||
    !newsOperations.includes("linkType") ||
    !newsOperations.includes("durationMs") ||
    !smokeScript.includes("freshness?.cadenceHours === 6") ||
    !smokeScript.includes("operatorNextActions") ||
    !smokeScript.includes("providerRisks") ||
    !smokeScript.includes("feedTransitionReadiness") ||
    !smokeScript.includes("seed/feed source mix counters") ||
    !smokeScript.includes("external feed item count") ||
    !smokeScript.includes("configured empty feed") ||
    !smokeScript.includes("feed_source_mix")
  ) {
    issues.push("admin should provide executable hide/restore/revalidate controls plus CSV export, category coverage, provider risk, official feed transition readiness, refresh status, freshness cadence, next actions, and risk summaries for official benefit operations");
  }

  if (existsSync(join(root, "reports/news-deals.json"))) {
    const report = JSON.parse(readFileSync(join(root, "reports/news-deals.json"), "utf8"));
    if (report.ok !== true) issues.push("news-deals report should pass");
    if ((report.visibleCount ?? 0) < 40) issues.push("news-deals report should include at least 40 visible official benefits across daily benefit categories");
    const requiredNewsCategories = ["식품/생필품", "마트/편의점", "디지털/가전", "패션/뷰티", "외식/배달", "여행/숙박", "영화/문화", "카드/멤버십", "무료혜택", "정부/공공혜택"];
    const categoryCounts = report.categoryCounts ?? {};
    const missingCategories = requiredNewsCategories.filter((category) => !categoryCounts[category]);
    const thinCategories = requiredNewsCategories.filter((category) => Number(categoryCounts[category] ?? 0) > 0 && Number(categoryCounts[category] ?? 0) < 2);
    if (missingCategories.length) issues.push(`news-deals report missing required categories: ${missingCategories.join(", ")}`);
    if (thinCategories.length) issues.push(`news-deals report thin required categories: ${thinCategories.join(", ")}`);
    if (!Array.isArray(report.providerStats) || report.providerStats.length < 4) issues.push("news-deals report should include provider stats");
    if (
      Array.isArray(report.providerStats) &&
      report.providerStats.some(
        (provider) =>
          typeof provider.seedCount !== "number" ||
          typeof provider.feedItemCount !== "number" ||
          typeof provider.feedSuccessCount !== "number" ||
          typeof provider.collectedCount !== "number"
      )
    ) {
      issues.push("news-deals provider stats should separate seed fallback counts from external feed item counts");
    }
    if (Array.isArray(report.gates?.configuredFeedErrors) && report.gates.configuredFeedErrors.length > 0) issues.push("news-deals report should fail configured feed errors before release");
    if (report.gates && !Array.isArray(report.gates.configuredFeedErrors)) issues.push("news-deals report should expose configured feed error gate");
    if (report.gates?.policyRegression?.ok !== true || Number(report.gates?.policyRegression?.blockedNegativeSamples ?? 0) < 8) {
      issues.push("news-deals report should prove policy regression blocks search, community, news-only, expired, unclear, spam, missing URL, and unsafe official benefit samples");
    }
    if (!Array.isArray(report.gates?.policyRegression?.results) || !report.gates.policyRegression.results.some((item) => item.id === "news-regression-search-url" && item.hiddenReason?.includes("search_or_result_url"))) {
      issues.push("news-deals report should include a passing search URL policy regression sample");
    }
    if (!Array.isArray(report.gates?.policyRegression?.results) || !report.gates.policyRegression.results.some((item) => item.id === "news-regression-community-url" && item.hiddenReason?.includes("blocked_community_or_news_host"))) {
      issues.push("news-deals report should include a passing community URL policy regression sample");
    }
    if (!Array.isArray(report.recentLogs) || report.recentLogs.length < 5) issues.push("news-deals report should include recent collection logs");
    if ((report.exposedSearchLinkCount ?? 0) !== 0 || (report.exposedNonOfficialLinkCount ?? 0) !== 0 || (report.activeVisibleCount ?? 0) !== (report.visibleCount ?? 0)) {
      issues.push("news-deals report should expose only active official link types with zero search/non-official exposure");
    }
    if ((report.averagePriorityScore ?? 0) < 70) issues.push("news-deals report should keep average official benefit priority score above 70");
    if (!Array.isArray(report.manualActions) || report.manualActions.length < 3) issues.push("news-deals report should include manual hide/restore/revalidate actions");
    if ((report.hiddenCount ?? 0) !== 0 || (report.expiredCount ?? 0) !== 0 || (report.officialMissingCount ?? 0) !== 0) {
      issues.push("news-deals report should expose zero hidden, expired, or non-official links");
    }
  }

  if (existsSync(join(root, "reports/news-freshness.json"))) {
    const report = JSON.parse(readFileSync(join(root, "reports/news-freshness.json"), "utf8"));
    if (report.ok !== true) issues.push("news-freshness report should pass");
    if ((report.visibleCount ?? 0) < 40) issues.push("news-freshness report should include at least 40 visible official benefits");
    if ((report.expiredVisibleCount ?? 999) !== 0) issues.push("news-freshness report should show zero expired visible official benefits");
    if ((report.staleCheckedCount ?? 999) !== 0) issues.push("news-freshness report should show zero stale checked visible official benefits");
    if ((report.reportAgeHours ?? 999) > 24) issues.push("news-freshness report should be fresher than 24h");
    if ((report.officialSourceCandidates ?? 0) < 30) issues.push("news-freshness report should include at least 30 official source candidates");
    if (!Array.isArray(report.renewalQueue)) issues.push("news-freshness report should include a renewal queue");
    if (!report.categoryCounts || Object.keys(report.categoryCounts).length < 10) issues.push("news-freshness report should include category counts");
  } else {
    issues.push("reports/news-freshness.json is missing");
  }

  if (existsSync(join(root, "reports/refresh-all.json"))) {
    const report = JSON.parse(readFileSync(join(root, "reports/refresh-all.json"), "utf8"));
    if (report.ok !== true) issues.push("refresh-all report should pass");
    if ((report.newsDealsCount ?? 0) < 40) issues.push("refresh-all should include expanded official news/event benefits");
    if ((report.productDealsCount ?? 0) < 140) issues.push("refresh-all should preserve 140 verified product deals");
    if (!Array.isArray(report.providerStats?.news) || report.providerStats.news.length < 4) issues.push("refresh-all should preserve news provider stats");
  }

  if (issues.length) fail("news and official event pipeline", issues.join("; "));
  else pass("news and official event pipeline", "Approved news, official event, public coupon, refresh:news, verify:news, refresh:all, home section, admin status surfaces, and provider-risk CSV export are wired.");
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

  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const runbook = existsSync(join(root, "docs/RUNBOOK.md")) ? readFileSync(join(root, "docs/RUNBOOK.md"), "utf8") : "";
  const roadmap = existsSync(join(root, "docs/roadmap.md")) ? readFileSync(join(root, "docs/roadmap.md"), "utf8") : "";
  const releaseEvidence = existsSync(join(root, "scripts/release-evidence.mjs")) ? readFileSync(join(root, "scripts/release-evidence.mjs"), "utf8") : "";
  const healthScript = existsSync(join(root, "scripts/health-readiness-report.mjs")) ? readFileSync(join(root, "scripts/health-readiness-report.mjs"), "utf8") : "";
  const publicHealthRoute = existsSync(join(root, "app/api/health/route.ts")) ? readFileSync(join(root, "app/api/health/route.ts"), "utf8") : "";
  const healthApiRoute = existsSync(join(root, "app/api/admin/health-readiness/route.ts")) ? readFileSync(join(root, "app/api/admin/health-readiness/route.ts"), "utf8") : "";
  const adminPage = existsSync(join(root, "app/admin/page.tsx")) ? readFileSync(join(root, "app/admin/page.tsx"), "utf8") : "";
  const adminHealthPanel = existsSync(join(root, "components/AdminHealthReadinessPanel.tsx")) ? readFileSync(join(root, "components/AdminHealthReadinessPanel.tsx"), "utf8") : "";
  const smokeScript = existsSync(join(root, "scripts/smoke.mjs")) ? readFileSync(join(root, "scripts/smoke.mjs"), "utf8") : "";
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
  for (const phrase of ["productVerificationRate", "official benefit category coverage", "official feed source mix counters", "configured empty feed watch", "official feed canary", "provider risk gate", "official source readiness gate", "source-readiness.json", "refresh all pipeline", "cron refresh operations", "reports/health-readiness.json", "docs/HEALTH_READINESS_REPORT.md"]) {
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
  for (const phrase of ["운영 헬스 리포트", "검증 상품·공식 혜택 출시 게이트", "공식 혜택 카테고리 커버리지", "공식 혜택 Provider 위험도", "공식 소스 통합 준비도", "source mix", "외부 feed", "feed 공백", "feed canary", "refresh:all", "cron refresh"]) {
    if (!adminHealthPanel.includes(phrase)) issues.push(`admin health readiness panel missing ${phrase}`);
  }
  if (!smokeScript.includes("admin health readiness api") || !smokeScript.includes("/api/admin/health-readiness") || !smokeScript.includes("운영 헬스 리포트") || !smokeScript.includes("Health API missing official external feed item count") || !smokeScript.includes("Health API missing configured empty feed count") || !smokeScript.includes("Health API missing official feed canary status") || !smokeScript.includes("Admin health readiness should expose cron refresh status") || !smokeScript.includes("Admin health readiness should expose passing source readiness")) {
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
  if (!docsReport.includes("운영 헬스 리포트") || !docsReport.includes("검색 링크 노출") || !docsReport.includes("카테고리 커버리지") || !docsReport.includes("공식 혜택 source mix") || !docsReport.includes("공식 feed canary") || !docsReport.includes("공식 혜택 Provider 상태") || !docsReport.includes("공식 혜택 Provider 위험도") || !docsReport.includes("공식 소스 통합 준비도") || !docsReport.includes("자동 refresh cron 운영")) {
    issues.push("docs/HEALTH_READINESS_REPORT.md should summarize search exposure, category coverage, official benefit source mix, official benefit provider status, source readiness, provider risk, and cron refresh operation");
  }

  if (report.ok !== true) issues.push("health readiness report should pass");
  if ((report.score ?? 0) < 100) issues.push(`health readiness score should be 100, got ${report.score ?? "missing"}`);
  if ((report.product?.productDealsCount ?? 0) < 140) issues.push("health readiness should preserve at least 140 product deals");
  if ((report.product?.productVerificationRate ?? 0) < 99) issues.push("health readiness product verification rate should be >=99%");
  if ((report.product?.searchLinks ?? 0) !== 0) issues.push("health readiness should show zero search links");
  if ((report.product?.soldOutProducts ?? 0) !== 0) issues.push("health readiness should show zero sold-out product exposure");
  if ((report.officialBenefits?.visibleCount ?? 0) < 40) issues.push("health readiness should show at least 40 official benefits");
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
  if (report.sourceReadiness?.ok !== true || report.sourceReadiness?.launchGateStatus !== "passed") {
    issues.push("health readiness should include a passing official source readiness gate");
  }
  if ((report.sourceReadiness?.officialSourceCandidates ?? 0) < 30 || (report.sourceReadiness?.visibleOfficialBenefits ?? 0) < 40) {
    issues.push("health readiness source readiness summary should preserve official source and benefit counts");
  }
  if ((report.sourceReadiness?.blockedLiveIssues ?? 1) !== 0 || (report.sourceReadiness?.feedEnvFailedCount ?? 1) !== 0 || (report.sourceReadiness?.failedGateCount ?? 1) !== 0) {
    issues.push("health readiness source readiness summary should show zero live, feed env, and gate failures");
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
  if (report.cronRefresh?.protected !== true || report.cronRefresh?.schedule !== "0 */6 * * *" || report.cronRefresh?.reportPath !== "reports/cron-refresh.json") {
    issues.push("health readiness should expose protected 6-hour cron refresh report metadata");
  }
  if ((report.cronRefresh?.productDealsCount ?? 0) < 140 || (report.cronRefresh?.newsDealsCount ?? 0) < 40) {
    issues.push("health readiness cron refresh summary should preserve product/news counts");
  }

  if (issues.length) fail("operational health readiness", issues.join("; "));
  else pass("operational health readiness", "Health readiness report proves product links, official benefits, category coverage, provider risk, freshness, refresh:all, and cron refresh status are launch-ready.");
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

  const packageJson = existsSync(join(root, "package.json")) ? JSON.parse(readFileSync(join(root, "package.json"), "utf8")) : {};
  const dailyScript = existsSync(join(root, "scripts/daily-operations-report.mjs")) ? readFileSync(join(root, "scripts/daily-operations-report.mjs"), "utf8") : "";
  const dailyApi = existsSync(join(root, "app/api/admin/daily-operations/route.ts")) ? readFileSync(join(root, "app/api/admin/daily-operations/route.ts"), "utf8") : "";
  const dailyLib = existsSync(join(root, "lib/operations/dailyOperations.ts")) ? readFileSync(join(root, "lib/operations/dailyOperations.ts"), "utf8") : "";
  const adminPage = existsSync(join(root, "app/admin/page.tsx")) ? readFileSync(join(root, "app/admin/page.tsx"), "utf8") : "";
  const smokeScript = existsSync(join(root, "scripts/smoke.mjs")) ? readFileSync(join(root, "scripts/smoke.mjs"), "utf8") : "";
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

  if (report.ok !== true) issues.push("daily operations report should pass");
  if ((report.summary?.productDealsCount ?? 0) < 140) issues.push("daily operations should preserve at least 140 product deals");
  if ((report.summary?.verifiedProductLinks ?? 0) < 140) issues.push("daily operations should preserve verified product links");
  if ((report.summary?.exposedSearchLinks ?? 1) !== 0) issues.push("daily operations should show zero exposed search links");
  if ((report.summary?.exposedSoldOutLinks ?? 1) !== 0) issues.push("daily operations should show zero exposed sold-out links");
  if ((report.summary?.visibleOfficialBenefits ?? 0) < 40) issues.push("daily operations should show at least 40 official benefits");
  if (report.summary?.refreshAllOk !== true || (report.summary?.refreshAllFailedCount ?? 1) !== 0) {
    issues.push("daily operations should require passing refresh:all with zero failures");
  }
  if ((report.summary?.officialSourceCandidates ?? 0) < 30 || report.summary?.officialSourceLaunchGateStatus !== "passed") {
    issues.push("daily operations should expose passing official source readiness");
  }
  if ((report.summary?.releaseDoctorPassedChecks ?? 0) !== (report.summary?.releaseDoctorTotalChecks ?? -1)) {
    issues.push("daily operations should preserve clean release doctor evidence");
  }
  if (!Array.isArray(report.gates) || report.gates.length < 6 || !report.gates.every((gate) => gate.ok === true)) {
    issues.push("daily operations gates should all pass");
  }
  if (!Array.isArray(report.priorityQueue) || report.priorityQueue.length < 3) {
    issues.push("daily operations should include a priority queue");
  }

  if (issues.length) fail("daily operations readiness", issues.join("; "));
  else pass("daily operations readiness", "Daily operations report ties verified links, official benefits, refresh:all, source readiness, cron/push, admin API, CSV export, and store release gates into a daily operator queue.");
}

function checkCronRefreshPipeline() {
  const issues = [];
  const routePath = join(root, "app/api/cron/refresh/route.ts");
  const route = existsSync(routePath) ? readFileSync(routePath, "utf8") : "";
  const cronOperations = existsSync(join(root, "lib/operations/cronRefresh.ts")) ? readFileSync(join(root, "lib/operations/cronRefresh.ts"), "utf8") : "";
  const healthRoute = existsSync(join(root, "app/api/health/route.ts")) ? readFileSync(join(root, "app/api/health/route.ts"), "utf8") : "";
  const adminPage = existsSync(join(root, "app/admin/page.tsx")) ? readFileSync(join(root, "app/admin/page.tsx"), "utf8") : "";
  const vercelConfig = existsSync(join(root, "vercel.json")) ? JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) : {};
  const envExample = existsSync(join(root, ".env.example")) ? readFileSync(join(root, ".env.example"), "utf8") : "";
  const smokeScript = existsSync(join(root, "scripts/smoke.mjs")) ? readFileSync(join(root, "scripts/smoke.mjs"), "utf8") : "";
  const packageJson = existsSync(join(root, "package.json")) ? JSON.parse(readFileSync(join(root, "package.json"), "utf8")) : {};
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

  const cron = Array.isArray(vercelConfig.crons) ? vercelConfig.crons.find((item) => item.path === "/api/cron/refresh") : null;
  if (!cron || cron.schedule !== "0 */6 * * *") {
    issues.push("vercel.json should schedule /api/cron/refresh every 6 hours");
  }

  for (const key of ["CRON_SECRET", "CRON_REFRESH_TIMEOUT_MS"]) {
    if (!envExample.includes(`${key}=`)) issues.push(`env example missing ${key}`);
  }

  if (packageJson.scripts?.["cron:refresh:doctor"] !== "node scripts/cron-refresh-doctor.mjs" || !packageJson.scripts?.qa?.includes("cron:refresh:doctor")) {
    issues.push("package scripts should expose cron:refresh:doctor and include it in qa");
  }
  if (!cronDoctor.includes("cron-refresh-readiness.json") || !cronDoctor.includes("CRON_REFRESH_READINESS.md") || !cronDoctor.includes("refresh-all evidence") || !cronDoctor.includes("live feed evidence")) {
    issues.push("cron refresh doctor should write JSON/docs readiness evidence and verify refresh:all plus live feed evidence");
  }
  if (cronReadinessReport?.ok !== true || cronReadinessReport?.endpoint !== "/api/cron/refresh" || cronReadinessReport?.schedule !== "0 */6 * * *") {
    issues.push("reports/cron-refresh-readiness.json should prove protected 6-hour cron readiness");
  }
  if (cronReadinessReport?.livePipelineOk !== true || (cronReadinessReport?.livePipelineOfficialBenefits ?? 0) < 40) {
    issues.push("reports/cron-refresh-readiness.json should prove live feed pipeline evidence");
  }
  if (!cronReadinessDocs.includes("Cron Refresh Readiness") || !cronReadinessDocs.includes("dryRun=true") || !cronReadinessDocs.includes("mode=liveFeed") || !cronReadinessDocs.includes("CRON_SECRET")) {
    issues.push("docs/CRON_REFRESH_READINESS.md should document dry-run, mode=liveFeed, and CRON_SECRET operation");
  }

  if (!cronOperations.includes("getCronRefreshOperationsReport") || !cronOperations.includes("reports/cron-refresh.json") || !cronOperations.includes("reports/news-feed-live-pipeline.json") || !cronOperations.includes("livePipelineOk") || !cronOperations.includes("manual_refresh_ready")) {
    issues.push("cron refresh operations report should summarize last run, live feed evidence, fallback manual readiness, and report path");
  }
  if (!healthRoute.includes("getCronRefreshOperationsReport") || !healthRoute.includes("cronRefreshStatus") || !healthRoute.includes("cronRefreshProtected") || !healthRoute.includes("cronRefreshProductDealsCount") || !healthRoute.includes("cronRefreshLivePipelineStatus")) {
    issues.push("Health API should expose cron refresh status, protection evidence, deal counts, and live feed status");
  }
  if (!adminPage.includes("자동 refresh cron 운영") || !adminPage.includes("cronRefreshDryRunHref") || !adminPage.includes("cronLiveFeedDryRunHref") || !adminPage.includes("liveFeed dry-run") || !adminPage.includes("CRON_SECRET")) {
    issues.push("Admin dashboard should expose cron refresh operation status, liveFeed dry-run, and auth guidance");
  }

  if (!smokeScript.includes("cron refresh api guard") || !smokeScript.includes("/api/cron/refresh?dryRun=true") || !smokeScript.includes("/api/cron/refresh?dryRun=true&mode=liveFeed") || !smokeScript.includes("Expected cron refresh without token to be 401")) {
    issues.push("smoke should verify cron refresh auth guard, default dry-run, and liveFeed dry-run response");
  }
  if (!smokeScript.includes("Admin dashboard missing cron refresh operation board") || !smokeScript.includes("Health API missing cron refresh status") || !smokeScript.includes("Health API missing cron live feed pipeline status")) {
    issues.push("smoke should verify cron refresh admin, health, and live feed visibility");
  }
  if (!runbook.includes("/api/cron/refresh") || !runbook.includes("mode=liveFeed") || !runbook.includes("CRON_SECRET") || !runbook.includes("reports/cron-refresh.json")) {
    issues.push("RUNBOOK should document protected cron refresh and live feed operation");
  }
  if (!roadmap.includes("cron refresh") && !roadmap.includes("Cron refresh")) {
    issues.push("roadmap should document cron refresh automation");
  }

  if (issues.length) fail("cron refresh automation", issues.join("; "));
  else pass("cron refresh automation", "Protected 6-hour cron refresh endpoint, explicit live feed mode, Vercel schedule, dry-run smoke guard, env keys, and runbook guidance are wired.");
}

function checkAdminAuthHardening() {
  const issues = [];
  const packageJson = existsSync(join(root, "package.json")) ? JSON.parse(readFileSync(join(root, "package.json"), "utf8")) : {};
  const adminAuth = existsSync(join(root, "lib/adminAuth.ts")) ? readFileSync(join(root, "lib/adminAuth.ts"), "utf8") : "";
  const doctor = existsSync(join(root, "scripts/admin-auth-doctor.mjs")) ? readFileSync(join(root, "scripts/admin-auth-doctor.mjs"), "utf8") : "";
  const smoke = existsSync(join(root, "scripts/smoke.mjs")) ? readFileSync(join(root, "scripts/smoke.mjs"), "utf8") : "";
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
    "app/api/admin/source-live/route.ts",
    "app/api/admin/source-onboarding/route.ts",
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
  if (!smoke.includes("SMOKE_ADMIN_TOKEN") || !smoke.includes("x-admin-token") || !smoke.includes("Expected cron refresh header auth 200")) {
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
  process.exit(1);
}

console.log(`Release doctor passed: ${checks.length}/${checks.length}`);

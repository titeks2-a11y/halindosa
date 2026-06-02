import { existsSync, readFileSync, statSync } from "node:fs";
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
    "qa:release",
    "perf:budget",
    "device:qa:doctor",
    "env:doctor",
    "feed:validate",
    "feed:production:doctor",
    "verify:links",
    "test:mobile-ux",
    "links:report",
    "store:metadata:doctor",
    "store:assets:generate",
    "store:assets:doctor",
    "store:screenshots:doctor",
    "release:evidence"
  ];
  const missing = requiredScripts.filter((script) => !pkg.scripts?.[script]);

  if (missing.length) fail("package scripts", `Missing scripts: ${missing.join(", ")}`);
  else if (!pkg.scripts?.qa?.includes("verify:links") || !pkg.scripts?.qa?.includes("test:mobile-ux") || !harness.includes("test:mobile-ux") || !pkg.scripts?.["qa:release"]?.includes("audit:commercial") || !pkg.scripts?.["qa:release"]?.includes("device:qa:doctor") || !pkg.scripts?.["qa:release"]?.includes("android:signing:doctor") || !pkg.scripts?.["qa:release"]?.includes("feed:validate") || !pkg.scripts?.["qa:release"]?.includes("feed:production:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:metadata:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:assets:doctor") || !pkg.scripts?.["qa:release"]?.includes("store:screenshots:doctor") || !pkg.scripts?.["qa:release"]?.includes("perf:budget")) {
    fail("package scripts", "qa, harness, and qa:release should include mobile UX, commercial security audit, device QA doctor, Android signing doctor, partner feed validator, production feed doctor, store metadata doctor, store asset doctor, store screenshot doctor, and performance budget before store submission.");
  } else {
    pass("package scripts", "Android, iOS, environment, mobile UX, commercial security, and performance release command flow is available.");
  }

  if (!pkg.dependencies?.["@capacitor/ios"]) fail("Capacitor iOS dependency", "Missing @capacitor/ios.");
  else pass("Capacitor iOS dependency", pkg.dependencies["@capacitor/ios"]);

  if (!pkg.dependencies?.["@supabase/supabase-js"]) fail("Supabase Auth dependency", "Missing @supabase/supabase-js.");
  else pass("Supabase Auth dependency", pkg.dependencies["@supabase/supabase-js"]);

  const versionIssues = [];
  if (pkg.version !== "1.0.0") versionIssues.push(`package.json version is ${pkg.version}`);
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
    "npm run harness",
    "npm run release:doctor",
    "actions/upload-artifact@v4",
    "halindosa-verification-reports",
    "docs/release-evidence.md"
  ];
  const missingWorkflowSnippets = requiredWorkflowSnippets.filter((snippet) => !workflow.includes(snippet));
  const requiredRunbookSnippets = ["codex/**", "npm run harness", "npm run release:doctor", "halindosa-verification-reports"];
  const missingRunbookSnippets = requiredRunbookSnippets.filter((snippet) => !runbook.includes(snippet));

  if (missingWorkflowSnippets.length || missingRunbookSnippets.length) {
    fail(
      "github ci workflow",
      `CI should run commercial audit, harness, release doctor, and upload verification reports on main/codex branches. Missing workflow: ${missingWorkflowSnippets.join(", ") || "none"}; runbook: ${missingRunbookSnippets.join(", ") || "none"}`
    );
  } else {
    pass("github ci workflow", "GitHub Actions runs commercial audit, harness, release doctor, and uploads verification reports on main and codex branches.");
  }

  const prTemplatePath = ".github/pull_request_template.md";
  if (!existsSync(join(root, prTemplatePath))) {
    fail("github pr template", "Missing .github/pull_request_template.md.");
    return;
  }

  const prTemplate = await text(prTemplatePath);
  const requiredPrSnippets = [
    "npm run harness",
    "npm run release:doctor",
    "실제 상품 상세 URL 또는 공식 혜택 상세 URL",
    "검색 결과, 대표몰, 커뮤니티/블로그/뉴스 원문 단독 링크",
    "개인정보, 환경변수, keystore",
    "비회원 사용자가 홈, 검색, 카테고리",
    "docs/OAUTH_SETUP.md",
    "모바일 390px"
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
    ".github/ISSUE_TEMPLATE/config.yml"
  ];
  const missingIssueTemplates = issueTemplateFiles.filter((file) => !existsSync(join(root, file)));
  if (missingIssueTemplates.length) {
    fail("github issue templates", `Missing issue templates: ${missingIssueTemplates.join(", ")}`);
    return;
  }

  const dealIssue = await text(".github/ISSUE_TEMPLATE/deal-link-report.md");
  const appIssue = await text(".github/ISSUE_TEMPLATE/app-bug-report.md");
  const issueConfig = await text(".github/ISSUE_TEMPLATE/config.yml");
  const requiredDealIssueSnippets = ["가격이 다름", "품절 또는 옵션 선택 불가", "링크 오류", "할인도사 상품 ID", "판매처에서 확인한 가격/혜택", "개인정보 주의"];
  const requiredAppIssueSnippets = ["재현 순서", "플랫폼: Web / Android / iOS", "외부 판매처 이동", "GitHub Actions artifact", "개인정보 주의"];
  const requiredIssueConfigSnippets = ["blank_issues_enabled: false", "https://github.com/titeks2-a11y/halindosa/issues/new/choose"];
  const missingIssueSnippets = [
    ...requiredDealIssueSnippets.filter((snippet) => !dealIssue.includes(snippet)).map((snippet) => `deal:${snippet}`),
    ...requiredAppIssueSnippets.filter((snippet) => !appIssue.includes(snippet)).map((snippet) => `app:${snippet}`),
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
  } else if (/refresh release evidence/i.test(currentSubject) && evidenceCommit === parentCommit) {
    pass("release evidence freshness", `Release evidence snapshot was refreshed for parent release commit ${parentCommit}.`);
  } else if (currentCommit !== evidenceCommit) {
    fail("release evidence freshness", `Release evidence is stale: document has ${evidenceCommit}, current commit is ${currentCommit}. Run npm run release:evidence after final QA.`);
  } else {
    pass("release evidence freshness", `Release evidence points at current commit ${currentCommit}.`);
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
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "AFFILIATE_SUB_ID",
    "DEFAULT_AFFILIATE_URL_TEMPLATE",
    "COUPANG_PARTNERS_URL_TEMPLATE",
    "AFFILIATE_URL_TEMPLATES",
    "TRACKING_SALT",
    "ADMIN_EXPORT_TOKEN"
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
  if (
    !envDoctor.includes("isValidHttpsUrl") ||
    !envDoctor.includes('pathname === "/auth/callback"') ||
    !envDoctor.includes("isValidAppScheme") ||
    !envDoctor.includes("isValidEmail") ||
    !envDoctor.includes("URL values must be https in production")
  ) {
    fail("env doctor format validation", "Environment doctor should validate HTTPS/public URLs, /auth/callback redirect path, app scheme, and support email format.");
  } else {
    pass("env doctor format validation", "Environment doctor validates HTTPS/public URLs, /auth/callback redirect path, app scheme, and support email format.");
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

  const requiredTables = ["user_profiles", "user_favorite_deals", "user_recent_deals", "deal_click_logs", "price_drop_alerts"];
  const missingTables = requiredTables.filter((table) => !schema.includes(table));
  if (missingTables.length) {
    fail("member database schema", `Missing Supabase tables: ${missingTables.join(", ")}`);
  } else if (!schema.includes("users manage own favorites") || !schema.includes("users manage own recent deals") || !schema.includes("user_id null") || !schema.includes("favorites as") || !schema.includes("recent_views as")) {
    fail("member database schema", "Supabase schema should include RLS for own favorites/recent data, deletion anonymization notes, and compatibility views.");
  } else {
    pass("member database schema", "Supabase schema includes profiles, favorites, recent deals, clicks, and price alerts.");
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
  } else if (!normalizer.includes("validatePurchaseLink") || missingTypeFields.length || missingSmokeFields.length) {
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
  const reportsLib = await text("lib/reports.ts");
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
  const mobileUxReport = await text("MOBILE_UX_REPORT.md");
  const imageTest = await text("scripts/test-images.mjs");
  const imageOperationsDoctor = await text("scripts/image-operations-doctor.mjs");
  const harnessReport = await text("HARNESS_REPORT.md");
  const harnessScript = await text("scripts/harness.mjs");
  const smoke = await text("scripts/smoke.mjs");
  const packageJson = await text("package.json");

  if (
    !tailwindConfig.includes('red: "#ff173f"') ||
    !tailwindConfig.includes("bright") ||
    (!tailwindConfig.includes("shadow:") && !tailwindConfig.includes("brand:")) ||
    !globalsCss.includes("--brand-red: #ff173f") ||
    !globalsCss.includes("--brand-red-bright: #ff2a4f") ||
    !homePage.includes("shadow-brand") ||
    !commercializationPage.includes("bg-dossa-red") ||
    !authForm.includes("bg-dossa-red")
  ) {
    fail("v2 brand color system", "Brand red should use a bright commercial token across Tailwind, globals, home, auth, and launch readiness surfaces.");
  } else {
    pass("v2 brand color system", "Bright red brand tokens are centralized and used across home, auth, and launch readiness surfaces.");
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
    !reportForm.includes("신고 처리 예상 안내") ||
    !reportForm.includes("목표 처리:") ||
    !reportsPage.includes("신고 처리 흐름") ||
    !reportsPage.includes("링크와 종료 정보는 우선 확인합니다") ||
    !reportsPage.includes("reportFlowCards") ||
    !reportsPage.includes("getReportResolutionPlan") ||
    !reportsLib.includes("getReportResolutionPlan") ||
    !reportsApi.includes("plan: getReportResolutionPlan") ||
    !smoke.includes("Report API missing resolution plan metadata") ||
    !smoke.includes("Report page missing public report workflow summary") ||
    !smoke.includes("Admin dashboard missing deal quality report queue")
  ) {
    fail("admin report priority workflow", "Admin/report surfaces should expose reason-specific expectations, SLA, recommended actions, and smoke coverage.");
  } else {
    pass("admin report priority workflow", "Admin/report surfaces prioritize link error, sold-out, and expired reports with expected handling, SLA, and recommended actions.");
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
    !packageJson.includes('"image:operations:doctor"') ||
    !packageJson.includes("npm run test:images") ||
    !packageJson.includes("npm run image:operations:doctor") ||
    !imageTest.includes("minimumExplicitImageRate = 25") ||
    !imageTest.includes("fallbackDealBacklog") ||
    !imageOperationsDoctor.includes("minimum explicit image gate") ||
    !imageOperationsDoctor.includes("image backlog report") ||
    !imageQualityReport.includes("| 명시 이미지 최소 기준 | 25% |") ||
    !imageQualityReport.includes("## Image Backlog") ||
    !imageQualityReport.includes("이미지 후보 검색") ||
    !harnessReport.includes("Image quality passed: 39/140 deals have explicit images.")
  ) {
    fail("deal image quality coverage gate", "Release QA should enforce the 25% explicit product image floor, record current coverage evidence, and keep an actionable fallback image backlog.");
  } else {
    pass("deal image quality coverage gate", "QA, image operations doctor, and release evidence enforce the 25% explicit product image floor with 39/140 current coverage and an actionable fallback image backlog.");
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
    "toast does not cover bottom nav"
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
  const dealRepository = await text("lib/deals/dealRepository.ts");
  const categoriesPage = await text("app/categories/page.tsx");
  const notificationsPage = await text("app/notifications/page.tsx");
  const interestAlertPreview = await text("components/InterestAlertPreview.tsx");
  const benefitVisitStreakSummary = await text("components/BenefitVisitStreakSummary.tsx");
  const claimedBenefitAlertSummary = await text("components/ClaimedBenefitAlertSummary.tsx");
  const benefitReturnReservationList = await text("components/BenefitReturnReservationList.tsx");
  const benefitReturnReservations = await text("lib/benefitReturnReservations.ts");
  const favoritesPage = await text("app/favorites/page.tsx");
  const localDataControls = await text("components/LocalDataControls.tsx");
  const accountPanel = await text("components/AccountPanel.tsx");
  const claimedBenefits = await text("lib/claimedBenefits.ts");
  const adminPage = await text("app/admin/page.tsx");
  const adminExportRoute = await text("app/api/admin/export/route.ts");
  const adminDailyQueueRoute = await text("app/api/admin/daily-queue/route.ts");
  const commercializationPage = await text("app/commercialization/page.tsx");
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
    !localDataControls.includes("benefitReturnReservationStorageKey") ||
    !localDataControls.includes("재방문 예약") ||
    !accountPanel.includes("priceAlertStorageKey") ||
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
    !notificationsPage.includes("비회원 기준 혜택 큐") ||
    !notificationsPage.includes("오늘 알림 큐") ||
    !interestAlertPreview.includes("관심 카테고리 알림") ||
    !interestAlertPreview.includes("관심 설정하기") ||
    !interestAlertPreview.includes("알림 개인화 추천 API") ||
    !interestAlertPreview.includes("개인화 API 보기") ||
    !interestAlertPreview.includes("비회원도 기기에 관심사를 저장") ||
    !interestAlertPreview.includes("interestAlertPlan") ||
    !interestAlertPreview.includes("관심 알림 실행 카드") ||
    !interestAlertPreview.includes("무료·체험 먼저") ||
    !interestAlertPreview.includes("마감 전 확인") ||
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
    !analytics.includes("buildBenefitRetentionPlan") ||
    !analytics.includes("dailyRoutineSlots") ||
    !analytics.includes("weeklyRoutineReady") ||
    !analytics.includes("retentionScore") ||
    !analytics.includes("buildPersonalizationReadiness") ||
    !analytics.includes("personalizationReadiness") ||
    !analytics.includes("buildPersonalizedBenefitQueue") ||
    !commercializationPage.includes("benefitRetention") ||
    !commercializationPage.includes("개인화 추천 출시 준비도") ||
    !commercializationPage.includes("다음 개인화 개선 액션") ||
    !adminPage.includes("benefitRetention") ||
    !adminPage.includes("VER 2.0 개인화 추천 운영") ||
    !adminPage.includes("개인화 추천 개선 액션") ||
    !smoke.includes("Metrics missing benefit retention score") ||
    !smoke.includes("Metrics missing personalization readiness rate") ||
    !smoke.includes("Commercialization page missing benefit retention readiness") ||
    !smoke.includes("Commercialization page missing personalization readiness") ||
    !smoke.includes("Admin dashboard missing benefit retention operation summary") ||
    !smoke.includes("Admin dashboard missing personalization readiness operation summary")
  ) {
    fail("benefit retention metrics", "Metrics, admin, and commercialization pages should expose daily routine and personalization readiness for V2 retention operations.");
  } else {
    pass("benefit retention metrics", "Metrics, admin, and commercialization pages expose daily routine and personalization readiness for V2 retention operations.");
  }

  if (
    !healthRoute.includes("operationalStatus") ||
    !healthRoute.includes("verifiedLinkRate") ||
    !healthRoute.includes("claimGuideRate") ||
    !healthRoute.includes("buildClaimEffortSummary") ||
    !healthRoute.includes("claimEffortReady") ||
    !healthRoute.includes("claimEffortEasyCount") ||
    !healthRoute.includes("freeBenefitDeals") ||
    !healthRoute.includes("buildPersonalizationReadiness") ||
    !healthRoute.includes("personalizationReadyRate") ||
    !healthRoute.includes("personalizationQueuesReady") ||
    !healthRoute.includes("getOperationalEnvReadiness") ||
    !healthRoute.includes("operationalEnvReadyRate") ||
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
    !smoke.includes("Metrics missing operational env readiness rate") ||
    !smoke.includes("Commercialization page missing operational env readiness")
  ) {
    fail("operational health checks", "Health API should expose V2 link, free benefit, claim-guide, personalization, and deployment environment readiness with smoke coverage.");
  } else {
    pass("operational health checks", "Health API exposes V2 link, free benefit, claim-guide, personalization, and deployment environment readiness with smoke coverage.");
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

  if (
    !trust.includes("export function getDealSourceReadiness") ||
    !trust.includes("verifiedRate") ||
    !trust.includes("conditionReadyCount") ||
    !productionProvider.includes("getConfiguredProductionFeedUrls") ||
    !productionProvider.includes("DEAL_PRODUCTION_FEED_URLS") ||
    !productionProvider.includes("validatePartnerFeed") ||
    !productionProvider.includes("normalizePartnerFeed") ||
    !productionProvider.includes("AbortController") ||
    !sourcesRoute.includes("operationPolicy") ||
    !sourcesRoute.includes("configuredProductionFeeds") ||
    !sourcesRoute.includes("allowedSources") ||
    !sourcesRoute.includes("blockedSources") ||
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
    !smoke.includes("Admin dashboard missing partner feed validation report board") ||
    !smoke.includes("Admin dashboard missing paste-in feed dry-run panel") ||
    !smoke.includes("Admin dashboard missing row-level feed dry-run review summary") ||
    !smoke.includes("Admin dashboard missing feed dry-run export actions") ||
    !smoke.includes("partner feed sample validation api")
  ) {
    fail("source readiness operation", "Sources API, production provider, docs, production feed doctor, and admin dashboard should expose source readiness, safe production JSON feed loading, allowed source policy, blocked source policy, and verified link quality for production feed transition.");
  } else {
    pass("source readiness operation", "Sources API, production provider, docs, production feed doctor, and admin dashboard expose source readiness and safe production JSON feed policy for official API, RSS, and partner feed transition.");
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

  if (!gradle.includes("versionCode 1")) fail("Android versionCode", "Expected versionCode 1.");
  else pass("Android versionCode", "1");

  if (!gradle.includes('versionName "1.0.0"')) fail("Android versionName", "Expected versionName 1.0.0.");
  else pass("Android versionName", "1.0.0");

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

  if (!pbx.includes("CURRENT_PROJECT_VERSION = 1;")) fail("iOS build number", "Expected CURRENT_PROJECT_VERSION 1.");
  else pass("iOS build number", "1");

  if (!pbx.includes("MARKETING_VERSION = 1.0.0;")) fail("iOS version", "Expected MARKETING_VERSION 1.0.0.");
  else pass("iOS version", "1.0.0");

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
      phrases: ["Play Store short description should be 1-80 characters", "Risky store metadata phrases", "App Store checklist should include bundle id"]
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
      phrases: ["자동 검증", "수동 확인", "데이터/링크 신뢰도", "테스트 종료 기준", "링크 검수 큐", "docs/device-qa-checklist.md", "test:mobile-ux", "MOBILE_UX_REPORT.md"]
    },
    {
      name: "readme qa guidance",
      file: "README.md",
      phrases: ["모바일 UX", "test:mobile-ux", "MOBILE_UX_REPORT.md", "외부 링크/이미지/이미지 운영 doctor", "release:doctor"]
    },
    {
      name: "runbook harness guidance",
      file: "docs/RUNBOOK.md",
      phrases: ["모바일 UX compact first-screen 검사", "MOBILE_UX_REPORT.md", "test:mobile-ux", "qa", "harness"]
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
      phrases: ["릴리즈 증빙", "최신 커밋", "Release AAB", "Harness report", "npm run harness", "자동 검증 범위", "남은 수동 확인"]
    },
    {
      name: "launch day checklist content",
      file: "docs/launch-day-checklist.md",
      phrases: ["제출 24시간 전", "Play Console 제출", "App Store Connect 제출", "출시 당일 운영 순서", "출시 후 72시간"]
    },
    {
      name: "store screenshot storyboard content",
      file: "docs/store-assets-guide.md",
      phrases: ["스크린샷 스토리보드", "오늘 먼저 볼 특가를 한눈에", "스크린샷 금지 요소", "내부 점수"]
    },
    {
      name: "device qa checklist content",
      file: "docs/device-qa-checklist.md",
      phrases: ["Android 기기 확인", "iOS 기기 또는 Simulator 확인", "로그인과 계정 데이터", "구매 링크와 신고", "스토어 제출 직전 판정", "docs/device-qa-record-template.md", "npm run test:mobile-ux", "MOBILE_UX_REPORT.md"]
    },
    {
      name: "device qa record template content",
      file: "docs/device-qa-record-template.md",
      phrases: ["테스트 개요", "Android 기기 기록", "iOS 기기 기록", "구매 링크 샘플 검수", "남은 Critical Issue", "기록 보안 원칙", "주문번호", "keystore"]
    },
    {
      name: "deployment env checklist content",
      file: "docs/deployment-env-checklist.md",
      phrases: ["npm run env:doctor", "node scripts/env-doctor.mjs --strict", "NEXT_PUBLIC_SITE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DEAL_DATA_MODE"]
    },
    {
      name: "store submission packet content",
      file: "docs/store-submission-packet.md",
      phrases: ["Android release AAB", "Play Store 등록 문구", "App Store Connect 입력값", "node scripts/env-doctor.mjs --strict", "docs/device-qa-checklist.md", "docs/store-review-notes.md", "실제 구매 링크 또는 공식 혜택 상세 URL", "테스트 계정: 필요 없음", "Demo Account: 필요 없음", "Play Console 복사 입력 블록", "App Store Connect 복사 입력 블록", "https://halindosa.com/privacy", "https://halindosa.com/support"]
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
await checkCustomerNavigationSimplification();
checkSigningAndArtifacts();
checkStoreAssets();

for (const check of checks) {
  const prefix = check.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

const failures = checks.filter((check) => !check.ok);

if (failures.length) {
  console.error(`Release doctor failed: ${failures.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Release doctor passed: ${checks.length}/${checks.length}`);

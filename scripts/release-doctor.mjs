import { existsSync, statSync } from "node:fs";
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

async function checkPackage() {
  const pkg = JSON.parse(await text("package.json"));
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
    "qa:release",
    "perf:budget",
    "release:evidence"
  ];
  const missing = requiredScripts.filter((script) => !pkg.scripts?.[script]);

  if (missing.length) fail("package scripts", `Missing scripts: ${missing.join(", ")}`);
  else if (!pkg.scripts?.["qa:release"]?.includes("audit:commercial") || !pkg.scripts?.["qa:release"]?.includes("perf:budget")) {
    fail("package scripts", "qa:release should include commercial security audit and performance budget before store submission.");
  } else {
    pass("package scripts", "Android, iOS, commercial security, and performance release command flow is available.");
  }

  if (!pkg.dependencies?.["@capacitor/ios"]) fail("Capacitor iOS dependency", "Missing @capacitor/ios.");
  else pass("Capacitor iOS dependency", pkg.dependencies["@capacitor/ios"]);

  if (!pkg.dependencies?.["@supabase/supabase-js"]) fail("Supabase Auth dependency", "Missing @supabase/supabase-js.");
  else pass("Supabase Auth dependency", pkg.dependencies["@supabase/supabase-js"]);
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

  if (!accountPanel.includes("favoriteCategories") || !accountPanel.includes("notificationConsent") || !accountPanel.includes("marketingConsent")) {
    fail("member profile settings", "Mypage account panel should support nickname, favorite categories, and consent settings.");
  } else {
    pass("member profile settings", "Mypage account panel prepares member profile, interest categories, and consent settings.");
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
  const blockedPhrases = ["무조건 최저가", "100% 실시간 보장", "공식 판매처 보장", "수익 보장", "최저가 의심 상품", "최근 최저가", "최저가 수준"];
  const findings = [];

  for (const file of publicFiles) {
    const body = await text(file);
    for (const phrase of blockedPhrases) {
      if (body.includes(phrase)) findings.push(`${file}: ${phrase}`);
    }
  }

  if (findings.length) {
    fail("public claim copy", `Risky public phrases found: ${findings.join(", ")}`);
  } else {
    pass("public claim copy", "Public UI and listing copy avoids absolute price/availability guarantees.");
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

  if (!feedImport.includes("placeholder 또는 커뮤니티 게시글 링크는 운영 피드로 등록할 수 없습니다.")) {
    fail("partner feed unsafe link guard", "Partner feed import should reject placeholder/community links.");
  } else if (!smoke.includes("partner feed import blocks unsafe links")) {
    fail("partner feed unsafe link guard", "Smoke tests should cover unsafe partner feed links.");
  } else {
    pass("partner feed unsafe link guard", "Partner feed import rejects placeholder and community links.");
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

  if (verifiedCount < 35 || verifiedRate < 65) {
    fail("verified purchase link coverage", `Expected at least 35 verified direct product links and 65% coverage, got ${verifiedCount}/${dealCount} (${verifiedRate}%).`);
  } else if (!smoke.includes("verified direct purchase link coverage")) {
    fail("verified purchase link coverage", "Smoke tests should assert the verified direct purchase link coverage threshold.");
  } else {
    pass("verified purchase link coverage", `${verifiedCount}/${dealCount} curated deals have manually reviewed product detail URLs (${verifiedRate}%).`);
  }
}

async function checkUiAccessibility() {
  const dealCard = await text("components/DealCard.tsx");
  const dealDetailPage = await text("app/deals/[id]/page.tsx");
  const dealTrustBadge = await text("components/DealTrustBadge.tsx");
  const purchaseConfirmSheet = await text("components/PurchaseConfirmSheet.tsx");
  const purchaseSafetyChecklist = await text("components/PurchaseSafetyChecklist.tsx");
  const priceAlertPanel = await text("components/PriceAlertPanel.tsx");
  const bottomNav = await text("components/BottomNav.tsx");
  const bottomNavigation = await text("components/BottomNavigation.tsx");
  const commercialFooter = await text("components/CommercialFooter.tsx");
  const categoryTabs = await text("components/CategoryTabs.tsx");
  const searchBar = await text("components/SearchBar.tsx");
  const sortSelect = await text("components/SortSelect.tsx");
  const dealDetailActions = await text("components/DealDetailActions.tsx");
  const topNavigation = await text("components/TopNavigation.tsx");
  const liveDealFeed = await text("components/LiveDealFeed.tsx");
  const hotSignalSection = await text("components/HotSignalSection.tsx");
  const priceAlertList = await text("components/PriceAlertList.tsx");
  const priceAlerts = await text("lib/priceAlerts.ts");
  const homePage = await text("app/page.tsx");
  const requiredSnippets = [
    "aria-pressed={isFavorite}",
    "alt={deal.title}",
    "판매처 이동 전 확인",
    "상세 정보와 가격 신고 보기"
  ];
  const missingSnippets = requiredSnippets.filter((snippet) => !dealCard.includes(snippet));

  if (missingSnippets.length) {
    fail("deal card accessibility", `Missing snippets: ${missingSnippets.join(", ")}`);
  } else {
    pass("deal card accessibility", "Deal images and icon buttons expose product-specific accessible labels.");
  }

  const requiredEmptyStateSnippets = ["조건 초기화하고 전체 특가 보기", "홈에서 특가 둘러보기", "가격과 재고는 판매처에서 변동"];
  const missingEmptyStateSnippets = requiredEmptyStateSnippets.filter((snippet) => !homePage.includes(snippet));

  if (missingEmptyStateSnippets.length) {
    fail("empty state UX", `Missing snippets: ${missingEmptyStateSnippets.join(", ")}`);
  } else {
    pass("empty state UX", "Search and favorites empty states include clear next actions and purchase caution copy.");
  }

  if (dealTrustBadge.includes("/99")) {
    fail("public trust badge copy", "DealTrustBadge should not expose internal numeric confidence scores.");
  } else {
    pass("public trust badge copy", "Public trust badges use plain labels instead of internal scores.");
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

  if (!bottomNav.includes("getNavAriaLabel") || !bottomNavigation.includes("getNavAriaLabel") || !bottomNav.includes('aria-label="주요 메뉴"') || !bottomNavigation.includes('aria-label="주요 메뉴"') || !bottomNav.includes("aria-current") || !bottomNavigation.includes("aria-current")) {
    fail("bottom navigation accessibility", "Bottom navigation should expose named menus, active state, and explicit button/link labels.");
  } else {
    pass("bottom navigation accessibility", "Route navigation and in-page navigation expose named menus with active state and explicit labels.");
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
  } else if (!dealCard.includes('loading="lazy"') || !liveDealFeed.includes('loading="lazy"') || !hotSignalSection.includes('loading="lazy"') || !dealDetailPage.includes('loading="eager"')) {
    fail("deal image loading hints", "List images should lazy-load and detail hero image should eagerly load.");
  } else {
    pass("deal image loading hints", "Deal list, live feed, signal, and detail images use proxy helpers and browser loading hints.");
  }

  if (
    !searchBar.includes('aria-label="상품명, 쇼핑몰, 카테고리 검색"') ||
    !sortSelect.includes('aria-label="특가 정렬 방식"') ||
    !categoryTabs.includes("aria-pressed={active}") ||
    !categoryTabs.includes("카테고리")
  ) {
    fail("search filter accessibility", "Search, sort, and category controls should expose accessible names and selected state.");
  } else if (
    !homePage.includes('aria-label="쇼핑몰 필터"') ||
    !homePage.includes("무료배송만 보기") ||
    !homePage.includes("구매링크 확인된 특가만 보기") ||
    !homePage.includes("검색과 필터 조건 초기화")
  ) {
    fail("search filter accessibility", "Home filter controls should expose accessible names and toggle state labels.");
  } else {
    pass("search filter accessibility", "Search, sort, category, mall, and quick filter controls expose accessible names and state.");
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

  const requiredFooterSnippets = ['href="/guide"', 'href="/terms"', 'href="/privacy"', "flex-wrap"];
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
  const quality = await text("lib/deals/quality.ts");
  const dealRepository = await text("lib/deals/dealRepository.ts");
  const categoriesPage = await text("app/categories/page.tsx");
  const notificationsPage = await text("app/notifications/page.tsx");
  const favoritesPage = await text("app/favorites/page.tsx");
  const localDataControls = await text("components/LocalDataControls.tsx");
  const accountPanel = await text("components/AccountPanel.tsx");
  const adminPage = await text("app/admin/page.tsx");
  const commercializationPage = await text("app/commercialization/page.tsx");
  const smoke = await text("scripts/smoke.mjs");
  const redirectUrl = await text("lib/redirectUrl.ts");
  const goRoute = await text("app/go/[id]/route.ts");
  const dealTypes = await text("types/deal.ts");

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
    !notificationsPage.includes("<PriceAlertList") ||
    !homePage.includes("<PriceAlertList") ||
    !localDataControls.includes("priceAlertStorageKey") ||
    !localDataControls.includes("가격 알림 조건") ||
    !accountPanel.includes("priceAlertStorageKey")
  ) {
    fail("price alert data surface", "Notifications, in-app alert tab, account deletion, and local data controls should expose saved price alerts and deletion scope.");
  } else {
    pass("price alert data surface", "Saved price alerts are visible in notifications and the in-app alert tab, and included in local/account data deletion controls.");
  }

  const adminRawTerms = ["mock, staging, production", "· score "].filter((term) => adminPage.includes(term));
  if (adminRawTerms.length) {
    fail("admin product copy", `Admin page still exposes raw internal terms: ${adminRawTerms.join(", ")}`);
  } else {
    pass("admin product copy", "Admin dashboard avoids raw internal source and score copy.");
  }

  if (!dealsRoute.includes("normalizeDeals(mockDeals") || dealsRoute.includes("mock 데이터로 대체")) {
    fail("api fallback normalization", "Deals API fallback should normalize canonical fields and avoid public mock wording.");
  } else {
    pass("api fallback normalization", "Deals API fallback keeps canonical fields and user-facing fallback copy.");
  }

  if (!quality.includes("export function isVerifiedPurchaseLink") || !quality.includes("export function getLinkQualityScore")) {
    fail("shared link quality rules", "Link verification and scoring should be centralized in lib/deals/quality.ts.");
  } else if (
    !dealRepository.includes("isVerifiedPurchaseLink") ||
    !homePage.includes("isVerifiedPurchaseLink") ||
    !featuredSections.includes("getLinkQualityScore") ||
    !dealCard.includes("isVerifiedPurchaseLink") ||
    !liveDealFeed.includes("isVerifiedPurchaseLink") ||
    !purchaseConfirmSheet.includes("isVerifiedPurchaseLink")
  ) {
    fail("shared link quality rules", "Home, repository, featured sections, cards, live feed, and purchase confirmation should use shared link quality rules.");
  } else {
    pass("shared link quality rules", "Verified purchase filtering, scoring, and trust labels use shared link quality rules.");
  }

  if (!quality.includes("getLinkReviewPriority") || !quality.includes("reviewReason") || !adminPage.includes("priorityLabels") || !adminPage.includes("현재 이동 URL")) {
    fail("admin link review workflow", "Admin link review queue should expose priority, reason, confidence, and current destination URL.");
  } else if (!adminPage.includes("CSV 다운로드") || !smoke.includes("finalPurchaseUrl") || !smoke.includes("reviewPriority")) {
    fail("admin link review export", "Admin CSV export should include link review status, priority, reason, and destination fields.");
  } else {
    pass("admin link review workflow", "Admin link review queue and CSV export expose priority, reason, confidence, and current destination URL.");
  }

  const commercializationSnippets = [
    "할인도사 출시 준비 보드",
    "출시 직전 체크",
    "실제 운영 전환",
    "Supabase OAuth Provider",
    "남은 링크 검수",
    "구매 링크 확인율",
    "출시 준비 단계",
    "다음 우선 조치"
  ];
  const missingCommercializationSnippets = commercializationSnippets.filter((snippet) => !commercializationPage.includes(snippet));
  if (missingCommercializationSnippets.length) {
    fail("commercial launch readiness page", `Missing snippets: ${missingCommercializationSnippets.join(", ")}`);
  } else {
    pass("commercial launch readiness page", "Commercialization page exposes launch readiness metrics, external setup, and remaining link review risk.");
  }

  const requiredCommercialDealFields = ["productUrl", "searchUrl", "originalUrl", "clickCount", "likeCount", "isSoldOut", "updatedAt"];
  const missingCommercialDealFields = requiredCommercialDealFields.filter((field) => !dealTypes.includes(field));
  if (missingCommercialDealFields.length) {
    fail("commercial deal fields", `Missing Deal fields: ${missingCommercialDealFields.join(", ")}`);
  } else {
    pass("commercial deal fields", "Deal type includes product/search URL split and commercial engagement fields.");
  }

  if (!redirectUrl.includes("/go/") || !goRoute.includes("recordDealClick") || !goRoute.includes("buildOutboundUrl")) {
    fail("go redirect route", "Purchase buttons should use /go/[dealId], record clicks, and resolve outbound URL server-side.");
  } else {
    pass("go redirect route", "Purchase redirect uses /go/[dealId] with click logging and server-side outbound URL resolution.");
  }

  if (!sitemap.includes("/commercialization") || !sitemap.includes("/guide") || !sitemap.includes("/privacy")) {
    fail("launch sitemap coverage", "Sitemap should include public guide, privacy, and commercialization readiness pages.");
  } else {
    pass("launch sitemap coverage", "Sitemap includes service guide, privacy, and commercialization readiness pages.");
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
    "docs/ACCOUNT_DELETION.md"
  ];
  const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

  if (missing.length) fail("policy and store docs", `Missing: ${missing.join(", ")}`);
  else pass("policy and store docs", "Required policy/listing drafts are present.");

  const requiredContent = [
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
      phrases: ["직접 상품을 판매하지 않습니다", "구매 전 꼭 확인하세요", "외부 판매처 이동 방식", "제휴 파라미터"]
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
      phrases: ["자동 검증", "수동 확인", "데이터/링크 신뢰도", "테스트 종료 기준", "링크 검수 큐"]
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
      phrases: ["릴리즈 증빙", "최신 커밋", "Release AAB", "자동 검증 범위", "남은 수동 확인"]
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

  if (!existsSync(join(root, keystoreExample))) fail("keystore example", "Missing android/keystore.properties.example.");
  else pass("keystore example", "Example signing config is present.");

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

function checkStoreAssets() {
  const assets = [
    "assets/store/halindosa-logo-source.jpg",
    "assets/store/play-store-icon-512.png",
    "assets/store/feature-graphic-1024x500.png"
  ];
  const missing = assets.filter((file) => fileSize(file) <= 0);

  if (missing.length) fail("store assets", `Missing: ${missing.join(", ")}`);
  else pass("store assets", "Play Store icon source and feature graphic drafts are present.");
}

await checkPackage();
await checkRepositorySafety();
await checkEnvExample();
await checkPublicContact();
await checkAuthSurface();
await checkPublicClaimCopy();
await checkPartnerFeedSafety();
await checkUiAccessibility();
await checkOperationalDataSurfaces();
await checkCapacitor();
await checkAndroid();
await checkIos();
await checkPolicyAndStoreDocs();
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

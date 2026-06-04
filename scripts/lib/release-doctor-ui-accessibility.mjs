import { fail, pass, smokeSource, text } from "./release-doctor-harness.mjs";

export async function checkUiAccessibility() {
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
  const claimedBenefitHomeSummary = await text("components/ClaimedBenefitHomeSummary.tsx");
  const homeDerivedData = await text("lib/homeDerivedData.ts");
  const homeDealFilters = await text("lib/homeDealFilters.ts");
  const homeDiscoveryConfig = await text("lib/homeDiscoveryConfig.ts");
  const homeRecentSearches = await text("lib/homeRecentSearches.ts");
  const homeFeatureSource = `${homePage}\n${claimedBenefitHomeSummary}\n${homeDealFilters}\n${homeDerivedData}`;
  const homeSearchSource = `${homeFeatureSource}\n${homeDiscoveryConfig}\n${homeRecentSearches}`;
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
  const smoke = await smokeSource();
  const packageJson = `${await text("package.json")}\n${await text("scripts/run-qa.mjs")}`;
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
    !dealCard.includes("쿠폰 조건")
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
    !quickDealCard.includes("아낌")
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
    !packageJson.includes("test:images") ||
    !packageJson.includes("image:backlog:report") ||
    !packageJson.includes("image:operations:doctor") ||
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
    !homeSearchSource.includes("recentSearchStorageKey") ||
    !homeSearchSource.includes("highIntentSearchKeywords") ||
    !homePage.includes("quickSearchSuggestions") ||
    !homePage.includes("searchResultSnapshot") ||
    !homePage.includes('aria-label="검색 결과 핵심 요약"') ||
    !homePage.includes("selectSearchKeyword") ||
    !sortSelect.includes('aria-label="특가 정렬 방식"') ||
    !categoryTabs.includes("aria-pressed={active}") ||
    !categoryTabs.includes("카테고리")
  ) {
    fail("search filter accessibility", "Search, sort, and category controls should expose accessible names and selected state.");
  } else if (
    !homePage.includes('aria-label="쇼핑몰 필터"') ||
    !homePage.includes('aria-label="가격대 필터"') ||
    !homeSearchSource.includes("전체 가격대") ||
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
    !homeSearchSource.includes("판매처 집중") ||
    !homeSearchSource.includes("카테고리 집중") ||
    !homeSearchSource.includes("안전 이동") ||
    !homeSearchSource.includes("searchPurposePresets") ||
    !homePage.includes('aria-label="혜택 목적 빠른 필터"') ||
    !homePage.includes("무료, 쿠폰, 앱테크, 문화 초대권을 한 번에 좁힙니다") ||
    !homeSearchSource.includes("검증 링크만") ||
    !homePage.includes('aria-label="조건별 결과 요약"') ||
    !homePage.includes("현재 필터가 보여주는 혜택을 먼저 해석합니다") ||
    !homeSearchSource.includes("현재 조건으로 볼 혜택") ||
    !homeSearchSource.includes("마감 전 확인") ||
    !homeSearchSource.includes("배송비 부담 낮음") ||
    !homePage.includes("filterActionQueue") ||
    !homePage.includes('aria-label="현재 결과 바로 실행 큐"') ||
    !homePage.includes("지금 조건에서 먼저 눌러볼 혜택을 골랐습니다") ||
    !homePage.includes("dealScanBarItems") ||
    !homePage.includes('aria-label="상품 목록 빠른 스캔"') ||
    !homeSearchSource.includes("낮은 가격 후보") ||
    !homeSearchSource.includes("할인율 최고") ||
    !homePage.includes("listComparisonCards") ||
    !homePage.includes('aria-label="현재 목록 가격 비교"') ||
    !homePage.includes('aria-label="심화 혜택 탐색 접기"') ||
    !homePage.includes("상품 목록을 먼저 보고, 필요할 때 혜택 분석을 펼치세요") ||
    !homePage.includes('aria-label="상세 필터와 결과 분석 접기"') ||
    !homePage.includes("상품 목록을 먼저 보고, 더 좁힐 때 펼치세요") ||
    !homePage.includes('aria-label="상품 목록 적용 조건 빠른 해제"') ||
    !homePage.includes("조건을 눌러 바로 해제하고 같은 목록에서 다시 비교합니다.") ||
    !homeSearchSource.includes("가격으로 먼저 고를 4가지 후보") ||
    !homeSearchSource.includes("절약액 큼") ||
    !homeSearchSource.includes("마감 먼저") ||
    !packageJson.includes("home:list-scan:doctor")
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
        !homeFeatureSource.includes("readClaimedBenefits") ||
        !homeFeatureSource.includes("readBenefitReturnReservations") ||
        !homeFeatureSource.includes("readBenefitVisitStreak") ||
        !homeFeatureSource.includes("missionSteps") ||
        !homeFeatureSource.includes("오늘 챙긴 혜택 요약") ||
        !homeFeatureSource.includes("홈 무료 혜택 방문 요약") ||
        !homeFeatureSource.includes("무료 혜택 방문 루틴 계속하기") ||
        !homeFeatureSource.includes("홈 오늘 혜택 미션") ||
        !homeFeatureSource.includes("무료 혜택 1개 챙기기") ||
        !homeFeatureSource.includes("쿠폰 1개 저장하기") ||
        !homeFeatureSource.includes("내일 볼 루틴 예약") ||
        !homeFeatureSource.includes("아직 챙길 만한 무료 혜택") ||
        !homeFeatureSource.includes("홈 재방문 예약 요약") ||
        !homeFeatureSource.includes("재방문 루틴 더 저장") ||
        !benefitDiscoverySections.includes("무료혜택 TOP 5") ||
        !benefitDiscoverySections.includes("쿠폰·앱테크 TOP 5") ||
        !benefitDiscoverySections.includes("appTechHomeDeals") ||
        !benefitDiscoverySections.includes("오늘 눌러둘 적립 혜택") ||
        !benefitDiscoverySections.includes("포인트 루틴 보기") ||
        !benefitDiscoverySections.includes("앱테크 적립 혜택 확인") ||
        !benefitDiscoverySections.includes("오늘 혜택 1분 시작") ||
        !benefitDiscoverySections.includes("앱을 열자마자 무료, 쿠폰, 생활비, 마감 순서로 바로 갑니다") ||
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
        !homeFeatureSource.includes("무료 혜택 먼저") ||
        !homeFeatureSource.includes("쿠폰·포인트 적용") ||
        !homeFeatureSource.includes("배송비 줄이기") ||
        !homeFeatureSource.includes("구매처 바로 이동") ||
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
      !homeFeatureSource.includes("dealMatchesInterestCategory") ||
      !homePage.includes("관심 카테고리 추천") ||
      !homePage.includes("비회원도 모두 보고") ||
      !homeSearchSource.includes("quickInterestOptions") ||
      !homePage.includes("toggleQuickInterest") ||
      !homePage.includes("홈 빠른 관심 설정") ||
      !homePage.includes("비회원 기기 저장") ||
      !homePage.includes("savePreferencesSynced") ||
      !homePage.includes("fetchRemotePreferences") ||
      !homePage.includes("openBenefitFilter") ||
      !homePage.includes("openBenefitPreset") ||
      !homePage.includes("onShowVerified") ||
      !homePage.includes("dealType") ||
      !smoke.includes("benefit type filter api")
    ) {
      fail("v2 benefit discovery UX", "Home should expose V2 free benefit/coupon discovery, interest personalization, and smoke-test the benefit type filter.");
    } else {
      pass("v2 benefit discovery UX", "Home exposes free benefit, coupon, apptech, daily checklist, true deal spotlight, interest personalization, mart, and rising benefit discovery with a verified benefit filter.");
    }

  if (
    !homePage.includes("clearRecentDealsSynced") ||
    !homePage.includes("최근 기록 관리") ||
    !homePage.includes("기록 비우기")
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
    !purchaseLinkOverview.includes("판매처 확인 단계")
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

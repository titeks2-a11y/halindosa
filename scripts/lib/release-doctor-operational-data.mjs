import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fail, pass, root, smokeSource, text } from "./release-doctor-harness.mjs";

export async function checkOperationalDataSurfaces() {
  const dealsRoute = await text("app/api/deals/route.ts");
  const homePage = await text("app/page.tsx");
  const claimedBenefitHomeSummary = await text("components/ClaimedBenefitHomeSummary.tsx");
  const homeFeatureSource = `${homePage}\n${claimedBenefitHomeSummary}`;
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
  const adminPage = [
    await text("app/admin/page.tsx"),
    await text("components/AdminCronRefreshPanel.tsx"),
    await text("components/AdminNewsCollectionPanel.tsx"),
    await text("components/AdminExposurePolicyPanel.tsx"),
    await text("components/AdminLinkLaunchGatePanel.tsx"),
    await text("components/AdminLinkRevalidationPriorityPanel.tsx"),
    await text("components/AdminLiveProbeReviewPanel.tsx"),
    await text("lib/adminDashboardDerivedData.ts"),
    await text("lib/adminDashboardHrefs.ts")
  ].join("\n");
  const adminDashboardConfig = await text("lib/adminDashboardConfig.ts");
  const adminDashboardSource = `${adminPage}\n${adminDashboardConfig}`;
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
  const smoke = await smokeSource();
  const redirectUrl = await text("lib/redirectUrl.ts");
  const goRoute = await text("app/go/[id]/route.ts");
  const dealTypes = await text("types/deal.ts");
  const normalizer = await text("lib/deals/normalizer.ts");
  const mockDeals = await text("data/mockDeals.ts");
  const claimGuide = await text("lib/deals/claimGuide.ts");
  const freeBenefitsPage = await text("app/free-benefits/page.tsx");
  const freeBenefitsClient = [
    await text("components/FreeBenefitsClient.tsx"),
    await text("lib/freeBenefitsConfig.ts"),
    await text("lib/freeBenefitsDerivedData.ts")
  ].join("\n");
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
    !homeFeatureSource.includes("benefitReturnReservationUpdatedEvent") ||
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
  } else if (!dealRepository.includes("applyLinkValidationExposureOverride")) {
    fail("shared link quality rules", "Repository should apply link-validation hidden/mismatch exposure overrides before customer-visible filtering.");
  } else {
    pass("shared link quality rules", "Verified purchase filtering, scoring, trust labels, and customer-facing quality notices use shared link quality rules.");
  }

  const linkPolicy = JSON.parse(await text("data/linkQualityPolicy.json"));
  const verifyLinksScript = await text("scripts/verify-product-links.mjs");
  const verifyLinksLiveScript = await text("scripts/verify-product-links-live.mjs");
  const verifyProductsScript = await text("scripts/verify-products.mjs");
  const linkQualityRegressionScript = await text("scripts/link-quality-regression.mjs");
  const exposureDoctorScript = await text("scripts/exposure-policy-doctor.mjs");
  const publishableSurfaceDoctorScript = await text("scripts/publishable-surface-doctor.mjs");
  const refreshDealsScript = await text("scripts/refresh-deals.mjs");
  const linkRevalidationPriorityScript = await text("scripts/link-revalidation-priority-report.mjs");
  const liveProbeReviewScript = await text("scripts/live-probe-review-report.mjs");
  const liveProbeReviewOperation = await text("lib/operations/liveProbeReview.ts");
  const liveProbeReviewRoute = await text("app/api/admin/live-probe-review/route.ts");
  const linkRevalidationPriorityOperation = await text("lib/operations/linkRevalidationPriority.ts");
  const linkRevalidationPriorityRoute = await text("app/api/admin/link-revalidation-priority/route.ts");
  const linkRevalidationPriorityDoc = await text("docs/LINK_REVALIDATION_PRIORITY.md");
  const liveProbeReviewDoc = await text("docs/LIVE_PROBE_REVIEW_REPORT.md");
  const linkReport = JSON.parse(await text("reports/link-validation.json"));
  const productReport = JSON.parse(await text("reports/product-quality.json"));
  const linkRegressionReportPath = join(root, "reports/link-quality-regression.json");
  const linkRegressionReport = existsSync(linkRegressionReportPath)
    ? JSON.parse(await text("reports/link-quality-regression.json"))
    : { ok: false, summary: {}, cases: [] };
  const exposureReport = JSON.parse(await text("reports/exposure-policy.json"));
  const publishableSurfaceReport = JSON.parse(await text("reports/publishable-surface.json"));
  const linkRevalidationPriorityReport = JSON.parse(await text("reports/link-revalidation-priority.json"));
  const liveProbeReviewReport = JSON.parse(await text("reports/live-probe-review.json"));
  const linkPolicyIssues = [];

  for (const key of ["blockedHosts", "searchPatterns", "unavailableTextPatterns", "liveUnavailableTextPatterns", "clientRenderedDetailHosts", "productDetailSignals", "officialBenefitUrlSignals", "exposurePolicy", "launchGate"]) {
    if (!(key in linkPolicy)) linkPolicyIssues.push(`policy missing ${key}`);
  }

  for (const [label, source] of [
    ["link validator", linkValidator],
    ["provider types", providerTypes],
    ["verify links", verifyLinksScript],
    ["verify products", verifyProductsScript],
    ["link quality regression", linkQualityRegressionScript],
    ["refresh deals", refreshDealsScript],
    ["exposure doctor", exposureDoctorScript],
    ["publishable surface doctor", publishableSurfaceDoctorScript]
  ]) {
    if (!source.includes("linkQualityPolicy")) linkPolicyIssues.push(`${label} should read linkQualityPolicy`);
  }

  if (linkReport.policy?.source !== "data/linkQualityPolicy.json") linkPolicyIssues.push("link-validation report should record policy source");
  if (!("clientRenderedDetailHosts" in (linkReport.policy ?? {}))) linkPolicyIssues.push("link-validation report should record client-rendered detail host policy coverage");
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
    "validationCode",
    "mismatchCategory",
    "mismatchAction",
    "lastCheckedAt",
    "priorityScore",
    "isHidden",
    "publishable"
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
  if (!linkReport.mismatchCategoryCounts || typeof linkReport.mismatchCategoryCounts !== "object") {
    linkPolicyIssues.push("link-validation report should summarize hidden content mismatch categories");
  }
  if ((linkReport.exposureAudit?.exposedNonPublishableItems ?? 0) !== 0) {
    linkPolicyIssues.push("link-validation report should include zero non-publishable exposed items");
  }
  if (!linkReport.httpStatusSummary || !("http404" in linkReport.httpStatusSummary) || !("robotsBlocked" in linkReport.httpStatusSummary) || !("rateLimited" in linkReport.httpStatusSummary)) {
    linkPolicyIssues.push("link-validation report should record HTTP/redirect summary");
  }
  if (
    !linkReport.contentSignalSummary ||
    !("bodyChecked" in linkReport.contentSignalSummary) ||
    !("titleMetaChecked" in linkReport.contentSignalSummary) ||
    !("contentMismatch" in linkReport.contentSignalSummary) ||
    !("accessibleContentMismatch" in linkReport.contentSignalSummary) ||
    !("accessGuardBody" in linkReport.contentSignalSummary) ||
    !("priceSignal" in linkReport.contentSignalSummary) ||
    !("purchaseActionSignal" in linkReport.contentSignalSummary)
  ) {
    linkPolicyIssues.push("link-validation report should record live title/meta, price, purchase/action, and content-match signals when body probing is enabled");
  }
  if (
    !linkReport.verificationEvidenceSummary ||
    !linkReport.verificationEvidenceSummary.counts ||
    !("liveConfirmed" in linkReport.verificationEvidenceSummary) ||
    !("sellerAccessProtected" in linkReport.verificationEvidenceSummary) ||
    !("manualPatternVerified" in linkReport.verificationEvidenceSummary) ||
    !("sellerRateLimited" in linkReport.verificationEvidenceSummary) ||
    !Array.isArray(linkReport.revalidationQueue)
  ) {
    linkPolicyIssues.push("link-validation report should include evidence tiers and a prioritized revalidation queue for access-protected or transient live checks");
  }
  if ((linkReport.verificationEvidenceSummary?.blocked ?? 0) !== 0 && (linkReport.exposureAudit?.exposedNonPublishableItems ?? 0) !== 0) {
    linkPolicyIssues.push("link-validation blocked evidence should never be exposed to users");
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
    !("exposedHardFailureCount" in linkReport.liveProbeReviewSummary) ||
    !("transientNetworkCount" in linkReport.liveProbeReviewSummary) ||
    !("accessProtectedCount" in linkReport.liveProbeReviewSummary) ||
    !linkReport.liveProbeReasonCounts ||
    !linkReport.liveProbeHostFailureCounts
  ) {
    linkPolicyIssues.push("link-validation report should separate hard live failures from seller access protections");
  }
  if (
    (linkReport.liveProbeReviewSummary?.exposedHardFailureCount ?? 0) !== 0 ||
    (linkReport.liveProbeReviewSummary?.exposedSellerUnavailableSignals ?? linkReport.liveProbeReviewSummary?.sellerUnavailableSignals ?? 0) !== 0
  ) {
    linkPolicyIssues.push("link-validation live probe should have zero exposed hard failures and zero unavailable-text signals for launch");
  }
  if (!linkReport.liveProbe?.enabled || (linkReport.liveProbe?.checked ?? 0) < (linkReport.totalDeals ?? 0)) {
    linkPolicyIssues.push("link-validation report should include a non-strict live probe pass over every curated deal before release evidence is accepted");
  }
  for (const field of ["http404", "http410", "http5xx", "timeout", "rateLimited", "robotsBlocked", "unavailableText", "redirected", "finalUrlChanged"]) {
    if (!(field in (linkReport.httpStatusSummary ?? {}))) {
      linkPolicyIssues.push(`link-validation report missing live HTTP metric ${field}`);
    }
  }
  if (!verifyLinksLiveScript.includes("DEAL_LINK_LIVE_PROBE") || !verifyLinksLiveScript.includes("--strict") || !verifyLinksLiveScript.includes("--body") || !verifyLinksLiveScript.includes("--content-strict")) {
    linkPolicyIssues.push("verify:links:live should expose optional live probe, strict mode, body probe, and content-strict controls");
  }
  if (
    !verifyLinksScript.includes("extractHtmlSignal") ||
    !verifyLinksScript.includes("classifyContentMismatch") ||
    !verifyLinksScript.includes("mismatchCategoryCounts") ||
    !verifyLinksScript.includes("getContentSimilarity") ||
    !verifyLinksScript.includes("contentSignalSummary") ||
    !verifyLinksScript.includes("verificationEvidenceSummary") ||
    !verifyLinksScript.includes("revalidationQueue") ||
    !verifyLinksScript.includes("clientRenderedDetailShell")
  ) {
    linkPolicyIssues.push("verify-product-links should extract title/meta, price, purchase/action, product-content similarity, evidence tiers, and revalidation queue signals during body probes");
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
  if (
    !publishableSurfaceDoctorScript.includes("reports/publishable-surface.json") ||
    !publishableSurfaceDoctorScript.includes("getProductExposureIssues") ||
    !publishableSurfaceDoctorScript.includes("getNewsExposureIssues") ||
    !publishableSurfaceDoctorScript.includes("homepage_link") ||
    !publishableSurfaceDoctorScript.includes("app/go/news/[id]/route.ts")
  ) {
    linkPolicyIssues.push("publishable surface doctor should audit product, official benefit, homepage/search, and redirect route exposure before release");
  }
  if (
    publishableSurfaceReport.ok !== true ||
    (publishableSurfaceReport.summary?.productCandidates ?? 0) < 140 ||
    (publishableSurfaceReport.summary?.productViolations ?? 1) !== 0 ||
    (publishableSurfaceReport.summary?.newsCandidates ?? 0) < 40 ||
    (publishableSurfaceReport.summary?.newsViolations ?? 1) !== 0 ||
    (publishableSurfaceReport.summary?.freebiesVisible ?? 0) < 5 ||
    (publishableSurfaceReport.summary?.eventsVisible ?? 0) < 30 ||
    (publishableSurfaceReport.summary?.exposedSearchLinks ?? 1) !== 0 ||
    (publishableSurfaceReport.summary?.exposedSoldOutLinks ?? 1) !== 0 ||
    (publishableSurfaceReport.summary?.exposedNonOfficialLinks ?? 1) !== 0
  ) {
    linkPolicyIssues.push("publishable-surface report should prove products, official benefits, free benefits, and events expose only publishable direct links");
  }
  if (
    !linkRevalidationPriorityScript.includes("link-revalidation-priority.json") ||
    !linkRevalidationPriorityScript.includes("LINK_REVALIDATION_PRIORITY.md") ||
    !linkRevalidationPriorityScript.includes("dealReports.local.json") ||
    !linkRevalidationPriorityScript.includes("user_report_") ||
    !linkRevalidationPriorityScript.includes("blockingRevalidationItems") ||
    !linkRevalidationPriorityScript.includes("robots_or_access_blocked") ||
    !linkRevalidationPriorityScript.includes("http_429") ||
    !linkRevalidationPriorityScript.includes("official API") ||
    !linkRevalidationPriorityScript.includes("partner feed")
  ) {
    linkPolicyIssues.push("link revalidation priority script should generate JSON/docs and route access-protected links to official API or partner feed review");
  }
  if (
    linkRevalidationPriorityReport.ok !== true ||
    (linkRevalidationPriorityReport.summary?.auditedItems ?? 0) < 140 ||
    (linkRevalidationPriorityReport.summary?.publishableItems ?? 0) < 140 ||
    (linkRevalidationPriorityReport.summary?.blockingRevalidationItems ?? 1) !== 0 ||
    (linkRevalidationPriorityReport.summary?.exposedSearchLinks ?? 1) !== 0 ||
    (linkRevalidationPriorityReport.summary?.exposedSoldOutLinks ?? 1) !== 0 ||
    (linkRevalidationPriorityReport.summary?.exposedBrokenLinks ?? 1) !== 0 ||
    typeof linkRevalidationPriorityReport.summary?.userReportedItems !== "number" ||
    !Array.isArray(linkRevalidationPriorityReport.topQueue) ||
    !linkRevalidationPriorityReport.counts?.byReason
  ) {
    linkPolicyIssues.push("link revalidation priority report should pass with zero blocking/search/sold-out/broken exposures and operator queue evidence");
  }
  if (
    !linkRevalidationPriorityOperation.includes("getLinkRevalidationPriorityReport") ||
    !linkRevalidationPriorityOperation.includes("buildLinkRevalidationPriorityCsv") ||
    !linkRevalidationPriorityRoute.includes("admin-link-revalidation-priority") ||
    !linkRevalidationPriorityRoute.includes("halindosa-link-revalidation-priority") ||
    !adminPage.includes("AdminLinkRevalidationPriorityPanel") ||
    !adminPage.includes("링크 재검증 우선순위") ||
    !adminPage.includes("신고 우선") ||
    !adminPage.includes("접근보호 403/429") ||
    !adminPage.includes("reports/link-revalidation-priority.json")
  ) {
    linkPolicyIssues.push("admin dashboard should expose link revalidation priority JSON/CSV and access-protected review guidance");
  }
  if (
    !linkRevalidationPriorityDoc.includes("Blocking revalidation items") ||
    !linkRevalidationPriorityDoc.includes("Review items") ||
    !linkRevalidationPriorityDoc.includes("Watch items") ||
    !linkRevalidationPriorityDoc.includes("Access-protected 403/429")
  ) {
    linkPolicyIssues.push("link revalidation priority docs should explain blocking, review, watch, and access-protected 403/429 handling");
  }
  if (
    !liveProbeReviewScript.includes("reports/live-probe-review.json") ||
    !liveProbeReviewScript.includes("LIVE_PROBE_REVIEW_REPORT.md") ||
    !liveProbeReviewScript.includes("hardFailureCount") ||
    !liveProbeReviewScript.includes("exposedHardFailureCount") ||
    !liveProbeReviewScript.includes("official API") ||
    !liveProbeReviewScript.includes("partner feed") ||
    !liveProbeReviewScript.includes("manual device check") ||
    !liveProbeReviewScript.includes("backoff retry")
  ) {
    linkPolicyIssues.push("live probe review script should generate JSON/docs and separate hard failures from official API, partner feed, manual device, and backoff retry queues");
  }
  if (
    liveProbeReviewReport.ok !== true ||
    (liveProbeReviewReport.summary?.totalDeals ?? 0) < 140 ||
    (liveProbeReviewReport.summary?.publishableDeals ?? 0) < 140 ||
    (liveProbeReviewReport.summary?.liveChecked ?? 0) < (liveProbeReviewReport.summary?.totalDeals ?? 0) ||
    (liveProbeReviewReport.summary?.hardFailureCount ?? 1) !== 0 ||
    (liveProbeReviewReport.summary?.exposedHardFailureCount ?? 1) !== 0 ||
    (liveProbeReviewReport.summary?.unavailableTextCount ?? 1) !== 0 ||
    (liveProbeReviewReport.summary?.exposedSearchLinks ?? 1) !== 0 ||
    (liveProbeReviewReport.summary?.exposedSoldOutLinks ?? 1) !== 0 ||
    (liveProbeReviewReport.summary?.exposedBrokenLinks ?? 1) !== 0 ||
    (liveProbeReviewReport.summary?.exposedInvalidUrls ?? 1) !== 0 ||
    (liveProbeReviewReport.summary?.exposedNonPublishableItems ?? 1) !== 0 ||
    !Array.isArray(liveProbeReviewReport.reviewQueue) ||
    !Array.isArray(liveProbeReviewReport.topHostActions) ||
    !liveProbeReviewReport.reasonCounts ||
    !liveProbeReviewReport.retryModeCounts
  ) {
    linkPolicyIssues.push("live probe review report should pass with zero hard/unavailable/search/sold-out/broken exposures and operator retry queues");
  }
  if (
    !liveProbeReviewDoc.includes("Hard failures") ||
    !liveProbeReviewDoc.includes("Exposed hard failures") ||
    !liveProbeReviewDoc.includes("official API") ||
    !liveProbeReviewDoc.includes("partner feed") ||
    !liveProbeReviewDoc.includes("manual device check") ||
    !liveProbeReviewDoc.includes("backoff retry")
  ) {
    linkPolicyIssues.push("live probe review docs should explain hard failures and official API/partner/manual/backoff handling");
  }
  if (
    !liveProbeReviewOperation.includes("getLiveProbeReviewReport") ||
    !liveProbeReviewOperation.includes("buildLiveProbeReviewCsv") ||
    !liveProbeReviewRoute.includes("canAccessAdminRequest") ||
    !liveProbeReviewRoute.includes("admin-live-probe-review") ||
    !liveProbeReviewRoute.includes("halindosa-live-probe-review") ||
    !adminPage.includes("AdminLiveProbeReviewPanel") ||
    !adminPage.includes("live probe 자동 본문 검증") ||
    !adminPage.includes("reports/live-probe-review.json") ||
    !adminPage.includes("hard failure") ||
    !adminPage.includes("official API") ||
    !adminPage.includes("partner feed") ||
    !adminPage.includes("manual device check") ||
    !adminPage.includes("backoff retry") ||
    !smoke.includes("admin live probe review api") ||
    !smoke.includes("admin live probe review csv") ||
    !smoke.includes("/api/admin/live-probe-review") ||
    !smoke.includes("Live probe review should have zero customer-visible hard failures") ||
    !smoke.includes("Admin dashboard missing live probe review panel")
  ) {
    linkPolicyIssues.push("admin dashboard should expose live probe review JSON/CSV and hard-failure/access-protected retry guidance");
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
  const requiredOfficialSmokeSnippets = [
    '["d047", "pay.naver.com"]',
    '["d054", "kakaopay.com"]',
    '["d057", "tmembership.co.kr"]',
    '["d061", "bgfretail.com"]',
    '["d073", "hyundaicard.com"]',
    '["d074", "shinhancard.com"]',
    '["d115", "bhc.co.kr"]',
    '["news-cgv-official-events", "cgv.co.kr"]',
    '["news-homeplus-official-event", "homeplus.co.kr"]',
    '["news-yogiyo-official-event", "yogiyo.co.kr"]'
  ];
  const missingOfficialSmokeSnippets = requiredOfficialSmokeSnippets.filter((snippet) => !smoke.includes(snippet));

  if (missingOfficialOutboundHosts.length || missingOfficialSmokeSnippets.length) {
    fail(
      "official benefit outbound allowlist",
      `Verified official benefit links should remain openable through redirect routes. Missing hosts: ${missingOfficialOutboundHosts.join(", ") || "none"}; missing smoke snippets: ${missingOfficialSmokeSnippets.join(", ") || "none"}`
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

  if (!quality.includes("getLinkReviewPriority") || !quality.includes("reviewReason") || !adminDashboardSource.includes("linkReviewPriorityLabels") || !adminPage.includes("linkReviewSummary") || !adminPage.includes("오늘 처리할 링크 작업") || !adminPage.includes("현재 이동 URL")) {
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
    !homeFeatureSource.includes("claimedBenefitUpdatedEvent") ||
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

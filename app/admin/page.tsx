import Link from "next/link";
import { Activity, BadgePercent, DatabaseZap, Download, ExternalLink, Flame, ImageIcon, LineChart, LockKeyhole, ShieldCheck, Store, Timer, TrendingDown, WalletCards } from "lucide-react";
import { AdminReportQueue } from "@/components/AdminReportQueue";
import { AdminDealQualityPanel } from "@/components/AdminDealQualityPanel";
import { AdminHealthReadinessPanel } from "@/components/AdminHealthReadinessPanel";
import { AdminNewsOperationsPanel } from "@/components/AdminNewsOperationsPanel";
import { AdminPushDryRunPanel } from "@/components/AdminPushDryRunPanel";
import { PartnerFeedDryRunPanel } from "@/components/PartnerFeedDryRunPanel";
import { getMockBusinessMetrics } from "@/lib/analytics";
import { canAccessAdmin, getAdminExportHref, isAdminProtectionEnabled } from "@/lib/adminAuth";
import { getDeals } from "@/lib/dealService";
import { buildBenefitDecisionGuide } from "@/lib/deals/benefitDecisionGuide";
import { buildClaimEffortSummary } from "@/lib/deals/claimEffort";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import { getNewsOperationsReport } from "@/lib/deals/newsOperations";
import { readDealOperationOverridesLive } from "@/lib/deals/operationOverrides";
import { getLinkReviewActionLabel, getLinkReviewQueue, getLinkStatusLabel, getLinkTypeLabel } from "@/lib/deals/quality";
import { getRefreshDealsReport } from "@/lib/deals/refreshReport";
import { getDealSourceReadiness, listDealSourceProfiles } from "@/lib/deals/trust";
import { buildTodayBenefitQueue } from "@/lib/deals/todayBenefitQueue";
import { buildWeeklyBenefitCalendar } from "@/lib/deals/weeklyBenefitCalendar";
import { dryRunPartnerFeedImport, samplePartnerFeed } from "@/lib/feedImport";
import { formatPrice, getRelativeTime } from "@/lib/format";
import { buildNotificationCampaigns, buildOfficialBenefitNotificationCampaigns, summarizeNotificationCampaigns, toPushQueueRows } from "@/lib/notificationCampaigns";
import { buildPushSubscriptionReadiness } from "@/lib/pushReadiness";
import { getPushReadiness } from "@/lib/pushNotifications";
import { buildReportSlaSummary } from "@/lib/reportSla";
import { getReportStorageStatus, getReportSummaryLive, listDealReportsLive } from "@/lib/reports";
import { getCronRefreshOperationsReport } from "@/lib/operations/cronRefresh";
import { getDailyOperationsReport } from "@/lib/operations/dailyOperations";
import { getExposurePolicyReport } from "@/lib/operations/exposurePolicy";
import { getHealthReadinessReport } from "@/lib/operations/healthReadiness";
import { getOfficialSourceFeedEnvReadiness } from "@/lib/operations/sourceFeedEnvReadiness";
import { getOfficialSourceLiveReport } from "@/lib/operations/sourceLiveReadiness";
import { getOfficialSourceOnboardingPlan } from "@/lib/operations/sourceOnboardingPlan";
import { getOfficialSourceReadiness } from "@/lib/operations/sourceReadiness";

const checklist = [
  { title: "제휴 고지", description: "광고/제휴 링크 여부를 상품 상세 및 이동 전 플로우에 명확히 표시" },
  { title: "데이터 권한", description: "공식 API, RSS, 제휴 피드 또는 허용된 수집 방식만 운영 데이터로 사용" },
  { title: "가격 이력", description: "가격 변동과 수집 시점을 저장해 허위 할인 리스크를 낮춤" },
  { title: "개인정보", description: "회원, 푸시, 분석 도구 연결 전 동의와 보관 기간을 정책에 반영" }
];

function formatAdminDateTime(isoDate?: string) {
  if (!isoDate) return "미정";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "미정";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

interface AdminPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { token } = await searchParams;

  if (!canAccessAdmin(token)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
            <LockKeyhole size={24} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-950">관리자 인증 필요</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            운영 대시보드는 보호되어 있습니다. 배포 환경에서는 관리자 토큰이 포함된 URL로 접근하세요.
          </p>
          <Link href="/" className="mt-5 inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const { metrics, topDeals, updatedAt, source, benefitQuality, benefitRetention, personalizationReadiness, imageQuality } = await getMockBusinessMetrics();
  const { deals } = await getDeals();
  const [reportSummary, recentReportsLive] = await Promise.all([getReportSummaryLive(), listDealReportsLive()]);
  const refreshReport = getRefreshDealsReport();
  const dealOperationOverrides = await readDealOperationOverridesLive();
  const newsOperations = getNewsOperationsReport();
  const healthReadiness = getHealthReadinessReport();
  const sourceLiveReport = getOfficialSourceLiveReport();
  const sourceOnboardingPlan = getOfficialSourceOnboardingPlan();
  const sourceFeedEnvReadiness = getOfficialSourceFeedEnvReadiness();
  const officialSourceReadiness = getOfficialSourceReadiness();
  const cronRefresh = getCronRefreshOperationsReport();
  const dailyOperations = getDailyOperationsReport();
  const exposurePolicy = getExposurePolicyReport();
  const newsResult = getVisibleNewsDeals({ limit: 20 });
  const newsDeals = newsResult.deals;
  const newsCategoryCounts = Array.from(
    newsDeals.reduce((map, deal) => map.set(deal.category, (map.get(deal.category) ?? 0) + 1), new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);
  const recentReports = recentReportsLive.slice(0, 6);
  const reportSlaSummary = buildReportSlaSummary(recentReportsLive);
  const sampleFeedValidation = dryRunPartnerFeedImport(samplePartnerFeed, "sample_partner_feed");
  const sampleFeedJson = JSON.stringify({ items: samplePartnerFeed }, null, 2);
  const sampleFeedReadyRate = sampleFeedValidation.received ? Math.round((sampleFeedValidation.valid / sampleFeedValidation.received) * 100) : 0;
  const sourceCounts = new Map<string, number>();
  const linkReviewDeals = getLinkReviewQueue(deals, 8);
  const todayBenefitQueue = buildTodayBenefitQueue(deals, 4);
  const benefitDecisionGuide = buildBenefitDecisionGuide(deals);
  const claimEffortSummary = buildClaimEffortSummary(deals);
  const weeklyBenefitCalendar = buildWeeklyBenefitCalendar(deals);
  const dailyQueueExportCount = new Set(todayBenefitQueue.sections.flatMap((section) => section.items.map((item) => item.id))).size;
  const dailyQueueApiHref = isAdminProtectionEnabled()
    ? `/api/admin/daily-queue?limit=4&token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/daily-queue?limit=4";
  const imageQueueApiHref = isAdminProtectionEnabled()
    ? `/api/admin/image-queue?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/image-queue";
  const imageQueueCsvHref = isAdminProtectionEnabled()
    ? `/api/admin/image-queue?format=csv&token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/image-queue?format=csv";
  const newsOperationsApiHref = isAdminProtectionEnabled()
    ? `/api/admin/news-operations?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/news-operations";
  const newsOperationsCsvHref = isAdminProtectionEnabled()
    ? `/api/admin/news-operations?format=csv&token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/news-operations?format=csv";
  const healthReadinessApiHref = isAdminProtectionEnabled()
    ? `/api/admin/health-readiness?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/health-readiness";
  const cronRefreshDryRunHref = isAdminProtectionEnabled()
    ? `/api/cron/refresh?dryRun=true&token=${encodeURIComponent(token ?? "")}`
    : "/api/cron/refresh?dryRun=true&token=local-admin";
  const dailyOperationsApiHref = isAdminProtectionEnabled()
    ? `/api/admin/daily-operations?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/daily-operations";
  const dailyOperationsCsvHref = isAdminProtectionEnabled()
    ? `/api/admin/daily-operations?format=csv&token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/daily-operations?format=csv";
  const exposurePolicyApiHref = isAdminProtectionEnabled()
    ? `/api/admin/exposure-policy?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/exposure-policy";
  const exposurePolicyCsvHref = isAdminProtectionEnabled()
    ? `/api/admin/exposure-policy?format=csv&token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/exposure-policy?format=csv";
  const sourceLiveApiHref = isAdminProtectionEnabled()
    ? `/api/admin/source-live?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/source-live";
  const sourceLiveCsvHref = isAdminProtectionEnabled()
    ? `/api/admin/source-live?format=csv&token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/source-live?format=csv";
  const sourceOnboardingApiHref = isAdminProtectionEnabled()
    ? `/api/admin/source-onboarding?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/source-onboarding";
  const sourceOnboardingCsvHref = isAdminProtectionEnabled()
    ? `/api/admin/source-onboarding?format=csv&token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/source-onboarding?format=csv";
  const sourceOnboardingEnvHref = isAdminProtectionEnabled()
    ? `/api/admin/source-onboarding?format=env&token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/source-onboarding?format=env";
  const sourceFeedEnvApiHref = isAdminProtectionEnabled()
    ? `/api/admin/source-feed-env?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/source-feed-env";
  const sourceReadinessApiHref = isAdminProtectionEnabled()
    ? `/api/admin/source-readiness?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/source-readiness";
  const sourceReadinessCsvHref = isAdminProtectionEnabled()
    ? `/api/admin/source-readiness?format=csv&token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/source-readiness?format=csv";
  const pushSendApiHref = isAdminProtectionEnabled()
    ? `/api/admin/push/send?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/push/send";
  const pushReadinessApiHref = isAdminProtectionEnabled()
    ? `/api/admin/push-readiness?token=${encodeURIComponent(token ?? "")}`
    : "/api/admin/push-readiness";
  const sourceReadiness = getDealSourceReadiness(deals);
  const sourceLiveRiskRows = sourceLiveReport.sources.filter((item) => item.status !== "reachable").slice(0, 5);
  const sourceOnboardingTopQueue = sourceOnboardingPlan.queue.slice(0, 8);
  const sourceFeedEnvFailures = sourceFeedEnvReadiness.rows.filter((row) => row.status !== "passed");
  const sourceFeedEnvRegressionFailures = sourceFeedEnvReadiness.policyRegressionSamples.filter((sample) => !sample.passed);
  const sourceFeedEnvRows = (sourceFeedEnvFailures.length ? sourceFeedEnvFailures : sourceFeedEnvReadiness.rows).slice(0, 4);
  const sourceReadinessFailedGates = officialSourceReadiness.gates.filter((gate) => !gate.ok);
  const sourceReadinessNextActions = officialSourceReadiness.operatorNextActions.slice(0, 5);
  const priorityLabels = {
    high: "우선",
    medium: "보강",
    low: "대기"
  };
  const priorityClassNames = {
    high: "bg-red-50 text-dossa-red",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-slate-100 text-slate-600"
  };
  const linkReviewSummary = [
    {
      priority: "high",
      title: "오늘 먼저 처리",
      count: linkReviewDeals.filter((deal) => deal.reviewPriority === "high").length,
      description: "인기·마감 상품 또는 오류/품절 가능성이 있어 우선 확인"
    },
    {
      priority: "medium",
      title: "상품 URL 보강",
      count: linkReviewDeals.filter((deal) => deal.reviewPriority === "medium").length,
      description: "판매처 검색 이동 상품을 실제 상품 상세 URL로 보강"
    },
    {
      priority: "low",
      title: "대기 검수",
      count: linkReviewDeals.filter((deal) => deal.reviewPriority === "low").length,
      description: "노출 우선순위는 낮지만 출시 전 순차 확인"
    }
  ] as const;
  const benefitOperationSummary = [
    {
      title: "혜택형 콘텐츠",
      value: `${benefitQuality.freeBenefitCount}개`,
      description: "무료, 쿠폰, 포인트, 체험단, 생활 혜택 큐"
    },
    {
      title: "활성 노출 가능",
      value: `${benefitQuality.activeCount}개`,
      description: "종료 전 상태로 사용자에게 보여줄 수 있는 혜택"
    },
    {
      title: "구매처 확인",
      value: `${benefitQuality.verifiedCount}/${benefitQuality.total}`,
      description: "판매처 이동 전 링크 확인이 끝난 항목"
    },
    {
      title: "점검 우선",
      value: `${benefitQuality.needsReviewCount}개`,
      description: "신고, 종료, 품절, 링크 보강을 먼저 확인할 항목"
    }
  ];
  const benefitTypeBreakdown = benefitQuality.typeBreakdown.slice(0, 8);
  const benefitActionQueue = benefitQuality.actionQueue;
  const benefitConditionAudit = benefitQuality.conditionAudit;
  const benefitConditionOperationQueue = benefitQuality.conditionOperationQueue;
  const urgentBenefitActions = benefitActionQueue.filter((item) => item.priority === "high").length;
  const dailyOperationCheckIn = [
    {
      title: "무료 혜택 보강",
      value: `${benefitQuality.freeBenefitCount}개`,
      description: "무료 샘플, 쿠폰, 포인트, 체험 혜택이 매일 볼 만큼 충분한지 확인",
      href: "/free-benefits"
    },
    {
      title: "링크 검수",
      value: `${metrics.needsReviewLinks}개`,
      description: "검색 이동이나 확인 필요 링크를 실제 상품/혜택 상세 URL로 보강",
      href: getAdminExportHref(token)
    },
    {
      title: "신고·종료 정리",
      value: `${reportSummary.open + urgentBenefitActions}건`,
      description: "사용자 신고, 종료 임박, 품절 가능성이 있는 혜택을 먼저 정리",
      href: "#report-queue"
    },
    {
      title: "재방문 루틴",
      value: `${benefitRetention.activeRoutineSlots}/5`,
      description: "무료·쿠폰·포인트·마트·마감 혜택 슬롯이 매일 갱신되는지 확인",
      href: "/notifications"
    }
  ];
  const decisionGuideOperationActions = {
    free: "무료 샘플, 체험단, 초대권의 수령 조건과 배송비를 먼저 보강",
    coupon: "최소 주문 금액, 중복 가능 여부, 결제수단 조건을 최신화",
    endingSoon: "마감 시간, 선착순 여부, 종료 신고를 우선 정리",
    verified: "검색 fallback 없이 상품·혜택 상세 URL을 검수"
  };
  const claimEffortOperationQueue = claimEffortSummary.groups.map((group) => {
    const sample = group.items[0];
    const operationAction =
      group.effort === "easy"
        ? "앱 첫 화면과 무료혜택 탭에 우선 노출"
        : group.effort === "condition"
          ? "가입·배송비·쿠폰 조건을 카드와 상세에 보강"
          : "마감·선착순·종료 신고를 당일 점검";

    return {
      ...group,
      sampleTitle: sample?.title ?? "노출 후보 없음",
      operationAction
    };
  });
  const benefitPriorityLabels = {
    high: "오늘 처리",
    medium: "이번 주 보강",
    low: "유지 관리"
  };
  const benefitPriorityClassNames = {
    high: "bg-red-50 text-dossa-red",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-emerald-50 text-emerald-700"
  };

  for (const deal of deals) {
    sourceCounts.set(deal.source, (sourceCounts.get(deal.source) ?? 0) + 1);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const visibleDeals = deals.filter((deal) => !deal.isHidden && deal.availability === "active" && deal.validationStatus === "passed");
  const hiddenDeals = deals.filter((deal) => deal.isHidden);
  const failedDeals = deals.filter((deal) => deal.validationStatus === "failed" || deal.availability !== "active");
  const liveProbeFailureReasons = Object.entries(exposurePolicy.liveProbeFailureReasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const liveProbeFailedHosts = Object.entries(exposurePolicy.liveProbeHostFailureCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const todayNewDeals = deals.filter((deal) => new Date(deal.createdAt).getTime() >= todayStart.getTime());
  const topPopularityDeals = [...deals]
    .sort((a, b) => b.clickCount + b.popularityScore - (a.clickCount + a.popularityScore))
    .slice(0, 20);
  const topFavoriteDeals = [...deals].sort((a, b) => b.likeCount - a.likeCount || b.popularityScore - a.popularityScore).slice(0, 20);
  const providerVolume = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const recentProviderErrors = refreshReport.providerStats.flatMap((provider) =>
    (provider.errors ?? []).slice(0, 3).map((error) => `${provider.provider}: ${error}`)
  );
  const pushReadiness = getPushReadiness();
  const productNotificationCampaigns = buildNotificationCampaigns(deals, { fcmConfigured: pushReadiness.configured });
  const officialBenefitNotificationCampaigns = buildOfficialBenefitNotificationCampaigns(newsDeals, { fcmConfigured: pushReadiness.configured });
  const notificationCampaigns = [...productNotificationCampaigns, ...officialBenefitNotificationCampaigns];
  const notificationCampaignSummary = summarizeNotificationCampaigns(notificationCampaigns, visibleDeals.length);
  const notificationQueueRows = toPushQueueRows(notificationCampaigns);
  const pushSubscriptionReadiness = buildPushSubscriptionReadiness(notificationCampaigns);

  const cards = [
    { label: "전체 특가", value: metrics.totalDeals.toLocaleString("ko-KR"), icon: Store },
    { label: "핫딜", value: metrics.hotDeals.toLocaleString("ko-KR"), icon: Flame },
    { label: "마감임박", value: metrics.endingSoonDeals.toLocaleString("ko-KR"), icon: Timer },
    { label: "평균 할인율", value: `${metrics.averageDiscount}%`, icon: BadgePercent },
    { label: "예상 절약액", value: formatPrice(metrics.potentialSavings), icon: WalletCards },
    { label: "예상 클릭 가치", value: metrics.estimatedClickValue.toLocaleString("ko-KR"), icon: LineChart },
    { label: "가격 주목 상품", value: metrics.lowestPriceDeals.toLocaleString("ko-KR"), icon: TrendingDown },
    { label: "평균 신뢰도", value: `${metrics.averageConfidenceScore}점`, icon: ShieldCheck },
    { label: "구매 링크 확인율", value: `${metrics.verifiedLinkRate}%`, icon: ShieldCheck },
    { label: "실상품 이미지", value: `${metrics.realImageRate}%`, icon: ImageIcon },
    { label: "링크 검토 필요", value: metrics.needsReviewLinks.toLocaleString("ko-KR"), icon: Activity },
    { label: "이미지 보강 필요", value: metrics.fallbackImageCount.toLocaleString("ko-KR"), icon: ImageIcon },
    { label: "품절/오류 링크", value: (metrics.soldOutLinks + metrics.brokenLinks).toLocaleString("ko-KR"), icon: Activity },
    { label: "미처리 신고", value: reportSummary.open.toLocaleString("ko-KR"), icon: Activity },
    { label: "SLA 초과 신고", value: reportSlaSummary.overdue.toLocaleString("ko-KR"), icon: Timer }
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-5 text-white shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-black text-red-200">
              할인도사로 돌아가기
            </Link>
            <h1 className="mt-3 text-3xl font-black">운영 대시보드</h1>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              source: {source} · 업데이트 {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/15">
            <Activity size={18} />
            {isAdminProtectionEnabled() ? "보호 모드" : "로컬 공개 모드"}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">운영 데이터 내보내기</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              상위 정렬 기준의 특가 데이터를 CSV로 확인합니다. 오늘 혜택 큐 섹션, 노출 순위, 운영 액션 후보도 함께 내려받습니다.
            </p>
          </div>
          <a
            href={getAdminExportHref(token)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white transition hover:bg-dossa-deep"
          >
            <Download size={17} />
            CSV 다운로드
          </a>
        </div>

        <AdminDealQualityPanel token={token} initialReport={refreshReport} initialManualHiddenDealIds={Object.keys(dealOperationOverrides.hidden).sort()} />

        <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm" aria-label="노출 정책 감사">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-emerald-700">노출 정책 감사</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">사용자에게 보이는 링크만 한 번 더 검증</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                `reports/exposure-policy.json` 기준으로 검색 링크, 품절/종료 링크, 실패 링크가 노출 목록에 섞였는지 점검합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={exposurePolicyApiHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
              >
                <ShieldCheck size={17} aria-hidden="true" />
                노출 감사 JSON
              </a>
              <a
                href={exposurePolicyCsvHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700"
              >
                <Download size={17} aria-hidden="true" />
                노출 감사 CSV
              </a>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["감사 상품", exposurePolicy.summary.auditedItems, "전체 노출 후보"],
              ["노출 가능", exposurePolicy.summary.exposedItems, "정책 통과"],
              ["문제 노출", exposurePolicy.summary.badExposedItems, "즉시 0 유지"],
              ["검색/품절 노출", exposurePolicy.summary.searchLinksExposed + exposurePolicy.summary.soldOutExposed, "차단 대상"]
            ].map(([label, value, description]) => (
              <div key={label} className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-black text-emerald-700">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
                <p className="mt-1 text-xs font-bold text-emerald-900/70">{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">출시 판정</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${exposurePolicy.ok ? "bg-white text-emerald-700" : "bg-white text-dossa-red"}`}>
                  {exposurePolicy.ok ? "통과" : "점검 필요"}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-emerald-900/75">
                평균 우선순위 {exposurePolicy.summary.averagePriorityScore}점 · 숨김 후보 {exposurePolicy.summary.hiddenItems}개 · 실패 노출 {exposurePolicy.summary.failedExposed}개
              </p>
              <p className="mt-2 text-xs font-bold leading-5 text-emerald-900/75">
                생성 시각 {exposurePolicy.generatedAt ? getRelativeTime(exposurePolicy.generatedAt) : "리포트 없음"}
              </p>
              <p className="mt-2 text-xs font-bold leading-5 text-emerald-900/75">
                라이브 HTTP 검증 {exposurePolicy.liveProbe.enabled ? `${exposurePolicy.liveProbe.checked}개 검사 · 실패 ${exposurePolicy.liveProbe.failed}개` : "미실행"} · timeout {exposurePolicy.liveProbe.timeoutMs}ms
              </p>
              <p className="mt-2 text-xs font-bold leading-5 text-emerald-900/75">
                강한 실패 신호 {exposurePolicy.liveProbeReviewSummary.hardFailureCount}개 · 품절 본문 {exposurePolicy.liveProbeReviewSummary.sellerUnavailableSignals}개
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">노출 차단 정책</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                  availability={exposurePolicy.exposurePolicy?.availability ?? "active"}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                  validation={exposurePolicy.exposurePolicy?.validationStatus ?? "passed"}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                  search/seller_search/unavailable 차단
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                  finalUrl 필수
                </span>
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
                문제가 생기면 `npm run verify:links`, `npm run verify:links:live`, `npm run verify:products`, `npm run exposure:doctor` 순서로 원인을 먼저 확인합니다.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {[
              ["라이브 모드", exposurePolicy.liveProbe.enabled ? "실행" : "정적", exposurePolicy.liveProbe.enabled ? "실제 HTTP/redirect 확인" : "정책 기반 검증"],
              ["검사/통과", `${exposurePolicy.liveProbe.checked}/${exposurePolicy.liveProbe.passed}`, "live probe 결과"],
              ["강한 실패 신호", exposurePolicy.liveProbeReviewSummary.hardFailureCount, "404/410/5xx/timeout/품절"],
              ["접근 보호 신호", exposurePolicy.liveProbeReviewSummary.accessProtectedCount, "403/robots/access"],
              ["리다이렉트", exposurePolicy.liveProbe.redirected, `최종 URL 변경 ${exposurePolicy.liveProbe.finalUrlChanged}`],
              ["품절 문구", exposurePolicy.liveProbe.unavailableText, "본문 감지"]
            ].map(([label, value, description]) => (
              <div key={label} className="rounded-2xl border border-emerald-100 bg-white p-3">
                <p className="text-[11px] font-black text-emerald-700">{label}</p>
                <p className="mt-1 text-lg font-black text-slate-950">{typeof value === "number" ? value.toLocaleString("ko-KR") : value}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black text-slate-950">라이브 실패 사유 분포</p>
              <p className="text-xs font-bold text-amber-800">
                {exposurePolicy.liveProbeReviewSummary.interpretation}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(liveProbeFailureReasons.length ? liveProbeFailureReasons : [["none", 0]]).map(([reason, count]) => (
                <span key={reason} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-amber-800 shadow-sm">
                  {reason === "none" ? "실패 사유 없음" : reason} {Number(count).toLocaleString("ko-KR")}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-amber-100 pt-3">
              {(liveProbeFailedHosts.length ? liveProbeFailedHosts : [["none", 0]]).map(([host, count]) => (
                <span key={host} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-amber-800 shadow-sm">
                  {host === "none" ? "실패 판매처 없음" : host} {Number(count).toLocaleString("ko-KR")}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">상품별 노출 감사 샘플</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  전체 행은 CSV로 내려받고, 화면에서는 대표 노출 후보의 최종 도메인과 검증 상태를 빠르게 확인합니다.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {exposurePolicy.auditedItems.length.toLocaleString("ko-KR")}개 행
              </span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {(exposurePolicy.auditedItems.length ? exposurePolicy.auditedItems.slice(0, 6) : []).map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-950">{item.id}</p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-emerald-700">
                      {item.validationStatus}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-bold text-slate-600">{item.host || item.finalUrl}</p>
                  <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
                    {item.linkType} · {item.availability} · 우선순위 {item.priorityScore} · {item.lastCheckedAt ? getRelativeTime(item.lastCheckedAt) : "확인 시각 없음"}
                  </p>
                </div>
              ))}
              {!exposurePolicy.auditedItems.length ? (
                <p className="rounded-2xl bg-amber-50 p-3 text-xs font-black text-amber-700">상품별 감사 행 없음. `npm run exposure:doctor`를 실행하세요.</p>
              ) : null}
            </div>
          </div>
        </section>

        <AdminHealthReadinessPanel report={healthReadiness} apiHref={healthReadinessApiHref} />

        <section className="rounded-3xl border border-brand-line bg-white p-5 shadow-lift" aria-label="자동 refresh cron 운영 상태">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black text-brand-red">자동 refresh cron 운영</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">6시간마다 검증 데이터 갱신 상태를 확인합니다</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Vercel Cron이 `/api/cron/refresh`를 호출하고, 결과는 `reports/cron-refresh.json`과 `reports/refresh-all.json`로 남습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-black ${cronRefresh.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brand-red"}`}>
                {cronRefresh.label}
              </span>
              <span className="rounded-full bg-brand-warm px-3 py-1 text-xs font-black text-slate-700">
                {cronRefresh.schedule}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${cronRefresh.secretConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                CRON_SECRET {cronRefresh.secretConfigured ? "설정됨" : "배포 전 설정"}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["상품 특가", cronRefresh.productDealsCount],
              ["공식 혜택", cronRefresh.newsDealsCount],
              ["숨김 처리", cronRefresh.hiddenCount],
              ["실패", cronRefresh.failedCount]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-brand-warm p-4">
                <p className="text-xs font-black text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">마지막 cron 실행</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                {cronRefresh.generatedAt ? `${getRelativeTime(cronRefresh.generatedAt)} · ${cronRefresh.ageHours ?? 0}시간 경과` : "아직 직접 실행 리포트 없음"}
              </p>
              <p className="mt-2 text-xs font-black text-brand-red">
                상태 {cronRefresh.status} · refresh:all {cronRefresh.refreshAllOk ? "정상" : "점검"}
              </p>
              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
                {cronRefresh.message}
              </p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-black text-slate-950">다음 운영 액션</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{cronRefresh.nextAction}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={cronRefreshDryRunHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-brand-red px-4 py-2 text-xs font-black text-white"
                >
                  dry-run 확인
                </a>
                <code className="rounded-2xl bg-white px-3 py-2 text-[11px] font-black text-slate-700">
                  {cronRefresh.command}
                </code>
              </div>
              <p className="mt-3 text-[11px] font-bold leading-5 text-red-900/70">
                {cronRefresh.guardrails[0]} · {cronRefresh.guardrails[1]}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-line bg-white p-5 shadow-lift" aria-label="뉴스 수집 현황">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-brand-red">뉴스 수집 현황</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">공식 이벤트·무료 혜택 feed 후보</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                뉴스 기사는 출처로만 쓰고, 사용자 이동은 공식 이벤트·구매·혜택 페이지로 검증된 항목만 노출합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={newsOperationsApiHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-brand-red px-4 py-3 text-center text-sm font-black text-white"
              >
                운영 리포트 API 보기
              </a>
              <a
                href={newsOperationsCsvHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-line bg-white px-4 py-3 text-center text-sm font-black text-slate-800"
              >
                <Download size={16} aria-hidden="true" />
                Provider 위험도 CSV
              </a>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ["노출 뉴스혜택", newsOperations.visibleCount],
              ["카테고리", newsCategoryCounts.length],
              ["공식 링크", newsDeals.filter((deal) => deal.validationStatus === "passed").length],
              ["숨김", newsOperations.hiddenCount],
              ["종료", newsOperations.expiredCount],
              ["실패", newsOperations.failedCount]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-brand-warm p-4">
                <p className="text-xs font-black text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">신선도 운영</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${newsOperations.freshness.severity === "good" ? "bg-emerald-50 text-emerald-700" : newsOperations.freshness.severity === "caution" ? "bg-amber-50 text-amber-700" : "bg-white text-dossa-red"}`}>
                  {newsOperations.freshness.label}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                마지막 생성 {newsOperations.freshness.generatedAt ? getRelativeTime(newsOperations.freshness.generatedAt) : "없음"} · 갱신 주기 {newsOperations.freshness.cadenceHours}시간 · stale 기준 {newsOperations.freshness.staleHours}시간
              </p>
              <p className="mt-2 text-xs font-black text-dossa-red">
                다음 refresh 권장: {formatAdminDateTime(newsOperations.freshness.nextRefreshDueAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">공식 혜택 다음 운영 액션</p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {newsOperations.operatorNextActions.slice(0, 3).map((action) => (
                  <div key={`${action.priority}-${action.title}`} className="min-w-[220px] rounded-2xl bg-white px-3 py-2 shadow-sm">
                    <p className="text-xs font-black text-slate-950">{action.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-5 text-slate-500">{action.description}</p>
                    {action.command ? <code className="mt-2 block rounded-xl bg-brand-warm px-2 py-1 text-[10px] font-black text-dossa-red">{action.command}</code> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">공식 피드 전환 준비도</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  공식 API/RSS/제휴 feed로 바꿀 때 볼 운영 기준입니다. 현재도 승인 seed로 노출하지만, 상용 운영은 provider별 공식 feed 연결을 우선합니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-dossa-red shadow-sm">
                  {newsOperations.feedTransitionReadiness.label}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                  연결 {newsOperations.feedTransitionReadiness.configuredProviders}/{newsOperations.feedTransitionReadiness.totalProviders}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                  feed URL {newsOperations.feedTransitionReadiness.configuredFeedUrls}개
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                  준비율 {newsOperations.feedTransitionReadiness.readinessRate}%
                </span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {newsOperations.feedTransitionReadiness.providers.map((provider) => (
                <div key={provider.provider} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-950">{provider.label}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${provider.configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {provider.modeLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
                    노출 {provider.visibleCount} · 이슈 {provider.issueCount} · URL {provider.feedUrls}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-5 text-slate-500">{provider.acceptedSources}</p>
                  <p className="mt-2 line-clamp-2 text-[11px] font-black leading-5 text-dossa-red">{provider.nextAction}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {provider.envKeys.map((key) => (
                      <code key={key} className="rounded-full bg-brand-warm px-2 py-0.5 text-[10px] font-black text-slate-700">
                        {key}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
              {newsOperations.feedTransitionReadiness.operatorAction} · {newsOperations.feedTransitionReadiness.guardrails[0]}
            </p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">카테고리별 공식 혜택</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {newsCategoryCounts.map(([categoryName, count]) => (
                  <span key={categoryName} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">
                    {categoryName} {count}개
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
                `refresh:news`와 `verify:news`가 검색, 커뮤니티, 뉴스 기사 단독 링크를 숨김 처리합니다.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {newsDeals.slice(0, 4).map((deal) => (
                <a
                  key={deal.id}
                  href={deal.finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-100 hover:bg-red-50"
                >
                  <p className="line-clamp-2 text-sm font-black text-slate-950">{deal.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{deal.summary}</p>
                  <p className="mt-3 text-[11px] font-black text-brand-red">{deal.sourceName} · 공식 링크 확인</p>
                </a>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">Provider별 성공/실패</p>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                  refresh:all {newsOperations.refreshAll.ok ? "정상" : "점검"}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {newsOperations.providerStats.map((provider) => (
                  <div key={provider.provider} className="rounded-2xl bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-slate-800">{provider.provider}</p>
                      <p className="text-[11px] font-black text-slate-500">{provider.configured ? "feed 연결" : "seed/fallback"}</p>
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">
                      수집 {provider.fetchedCount ?? 0} · 정규화 {provider.normalizedCount ?? 0} · 노출 {provider.visibleCount ?? 0} · 숨김 {provider.hiddenCount ?? 0} · 오류 {provider.errorCount ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-black text-slate-950">검증 실패 TOP10</p>
              <div className="mt-3 space-y-2">
                {newsOperations.failureReasonTop10.length ? (
                  newsOperations.failureReasonTop10.map((item) => (
                    <div key={item.reason} className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50 px-3 py-2">
                      <p className="truncate text-xs font-black text-amber-800">{item.reason}</p>
                      <p className="text-xs font-black text-amber-700">{item.count}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700">현재 실패 사유 없음</p>
                )}
              </div>
              <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500">
                공식 링크 없음 {newsOperations.officialMissingCount}건 · 기간 종료 {newsOperations.expiredCount}건 · 수동 숨김 {newsOperations.overrides.hiddenCount}건
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-black text-slate-950">최근 20개 수집 로그</p>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {newsOperations.recentLogs.slice(0, 20).map((log) => (
                  <div key={`${log.dealId}-${log.checkedAt}`} className="rounded-2xl bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-black text-slate-800">{log.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${log.status === "visible" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-dossa-red"}`}>
                        {log.status === "visible" ? "노출" : "숨김"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{log.provider} · {log.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">숨김/종료/공식 링크 없음 큐</p>
              <div className="mt-3 space-y-2">
                {newsOperations.hiddenDeals.length ? (
                  newsOperations.hiddenDeals.slice(0, 8).map((deal) => (
                    <div key={String(deal.id)} className="rounded-2xl bg-white px-3 py-2">
                      <p className="line-clamp-1 text-xs font-black text-slate-800">{deal.title}</p>
                      <p className="mt-1 truncate text-[11px] font-bold text-dossa-red">{deal.hiddenReason}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white px-3 py-3 text-xs font-black text-emerald-700">숨김 처리된 공식 혜택 없음</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">수동 숨김/복구/재검증 구조</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {newsOperations.manualActions.map((action) => (
                  <div key={action.action} className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-black text-slate-950">{action.label}</p>
                    <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">{action.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500">
                API: POST {newsOperationsApiHref} · action=hide/restore/revalidate, id, reason. 로컬에서는 override 파일, 운영에서는 Supabase admin_actions로 확장합니다.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <AdminNewsOperationsPanel apiHref={newsOperationsApiHref} initialReport={newsOperations} />
          </div>
        </section>

        <section className="rounded-3xl border border-brand-line bg-brand-surface p-5 shadow-lift" aria-label="출시 운영 핵심 지표">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">출시 운영 핵심 지표</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">노출 품질, 인기 반응, 알림 준비 상태</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Play Store 출시 후 매일 확인할 상품 노출 상태와 사용자 반응 지표입니다.
              </p>
            </div>
            <a
              href={`/api/admin/push/send${token ? `?token=${encodeURIComponent(token)}` : ""}`}
              className="rounded-2xl bg-brand-navy px-4 py-3 text-center text-sm font-black text-white"
            >
              Push readiness API
            </a>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ["전체", deals.length],
              ["오늘 신규", todayNewDeals.length],
              ["노출 가능", visibleDeals.length],
              ["숨김", hiddenDeals.length],
              ["실패/종료", failedDeals.length],
              ["Push", pushReadiness.configured ? "ON" : "준비"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-black text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{typeof value === "number" ? value.toLocaleString("ko-KR") : value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-black text-slate-950">인기 상품 TOP20</p>
              <div className="mt-3 space-y-2">
                {topPopularityDeals.slice(0, 8).map((deal, index) => (
                  <div key={deal.id} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[11px] font-black text-white">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-700">{deal.title}</span>
                    <span className="shrink-0 text-xs font-black text-dossa-red">{deal.clickCount + deal.popularityScore}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-black text-slate-950">찜 TOP20</p>
              <div className="mt-3 space-y-2">
                {topFavoriteDeals.slice(0, 8).map((deal, index) => (
                  <div key={deal.id} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[11px] font-black text-dossa-red">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-700">{deal.title}</span>
                    <span className="shrink-0 text-xs font-black text-dossa-red">{deal.likeCount}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-black text-slate-950">Provider 수집량 · 최근 오류</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {providerVolume.map(([provider, count]) => (
                  <span key={provider} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600">
                    {provider} {count}
                  </span>
                ))}
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                {recentProviderErrors.length ? (
                  recentProviderErrors.slice(0, 4).map((error) => (
                    <p key={error} className="truncate text-xs font-bold leading-6 text-amber-700">{error}</p>
                  ))
                ) : (
                  <p className="text-xs font-black text-emerald-700">최근 provider 오류 없음</p>
                )}
                <p className="mt-2 text-[11px] font-bold text-slate-400">
                  Push: {pushReadiness.configured ? "FCM 발송 가능" : "FCM 키 입력 전 구조 준비"} · 숨김 상태는 Supabase admin_actions로 영구화 가능
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-line bg-white p-5 shadow-lift" aria-label="알림 캠페인 운영 큐">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-brand-red">알림 캠페인 운영 큐</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">오늘 발송 후보와 FCM 준비 상태</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                검증 상품과 공식 뉴스·이벤트 혜택을 분리해 무료 혜택, 가격 인하, 마감 임박, 관심 카테고리 발송 후보를 같은 규칙으로 편성합니다.
              </p>
            </div>
            <a
              href={`/api/admin/notification-campaigns?includeRows=true${token ? `&token=${encodeURIComponent(token)}` : ""}`}
              className="rounded-2xl bg-brand-navy px-4 py-3 text-center text-sm font-black text-white"
            >
              캠페인 API 보기
            </a>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ["캠페인", notificationCampaignSummary.totalCampaigns],
              ["발송 가능", notificationCampaignSummary.readyCampaigns],
              ["후보 상품", notificationCampaignSummary.candidateDeals],
              ["공식 혜택 캠페인", officialBenefitNotificationCampaigns.length],
              ["큐 행", notificationQueueRows.length],
              ["예상 대상", notificationCampaignSummary.estimatedAudience],
              ["긴급", notificationCampaignSummary.criticalCampaigns]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-brand-warm p-4">
                <p className="text-xs font-black text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-brand-line bg-brand-warm p-4" aria-label="푸시 구독 준비도">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">푸시 구독·동의 준비도</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
                  실제 푸시 권한 요청 전, 관심 카테고리 세그먼트와 동의/철회 데이터 구조가 발송 후보 큐와 맞물리는지 점검합니다.
                </p>
              </div>
              <a href={pushReadinessApiHref} className="w-fit rounded-2xl bg-brand-navy px-4 py-2.5 text-xs font-black text-white">
                푸시 준비도 API
              </a>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ["준비 점수", `${pushSubscriptionReadiness.readinessScore}점`],
                ["구독 세그먼트", `${pushSubscriptionReadiness.readySegments}/${pushSubscriptionReadiness.segmentCoverage.length}`],
                ["큐 행", pushSubscriptionReadiness.queueRows],
                ["동의 체크", `${pushSubscriptionReadiness.consentChecklist.filter((item) => item.ready).length}/${pushSubscriptionReadiness.consentChecklist.length}`],
                ["상태", pushSubscriptionReadiness.launchStatus === "send_ready" ? "발송 준비" : pushSubscriptionReadiness.launchStatus === "dry_run_ready" ? "dry-run 준비" : "세그먼트 보강"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white p-3">
                  <p className="text-[11px] font-black text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{typeof value === "number" ? value.toLocaleString("ko-KR") : value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs font-black text-slate-950">관심 카테고리 세그먼트</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pushSubscriptionReadiness.segmentCoverage.slice(0, 10).map((segment) => (
                    <span
                      key={segment.category}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                        segment.ready ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {segment.category} {segment.queueRows}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-xs font-black text-slate-950">동의/철회 체크</p>
                <div className="mt-2 space-y-1.5">
                  {pushSubscriptionReadiness.consentChecklist.slice(0, 4).map((item) => (
                    <p key={item.key} className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                      <span>{item.label}</span>
                      <span className={item.ready ? "text-emerald-700" : "text-amber-700"}>{item.ready ? "준비" : "보강"}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-500">
              {pushSubscriptionReadiness.nextActions[0]} · {pushSubscriptionReadiness.nextActions[2]}
            </p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">검증 상품 캠페인</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                실제 구매 상세 링크가 검증된 상품 기반 후보입니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {productNotificationCampaigns.map((campaign) => (
                  <span key={campaign.id} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-sm">
                    {campaign.title} {campaign.dealIds.length}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-black text-slate-950">공식 혜택 캠페인</p>
              <p className="mt-1 text-xs font-bold leading-5 text-amber-800">
                공식 이벤트/공공/쿠폰 페이지가 검증된 혜택만 푸시 후보로 편성합니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {officialBenefitNotificationCampaigns.map((campaign) => (
                  <span key={campaign.id} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-amber-700 shadow-sm">
                    {campaign.title} {campaign.benefitIds.length}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            {notificationCampaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-slate-950">{campaign.title}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                      campaign.priority === "critical"
                        ? "bg-red-50 text-brand-red"
                        : campaign.priority === "high"
                          ? "bg-orange-50 text-brand-coral"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {campaign.priority === "critical" ? "긴급" : campaign.priority === "high" ? "우선" : "기본"}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{campaign.body}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                    {campaign.segmentLabel}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-red shadow-sm">
                    {(campaign.dealIds.length || campaign.benefitIds.length).toLocaleString("ko-KR")}개
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-navy shadow-sm">
                    {campaign.sourceKind === "official_benefit" ? "공식 혜택" : "검증 상품"}
                  </span>
                </div>
                {campaign.sourceNames.length ? (
                  <p className="mt-2 line-clamp-1 text-[11px] font-bold text-amber-700">
                    출처: {campaign.sourceNames.slice(0, 2).join(", ")}
                  </p>
                ) : null}
                <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500">
                  {campaign.readiness === "ready" ? "FCM 발송 가능" : campaign.blockedReasons[0] ?? "운영 후보 큐"}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-brand-warm px-4 py-3 text-xs font-bold leading-5 text-slate-600">
            {notificationCampaignSummary.nextAction} 실제 푸시 권한 요청은 사용자 동의와 FCM 환경변수 설정 후에만 활성화합니다.
          </p>
          <AdminPushDryRunPanel apiHref={pushSendApiHref} push={pushReadiness} campaigns={notificationCampaigns} />
        </section>

        <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">오늘 혜택 큐 CSV 준비</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">운영자가 바로 검수할 노출 후보</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                CSV 내보내기에 `dailyQueueSections`, `dailyQueueRank`, `dailyQueueAction`을 포함해 무료·쿠폰·앱테크·마감 혜택을 매일 보강할 수 있게 했습니다.
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center">
              <p className="text-xs font-black text-dossa-red">내보내기 후보</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{dailyQueueExportCount}개</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">오늘 혜택 운영 API</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">
                백오피스, 노션 자동화, 향후 푸시 편성 작업에서 같은 큐를 JSON으로 재사용합니다.
              </p>
            </div>
            <a href={dailyQueueApiHref} className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-dossa-red shadow-sm">
              운영 큐 JSON 보기
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {todayBenefitQueue.sections.slice(0, 6).map((section) => (
              <div key={section.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{section.title}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{section.description}</p>
                <p className="mt-3 rounded-full bg-white px-3 py-1.5 text-center text-xs font-black text-dossa-red shadow-sm">
                  CSV 후보 {section.items.length}개
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="주간 혜택 편성 캘린더">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">주간 혜택 편성 캘린더</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">요일별로 채워야 할 재방문 루틴</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                무료·쿠폰·앱테크·마트·마감·실구매·비회원 혜택을 요일별 운영 슬롯으로 나눠 매일 들어올 이유를 유지합니다.
              </p>
            </div>
            <a href="/api/benefits/calendar" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">
              주간 캘린더 JSON 보기
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-7">
            {weeklyBenefitCalendar.map((item) => (
              <div key={item.day} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-dossa-red shadow-sm">
                    {item.day}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{item.count}개</span>
                </div>
                <p className="mt-3 text-sm font-black leading-5 text-slate-950">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{item.copy}</p>
                <p className="mt-3 line-clamp-3 rounded-2xl bg-white px-3 py-2 text-[11px] font-bold leading-4 text-slate-500 shadow-sm">
                  {item.operationNote}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-slate-950">파트너 피드 검증</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              제휴사/공식 API 데이터를 저장하기 전에 필수값, 가격, URL, 카테고리를 dry-run으로 검증합니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`/api/admin/import${token ? `?token=${encodeURIComponent(token)}` : ""}`}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
              >
                샘플 피드 보기
              </a>
              <Link
                href="/commercialization"
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700"
              >
                연동 문서
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-black text-dossa-deep">수집 정책</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-dossa-deep">
              실제 운영에서는 허용된 공식 API, RSS, 제휴 피드만 연결하고 약관이 불명확한 크롤링은 제외합니다.
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="파트너 피드 사전 검수 리포트">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">파트너 피드 사전 검수 리포트</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">운영 연결 전 ready / needs_fix 행을 먼저 분리합니다</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                `feed:validate --report`와 같은 기준으로 필수값, 가격, 실제 상세 URL, 커뮤니티/검색 fallback 여부를 확인합니다.
              </p>
            </div>
            <a
              href={`/api/admin/import${token ? `?token=${encodeURIComponent(token)}` : ""}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
            >
              <DatabaseZap size={17} />
              샘플 검증 API
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-dossa-red">readyRate</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sampleFeedReadyRate}%</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">운영 반영 전 목표는 100%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">ready</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sampleFeedValidation.valid}행</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">즉시 dry-run 통과 가능</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">needs_fix</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sampleFeedValidation.invalid}행</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">상세 URL·가격·필수값 보강 필요</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">검증 링크</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sampleFeedValidation.linkSummary.verified}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">검색 결과가 아닌 상세 URL 기준</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">혜택 조건</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sampleFeedValidation.benefitSummary.conditionReadyRate}%</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">출처·가입·수령 단계 기준</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-black text-slate-950">운영 반영 순서</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {[
                "feed:validate --report로 needs_fix 행을 먼저 제거",
                "invalid=0, readyRate=100 상태에서 production 피드 연결",
                "feed:production:doctor와 release:doctor 통과 후 노출"
              ].map((item) => (
                <p key={item} className="rounded-2xl bg-white px-4 py-3 text-xs font-black leading-5 text-red-900/75">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </section>

        <PartnerFeedDryRunPanel token={token} initialJson={sampleFeedJson} />

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">데이터 공급원 상태</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">기본 큐레이션, 검수 피드, 운영 피드 전환을 위한 공급원별 준비 상태입니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/api/sources" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                <DatabaseZap size={17} />
                API 확인
              </a>
              <a href="/api/sources?format=csv" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                <DatabaseZap size={17} />
                CSV 다운로드
              </a>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {listDealSourceProfiles().map((profile) => (
              <div key={profile.key} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{profile.label}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    profile.status === "active" ? "bg-emerald-100 text-emerald-700" : profile.status === "ready" ? "bg-red-50 text-dossa-red" : "bg-slate-200 text-slate-600"
                  }`}>
                    {profile.status}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{profile.disclosure}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-black text-slate-500">
                  <span>신뢰 기준 {profile.reliability}/99</span>
                  <span>{(sourceCounts.get(profile.key) ?? 0).toLocaleString("ko-KR")}개</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm" aria-label="공식 소스 live 접근성">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-blue-700">공식 소스 live 접근성</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">공식 feed 전환 전 URL 상태 점검</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                무단 크롤링 없이 공식 후보 URL의 접근 가능, WAF/권한 보호, 404/410 교체 필요 상태만 기록합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={sourceLiveApiHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                <DatabaseZap size={17} />
                live JSON
              </a>
              <a href={sourceLiveCsvHref} className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-blue-700">
                <Download size={17} />
                live CSV
              </a>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-black text-blue-700">접근 가능</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceLiveReport.reachableCount}/{sourceLiveReport.totalSources}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-blue-900/70">승인 feed 후보 유지</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">보호/권한</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceLiveReport.guardedCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">API·제휴 feed 우선</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">timeout/error</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceLiveReport.timeoutCount + sourceLiveReport.networkErrorCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">재시도 또는 담당자 확인</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-black text-amber-800">교체 필요</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceLiveReport.staleOrRemovedCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-amber-900/70">404/410 URL 보류</p>
            </div>
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-dossa-red">고우선 후보</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {sourceLiveReport.highPriorityReachableOrGuarded}/{sourceLiveReport.highPrioritySources}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">운영 연결 우선순위</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">운영 원칙</p>
                <p className="mt-1 text-xs font-bold leading-5 text-blue-900/70">
                  protected/guarded 소스는 수집 대상이 아니라 공식 API, RSS, 제휴 feed 또는 담당자 승인 데이터로 연결합니다.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-blue-700 shadow-sm">
                {sourceLiveReport.mode}
              </span>
            </div>
            {sourceLiveRiskRows.length ? (
              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {sourceLiveRiskRows.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{item.provider}</span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{item.status}</span>
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500">HTTP {item.httpStatus}</span>
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-950">{item.label}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.operatorAction}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-sm">
                모든 공식 소스 후보가 접근 가능 상태입니다.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm" aria-label="공식 소스 온보딩 우선순위">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-amber-700">공식 소스 온보딩 우선순위</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">다음 연결 우선순위 TOP 10</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                접근 가능한 공식 페이지는 승인 feed 연결 후보로, 보호 페이지는 API·제휴 담당자 확인 대상으로 분리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={sourceOnboardingApiHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                <DatabaseZap size={17} />
                온보딩 JSON
              </a>
              <a href={sourceOnboardingCsvHref} className="inline-flex items-center gap-2 rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-black text-amber-700">
                <Download size={17} />
                온보딩 CSV
              </a>
              <a href={sourceOnboardingEnvHref} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black text-emerald-700">
                <Download size={17} />
                feed env
              </a>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-black text-amber-800">공식 후보</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceOnboardingPlan.totalSources}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-amber-900/70">운영 연결 대상</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-black text-emerald-700">feed 연결 후보</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceOnboardingPlan.statusCounts.connect_official_feed ?? 0}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-emerald-900/70">공식 RSS/API 우선</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">제휴 확인</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceOnboardingPlan.statusCounts.request_partner_or_api ?? 0}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">보호 페이지 수집 금지</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">설정 완료 feed</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceOnboardingPlan.configuredFeedSources}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">env 연결 기준</p>
            </div>
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-dossa-red">차단 이슈</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceOnboardingPlan.blockedLiveIssues}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">출시 전 0 유지</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">연결 우선 큐</p>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-amber-700 shadow-sm">
                  {sourceOnboardingPlan.ok ? "리포트 정상" : "리포트 생성 필요"}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {(sourceOnboardingTopQueue.length ? sourceOnboardingTopQueue : [{
                  rank: 0,
                  id: "missing",
                  label: "온보딩 리포트 없음",
                  provider: "system",
                  category: ["운영"],
                  priority: "high",
                  sourceType: "report",
                  officialUrl: "/admin",
                  liveStatus: "missing",
                  httpStatus: 0,
                  configuredFeedUrls: 0,
                  recommendedEnvKeys: ["source:onboarding:plan"],
                  onboardingStatus: "connect_official_feed",
                  score: 0,
                  reasons: ["missing report"],
                  nextAction: "npm run source:onboarding:plan 실행",
                  guardrail: "공식 소스만 연결"
                }]).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">#{item.rank}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${item.onboardingStatus === "connect_official_feed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                        {item.onboardingStatus === "connect_official_feed" ? "feed 연결" : "제휴 확인"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{item.provider}</span>
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-950">{item.label}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.nextAction}</p>
                    <p className="mt-2 line-clamp-1 text-[11px] font-black text-amber-700">
                      {item.recommendedEnvKeys.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">운영 가드레일</p>
              <div className="mt-3 space-y-2">
                {(sourceOnboardingPlan.guardrails.length ? sourceOnboardingPlan.guardrails : ["공식 API, RSS, 제휴 feed, 담당자 승인 JSON만 운영 feed로 연결합니다."]).map((guardrail) => (
                  <p key={guardrail} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
                    {guardrail}
                  </p>
                ))}
              </div>
              <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
                <p>
                  <b className="text-slate-950">생성 시각:</b> {formatAdminDateTime(sourceOnboardingPlan.generatedAt)}
                </p>
                <p className="mt-1">
                  <b className="text-slate-950">재생성:</b> npm run source:catalog:report && npm run source:live:doctor && npm run source:onboarding:plan
                </p>
              </div>
              <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
                <p className="font-black text-slate-950">우선 연결 env</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(sourceOnboardingPlan.envPlan.length ? sourceOnboardingPlan.envPlan.slice(0, 5) : [{ envKey: "OFFICIAL_EVENT_FEED_URLS", candidateCount: 0 }]).map((plan) => (
                    <span key={plan.envKey} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                      {plan.envKey} {plan.candidateCount}개
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm" aria-label="공식 소스 통합 준비도">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-violet-700">공식 소스 통합 준비도</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">오늘 공식 feed 전환 판단</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                카탈로그, live 접근성, 온보딩 큐, feed env, 공식 혜택 노출, refresh:all 결과를 한 번에 묶어 운영 가능 여부를 확인합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={sourceReadinessApiHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                <DatabaseZap size={17} />
                source readiness JSON
              </a>
              <a href={sourceReadinessCsvHref} className="inline-flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-black text-violet-700">
                <Download size={17} />
                source readiness CSV
              </a>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="text-xs font-black text-violet-700">출시 게이트</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{officialSourceReadiness.launchGateStatus === "passed" ? "통과" : "점검"}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-violet-900/70">{officialSourceReadiness.readinessLabel}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">공식 후보</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{officialSourceReadiness.summary.officialSourceCandidates}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">카테고리 공백 없음</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-black text-blue-700">접근/보호</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {officialSourceReadiness.summary.reachableSources}/{officialSourceReadiness.summary.guardedSources}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-blue-900/70">보호 소스는 API·제휴 우선</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-black text-emerald-700">공식 혜택</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{officialSourceReadiness.summary.visibleOfficialBenefits}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-emerald-900/70">노출 가능 혜택</p>
            </div>
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-dossa-red">차단 이슈</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {officialSourceReadiness.summary.blockedLiveIssues + officialSourceReadiness.summary.feedEnvFailedCount + officialSourceReadiness.summary.newsFailedCount}개
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">출시 전 0 유지</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">통합 게이트</p>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-violet-700 shadow-sm">
                  {sourceReadinessFailedGates.length ? `${sourceReadinessFailedGates.length}개 점검` : "전체 통과"}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {officialSourceReadiness.gates.map((gate) => (
                  <div key={gate.name} className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${gate.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-dossa-red"}`}>
                        {gate.ok ? "통과" : "점검"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{gate.name}</span>
                    </div>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{gate.detail}</p>
                    <p className="mt-1 text-[11px] font-black text-violet-700">{gate.action}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">운영 다음 액션</p>
              <div className="mt-3 space-y-2">
                {sourceReadinessNextActions.map((action) => (
                  <p key={action} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
                    {action}
                  </p>
                ))}
              </div>
              <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
                <p>
                  <b className="text-slate-950">공식 feed URL:</b> {officialSourceReadiness.summary.configuredFeedUrls}개
                </p>
                <p className="mt-1">
                  <b className="text-slate-950">재생성:</b> npm run source:readiness:report
                </p>
                <p className="mt-1">
                  검색 결과, 커뮤니티 원문, HTML 랜딩 페이지는 공식 feed 전환 대상에서 제외합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm" aria-label="공식 feed 환경변수 안전성">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-emerald-700">공식 feed 환경변수 안전성</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">운영 env에 검색·커뮤니티 링크가 들어가기 전 차단</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                공식 API/RSS/JSON feed만 허용하고 검색 결과, 커뮤니티 원문, 블로그, HTML 랜딩 페이지는 refresh 전에 막습니다.
              </p>
            </div>
            <a href={sourceFeedEnvApiHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              <DatabaseZap size={17} />
              feed env JSON
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-black text-emerald-700">검사 상태</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceFeedEnvReadiness.ok ? "정상" : "점검"}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-emerald-900/70">source:feed-env:doctor</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">설정된 feed URL</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceFeedEnvReadiness.configuredUrlCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">현재 env 기준</p>
            </div>
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-dossa-red">차단 URL</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceFeedEnvReadiness.failedCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">출시 전 0 유지</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-black text-blue-700">승인 host</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{sourceFeedEnvReadiness.allowedCatalogHosts.length}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-blue-900/70">공식 카탈로그 기준</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">차단 정책</p>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm">
                  {sourceFeedEnvReadiness.policyRegressionSamples.filter((sample) => sample.passed).length}/{sourceFeedEnvReadiness.policyRegressionSamples.length} 샘플 통과
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  "HTTPS URL만 허용",
                  "JSON, RSS, Atom, 공식 API, 승인 파트너 feed endpoint만 허용",
                  "공식 소스 카탈로그 host 또는 승인 host만 허용",
                  "검색 결과, 커뮤니티 원문, 블로그, HTML 이벤트 랜딩 페이지 차단"
                ].map((rule) => (
                  <p key={rule} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
                    {rule}
                  </p>
                ))}
              </div>
              <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
                <b className="text-slate-950">마지막 검사:</b> {formatAdminDateTime(sourceFeedEnvReadiness.generatedAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">검사 결과와 다음 액션</p>
              <div className="mt-3 space-y-2">
                {sourceFeedEnvRows.length ? (
                  sourceFeedEnvRows.map((row) => (
                    <div key={`${row.envKey}-${row.configuredValue}`} className="rounded-2xl bg-white p-3 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${row.status === "passed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-dossa-red"}`}>
                          {row.status === "passed" ? "통과" : "차단"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">{row.envKey}</span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{row.reason}</span>
                      </div>
                      <p className="mt-2 line-clamp-1 text-xs font-black text-slate-950">{row.configuredValue}</p>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{row.action}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={17} className="text-emerald-600" />
                      <p className="text-sm font-black text-slate-950">설정된 운영 feed URL 없음</p>
                    </div>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                      현재는 seed fallback으로 안전하게 운영합니다. 공식 feed를 추가하면 이 패널에서 검색 결과·커뮤니티·HTML 랜딩 여부를 먼저 확인하세요.
                    </p>
                  </div>
                )}
                {sourceFeedEnvRegressionFailures.length ? (
                  <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-black leading-5 text-dossa-red">
                    정책 회귀 샘플 실패 {sourceFeedEnvRegressionFailures.length}개. npm run source:feed-env:doctor를 다시 실행하세요.
                  </p>
                ) : (
                  <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black leading-5 text-emerald-700">
                    정책 회귀 샘플 모두 통과. 검색 결과와 커뮤니티 원문은 운영 feed로 들어가지 않습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm" aria-label="운영 피드 전환 준비도">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">운영 피드 전환 준비도</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">공식 API·제휴 피드로 바꿀 때 볼 품질 기준</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                공급원별 실제 링크 확인율, 무료·쿠폰 혜택 수, 조건 요약 완성도, 신고 누적을 함께 보고 노출 가능 여부를 판단합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/api/sources" className="inline-flex items-center gap-2 rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white">
                <DatabaseZap size={17} />
                공급원 API
              </a>
              <a href="/api/sources?format=csv" className="inline-flex items-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-dossa-red">
                <DatabaseZap size={17} />
                전환 CSV
              </a>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {sourceReadiness.map((item) => (
              <div key={item.key} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{item.nextAction}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    item.readinessLabel === "운영 노출 가능"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.readinessLabel === "검수 후 노출"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-50 text-dossa-red"
                  }`}>
                    {item.readinessLabel}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-slate-600 sm:grid-cols-4">
                  <span className="rounded-2xl bg-white px-3 py-2">노출 {item.dealCount}개</span>
                  <span className="rounded-2xl bg-white px-3 py-2">링크 {item.verifiedRate}%</span>
                  <span className="rounded-2xl bg-white px-3 py-2">혜택 {item.benefitCount}개</span>
                  <span className="rounded-2xl bg-white px-3 py-2">조건 {item.conditionReadyCount}개</span>
                </div>
                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-500">
                  신고 누적 {item.reportCount}건 · 검색 결과를 실제 상세 링크처럼 표시하지 않고, 검증된 상품·혜택 상세 URL만 운영 노출 기준에 반영합니다.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-500">{card.label}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                    <Icon size={20} />
                  </span>
                </div>
                <p className="mt-4 text-2xl font-black text-slate-950">{card.value}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="상품 이미지 보강 큐">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">상품 이미지 보강 큐</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">실상품 이미지 커버리지를 운영 품질 지표로 관리합니다</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                카테고리 fallback 이미지는 앱 깨짐을 막는 안전장치입니다. 공개 운영 전에는 공식·제휴 피드 또는 판매처 상세에서 권리 확인 가능한 대표 이미지만 보강하세요.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={imageQueueApiHref} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white">
                  이미지 큐 JSON
                </a>
                <a href={imageQueueCsvHref} className="rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-black text-dossa-red">
                  이미지 큐 CSV
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div className="rounded-2xl bg-red-50 px-3 py-3">
                <p className="text-[11px] font-black text-dossa-red">실상품</p>
                <p className="mt-1 text-lg font-black text-slate-950">{imageQuality.realImageCount}개</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="text-[11px] font-black text-slate-500">보강 필요</p>
                <p className="mt-1 text-lg font-black text-slate-950">{imageQuality.fallbackImageCount}개</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                <p className="text-[11px] font-black text-emerald-700">렌더링</p>
                <p className="mt-1 text-lg font-black text-slate-950">{imageQuality.renderImageRate}%</p>
              </div>
              <div className="rounded-2xl bg-amber-50 px-3 py-3">
                <p className="text-[11px] font-black text-amber-700">60% 목표까지</p>
                <p className="mt-1 text-lg font-black text-slate-950">{imageQuality.sourcingPlan.gapToLaunchTarget}개</p>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">이미지 보강 실행 계획</p>
                <p className="mt-1 text-xs font-bold leading-5 text-amber-800">
                  {imageQuality.sourcingPlan.operationCadence} · {imageQuality.sourcingPlan.feedRequirement}
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  운영 ready 조건: productUrl, imageUrl/thumbnail, imageRights, priceCheckedAt 동시 확보 · 검색 결과 썸네일/커뮤니티 이미지는 금지
                </p>
              </div>
              <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">
                주간 보강 목표 {imageQuality.sourcingPlan.weeklySourcingTarget}개
              </span>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
              다음 배치 ID: {imageQuality.sourcingPlan.nextBatchIds.length ? imageQuality.sourcingPlan.nextBatchIds.join(", ") : "보강 대기 없음"}
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">주간 보강 배치 상세</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  클릭, 인기, 무료배송, 할인율, 무료/쿠폰 혜택 신호를 기준으로 이번 주 먼저 보강할 이미지 후보입니다.
                </p>
              </div>
              <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                {imageQuality.nextBatchDeals.length}개 후보
              </span>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {imageQuality.nextBatchDeals.slice(0, 10).map((deal) => (
                <a
                  key={deal.id}
                  href={deal.imageSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-[230px] rounded-2xl bg-white px-3 py-2 shadow-sm transition hover:bg-red-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-dossa-red">#{deal.rank} {deal.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${deal.sourcingPriority === "high" ? "bg-red-50 text-dossa-red" : deal.sourcingPriority === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {deal.sourcingPriority}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-black text-slate-950">{deal.title}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{deal.mallName} · {deal.category}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-slate-400">우선순위 사유: {deal.priorityReason}</p>
                  <p className="mt-2 line-clamp-2 text-[11px] font-black leading-4 text-brand-navy">{deal.recommendedImageSource}</p>
                  <p className="mt-1 line-clamp-2 text-[10px] font-bold text-slate-500">Ready: {deal.imageReadyGate}</p>
                  <p className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-400">필수 필드: {deal.requiredFeedFields.join(", ")}</p>
                </a>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_0.95fr]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">카테고리별 우선순위</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">{imageQuality.status}</span>
              </div>
              <div className="mt-3 space-y-2">
                {imageQuality.categoryQueue.slice(0, 5).map((item) => (
                  <div key={item.category} className="rounded-2xl bg-white p-3">
                    <div className="flex items-center justify-between gap-3 text-sm font-black text-slate-950">
                      <span>{item.category}</span>
                      <span className="text-dossa-red">{item.fallback}개 보강</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-dossa-red" style={{ width: `${item.realRate}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.action}</p>
                    {item.sampleTitles.length ? (
                      <p className="mt-1 truncate text-xs font-semibold text-slate-400">예: {item.sampleTitles.join(", ")}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-black text-slate-950">판매처별 피드 보강 우선순위</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                보강 수량이 많은 판매처는 수동 작업보다 제휴/운영 피드 imageUrl 필드 확보를 우선합니다.
              </p>
              <div className="mt-3 space-y-2">
                {imageQuality.mallQueue.slice(0, 5).map((item) => (
                  <div key={item.mallName} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm font-black text-slate-950">
                      <span>{item.mallName}</span>
                      <span className="text-dossa-red">{item.fallback}개</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                        {item.recommendedAcquisition === "partner_feed"
                          ? "제휴 피드"
                          : item.recommendedAcquisition === "official_batch"
                            ? "공식 이미지 묶음"
                            : "수동 검수"}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-navy shadow-sm">
                        {item.operationOwner}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                        {item.slaDays}일 내
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.action}</p>
                    <p className="mt-1 text-[11px] font-black leading-4 text-brand-navy">{item.recommendedImageSource}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-slate-500">
                      요청: {item.requestTemplate}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[11px] font-black text-dossa-red">
                      Ready: {item.imageReadyGate}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-slate-400">
                      확인: {item.imageManualVerification}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-400">
                      예: {item.sampleTitles.join(", ")} · ID {item.sampleIds.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-black text-slate-950">클릭 상위 보강 후보</p>
              <div className="mt-3 space-y-2">
                {imageQuality.priorityDeals.slice(0, 5).map((deal) => (
                  <div key={deal.id} className="rounded-2xl bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="line-clamp-2 text-sm font-black text-slate-950">{deal.title}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {deal.mallName} · {deal.category}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">#{deal.id}</span>
                    </div>
                    <p className="mt-2 text-xs font-bold leading-5 text-red-900/70">{deal.action}</p>
                    <p className="mt-1 text-[11px] font-black leading-4 text-dossa-red">우선순위 사유: {deal.priorityReason}</p>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-brand-navy">권장 출처: {deal.recommendedImageSource}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-slate-400">금지: {deal.prohibitedImageSource}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-4 text-slate-500">
                      체크: {deal.operatorChecklist.slice(0, 2).join(" · ")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={deal.finalPurchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white"
                      >
                        판매처 확인
                      </a>
                      <a
                        href={deal.imageSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-black text-dossa-red"
                      >
                        이미지 후보 검색
                      </a>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-4 text-slate-400">
                      저장 필드: {deal.imageField} · 출처: {deal.sourceName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">오늘 운영 체크인</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">무료·쿠폰·링크·재방문 루틴을 먼저 점검합니다</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                운영자가 매일 같은 순서로 확인할 수 있도록 혜택 보강, 링크 검수, 신고 처리, 재방문 콘텐츠를 하나의 보드로 묶었습니다.
              </p>
            </div>
            <Link href="/commercialization" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              운영 기준 보기
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {dailyOperationCheckIn.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-red-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{item.title}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">
                    {item.value}
                  </span>
                </div>
                <p className="mt-3 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="일일 운영 리포트">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">일일 운영 리포트</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">검증 링크, 공식 혜택, refresh 상태를 한 번에 확인합니다</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                `reports/daily-operations.json` 기준으로 오늘 노출 가능한 링크와 혜택, 자동 수집, 출시 게이트를 운영 큐로 묶었습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={dailyOperationsApiHref} className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">
                daily JSON
              </a>
              <a href={dailyOperationsCsvHref} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                daily CSV
              </a>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {dailyOperations.cards.map((card) => (
              <div
                key={card.id}
                className={`rounded-2xl border p-4 ${
                  card.tone === "good"
                    ? "border-emerald-100 bg-emerald-50"
                    : card.tone === "danger"
                      ? "border-red-100 bg-red-50"
                      : "border-amber-100 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-slate-600">{card.title}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-700 shadow-sm">{card.tone}</span>
                </div>
                <p className="mt-2 text-xl font-black text-slate-950">{card.value}</p>
                <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-4 text-slate-500">{card.description}</p>
                <p className="mt-3 truncate rounded-xl bg-white px-2.5 py-2 text-[10px] font-black text-slate-600 shadow-sm">{card.command}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">일일 운영 게이트</p>
              <div className="mt-3 space-y-2">
                {dailyOperations.gates.map((gate) => (
                  <div key={gate.name} className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-slate-900">{gate.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${gate.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-dossa-red"}`}>
                        {gate.ok ? "통과" : "점검"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{gate.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">오늘 우선 처리 큐</p>
              <div className="mt-3 space-y-2">
                {dailyOperations.priorityQueue.slice(0, 5).map((item) => (
                  <div key={`${item.area}-${item.title}`} className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-slate-950">{item.title}</p>
                        <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">{item.reason}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                          item.priority === "high" ? "bg-red-50 text-dossa-red" : item.priority === "medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="mt-2 rounded-xl bg-slate-50 px-2.5 py-2 text-[10px] font-black leading-4 text-slate-600">{item.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm" aria-label="운영 혜택 판단표">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">운영 혜택 판단표</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">고객이 오늘 먼저 보는 4가지 기준을 운영 큐로 점검합니다</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                홈, 알림, 무료혜택 탭에 노출되는 공통 판단표와 같은 기준으로 무료·쿠폰·마감·구매처 확인 영역의 보강 필요 지점을 확인합니다.
              </p>
            </div>
            <Link href="/api/benefits/decision-guide" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">
              판단표 API 보기
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {benefitDecisionGuide.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{item.title}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{item.value}</span>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.copy}</p>
                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black leading-5 text-slate-700 shadow-sm">
                  {decisionGuideOperationActions[item.id]}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-dossa-deep">
            운영자는 이 판단표 기준으로 오늘의 무료 수령, 결제 전 쿠폰, 마감 혜택, 구매처 확인 상품을 매일 보강합니다.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="수령 난이도 운영 큐">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">수령 난이도 운영 큐</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">비회원 기준으로 먼저 받을 혜택부터 점검합니다</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                마이페이지, 무료혜택 화면, 알림 화면과 같은 기준으로 간편 수령, 조건 확인, 마감 주의 혜택을 운영자가 매일 정리합니다.
              </p>
            </div>
            <Link href="/api/benefits/claim-effort" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              수령 난이도 API 보기
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {claimEffortOperationQueue.map((item) => (
              <Link
                key={item.effort}
                href={item.href}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-red-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">
                    {item.count}개
                  </span>
                </div>
                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black leading-5 text-slate-700 shadow-sm">
                  {item.operationAction}
                </p>
                <p className="mt-3 line-clamp-2 text-xs font-bold leading-5 text-slate-500">대표 후보: {item.sampleTitle}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">VER 2.0 혜택 운영</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">혜택 데이터 품질 요약</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                무료·쿠폰·포인트·생활 혜택을 운영자가 매일 점검할 수 있도록 커버리지와 신고/종료 대상을 분리합니다.
              </p>
            </div>
            <Link href="/free-benefits" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              무료 혜택 화면 확인
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {benefitOperationSummary.map((item) => (
              <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-500">{item.title}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {benefitTypeBreakdown.map((item) => (
              <div key={item.type} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{item.label}</p>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-dossa-red">
                    {item.count}개
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-dossa-red" style={{ width: `${item.verifiedRate}%` }} />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  구매처 확인 {item.verified}개 · 확인율 {item.verifiedRate}%
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-dossa-red">오늘 혜택 운영 액션 큐</p>
                <h3 className="mt-1 text-base font-black text-slate-950">신고·종료·링크 보강을 우선순위대로 처리합니다.</h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-dossa-red">
                상위 {benefitActionQueue.length}개 유형
              </span>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-5">
              {benefitActionQueue.map((item) => (
                <div key={item.type} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${benefitPriorityClassNames[item.priority]}`}>
                      {benefitPriorityLabels[item.priority]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.reason}</p>
                  <p className="mt-2 text-xs font-black leading-5 text-slate-700">{item.action}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-dossa-red">혜택 조건 완성도 점검</p>
                <h3 className="mt-1 text-base font-black text-slate-950">제공처·배송비·가입·선착순·쿠폰 조건을 빠짐없이 확인합니다.</h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-dossa-red shadow-sm">
                조건 취약 유형 {benefitConditionAudit.filter((item) => item.readinessRate < 100).length}개
              </span>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {benefitConditionAudit.map((item) => (
                <div key={item.type} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-dossa-red">{item.readinessRate}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-dossa-red" style={{ width: `${item.readinessRate}%` }} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-600">
                    <span className="rounded-2xl bg-slate-50 px-2.5 py-2">제공처 {item.sourceReady}/{item.count}</span>
                    <span className="rounded-2xl bg-slate-50 px-2.5 py-2">배송비 {item.shippingReady}/{item.count}</span>
                    <span className="rounded-2xl bg-slate-50 px-2.5 py-2">가입 {item.signupReady}/{item.count}</span>
                    <span className="rounded-2xl bg-slate-50 px-2.5 py-2">선착순 {item.firstComeReady}/{item.count}</span>
                    <span className="col-span-2 rounded-2xl bg-slate-50 px-2.5 py-2">쿠폰 조건 {item.couponReady}/{item.count}</span>
                  </div>
                  <p className="mt-3 text-xs font-bold leading-5 text-slate-500">{item.action}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-dossa-red">혜택 조건 보강 우선순위</p>
                <h3 className="mt-1 text-base font-black text-slate-950">수령 단계, 조건 체크, 종료·신고 상태를 기준으로 오늘 먼저 볼 유형입니다.</h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-dossa-red shadow-sm">
                보강 큐 {benefitConditionOperationQueue.length}개
              </span>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {benefitConditionOperationQueue.map((item) => (
                <div key={item.type} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${benefitPriorityClassNames[item.priority]}`}>
                      {benefitPriorityLabels[item.priority]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.action}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-600">
                    <span className="rounded-2xl bg-slate-50 px-2.5 py-2">준비됨 {item.readyCount}/{item.count}</span>
                    <span className="rounded-2xl bg-slate-50 px-2.5 py-2">수령 안내 {item.missingClaimGuideCount}개</span>
                    <span className="rounded-2xl bg-slate-50 px-2.5 py-2">링크·신고 {item.needsVerificationCount}개</span>
                    <span className="rounded-2xl bg-slate-50 px-2.5 py-2">마감 신호 {item.endingSoonCount}개</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">VER 2.0 재방문 운영</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">매일 재방문 루틴 점검</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                홈 출석 체크, 무료 혜택 캘린더, 알림 큐가 실제로 매일 볼 만한 콘텐츠를 갖췄는지 운영자가 확인합니다.
              </p>
            </div>
            <Link href="/commercialization" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              재방문 지표 상세
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-dossa-red">재방문 점수</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitRetention.retentionScore}점</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">
                {benefitRetention.weeklyRoutineReady ? "주간 루틴 준비 완료" : "루틴 보강 필요"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">활성 루틴</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitRetention.activeRoutineSlots}/5</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">매일 확인할 혜택 슬롯</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">확인된 혜택 링크</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitRetention.verifiedBenefitCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">무료·쿠폰·포인트 중심</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-black text-amber-800">보강 필요 루틴</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitRetention.weakSlots.length}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-amber-900/70">콘텐츠 3개 미만</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {benefitRetention.dailyRoutineSlots.map((slot) => (
              <Link
                key={slot.key}
                href={slot.recommendedSurface}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-red-50"
              >
                <p className="text-sm font-black text-slate-950">{slot.label}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{slot.target}</p>
                <p className="mt-3 rounded-full bg-white px-3 py-1.5 text-center text-xs font-black text-dossa-red shadow-sm">
                  {slot.count}개
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black text-dossa-red">다음 재방문 개선 액션</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {benefitRetention.nextActions.map((action) => (
                <p key={action} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-red-900/75">
                  {action}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">VER 2.0 개인화 추천 운영</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">홈·알림·무료혜택 추천 큐 준비도</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                비회원 관심사, 최근 본 상품, 찜한 혜택을 같은 기준으로 묶어 홈·알림·무료혜택 화면의 추천 후보를 점검합니다.
              </p>
            </div>
            <Link href="/api/benefits/personalized" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              개인화 API 보기
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-dossa-red">개인화 준비율</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{personalizationReadiness.averageReadyRate}%</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">
                {personalizationReadiness.ready ? "출시 후보" : "보강 필요"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">준비 관심군</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {personalizationReadiness.readyInterestGroups}/{personalizationReadiness.totalInterestGroups}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">추천 기준별 큐</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">추천 후보</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {personalizationReadiness.queues.reduce((sum, queue) => sum + queue.recommendedDeals, 0)}개
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">관심사별 합산</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-black text-amber-800">보강 필요 큐</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{personalizationReadiness.weakQueues.length}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-amber-900/70">링크·무료 혜택 비중 확인</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {personalizationReadiness.queues.map((queue) => (
              <div key={queue.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-950">{queue.label}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">
                    {queue.readyRate}%
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                  추천 {queue.recommendedDeals}개 · 관심 일치 {queue.interestMatchedDeals}개 · 링크 확인 {queue.verifiedCount}개
                </p>
                <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-slate-400">{queue.sampleDeal || queue.action}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-black text-dossa-red">개인화 추천 개선 액션</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {personalizationReadiness.nextActions.map((action) => (
                <p key={action} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-red-900/75">
                  {action}
                </p>
              ))}
            </div>
          </div>
        </section>

        <div id="report-queue">
          <AdminReportQueue
            initialReports={recentReports}
            initialSummary={reportSummary}
            initialSla={reportSlaSummary}
            initialStorage={getReportStorageStatus()}
            token={token}
          />
        </div>

        <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-slate-50 p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-dossa-red">오늘 처리할 링크 작업</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">구매 링크 보강 우선순위</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                링크 검수 큐를 운영자가 바로 처리할 수 있도록 우선, 보강, 대기 단계로 나눠 보여줍니다.
              </p>
            </div>
            <a href={getAdminExportHref(token)} className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-dossa-red shadow-sm">
              검수 CSV 받기
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {linkReviewSummary.map((item) => (
              <div key={item.priority} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{item.title}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${priorityClassNames[item.priority]}`}>
                    {priorityLabels[item.priority]} 검수
                  </span>
                </div>
                <p className="mt-2 text-3xl font-black text-slate-950">{item.count}개</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">링크 검수 큐</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                판매처 검색 fallback이 적용된 특가는 상품 상세 URL 보강 필요 항목으로 관리하고, 운영자가 판매처 확인 후 구매 전환과 심사 신뢰도를 높입니다.
              </p>
            </div>
            <Link href="/?verifiedOnly=true" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              <ShieldCheck size={17} />
              확인 링크만 보기
            </Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            {linkReviewDeals.length ? (
              <div className="divide-y divide-slate-100">
                {linkReviewDeals.map((deal) => (
                  <div key={deal.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-dossa-red">{deal.linkLabel}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${priorityClassNames[deal.reviewPriority]}`}>
                          {priorityLabels[deal.reviewPriority]} 검수
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{deal.mallName}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{deal.category}</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-black text-slate-950">{deal.title}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {getLinkStatusLabel(deal.linkStatus)} · {getLinkTypeLabel(deal.linkType)} · {getLinkReviewActionLabel(deal)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {deal.reviewReason} · 신뢰도 {deal.purchaseConfidence} · 확인 {getRelativeTime(deal.checkedAt)}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-400">현재 이동 URL: {deal.finalPurchaseUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/deals/${deal.id}`} className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700" target="_blank" rel="noopener noreferrer">
                        상세 검수
                      </Link>
                      <a
                        href={`/api/redirect/${deal.id}?from=admin-link-review`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-2xl bg-dossa-red px-3 py-2 text-xs font-black text-white"
                      >
                        판매처 확인
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm font-black text-slate-950">검수 대기 링크가 없습니다.</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  현재 노출 상품은 모두 확인된 구매 링크로 구성되어 있습니다. 신규 피드 등록 시 상품 상세 URL 보강 필요 항목은 이 큐에 다시 표시됩니다.
                </p>
                <p className="mt-2 text-xs font-bold text-slate-400">현재 이동 URL은 신규 검수 항목이 들어오면 함께 표시됩니다.</p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">상위 노출 후보</h2>
            <div className="mt-4 space-y-3">
              {topDeals.map((deal, index) => (
                <div key={deal.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">{deal.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {deal.mall} · {deal.category} · 인기도 기준 {deal.popularityScore}
                    </p>
                  </div>
                  <span className="text-lg font-black text-dossa-red">{deal.discountRate}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">상업화 체크리스트</h2>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-dossa-red" />
                    <p className="text-sm font-black text-slate-950">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

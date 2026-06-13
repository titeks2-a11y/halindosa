import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceFeedEnvRow = {
  envKey: string;
  configuredValue: string;
  host: string;
  format?: string;
  status: "passed" | "failed" | string;
  reason: string;
  matchedSources: Array<{
    id: string;
    label: string;
    provider: string;
    category: string[];
    officialUrl: string;
  }>;
  action: string;
};

export type SourceFeedEnvRegressionSample = {
  label: string;
  expectedStatus: string;
  expectedReason: string;
  expectedFormat?: string;
  actualStatus: string;
  actualReason: string;
  actualFormat?: string;
  passed: boolean;
};

export type SourceFeedActivationLane = {
  id: string;
  label: string;
  envKeys: string[];
  candidateCount: number;
  reachableCount: number;
  guardedCount: number;
  firstAction: string;
  firstCandidates: Array<{
    id: string;
    label: string;
    officialUrl: string;
    liveStatus: string;
    recommendedEnvKeys: string[];
  }>;
};

export type SourceFeedEnvReadinessReport = {
  ok: boolean;
  generatedAt: string;
  checkedKeys: string[];
  configuredUrlCount: number;
  configuredKeyCount: number;
  passedCount: number;
  failedCount: number;
  allowedCatalogHosts: string[];
  approvedExtraHosts: string[];
  activationReadiness: {
    status: "seed_fallback_only" | "feed_configured" | string;
    starterPackAvailable: boolean;
    recommendedLaneCount: number;
    recommendedFirstLanes: SourceFeedActivationLane[];
    operatorChecklist: string[];
  };
  policy: {
    httpsOnly: boolean;
    machineReadableFeedRequired: boolean;
    supportedFeedFormats?: string[];
    officialCatalogHostOrApprovedPartnerHostRequired: boolean;
    blockedHomepageReason?: string;
    blockedCommunityAndBlogHosts: string[];
    blockedSearchUrlPatterns: string[];
  };
  policyRegressionSamples: SourceFeedEnvRegressionSample[];
  rows: SourceFeedEnvRow[];
};

const defaultActivationLanes: SourceFeedActivationLane[] = [
  {
    id: "free-now",
    label: "오늘 바로 받는 무료혜택",
    envKeys: ["BENEFIT_REFRESH_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "convenience-plus-one",
    label: "편의점 1+1·2+1",
    envKeys: ["CONVENIENCE_BENEFIT_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "CONVENIENCE_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "beauty-samples",
    label: "뷰티 샘플·체험",
    envKeys: ["BEAUTY_SAMPLE_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "BEAUTY_SAMPLE_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "cafe-food-coupons",
    label: "카페·외식 쿠폰",
    envKeys: ["CAFE_FRANCHISE_COUPON_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "CAFE_FRANCHISE_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "shopping-brand-coupons",
    label: "쇼핑몰·브랜드 쿠폰",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "pay-points-cashback",
    label: "페이·포인트·캐시백",
    envKeys: ["PAY_POINT_BENEFIT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "PAY_POINT_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "all-gift-first-come",
    label: "전원증정·선착순",
    envKeys: ["BENEFIT_REFRESH_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "BENEFIT_REFRESH_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "checkin-roulette-mission",
    label: "출석체크·룰렛·미션",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "signup-welcome",
    label: "신규가입·웰컴 쿠폰",
    envKeys: ["SIGNUP_GIFT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "SIGNUP_GIFT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "gifticon-culture-invite",
    label: "기프티콘·문화초대권",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "PUBLIC_COUPON_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "pet-sample",
    label: "반려동물·체험단",
    envKeys: ["PET_SAMPLE_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "PET_SAMPLE_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  },
  {
    id: "optional-public-culture",
    label: "선택 운영: 공공·문화 무료",
    envKeys: ["OPTIONAL_PUBLIC_BENEFIT_FEED_URLS"],
    candidateCount: 0,
    reachableCount: 0,
    guardedCount: 0,
    firstAction: "OPTIONAL_PUBLIC_BENEFIT_FEED_URLS에 승인 JSON/RSS/API feed부터 연결",
    firstCandidates: []
  }
];

const defaultOperatorChecklist = [
  "공식 URL은 검토 기준으로만 사용하고, env에는 JSON/RSS/Atom/API/승인 파트너 feed endpoint만 넣습니다.",
  "HTML 이벤트 목록, 검색 결과, 커뮤니티/블로그 URL, 대표 홈페이지 URL은 source:feed-env:doctor에서 차단되어야 합니다.",
  "새 host가 카탈로그에 없으면 host만 HALINDOSA_APPROVED_FEED_HOSTS 또는 BENEFIT_REFRESH_APPROVED_HOSTS에 추가하고 계약/승인 근거를 문서화합니다.",
  "feed 연결 후 source:feed-env:doctor, news:feed:canary, refresh:news, verify:news, refresh:benefits, security:check 순서로 확인합니다."
];

const fallbackReport: SourceFeedEnvReadinessReport = {
  ok: false,
  generatedAt: "",
  checkedKeys: [
    "DEAL_NEWS_FEED_URLS",
    "DEAL_NEWS_RSS_URLS",
    "DEAL_EVENT_NEWS_FEED_URLS",
    "OFFICIAL_EVENT_FEED_URLS",
    "DEAL_EVENT_FEED_URLS",
    "PUBLIC_COUPON_FEED_URLS",
    "BENEFIT_REFRESH_FEED_URLS",
    "TELECOM_MEMBERSHIP_FEED_URLS",
    "CONVENIENCE_BENEFIT_FEED_URLS",
    "BEAUTY_SAMPLE_FEED_URLS",
    "CAFE_FRANCHISE_COUPON_FEED_URLS",
    "PAY_POINT_BENEFIT_FEED_URLS",
    "PET_SAMPLE_FEED_URLS",
    "SIGNUP_GIFT_FEED_URLS"
  ],
  configuredUrlCount: 0,
  configuredKeyCount: 0,
  passedCount: 0,
  failedCount: 0,
  allowedCatalogHosts: [],
  approvedExtraHosts: [],
  activationReadiness: {
    status: "seed_fallback_only",
    starterPackAvailable: false,
    recommendedLaneCount: defaultActivationLanes.length,
    recommendedFirstLanes: defaultActivationLanes,
    operatorChecklist: defaultOperatorChecklist
  },
  policy: {
    httpsOnly: true,
    machineReadableFeedRequired: true,
    supportedFeedFormats: ["json", "ndjson", "csv", "rss", "atom", "xml"],
    officialCatalogHostOrApprovedPartnerHostRequired: true,
    blockedHomepageReason: "homepage_link",
    blockedCommunityAndBlogHosts: [],
    blockedSearchUrlPatterns: []
  },
  policyRegressionSamples: [],
  rows: []
};

export function getOfficialSourceFeedEnvReadiness(): SourceFeedEnvReadinessReport {
  const reportPath = join(process.cwd(), "reports", "source-feed-env-readiness.json");
  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<SourceFeedEnvReadinessReport>;

    return {
      ...fallbackReport,
      ...report,
      checkedKeys: Array.isArray(report.checkedKeys) ? report.checkedKeys : fallbackReport.checkedKeys,
      allowedCatalogHosts: Array.isArray(report.allowedCatalogHosts) ? report.allowedCatalogHosts : [],
      approvedExtraHosts: Array.isArray(report.approvedExtraHosts) ? report.approvedExtraHosts : [],
      activationReadiness: {
        ...fallbackReport.activationReadiness,
        ...(report.activationReadiness ?? {}),
        recommendedLaneCount: Array.isArray(report.activationReadiness?.recommendedFirstLanes)
          ? report.activationReadiness.recommendedFirstLanes.length
          : fallbackReport.activationReadiness.recommendedLaneCount,
        recommendedFirstLanes: Array.isArray(report.activationReadiness?.recommendedFirstLanes) && report.activationReadiness.recommendedFirstLanes.length
          ? report.activationReadiness.recommendedFirstLanes
          : fallbackReport.activationReadiness.recommendedFirstLanes,
        operatorChecklist: Array.isArray(report.activationReadiness?.operatorChecklist) && report.activationReadiness.operatorChecklist.length
          ? report.activationReadiness.operatorChecklist
          : fallbackReport.activationReadiness.operatorChecklist
      },
      policy: {
        ...fallbackReport.policy,
        ...(report.policy ?? {}),
        blockedCommunityAndBlogHosts: Array.isArray(report.policy?.blockedCommunityAndBlogHosts) ? report.policy.blockedCommunityAndBlogHosts : [],
        blockedSearchUrlPatterns: Array.isArray(report.policy?.blockedSearchUrlPatterns) ? report.policy.blockedSearchUrlPatterns : []
      },
      policyRegressionSamples: Array.isArray(report.policyRegressionSamples) ? report.policyRegressionSamples : [],
      rows: Array.isArray(report.rows) ? report.rows : []
    };
  } catch {
    return {
      ...fallbackReport,
      ok: false,
      rows: [
        {
          envKey: "source-feed-env-readiness",
          configuredValue: "reports/source-feed-env-readiness.json",
          host: "local-report",
          status: "failed",
          reason: "invalid_report",
          matchedSources: [],
          action: "npm run source:feed-env:doctor를 다시 실행해 공식 feed 환경변수 안전성 리포트를 재생성하세요."
        }
      ]
    };
  }
}

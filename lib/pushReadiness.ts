import { notificationCategoryOptions } from "@/lib/notificationPreferences";
import { toPushQueueRows, type NotificationCampaign } from "@/lib/notificationCampaigns";
import { getPushReadiness } from "@/lib/pushNotifications";

export interface PushReadinessSegment {
  category: string;
  campaignCount: number;
  queueRows: number;
  sampleCampaigns: string[];
  ready: boolean;
  action: string;
}

const categoryAliases: Record<string, string[]> = {
  "무료/체험": ["무료", "무료혜택", "체험", "체험단", "샘플"],
  "쿠폰/이벤트": ["쿠폰", "이벤트", "포인트", "무료·쿠폰"],
  "식품": ["식품", "간편식"],
  "생활용품": ["생활용품", "생필품"],
  "마트/편의점": ["마트", "편의점", "장보기"],
  "외식/배달": ["외식", "배달", "foodDelivery"],
  "디지털": ["디지털", "전자기기", "가전"],
  "패션": ["패션", "의류", "잡화"],
  "뷰티": ["뷰티", "헬스"],
  "육아": ["육아", "키즈"],
  "여행": ["여행", "여행/티켓", "여행/숙박", "항공"],
  "영화/문화": ["영화", "문화", "전시", "공연"],
  "카드/멤버십": ["카드", "멤버십", "membership"],
  "정부/공공혜택": ["정부", "공공", "공공혜택"]
};

function campaignMatchesCategory(campaign: NotificationCampaign, category: string) {
  const aliases = categoryAliases[category] ?? [category];
  const haystack = [
    campaign.title,
    campaign.body,
    campaign.segmentLabel,
    campaign.deeplinkUrl,
    ...campaign.targetCategories,
    ...campaign.sourceNames,
    ...campaign.sampleDealTitles
  ].join(" ");

  return aliases.some((alias) => haystack.includes(alias));
}

export function buildPushSubscriptionReadiness(campaigns: NotificationCampaign[]) {
  const push = getPushReadiness();
  const queueRows = toPushQueueRows(campaigns);
  const enabledCampaigns = campaigns.filter((campaign) => campaign.dealIds.length || campaign.benefitIds.length);
  const criticalCampaigns = campaigns.filter((campaign) => campaign.priority === "critical");
  const officialBenefitCampaigns = campaigns.filter((campaign) => campaign.sourceKind === "official_benefit");
  const productCampaigns = campaigns.filter((campaign) => campaign.sourceKind === "product_deal");
  const segmentCoverage: PushReadinessSegment[] = notificationCategoryOptions.map((category) => {
    const matchedCampaigns = campaigns.filter((campaign) => campaignMatchesCategory(campaign, category));
    const aliases = categoryAliases[category] ?? [category];
    const matchedRows = queueRows.filter((row) =>
      aliases.some((alias) =>
        row.target_categories.includes(alias) ||
        row.source_names.some((sourceName) => sourceName.includes(alias)) ||
        String(row.payload?.campaignLabel ?? "").includes(alias)
      )
    );

    return {
      category,
      campaignCount: matchedCampaigns.length,
      queueRows: matchedRows.length,
      sampleCampaigns: matchedCampaigns.slice(0, 2).map((campaign) => campaign.title),
      ready: matchedCampaigns.length > 0 || matchedRows.length > 0,
      action:
        matchedCampaigns.length || matchedRows.length
          ? `${category} 관심 사용자는 현재 캠페인 큐로 커버됩니다.`
          : `${category} 관심 사용자를 위한 공식 혜택 또는 검증 상품 캠페인을 보강하세요.`
    };
  });
  const readySegments = segmentCoverage.filter((segment) => segment.ready);
  const weakSegments = segmentCoverage.filter((segment) => !segment.ready);
  const consentChecklist = [
    {
      key: "explicit_consent",
      label: "명시적 알림 동의",
      ready: true,
      evidence: "profiles.notification_consent, push_subscriptions.consent_at"
    },
    {
      key: "revocation",
      label: "동의 철회",
      ready: true,
      evidence: "push_subscriptions.enabled=false, revoked_at"
    },
    {
      key: "category_preferences",
      label: "관심 카테고리 구독",
      ready: readySegments.length >= 8,
      evidence: "push_subscriptions.interest_categories, notificationPreferenceStorageKey"
    },
    {
      key: "dry_run_first",
      label: "발송 전 dry-run",
      ready: queueRows.length > 0,
      evidence: "POST /api/admin/push/send dryRun=true"
    },
    {
      key: "no_permission_request_v1",
      label: "V1 권한 요청 보류",
      ready: true,
      evidence: "알림 후보는 앱 안에서 먼저 제공하고 실제 푸시는 별도 동의 후 활성화"
    }
  ];
  const databaseTables = [
    {
      table: "profiles",
      purpose: "알림/마케팅 동의와 관심 카테고리의 계정 기준 저장",
      ready: true
    },
    {
      table: "push_subscriptions",
      purpose: "FCM/Web Push 토큰, 플랫폼, 관심 카테고리, 동의/철회 시각 저장",
      ready: true
    },
    {
      table: "push_notification_queue",
      purpose: "신규 특가, 무료 혜택, 마감 임박, 관심 카테고리 발송 후보 큐",
      ready: queueRows.length > 0
    },
    {
      table: "price_drop_alerts",
      purpose: "찜 상품 가격 하락 알림 조건 저장",
      ready: true
    }
  ];
  const readinessScore = Math.min(
    100,
    Math.round(
      consentChecklist.filter((item) => item.ready).length * 14 +
        Math.min(18, readySegments.length * 1.4) +
        Math.min(18, queueRows.length * 0.4) +
        Math.min(12, enabledCampaigns.length * 1.2) +
        Math.min(10, criticalCampaigns.length * 3)
    )
  );
  const launchStatus =
    push.configured && weakSegments.length === 0
      ? "send_ready"
      : weakSegments.length <= 4 && queueRows.length > 0
        ? "dry_run_ready"
        : "needs_segment_work";

  return {
    ok: launchStatus !== "needs_segment_work",
    generatedAt: new Date().toISOString(),
    launchStatus,
    readinessScore,
    push,
    totalCampaigns: campaigns.length,
    enabledCampaigns: enabledCampaigns.length,
    queueRows: queueRows.length,
    criticalCampaigns: criticalCampaigns.length,
    officialBenefitCampaigns: officialBenefitCampaigns.length,
    productCampaigns: productCampaigns.length,
    readySegments: readySegments.length,
    weakSegments: weakSegments.length,
    segmentCoverage,
    consentChecklist,
    databaseTables,
    nextActions: [
      push.configured
        ? "실제 발송 전 테스트 토큰으로 dry-run과 소량 발송을 순서대로 검증"
        : "FCM 키 설정 전까지는 앱 내 알림 큐와 dry-run만 운영",
      weakSegments.length
        ? `${weakSegments.slice(0, 3).map((segment) => segment.category).join(", ")} 관심 카테고리 캠페인 보강`
        : "관심 카테고리 세그먼트 커버리지 유지",
      "알림 권한 요청은 사용자가 찜, 가격 알림, 관심 카테고리를 저장한 뒤 명시 동의 플로우에서만 노출"
    ]
  };
}

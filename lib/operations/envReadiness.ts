type EnvGroupKey = "public-web" | "supabase-auth" | "deal-data" | "operations" | "affiliate";

type EnvRequirement = {
  key: string;
  label: string;
  required: boolean;
};

const allowedDataModes = new Set(["mock", "staging", "production", "hybrid"]);
const placeholderValues = new Set(["", "replace-before-production", "replace-with-random-secret", "support@halindosa.com"]);

const groups: Array<{
  key: EnvGroupKey;
  label: string;
  description: string;
  requirements: EnvRequirement[];
}> = [
  {
    key: "public-web",
    label: "공개 앱 주소",
    description: "Vercel, OAuth, 앱 공유에 쓰는 공개 URL과 고객 문의 주소",
    requirements: [
      { key: "NEXT_PUBLIC_SITE_URL", label: "공개 사이트 URL", required: true },
      { key: "NEXT_PUBLIC_AUTH_REDIRECT_URL", label: "OAuth 복귀 URL", required: true },
      { key: "NEXT_PUBLIC_APP_SCHEME", label: "앱 딥링크 스킴", required: true },
      { key: "NEXT_PUBLIC_SUPPORT_EMAIL", label: "고객 문의 이메일", required: true }
    ]
  },
  {
    key: "supabase-auth",
    label: "회원 계정",
    description: "선택 로그인, 찜/최근 본 상품 계정 동기화에 필요한 Supabase 설정",
    requirements: [
      { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL", required: true },
      { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase 공개 키", required: true },
      { key: "SUPABASE_SERVICE_ROLE_KEY", label: "탈퇴/운영 정리 키", required: false }
    ]
  },
  {
    key: "deal-data",
    label: "혜택 데이터",
    description: "공식 API, RSS, 제휴 JSON 피드로 운영 데이터를 전환하기 위한 설정",
    requirements: [
      { key: "DEAL_DATA_MODE", label: "데이터 모드", required: true },
      { key: "DEAL_PRODUCTION_FEED_URLS", label: "운영 피드 URL", required: false },
      { key: "DEAL_PARTNER_FEED_URLS", label: "제휴 피드 URL", required: false },
      { key: "DEAL_NEWS_RSS_URLS", label: "허용 RSS URL", required: false }
    ]
  },
  {
    key: "operations",
    label: "운영 보호",
    description: "관리자 내보내기, 클릭 로그 익명화, 운영 검수 보호 설정",
    requirements: [
      { key: "ADMIN_EXPORT_TOKEN", label: "관리자 토큰", required: true },
      { key: "TRACKING_SALT", label: "추적 익명화 salt", required: true }
    ]
  },
  {
    key: "affiliate",
    label: "제휴/광고",
    description: "제휴 링크, 파트너스, 프리미엄 노출을 실제 수익화로 연결하기 위한 선택 설정",
    requirements: [
      { key: "AFFILIATE_SUB_ID", label: "제휴 sub id", required: false },
      { key: "DEFAULT_AFFILIATE_URL_TEMPLATE", label: "기본 제휴 템플릿", required: false },
      { key: "COUPANG_PARTNERS_URL_TEMPLATE", label: "쿠팡파트너스 템플릿", required: false },
      { key: "AFFILIATE_URL_TEMPLATES", label: "판매처별 제휴 템플릿", required: false }
    ]
  }
];

function hasUsableEnvValue(key: string) {
  const value = process.env[key]?.trim() ?? "";

  if (key === "DEAL_DATA_MODE") {
    return allowedDataModes.has(value);
  }

  if (placeholderValues.has(value)) return false;

  return Boolean(value);
}

function buildAction(groupKey: EnvGroupKey, missingRequired: string[], configuredOptional: number) {
  if (missingRequired.length) {
    return `${missingRequired.slice(0, 2).join(", ")} 설정을 운영 환경에 입력`;
  }

  if (groupKey === "deal-data" && configuredOptional === 0) {
    return "공식 API 또는 제휴 JSON 피드 URL을 연결해 기본 데이터를 운영 피드로 전환";
  }

  if (groupKey === "affiliate" && configuredOptional === 0) {
    return "수익화 시작 전 제휴 템플릿과 광고 고지 위치를 확정";
  }

  return "현재 설정 유지, 배포 직전 strict env doctor로 재확인";
}

export function getOperationalEnvReadiness() {
  const groupSummaries = groups.map((group) => {
    const checks = group.requirements.map((requirement) => ({
      ...requirement,
      configured: hasUsableEnvValue(requirement.key)
    }));
    const requiredChecks = checks.filter((check) => check.required);
    const optionalChecks = checks.filter((check) => !check.required);
    const configuredRequired = requiredChecks.filter((check) => check.configured).length;
    const configuredOptional = optionalChecks.filter((check) => check.configured).length;
    const missingRequired = requiredChecks.filter((check) => !check.configured).map((check) => check.label);
    const readyRate = requiredChecks.length ? Math.round((configuredRequired / requiredChecks.length) * 100) : 100;

    return {
      key: group.key,
      label: group.label,
      description: group.description,
      ready: missingRequired.length === 0,
      readyRate,
      configuredRequired,
      requiredCount: requiredChecks.length,
      configuredOptional,
      optionalCount: optionalChecks.length,
      missingRequired,
      action: buildAction(group.key, missingRequired, configuredOptional)
    };
  });
  const requiredTotal = groupSummaries.reduce((sum, group) => sum + group.requiredCount, 0);
  const configuredRequiredTotal = groupSummaries.reduce((sum, group) => sum + group.configuredRequired, 0);
  const readyGroups = groupSummaries.filter((group) => group.ready).length;
  const readyRate = requiredTotal ? Math.round((configuredRequiredTotal / requiredTotal) * 100) : 100;
  const blockingGroups = groupSummaries.filter((group) => !group.ready);

  return {
    readyRate,
    ready: blockingGroups.length === 0,
    readyGroups,
    totalGroups: groupSummaries.length,
    configuredRequired: configuredRequiredTotal,
    requiredTotal,
    groups: groupSummaries,
    blockingGroups,
    nextActions: blockingGroups.length
      ? blockingGroups.map((group) => group.action)
      : ["운영 환경변수는 준비 상태입니다. 배포 직전 npm run env:doctor -- --strict로 다시 확인"]
  };
}

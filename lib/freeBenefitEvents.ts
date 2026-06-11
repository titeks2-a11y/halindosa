import { isApprovedOfficialNewsUrl } from "@/lib/deals/newsLinkPolicy";
import { getMainFeedConsumerPriorityPenalty, isConsumerFacingBenefit } from "@/lib/consumerBenefitPriority";
import type { FreeBenefitEvent, FreeBenefitEventStatus, FreeBenefitEventType, FreeBenefitSourceType } from "@/types/freeBenefitEvent";
import type { NewsDeal } from "@/types/newsDeal";

const endedTextPattern = /마감|종료|품절|판매\s*종료|일시\s*품절|선착순\s*마감|이벤트\s*종료|행사\s*종료|재입고\s*알림/i;
const firstComePattern = /선착순|한정|소진\s*시|수량\s*한정|마감\s*임박/i;
const everyoneRewardPattern = /전원|모두|누구나|100%|전부|전체\s*지급/i;
const loginPattern = /로그인|회원|가입|앱\s*설치|멤버십|인증/i;
const purchasePattern = /구매|주문|결제|최소\s*주문|이상\s*구매|장바구니|배송비/i;
const samplePattern = /샘플|체험팩|무료\s*증정|전원\s*증정|기프티콘|초대권/i;
const searchOrJunkUrlPattern = /\/search|search\?|query=|keyword=|shopping\/search|msearch|\/find|\/result|sword=|kwd=|ppomppu|fmkorea|quasarzone|algumon|blog\.naver|news\.naver|v\.daum|news\.daum|youtube/i;
const privateHostPattern = /(^localhost$)|(^127\.)|(^10\.)|(^172\.(1[6-9]|2\d|3[0-1])\.)|(^192\.168\.)|(^169\.254\.)|(^0\.0\.0\.0$)|(\.local$)|metadata\.google|169\.254\.169\.254/i;
const highRecognitionConsumerBrandPattern = /올리브영|무신사|스타벅스|배민|요기요|컬리|SSG|롯데온|롯데잇츠|H\.?Point|해피포인트|CJ\s*ONE|다이소|G마켓|옥션|11번가|쿠팡|네이버|GS25|CU|세븐일레븐|이마트24/i;
const instantClaimBenefitPattern = /쿠폰\s*받기|쿠폰|샘플\s*신청|무료\s*체험|신규\s*가입|웰컴|포인트|캐시백|출석|룰렛|기프티콘|전원\s*증정|선착순/i;
const highFrictionConditionPattern = /카드\s*발급|신규\s*발급|자동\s*납부|자동이체|최소\s*주문|이상\s*구매|연회비|배송비\s*결제/i;

export const freeBenefitEventCategories: Array<{ id: FreeBenefitEventType; label: string }> = [
  { id: "all", label: "전체" },
  { id: "everyone", label: "전원증정" },
  { id: "firstCome", label: "선착순" },
  { id: "coupon", label: "쿠폰" },
  { id: "sample", label: "샘플" },
  { id: "freeTrial", label: "무료체험" },
  { id: "gifticon", label: "기프티콘" },
  { id: "pointCashback", label: "포인트/캐시백" },
  { id: "checkIn", label: "출석체크" },
  { id: "roulette", label: "룰렛" },
  { id: "signup", label: "신규가입" },
  { id: "freeShipping", label: "무료배송" },
  { id: "brandEvent", label: "브랜드이벤트" },
  { id: "publicFree", label: "공공무료" },
  { id: "experiencePanel", label: "체험단" }
];

export type FreeBenefitEventCategoryCount = (typeof freeBenefitEventCategories)[number] & { count: number };

export interface FreeBenefitEventSourceSummary {
  sourceDomainCount: number;
  topSourceDomains: Array<{ domain: string; count: number }>;
  easyClaimCount: number;
  noPurchaseCount: number;
  noLoginNoPurchaseCount: number;
  everyoneRewardCount: number;
  firstComeCount: number;
  endingSoonCount: number;
  officialSourceCount: number;
  averageFreeConditionScore: number;
  averageInterestScore: number;
  averageFreshnessScore: number;
  averageOfficialScore: number;
  averageUrgencyScore: number;
  averageRewardScore: number;
}

export function buildFreeBenefitEventCategoryCounts(events: FreeBenefitEvent[]): FreeBenefitEventCategoryCount[] {
  const counts = events.reduce<Record<string, number>>(
    (acc, event) => {
      acc[event.benefitType] = (acc[event.benefitType] ?? 0) + 1;
      return acc;
    },
    { all: events.length }
  );

  return freeBenefitEventCategories.map((category) => ({
    ...category,
    count: category.id === "all" ? events.length : counts[category.id] ?? 0
  }));
}

function averageScore(events: FreeBenefitEvent[], select: (event: FreeBenefitEvent) => number) {
  const scores = events.map(select).filter((score) => Number.isFinite(score));
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function buildFreeBenefitEventSourceSummary(events: FreeBenefitEvent[], referenceNow = Date.now()): FreeBenefitEventSourceSummary {
  const sourceDomainCounts = events.reduce<Record<string, number>>((counts, event) => {
    if (!event.sourceDomain) return counts;
    counts[event.sourceDomain] = (counts[event.sourceDomain] ?? 0) + 1;
    return counts;
  }, {});

  return {
    sourceDomainCount: Object.keys(sourceDomainCounts).length,
    topSourceDomains: Object.entries(sourceDomainCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([domain, count]) => ({ domain, count })),
    easyClaimCount: events.filter((event) => event.freeConditionScore >= 75).length,
    noPurchaseCount: events.filter((event) => !event.requiresPurchase).length,
    noLoginNoPurchaseCount: events.filter((event) => !event.requiresLogin && !event.requiresPurchase).length,
    everyoneRewardCount: events.filter((event) => event.isEveryoneReward).length,
    firstComeCount: events.filter((event) => event.isFirstComeFirstServed).length,
    endingSoonCount: events.filter((event) => {
      const endsAt = Date.parse(event.endAt);
      if (!Number.isFinite(endsAt)) return false;
      const hoursLeft = (endsAt - referenceNow) / 3_600_000;
      return hoursLeft >= 0 && hoursLeft <= 14 * 24;
    }).length,
    officialSourceCount: events.filter((event) => event.sourceType === "official" || event.validationStatus === "passed").length,
    averageFreeConditionScore: averageScore(events, (event) => event.freeConditionScore),
    averageInterestScore: averageScore(events, (event) => event.interestScore),
    averageFreshnessScore: averageScore(events, (event) => event.freshnessScore),
    averageOfficialScore: averageScore(events, (event) => event.officialScore),
    averageUrgencyScore: averageScore(events, (event) => event.urgencyScore),
    averageRewardScore: averageScore(events, (event) => event.rewardScore)
  };
}

export const freeBenefitEventLabelMap: Record<FreeBenefitEventType, string> = {
  all: "전체",
  everyone: "전원증정",
  firstCome: "선착순",
  coupon: "쿠폰",
  sample: "샘플",
  freeTrial: "무료체험",
  gifticon: "기프티콘",
  pointCashback: "포인트/캐시백",
  checkIn: "출석체크",
  roulette: "룰렛",
  signup: "신규가입",
  publicFree: "공공무료",
  experiencePanel: "체험단",
  freeShipping: "무배",
  brandEvent: "공식이벤트"
};

export function getFreeBenefitEventLabel(type: FreeBenefitEventType) {
  return freeBenefitEventLabelMap[type] ?? "무료혜택";
}

export function sanitizeBenefitText(value: unknown, maxLength = 180) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeBenefitTitle(value: string) {
  return sanitizeBenefitText(value, 120)
    .toLowerCase()
    .replace(/\[[^\]]+\]|\([^)]+\)/g, "")
    .replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]+/g, "")
    .trim();
}

export function isSafeBenefitEventUrl(value?: string) {
  if (!value) return false;
  if (searchOrJunkUrlPattern.test(value)) return false;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (privateHostPattern.test(host)) return false;
    return isApprovedOfficialNewsUrl(url.toString());
  } catch {
    return false;
  }
}

export function getBenefitEventSourceDomain(value?: string) {
  if (!value) return "";

  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function inferEventType(deal: NewsDeal, text: string): FreeBenefitEventType {
  if (everyoneRewardPattern.test(text)) return "everyone";
  if (firstComePattern.test(text)) return "firstCome";
  if (/룰렛|랜덤\s*박스|뽑기|응모권|스크래치/i.test(text)) return "roulette";
  if (/출석|체크인|매일\s*참여|스탬프/i.test(text)) return "checkIn";
  if (/신규|첫\s*구매|첫\s*가입|웰컴/i.test(text)) return "signup";
  if (/기프티콘|교환권|모바일\s*쿠폰|음료권/i.test(text)) return "gifticon";
  if (/포인트|캐시백|적립|페이/i.test(text)) return "pointCashback";
  if (samplePattern.test(text)) return "sample";
  if (/공공|정부|지원|문화가\s*있는\s*날|서울시|복지|교육/i.test(text) || deal.benefitType === "public" || deal.benefitType === "public_free" || deal.benefitType === "education") return "publicFree";
  if (/무료\s*체험|trial|구독\s*체험/i.test(text)) return "freeTrial";
  if (/체험단|리뷰단/i.test(text) || deal.benefitType === "freebie") return "experiencePanel";
  if (/무배|무료배송|배송비\s*무료/i.test(text) || deal.benefitType === "freeShipping") return "freeShipping";
  if (/쿠폰|할인권|바우처/i.test(text) || deal.benefitType === "coupon") return "coupon";
  return "brandEvent";
}

function inferSourceType(provider: NewsDeal["provider"], benefitType?: FreeBenefitEventType): FreeBenefitSourceType {
  if (provider === "official_event") return "official";
  if (provider === "public_coupon") return benefitType === "publicFree" ? "approved_public" : "official";
  if (provider === "event_news") return "partner_feed";
  if (provider === "news") return "partner_feed";
  return "seed";
}

function inferStatus(deal: NewsDeal, text: string, referenceNow: number): FreeBenefitEventStatus {
  const endsAt = Date.parse(deal.expiresAt || deal.endDate);
  if (deal.isHidden || deal.validationStatus !== "passed" || !isSafeBenefitEventUrl(deal.finalUrl)) return "blocked";
  if (deal.availability === "expired" || endedTextPattern.test(text)) return "expired";
  if (Number.isFinite(endsAt) && endsAt < referenceNow) return "expired";
  if (deal.availability === "active") return "active";
  return "unknown";
}

function getEventUrgencyLabel(endAt: string, referenceNow: number) {
  const endsAt = Date.parse(endAt);
  if (!Number.isFinite(endsAt)) return "기간 확인";
  const minutesLeft = Math.floor((endsAt - referenceNow) / 60_000);
  if (minutesLeft < 0) return "종료";
  if (minutesLeft <= 60) return "곧 마감";
  if (minutesLeft <= 24 * 60) return "오늘 마감";
  if (minutesLeft <= 3 * 24 * 60) return "마감 임박";
  return "진행 중";
}

function getClaimCtaLabel(
  type: FreeBenefitEventType,
  options: { isEveryoneReward?: boolean; isFirstComeFirstServed?: boolean } = {}
) {
  if (options.isFirstComeFirstServed) return "선착순 참여";
  if (options.isEveryoneReward) return "전원 혜택 받기";
  if (type === "coupon" || type === "signup") return "쿠폰 받기";
  if (type === "sample") return "샘플 신청";
  if (type === "freeTrial" || type === "experiencePanel") return "무료 체험 신청";
  if (type === "gifticon") return "기프티콘 받기";
  if (type === "pointCashback" || type === "checkIn" || type === "roulette") return "포인트 받기";
  if (type === "publicFree") return "공공 혜택 보기";
  if (type === "freeShipping") return "무료배송 확인";
  return "무료 혜택 받기";
}

function buildTrustBadges(event: Pick<FreeBenefitEvent, "sourceType" | "requiresLogin" | "requiresPurchase" | "isEveryoneReward" | "isFirstComeFirstServed">) {
  return [
    event.sourceType === "official" ? "공식" : "승인소스",
    event.isEveryoneReward ? "전원증정" : "",
    event.isFirstComeFirstServed ? "선착순" : "",
    event.requiresLogin ? "로그인 필요" : "비회원 확인 가능",
    event.requiresPurchase ? "구매 필요" : "구매 전 무료 확인"
  ].filter(Boolean);
}

function getFreeConditionScore({
  benefitType,
  requiresLogin,
  requiresPurchase,
  isEveryoneReward,
  isFirstComeFirstServed
}: {
  benefitType: FreeBenefitEventType;
  requiresLogin: boolean;
  requiresPurchase: boolean;
  isEveryoneReward: boolean;
  isFirstComeFirstServed: boolean;
}) {
  let score = 50;

  if (!requiresPurchase) score += 22;
  else score -= 24;
  if (!requiresLogin) score += 10;
  else score -= 4;
  if (isEveryoneReward) score += 14;
  if (isFirstComeFirstServed) score += 5;
  if (benefitType === "coupon" || benefitType === "sample" || benefitType === "freeTrial" || benefitType === "gifticon" || benefitType === "pointCashback" || benefitType === "signup") score += 12;
  if (benefitType === "publicFree") score -= 40;

  return Math.max(0, Math.min(100, score));
}

function getInterestScore(deal: NewsDeal, benefitType: FreeBenefitEventType) {
  const text = [deal.title, deal.summary, deal.merchant, deal.mallName, deal.sourceName, deal.tags.join(" ")].join(" ");
  let score = Number(deal.priorityScore ?? deal.confidenceScore ?? 0);

  if (highRecognitionConsumerBrandPattern.test(text)) score += 20;
  if (/무료|쿠폰|샘플|체험|전원|선착순|기프티콘|포인트|캐시백|출석|룰렛|신규\s*가입|웰컴/i.test(text)) score += 18;
  if (instantClaimBenefitPattern.test(text) && !highFrictionConditionPattern.test(text)) score += 10;
  if (benefitType === "publicFree") score -= 60;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getFreshnessScore(deal: NewsDeal, referenceNow: number) {
  const checkedAt = Date.parse(deal.verifiedAt || deal.lastCheckedAt || deal.updatedAt || deal.startDate);
  if (!Number.isFinite(checkedAt)) return 45;
  const ageHours = Math.max(0, (referenceNow - checkedAt) / 3_600_000);
  if (ageHours <= 6) return 100;
  if (ageHours <= 24) return 92;
  if (ageHours <= 72) return 78;
  if (ageHours <= 168) return 62;
  if (ageHours <= 336) return 45;
  return 25;
}

function getOfficialScore(deal: NewsDeal, sourceType: FreeBenefitSourceType) {
  let score = 0;
  if (sourceType === "official") score += 58;
  if (sourceType === "approved_public") score += 38;
  if (deal.validationStatus === "passed") score += 20;
  if (String(deal.linkType || "").startsWith("official")) score += 18;
  if (isSafeBenefitEventUrl(deal.finalUrl)) score += 12;
  if (/blog|cafe|community|news|search/i.test(String(deal.linkType || ""))) score -= 70;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getUrgencyScore(endAt: string, referenceNow: number) {
  const endsAt = Date.parse(endAt);
  if (!Number.isFinite(endsAt)) return 45;
  const hoursLeft = (endsAt - referenceNow) / 3_600_000;
  if (hoursLeft < 0) return 0;
  if (hoursLeft <= 24) return 100;
  if (hoursLeft <= 72) return 86;
  if (hoursLeft <= 7 * 24) return 68;
  if (hoursLeft <= 14 * 24) return 54;
  return 40;
}

function getRewardScore({
  benefitType,
  requiresPurchase,
  isEveryoneReward,
  isFirstComeFirstServed,
  rewardText
}: {
  benefitType: FreeBenefitEventType;
  requiresPurchase: boolean;
  isEveryoneReward: boolean;
  isFirstComeFirstServed: boolean;
  rewardText: string;
}) {
  let score = 42;
  if (!requiresPurchase) score += 18;
  else score -= 18;
  if (isEveryoneReward) score += 16;
  if (isFirstComeFirstServed) score += 10;
  if (benefitType === "gifticon" || benefitType === "sample" || benefitType === "freeTrial") score += 16;
  if (benefitType === "coupon" || benefitType === "pointCashback" || benefitType === "signup") score += 12;
  if (/기프티콘|샘플|무료\s*체험|교환권|포인트|캐시백|전원|선착순|0원|무료배송/i.test(rewardText)) score += 10;
  if (benefitType === "publicFree") score -= 34;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildParticipationCondition({
  deal,
  benefitType,
  requiresLogin,
  requiresPurchase,
  isEveryoneReward,
  isFirstComeFirstServed
}: {
  deal: NewsDeal;
  benefitType: FreeBenefitEventType;
  requiresLogin: boolean;
  requiresPurchase: boolean;
  isEveryoneReward: boolean;
  isFirstComeFirstServed: boolean;
}) {
  const explicitTag = deal.tags.find((tag) => /조건|회원|로그인|구매|결제|주문|앱|선착순|전원|신규|가입|무료|응모|신청/.test(tag));
  if (explicitTag) return sanitizeBenefitText(explicitTag, 90);

  const conditions = [
    requiresPurchase ? "구매/결제 조건 확인 필요" : "구매 없이 조건 확인",
    requiresLogin ? "로그인/회원가입 필요" : "비회원도 조건 확인 가능",
    isEveryoneReward ? "전원증정 조건 확인" : "",
    isFirstComeFirstServed ? "선착순/수량 소진 가능" : "",
    benefitType === "sample" ? "샘플 신청 조건 확인" : "",
    benefitType === "freeTrial" || benefitType === "experiencePanel" ? "체험 신청 조건 확인" : "",
    benefitType === "coupon" || benefitType === "signup" ? "쿠폰 발급 조건 확인" : "",
    benefitType === "pointCashback" || benefitType === "checkIn" || benefitType === "roulette" ? "포인트 적립 조건 확인" : "",
    benefitType === "publicFree" ? "대상 자격 확인" : ""
  ].filter(Boolean);

  return sanitizeBenefitText(conditions.slice(0, 3).join(" · ") || "공식 페이지 조건 확인", 90);
}

export function getFreeBenefitEventScore(event: FreeBenefitEvent, referenceNow = Date.now()) {
  void referenceNow;
  const consumerTypeBoost =
    event.benefitType === "coupon"
      ? 24
      : event.benefitType === "sample" || event.benefitType === "freeTrial" || event.benefitType === "experiencePanel"
        ? 22
        : event.benefitType === "gifticon" || event.benefitType === "pointCashback" || event.benefitType === "checkIn" || event.benefitType === "roulette"
          ? 18
          : event.benefitType === "freeShipping" || event.benefitType === "brandEvent"
            ? 14
            : 0;
  const publicPolicyPenalty = event.benefitType === "publicFree" ? -90 : 0;

  return (
    event.qualityScore +
    event.freshnessScore * 0.24 +
    event.officialScore * 0.28 +
    event.urgencyScore * 0.18 +
    event.rewardScore * 0.3 +
    event.priorityScore * 0.5 +
    event.freeConditionScore * 0.7 +
    event.interestScore * 0.4 +
    consumerTypeBoost +
    publicPolicyPenalty +
    (event.isEveryoneReward ? 18 : 0) +
    (event.isFirstComeFirstServed ? 9 : 0) +
    (event.requiresPurchase ? -18 : 8) +
    (event.requiresLogin ? -4 : 4)
  );
}

function getConsumerEventScoreAdjustment(event: FreeBenefitEvent) {
  const text = [event.title, event.rewardText, event.brandName, event.sourceName, event.tags.join(" ")].join(" ");
  let score = 0;

  if (/쿠폰|샘플|무료\s*체험|기프티콘|포인트|캐시백|출석|룰렛|전원\s*증정|선착순|신규\s*가입|웰컴|편의점|마트|배달|카페|뷰티|브랜드/i.test(text)) score += 24;
  if (highRecognitionConsumerBrandPattern.test(text)) score += 10;
  if (instantClaimBenefitPattern.test(text) && !highFrictionConditionPattern.test(text)) score += 12;
  if (/정부|공공|지자체|복지|정책|지원사업|서울시|공공서비스|K-MOOC|문화가\s*있는\s*날/i.test(text)) score -= 80;
  if (event.requiresPurchase) score -= 16;
  if (highFrictionConditionPattern.test(text)) score -= 16;

  return score;
}

function getRankingReason(event: FreeBenefitEvent, referenceNow: number) {
  const text = [event.title, event.rewardText, event.brandName, event.sourceName, event.tags.join(" ")].join(" ");
  if (instantClaimBenefitPattern.test(text) && highRecognitionConsumerBrandPattern.test(text) && !event.requiresPurchase) return "잘 알려진 브랜드에서 바로 받을 수 있는 공식 혜택";
  if (event.benefitType === "signup" && !event.requiresPurchase) return "신규가입으로 받을 수 있는 공식 웰컴 혜택";
  if (event.benefitType === "pointCashback" && !event.requiresPurchase) return "앱에서 바로 확인할 포인트 적립 혜택";
  if (event.isEveryoneReward && !event.requiresPurchase) return "전원증정이고 구매 조건이 낮아 먼저 볼 만한 혜택";
  if (event.isFirstComeFirstServed && !event.requiresPurchase) return "선착순이라 늦기 전에 먼저 확인할 혜택";
  if (event.isEveryoneReward) return "전원증정 조건을 공식 페이지에서 확인할 혜택";
  if (event.isFirstComeFirstServed) return "수량 소진 전에 조건을 확인할 혜택";
  if (event.benefitType === "coupon" && !event.requiresPurchase) return "쿠폰을 바로 받을 가능성이 높은 공식 혜택";
  if (event.benefitType === "sample" || event.benefitType === "freeTrial") return "돈 쓰기 전 체험해볼 수 있는 무료 혜택";
  if (getEventUrgencyLabel(event.endAt, referenceNow).includes("마감")) return "마감이 가까워 지금 확인할 혜택";
  if (event.requiresPurchase) return "구매 조건을 확인하면 받을 수 있는 공식 혜택";
  return "공식 링크 검증을 통과한 무료 혜택";
}

export function toFreeBenefitEvent(deal: NewsDeal, referenceNow = Date.now()): FreeBenefitEvent {
  const combinedText = sanitizeBenefitText([deal.title, deal.summary, deal.category, deal.sourceName, deal.tags.join(" ")].join(" "), 600);
  const status = inferStatus(deal, combinedText, referenceNow);
  const rewardText = sanitizeBenefitText(deal.summary || deal.title, 120);
  const validationStatus = status === "blocked" ? "blocked" : deal.validationStatus === "passed" ? "passed" : deal.validationStatus === "failed" ? "failed" : "needs_review";
  const benefitType = inferEventType(deal, combinedText);
  const sourceType = inferSourceType(deal.provider, benefitType);
  const requiresLogin = loginPattern.test(combinedText);
  const requiresPurchase = purchasePattern.test(combinedText);
  const isEveryoneReward = everyoneRewardPattern.test(combinedText);
  const isFirstComeFirstServed = firstComePattern.test(combinedText);
  const endAt = deal.expiresAt || deal.endDate;
  const sourceDomain = getBenefitEventSourceDomain(deal.finalUrl || deal.sourceUrl || deal.eventUrl);
  const freeConditionScore = getFreeConditionScore({ benefitType, requiresLogin, requiresPurchase, isEveryoneReward, isFirstComeFirstServed });
  const interestScore = getInterestScore(deal, benefitType);
  const freshnessScore = getFreshnessScore(deal, referenceNow);
  const officialScore = getOfficialScore(deal, sourceType);
  const urgencyScore = getUrgencyScore(endAt, referenceNow);
  const rewardScore = getRewardScore({ benefitType, requiresPurchase, isEveryoneReward, isFirstComeFirstServed, rewardText });

  const event: FreeBenefitEvent = {
    id: deal.id,
    title: sanitizeBenefitText(deal.title, 90),
    brandName: sanitizeBenefitText(deal.merchant || deal.mallName || deal.sourceName, 40),
    benefitType,
    legacyBenefitType: deal.benefitType,
    eventUrl: deal.eventUrl || deal.finalUrl,
    officialUrl: deal.sourceUrl || deal.finalUrl,
    finalUrl: isSafeBenefitEventUrl(deal.finalUrl) ? deal.finalUrl : "",
    imageUrl: deal.imageUrl || "",
    sourceName: sanitizeBenefitText(deal.sourceName || deal.merchant, 50),
    sourceType,
    sourceUrl: deal.sourceUrl,
    sourceDomain,
    startAt: deal.startDate,
    endAt,
    participationCondition: buildParticipationCondition({ deal, benefitType, requiresLogin, requiresPurchase, isEveryoneReward, isFirstComeFirstServed }),
    requiresLogin,
    requiresPurchase,
    isEveryoneReward,
    isFirstComeFirstServed,
    rewardText,
    cautionText: sanitizeBenefitText(status === "active" ? "공식 페이지에서 최종 참여 조건과 잔여 수량을 확인하세요." : "종료 또는 검증 실패 가능성이 있어 노출에서 제외됩니다.", 120),
    claimCtaLabel: getClaimCtaLabel(benefitType, { isEveryoneReward, isFirstComeFirstServed }),
    urgencyLabel: getEventUrgencyLabel(endAt, referenceNow),
    rankingReason: "",
    trustBadges: [],
    collectedAt: deal.updatedAt || deal.startDate,
    updatedAt: deal.updatedAt,
    verifiedAt: deal.verifiedAt || deal.lastCheckedAt,
    status,
    validationStatus,
    validationReason: sanitizeBenefitText(deal.validationReason || (status === "active" ? "공식 혜택 링크 검증 통과" : "노출 정책 미통과"), 100),
    qualityScore: Number(deal.qualityScore ?? 0),
    freshnessScore,
    officialScore,
    urgencyScore,
    rewardScore,
    priorityScore:
      Number(deal.priorityScore ?? deal.confidenceScore ?? 0) +
      getMainFeedConsumerPriorityPenalty(deal) +
      (isConsumerFacingBenefit(deal) ? 12 : 0),
    freeConditionScore,
    interestScore,
    isHidden: deal.isHidden || status !== "active" || validationStatus !== "passed",
    hiddenReason: sanitizeBenefitText(deal.hiddenReason || (status === "active" ? "" : status), 80),
    tags: deal.tags.map((tag) => sanitizeBenefitText(tag, 24)).filter(Boolean).slice(0, 8)
  };

  event.trustBadges = buildTrustBadges(event).slice(0, 5);
  event.rankingReason = getRankingReason(event, referenceNow);
  return event;
}

export function isPublishableFreeBenefitEvent(event: FreeBenefitEvent, referenceNow = Date.now()) {
  const endsAt = Date.parse(event.endAt);
  return (
    event.status === "active" &&
    event.validationStatus === "passed" &&
    !event.isHidden &&
    Boolean(event.finalUrl) &&
    isSafeBenefitEventUrl(event.finalUrl) &&
    (!Number.isFinite(endsAt) || endsAt >= referenceNow) &&
    event.qualityScore >= 70
  );
}

function isPublicFreeBenefitEvent(event: FreeBenefitEvent) {
  return event.benefitType === "publicFree";
}

function getFreeBenefitDiversityLane(event: FreeBenefitEvent) {
  const text = [event.title, event.rewardText, event.brandName, event.sourceName, event.sourceDomain, event.tags.join(" ")].join(" ");

  if (/GS25|CU|세븐일레븐|이마트24|편의점/i.test(text)) return "convenience";
  if (/스타벅스|메가|이디야|투썸|커피|카페|롯데잇츠|롯데리아|배민|요기요|쿠팡이츠|피자|치킨|외식|배달/i.test(text)) return "food";
  if (/올리브영|무신사|아모레|이니스프리|닥터지|라운드랩|뷰티|패션|화장품/i.test(text)) return "beauty-fashion";
  if (/네이버페이|카카오페이|PAYCO|페이코|토스|KB|신한|H\.?Point|해피포인트|CJ\s*ONE|멤버십|포인트|캐시백/i.test(text)) return "membership-point";
  if (/다이소|이마트|홈플러스|롯데마트|SSG|컬리|마트|생활용품|생필품/i.test(text)) return "mart-living";
  if (event.benefitType === "sample" || event.benefitType === "freeTrial" || event.benefitType === "experiencePanel") return "sample-trial";
  if (event.benefitType === "coupon" || event.benefitType === "signup") return "coupon-signup";
  return "brand-event";
}

function selectDiverseFreeBenefitEvents(events: FreeBenefitEvent[], limit: number, referenceNow: number) {
  const remaining = [...events];
  const selected: FreeBenefitEvent[] = [];
  const sourceCounts = new Map<string, number>();
  const benefitTypeCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();
  const laneCounts = new Map<string, number>();

  while (remaining.length && selected.length < limit) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < remaining.length; index += 1) {
      const event = remaining[index];
      const sourceRepeat = sourceCounts.get(event.sourceDomain) ?? 0;
      const typeRepeat = benefitTypeCounts.get(event.benefitType) ?? 0;
      const brandRepeat = brandCounts.get(event.brandName) ?? 0;
      const lane = getFreeBenefitDiversityLane(event);
      const laneRepeat = laneCounts.get(lane) ?? 0;
      const firstScreenDiversityBoost = selected.length < 12 && brandRepeat === 0 && laneRepeat === 0 ? 14 : 0;
      const diversityPenalty =
        sourceRepeat * 16 +
        typeRepeat * 7 +
        brandRepeat * (selected.length < 12 ? 24 : 10) +
        laneRepeat * (selected.length < 12 ? 13 : 5);
      const urgencyReserveBoost = event.isEveryoneReward || event.isFirstComeFirstServed || event.urgencyLabel.includes("마감") ? 4 : 0;
      const score = getFreeBenefitEventScore(event, referenceNow) + getConsumerEventScoreAdjustment(event) + urgencyReserveBoost + firstScreenDiversityBoost - diversityPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const [picked] = remaining.splice(bestIndex, 1);
    selected.push(picked);
    sourceCounts.set(picked.sourceDomain, (sourceCounts.get(picked.sourceDomain) ?? 0) + 1);
    benefitTypeCounts.set(picked.benefitType, (benefitTypeCounts.get(picked.benefitType) ?? 0) + 1);
    brandCounts.set(picked.brandName, (brandCounts.get(picked.brandName) ?? 0) + 1);
    const pickedLane = getFreeBenefitDiversityLane(picked);
    laneCounts.set(pickedLane, (laneCounts.get(pickedLane) ?? 0) + 1);
  }

  return selected;
}

export function buildFreeBenefitEvents(deals: NewsDeal[], referenceNow = Date.now()) {
  const deduped = new Map<string, FreeBenefitEvent>();

  for (const deal of deals) {
    const event = toFreeBenefitEvent(deal, referenceNow);
    const urlKey = event.finalUrl ? new URL(event.finalUrl).toString().replace(/utm_[^=&]+=[^&]+&?/g, "") : event.eventUrl;
    const key = [event.brandName, normalizeBenefitTitle(event.title), urlKey, event.endAt.slice(0, 10)].join("|").toLowerCase();
    const current = deduped.get(key);
    if (!current || event.qualityScore + event.priorityScore > current.qualityScore + current.priorityScore) {
      deduped.set(key, event);
    }
  }

  return Array.from(deduped.values()).sort(
    (a, b) =>
      getFreeBenefitEventScore(b, referenceNow) +
        getConsumerEventScoreAdjustment(b) -
        (getFreeBenefitEventScore(a, referenceNow) + getConsumerEventScoreAdjustment(a)) ||
      Date.parse(a.endAt) - Date.parse(b.endAt)
  );
}

export function selectPublishableFreeBenefitEvents(
  deals: NewsDeal[],
  limit = 24,
  referenceNow = Date.now(),
  options: { includePublic?: boolean } = {}
) {
  const publishableEvents = buildFreeBenefitEvents(deals, referenceNow)
    .filter((event) => isPublishableFreeBenefitEvent(event, referenceNow))
    .filter((event) => options.includePublic === true || !isPublicFreeBenefitEvent(event));

  return selectDiverseFreeBenefitEvents(publishableEvents, limit, referenceNow);
}

import { isApprovedOfficialNewsUrl } from "@/lib/deals/newsLinkPolicy";
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
  { id: "publicFree", label: "공공무료" },
  { id: "experiencePanel", label: "체험단" }
];

export type FreeBenefitEventCategoryCount = (typeof freeBenefitEventCategories)[number] & { count: number };

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

function inferSourceType(provider: NewsDeal["provider"]): FreeBenefitSourceType {
  if (provider === "official_event") return "official";
  if (provider === "public_coupon") return "approved_public";
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

function getClaimCtaLabel(type: FreeBenefitEventType) {
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
  const endAt = Date.parse(event.endAt);
  const hoursLeft = Number.isFinite(endAt) ? Math.max(0, (endAt - referenceNow) / 3_600_000) : 999;
  const urgencyBoost = hoursLeft <= 24 ? 18 : hoursLeft <= 72 ? 9 : 0;

  return (
    event.qualityScore +
    event.priorityScore * 0.5 +
    (event.isEveryoneReward ? 18 : 0) +
    (event.isFirstComeFirstServed ? 9 : 0) +
    (event.requiresPurchase ? -18 : 8) +
    (event.requiresLogin ? -4 : 4) +
    urgencyBoost
  );
}

function getRankingReason(event: FreeBenefitEvent, referenceNow: number) {
  if (event.isEveryoneReward && !event.requiresPurchase) return "전원증정이고 구매 조건이 낮아 먼저 볼 만한 혜택";
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
  const sourceType = inferSourceType(deal.provider);
  const requiresLogin = loginPattern.test(combinedText);
  const requiresPurchase = purchasePattern.test(combinedText);
  const isEveryoneReward = everyoneRewardPattern.test(combinedText);
  const isFirstComeFirstServed = firstComePattern.test(combinedText);
  const endAt = deal.expiresAt || deal.endDate;

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
    startAt: deal.startDate,
    endAt,
    participationCondition: buildParticipationCondition({ deal, benefitType, requiresLogin, requiresPurchase, isEveryoneReward, isFirstComeFirstServed }),
    requiresLogin,
    requiresPurchase,
    isEveryoneReward,
    isFirstComeFirstServed,
    rewardText,
    cautionText: sanitizeBenefitText(status === "active" ? "공식 페이지에서 최종 참여 조건과 잔여 수량을 확인하세요." : "종료 또는 검증 실패 가능성이 있어 노출에서 제외됩니다.", 120),
    claimCtaLabel: getClaimCtaLabel(benefitType),
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
    priorityScore: Number(deal.priorityScore ?? deal.confidenceScore ?? 0),
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

  return Array.from(deduped.values()).sort((a, b) => getFreeBenefitEventScore(b, referenceNow) - getFreeBenefitEventScore(a, referenceNow) || Date.parse(a.endAt) - Date.parse(b.endAt));
}

export function selectPublishableFreeBenefitEvents(deals: NewsDeal[], limit = 24, referenceNow = Date.now()) {
  return buildFreeBenefitEvents(deals, referenceNow)
    .filter((event) => isPublishableFreeBenefitEvent(event, referenceNow))
    .slice(0, limit);
}

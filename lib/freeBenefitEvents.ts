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
  { id: "signup", label: "신규가입" },
  { id: "publicFree", label: "공공무료" },
  { id: "experiencePanel", label: "체험단" }
];

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
  if (/출석|체크인|매일\s*참여|룰렛|스탬프/i.test(text)) return "checkIn";
  if (/신규|첫\s*구매|첫\s*가입|웰컴/i.test(text)) return "signup";
  if (/기프티콘|교환권|모바일\s*쿠폰|음료권/i.test(text)) return "gifticon";
  if (/포인트|캐시백|적립|페이/i.test(text)) return "pointCashback";
  if (/공공|정부|지원|문화가\s*있는\s*날|서울시|복지|교육/i.test(text) || deal.benefitType === "public") return "publicFree";
  if (/체험단|리뷰단|무료\s*체험/i.test(text) || deal.benefitType === "freebie") return "experiencePanel";
  if (/무료\s*체험|trial|구독\s*체험/i.test(text)) return "freeTrial";
  if (samplePattern.test(text)) return "sample";
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

export function toFreeBenefitEvent(deal: NewsDeal, referenceNow = Date.now()): FreeBenefitEvent {
  const combinedText = sanitizeBenefitText([deal.title, deal.summary, deal.category, deal.sourceName, deal.tags.join(" ")].join(" "), 600);
  const status = inferStatus(deal, combinedText, referenceNow);
  const rewardText = sanitizeBenefitText(deal.summary || deal.title, 120);
  const validationStatus = status === "blocked" ? "blocked" : deal.validationStatus === "passed" ? "passed" : deal.validationStatus === "failed" ? "failed" : "needs_review";

  return {
    id: deal.id,
    title: sanitizeBenefitText(deal.title, 90),
    brandName: sanitizeBenefitText(deal.merchant || deal.mallName || deal.sourceName, 40),
    benefitType: inferEventType(deal, combinedText),
    legacyBenefitType: deal.benefitType,
    eventUrl: deal.eventUrl || deal.finalUrl,
    officialUrl: deal.sourceUrl || deal.finalUrl,
    finalUrl: isSafeBenefitEventUrl(deal.finalUrl) ? deal.finalUrl : "",
    imageUrl: deal.imageUrl || "",
    sourceName: sanitizeBenefitText(deal.sourceName || deal.merchant, 50),
    sourceType: inferSourceType(deal.provider),
    sourceUrl: deal.sourceUrl,
    startAt: deal.startDate,
    endAt: deal.expiresAt || deal.endDate,
    participationCondition: sanitizeBenefitText(
      deal.tags.find((tag) => /조건|회원|로그인|구매|앱|선착순|전원/.test(tag)) || (purchasePattern.test(combinedText) ? "구매/주문 조건 확인 필요" : "공식 페이지 조건 확인"),
      90
    ),
    requiresLogin: loginPattern.test(combinedText),
    requiresPurchase: purchasePattern.test(combinedText),
    isEveryoneReward: everyoneRewardPattern.test(combinedText),
    isFirstComeFirstServed: firstComePattern.test(combinedText),
    rewardText,
    cautionText: sanitizeBenefitText(status === "active" ? "공식 페이지에서 최종 참여 조건과 잔여 수량을 확인하세요." : "종료 또는 검증 실패 가능성이 있어 노출에서 제외됩니다.", 120),
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

  return Array.from(deduped.values()).sort(
    (a, b) =>
      Number(b.isEveryoneReward) - Number(a.isEveryoneReward) ||
      Number(a.requiresPurchase) - Number(b.requiresPurchase) ||
      b.qualityScore - a.qualityScore ||
      b.priorityScore - a.priorityScore ||
      Date.parse(a.endAt) - Date.parse(b.endAt)
  );
}

export function selectPublishableFreeBenefitEvents(deals: NewsDeal[], limit = 24, referenceNow = Date.now()) {
  return buildFreeBenefitEvents(deals, referenceNow)
    .filter((event) => isPublishableFreeBenefitEvent(event, referenceNow))
    .slice(0, limit);
}

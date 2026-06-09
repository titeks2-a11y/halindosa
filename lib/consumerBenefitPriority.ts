import type { NewsDeal } from "@/types/newsDeal";

const publicBenefitPattern = /정부|공공|지자체|복지|정책|지원사업|보조금|서울시|공공서비스|K-MOOC|케이무크|문화가\s*있는\s*날|HRD|정부24|복지로/i;

const consumerBenefitPattern = /쿠폰|무료\s*샘플|샘플|기프티콘|교환권|전원\s*증정|선착순|출석|룰렛|포인트|캐시백|무료배송|무배|1\+1|2\+1|편의점|마트|배달|카페|뷰티|올리브영|무신사|컬리|SSG|롯데온|G마켓|11번가|쿠팡|이마트|홈플러스|브랜드/i;

const strongConsumerTypes = new Set([
  "coupon",
  "sample",
  "freebie",
  "freeShipping",
  "point",
  "foodDelivery",
  "convenienceStore",
  "mart",
  "membership",
  "card"
]);

const publicTypes = new Set(["public", "public_free", "education"]);

const highIntentConsumerTypes = new Set([
  "coupon",
  "sample",
  "freebie",
  "freeShipping",
  "point",
  "foodDelivery",
  "convenienceStore",
  "mart"
]);

const consumerFacingCategoryPattern = /무료혜택|마트\/편의점|외식\/배달|패션\/뷰티|카드\/멤버십|식품\/생필품|디지털\/가전|여행\/숙박/i;

function getNewsDealText(deal: NewsDeal) {
  return [deal.title, deal.summary, deal.merchant, deal.mallName, deal.category, deal.benefitType, deal.sourceName, deal.tags.join(" ")].join(" ");
}

export function isPublicPolicyBenefit(deal: NewsDeal) {
  return publicTypes.has(deal.benefitType) || deal.category === "정부/공공혜택" || publicBenefitPattern.test(getNewsDealText(deal));
}

export function isConsumerFacingBenefit(deal: NewsDeal) {
  const text = getNewsDealText(deal);
  return highIntentConsumerTypes.has(deal.benefitType) || consumerFacingCategoryPattern.test(deal.category) || consumerBenefitPattern.test(text);
}

export function getMainFeedConsumerPriorityPenalty(deal: NewsDeal) {
  if (!isPublicPolicyBenefit(deal)) return 0;
  return isConsumerFacingBenefit(deal) ? -70 : -140;
}

export function getConsumerBenefitPriorityAdjustment(deal: NewsDeal) {
  const text = getNewsDealText(deal);
  let score = 0;

  if (strongConsumerTypes.has(deal.benefitType)) score += 34;
  if (consumerBenefitPattern.test(text)) score += 22;
  if (/무료|0원|전원\s*증정|샘플|기프티콘|쿠폰/.test(text)) score += 14;
  if (/구매|결제|최소\s*주문|카드\s*발급|자동\s*납부|배송비/.test(text)) score -= 10;

  score += getMainFeedConsumerPriorityPenalty(deal);

  return score;
}

export function getConsumerBenefitPriorityScore(deal: NewsDeal) {
  return Number(deal.priorityScore ?? deal.confidenceScore ?? 0) + getConsumerBenefitPriorityAdjustment(deal);
}

import { DealBenefitType } from "@/types/deal";

export interface BenefitInput {
  title: string;
  category?: string;
  tags?: string[];
  shipping?: string;
  salePrice?: number;
  originalPrice?: number;
  discountRate?: number;
}

function textOf(input: BenefitInput) {
  return [input.title, input.category, input.shipping, ...(input.tags ?? [])].join(" ").toLowerCase();
}

export function inferDealBenefitType(input: BenefitInput): DealBenefitType {
  const text = textOf(input);

  if (/포인트|적립|앱테크|캐시백|페이/.test(text)) return "point";
  if (/체험|샘플|무료체험|테스터/.test(text)) return "experience";
  if (/0원|무료|공짜|무상/.test(text) && (input.salePrice ?? 1) <= 1000) return "freebie";
  if (/쿠폰|교환권|청구할인|카드할인|1\+1|2\+1|이벤트/.test(text)) return "coupon";
  if (/무료배송|무배|로켓배송|로켓프레시|네멤무료/.test(text)) return "freeShipping";
  if (/행사|타임세일|오늘만|마감임박|한정수량/.test(text)) return "event";
  return "discount";
}

export function buildBenefitSummary(input: BenefitInput, dealType = inferDealBenefitType(input)) {
  const savings = Math.max(0, (input.originalPrice ?? 0) - (input.salePrice ?? 0));
  const rate = input.discountRate ?? 0;

  switch (dealType) {
    case "freebie":
      return "무료 또는 0원 조건으로 받을 수 있는 혜택입니다.";
    case "coupon":
      return "쿠폰, 교환권, 카드 혜택을 확인할 만한 절약 정보입니다.";
    case "freeShipping":
      return "배송비 부담을 줄일 수 있는 무료배송 특가입니다.";
    case "experience":
      return "체험단, 샘플, 무료 체험 조건을 확인할 수 있는 혜택입니다.";
    case "event":
      return "기간이 정해진 이벤트성 특가로 마감 시간을 확인하세요.";
    case "point":
      return "포인트 적립이나 앱테크형 생활비 절약 혜택입니다.";
    case "discount":
    default:
      return savings > 0 ? `${rate}% 할인, 약 ${savings.toLocaleString("ko-KR")}원 절약 가능한 특가입니다.` : "판매처에서 가격 조건을 확인할 만한 특가입니다.";
  }
}

export function getBenefitTypeLabel(type: DealBenefitType) {
  const labels: Record<DealBenefitType, string> = {
    discount: "오늘특가",
    freebie: "무료혜택",
    coupon: "쿠폰",
    freeShipping: "무료배송",
    experience: "체험/샘플",
    event: "이벤트",
    point: "포인트"
  };

  return labels[type];
}

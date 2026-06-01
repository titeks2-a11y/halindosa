import { DealBenefitType } from "@/types/deal";
import { formatPrice } from "@/lib/format";

interface BenefitClaimGuideInput {
  title: string;
  dealType: DealBenefitType;
  requiresSignup: boolean;
  isFirstComeFirstServed: boolean;
  isFreeShipping: boolean;
  isEndingSoon: boolean;
  shippingFee: string;
  couponCondition?: string;
  minimumOrderAmount?: number;
  isStackable?: boolean;
}

export function buildBenefitClaimGuide(input: BenefitClaimGuideInput) {
  const eligibilityChecklist = [
    input.requiresSignup ? "판매처 회원가입 또는 앱 설치 조건 확인" : "비회원 또는 간단 확인 가능 여부 우선 확인",
    input.shippingFee === "무료배송" || input.isFreeShipping ? "배송비 무료 조건 확인" : `배송비 조건 확인: ${input.shippingFee}`,
    input.couponCondition ? `쿠폰 조건 확인: ${input.couponCondition}` : "별도 쿠폰 조건 없음 또는 판매처 최종 확인",
    input.minimumOrderAmount ? `최소 주문 금액 ${formatPrice(input.minimumOrderAmount)} 이상 여부 확인` : "최소 주문 금액 표시 없음",
    input.isFirstComeFirstServed ? "선착순 또는 한정 수량 가능성 확인" : "선착순 표시 없음",
    input.isStackable ? "중복 할인 가능 여부 확인" : "중복 할인은 판매처에서 최종 확인"
  ];

  const claimSteps = [
    input.dealType === "freebie" || input.dealType === "experience"
      ? "무료/체험 신청 조건을 먼저 확인"
      : input.dealType === "coupon" || input.dealType === "foodDelivery"
        ? "쿠폰 발급 또는 적용 조건을 먼저 확인"
        : input.dealType === "point"
          ? "출석체크, 적립 예정일, 지급 조건을 먼저 확인"
          : "판매처 상세 조건을 먼저 확인",
    "옵션가, 배송비, 최소 주문 금액을 판매처 화면에서 재확인",
    "조건이 다르거나 종료된 경우 할인도사에 신고"
  ];

  const claimWarning = input.isEndingSoon
    ? "마감이 가까운 혜택입니다. 판매처 화면에서 수량과 종료 시간을 먼저 확인하세요."
    : "혜택 조건은 판매처 사정에 따라 바뀔 수 있습니다. 신청 전 최종 조건을 확인하세요.";

  return { eligibilityChecklist, claimSteps, claimWarning };
}

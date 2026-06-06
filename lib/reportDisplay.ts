export type ReportReason = "price_changed" | "sold_out" | "expired" | "link_error" | "wrong_info" | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ReportPriority = "high" | "medium" | "low";

const reportReasonLabels: Record<ReportReason, string> = {
  price_changed: "가격 다름",
  sold_out: "품절",
  expired: "종료됨",
  link_error: "링크 오류",
  wrong_info: "정보 오류",
  other: "기타"
};

const reportStatusLabels: Record<ReportStatus, string> = {
  open: "미처리",
  reviewing: "검토중",
  resolved: "해결",
  dismissed: "기각"
};

const reportPriorityLabels: Record<ReportPriority, string> = {
  high: "우선 검수",
  medium: "일반 검수",
  low: "참고"
};

const reportResolutionPlans: Record<ReportReason, { userExpectation: string; operatorSla: string; queueLabel: string }> = {
  price_changed: {
    userExpectation: "판매처 최종가, 쿠폰 적용가, 옵션가를 비교해 표시 가격을 다시 확인합니다.",
    operatorSla: "영업일 24시간 이내 확인",
    queueLabel: "가격 기준 재확인"
  },
  sold_out: {
    userExpectation: "재고와 옵션 선택 가능 여부를 확인하고 품절 가능성이 높으면 노출을 낮춥니다.",
    operatorSla: "우선 검수 6시간 이내",
    queueLabel: "품절 노출 조정"
  },
  expired: {
    userExpectation: "쿠폰, 이벤트, 체험단 모집 종료 여부를 확인하고 종료된 혜택은 하단으로 이동합니다.",
    operatorSla: "우선 검수 6시간 이내",
    queueLabel: "종료 혜택 정리"
  },
  link_error: {
    userExpectation: "실제 상품/혜택 상세가 열리는지 확인하고 다른 페이지로 이동하면 링크를 교체합니다.",
    operatorSla: "우선 검수 6시간 이내",
    queueLabel: "링크 교체"
  },
  wrong_info: {
    userExpectation: "쇼핑몰명, 배송비, 이미지, 혜택 조건을 판매처 기준으로 다시 확인합니다.",
    operatorSla: "영업일 24시간 이내 확인",
    queueLabel: "정보 정정"
  },
  other: {
    userExpectation: "남겨주신 내용을 운영 메모로 확인하고 필요한 경우 고객센터 답변으로 이어갑니다.",
    operatorSla: "영업일 48시간 이내 확인",
    queueLabel: "운영 메모 확인"
  }
};

export function getReportReasonLabel(reason: ReportReason) {
  return reportReasonLabels[reason] ?? reason;
}

export function getReportStatusLabel(status: ReportStatus) {
  return reportStatusLabels[status] ?? status;
}

export function getReportPriorityLabel(priority: ReportPriority) {
  return reportPriorityLabels[priority] ?? priority;
}

export function getReportResolutionPlan(reason: ReportReason) {
  return reportResolutionPlans[reason] ?? reportResolutionPlans.other;
}

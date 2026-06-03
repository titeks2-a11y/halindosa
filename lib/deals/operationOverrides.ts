import { Deal } from "@/types/deal";

const operationStore = globalThis as typeof globalThis & {
  __halindosaManualHiddenDeals?: Set<string>;
  __halindosaManualHiddenReasons?: Map<string, string>;
};

function getHiddenDealStore() {
  if (!operationStore.__halindosaManualHiddenDeals) {
    operationStore.__halindosaManualHiddenDeals = new Set<string>();
  }

  return operationStore.__halindosaManualHiddenDeals;
}

function getHiddenReasonStore() {
  if (!operationStore.__halindosaManualHiddenReasons) {
    operationStore.__halindosaManualHiddenReasons = new Map<string, string>();
  }

  return operationStore.__halindosaManualHiddenReasons;
}

function normalizeDealId(dealId: string) {
  return dealId.trim();
}

export function hideDealManually(dealId: string, reason = "admin_manual_hidden") {
  const id = normalizeDealId(dealId);
  if (!id) return false;

  getHiddenDealStore().add(id);
  getHiddenReasonStore().set(id, reason);
  return true;
}

export function restoreDealManually(dealId: string) {
  const id = normalizeDealId(dealId);
  if (!id) return false;

  getHiddenReasonStore().delete(id);
  return getHiddenDealStore().delete(id);
}

export function isDealManuallyHidden(dealId: string) {
  return getHiddenDealStore().has(normalizeDealId(dealId));
}

export function listManualHiddenDealIds() {
  return Array.from(getHiddenDealStore()).sort();
}

export function getManualHiddenReason(dealId: string) {
  return getHiddenReasonStore().get(normalizeDealId(dealId)) ?? "admin_manual_hidden";
}

export function applyDealOperationOverrides<T extends Deal>(deal: T): T {
  if (!isDealManuallyHidden(deal.id)) return deal;

  const reason = getManualHiddenReason(deal.id);

  return {
    ...deal,
    isHidden: true,
    validationReason: deal.validationReason ? `${deal.validationReason}; ${reason}` : reason,
    priorityScore: Math.min(deal.priorityScore ?? 0, 10),
    notice: "운영자가 링크, 재고, 가격 조건을 재검증 중인 특가입니다."
  };
}

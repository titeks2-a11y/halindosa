export interface ClaimedBenefitRecord {
  dealId: string;
  title: string;
  mallName: string;
  benefitSummary: string;
  savingsAmount: number;
  claimedAt: string;
}

export const claimedBenefitStorageKey = "halindosa:claimed-benefits";

function sanitizeClaimRecord(value: unknown): ClaimedBenefitRecord | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Partial<ClaimedBenefitRecord>;
  if (typeof record.dealId !== "string" || typeof record.title !== "string") return null;

  return {
    dealId: record.dealId,
    title: record.title,
    mallName: typeof record.mallName === "string" ? record.mallName : "",
    benefitSummary: typeof record.benefitSummary === "string" ? record.benefitSummary : "",
    savingsAmount: typeof record.savingsAmount === "number" ? record.savingsAmount : 0,
    claimedAt: typeof record.claimedAt === "string" ? record.claimedAt : new Date().toISOString()
  };
}

export function readClaimedBenefits(): ClaimedBenefitRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(claimedBenefitStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(sanitizeClaimRecord).filter((record): record is ClaimedBenefitRecord => Boolean(record)) : [];
  } catch {
    return [];
  }
}

export function writeClaimedBenefits(records: ClaimedBenefitRecord[]) {
  window.localStorage.setItem(claimedBenefitStorageKey, JSON.stringify(records.slice(0, 50)));
}

export function toggleClaimedBenefit(record: ClaimedBenefitRecord) {
  const current = readClaimedBenefits();
  const exists = current.some((item) => item.dealId === record.dealId);
  const next = exists
    ? current.filter((item) => item.dealId !== record.dealId)
    : [{ ...record, claimedAt: new Date().toISOString() }, ...current].slice(0, 50);

  writeClaimedBenefits(next);
  return next;
}

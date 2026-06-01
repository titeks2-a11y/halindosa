export type BenefitReturnReservation = {
  id: string;
  title: string;
  slot: string;
  createdAt: string;
};

export const benefitReturnReservationStorageKey = "halindosa:benefit-return-reservations";

export function readBenefitReturnReservations(): BenefitReturnReservation[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(benefitReturnReservationStorageKey) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(
          (value): value is BenefitReturnReservation =>
            typeof value?.id === "string" &&
            typeof value?.title === "string" &&
            typeof value?.slot === "string" &&
            typeof value?.createdAt === "string"
        )
      : [];
  } catch {
    return [];
  }
}

export function writeBenefitReturnReservations(items: BenefitReturnReservation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(benefitReturnReservationStorageKey, JSON.stringify(items));
}

export interface BenefitCheckInState {
  lastDate: string;
  streak: number;
  completedMissions: string[];
}

export const benefitCheckInStorageKey = "halindosa:benefit-check-in";

export const benefitMissionLabels: Record<string, string> = {
  free: "무료·체험 확인",
  coupon: "쿠폰 적용 후보",
  ending: "마감 전 확인",
  point: "포인트 적립"
};

export function getTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function getPreviousDateKey(dateKey: string) {
  const previous = new Date(`${dateKey}T00:00:00`);
  previous.setDate(previous.getDate() - 1);
  const month = String(previous.getMonth() + 1).padStart(2, "0");
  const day = String(previous.getDate()).padStart(2, "0");
  return `${previous.getFullYear()}-${month}-${day}`;
}

export function readBenefitCheckInState(): BenefitCheckInState {
  if (typeof window === "undefined") return { lastDate: "", streak: 0, completedMissions: [] };

  try {
    const parsed = JSON.parse(window.localStorage.getItem(benefitCheckInStorageKey) ?? "{}");
    return {
      lastDate: typeof parsed.lastDate === "string" ? parsed.lastDate : "",
      streak: typeof parsed.streak === "number" ? parsed.streak : 0,
      completedMissions: Array.isArray(parsed.completedMissions) ? parsed.completedMissions.filter((value: unknown): value is string => typeof value === "string") : []
    };
  } catch {
    return { lastDate: "", streak: 0, completedMissions: [] };
  }
}

export function writeBenefitCheckInState(state: BenefitCheckInState) {
  window.localStorage.setItem(benefitCheckInStorageKey, JSON.stringify(state));
}

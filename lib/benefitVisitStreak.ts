export interface BenefitVisitStreak {
  currentStreak: number;
  totalVisits: number;
  lastVisitedDate: string;
  visitedDates: string[];
}

const storageKey = "halindosa:benefit-visit-streak";

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

export function readBenefitVisitStreak(): BenefitVisitStreak {
  if (typeof window === "undefined") {
    return { currentStreak: 0, totalVisits: 0, lastVisitedDate: "", visitedDates: [] };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as Record<string, unknown>;
    const visitedDates = Array.isArray(parsed.visitedDates)
      ? parsed.visitedDates.filter((value: unknown): value is string => typeof value === "string")
      : [];

    return {
      currentStreak: typeof parsed.currentStreak === "number" ? parsed.currentStreak : 0,
      totalVisits: typeof parsed.totalVisits === "number" ? parsed.totalVisits : visitedDates.length,
      lastVisitedDate: typeof parsed.lastVisitedDate === "string" ? parsed.lastVisitedDate : visitedDates[0] ?? "",
      visitedDates
    };
  } catch {
    return { currentStreak: 0, totalVisits: 0, lastVisitedDate: "", visitedDates: [] };
  }
}

export function markBenefitVisit(date = new Date()): BenefitVisitStreak {
  if (typeof window === "undefined") {
    return { currentStreak: 0, totalVisits: 0, lastVisitedDate: "", visitedDates: [] };
  }

  const today = toDateKey(date);
  const current = readBenefitVisitStreak();
  if (current.lastVisitedDate === today) return current;

  const next: BenefitVisitStreak = {
    currentStreak: current.lastVisitedDate === getYesterdayKey(today) ? current.currentStreak + 1 : 1,
    totalVisits: current.totalVisits + 1,
    lastVisitedDate: today,
    visitedDates: [today, ...current.visitedDates.filter((visitedDate) => visitedDate !== today)].slice(0, 30)
  };

  window.localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function clearBenefitVisitStreak() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
}

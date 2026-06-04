import type { Deal } from "@/types/deal";
import type { HotSignal } from "@/types/hotSignal";
import type { NewsDeadlineSummary, NewsDeal, NewsDealSourceTrust } from "@/types/newsDeal";

export interface DealsResponse {
  ok: boolean;
  deals: Deal[];
  count: number;
  updatedAt: string;
  source: string;
  message: string;
}

export interface HotSignalsResponse {
  ok: boolean;
  signals: HotSignal[];
  count: number;
  updatedAt: string;
  source: string;
  message: string;
}

export interface NewsDealsResponse {
  ok: boolean;
  deals: NewsDeal[];
  count: number;
  updatedAt: string;
  source: string;
  categoryCounts?: Record<string, number>;
  benefitTypeCounts?: Record<string, number>;
  sourceCounts?: Record<string, number>;
  recommendedQueries?: Array<{ query: string; count: number }>;
  sourceTrustScores?: NewsDealSourceTrust[];
  deadlineSummary?: NewsDeadlineSummary;
  freshnessStatus?: "fresh" | "due" | "stale" | "seed";
  freshnessLabel?: string;
  freshnessAgeMinutes?: number | null;
  nextRefreshAt?: string;
  message: string;
}

export function requestJson<T>(url: string): Promise<T> {
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return window.fetch(url, { cache: "no-store" }).then(async (response) => (await response.json()) as T);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as T);
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new Error("Network request failed"));
    xhr.send();
  });
}

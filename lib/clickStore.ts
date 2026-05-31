import { DealClickLog } from "@/types/user";

const clickLogs: DealClickLog[] = [];
const clickCounts = new Map<string, number>();

export function recordDealClick(input: Omit<DealClickLog, "id" | "createdAt">) {
  const log: DealClickLog = {
    ...input,
    id: `clk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString()
  };

  clickLogs.unshift(log);
  clickCounts.set(input.dealId, (clickCounts.get(input.dealId) ?? 0) + 1);
  if (clickLogs.length > 500) clickLogs.length = 500;

  return log;
}

export function getDealClickCount(dealId: string) {
  return clickCounts.get(dealId) ?? 0;
}

export function listRecentClickLogs(limit = 50) {
  return clickLogs.slice(0, limit);
}

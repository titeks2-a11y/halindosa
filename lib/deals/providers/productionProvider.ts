import { Deal } from "@/types/deal";

export async function fetchProductionDeals(): Promise<Deal[]> {
  // V1.0 keeps production data disabled until an official API, RSS, or contracted feed is configured.
  // Future implementation should fetch a server API that already validates source rights, pricing, and expiry.
  return [];
}

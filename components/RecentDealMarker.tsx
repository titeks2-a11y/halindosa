"use client";

import { useEffect } from "react";
import { rememberRecentDealId } from "@/lib/recentDeals";

export function RecentDealMarker({ dealId }: { dealId: string }) {
  useEffect(() => {
    rememberRecentDealId(dealId);
  }, [dealId]);

  return null;
}

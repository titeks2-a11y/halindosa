"use client";

import { useEffect } from "react";
import { recordRecentDealView } from "@/lib/memberSync";

export function RecentDealMarker({ dealId }: { dealId: string }) {
  useEffect(() => {
    void recordRecentDealView(dealId);
  }, [dealId]);

  return null;
}

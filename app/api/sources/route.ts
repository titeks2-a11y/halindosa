import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";
import { listDealSourceProfiles } from "@/lib/deals/trust";

export async function GET() {
  const { deals, source, updatedAt } = await getDeals();
  const profiles = listDealSourceProfiles();
  const counts = new Map<string, number>();

  for (const deal of deals) {
    counts.set(deal.source, (counts.get(deal.source) ?? 0) + 1);
  }

  return NextResponse.json({
    ok: true,
    activeMode: process.env.DEAL_DATA_MODE ?? process.env.DEAL_PROVIDER ?? "mock",
    currentSource: source,
    updatedAt,
    sources: profiles.map((profile) => ({
      ...profile,
      dealCount: counts.get(profile.key) ?? 0
    })),
    message: "할인도사 데이터 공급원 상태를 불러왔습니다."
  });
}

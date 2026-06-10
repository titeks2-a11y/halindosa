import { headers } from "next/headers";
import HomeClient from "@/components/HomeClient";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";

const INITIAL_HOME_NEWS_LIMIT = 192;

export default async function Page() {
  const initialNow = new Date().toISOString();
  const initialNewsResult = getVisibleNewsDeals({ limit: INITIAL_HOME_NEWS_LIMIT, sort: "priority" });

  if (process.env.CAPACITOR_BUILD !== "true") {
    await headers();
  }

  return (
    <HomeClient
      initialNow={initialNow}
      initialNewsSnapshot={{
        generatedAt: initialNewsResult.updatedAt,
        deals: initialNewsResult.deals,
        sourceTrustScores: initialNewsResult.sourceTrustScores,
        intentGroups: initialNewsResult.intentGroups
      }}
    />
  );
}

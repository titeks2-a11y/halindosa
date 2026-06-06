import { noStoreJson } from "@/lib/api/noStore";
import { getDeals, normalizeSort } from "@/lib/dealService";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import { fetchHotSignals } from "@/lib/hotSignalProvider";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 12);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();

  try {
    const [deals, news, signals] = await Promise.all([
      getDeals({
        category,
        q,
        sort: normalizeSort(searchParams.get("sort") ?? "latest"),
        limit,
        verifiedOnly: searchParams.get("verifiedOnly") !== "false",
        freeShippingOnly: searchParams.get("freeShippingOnly") === "true",
        hotOnly: searchParams.get("hotOnly") === "true",
        endingSoonOnly: searchParams.get("endingSoonOnly") === "true",
        mall: searchParams.get("mall")?.trim(),
        priceBand: searchParams.get("priceBand")?.trim(),
        dealType: searchParams.get("dealType")?.trim()
      }),
      getVisibleNewsDeals({
        limit: Math.min(Math.max(limit, 8), 24),
        category,
        q,
        sort: q ? "endingSoon" : "priority"
      }),
      fetchHotSignals({
        category,
        q,
        source: searchParams.get("source")?.trim() || "all",
        limit: Math.min(Math.max(limit, 6), 18)
      })
    ]);

    return noStoreJson({
      ok: true,
      deals: deals.deals,
      newsDeals: news.deals,
      hotSignals: signals,
      counts: {
        deals: deals.deals.length,
        newsDeals: news.deals.length,
        hotSignals: signals.length
      },
      updatedAt: new Date().toISOString(),
      dealUpdatedAt: deals.updatedAt,
      newsUpdatedAt: news.updatedAt,
      source: {
        deals: deals.source,
        news: news.source,
        hotSignals: "rss"
      },
      newsMeta: {
        recommendedQueries: news.recommendedQueries,
        targetSections: news.targetSections,
        intentGroups: news.intentGroups,
        sourceTrustScores: news.sourceTrustScores,
        deadlineSummary: news.deadlineSummary,
        freshnessStatus: news.freshnessStatus,
        freshnessLabel: news.freshnessLabel,
        freshnessAgeMinutes: news.freshnessAgeMinutes,
        nextRefreshAt: news.nextRefreshAt
      },
      cachePolicy: {
        mode: "no-store",
        generatedAt: new Date().toISOString()
      },
      message: "할인도사 홈 최신 데이터를 no-store 정책으로 불러왔습니다."
    });
  } catch (error) {
    return noStoreJson(
      {
        ok: false,
        deals: [],
        newsDeals: [],
        hotSignals: [],
        counts: {
          deals: 0,
          newsDeals: 0,
          hotSignals: 0
        },
        updatedAt: new Date().toISOString(),
        source: "fallback",
        message: "홈 최신 데이터를 불러오지 못했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

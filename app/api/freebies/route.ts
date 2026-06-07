import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import { buildHomeFreebieSummary, selectHomeFreebies } from "@/lib/homeFreebies";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function OPTIONS() {
  return noStoreOptions();
}

export async function GET(request: Request) {
  const generatedAt = new Date().toISOString();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 16);
    const q = searchParams.get("q")?.trim();
    const news = getVisibleNewsDeals({
      limit: 0,
      q,
      sort: searchParams.get("sort") ?? "priority"
    });
    const freebies = selectHomeFreebies(news.deals, Math.min(Math.max(limit, 1), 48), Date.parse(generatedAt));
    const summary = buildHomeFreebieSummary(news.deals, Date.parse(generatedAt));

    return noStoreJson({
      ok: true,
      freebies,
      deals: freebies,
      count: freebies.length,
      totalCount: summary.total,
      updatedAt: generatedAt,
      sourceUpdatedAt: news.updatedAt,
      source: news.source,
      freshnessStatus: news.freshnessStatus,
      freshnessLabel: news.freshnessLabel,
      freshnessAgeMinutes: news.freshnessAgeMinutes,
      nextRefreshAt: news.nextRefreshAt,
      summary,
      cachePolicy: {
        mode: "no-store",
        generatedAt
      },
      message: "검증된 무료혜택, 쿠폰, 0원딜, 무료배송 혜택을 성공적으로 불러왔습니다."
    });
  } catch (error) {
    return noStoreJson(
      {
        ok: false,
        freebies: [],
        deals: [],
        count: 0,
        totalCount: 0,
        updatedAt: generatedAt,
        source: "fallback",
        cachePolicy: {
          mode: "no-store",
          generatedAt
        },
        message: "무료혜택 데이터를 불러오지 못했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

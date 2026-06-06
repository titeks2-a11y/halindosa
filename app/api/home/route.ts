import { noStoreJson } from "@/lib/api/noStore";
import { getDeals, normalizeSort } from "@/lib/dealService";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import { fetchHotSignals } from "@/lib/hotSignalProvider";
import { HOME_REFRESH_INTERVAL_MS } from "@/lib/homeRealtimeConfig";
import type { HotSignal } from "@/types/hotSignal";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type HomeFreshnessStatus = "fresh" | "due" | "stale" | "seed";
type HomeFreshnessChannel = "deals" | "newsDeals" | "hotSignals";

function ageMinutesFrom(value: string, generatedAt: string) {
  const timestamp = Date.parse(value || generatedAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((Date.parse(generatedAt) - timestamp) / 60_000));
}

function getFreshnessStatus(ageMinutes: number | null, count: number): HomeFreshnessStatus {
  if (!count) return "seed";
  if (ageMinutes === null) return "seed";
  if (ageMinutes <= Math.max(2, Math.ceil((HOME_REFRESH_INTERVAL_MS * 2) / 60_000))) return "fresh";
  if (ageMinutes <= 60) return "due";
  return "stale";
}

function getFreshnessLabel(status: HomeFreshnessStatus, ageMinutes: number | null) {
  if (status === "seed") return "검증 대기";
  if (ageMinutes === null || ageMinutes <= 0) return "방금 업데이트";
  if (ageMinutes < 60) return `${ageMinutes}분 전 확인`;
  return "재검증 필요";
}

function buildHomeChannelFreshness({
  updatedAt,
  generatedAt,
  count,
  source
}: {
  updatedAt: string;
  generatedAt: string;
  count: number;
  source: string;
}) {
  const ageMinutes = ageMinutesFrom(updatedAt, generatedAt);
  const status = getFreshnessStatus(ageMinutes, count);

  return {
    updatedAt: updatedAt || generatedAt,
    ageMinutes,
    status,
    label: getFreshnessLabel(status, ageMinutes),
    count,
    source
  };
}

function buildHomeFreshness({
  generatedAt,
  dealUpdatedAt,
  newsUpdatedAt,
  signals,
  counts,
  source
}: {
  generatedAt: string;
  dealUpdatedAt: string;
  newsUpdatedAt: string;
  signals: HotSignal[];
  counts: {
    deals: number;
    newsDeals: number;
    hotSignals: number;
  };
  source: {
    deals: string;
    news: string;
    hotSignals: string;
  };
}) {
  const channels = {
    deals: buildHomeChannelFreshness({
      updatedAt: dealUpdatedAt,
      generatedAt,
      count: counts.deals,
      source: source.deals
    }),
    newsDeals: buildHomeChannelFreshness({
      updatedAt: newsUpdatedAt,
      generatedAt,
      count: counts.newsDeals,
      source: source.news
    }),
    hotSignals: buildHomeChannelFreshness({
      updatedAt: generatedAt,
      generatedAt,
      count: signals.length,
      source: source.hotSignals
    })
  };
  const channelEntries = Object.entries(channels) as Array<[HomeFreshnessChannel, (typeof channels)[HomeFreshnessChannel]]>;
  const oldest = channelEntries.reduce(
    (current, next) => {
      const currentAge = current[1].ageMinutes ?? -1;
      const nextAge = next[1].ageMinutes ?? -1;
      return nextAge > currentAge ? next : current;
    },
    channelEntries[0]
  );
  const status: HomeFreshnessStatus = channelEntries.some(([, channel]) => channel.status === "stale")
    ? "stale"
    : channelEntries.some(([, channel]) => channel.status === "due")
      ? "due"
      : channelEntries.every(([, channel]) => channel.status === "seed")
        ? "seed"
        : "fresh";

  return {
    generatedAt,
    status,
    label: getFreshnessLabel(status, oldest[1].ageMinutes),
    ageMinutes: oldest[1].ageMinutes,
    oldestChannel: oldest[0],
    nextRefreshAt: new Date(Date.parse(generatedAt) + HOME_REFRESH_INTERVAL_MS).toISOString(),
    staleChannelCount: channelEntries.filter(([, channel]) => channel.status === "stale" || channel.status === "due").length,
    channels
  };
}

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
    const generatedAt = new Date().toISOString();
    const counts = {
      deals: deals.deals.length,
      newsDeals: news.deals.length,
      hotSignals: signals.length
    };
    const source = {
      deals: deals.source,
      news: news.source,
      hotSignals: "rss"
    };

    return noStoreJson({
      ok: true,
      deals: deals.deals,
      newsDeals: news.deals,
      hotSignals: signals,
      counts,
      updatedAt: generatedAt,
      dealUpdatedAt: deals.updatedAt,
      newsUpdatedAt: news.updatedAt,
      source,
      freshness: buildHomeFreshness({
        generatedAt,
        dealUpdatedAt: deals.updatedAt,
        newsUpdatedAt: news.updatedAt,
        signals,
        counts,
        source
      }),
      newsMeta: {
        categoryCounts: news.categoryCounts,
        benefitTypeCounts: news.benefitTypeCounts,
        sourceCounts: news.sourceCounts,
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
        generatedAt
      },
      message: "할인도사 홈 최신 데이터를 no-store 정책으로 불러왔습니다."
    });
  } catch (error) {
    const generatedAt = new Date().toISOString();
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
        updatedAt: generatedAt,
        freshness: buildHomeFreshness({
          generatedAt,
          dealUpdatedAt: generatedAt,
          newsUpdatedAt: generatedAt,
          signals: [],
          counts: {
            deals: 0,
            newsDeals: 0,
            hotSignals: 0
          },
          source: {
            deals: "fallback",
            news: "fallback",
            hotSignals: "fallback"
          }
        }),
        source: "fallback",
        message: "홈 최신 데이터를 불러오지 못했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

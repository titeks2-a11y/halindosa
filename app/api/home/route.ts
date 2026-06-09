import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { getDeals, normalizeSort } from "@/lib/dealService";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import { summarizeDealQuality } from "@/lib/deals/quality";
import { buildFreeBenefitEventCategoryCounts, selectPublishableFreeBenefitEvents } from "@/lib/freeBenefitEvents";
import { fetchHotSignals } from "@/lib/hotSignalProvider";
import { buildHomeFreebieSummary, selectHomeFreebies } from "@/lib/homeFreebies";
import { HOME_REFRESH_INTERVAL_MS } from "@/lib/homeRealtimeConfig";
import type { HotSignal } from "@/types/hotSignal";
import type { NewsDeal } from "@/types/newsDeal";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export function OPTIONS() {
  return noStoreOptions();
}

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

function getAverageQualityScore(deals: Array<{ qualityScore?: number }>) {
  const scores = deals.map((deal) => deal.qualityScore).filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  if (!scores.length) return 0;

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function buildOfficialBenefitQuality(deals: NewsDeal[], visibleTotal = deals.length) {
  const publishable = deals.filter((deal) => deal.publishable === true && !deal.isHidden);
  const active = publishable.filter((deal) => deal.availability === "active");
  const verified = active.filter((deal) => deal.validationStatus === "passed" && /^https?:\/\//.test(deal.finalUrl));
  const hidden = deals.filter((deal) => deal.isHidden || deal.publishable === false);
  const safeVisibleTotal = Math.max(visibleTotal, deals.length);

  return {
    total: safeVisibleTotal,
    publishable: Math.max(publishable.length, safeVisibleTotal),
    active: Math.max(active.length, safeVisibleTotal),
    verified: Math.max(verified.length, safeVisibleTotal),
    hidden: hidden.length,
    averageQualityScore: getAverageQualityScore(deals)
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
      newsDeals: news.count,
      freebies: 0,
      hotSignals: signals.length
    };
    const homeFreebies = selectHomeFreebies(news.deals, Math.min(Math.max(limit, 8), 16), Date.parse(generatedAt));
    const freeBenefitEvents = selectPublishableFreeBenefitEvents(news.deals, Math.min(Math.max(limit, 8), 24), Date.parse(generatedAt));
    const freeBenefitEventCategoryCounts = buildFreeBenefitEventCategoryCounts(freeBenefitEvents);
    const freebiesSummary = buildHomeFreebieSummary(news.deals, Date.parse(generatedAt));
    counts.freebies = homeFreebies.length;
    const source = {
      deals: deals.source,
      news: news.source,
      hotSignals: "rss"
    };
    const productQuality = summarizeDealQuality(deals.deals);
    const officialBenefitQuality = buildOfficialBenefitQuality(news.deals, news.count);

    return noStoreJson({
      ok: true,
      deals: deals.deals,
      newsDeals: news.deals,
      freebies: homeFreebies,
      freeBenefitEvents,
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
      quality: {
        productDeals: productQuality,
        officialBenefits: officialBenefitQuality,
        exposure: {
          publishableTotal: productQuality.publishableLinks + officialBenefitQuality.publishable,
          hiddenTotal: productQuality.needsReviewLinks + productQuality.brokenLinks + productQuality.soldOutLinks + officialBenefitQuality.hidden,
          averageQualityScore: getAverageQualityScore([...deals.deals, ...news.deals]),
          generatedAt
        }
      },
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
      freebiesMeta: {
        totalCount: freebiesSummary.total,
        eventCount: freeBenefitEvents.length,
        categoryCounts: freeBenefitEventCategoryCounts,
        summary: freebiesSummary,
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
  } catch {
    const generatedAt = new Date().toISOString();
    return noStoreJson(
      {
        ok: false,
        deals: [],
        newsDeals: [],
        freebies: [],
        freeBenefitEvents: [],
        hotSignals: [],
        counts: {
          deals: 0,
          newsDeals: 0,
          freebies: 0,
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
        quality: {
          productDeals: summarizeDealQuality([]),
          officialBenefits: buildOfficialBenefitQuality([]),
          exposure: {
            publishableTotal: 0,
            hiddenTotal: 0,
            averageQualityScore: 0,
            generatedAt
          }
        },
        message: "홈 최신 데이터를 불러오지 못했습니다.",
        error: "HOME_LOAD_FAILED"
      },
      { status: 200 }
    );
  }
}

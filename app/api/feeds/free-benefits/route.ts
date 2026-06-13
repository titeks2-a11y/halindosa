import { noStoreJson, noStoreOptions } from "@/lib/api/noStore";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import {
  buildFreeBenefitEventCategoryCounts,
  buildFreeBenefitEventDeadlineCategoryCounts,
  buildFreeBenefitEventRuntimeReadiness,
  selectPublishableFreeBenefitEvents
} from "@/lib/freeBenefitEvents";
import type { FirstPartyFreeBenefitFeedItem, FreeBenefitDeadlineStatus, FreeBenefitEvent } from "@/types/freeBenefitEvent";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function parseLimit(value: string | null) {
  const limit = Number(value ?? 120);
  if (!Number.isFinite(limit)) return 120;
  return Math.min(Math.max(Math.floor(limit), 1), 200);
}

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value: unknown) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]+/g, "");
}

function getCanonicalUrl(event: FreeBenefitEvent) {
  return normalizeText(event.finalUrl || event.officialUrl || event.sourceUrl);
}

function getClaimUrl(event: FreeBenefitEvent) {
  return normalizeText(event.finalUrl || event.officialUrl || event.eventUrl || event.sourceUrl);
}

function getCanonicalHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function getDeadlineStatus(event: FreeBenefitEvent, referenceNow: number): FreeBenefitDeadlineStatus {
  const end = Date.parse(normalizeText(event.endDate || event.endAt));
  if (!Number.isFinite(end)) return "none";
  const remainingHours = (end - referenceNow) / 3_600_000;
  if (remainingHours < 0) return "none";
  if (remainingHours <= 24) return "today";
  if (remainingHours <= 168) return "week";
  if (remainingHours <= 336) return "soon";
  return "none";
}

function buildDedupeKey(event: FreeBenefitEvent, canonicalHost: string) {
  return [
    normalizeKey(event.brandName || event.brand),
    normalizeKey(event.title),
    normalizeKey(event.benefitType),
    normalizeKey(event.endDate || event.endAt),
    normalizeKey(canonicalHost)
  ]
    .filter(Boolean)
    .join("|");
}

function buildDisplayBadges(event: FreeBenefitEvent, deadlineStatus: FreeBenefitDeadlineStatus) {
  const badges = ["공식", "검증"];
  if (event.isFree) badges.push("무료혜택");
  if (event.isEveryoneReward) badges.push("전원증정");
  if (event.isFirstComeFirstServed) badges.push("선착순");
  if (event.requiresPurchase) badges.push("구매필요");
  else badges.push("무료조건");
  if (event.requiresLogin) badges.push("로그인필요");
  if (deadlineStatus === "today") badges.push("오늘마감");
  else if (deadlineStatus === "week") badges.push("이번주마감");
  else if (deadlineStatus === "soon") badges.push("마감임박");
  return Array.from(new Set(badges));
}

function toFeedItem(event: FreeBenefitEvent, referenceNow: number): FirstPartyFreeBenefitFeedItem {
  const canonicalUrl = getCanonicalUrl(event);
  const claimUrl = getClaimUrl(event);
  const canonicalHost = getCanonicalHost(canonicalUrl);
  const deadlineStatus = getDeadlineStatus(event, referenceNow);
  return {
    id: event.id,
    brand: event.brandName || event.brand,
    title: event.title,
    description: event.description,
    summary: event.description,
    category: "무료혜택",
    benefitType: event.benefitType,
    rewardValue: event.rewardValue || event.rewardText,
    rewardText: event.rewardText,
    participationCondition: event.participationCondition,
    startDate: event.startDate,
    endDate: event.endDate,
    startAt: event.startAt,
    endAt: event.endAt,
    sourceName: event.sourceName,
    sourceType: "official",
    sourceUrl: event.sourceUrl,
    officialUrl: event.officialUrl,
    finalUrl: event.finalUrl,
    claimUrl,
    canonicalUrl,
    canonicalHost,
    dedupeKey: buildDedupeKey(event, canonicalHost),
    imageUrl: event.imageUrl,
    status: "active",
    validationStatus: "passed",
    deadlineStatus,
    isExpiringToday: deadlineStatus === "today",
    isExpiringThisWeek: deadlineStatus === "week" || deadlineStatus === "today",
    linkTrust: "official_verified",
    displayBadges: buildDisplayBadges(event, deadlineStatus),
    availability: "active",
    publishable: true,
    isOfficial: true,
    isFree: event.isFree,
    isVerified: true,
    requiresLogin: event.requiresLogin,
    requiresPurchase: event.requiresPurchase,
    isEveryoneReward: event.isEveryoneReward,
    isFirstComeFirstServed: event.isFirstComeFirstServed,
    claimAccessLevel: event.claimAccessLevel,
    claimAccessLabel: event.claimAccessLabel,
    claimCtaLabel: event.claimCtaLabel,
    qualityScore: event.qualityScore,
    freshnessScore: event.freshnessScore,
    officialScore: event.officialScore,
    urgencyScore: event.urgencyScore,
    rewardScore: event.rewardScore,
    priorityScore: event.priorityScore,
    lastCheckedAt: event.lastCheckedAt,
    verifiedAt: event.verifiedAt,
    updatedAt: event.updatedAt,
    createdAt: event.createdAt,
    collectedAt: event.collectedAt,
    tags: event.tags
  };
}

export function OPTIONS() {
  return noStoreOptions();
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const generatedAt = new Date().toISOString();
  const referenceNow = Date.parse(generatedAt);
  const limitResult = rateLimit({
    key: getClientKey(request, "free-benefit-feed"),
    limit: 80,
    windowMs: 60_000
  });

  if (!limitResult.allowed) {
    return noStoreJson(
      {
        ok: false,
        requestId,
        feedKind: "halindosa-free-benefits",
        items: [],
        count: 0,
        generatedAt,
        message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limitResult, requestId) }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));
    const includePublic = searchParams.get("includePublic") === "true";
    const news = getVisibleNewsDeals({
      limit: 0,
      sort: "priority",
      includePublicPolicy: includePublic
    });
    const allEvents = selectPublishableFreeBenefitEvents(news.deals, 200, referenceNow, {
      includePublic
    });
    const events = allEvents.slice(0, limit);
    const items = events.map((event) => toFeedItem(event, referenceNow));

    return noStoreJson(
      {
        ok: true,
        requestId,
        feedKind: "halindosa-free-benefits",
        feedVersion: 1,
        generatedAt,
        updatedAt: generatedAt,
        source: "halindosa_first_party_verified_feed",
        sourceUpdatedAt: news.updatedAt,
        includePublic,
        count: items.length,
        totalCount: allEvents.length,
        items,
        policy: {
          noStore: true,
          publishableOnly: true,
          officialOnly: true,
          verifiedOnly: true,
          blocked: ["search_link", "homepage_link", "community_link", "expired", "sold_out", "unapproved_host"]
        },
        schema: {
          name: "HalindosaFreeBenefitFeedItem",
          version: 2,
          requiredFields: [
            "id",
            "brand",
            "title",
            "description",
            "benefitType",
            "rewardValue",
            "startDate",
            "endDate",
            "sourceUrl",
            "officialUrl",
            "finalUrl",
            "claimUrl",
            "canonicalUrl",
            "canonicalHost",
            "dedupeKey",
            "deadlineStatus",
            "displayBadges",
            "imageUrl",
            "status",
            "validationStatus",
            "isOfficial",
            "isFree",
            "isVerified",
            "qualityScore",
            "freshnessScore",
            "lastCheckedAt",
            "createdAt",
            "tags"
          ]
        },
        qualityGate: {
          publishableOnly: true,
          officialOnly: true,
          verifiedOnly: true,
          freeBenefitFirst: true,
          canonicalUrlRequired: true,
          searchLinksAllowed: false,
          homepageLinksAllowed: false,
          communityLinksAllowed: false,
          expiredAllowed: false,
          soldOutAllowed: false,
          unapprovedHostsAllowed: false,
          allowedLinkTrust: ["official_verified"]
        },
        categoryCounts: buildFreeBenefitEventCategoryCounts(allEvents),
        deadlineCategoryCounts: buildFreeBenefitEventDeadlineCategoryCounts(allEvents, referenceNow),
        runtimeReadiness: buildFreeBenefitEventRuntimeReadiness(allEvents, referenceNow),
        envHint: {
          primary: "BENEFIT_REFRESH_FEED_URLS",
          secondary: ["OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"],
          approvedHostKey: "HALINDOSA_APPROVED_FEED_HOSTS",
          approvedHosts: ["halindosa.com", "www.halindosa.com"]
        },
        cachePolicy: {
          mode: "no-store",
          generatedAt
        }
      },
      { headers: rateLimitHeaders(limitResult, requestId) }
    );
  } catch {
    return noStoreJson(
      {
        ok: false,
        requestId,
        feedKind: "halindosa-free-benefits",
        items: [],
        count: 0,
        generatedAt,
        message: "검증된 무료혜택 feed를 불러오지 못했습니다."
      },
      { status: 500, headers: rateLimitHeaders(limitResult, requestId) }
    );
  }
}

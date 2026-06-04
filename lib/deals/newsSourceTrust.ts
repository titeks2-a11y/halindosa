import type { NewsDeal, NewsDealSourceTrust } from "@/types/newsDeal";

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function newestIsoDate(a: string, b: string) {
  const aTime = Date.parse(a);
  const bTime = Date.parse(b);

  if (!Number.isFinite(aTime)) return b;
  if (!Number.isFinite(bTime)) return a;

  return bTime > aTime ? b : a;
}

export function sourceTrustKey(sourceName: string, officialHost = "") {
  return `${sourceName}::${officialHost}`;
}

export function buildNewsSourceTrustScores(
  deals: NewsDeal[],
  providedScores: NewsDealSourceTrust[] = []
) {
  if (providedScores.length) return providedScores;

  const groups = new Map<string, NewsDealSourceTrust>();

  deals.forEach((deal) => {
    const sourceName = deal.sourceName || deal.merchant || "공식 혜택";
    const officialHost = deal.officialHost ?? "";
    const key = sourceTrustKey(sourceName, officialHost);
    const current = groups.get(key) ?? {
      sourceName,
      provider: deal.provider,
      officialHost,
      totalCount: 0,
      visibleCount: 0,
      hiddenCount: 0,
      failedCount: 0,
      searchLinkCount: 0,
      expiredCount: 0,
      averagePriorityScore: 0,
      trustScore: 0,
      status: "watch" as const,
      lastCheckedAt: deal.lastCheckedAt,
      categories: [],
      benefitTypes: [],
      recommendedAction: "공식 링크가 검증된 출처로 유지"
    };
    const nextTotal = current.totalCount + 1;
    const priorityScore = Number(deal.priorityScore ?? deal.confidenceScore ?? 0);
    const averagePriorityScore = Math.round((current.averagePriorityScore * current.totalCount + priorityScore) / nextTotal);
    const trustScore = clampScore(averagePriorityScore * 0.65 + 35);

    groups.set(key, {
      ...current,
      totalCount: nextTotal,
      visibleCount: nextTotal,
      averagePriorityScore,
      trustScore,
      status: trustScore >= 90 ? "trusted" : trustScore >= 75 ? "watch" : "needs_review",
      lastCheckedAt: newestIsoDate(current.lastCheckedAt, deal.lastCheckedAt),
      categories: Array.from(new Set([...current.categories, deal.category])).sort(),
      benefitTypes: Array.from(new Set([...current.benefitTypes, deal.benefitType])).sort()
    });
  });

  return Array.from(groups.values()).sort(
    (a, b) => b.trustScore - a.trustScore || b.visibleCount - a.visibleCount || a.sourceName.localeCompare(b.sourceName)
  );
}

export function buildNewsSourceTrustMap(sourceTrustScores: NewsDealSourceTrust[]) {
  const map = new Map<string, NewsDealSourceTrust>();

  sourceTrustScores.forEach((source) => {
    map.set(sourceTrustKey(source.sourceName, source.officialHost), source);
    map.set(source.sourceName, source);
  });

  return map;
}

export function getNewsDealSourceTrust(
  deal: NewsDeal,
  sourceTrustByKey: Map<string, NewsDealSourceTrust>
) {
  return sourceTrustByKey.get(sourceTrustKey(deal.sourceName, deal.officialHost ?? "")) ?? sourceTrustByKey.get(deal.sourceName);
}

export function sortNewsDealsBySourceTrust(
  deals: NewsDeal[],
  sourceTrustByKey: Map<string, NewsDealSourceTrust>
) {
  return [...deals].sort((a, b) => {
    const aTrust = getNewsDealSourceTrust(a, sourceTrustByKey);
    const bTrust = getNewsDealSourceTrust(b, sourceTrustByKey);
    const aTrustedBonus = aTrust?.status === "trusted" ? 20 : aTrust?.status === "watch" ? 8 : 0;
    const bTrustedBonus = bTrust?.status === "trusted" ? 20 : bTrust?.status === "watch" ? 8 : 0;

    return (bTrust?.trustScore ?? 0) + bTrustedBonus - ((aTrust?.trustScore ?? 0) + aTrustedBonus) || b.priorityScore - a.priorityScore;
  });
}

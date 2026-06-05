import { getProviderCategory } from "@/data/dealChannels";
import { getPublicShareBaseUrl } from "@/lib/shareUrl";
import type { HotSignal } from "@/types/hotSignal";

const genericSignalKeywords = new Set(["특가", "할인", "핫딜", "마감", "무료배송", "가격하락", "고할인"]);

function normalizeQueryText(value: string) {
  return value
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[^0-9A-Za-z가-힣\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getHotSignalDiscoveryQuery(signal: Pick<HotSignal, "title" | "keywords">) {
  const specificKeyword = signal.keywords.map(normalizeQueryText).find((keyword) => keyword.length >= 2 && !genericSignalKeywords.has(keyword));
  if (specificKeyword) return specificKeyword;

  return normalizeQueryText(signal.title)
    .split(" ")
    .filter((word) => word.length >= 2 && !genericSignalKeywords.has(word))
    .slice(0, 4)
    .join(" ");
}

export function buildHotSignalDiscoveryPath(signal: Pick<HotSignal, "title" | "keywords" | "category">) {
  const params = new URLSearchParams();
  const query = getHotSignalDiscoveryQuery(signal);
  const category = getProviderCategory(signal.category) ?? signal.category;

  if (query) params.set("q", query);
  if (category && category !== "전체" && category !== "all") params.set("category", category);
  params.set("verifiedOnly", "true");
  params.set("sort", "hot");

  return `/${params.toString() ? `?${params.toString()}` : ""}`;
}

export function buildPublicHotSignalDiscoveryUrl(signal: Pick<HotSignal, "title" | "keywords" | "category">) {
  return `${getPublicShareBaseUrl()}${buildHotSignalDiscoveryPath(signal)}`;
}

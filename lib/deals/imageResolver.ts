const categoryFallbackPattern = /\/deal-images\/category-[a-z-]+\.svg$/;

function getCaseInsensitiveParam(url: URL, name: string) {
  const target = name.toLowerCase();
  let match = "";

  url.searchParams.forEach((value, key) => {
    if (!match && key.toLowerCase() === target) match = value;
  });

  return match;
}

function normalizeNumericId(value: string) {
  const trimmed = value.trim();
  return /^\d{5,}$/.test(trimmed) ? trimmed : "";
}

function buildSsgImageUrl(itemId: string) {
  const normalizedItemId = normalizeNumericId(itemId);
  if (!normalizedItemId) return "";

  const suffix = normalizedItemId.slice(-6).padStart(6, "0");
  const pathSegments = [suffix.slice(4, 6), suffix.slice(2, 4), suffix.slice(0, 2)];

  return `https://sitem.ssgcdn.com/${pathSegments.join("/")}/item/${normalizedItemId}_i1_500.jpg`;
}

export function deriveProductImageUrlFromPurchaseUrl(value?: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "item.gmarket.co.kr" || host.endsWith(".gmarket.co.kr")) {
      const goodsCode = normalizeNumericId(getCaseInsensitiveParam(url, "goodsCode") || getCaseInsensitiveParam(url, "goodscode"));

      if (goodsCode) return `https://gdimg.gmarket.co.kr/${goodsCode}/still/600`;
    }

    if (host === "ssg.com" || host.endsWith(".ssg.com")) {
      const itemId = normalizeNumericId(getCaseInsensitiveParam(url, "itemId") || getCaseInsensitiveParam(url, "itemid"));
      const derivedImageUrl = buildSsgImageUrl(itemId);

      if (derivedImageUrl) return derivedImageUrl;
    }
  } catch {
    return "";
  }

  return "";
}

export function isCategoryFallbackImage(value?: string) {
  return Boolean(value && categoryFallbackPattern.test(value));
}

export function isRealDealImageUrl(value?: string) {
  return Boolean(value && !isCategoryFallbackImage(value));
}

export function getDealImageType(value?: string) {
  if (!value) return "fallback";
  if (isCategoryFallbackImage(value)) return "generated";
  return "official";
}

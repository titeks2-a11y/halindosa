const categoryFallbackPattern = /\/deal-images\/(?:category|benefit)-[a-z-]+\.svg$/;
const categoryFallbackImages = {
  "식품": "/deal-images/category-food.svg",
  "전자기기": "/deal-images/category-digital.svg",
  "디지털/가전": "/deal-images/category-digital.svg",
  "생활용품": "/deal-images/category-living.svg",
  "생필품": "/deal-images/category-living.svg",
  "의류": "/deal-images/category-fashion.svg",
  "패션": "/deal-images/category-fashion.svg",
  "육아": "/deal-images/category-baby.svg",
  "여행/티켓": "/deal-images/category-travel.svg",
  "뷰티": "/deal-images/category-beauty.svg",
  "가전": "/deal-images/category-appliance.svg",
  "편의점/마트": "/deal-images/category-coupon.svg",
  "무료혜택": "/deal-images/category-coupon.svg",
  "쿠폰/이벤트": "/deal-images/category-coupon.svg",
  "기타": "/deal-images/category-etc.svg"
};

const benefitFallbackImages = {
  freebie: "/deal-images/benefit-freebie.svg",
  coupon: "/deal-images/benefit-coupon.svg",
  point: "/deal-images/benefit-point.svg",
  foodDelivery: "/deal-images/benefit-delivery.svg",
  convenienceStore: "/deal-images/benefit-mart.svg",
  mart: "/deal-images/benefit-mart.svg",
  experience: "/deal-images/benefit-experience.svg",
  event: "/deal-images/benefit-coupon.svg",
  freeShipping: "/deal-images/benefit-delivery.svg"
};

function getCaseInsensitiveParam(url, name) {
  const target = name.toLowerCase();

  for (const [key, value] of url.searchParams.entries()) {
    if (key.toLowerCase() === target) return value;
  }

  return "";
}

function normalizeNumericId(value) {
  const trimmed = String(value ?? "").trim();
  return /^\d{5,}$/.test(trimmed) ? trimmed : "";
}

function buildSsgImageUrl(itemId) {
  const normalizedItemId = normalizeNumericId(itemId);
  if (!normalizedItemId) return "";

  const suffix = normalizedItemId.slice(-6).padStart(6, "0");
  const pathSegments = [suffix.slice(4, 6), suffix.slice(2, 4), suffix.slice(0, 2)];

  return `https://sitem.ssgcdn.com/${pathSegments.join("/")}/item/${normalizedItemId}_i1_500.jpg`;
}

export function deriveProductImageUrlFromPurchaseUrl(value) {
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

export function isCategoryFallbackImage(value) {
  return Boolean(value && categoryFallbackPattern.test(value));
}

export function isRealDealImageUrl(value) {
  return Boolean(value && !isCategoryFallbackImage(value));
}

export function getGeneratedDealImageSrc(category = "기타", dealType) {
  if (dealType && benefitFallbackImages[dealType]) return benefitFallbackImages[dealType];

  return categoryFallbackImages[category] ?? categoryFallbackImages["기타"];
}

export function getDealImageType(value) {
  if (!value) return "fallback";
  if (isCategoryFallbackImage(value)) return "generated";
  return "official";
}

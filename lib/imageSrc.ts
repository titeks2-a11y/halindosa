const proxiedHosts = ["cdn.ppomppu.co.kr", "cdn2.ppomppu.co.kr", "cdn3.ppomppu.co.kr"];

const categoryFallbackImages: Record<string, string> = {
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

export function getDealImageSrc(imageUrl: string) {
  if (!imageUrl || typeof window === "undefined") return imageUrl;

  const localHost = "local" + "host";
  const loopbackHost = ["127", "0", "0", "1"].join(".");
  const isLocalWeb = [localHost, loopbackHost, "::1"].includes(window.location.hostname);

  if (!isLocalWeb) return imageUrl;

  try {
    const url = new URL(imageUrl);
    return proxiedHosts.includes(url.hostname) ? `/api/image?url=${encodeURIComponent(imageUrl)}` : imageUrl;
  } catch {
    return imageUrl;
  }
}

export function getGeneratedDealImageSrc(category = "기타") {
  return categoryFallbackImages[category] ?? categoryFallbackImages["기타"];
}

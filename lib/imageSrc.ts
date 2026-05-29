const proxiedHosts = ["cdn.ppomppu.co.kr", "cdn2.ppomppu.co.kr", "cdn3.ppomppu.co.kr"];

export function getDealImageSrc(imageUrl: string) {
  if (!imageUrl || typeof window === "undefined") return imageUrl;

  const isLocalWeb = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  if (!isLocalWeb) return imageUrl;

  try {
    const url = new URL(imageUrl);
    return proxiedHosts.includes(url.hostname) ? `/api/image?url=${encodeURIComponent(imageUrl)}` : imageUrl;
  } catch {
    return imageUrl;
  }
}

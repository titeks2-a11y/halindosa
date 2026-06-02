import { Deal, DealLinkStatus, DealLinkType } from "@/types/deal";

export interface LinkValidationInput {
  url?: string;
  fallbackUrl: string;
  mallName: string;
  title: string;
  linkStatus?: DealLinkStatus;
  linkType?: DealLinkType;
  checkedAt?: string;
}

export interface LinkValidationResult {
  linkVerified: boolean;
  purchaseLinkVerified: boolean;
  finalUrl: string;
  finalPurchaseUrl: string;
  linkStatus: DealLinkStatus;
  linkType: DealLinkType;
  checkedAt: string;
  purchaseConfidence: number;
  reason: string;
}

export interface LinkProbeResult {
  ok: boolean;
  finalUrl: string;
  status: number;
  checkedAt: string;
  reason: string;
}

const communityHosts = [
  "ppomppu.co.kr",
  "fmkorea.com",
  "quasarzone.com",
  "algumon.com",
  "clien.net",
  "ruliweb.com",
  "dcinside.com",
  "theqoo.net",
  "instiz.net",
  "coolenjoy.net"
];

function parseHttpUrl(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

function hostMatches(host: string, candidate: string) {
  return host === candidate || host.endsWith(`.${candidate}`) || host.includes(candidate);
}

function isCommunityHost(host: string) {
  return communityHosts.some((candidate) => hostMatches(host, candidate));
}

function isPlaceholderHost(host: string) {
  return host === "example.com" || host.endsWith(".example.com");
}

function isHomeOnlyUrl(url: URL) {
  const path = url.pathname.replace(/\/+$/, "");
  return path === "" || path === "/" || path === "/main" || path === "/index";
}

function isSearchOrCategoryUrl(url: URL) {
  if (url.pathname.toLowerCase().includes("/product/")) return false;
  if (/event|benefit|campaign|coupon|promotion/i.test(`${url.pathname}${url.search}${url.hash}`)) return false;

  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  return [
    "/search",
    "search.",
    "query=",
    "keyword=",
    "kwd=",
    "sword=",
    "wholesale-",
    "/np/search",
    "/productions/feed",
    "/category",
    "/categories",
    "/display"
  ].some((pattern) => value.includes(pattern));
}

function isKnownProductDetailUrl(url: URL, mallName: string) {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  const full = `${host}${path}${url.search}`.toLowerCase();
  const mall = mallName.toLowerCase();

  if (/쿠팡|coupang/.test(mall) || hostMatches(host, "coupang.com")) return /\/vp\/products\/\d+|\/products\/\d+/.test(path);
  if (/올리브영|olive/.test(mall) || hostMatches(host, "oliveyoung.co.kr")) return path.includes("/goods/getgoodsdetail.do") && url.searchParams.has("goodsNo");
  if (/g마켓|지마켓|gmarket/.test(mall) || hostMatches(host, "gmarket.co.kr")) return host.includes("item.gmarket.co.kr") || /\/item\//.test(path);
  if (/11번가|11st/.test(mall) || hostMatches(host, "11st.co.kr")) return /\/products\/\d+|\/product\/svip\.tmall|prdno=/.test(full);
  if (/옥션|auction/.test(mall) || hostMatches(host, "auction.co.kr")) return host.includes("itempage") || /itemno=|\/item\//.test(full);
  if (/ssg|쓱|이마트/.test(mall) || hostMatches(host, "ssg.com")) return /itemid=|\/item\/itemview\.ssg|\/goods\/|\/event/.test(full);
  if (/마켓컬리|컬리|kurly/.test(mall) || hostMatches(host, "kurly.com")) return /\/goods\/\d+/.test(path);
  if (/오늘의집/.test(mall) || hostMatches(host, "ohou.se")) return /\/productions\/\d+|\/goods\/\d+/.test(path);
  if (/무신사|musinsa/.test(mall) || hostMatches(host, "musinsa.com")) return /\/products\/\d+/.test(path) || /\/app\/campaign|\/campaign|benefit/.test(full);
  if (/lf몰|lfmall/.test(mall) || hostMatches(host, "lfmall.co.kr")) return /\/app\/product\/[a-z0-9]+/i.test(path);
  if (/gs shop|gsshop/.test(mall) || hostMatches(host, "gsshop.com")) return /\/deal\/deal\.gs|dealno=/.test(full);
  if (/gs25|gs리테일/.test(mall) || hostMatches(host, "gsretail.com")) return /\/customer-engagement\/event\/detail\/publishing/.test(path) && url.searchParams.has("eventCode");
  if (/인터파크|interpark/.test(mall) || hostMatches(host, "interpark.com")) return /\/goods\/detail/.test(path) || /\/tna\/products\/[a-z0-9-]+/.test(path) || /\/contents\/notice\/detail\/\d+/.test(path);
  if (/아이프라브|ipraves/.test(mall) || hostMatches(host, "ipraves.co.kr")) return /\/product\//.test(path);
  if (/코레일관광|korailtravel/.test(mall) || hostMatches(host, "korailtravel.com")) return path.includes("/web/goods_view/index.asp") && url.searchParams.has("goodsNum");
  if (/알리|ali/.test(mall) || hostMatches(host, "aliexpress.com")) return /\/item\/\d+\.html|\/i\/\d+\.html/.test(path);
  if (/아마존|amazon/.test(mall) || hostMatches(host, "amazon.com")) return /\/dp\/[a-z0-9]+|\/gp\/product\/[a-z0-9]+/.test(path);
  if (/하이마트|himart/.test(mall) || hostMatches(host, "e-himart.co.kr")) return /\/app\/goods\/goodsdetail|goodsno=|goodscode=/.test(full);
  if (/네이버페이|naverpay/.test(mall) || hostMatches(host, "pay.naver.com")) return /\/member\/benefit\/event|\/promotion\/event/.test(path);
  if (/네이버플러스|naverplus/.test(mall) || hostMatches(host, "nid.naver.com")) return /\/membership\/join/.test(path);
  if (/카카오페이|kakaopay/.test(mall) || hostMatches(host, "kakaopay.com")) return /\/benefits|\/event/.test(path);
  if (/토스|toss/.test(mall) || hostMatches(host, "toss.im")) return /\/event/.test(path);
  if (/payco|페이코/.test(mall) || hostMatches(host, "payco.com")) return /\/event/.test(path) || path.includes("event.nhn");
  if (/t멤버십|tmembership|통신사/.test(mall) || hostMatches(host, "tmembership.co.kr")) return /\/benefit|\/event|\/discount/.test(path);
  if (/배달의민족|배민|baemin/.test(mall) || hostMatches(host, "baemin.com")) return /\/event/.test(path);
  if (/bhc/.test(mall) || hostMatches(host, "bhc.co.kr")) return /\/event|coupon|promotion/.test(full);
  if (/아모레몰|amoremall/.test(mall) || hostMatches(host, "amoremall.com")) return /\/event/.test(path);
  if (/cgv/.test(mall) || hostMatches(host, "cgv.co.kr")) return /\/culture-event\/event/.test(path);
  if (/cu|bgf/.test(mall) || hostMatches(host, "bgfretail.com")) return /\/event/.test(path);
  if (/세븐일레븐|7-eleven|7eleven/.test(mall) || hostMatches(host, "7-eleven.co.kr")) return /\/event/.test(path);
  if (/홈플러스|homeplus/.test(mall) || hostMatches(host, "homeplus.co.kr")) return /\/event/.test(path) || full.includes("event");
  if (/요기요|yogiyo/.test(mall) || hostMatches(host, "yogiyo.co.kr")) return /\/event/.test(path) || full.includes("event") || (path.includes("/mobile") && url.hash.includes("event"));
  if (/스타벅스|starbucks/.test(mall) || hostMatches(host, "starbucks.co.kr")) return /\/whats_new\/campaign/.test(path) || /\/event/.test(path);
  if (/kt멤버십|kt membership|kt/.test(mall) || hostMatches(host, "membership.kt.com")) return /\/benefit|\/event|\/discount/.test(path);
  if (/u\+|유플러스|uplus/.test(mall) || hostMatches(host, "uplus.co.kr")) return /\/benefit|\/event|membership/.test(full);
  if (/맘큐|momq/.test(mall) || hostMatches(host, "momq.co.kr")) return /\/event|\/display/.test(path);
  if (/아이챌린지|i-challenge/.test(mall) || hostMatches(host, "i-challenge.co.kr")) return /\/event/i.test(path);
  if (/현대카드|hyundaicard/.test(mall) || hostMatches(host, "hyundaicard.com")) return /event|benefit|cpc|cpu|point|mileage/.test(full);
  if (/신한카드|shinhancard/.test(mall) || hostMatches(host, "shinhancard.com")) return /event|benefit|pconts/.test(full);
  if (/롯데시네마|lottecinema/.test(mall) || hostMatches(host, "lottecinema.co.kr")) return /event/.test(full);
  if (/메가|mega/.test(mall) || hostMatches(host, "mega-mgccoffee.com")) return /event|bbs|campaign/.test(full);
  if (/카카오톡|선물하기|gift\.kakao/.test(mall) || hostMatches(host, "gift.kakao.com")) return /event|page|promotion/.test(full);
  if (/티켓링크|ticketlink/.test(mall) || hostMatches(host, "ticketlink.co.kr")) return /event|product|goods/.test(full);

  return !isHomeOnlyUrl(url) && !isSearchOrCategoryUrl(url);
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function validatePurchaseLink(input: LinkValidationInput): LinkValidationResult {
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const candidate = parseHttpUrl(input.url);
  const fallback = parseHttpUrl(input.fallbackUrl);
  const fallbackUrl = fallback?.toString() ?? "https://search.shopping.naver.com/search/all";

  if (input.linkStatus === "broken" || input.linkStatus === "sold_out") {
    return {
      linkVerified: false,
      purchaseLinkVerified: false,
      finalUrl: fallbackUrl,
      finalPurchaseUrl: fallbackUrl,
      linkStatus: input.linkStatus,
      linkType: "unavailable",
      checkedAt,
      purchaseConfidence: input.linkStatus === "sold_out" ? 10 : 0,
      reason: input.linkStatus === "sold_out" ? "판매 종료 또는 품절 가능성이 있어 노출 제한 대상입니다." : "링크 오류가 확인되어 이동 제한 대상입니다."
    };
  }

  if (!candidate || isPlaceholderHost(candidate.hostname.toLowerCase()) || isCommunityHost(candidate.hostname.toLowerCase())) {
    return {
      linkVerified: false,
      purchaseLinkVerified: false,
      finalUrl: fallbackUrl,
      finalPurchaseUrl: fallbackUrl,
      linkStatus: "needs_review",
      linkType: "seller_search",
      checkedAt,
      purchaseConfidence: 35,
      reason: "원본 링크가 없거나 커뮤니티/placeholder 링크라 판매처 검색으로 대체했습니다."
    };
  }

  if (isHomeOnlyUrl(candidate) || isSearchOrCategoryUrl(candidate)) {
    return {
      linkVerified: false,
      purchaseLinkVerified: false,
      finalUrl: candidate.toString(),
      finalPurchaseUrl: candidate.toString(),
      linkStatus: "needs_review",
      linkType: "seller_search",
      checkedAt,
      purchaseConfidence: 45,
      reason: "검색/카테고리 링크이므로 상품 상세 URL 보강이 필요합니다."
    };
  }

  if (isKnownProductDetailUrl(candidate, input.mallName)) {
    const linkType: DealLinkType = input.linkType === "affiliate" ? "affiliate" : "direct_purchase";
    return {
      linkVerified: true,
      purchaseLinkVerified: true,
      finalUrl: candidate.toString(),
      finalPurchaseUrl: candidate.toString(),
      linkStatus: "verified",
      linkType,
      checkedAt,
      purchaseConfidence: linkType === "affiliate" ? 92 : 88,
      reason: "쇼핑몰 상품 상세 URL 패턴을 통과했습니다."
    };
  }

  return {
    linkVerified: false,
    purchaseLinkVerified: false,
    finalUrl: candidate.toString(),
    finalPurchaseUrl: candidate.toString(),
    linkStatus: "needs_review",
    linkType: input.linkType ?? "direct_purchase",
    checkedAt,
    purchaseConfidence: clampConfidence(58),
    reason: "HTTP 링크이지만 상품 상세 URL 패턴 확인이 필요합니다."
  };
}

export function getDealPurchaseConfidenceLabel(deal: Pick<Deal, "linkVerified" | "purchaseConfidence" | "linkStatus">) {
  if (deal.linkStatus === "sold_out") return "품절 가능성";
  if (deal.linkStatus === "broken") return "링크 오류";
  if (deal.linkVerified && deal.purchaseConfidence >= 80) return "구매 링크 검증 완료";
  if (deal.purchaseConfidence >= 50) return "운영 확인 필요";
  return "링크 확인 필요";
}

export async function probePurchaseLink(url: string, timeoutMs = 3500): Promise<LinkProbeResult> {
  const checkedAt = new Date().toISOString();
  const candidate = parseHttpUrl(url);

  if (!candidate) {
    return { ok: false, finalUrl: url, status: 0, checkedAt, reason: "http/https URL이 아닙니다." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(candidate.toString(), {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal
    });

    return {
      ok: response.status >= 200 && response.status < 400,
      finalUrl: response.url || candidate.toString(),
      status: response.status,
      checkedAt,
      reason: response.status >= 200 && response.status < 400 ? "링크 응답 확인" : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      finalUrl: candidate.toString(),
      status: 0,
      checkedAt,
      reason: error instanceof Error && error.name === "AbortError" ? "timeout" : "request_failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

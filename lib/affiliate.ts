import { Deal } from "@/types/deal";

const affiliateMallAllowList = new Set([
  "쿠팡",
  "11번가",
  "G마켓",
  "g마켓",
  "지마켓",
  "네이버쇼핑",
  "네이버",
  "SSG닷컴",
  "옥션",
  "이마트몰",
  "롯데온",
  "마켓컬리",
  "올리브영",
  "오늘의집",
  "인터파크",
  "인터파크투어",
  "알리익스프레스",
  "하이마트"
]);

type AffiliateTemplateMap = Record<string, string>;

function normalizeMallName(mall: string) {
  return mall.trim().toLowerCase();
}

function getDealMall(deal: Pick<Deal, "mall" | "mallName">) {
  return deal.mallName || deal.mall;
}

function parseTemplateMap() {
  const raw = process.env.AFFILIATE_URL_TEMPLATES;
  if (!raw) return {};

  try {
    return JSON.parse(raw) as AffiliateTemplateMap;
  } catch {
    return {};
  }
}

function getAffiliateTemplate(deal: Deal) {
  const mall = getDealMall(deal);
  const normalizedMall = normalizeMallName(mall);
  const templates = parseTemplateMap();

  if (/쿠팡|coupang/.test(normalizedMall) && process.env.COUPANG_PARTNERS_URL_TEMPLATE) {
    return process.env.COUPANG_PARTNERS_URL_TEMPLATE;
  }

  return templates[mall] ?? templates[normalizedMall] ?? process.env.DEFAULT_AFFILIATE_URL_TEMPLATE ?? "";
}

function fillTemplate(template: string, deal: Deal, from: string, subId: string) {
  const originalUrl = resolveDealDestinationUrl(deal);
  const replacements: Record<string, string> = {
    url: originalUrl,
    encodedUrl: encodeURIComponent(originalUrl),
    dealId: deal.id,
    mall: encodeURIComponent(getDealMall(deal)),
    campaign: encodeURIComponent(from || "unknown"),
    subId: encodeURIComponent(subId),
    title: encodeURIComponent(deal.title)
  };

  return template.replace(/\{(url|encodedUrl|dealId|mall|campaign|subId|title)\}/g, (_, key: string) => replacements[key] ?? "");
}

export function isHttpUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isKnownCommunityHost(host: string) {
  return [
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
  ].some((blockedHost) => host === blockedHost || host.endsWith(`.${blockedHost}`) || host.includes(blockedHost));
}

function isPlaceholderOrCommunityUrl(value?: string) {
  if (!isHttpUrl(value)) return true;
  if (!value) return true;
  const host = new URL(value).hostname.toLowerCase();
  return host === "example.com" || host.endsWith(".example.com") || isKnownCommunityHost(host);
}

export function buildSellerSearchUrl(deal: Pick<Deal, "mall" | "mallName" | "title">) {
  const mall = getDealMall(deal).toLowerCase();
  const query = encodeURIComponent(deal.title);

  if (/쿠팡|coupang/.test(mall)) return `https://www.coupang.com/np/search?q=${query}`;
  if (/g마켓|지마켓|gmarket/.test(mall)) return `https://browse.gmarket.co.kr/search?keyword=${query}`;
  if (/옥션|auction/.test(mall)) return `https://browse.auction.co.kr/search?keyword=${query}`;
  if (/11번가|11st/.test(mall)) return `https://search.11st.co.kr/Search.tmall?kwd=${query}`;
  if (/올리브영|olive/.test(mall)) return `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${query}`;
  if (/무신사|musinsa/.test(mall)) return `https://www.musinsa.com/search/goods?keyword=${query}`;
  if (/네이버|naver/.test(mall)) return `https://search.shopping.naver.com/search/all?query=${query}`;
  if (/ssg|쓱/.test(mall)) return `https://www.ssg.com/search.ssg?target=all&query=${query}`;
  if (/이마트/.test(mall)) return `https://emart.ssg.com/search.ssg?target=all&query=${query}`;
  if (/알리|ali/.test(mall)) return `https://ko.aliexpress.com/w/wholesale-${query}.html`;
  if (/하이마트|himart/.test(mall)) return `https://www.e-himart.co.kr/app/search/totalSearch?query=${query}`;
  if (/롯데온|lotte/.test(mall)) return `https://www.lotteon.com/search/search/search.ecn?render=search&platform=pc&q=${query}`;
  if (/마켓컬리|컬리|kurly/.test(mall)) return `https://www.kurly.com/search?sword=${query}`;
  if (/오늘의집/.test(mall)) return `https://ohou.se/productions/feed?query=${query}`;
  if (/인터파크/.test(mall)) return `https://shopping.interpark.com/search/all?keyword=${query}`;

  return `https://search.shopping.naver.com/search/all?query=${query}`;
}

export function resolveDealDestinationUrl(deal: Deal, preferAffiliate = false) {
  const candidate = preferAffiliate ? (deal.affiliateUrl || deal.purchaseUrl || deal.url || deal.link) : (deal.purchaseUrl || deal.url || deal.link);
  return isPlaceholderOrCommunityUrl(candidate) ? buildSellerSearchUrl(deal) : candidate;
}

export function getDealLinkTrustLabel(deal: Pick<Deal, "linkStatus" | "linkType" | "linkLabel">) {
  if (deal.linkStatus === "verified") return deal.linkLabel || "구매 페이지 확인";
  if (deal.linkStatus === "sold_out") return "품절 가능성";
  if (deal.linkStatus === "broken") return "링크 확인 필요";
  if (deal.linkType === "seller_search") return "판매처 검색 확인";
  return "확인 필요";
}

export function canOpenDealLink(deal: Pick<Deal, "linkStatus">) {
  return deal.linkStatus !== "broken" && deal.linkStatus !== "sold_out";
}

export function isAffiliateEligible(deal: Pick<Deal, "mall" | "mallName">) {
  const mall = getDealMall(deal);
  return affiliateMallAllowList.has(mall) || affiliateMallAllowList.has(normalizeMallName(mall));
}

export function buildOutboundUrl(deal: Deal, from: string, includeAffiliateParams = true) {
  const subId = process.env.AFFILIATE_SUB_ID ?? "halindosa-local";
  const destinationUrl = resolveDealDestinationUrl(deal, includeAffiliateParams);

  if (includeAffiliateParams && isAffiliateEligible(deal)) {
    const template = getAffiliateTemplate(deal);
    if (template) {
      const templatedUrl = fillTemplate(template, { ...deal, link: destinationUrl }, from, subId);
      return isHttpUrl(templatedUrl) ? templatedUrl : destinationUrl;
    }
  }

  const outboundUrl = new URL(destinationUrl);

  if (includeAffiliateParams && isAffiliateEligible(deal)) {
    outboundUrl.searchParams.set("sub_id", subId);
    outboundUrl.searchParams.set("utm_source", "halindosa");
    outboundUrl.searchParams.set("utm_medium", "affiliate_redirect");
    outboundUrl.searchParams.set("utm_campaign", from || "unknown");
  }

  return outboundUrl.toString();
}

export function getAffiliateDisclosure(deal: Pick<Deal, "mall" | "mallName">) {
  if (!isAffiliateEligible(deal)) {
    return "판매처 정책에 따라 가격과 재고가 변동될 수 있습니다.";
  }

  return "제휴 링크가 포함될 수 있으며 구매 시 할인도사가 수수료를 받을 수 있습니다.";
}

export function getAffiliateConnectionStatus() {
  const templates = parseTemplateMap();

  return {
    subId: process.env.AFFILIATE_SUB_ID ? "configured" : "local-default",
    defaultTemplate: Boolean(process.env.DEFAULT_AFFILIATE_URL_TEMPLATE),
    coupangTemplate: Boolean(process.env.COUPANG_PARTNERS_URL_TEMPLATE),
    mallTemplates: Object.keys(templates)
  };
}

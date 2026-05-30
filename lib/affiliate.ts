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
  "올리브영",
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
  const originalUrl = deal.link;
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

export function isAffiliateEligible(deal: Pick<Deal, "mall" | "mallName">) {
  const mall = getDealMall(deal);
  return affiliateMallAllowList.has(mall) || affiliateMallAllowList.has(normalizeMallName(mall));
}

export function buildOutboundUrl(deal: Deal, from: string, includeAffiliateParams = true) {
  const subId = process.env.AFFILIATE_SUB_ID ?? "halindosa-local";

  if (includeAffiliateParams && isAffiliateEligible(deal)) {
    const template = getAffiliateTemplate(deal);
    if (template) return fillTemplate(template, deal, from, subId);
  }

  const outboundUrl = new URL(deal.link);

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

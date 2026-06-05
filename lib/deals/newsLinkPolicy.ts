import type { NewsDeal } from "@/types/newsDeal";
import officialSourceCatalog from "@/data/officialSourceCatalog.json";

const approvedNewsHosts = [
  "gs25.gsretail.com",
  "cu.bgfretail.com",
  "culture.go.kr",
  "tworld.co.kr",
  "cgv.co.kr",
  "lottecinema.co.kr",
  "koreanair.com",
  "ssg.com",
  "emart.ssg.com",
  "homeplus.co.kr",
  "hyundaihmall.com",
  "bccard.com",
  "kbcard.com",
  "shinhancard.com",
  "new-m.pay.naver.com",
  "pay.naver.com",
  "point.pay.naver.com",
  "yogiyo.co.kr",
  "musinsa.com",
  "lotteon.com",
  "oliveyoung.co.kr",
  "e-himart.co.kr",
  "samsung.com",
  "mnuri.kr"
];

function catalogAllowedHosts() {
  return (officialSourceCatalog as Array<{ officialUrl?: string; allowedFinalHosts?: string[] }>)
    .flatMap((source) => [source.officialUrl, ...(Array.isArray(source.allowedFinalHosts) ? source.allowedFinalHosts : [])])
    .map((value) => {
      try {
        const hostSource = String(value ?? "").startsWith("http") ? String(value) : `https://${value}`;
        return normalizeHost(new URL(hostSource).hostname);
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

const approvedNewsHostSet = new Set([...approvedNewsHosts.map(normalizeHost), ...catalogAllowedHosts()]);
const approvedNewsHostList = Array.from(approvedNewsHostSet);

const blockedNewsHosts = [
  "ppomppu.co.kr",
  "fmkorea.com",
  "quasarzone.com",
  "algumon.com",
  "clien.net",
  "dcinside.com",
  "theqoo.net",
  "blog.naver.com",
  "m.blog.naver.com",
  "news.naver.com",
  "v.daum.net",
  "news.daum.net",
  "youtube.com",
  "example.com"
];

const searchPatterns = [
  "/search",
  "search?",
  "query=",
  "keyword=",
  "shopping/search",
  "msearch",
  "/find",
  "/result",
  "sword=",
  "kwd="
];

function normalizeHost(host: string) {
  return host.replace(/^www\./, "").toLowerCase();
}

function isHomeOnlyUrl(url: URL) {
  const path = url.pathname.replace(/\/+$/, "").toLowerCase();
  return ["", "/", "/main", "/index"].includes(path);
}

export function isApprovedOfficialNewsUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    const host = normalizeHost(url.hostname);
    const full = `${host}${url.pathname}${url.search}`.toLowerCase();

    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (blockedNewsHosts.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) return false;
    if (isHomeOnlyUrl(url)) return false;
    if (searchPatterns.some((pattern) => full.includes(pattern))) return false;

    return approvedNewsHostList.some((approved) => host === approved || host.endsWith(`.${approved}`));
  } catch {
    return false;
  }
}

export function canOpenNewsDealLink(deal: Pick<NewsDeal, "finalUrl" | "validationStatus" | "isHidden" | "endDate" | "publishable">) {
  const endsAt = Date.parse(deal.endDate);

  return (
    deal.validationStatus === "passed" &&
    !deal.isHidden &&
    deal.publishable !== false &&
    (!Number.isFinite(endsAt) || endsAt >= Date.now()) &&
    isApprovedOfficialNewsUrl(deal.finalUrl)
  );
}

export function resolveNewsDealDestinationUrl(deal: NewsDeal) {
  return canOpenNewsDealLink(deal) ? deal.finalUrl : "";
}

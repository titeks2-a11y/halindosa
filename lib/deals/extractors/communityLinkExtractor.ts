import { validatePurchaseLink } from "@/lib/deals/linkValidator";

export interface CommunityLinkExtractionInput {
  body: string;
  title: string;
  mallName: string;
  sourceUrl: string;
  sourceName: string;
  fallbackUrl: string;
}

export interface CommunityLinkCandidate {
  sourceUrl: string;
  sourceName: string;
  extractedUrl: string;
  finalPurchaseUrl: string;
  purchaseLinkVerified: boolean;
  purchaseConfidence: number;
  reason: string;
}

const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
const blockedSourceHosts = [
  "ppomppu.co.kr",
  "fmkorea.com",
  "quasarzone.com",
  "clien.net",
  "ruliweb.com",
  "algumon.com"
];

function normalizeCandidateUrl(value: string) {
  return value.replace(/[),.]+$/g, "");
}

function isSourceHost(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return blockedSourceHosts.some((sourceHost) => host === sourceHost || host.endsWith(`.${sourceHost}`) || host.includes(sourceHost));
  } catch {
    return true;
  }
}

export function extractDirectPurchaseLinksFromCommunity(input: CommunityLinkExtractionInput): CommunityLinkCandidate[] {
  const urls = Array.from(new Set((input.body.match(urlPattern) ?? []).map(normalizeCandidateUrl))).filter((url) => !isSourceHost(url));

  return urls
    .map((url) => {
      const validation = validatePurchaseLink({
        url,
        fallbackUrl: input.fallbackUrl,
        mallName: input.mallName,
        title: input.title
      });

      return {
        sourceUrl: input.sourceUrl,
        sourceName: input.sourceName,
        extractedUrl: url,
        finalPurchaseUrl: validation.finalPurchaseUrl,
        purchaseLinkVerified: validation.purchaseLinkVerified,
        purchaseConfidence: validation.purchaseConfidence,
        reason: validation.reason
      };
    })
    .filter((candidate) => candidate.purchaseLinkVerified);
}

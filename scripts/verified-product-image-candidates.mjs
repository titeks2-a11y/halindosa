import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const backlogPath = join(root, "IMAGE_BACKLOG.json");
const candidateLimit = Number(process.env.IMAGE_CANDIDATE_LIMIT ?? 60);

const genericImagePattern =
  /(logo|favicon|sprite|sns|facebook|kakao|twitter|instagram|blank|noimage|no_img|common|icon|btn|header|footer|loading|placeholder|share|default|error\/unavailable|isms|txt-update|gnb_appmenu|open-graph-ohouse-horizontal)/i;
const usefulPathPattern =
  /(product|goods|good_img|item|event|benefit|coupon|free|notice_poster|banner|upfile|membership|promotion|planprd|images\/free)/i;

function ensureDirs() {
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(docsDir, { recursive: true });
}

function readBacklog() {
  if (!existsSync(backlogPath)) {
    throw new Error("IMAGE_BACKLOG.json is missing. Run npm run image:backlog:report first.");
  }

  const backlog = JSON.parse(readFileSync(backlogPath, "utf8"));
  return Array.isArray(backlog.fallbackDeals) ? backlog.fallbackDeals : [];
}

function unique(items) {
  return [...new Set(items)];
}

function normalizeUrl(value, baseUrl) {
  try {
    let cleaned = String(value ?? "")
      .replaceAll("\\/", "/")
      .replaceAll("&amp;", "&")
      .trim();

    if (!cleaned) return "";
    if (cleaned.startsWith("//")) cleaned = `https:${cleaned}`;

    return new URL(cleaned, baseUrl).toString();
  } catch {
    return "";
  }
}

function isImageLikeUrl(value) {
  return /^https?:\/\//.test(value) && /\.(png|jpe?g|webp|avif)(?:[?#].*)?$/i.test(value);
}

function isUsefulCandidateUrl(value) {
  if (!isImageLikeUrl(value)) return false;
  if (genericImagePattern.test(value)) return false;
  return usefulPathPattern.test(value);
}

function sourceLabel(source) {
  if (source === "og_image") return "OG/Twitter image";
  if (source === "page_image") return "official page image";
  return "inline official image";
}

function candidateConfidence(candidate) {
  const lower = candidate.url.toLowerCase();
  let score = 50;

  if (candidate.source === "og_image") score += 15;
  if (/product|goods|good_img|item|notice_poster/.test(lower)) score += 15;
  if (/event|benefit|coupon|free|membership|promotion|planprd|banner/.test(lower)) score += 10;
  if (/cdn|image|img|static|contents|asset|sitem|ssgcdn|ticketimage|korailtravel/.test(lower)) score += 8;
  if (genericImagePattern.test(lower)) score -= 40;

  return Math.max(0, Math.min(100, score));
}

function extractImageCandidates(html, baseUrl) {
  const candidates = [];
  const metaPatterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|image)["'][^>]+content=["']([^"']+)/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image|image)["']/gi
  ];
  const imagePattern = /<img[^>]+(?:src|data-src|data-original|data-img|data-lazy)=["']([^"']+)["'][^>]*>/gi;
  const inlineUrlPattern = /(https?:\\?\/\\?\/[^"'<>\\s]+?\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"'<>\\s]*)?)/gi;

  for (const pattern of metaPatterns) {
    let match;
    while ((match = pattern.exec(html))) {
      candidates.push({ url: normalizeUrl(match[1], baseUrl), source: "og_image" });
    }
  }

  let match;
  while ((match = imagePattern.exec(html))) {
    candidates.push({ url: normalizeUrl(match[1], baseUrl), source: "page_image" });
  }

  while ((match = inlineUrlPattern.exec(html))) {
    candidates.push({ url: normalizeUrl(match[1], baseUrl), source: "inline_image" });
  }

  return unique(candidates.map((candidate) => JSON.stringify(candidate)))
    .map((candidate) => JSON.parse(candidate))
    .filter((candidate) => candidate.url && isUsefulCandidateUrl(candidate.url))
    .map((candidate) => ({
      ...candidate,
      confidence: candidateConfidence(candidate),
      sourceLabel: sourceLabel(candidate.source)
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 Halindosa image candidate audit",
      accept: "text/html,application/xhtml+xml"
    },
    signal: AbortSignal.timeout(12_000)
  });

  const html = await response.text();
  return { status: response.status, finalUrl: response.url, html };
}

async function validateImage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 Halindosa image candidate audit",
        accept: "image/avif,image/webp,image/png,image/jpeg,*/*"
      },
      signal: AbortSignal.timeout(8_000)
    });
    const contentType = response.headers.get("content-type") ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? 0);

    return {
      ok: response.ok && contentType.startsWith("image/") && (!contentLength || contentLength >= 2_500),
      status: response.status,
      contentType,
      contentLength
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function buildMarkdown(report) {
  const rows = report.candidates.map(
    (candidate) =>
      `| ${candidate.id} | ${candidate.mallName} | ${candidate.title} | ${candidate.confidence} | ${candidate.sourceLabel} | [image](${candidate.imageUrl}) | [source](${candidate.purchaseUrl}) |`
  );

  return [
    "# Verified Product Image Candidate Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.ok ? "PASS" : "REVIEW"}`,
    "",
    "## Summary",
    "",
    `- Backlog checked: ${report.checkedCount}`,
    `- Candidate images found: ${report.candidates.length}`,
    `- Access blocked or unavailable: ${report.blockedCount}`,
    `- Minimum confidence: ${report.minimumConfidence}`,
    "",
    "## Policy",
    "",
    "- 이 리포트는 앱 데이터를 자동 변경하지 않습니다.",
    "- 후보 이미지는 공식 상품/혜택 상세 페이지에서만 추출합니다.",
    "- 검색 결과 썸네일, 커뮤니티 캡처, 블로그 이미지, 무출처 이미지는 후보에서 제외합니다.",
    "- 운영자는 권리 확인 후 `data/verifiedProductImages.ts`에 `official_page_image`, `og_image`, `schema_image`, `official_cdn` 중 하나로 반영합니다.",
    "",
    "## Candidates",
    "",
    "| ID | Mall | Title | Confidence | Source | Image | Source page |",
    "| --- | --- | --- | ---: | --- | --- | --- |",
    ...(rows.length ? rows : ["| - | - | - | - | - | - | - |"]),
    ""
  ].join("\n");
}

ensureDirs();

const fallbackDeals = readBacklog().slice(0, Math.max(1, candidateLimit));
const minimumConfidence = 65;
const candidates = [];
const blocked = [];

for (const deal of fallbackDeals) {
  try {
    const page = await fetchText(deal.purchaseUrl);
    const imageCandidates = extractImageCandidates(page.html, page.finalUrl).filter(
      (candidate) => candidate.confidence >= minimumConfidence
    );

    for (const candidate of imageCandidates.slice(0, 6)) {
      const imageValidation = await validateImage(candidate.url);
      if (!imageValidation.ok) continue;

      candidates.push({
        id: deal.id,
        mallName: deal.mallName,
        category: deal.category,
        title: deal.title,
        purchaseUrl: deal.purchaseUrl,
        imageUrl: candidate.url,
        source: candidate.source,
        sourceLabel: candidate.sourceLabel,
        confidence: candidate.confidence,
        pageStatus: page.status,
        imageStatus: imageValidation.status,
        contentType: imageValidation.contentType,
        contentLength: imageValidation.contentLength,
        evidence: `${deal.mallName} 공식 페이지 ${candidate.sourceLabel}`
      });
      break;
    }

    if (!candidates.some((candidate) => candidate.id === deal.id)) {
      blocked.push({
        id: deal.id,
        mallName: deal.mallName,
        title: deal.title,
        purchaseUrl: deal.purchaseUrl,
        reason: imageCandidates.length ? "candidate_image_validation_failed" : "no_high_confidence_candidate",
        pageStatus: page.status
      });
    }
  } catch (error) {
    blocked.push({
      id: deal.id,
      mallName: deal.mallName,
      title: deal.title,
      purchaseUrl: deal.purchaseUrl,
      reason: error instanceof Error ? error.message : String(error)
    });
  }
}

const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  checkedCount: fallbackDeals.length,
  minimumConfidence,
  candidateCount: candidates.length,
  blockedCount: blocked.length,
  candidates,
  blocked
};

writeFileSync(join(reportsDir, "verified-product-image-candidates.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(join(docsDir, "VERIFIED_PRODUCT_IMAGE_CANDIDATES.md"), buildMarkdown(report), "utf8");

console.log("Verified product image candidate report written.");
console.log(`- checked: ${report.checkedCount}`);
console.log(`- candidates: ${report.candidateCount}`);
console.log(`- blocked: ${report.blockedCount}`);
console.log("- reports/verified-product-image-candidates.json");
console.log("- docs/VERIFIED_PRODUCT_IMAGE_CANDIDATES.md");

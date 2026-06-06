import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const generatedAt = new Date().toISOString();
const userAgent = "Mozilla/5.0 (compatible; HalindosaImageEnricher/1.0; +https://halindosa.com)";
const blockedImageHints = /(favicon|sprite|blank|noimage|no_img|placeholder|loading|transparent|1x1|pixel)/i;
const strongImageHints = /(event|benefit|coupon|promotion|promo|banner|visual|offer|sale|free|gift|main|notice|content|goods|product|thumbnail|thumb|hero|혜택|이벤트|쿠폰|프로모션|할인|무료)/i;

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(join(root, path), "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(path, payload) {
  writeFileSync(join(root, path), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function absoluteImageUrl(value, baseUrl) {
  const cleaned = cleanText(value).replace(/&amp;/g, "&");
  if (!cleaned) return "";

  try {
    const url = new URL(cleaned, baseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (blockedImageHints.test(url.href)) return "";
    return url.href;
  } catch {
    return "";
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function extractJsonLdImages(html, baseUrl) {
  const candidates = [];
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  function collect(value) {
    if (!value) return;
    if (typeof value === "string") {
      const imageUrl = absoluteImageUrl(value, baseUrl);
      if (imageUrl) candidates.push({ url: imageUrl, method: "json_ld_image" });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "object") {
      collect(value.url || value.contentUrl || value.thumbnailUrl);
    }
  }

  for (const [, rawJson] of blocks) {
    try {
      const parsed = JSON.parse(rawJson.trim());
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [])];
      for (const node of nodes) {
        collect(node?.image);
        collect(node?.thumbnailUrl);
      }
    } catch {
      // Ignore malformed JSON-LD. The page may still expose OG or inline candidates.
    }
  }

  return candidates;
}

function extractImageCandidates(html, baseUrl) {
  const candidates = [];
  const patterns = [
    { method: "og_image", pattern: /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/gi },
    { method: "og_image", pattern: /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/gi },
    { method: "twitter_image", pattern: /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/gi },
    { method: "twitter_image", pattern: /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/gi },
    { method: "itemprop_image", pattern: /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["'][^>]*>/gi },
    { method: "itemprop_image", pattern: /<meta[^>]+content=["']([^"']+)["'][^>]+itemprop=["']image["'][^>]*>/gi },
    { method: "image_src", pattern: /<link[^>]+rel=["'][^"']*image_src[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/gi },
    { method: "image_src", pattern: /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*image_src[^"']*["'][^>]*>/gi },
    { method: "preload_image", pattern: /<link[^>]+rel=["'][^"']*(?:preload|prefetch)[^"']*["'][^>]+as=["']image["'][^>]+href=["']([^"']+)["'][^>]*>/gi },
    { method: "preload_image", pattern: /<link[^>]+href=["']([^"']+)["'][^>]+as=["']image["'][^>]+rel=["'][^"']*(?:preload|prefetch)[^"']*["'][^>]*>/gi },
    { method: "inline_schema_image", pattern: /"image"\s*:\s*"([^"]+)"/gi }
  ];

  for (const { method, pattern } of patterns) {
    for (const match of html.matchAll(pattern)) {
      const imageUrl = absoluteImageUrl(match?.[1], baseUrl);
      if (imageUrl) candidates.push({ url: imageUrl, method });
    }
  }

  candidates.push(...extractJsonLdImages(html, baseUrl));

  for (const match of html.matchAll(/<img[^>]+(?:src|data-src|data-original|data-lazy|data-url)=["']([^"']+)["'][^>]*>/gi)) {
    const rawTag = match[0] ?? "";
    const imageUrl = absoluteImageUrl(match?.[1], baseUrl);
    if (imageUrl && strongImageHints.test(`${rawTag} ${imageUrl}`)) {
      candidates.push({ url: imageUrl, method: "html_image_candidate" });
    }
  }

  const priority = {
    og_image: 100,
    twitter_image: 95,
    itemprop_image: 90,
    json_ld_image: 88,
    image_src: 85,
    preload_image: 70,
    inline_schema_image: 65,
    html_image_candidate: 45
  };

  const byUrl = new Map();
  for (const candidate of candidates) {
    const current = byUrl.get(candidate.url);
    if (!current || (priority[candidate.method] ?? 0) > (priority[current.method] ?? 0)) {
      byUrl.set(candidate.url, candidate);
    }
  }

  return unique([...byUrl.values()].map((candidate) => candidate.url))
    .map((url) => byUrl.get(url))
    .sort((a, b) => (priority[b.method] ?? 0) - (priority[a.method] ?? 0));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
        ...(options.headers ?? {})
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function validateImageUrl(imageUrl) {
  try {
    const response = await fetchWithTimeout(
      imageUrl,
      {
        method: "HEAD",
        headers: {
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*,*/*;q=0.8"
        }
      },
      5_000
    );
    const contentType = response.headers.get("content-type") ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? 0);

    return {
      ok: response.ok && /^image\//i.test(contentType),
      status: response.status,
      contentType,
      contentLength
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: "",
      contentLength: 0,
      error: error instanceof Error ? error.name : "image_probe_failed"
    };
  }
}

async function probeDeal(deal) {
  try {
    const response = await fetchWithTimeout(deal.finalUrl, {}, 8_000);
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !/html|text|xml/i.test(contentType)) {
      return {
        id: deal.id,
        ok: false,
        reason: `page_${response.status}_${contentType || "unknown"}`
      };
    }

    const html = (await response.text()).slice(0, 350_000);
    const candidates = extractImageCandidates(html, response.url || deal.finalUrl).slice(0, 8);
    if (!candidates.length) {
      return {
        id: deal.id,
        ok: false,
        reason: "no_meta_image"
      };
    }

    const rejected = [];
    for (const candidate of candidates) {
      const image = await validateImageUrl(candidate.url);
      const needsLargeAsset =
        candidate.method === "html_image_candidate" &&
        Number(image.contentLength ?? 0) > 0 &&
        Number(image.contentLength ?? 0) < 4_000;

      if (image.ok && !needsLargeAsset) {
        return {
          id: deal.id,
          ok: true,
          title: deal.title,
          sourceName: deal.sourceName,
          sourceUrl: deal.finalUrl,
          url: candidate.url,
          imageType: "official",
          method: candidate.method,
          checkedAt: generatedAt,
          status: image.status,
          contentType: image.contentType,
          contentLength: image.contentLength
        };
      }

      rejected.push({
        method: candidate.method,
        reason: needsLargeAsset ? "image_too_small" : `image_${image.status || image.error || "invalid"}`,
        imageUrl: candidate.url
      });
    }

    return {
      id: deal.id,
      ok: false,
      reason: rejected[0]?.reason ?? "image_invalid",
      rejected
    };
  } catch (error) {
    return {
      id: deal.id,
      ok: false,
      reason: error instanceof Error ? error.name : "page_probe_failed"
    };
  }
}

const snapshot = readJson("data/refreshedNewsDeals.json", { deals: [] });
const visibleDeals = Array.isArray(snapshot.deals)
  ? snapshot.deals.filter((deal) => deal.publishable && !deal.isHidden && /^https?:\/\//.test(String(deal.finalUrl ?? "")))
  : [];
const existing = readJson("data/verifiedNewsBenefitImages.json", {});
const results = [];
let index = 0;
const concurrency = 8;

async function worker() {
  while (index < visibleDeals.length) {
    const deal = visibleDeals[index++];
    results.push(await probeDeal(deal));
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));

const next = { ...existing };
for (const item of results.filter((result) => result.ok)) {
  next[item.id] = {
    url: item.url,
    imageType: "official",
    sourceUrl: item.sourceUrl,
    method: item.method,
    checkedAt: item.checkedAt,
    contentType: item.contentType,
    contentLength: item.contentLength
  };
}

const summary = {
  generatedAt,
  total: visibleDeals.length,
  found: results.filter((result) => result.ok).length,
  retained: Object.keys(next).length,
  failed: results.filter((result) => !result.ok).length,
  failureReasons: Object.fromEntries(
    results
      .filter((result) => !result.ok)
      .reduce((map, result) => map.set(result.reason, (map.get(result.reason) ?? 0) + 1), new Map())
  )
};

mkdirSync(join(root, "reports"), { recursive: true });
mkdirSync(join(root, "docs"), { recursive: true });
writeJson("data/verifiedNewsBenefitImages.json", next);
writeJson("reports/news-benefit-images.json", {
  ...summary,
  results
});

const markdown = `# Official Benefit Image Enrichment Report

Generated: ${generatedAt}

| Metric | Value |
| --- | ---: |
| Visible official benefits | ${summary.total} |
| Newly found official images | ${summary.found} |
| Retained official image mappings | ${summary.retained} |
| Failed probes | ${summary.failed} |

## Failure Reasons

${Object.entries(summary.failureReasons)
  .map(([reason, count]) => `- ${reason}: ${count}`)
  .join("\n") || "- none"}

## Policy

- 공식 혜택 이미지는 \`og:image\`, \`twitter:image\`, \`image_src\`, JSON-LD \`image\` 후보만 사용합니다.
- favicon, noimage, placeholder, tracking pixel 계열 이미지는 제외합니다.
- 실패한 항목은 사용자 화면에서 생성 placeholder로 대체하며 실제 상품 사진처럼 가장하지 않습니다.
`;

writeFileSync(join(root, "docs", "NEWS_BENEFIT_IMAGE_ENRICHMENT.md"), markdown, "utf8");

console.log("Official benefit image enrichment completed.");
console.log(`- visible benefits: ${summary.total}`);
console.log(`- newly found official images: ${summary.found}`);
console.log(`- retained mappings: ${summary.retained}`);
console.log("- data/verifiedNewsBenefitImages.json");
console.log("- reports/news-benefit-images.json");

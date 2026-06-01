import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function pass(name, detail = "") {
  checks.push({ name, ok: true, detail });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

function fileExists(path) {
  return existsSync(join(root, path));
}

const layout = read("app/layout.tsx");
const sitemap = read("app/sitemap.ts");
const robots = read("app/robots.ts");
const detail = read("app/deals/[id]/page.tsx");
const popular = fileExists("app/popular/page.tsx") ? read("app/popular/page.tsx") : "";
const categories = fileExists("app/categories/page.tsx") ? read("app/categories/page.tsx") : "";
const mypage = fileExists("app/mypage/page.tsx") ? read("app/mypage/page.tsx") : "";

if (layout.includes("metadataBase") && layout.includes("title:") && layout.includes("description:")) {
  pass("root metadata", "홈 기본 title, description, metadataBase가 설정되어 있습니다.");
} else {
  fail("root metadata", "app/layout.tsx의 기본 메타데이터가 부족합니다.");
}

if (layout.includes("openGraph") && layout.includes("manifest") && layout.includes("alternates")) {
  pass("social and canonical metadata", "Open Graph, manifest, canonical 설정이 있습니다.");
} else {
  fail("social and canonical metadata", "Open Graph/manifest/canonical 중 누락된 설정이 있습니다.");
}

if (sitemap.includes("MetadataRoute.Sitemap") && sitemap.includes("/deals/")) {
  pass("sitemap", "사이트맵이 상품 상세 URL을 포함하도록 구성되어 있습니다.");
} else {
  fail("sitemap", "사이트맵에 상품 상세 URL 구성이 부족합니다.");
}

if (robots.includes("MetadataRoute.Robots") && robots.includes("sitemap")) {
  pass("robots", "robots.txt에서 sitemap을 안내합니다.");
} else {
  fail("robots", "robots.txt 메타 라우트 구성이 부족합니다.");
}

if (detail.includes("generateMetadata") && detail.includes("openGraph") && detail.includes("description")) {
  pass("deal detail metadata", "상품 상세 페이지가 동적 metadata를 생성합니다.");
} else {
  fail("deal detail metadata", "상품 상세 페이지 metadata 구성이 부족합니다.");
}

if (detail.includes("application/ld+json") || detail.includes("structuredData") || detail.includes("JsonLd")) {
  pass("structured data readiness", "상품 상세 구조화 데이터 또는 확장 지점이 있습니다.");
} else {
  fail("structured data readiness", "상품 상세 구조화 데이터 확장 지점이 필요합니다.");
}

const titlePages = [
  ["popular", popular],
  ["categories", categories],
  ["mypage", mypage]
];
const missingTitles = titlePages.filter(([, source]) => !source.includes("metadata") && !source.includes("title:")).map(([name]) => name);
if (missingTitles.length) {
  fail("secondary page titles", `메타데이터가 부족한 페이지: ${missingTitles.join(", ")}`);
} else {
  pass("secondary page titles", "주요 보조 페이지에 title metadata가 있습니다.");
}

for (const check of checks) {
  const prefix = check.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(`SEO checks failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`SEO checks passed: ${checks.length}/${checks.length}`);

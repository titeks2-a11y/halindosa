import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outputPath = join(root, "docs/link-coverage-report.md");

function run(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "확인 불가";
  }
}

function percentage(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function extractDeals(source) {
  const deals = [];
  const dealPattern = /deal\(\s*"(?<id>d\d+)"\s*,\s*"(?<mall>[^"]+)"\s*,\s*"(?<title>[^"]+)"\s*,\s*"(?<category>[^"]+)"/g;
  for (const match of source.matchAll(dealPattern)) {
    if (!match.groups) continue;
    deals.push({
      id: match.groups.id,
      mall: match.groups.mall,
      title: match.groups.title,
      category: match.groups.category
    });
  }
  return deals;
}

function extractVerifiedIds(source) {
  return new Set([...source.matchAll(/^\s*(d\d+):\s*{/gm)].map((match) => match[1]));
}

function extractVerifiedEntries(source) {
  const entries = [];
  const pattern = /^\s*(d\d+):\s*\{(?<body>[\s\S]*?)^\s*\},?/gm;
  for (const match of source.matchAll(pattern)) {
    const body = match.groups?.body ?? "";
    const url = body.match(/url:\s*"([^"]+)"/)?.[1] ?? "";
    const sourceType = body.match(/source:\s*"([^"]+)"/)?.[1] ?? "unknown";
    let host = "invalid";
    try {
      host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      host = "invalid";
    }
    entries.push({ id: match[1], url, host, sourceType });
  }
  return entries;
}

function summarizeBy(items, key, verifiedIds) {
  const groups = new Map();
  for (const item of items) {
    const label = item[key];
    const current = groups.get(label) ?? { label, total: 0, verified: 0 };
    current.total += 1;
    if (verifiedIds.has(item.id)) current.verified += 1;
    groups.set(label, current);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "ko"));
}

function summarizeEntriesBy(items, key) {
  const groups = new Map();
  for (const item of items) {
    const label = item[key];
    const current = groups.get(label) ?? { label, total: 0 };
    current.total += 1;
    groups.set(label, current);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "ko"));
}

const mockDeals = await readFile(join(root, "data/mockDeals.ts"), "utf8");
const verifiedPurchaseLinks = await readFile(join(root, "data/verifiedPurchaseLinks.ts"), "utf8");
const deals = extractDeals(mockDeals);
const verifiedIds = extractVerifiedIds(verifiedPurchaseLinks);
const verifiedEntries = extractVerifiedEntries(verifiedPurchaseLinks);
const verifiedDeals = deals.filter((deal) => verifiedIds.has(deal.id));
const needsReviewDeals = deals.filter((deal) => !verifiedIds.has(deal.id));
const generatedAt = new Date().toISOString();
const branch = run("git", ["branch", "--show-current"]);
const commit = run("git", ["rev-parse", "--short", "HEAD"]);
const total = deals.length;
const verified = verifiedDeals.length;
const needsReview = needsReviewDeals.length;
const rate = percentage(verified, total);

const mallRows = summarizeBy(deals, "mall", verifiedIds).map(
  (group) => `| ${group.label} | ${group.total} | ${group.verified} | ${group.total - group.verified} | ${percentage(group.verified, group.total)}% |`
);
const categoryRows = summarizeBy(deals, "category", verifiedIds).map(
  (group) => `| ${group.label} | ${group.total} | ${group.verified} | ${group.total - group.verified} | ${percentage(group.verified, group.total)}% |`
);
const hostRows = summarizeEntriesBy(verifiedEntries, "host").map((group) => `| ${group.label} | ${group.total} |`);
const sourceRows = summarizeEntriesBy(verifiedEntries, "sourceType").map((group) => `| ${group.label} | ${group.total} |`);
const reviewRows = needsReviewDeals.map((deal, index) => {
  const priority = index < 5 ? "P1" : index < 10 ? "P2" : "P3";
  return `| ${priority} | ${deal.id} | ${deal.mall} | ${deal.category} | ${deal.title} | 실제 상품 상세 URL 수동 확인 |`;
});

const lines = [
  "# 할인도사 구매 링크 커버리지 보고서",
  "",
  "이 문서는 출시 전 실제 구매 상세 URL 보강 현황을 빠르게 확인하기 위한 운영 보고서입니다. 검색 결과 URL을 실제 구매 상세 링크처럼 꾸미지 않고, 수동 검수 또는 공식/제휴 피드로 확인된 URL만 검증 링크로 계산합니다.",
  "",
  "## 스냅샷",
  "",
  `- 생성 시각: ${generatedAt}`,
  `- Git 브랜치: ${branch}`,
  `- 기준 커밋: ${commit}`,
  `- 전체 큐레이션 상품: ${total}개`,
  `- 검증된 실제 구매 상세 URL: ${verified}개`,
  `- 링크 확인 필요 단계: ${needsReview}개`,
  `- 검증 커버리지: ${rate}%`,
  `- 검증 링크 도메인 수: ${new Set(verifiedEntries.map((entry) => entry.host)).size}개`,
  "",
  "## 출시 판단",
  "",
  rate === 100
    ? "- 현재 자동 출시 게이트 기준인 100% 검증 커버리지를 충족합니다."
    : "- 현재 자동 출시 게이트 기준인 100% 검증 커버리지에 미달합니다. 상위 노출 상품부터 실제 상품 상세 URL을 보강해야 합니다.",
  needsReview === 0
    ? "- 기본 큐레이션에는 보강 대기 상품이 없으며, 신규 운영 피드는 같은 기준으로 반영 전 검수합니다."
    : "- 보강 대기 상품은 기본 목록 노출 전 운영 링크 검수 큐에서 우선순위에 따라 공식 상세 URL로 보강합니다.",
  "- 새 파트너 피드를 넣을 때는 `affiliateUrl` 또는 `productUrl`에 상품 상세 URL을 우선 저장하고, `searchUrl`은 마지막 fallback으로만 사용합니다.",
  "",
  "## 판매처별 현황",
  "",
  "| 판매처 | 전체 | 검증 링크 | 확인 단계 | 커버리지 |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...mallRows,
  "",
  "## 카테고리별 현황",
  "",
  "| 카테고리 | 전체 | 검증 링크 | 확인 단계 | 커버리지 |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...categoryRows,
  "",
  "## 검증 링크 도메인별 현황",
  "",
  "| 도메인 | 검증 링크 |",
  "| --- | ---: |",
  ...hostRows,
  "",
  "## 검수 출처별 현황",
  "",
  "| 검수 출처 | 검증 링크 |",
  "| --- | ---: |",
  ...sourceRows,
  "",
  "## 보강 대기 상품",
  "",
  needsReviewDeals.length
    ? "| 우선순위 | ID | 판매처 | 카테고리 | 상품명 | 다음 작업 |\n| --- | --- | --- | --- | --- | --- |\n" + reviewRows.join("\n")
    : "보강 대기 상품이 없습니다.",
  "",
  "## 운영 원칙",
  "",
  "- 대표 쇼핑몰 메인 URL, 커뮤니티 게시글 URL, 검색 결과 URL은 검증된 구매 상세 링크로 계산하지 않습니다.",
  "- 실제 상품 상세 URL이 없으면 사용자에게는 자연스러운 판매처 확인 흐름을 제공하되, 내부 운영 보고서에는 보강 대기 상태로 남깁니다.",
  "- 쿠팡파트너스, 제휴 링크, 공식 API가 도입되면 원본 상품 URL과 제휴 변환 URL을 분리해 보관합니다.",
  ""
];

await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Link coverage report written: docs/link-coverage-report.md (${verified}/${total}, ${rate}%)`);

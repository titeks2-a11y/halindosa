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
const validationChecklist = [
  ["상품 상세 URL", "`/products/`, `/vp/products/`, `/goods/`, `/item/`, `goodsNo`, `itemId`처럼 상품 또는 혜택 상세 신호가 있어야 합니다."],
  ["공식 혜택 URL", "무료 샘플, 쿠폰, 멤버십, 포인트 혜택은 판매처 또는 브랜드의 공식 이벤트/혜택 상세 URL만 허용합니다."],
  ["검색 URL", "`/search`, `keyword=`, `query=`, 카테고리/목록 URL은 검증 링크로 계산하지 않습니다."],
  ["커뮤니티/블로그", "뽐뿌, 에펨코리아, 알구몬, 블로그, 뉴스 원문은 출처 참고용일 수 있지만 구매 이동 URL로 등록하지 않습니다."],
  ["대표몰 메인", "쇼핑몰 홈, 앱 메인, 카테고리 메인은 사용자가 다시 찾아야 하므로 기본 상품 목록에 노출하지 않습니다."],
  ["이미지/가격", "상품 이미지, 현재가, 정상가, 혜택 조건, 종료일이 함께 확인된 항목을 우선 노출합니다."]
];
const fixGuideRows = [
  ["missing_direct_link", "`data/verifiedPurchaseLinks.ts`에 해당 ID의 `url`, `checkedAt`, `source`, `evidence`를 추가합니다."],
  ["search_result_url", "판매처에서 실제 상품 상세 또는 공식 혜택 상세 URL을 찾아 `url`을 교체합니다. 검색 URL은 `searchUrl` fallback에만 둡니다."],
  ["redirect_to_home", "대표몰 메인이 아닌 상품/혜택 상세 페이지를 찾아 교체하고, 확인 근거를 `evidence`에 남깁니다."],
  ["community_source", "커뮤니티 글은 내부 참고로만 쓰고 판매처 공식 URL 또는 상품 상세 URL로 바꿉니다."],
  ["broken_url", "http/https URL 형식, 인코딩, 리다이렉트, 품절/종료 여부를 확인한 뒤 정상 URL로 교체합니다."],
  ["manual_review_needed", "상품 상세 신호나 혜택 신청 신호가 부족하므로 운영자가 직접 페이지 성격을 확인하고 근거를 보강합니다."]
].map((row) => `| ${row[0]} | ${row[1]} |`);

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
  "## 신규 상품 URL 검수 체크리스트",
  "",
  "| 항목 | 기준 |",
  "| --- | --- |",
  ...validationChecklist.map((row) => `| ${row[0]} | ${row[1]} |`),
  "",
  "## 실패 사유별 조치",
  "",
  "| 실패 사유 | 운영 조치 |",
  "| --- | --- |",
  ...fixGuideRows,
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

import { readFileSync, writeFileSync } from "node:fs";
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

function includesAll(source, values) {
  return values.every((value) => source.includes(value));
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

const appShell = read("components/AppShell.tsx");
const bottomNavigation = read("components/BottomNavigation.tsx");
const searchBar = read("components/SearchBar.tsx");
const quickDealCard = read("components/QuickDealCard.tsx");
const liveDealFeed = read("components/LiveDealFeed.tsx");
const toast = read("components/Toast.tsx");
const homePage = read("app/page.tsx");
const mobileHeader = read("components/MobileHeader.tsx");
const categoryTabs = read("components/CategoryTabs.tsx");

if (includesAll(appShell, ["max-w-[480px]", "pb-[calc(5rem+env(safe-area-inset-bottom))]", "lg:max-w-7xl"])) {
  pass("mobile shell width and safe area", "모바일 기본 폭과 하단 탭 겹침 방지 padding이 유지됩니다.");
} else {
  fail("mobile shell width and safe area", "모바일 shell 폭 또는 safe-area padding이 부족합니다.");
}

if (includesAll(bottomNavigation, ["fixed bottom-0", "h-14", "min-h-[48px]", "grid-cols-4", "env(safe-area-inset-bottom)"])) {
  pass("bottom nav compactness", "하단 탭은 4개 탭, 56px rail, 48px 이상 터치 영역을 유지합니다.");
} else {
  fail("bottom nav compactness", "하단 탭 높이, 터치 영역, safe-area 기준이 예상과 다릅니다.");
}

if (includesAll(searchBar, ['placeholder="상품명·쇼핑몰 검색"', "h-10", "focus:ring-4", "현재 결과", "추천 검색어"])) {
  pass("compact search", "검색창은 짧은 placeholder, 40px 모바일 높이, 결과 수, 추천 검색어를 유지합니다.");
} else {
  fail("compact search", "검색창 compact 모바일 기준 또는 결과/추천 검색어 표시가 부족합니다.");
}

if (
  countMatches(homePage, /<SearchBar\b/g) <= 2 &&
  includesAll(mobileHeader, ['const showHeaderSearch = pathname !== "/"', 'placeholder="상품명·쇼핑몰 검색"', "h-9"])
) {
  pass("single home search entry", "모바일 홈에는 빠른 검색 1개만 보이고, 하위 화면 헤더 검색과 데스크톱 상세 검색은 compact/hidden 기준을 유지합니다.");
} else {
  fail("single home search entry", "홈 검색창이 중복되었거나 하위 화면 보조 검색 compact 기준이 깨졌습니다.");
}

if (includesAll(homePage, ["INITIAL_HOME_DEAL_LIMIT = 12", "HOME_DEAL_LOAD_STEP = 12", "visibleItems = items.slice(0, visibleDealCount)", "특가 더보기", "showDeepBenefitSections", "혜택 루틴 더보기", "showAdvancedFilterPanel", "상세 필터와 결과 분석 열기", "상세 필터와 결과 분석 접기", "먼저 확인할 상품", "snap-x snap-mandatory", "오늘 바로 볼 특가 가로 목록", "옆으로 넘기기", "bg-gradient-to-l from-white"])) {
  pass("home first screen budget", "초기 렌더 12개 제한, 더보기 확장, 심화 혜택/상세 필터 지연 렌더링, 상단 특가 스냅 레일과 스크롤 신호가 유지됩니다.");
} else {
  fail("home first screen budget", "홈 첫 화면 budget, 더보기 확장, 심화 혜택/상세 필터 지연 렌더링, 상단 특가 스냅 레일 또는 스크롤 신호가 깨졌습니다.");
}

if (
  includesAll(homePage, ["quickCategoryShortcuts", "무료혜택", "오늘특가", "무료배송", "쿠폰"]) &&
  includesAll(categoryTabs, ["overflow-x-auto", "shrink-0", "aria-pressed"])
) {
  pass("category rail compactness", "핵심 카테고리는 모바일 가로 칩으로 유지되고 선택 상태를 스크린리더에 전달합니다.");
} else {
  fail("category rail compactness", "모바일 카테고리 칩 또는 접근성 상태가 부족합니다.");
}

if (includesAll(homePage, ["quickMallFilterChips", "quickPriceFilterChips", "quickBenefitFilterChips", "전체 초기화"])) {
  pass("filter rail consolidation", "쇼핑몰, 가격대, 혜택 필터가 큰 섹션 대신 compact chip rail로 유지됩니다.");
} else {
  fail("filter rail consolidation", "필터가 다시 큰 세로 섹션으로 분리될 위험이 있습니다.");
}

if (includesAll(quickDealCard, ["aspect-[4/3]", "line-clamp-2", "min-h-10", "직접 링크 확인", "primaryCta"])) {
  pass("quick card scanability", "compact 카드가 이미지 비율, 2줄 제목, 터치 CTA, 직접 링크/혜택 신호를 유지합니다.");
} else {
  fail("quick card scanability", "compact 카드의 모바일 스캔 기준이 부족합니다.");
}

if (includesAll(liveDealFeed, ["h-16 w-16", "pr-24", "absolute bottom-3 right-3", "line-clamp-2"])) {
  pass("live row compact actions", "라이브 행은 작은 썸네일, 오른쪽 action cluster, 2줄 제목을 유지합니다.");
} else {
  fail("live row compact actions", "라이브 행의 compact action 배치가 예상과 다릅니다.");
}

if (includesAll(toast, ["top-[calc(0.75rem+env(safe-area-inset-top))]", "max-w-sm", "line-clamp-2", "sm:bottom-6"])) {
  pass("toast does not cover bottom nav", "토스트는 모바일 상단에 떠 하단 탭과 상품 CTA를 가리지 않습니다.");
} else {
  fail("toast does not cover bottom nav", "토스트가 하단 탭 또는 상품 CTA를 가릴 위험이 있습니다.");
}

const failed = checks.filter((check) => !check.ok);
const report = `# 할인도사 Mobile UX Regression Report

Generated: npm run test:mobile-ux
Status: ${failed.length ? "FAIL" : "PASS"}

## Static Mobile Gates

| Check | Result | Detail |
| --- | --- | --- |
${checks.map((check) => `| ${check.name} | ${check.ok ? "PASS" : "FAIL"} | ${check.detail.replaceAll("|", "\\|")} |`).join("\n")}

## Scope

- 360~430px 모바일 화면에서 첫 화면 정보 밀도를 유지하기 위한 정적 회귀 테스트입니다.
- 실제 Playwright 스크린샷을 대체하지는 않지만, 하단 탭 겹침, 과한 검색 영역, 긴 카드, CTA 터치 영역, 토스트 위치 회귀를 빠르게 잡습니다.
- 홈 검색창 중복, 카테고리 칩 rail, 필터 chip rail, 하위 화면 보조 검색 compact 기준도 함께 검사합니다.
- 상품 그리드는 모바일 초기 DOM을 줄이기 위해 12개 먼저 렌더링하고, 더보기로 12개씩 확장하는 구조를 검사합니다.
- 심화 혜택 루틴은 첫 화면 인터랙티브 요소 수를 줄이기 위해 사용자가 더보기를 누른 뒤 렌더링하는 구조를 검사합니다.
- 데스크톱 상세 필터와 결과 분석 패널도 기본 DOM에 올리지 않고 사용자가 펼친 뒤 렌더링하는 구조를 검사합니다.
- 상단 "오늘 바로 볼 특가" 레일은 손가락 스크롤이 어중간하게 멈추지 않도록 snap-x/snap-start 구조와 오른쪽 fade/넘기기 신호를 검사합니다.
- Playwright 도입 전까지 \`npm run test:mobile-ux\`와 \`npm run harness\`가 모바일 UX 안전망 역할을 합니다.
`;

writeFileSync(join(root, "MOBILE_UX_REPORT.md"), report, "utf8");

for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error(`Mobile UX checks failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`Mobile UX checks passed: ${checks.length}/${checks.length}`);

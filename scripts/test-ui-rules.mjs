import { readFileSync } from "node:fs";
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

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

const bottomNavigation = read("components/BottomNavigation.tsx");
const homePage = read("app/page.tsx");
const dealCard = read("components/DealCard.tsx");
const liveDealFeed = read("components/LiveDealFeed.tsx");
const quickDealCard = read("components/QuickDealCard.tsx");
const myPage = read("app/mypage/page.tsx");
const appShell = read("components/AppShell.tsx");
const searchBar = read("components/SearchBar.tsx");

const navItemCount = countMatches(bottomNavigation, /href:\s*"\//g);
if (navItemCount === 4 && bottomNavigation.includes("홈") && bottomNavigation.includes("인기") && bottomNavigation.includes("카테고리") && bottomNavigation.includes("마이")) {
  pass("bottom tabs", "하단 탭은 홈, 인기, 카테고리, 마이 4개로 고정되어 있습니다.");
} else {
  fail("bottom tabs", `하단 탭 구성이 예상과 다릅니다. count=${navItemCount}`);
}

if (/label:\s*"무료혜택"|label:\s*"알림"|label:\s*"찜"/.test(bottomNavigation)) {
  fail("removed standalone tabs", "무료혜택/알림/찜 단독 하단 탭이 남아 있습니다.");
} else {
  pass("removed standalone tabs", "무료혜택, 알림, 찜은 단독 하단 탭으로 노출되지 않습니다.");
}

const forbiddenHrefPattern = /href=\{?["'`](#|javascript:void\(0\)|)["'`]\}?/;
const uiSources = [
  ["app/page.tsx", homePage],
  ["components/DealCard.tsx", dealCard],
  ["components/LiveDealFeed.tsx", liveDealFeed],
  ["components/QuickDealCard.tsx", quickDealCard]
];
const forbiddenHrefFiles = uiSources.filter(([, source]) => forbiddenHrefPattern.test(source)).map(([path]) => path);
if (forbiddenHrefFiles.length) fail("forbidden hrefs", `금지된 href가 있습니다: ${forbiddenHrefFiles.join(", ")}`);
else pass("forbidden hrefs", "구매/탐색 UI에 빈 링크, #, javascript:void(0)가 없습니다.");

const purchaseButtonSources = [dealCard, liveDealFeed, quickDealCard, homePage].join("\n");
if (purchaseButtonSources.includes('target="_blank"') && purchaseButtonSources.includes('rel="noopener noreferrer"')) {
  pass("external purchase navigation", "구매 이동 링크에 새 탭과 noopener noreferrer가 적용되어 있습니다.");
} else {
  fail("external purchase navigation", "구매 이동 링크의 target/rel 속성이 부족합니다.");
}

if (homePage.includes("isVerifiedPurchaseLink(deal)") && homePage.includes("deal.purchaseLinkVerified") && homePage.includes('deal.linkStatus === "verified"')) {
  pass("verified-only home data", "홈 데이터는 검증 링크 필드와 검증 통계를 사용합니다.");
} else {
  fail("verified-only home data", "홈에서 검증 링크 기준을 충분히 확인할 수 없습니다.");
}

const visibleDevelopmentCopy = [
  "개인정보처리방침 준비",
  "이용약관 준비",
  "Android 패키지",
  "앱 아이콘/스플래시 구조",
  "외부 링크 리다이렉트 구조"
].filter((copy) => myPage.includes(copy));

if (visibleDevelopmentCopy.length) {
  fail("mypage production copy", `마이페이지에 개발자용 문구가 남아 있습니다: ${visibleDevelopmentCopy.join(", ")}`);
} else {
  pass("mypage production copy", "마이페이지에 준비/개발자용 문구가 노출되지 않습니다.");
}

const mobileHomeGuard =
  homePage.includes("먼저 확인할 상품") &&
  searchBar.includes("상품명·쇼핑몰 검색") &&
  homePage.includes("상세 필터와 결과 분석 접기") &&
  homePage.includes("group hidden overflow-hidden") &&
  appShell.includes("pb-[calc(5rem+env(safe-area-inset-bottom))]");

if (mobileHomeGuard) pass("mobile compact home", "모바일 홈은 단일 검색, compact 필터, 안전 하단 여백 기준을 갖습니다.");
else fail("mobile compact home", "모바일 compact 홈 구조가 예상과 다릅니다.");

for (const check of checks) {
  const prefix = check.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(`UI rules failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`UI rules passed: ${checks.length}/${checks.length}`);

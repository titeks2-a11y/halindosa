import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const scenePath = join(root, "data/storeScreenshotScenes.ts");
const pagePath = join(root, "app/store-preview/page.tsx");
const guidePath = join(root, "docs/store-assets-guide.md");

const requiredSceneIds = ["home", "search", "detail", "favorites", "notifications", "mypage"];
const requiredCopy = [
  "오늘 먼저 볼 특가",
  "검색과 필터",
  "구매 전 상세 확인",
  "관심 특가 저장",
  "마감임박과 무료배송",
  "정책과 설정"
];

function fail(message) {
  console.error(`FAIL store screenshots: ${message}`);
  process.exit(1);
}

function readRequired(path, label) {
  if (!existsSync(path)) fail(`${label} is missing.`);
  return readFileSync(path, "utf8");
}

const sceneSource = readRequired(scenePath, "data/storeScreenshotScenes.ts");
const pageSource = readRequired(pagePath, "app/store-preview/page.tsx");
const guideSource = readRequired(guidePath, "docs/store-assets-guide.md");

const missingSceneIds = requiredSceneIds.filter((id) => !sceneSource.includes(`id: "${id}"`));
if (missingSceneIds.length) fail(`Missing scene ids: ${missingSceneIds.join(", ")}`);

const missingCopy = requiredCopy.filter((copy) => !sceneSource.includes(copy));
if (missingCopy.length) fail(`Missing scene copy: ${missingCopy.join(", ")}`);

if (!pageSource.includes("index: false") || !pageSource.includes("스크린샷 촬영 보드") || !pageSource.includes("촬영 화면 열기")) {
  fail("Store preview page should be noindex and expose the screenshot capture board.");
}

if (!guideSource.includes("/store-preview") || !guideSource.includes("npm run store:screenshots:doctor")) {
  fail("Store asset guide should reference the capture board and screenshot doctor command.");
}

console.log(`PASS store screenshots: ${requiredSceneIds.length} scenes, noindex preview board, and guide wiring are present.`);

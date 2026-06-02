import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const files = {
  play: "docs/play-store-listing.md",
  appStore: "docs/app-store-checklist.md",
  packet: "docs/store-submission-packet.md",
  review: "docs/store-review-notes.md",
  dataSafety: "docs/data-safety-guide.md",
  contentRating: "docs/content-rating-guide.md"
};

const blockedPhrases = [
  "무조건 최저가",
  "최저가 보장",
  "100% 실시간 보장",
  "공식 판매처 보장",
  "수익 보장",
  "무료 현금",
  "확정 수익"
];

function read(file) {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) throw new Error(`${file} is missing.`);
  return readFileSync(fullPath, "utf8");
}

function section(body, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`## ${escaped}\\s+([\\s\\S]*?)(?=\\n## |$)`));
  return match?.[1]?.trim() ?? "";
}

function charLength(value) {
  return Array.from(value.trim()).length;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const play = read(files.play);
  const appStore = read(files.appStore);
  const packet = read(files.packet);
  const review = read(files.review);
  const dataSafety = read(files.dataSafety);
  const contentRating = read(files.contentRating);
  const allText = [play, appStore, packet, review, dataSafety, contentRating].join("\n");

  const appName = section(play, "앱 이름");
  const shortDescription = section(play, "짧은 설명");
  const longDescription = section(play, "긴 설명");
  const appStoreInfo = section(appStore, "App Store Connect 등록정보");
  const appNameLength = charLength(appName);
  const shortDescriptionLength = charLength(shortDescription);
  const longDescriptionLength = charLength(longDescription);

  assert(appName === "할인도사", `Play Store app name should be 할인도사, got ${appName || "empty"}.`);
  assert(appNameLength <= 30, "Play Store app name should be 30 characters or fewer.");
  assert(shortDescription && shortDescriptionLength <= 80, `Play Store short description should be 1-80 characters, got ${shortDescriptionLength}.`);
  assert(longDescription && longDescriptionLength <= 4000, `Play Store long description should be 1-4000 characters, got ${longDescriptionLength}.`);
  assert(longDescription.includes("직접 결제나 배송을 처리하지 않으며"), "Long description should explain that purchases happen at external sellers.");
  assert(longDescription.includes("가격, 쿠폰, 재고, 배송 조건은 판매처에서 최종 확인"), "Long description should include final seller-condition confirmation guidance.");
  assert(play.includes("개인정보처리방침 URL: 필요"), "Play Store listing should mention privacy policy URL requirement.");
  assert(play.includes("개발자 연락처 이메일: 필요"), "Play Store listing should mention developer contact email requirement.");
  assert(play.includes("쇼핑") && play.includes("라이프스타일"), "Play Store listing should include shopping/lifestyle category guidance.");

  assert(packet.includes("개인정보처리방침 URL: 공개 배포 도메인의 `/privacy`"), "Submission packet should point privacy URL to /privacy.");
  assert(packet.includes("고객 지원: 공개 배포 도메인의 `/support`"), "Submission packet should point support URL to /support.");
  assert(packet.includes("com.halindosa.app"), "Submission packet should include package/bundle id.");
  assert(packet.includes("Play Console 복사 입력 블록"), "Submission packet should include Play Console copy-paste blocks.");
  assert(packet.includes("App Store Connect 복사 입력 블록"), "Submission packet should include App Store Connect copy-paste blocks.");
  assert(packet.includes("npm run env:doctor:production"), "Submission packet should include production env doctor before store submission.");
  assert(packet.includes("npm run test:env"), "Submission packet should include env doctor regression tests before store submission.");
  assert(packet.includes("npm run public:url:doctor"), "Submission packet should include public URL doctor before store submission.");
  assert(packet.includes("https://halindosa.com/privacy") && packet.includes("https://halindosa.com/support"), "Submission packet should include production privacy/support URL placeholders.");
  assert(packet.includes("테스트 계정은 필요하지 않습니다") && packet.includes("No demo account is required"), "Submission packet should include no-demo-account reviewer copy.");
  assert(packet.includes("직접 상품을 판매하거나 결제를 처리하지 않습니다"), "Submission packet should include external seller/payment review copy.");

  assert(appStoreInfo.includes("앱 이름: 할인도사"), "App Store checklist should include app name.");
  assert(appStoreInfo.includes("Bundle Identifier: `com.halindosa.app`") || appStoreInfo.includes("Bundle ID: `com.halindosa.app`"), "App Store checklist should include bundle id.");
  assert(appStoreInfo.includes("기본 카테고리: Shopping"), "App Store checklist should include Shopping category.");
  assert(appStoreInfo.includes("비회원 열람 가능"), "App Store checklist should explain sign-in is optional.");

  const blocked = blockedPhrases.filter((phrase) => allText.includes(phrase));
  assert(blocked.length === 0, `Risky store metadata phrases found: ${blocked.join(", ")}`);

  assert(review.includes("Google Play 앱 액세스") && review.includes("App Store Review Notes"), "Store review notes should include Google Play and App Store reviewer guidance.");
  assert(dataSafety.includes("전화번호") && dataSafety.includes("결제 정보") && dataSafety.includes("위치 정보"), "Data safety guide should cover sensitive data non-collection answers.");
  assert(contentRating.includes("도박") && contentRating.includes("사용자 생성 콘텐츠"), "Content rating guide should cover rating questionnaire answers.");

  const report = [
    "# Store Metadata QA Report",
    "",
    "This report records non-secret Play Console and App Store Connect metadata checks.",
    "",
    "## Length Checks",
    "",
    "| Field | Limit | Current | Status |",
    "| --- | ---: | ---: | --- |",
    `| Play app name | 30 | ${appNameLength} | PASS |`,
    `| Play short description | 80 | ${shortDescriptionLength} | PASS |`,
    `| Play long description | 4000 | ${longDescriptionLength} | PASS |`,
    "",
    "## Required Review Copy",
    "",
    "| Topic | Status | Evidence |",
    "| --- | --- | --- |",
    "| App access | PASS | Guest review is documented and demo account is not required |",
    "| External seller/payment handling | PASS | Copy says the app does not sell products or process payments directly |",
    "| Final price/stock confirmation | PASS | Copy tells users to confirm seller conditions before purchase |",
    "| Privacy policy URL requirement | PASS | Play listing and submission packet mention the public privacy URL |",
    "| Developer contact requirement | PASS | Play listing mentions developer contact email |",
    "| App Store category | PASS | Shopping category and optional login are documented |",
    "| Data safety | PASS | Sensitive data non-collection answers are covered |",
    "| Content rating | PASS | Gambling and user-generated content answers are covered |",
    "",
    "## Risky Phrase Scan",
    "",
    blockedPhrases.length
      ? blockedPhrases.map((phrase) => `- ${phrase}: not present`).join("\n")
      : "- No blocked phrases configured.",
    "",
    "## Manual Work That Must Not Be Faked",
    "",
    "- Paste the final short and long descriptions into Play Console and App Store Connect exactly after reviewing current screenshots.",
    "- Confirm the public privacy/support URLs are reachable before store submission.",
    "- Re-run this doctor after any change to listing copy, review notes, data safety, or content rating documents.",
    "- Do not paste store-console credentials, tester passwords, OAuth secrets, or support mailbox passwords into repository documents.",
    ""
  ].join("\n");

  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "STORE_METADATA_REPORT.md"), report, "utf8");
  writeFileSync(join(root, "docs", "STORE_METADATA_REPORT.md"), report, "utf8");

  console.log(`PASS store metadata: app name ${appNameLength} chars, short description ${shortDescriptionLength} chars, long description ${longDescriptionLength} chars.`);
} catch (error) {
  console.error(`FAIL store metadata: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const jsonPath = "STORE_MANUAL_CHECKLIST.json";
const markdownPath = "docs/STORE_MANUAL_CHECKLIST.md";

const requiredIds = [
  "play-signed-aab-upload",
  "public-privacy-support-urls",
  "device-qa-record",
  "store-screenshots-upload",
  "oauth-provider-production-config",
  "play-data-safety-content-rating",
  "app-store-privacy-review-notes"
];

const requiredMarkdownPhrases = [
  "Store Manual Submission Checklist",
  "Play Console에 signed AAB 업로드",
  "공개 개인정보처리방침과 고객지원 URL 외부 접속 확인",
  "Android/iOS 실기기 QA 기록 작성",
  "스토어 스크린샷 촬영 및 콘솔 업로드",
  "Google/Kakao/Naver OAuth Provider 운영 Redirect URL 설정",
  "Manual Work That Must Not Be Faked",
  "Do not mark Play Console or App Store Connect upload complete",
  "Do not record keystore passwords",
  "Do not replace missing public URLs with localhost"
];

const blockedPhrases = [
  "Play Console upload complete: PASS",
  "App Store Connect upload complete: PASS",
  "real-device QA passed",
  "signed AAB uploaded",
  "localhost/privacy",
  "127.0.0.1/privacy",
  "example.com/privacy"
];

function fail(message) {
  console.error(`FAIL store manual checklist: ${message}`);
  process.exit(1);
}

function read(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) fail(`${path} is missing. Run npm run store:manual:checklist.`);
  return readFileSync(fullPath, "utf8");
}

const markdown = read(markdownPath);
const jsonText = read(jsonPath);

let payload;
try {
  payload = JSON.parse(jsonText);
} catch (error) {
  fail(`${jsonPath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

const manualItems = Array.isArray(payload.manualItems) ? payload.manualItems : [];
const missingIds = requiredIds.filter((id) => !manualItems.some((item) => item.id === id));
const missingMarkdown = requiredMarkdownPhrases.filter((phrase) => !markdown.includes(phrase));
const blocked = blockedPhrases.filter((phrase) => markdown.includes(phrase) || jsonText.includes(phrase));
const missingCritical = manualItems.filter((item) => item.priority === "critical").length < 2;
const missingProof = manualItems.filter((item) => !item.proof || !item.blockingReason || !item.owner || !item.title);
const missingNoFakeRule = !Array.isArray(payload.manualWorkThatMustNotBeFaked) || payload.manualWorkThatMustNotBeFaked.length < 3;

if (missingIds.length) fail(`Missing required manual item IDs: ${missingIds.join(", ")}`);
if (missingMarkdown.length) fail(`Markdown missing required phrases: ${missingMarkdown.join(", ")}`);
if (blocked.length) fail(`Checklist should not claim external completion or use local/example URLs: ${blocked.join(", ")}`);
if (missingCritical) fail("Checklist should include at least two critical manual work items.");
if (missingProof.length) fail(`Manual items need title, owner, proof, and blockingReason: ${missingProof.map((item) => item.id ?? "unknown").join(", ")}`);
if (missingNoFakeRule) fail("Checklist should include at least three Manual Work That Must Not Be Faked rules.");

console.log(`PASS store manual checklist: ${manualItems.length} manual items, ${manualItems.filter((item) => item.priority === "critical").length} critical items, no unsafe completion claims.`);

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const productionOrigin = "https://halindosa.com";
const requiredPublicPaths = ["/privacy", "/support", "/terms", "/guide"];

function fail(message) {
  console.error(`FAIL public URL: ${message}`);
  process.exit(1);
}

function read(path) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) fail(`${path} is missing.`);
  return readFileSync(fullPath, "utf8");
}

const layout = read("app/layout.tsx");
const sitemap = read("app/sitemap.ts");
const robots = read("app/robots.ts");
const envExample = read(".env.example");
const storePacket = read("docs/store-submission-packet.md");
const storeReviewNotes = read("docs/store-review-notes.md");
const deploymentChecklist = read("docs/deployment-env-checklist.md");
const releaseChecklist = read("docs/release-checklist.md");
const launchDayChecklist = read("docs/launch-day-checklist.md");
const privacyPage = read("app/privacy/page.tsx");
const supportPage = read("app/support/page.tsx");
const supportConfig = read("lib/support.ts");
const testSeo = read("scripts/test-seo.mjs");
const smoke = read("scripts/smoke.mjs");

if (!layout.includes("metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? \"https://halindosa.com\")")) {
  fail("Root metadataBase should default to https://halindosa.com and respect NEXT_PUBLIC_SITE_URL.");
}

if (!robots.includes("NEXT_PUBLIC_SITE_URL") || !robots.includes("sitemap.xml")) {
  fail("robots.ts should derive sitemap URL from NEXT_PUBLIC_SITE_URL.");
}

if (!sitemap.includes("NEXT_PUBLIC_SITE_URL") || !sitemap.includes("MetadataRoute.Sitemap")) {
  fail("sitemap.ts should derive public URLs from NEXT_PUBLIC_SITE_URL.");
}

const missingSitemapPaths = requiredPublicPaths.filter((path) => !sitemap.includes(`"${path}"`));
if (missingSitemapPaths.length) fail(`sitemap.ts is missing public policy/support paths: ${missingSitemapPaths.join(", ")}`);

const requiredStoreUrls = [`${productionOrigin}/privacy`, `${productionOrigin}/support`];
const missingStoreUrls = requiredStoreUrls.filter((url) => !storePacket.includes(url));
if (missingStoreUrls.length) fail(`Store submission packet should include production URL placeholders: ${missingStoreUrls.join(", ")}`);

const blockedStoreOrigins = ["localhost", "127.0.0.1", "YOUR-VERCEL-DOMAIN", "example.com"];
const blockedInSubmission = blockedStoreOrigins.filter((origin) => storePacket.includes(origin));
if (blockedInSubmission.length) fail(`Store submission packet should not include local/example origins: ${blockedInSubmission.join(", ")}`);

const requiredReviewCopy = [
  "공개 개인정보처리방침 URL이 외부 네트워크에서 열림",
  "비회원 상태에서 홈, 검색, 상세, 찜, 알림, 마이 화면 접근 가능"
];
const missingReviewCopy = requiredReviewCopy.filter((snippet) => !storeReviewNotes.includes(snippet));
if (missingReviewCopy.length) fail(`Store review notes should include public URL/manual access checks. Missing: ${missingReviewCopy.join(", ")}`);

const requiredEnvCopy = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_AUTH_REDIRECT_URL",
  "https://",
  "/auth/callback",
  "공개 개인정보처리방침 URL"
];
const missingEnvCopy = requiredEnvCopy.filter((snippet) => !deploymentChecklist.includes(snippet));
if (missingEnvCopy.length) fail(`Deployment env checklist should guide public URL setup. Missing: ${missingEnvCopy.join(", ")}`);

const requiredReleaseCopy = [
  "npm run public:url:doctor",
  "공개 개인정보처리방침/고객지원 URL",
  "/privacy",
  "/support",
  "/sitemap.xml",
  "/robots.txt"
];
const missingReleaseCopy = requiredReleaseCopy.filter((snippet) => !releaseChecklist.includes(snippet));
if (missingReleaseCopy.length) fail(`Release checklist should include public submission URL checks. Missing: ${missingReleaseCopy.join(", ")}`);

const requiredLaunchCopy = [
  "npm run public:url:doctor",
  "개인정보처리방침/고객지원 공개 URL",
  "/privacy",
  "/support",
  "/sitemap.xml",
  "/robots.txt"
];
const missingLaunchCopy = requiredLaunchCopy.filter((snippet) => !launchDayChecklist.includes(snippet));
if (missingLaunchCopy.length) fail(`Launch day checklist should include public URL verification. Missing: ${missingLaunchCopy.join(", ")}`);

if (!/^NEXT_PUBLIC_SITE_URL=/m.test(envExample) || !/^NEXT_PUBLIC_AUTH_REDIRECT_URL=/m.test(envExample)) {
  fail(".env.example should expose public site and auth redirect keys.");
}

if (!privacyPage.includes("할인도사 개인정보처리방침") || !privacyPage.includes("사용자 권리") || !privacyPage.includes("문의")) {
  fail("/privacy page should include policy title, user rights, and inquiry guidance.");
}

if (!supportPage.includes("고객센터") || !supportPage.includes("개인정보처리방침") || !supportPage.includes("이용약관")) {
  fail("/support page should include customer center copy and links to privacy/terms.");
}

if (!supportConfig.includes("NEXT_PUBLIC_SUPPORT_EMAIL") || !supportConfig.includes("support@halindosa.com")) {
  fail("Support email should be centralized and production-looking.");
}

if (!testSeo.includes("sitemap") || !testSeo.includes("robots") || !smoke.includes("/sitemap.xml") || !smoke.includes("/robots.txt")) {
  fail("SEO and smoke tests should cover sitemap and robots public URL surfaces.");
}

const report = [
  "# Public URL Submission Report",
  "",
  "This report records the non-secret public URL surfaces that must be reachable before Play Console and App Store Connect submission.",
  "",
  "## Expected Production URLs",
  "",
  "| Surface | URL | Repository status | External-network status |",
  "| --- | --- | --- | --- |",
  `| Privacy policy | \`${productionOrigin}/privacy\` | Present in app, sitemap, and store packet | Pending manual check |`,
  `| Customer support | \`${productionOrigin}/support\` | Present in app, sitemap, and store packet | Pending manual check |`,
  `| Terms | \`${productionOrigin}/terms\` | Present in app and sitemap | Pending manual check |`,
  `| Service guide | \`${productionOrigin}/guide\` | Present in app and sitemap | Pending manual check |`,
  `| Sitemap | \`${productionOrigin}/sitemap.xml\` | Covered by smoke and SEO checks | Pending manual check |`,
  `| Robots | \`${productionOrigin}/robots.txt\` | Covered by smoke and SEO checks | Pending manual check |`,
  "",
  "## Automated Guardrails",
  "",
  "- `metadataBase`, sitemap, and robots derive from `NEXT_PUBLIC_SITE_URL`.",
  "- Store submission copy uses production-looking privacy and support URL placeholders, not localhost or example domains.",
  "- `/privacy` includes the policy title, user rights, and inquiry guidance.",
  "- `/support` links to privacy and terms pages.",
  "- `.env.example` documents `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_AUTH_REDIRECT_URL`.",
  "- SEO and smoke checks cover sitemap and robots surfaces.",
  "",
  "## Manual Work That Must Not Be Faked",
  "",
  "- Deploy the public domain before entering URLs in Play Console or App Store Connect.",
  "- Confirm `/privacy`, `/support`, `/terms`, `/guide`, `/sitemap.xml`, and `/robots.txt` from an external network.",
  "- Replace the placeholder domain with the real production domain if `halindosa.com` is not the final domain.",
  "- Keep any DNS provider credentials, Vercel tokens, Supabase keys, and store-console credentials out of this repository.",
  ""
].join("\n");

mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "PUBLIC_URL_REPORT.md"), report, "utf8");
writeFileSync(join(root, "docs", "PUBLIC_URL_REPORT.md"), report, "utf8");

console.log("PASS public URL: privacy/support URLs, metadata, sitemap, robots, store copy, and deployment checklist are aligned for public submission.");

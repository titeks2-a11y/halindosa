import { existsSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const outputPath = join(root, "docs/release-evidence.md");

function run(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "확인 불가";
  }
}

function sizeOf(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? statSync(fullPath).size : 0;
}

function formatBytes(bytes) {
  if (!bytes) return "없음";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  if (bytes < 1024) return `${bytes}B`;
  return `${Math.round(bytes / 1024)}KB`;
}

const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const capacitor = await readFile(join(root, "capacitor.config.ts"), "utf8");
const androidGradle = await readFile(join(root, "android/app/build.gradle"), "utf8");
const latestCommit = run("git", ["rev-parse", "--short", "HEAD"]);
const branch = run("git", ["branch", "--show-current"]);
const status = (run("git", ["status", "--short"]) || "clean").replace(/\r?\n/g, "; ");
const generatedAt = new Date().toISOString();

const appId = capacitor.match(/appId:\s*['"]([^'"]+)/)?.[1] ?? "확인 필요";
const appName = capacitor.match(/appName:\s*['"]([^'"]+)/)?.[1] ?? "확인 필요";
const webDir = capacitor.match(/webDir:\s*['"]([^'"]+)/)?.[1] ?? "확인 필요";
const versionCode = androidGradle.match(/versionCode\s+(\d+)/)?.[1] ?? "확인 필요";
const versionName = androidGradle.match(/versionName\s+["']([^"']+)/)?.[1] ?? "확인 필요";

const artifacts = [
  ["Debug APK", "android/app/build/outputs/apk/debug/app-debug.apk"],
  ["Release AAB", "android/app/build/outputs/bundle/release/app-release.aab"],
  ["Play Store icon", "assets/store/play-store-icon-512.png"],
  ["Feature graphic", "assets/store/feature-graphic-1024x500.png"],
  ["iOS App icon", "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"],
  ["iOS privacy manifest", "ios/App/App/PrivacyInfo.xcprivacy"],
  ["Commercial audit report", "docs/AUDIT_REPORT.md"],
  ["Environment doctor report", "docs/ENV_DOCTOR_REPORT.md"],
  ["Public URL submission report", "docs/PUBLIC_URL_REPORT.md"],
  ["Store metadata QA report", "docs/STORE_METADATA_REPORT.md"],
  ["Store asset QA report", "docs/STORE_ASSETS_REPORT.md"],
  ["Device QA execution manifest", "docs/DEVICE_QA_MANIFEST.md"],
  ["Device QA execution manifest JSON", "DEVICE_QA_MANIFEST.json"],
  ["Device QA readiness report", "docs/DEVICE_QA_REPORT.md"],
  ["Store submission readiness report", "docs/STORE_SUBMISSION_REPORT.md"],
  ["Store submission packet QA report", "docs/STORE_PACKET_REPORT.md"],
  ["Store console fields manifest", "docs/STORE_CONSOLE_FIELDS.md"],
  ["Store console fields manifest JSON", "STORE_CONSOLE_FIELDS.json"],
  ["Store manual submission checklist", "docs/STORE_MANUAL_CHECKLIST.md"],
  ["Store manual submission checklist JSON", "STORE_MANUAL_CHECKLIST.json"],
  ["Store launch handoff report", "docs/STORE_HANDOFF_REPORT.md"],
  ["Release notes", "docs/RELEASE_NOTES.md"],
  ["Release notes JSON", "RELEASE_NOTES.json"],
  ["Support playbook", "docs/SUPPORT_PLAYBOOK.md"],
  ["Support playbook JSON", "SUPPORT_PLAYBOOK.json"],
  ["Known issues report", "docs/KNOWN_ISSUES.md"],
  ["Known issues report root copy", "KNOWN_ISSUES.md"],
  ["Store screenshot QA report", "docs/STORE_SCREENSHOTS_REPORT.md"],
  ["Store screenshot manifest", "docs/STORE_SCREENSHOT_MANIFEST.md"],
  ["Store screenshot manifest JSON", "STORE_SCREENSHOT_MANIFEST.json"],
  ["Harness report", "docs/HARNESS_REPORT.md"],
  ["Operational health readiness report", "docs/HEALTH_READINESS_REPORT.md"],
  ["Operational health readiness JSON", "reports/health-readiness.json"],
  ["Push readiness report", "docs/PUSH_READINESS_REPORT.md"],
  ["Push readiness JSON", "reports/push-readiness.json"],
  ["Push delivery policy report", "docs/PUSH_DELIVERY_POLICY.md"],
  ["Push delivery policy JSON", "reports/push-delivery-policy.json"],
  ["Link quality regression JSON", "reports/link-quality-regression.json"],
  ["Image backlog report", "docs/IMAGE_BACKLOG_REPORT.md"],
  ["Image backlog CSV", "IMAGE_BACKLOG.csv"],
  ["Image backlog next batch CSV", "IMAGE_BACKLOG_NEXT_BATCH.csv"],
  ["Image backlog mall request CSV", "IMAGE_BACKLOG_MALL_REQUESTS.csv"],
  ["Link coverage report", "docs/link-coverage-report.md"]
];

const lines = [
  "# 할인도사 릴리즈 증빙",
  "",
  "이 문서는 Play Store/App Store 제출 전 자동 검증 결과와 산출물 위치를 한곳에 남기기 위한 스냅샷입니다.",
  "",
  "## 기본 정보",
  "",
  `- 생성 시각: ${generatedAt}`,
  `- Git 브랜치: ${branch}`,
  `- 최신 커밋: ${latestCommit}`,
  `- Git 상태: ${status}`,
  `- 패키지 버전: ${pkg.version}`,
  `- 앱 이름: ${appName}`,
  `- 앱 ID / 패키지명: ${appId}`,
  `- Capacitor webDir: ${webDir}`,
  `- Android versionCode: ${versionCode}`,
  `- Android versionName: ${versionName}`,
  "",
  "## 산출물",
  "",
  "| 항목 | 경로 | 크기 |",
  "| --- | --- | --- |",
  ...artifacts.map(([label, path]) => `| ${label} | \`${path}\` | ${formatBytes(sizeOf(path))} |`),
  "",
  "## 제출 전 검증 명령",
  "",
  "아래 명령은 릴리즈 후보를 확인할 때 사용합니다.",
  "",
  "```bash",
  "npm install",
  "npm run env:doctor",
  "npm run env:doctor:production",
  "npm run test:env",
  "npm run public:url:doctor",
  "npm run device:qa:manifest",
  "npm run device:qa:doctor",
  "npm run android:signing:doctor",
  "npm run image:backlog:report",
  "npm run store:screenshots:manifest",
  "npm run store:console:fields",
  "npm run store:manual:checklist",
  "npm run store:manual:doctor",
  "npm run store:handoff:report",
  "npm run health:readiness",
  "npm run release:notes",
  "npm run support:playbook",
  "npm run known:issues",
  "npm run harness",
  "npm run qa:release",
  "npm run android:bundle",
  "npm run release:evidence",
  "```",
  "",
  "## 자동 검증 범위",
  "",
  "- harness: lint, build, 링크/이미지/검색/UI/모바일/SEO/성능/smoke/release doctor 종합 검증",
  "- lint, smoke, Next.js build, release doctor",
  "- environment doctor: 공개 URL, OAuth redirect, Supabase, 운영 토큰, 데이터 모드 점검",
  "- production environment doctor: 공개 HTTPS URL, 동일 origin OAuth callback, 운영 Supabase/토큰 placeholder 차단",
  "- env doctor regression: localhost, OAuth callback origin 불일치, 위험한 앱 스킴 차단 검증",
  "- public URL doctor: /privacy, /support, sitemap, robots, 스토어 제출 URL 문구 일관성 점검",
  "- commercial security audit: npm audit 취약점 0건 기준 차단",
  "- device QA doctor: 실제 기기 기록 템플릿, 구매 링크 샘플, 남은 Critical Issue 기록 기준 점검",
  "- Android signing doctor: 로컬 keystore 미커밋, signing config 예시, release AAB 서명 준비 기준 점검",
  "- Android 정적 export 및 Capacitor Android sync",
  "- Capacitor iOS sync",
  "- performance budget: 정적 export, JS/CSS, APK/AAB, 스토어 이미지 크기 검사",
  "- operational health readiness: 상품 링크, 공식 혜택 카테고리, refresh:all, 24시간 신선도 기준 점검",
  "- Android/iOS 앱 ID, 버전, 아이콘, 스플래시, 권한, 딥링크, 개인정보 manifest 점검",
  "- 구매 링크 커버리지 보고서: 검증된 실제 구매 상세 URL과 보강 대기 상품 목록 점검",
  "- 정책 페이지, 스토어 등록 문서, 데이터 보안/콘텐츠 등급/스크린샷 가이드 점검",
  "",
  "## 남은 수동 확인",
  "",
  "- Android Studio 또는 Play Console에서 signed AAB 업로드",
  "- macOS/Xcode에서 iOS Archive 및 App Store Connect 업로드",
  "- docs/device-qa-checklist.md 기준 실제 기기에서 홈, 검색, 상세, 찜, 알림, 마이, 외부 브라우저 이동 확인",
  "- docs/deployment-env-checklist.md 기준 운영 환경변수 strict 점검",
  "- Supabase OAuth Provider와 공개 개인정보처리방침/고객지원 URL을 운영 값으로 설정",
  "- 공개 도메인에서 /privacy, /support, /sitemap.xml, /robots.txt 외부 네트워크 접근 확인",
  "- Android release keystore를 로컬 파일 또는 Android Studio signing wizard로 설정하고 signed AAB 생성",
  "- 링크 검수 큐 상위 상품의 실제 구매 URL 직접 확인",
  ""
];

await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Release evidence written: docs/release-evidence.md`);

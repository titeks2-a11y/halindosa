import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const reportPath = join(reportsDir, "free-benefit-feed-handoff.json");
const docsPath = join(docsDir, "FREE_BENEFIT_FEED_HANDOFF.md");

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const starterPack = readJson(join(reportsDir, "free-benefit-feed-starter-pack.json"), {});
const feedEnv = readJson(join(reportsDir, "source-feed-env-readiness.json"), {});
const canary = readJson(join(reportsDir, "news-feed-canary.json"), {});
const transition = readJson(join(reportsDir, "feed-transition.json"), {});

const packs = Array.isArray(starterPack.packs) ? starterPack.packs : [];
const requiredLaneIds = [
  "free-now",
  "convenience",
  "beauty-sample",
  "food-cafe",
  "shopping-coupon",
  "pay-point",
  "all-user-first-come",
  "attendance-mission",
  "signup-welcome",
  "culture-invite",
  "pet-experience",
  "optional-public-culture",
  "optional-education"
];
const envKeys = unique([
  ...(Array.isArray(starterPack.summary?.envKeys) ? starterPack.summary.envKeys : []),
  "BENEFIT_REFRESH_FEED_URLS",
  "PUBLIC_COUPON_FEED_URLS",
  "OFFICIAL_EVENT_FEED_URLS",
  "TELECOM_MEMBERSHIP_FEED_URLS",
  "CONVENIENCE_BENEFIT_FEED_URLS",
  "BEAUTY_SAMPLE_FEED_URLS",
  "CAFE_FRANCHISE_COUPON_FEED_URLS",
  "PAY_POINT_BENEFIT_FEED_URLS",
  "PET_SAMPLE_FEED_URLS",
  "SIGNUP_GIFT_FEED_URLS",
  "BENEFIT_REFRESH_APPROVED_HOSTS",
  "HALINDOSA_APPROVED_FEED_HOSTS",
  "CRON_SECRET"
]);

const lanes = packs.map((pack) => ({
  id: pack.id,
  label: pack.label,
  envKeys: pack.envKeys ?? [],
  audience: pack.audience ?? "consumer",
  optional: pack.optional === true,
  candidateCount: pack.candidateCount ?? 0,
  reachableCount: pack.reachableCount ?? 0,
  guardedCount: pack.guardedCount ?? 0,
  firstAction: pack.firstAction,
  firstReachableCandidates: (pack.candidates ?? [])
    .filter((candidate) => candidate.liveStatus === "reachable")
    .slice(0, 3)
    .map((candidate) => ({
      label: candidate.label,
      provider: candidate.provider,
      officialUrl: candidate.officialUrl,
      action: candidate.feedConnectionAction
    }))
}));

const issues = [];
if (starterPack.ok !== true) issues.push("source:starter:pack 리포트가 통과 상태가 아닙니다.");
if (packs.length < requiredLaneIds.length) issues.push(`무료혜택 starter lane이 ${requiredLaneIds.length}개 미만입니다.`);
for (const laneId of requiredLaneIds) {
  if (!packs.some((pack) => pack.id === laneId)) issues.push(`무료혜택 starter lane 누락: ${laneId}`);
}
if (!envKeys.includes("BENEFIT_REFRESH_FEED_URLS")) issues.push("BENEFIT_REFRESH_FEED_URLS 안내가 누락됐습니다.");
if (!envKeys.includes("PUBLIC_COUPON_FEED_URLS")) issues.push("PUBLIC_COUPON_FEED_URLS 안내가 누락됐습니다.");
if (!envKeys.includes("OFFICIAL_EVENT_FEED_URLS")) issues.push("OFFICIAL_EVENT_FEED_URLS 안내가 누락됐습니다.");
if (!envKeys.includes("CONVENIENCE_BENEFIT_FEED_URLS")) issues.push("CONVENIENCE_BENEFIT_FEED_URLS 안내가 누락됐습니다.");
if (!envKeys.includes("BEAUTY_SAMPLE_FEED_URLS")) issues.push("BEAUTY_SAMPLE_FEED_URLS 안내가 누락됐습니다.");
if (!envKeys.includes("PAY_POINT_BENEFIT_FEED_URLS")) issues.push("PAY_POINT_BENEFIT_FEED_URLS 안내가 누락됐습니다.");
if (!envKeys.includes("OPTIONAL_PUBLIC_BENEFIT_FEED_URLS")) issues.push("OPTIONAL_PUBLIC_BENEFIT_FEED_URLS 선택 운영 안내가 누락됐습니다.");
if (!envKeys.includes("CRON_SECRET")) issues.push("CRON_SECRET 운영 안내가 누락됐습니다.");

const configuredFeedUrls = Number(feedEnv.configuredFeedUrls ?? feedEnv.summary?.configuredFeedUrls ?? 0);
const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  starterPack: {
    ok: starterPack.ok === true,
    catalogCount: starterPack.catalogCount ?? 0,
    laneCount: packs.length,
    totalCandidates: starterPack.summary?.totalCandidates ?? 0,
    reachableCandidates: starterPack.summary?.reachableCandidates ?? 0,
    guardedCandidates: starterPack.summary?.guardedCandidates ?? 0
  },
  feedEnv: {
    configuredFeedUrls,
    checkedKeys: feedEnv.checkedKeys ?? feedEnv.feedKeys ?? [],
    approvedExtraHosts: feedEnv.approvedExtraHosts ?? []
  },
  canary: {
    status: canary.status ?? "unknown",
    configuredFeedUrls: canary.configuredFeedUrls ?? 0,
    visibleCandidateCount: canary.visibleCandidateCount ?? 0
  },
  transition: {
    status: transition.status ?? "unknown",
    configuredProviders: transition.configuredProviders ?? 0,
    launchBlockingCount: transition.launchBlockingCount ?? 0
  },
  envKeys,
  requiredLaneIds,
  lanes,
  verificationCommands: [
    "npm run source:starter:pack",
    "npm run source:feed-env:doctor",
    "npm run news:feed:canary",
    "npm run refresh:news",
    "npm run verify:news",
    "npm run refresh:benefits",
    "npm run security:check",
    "npm run smoke:local"
  ],
  issues
};

function buildDocs(data) {
  const lines = [
    "# 무료혜택 Feed 운영 핸드오프",
    "",
    `- 생성 시각: ${data.generatedAt}`,
    `- starter lane: ${data.starterPack.laneCount}개`,
    `- 연결 후보: ${data.starterPack.totalCandidates}개`,
    `- 접근 가능 후보: ${data.starterPack.reachableCandidates}개`,
    `- 보호/승인 필요 후보: ${data.starterPack.guardedCandidates}개`,
    `- 현재 설정된 feed URL: ${data.feedEnv.configuredFeedUrls}개`,
    `- canary 상태: ${data.canary.status}`,
    "",
    "## 목적",
    "",
    "할인도사는 공식 API, RSS, Atom, 승인 파트너 JSON feed를 통해 무료혜택, 쿠폰, 샘플, 체험, 전원증정 정보를 갱신한다. 이 문서는 seed fallback에서 실제 운영 feed로 넘어갈 때 필요한 환경변수와 검증 순서를 한 장으로 정리한다.",
    "",
    "## Vercel Environment Variables",
    "",
    "| Key | 용도 | 입력 기준 |",
    "| --- | --- | --- |",
    "| BENEFIT_REFRESH_FEED_URLS | 오늘 바로 받는 무료혜택, 전원증정, 샘플, 체험단 우선 feed | 공식 API/RSS/Atom/승인 JSON endpoint만 입력 |",
    "| PUBLIC_COUPON_FEED_URLS | 소비자 쿠폰, 포인트, 기프티콘, 멤버십 feed | 검색 결과, 커뮤니티 글, HTML 메인 페이지 금지 |",
    "| OFFICIAL_EVENT_FEED_URLS | 브랜드 공식 이벤트, 편의점, 뷰티, 외식 쿠폰 feed | 공식 이벤트 확인 페이지가 아니라 machine-readable feed endpoint 입력 |",
    "| TELECOM_MEMBERSHIP_FEED_URLS | 통신사 멤버십 무료 쿠폰, 기프티콘, 포인트 feed | SKT, KT, LG U+ 공식/승인 feed만 입력 |",
    "| CONVENIENCE_BENEFIT_FEED_URLS | 편의점 전원증정, 앱 쿠폰, 1+1·2+1 행사 feed | CU, GS25, 세븐일레븐, 이마트24 공식/승인 feed만 입력 |",
    "| BEAUTY_SAMPLE_FEED_URLS | 뷰티 샘플, 무료체험, 쿠폰 feed | 올리브영, 아모레몰, 닥터지 등 공식/승인 feed만 입력 |",
    "| CAFE_FRANCHISE_COUPON_FEED_URLS | 카페·프랜차이즈 쿠폰, 스탬프, 기프티콘 feed | 브랜드 공식/승인 feed만 입력 |",
    "| PAY_POINT_BENEFIT_FEED_URLS | 페이·포인트·캐시백·출석체크 feed | 네이버페이, 카카오페이, 토스 등 공식/승인 feed만 입력 |",
    "| PET_SAMPLE_FEED_URLS | 반려동물 샘플, 체험팩, 쿠폰 feed | 브랜드 공식/승인 feed만 입력 |",
    "| SIGNUP_GIFT_FEED_URLS | 신규가입 쿠폰, 웰컴 포인트, 가입 기프티콘 feed | 추천인 홍보글과 광고 랜딩은 금지 |",
    "| OPTIONAL_PUBLIC_BENEFIT_FEED_URLS | 공공·교육 무료혜택 선택 운영 feed | 기본 홈 feed에는 섞지 않고 명시 필터/별도 화면에서만 사용 |",
    "| BENEFIT_REFRESH_APPROVED_HOSTS | BENEFIT_REFRESH_FEED_URLS에 쓰는 승인 host | host 이름만 입력, 토큰/query 금지 |",
    "| HALINDOSA_APPROVED_FEED_HOSTS | 공통 승인 feed host allowlist | 공식 카탈로그에 없는 승인 feed host만 추가 |",
    "| CRON_SECRET | /api/cron/refresh, /api/cron/benefits 보호 | Vercel Cron과 서버에서만 쓰는 랜덤 secret |",
    "",
    "## 연결 순서",
    "",
    "1. `npm run source:starter:pack`으로 lane별 후보와 env 템플릿을 재생성한다.",
    "2. `reports/free-benefit-feed-starter-pack.env`에서 필요한 키를 Vercel Environment Variables에 복사한다.",
    "3. officialUrl을 그대로 넣지 말고 담당자 승인 JSON/RSS/API feed endpoint만 넣는다.",
    "4. 새 host가 공식 소스 카탈로그에 없으면 host만 `BENEFIT_REFRESH_APPROVED_HOSTS` 또는 `HALINDOSA_APPROVED_FEED_HOSTS`에 추가한다.",
    "5. 공공·교육 feed는 `OPTIONAL_PUBLIC_BENEFIT_FEED_URLS`에만 연결해 기본 소비자 홈 feed와 섞지 않는다.",
    "6. `CRON_SECRET`을 Production/Preview에 설정하고 Vercel Cron이 `/api/cron/benefits`와 `/api/cron/refresh`를 호출하게 둔다.",
    "7. 아래 검증 명령을 순서대로 실행한다.",
    "",
    "```bash",
    ...data.verificationCommands,
    "```",
    "",
    "## Starter Lane별 첫 연결",
    "",
    "| Lane | 운영 구분 | Env | 후보 | 접근 가능 | 승인 필요 | 첫 작업 |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
    ...data.lanes.map(
      (lane) =>
        `| ${lane.label} | ${lane.optional ? "선택" : "기본"} | ${lane.envKeys.join("<br>")} | ${lane.candidateCount} | ${lane.reachableCount} | ${lane.guardedCount} | ${lane.firstAction} |`
    ),
    "",
    "## 바로 확인할 후보",
    ""
  ];

  for (const lane of data.lanes) {
    lines.push(`### ${lane.label}`);
    lines.push("");
    if (!lane.firstReachableCandidates.length) {
      lines.push("- 접근 가능한 후보가 없습니다. guarded 후보는 담당자 승인 feed를 먼저 요청합니다.");
      lines.push("");
      continue;
    }
    for (const candidate of lane.firstReachableCandidates) {
      lines.push(`- ${candidate.label}: ${candidate.officialUrl}`);
    }
    lines.push("");
  }

  lines.push("## 금지 원칙");
  lines.push("");
  lines.push("- 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인 URL은 feed로 쓰지 않는다.");
  lines.push("- 공식 HTML 이벤트 페이지를 무단 스크래핑하지 않는다. 사람이 검수하는 기준 URL로만 사용한다.");
  lines.push("- 토큰, API 키, 세션 값이 들어간 URL은 문서나 리포트에 남기지 않는다.");
  lines.push("- 검증 실패 feed는 홈, 카테고리, 알림, 무료혜택 페이지 어디에도 노출하지 않는다.");
  lines.push("");

  if (data.issues.length) {
    lines.push("## 이슈");
    lines.push("");
    for (const issue of data.issues) lines.push(`- ${issue}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(docsPath, buildDocs(report), "utf8");

if (issues.length) {
  console.error("Free benefit feed handoff failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Free benefit feed handoff written.");
console.log(`- lanes: ${report.starterPack.laneCount}`);
console.log(`- env keys: ${report.envKeys.length}`);
console.log(`- configured feed URLs: ${report.feedEnv.configuredFeedUrls}`);
console.log("- reports/free-benefit-feed-handoff.json");
console.log("- docs/FREE_BENEFIT_FEED_HANDOFF.md");

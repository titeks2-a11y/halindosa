import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const catalogPath = join(root, "data", "officialSourceCatalog.json");
const liveReportPath = join(root, "reports", "official-source-live-check.json");
const jsonPath = join(reportsDir, "free-benefit-feed-starter-pack.json");
const envPath = join(reportsDir, "free-benefit-feed-starter-pack.env");
const vercelCommandsPath = join(reportsDir, "free-benefit-feed-vercel-env-commands.md");
const githubActionsCommandsPath = join(reportsDir, "free-benefit-feed-github-actions-commands.md");
const docsPath = join(docsDir, "FREE_BENEFIT_FEED_STARTER_PACK.md");
const firstPartyVerifiedFeedUrl = "https://www.halindosa.com/api/feeds/free-benefits";

const lanes = [
  {
    id: "free-now",
    label: "오늘 바로 받는 무료혜택",
    envKeys: ["BENEFIT_REFRESH_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"],
    categories: ["무료혜택", "카드/멤버십", "외식/배달", "패션/뷰티", "마트/편의점"],
    keywords: ["무료", "샘플", "체험", "0원", "포인트", "전원", "증정", "쿠폰"],
    audience: "consumer",
    excludeCategories: ["정부/공공혜택"]
  },
  {
    id: "convenience",
    label: "편의점 1+1·2+1",
    envKeys: ["CONVENIENCE_BENEFIT_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"],
    categories: ["마트/편의점"],
    keywords: ["GS25", "CU", "세븐일레븐", "이마트24", "1+1", "2+1"],
    audience: "consumer"
  },
  {
    id: "beauty-sample",
    label: "뷰티 샘플·체험",
    envKeys: ["BEAUTY_SAMPLE_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"],
    categories: ["패션/뷰티", "무료혜택"],
    keywords: ["올리브영", "이니스프리", "아모레", "라운드랩", "샘플", "체험", "쿠폰", "뷰티"],
    audience: "consumer"
  },
  {
    id: "food-cafe",
    label: "카페·외식 쿠폰",
    envKeys: ["CAFE_FRANCHISE_COUPON_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS", "DEAL_EVENT_NEWS_FEED_URLS"],
    categories: ["외식/배달"],
    keywords: ["스타벅스", "이디야", "메가", "배민", "요기요", "쿠폰", "배달", "외식", "무료배송"],
    audience: "consumer"
  },
  {
    id: "shopping-coupon",
    label: "쇼핑몰·브랜드 쿠폰",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"],
    categories: ["무료혜택", "식품/생필품", "패션/뷰티", "디지털/가전"],
    keywords: ["롯데ON", "11번가", "G마켓", "옥션", "SSG", "컬리", "오늘의집", "무신사", "쿠폰", "무료배송", "이벤트"],
    audience: "consumer",
    excludeCategories: ["정부/공공혜택"]
  },
  {
    id: "pay-point",
    label: "페이·포인트·캐시백",
    envKeys: ["PAY_POINT_BENEFIT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS"],
    categories: ["카드/멤버십", "무료혜택"],
    keywords: ["네이버페이", "카카오페이", "토스", "페이코", "OK캐쉬백", "L.POINT", "CJ ONE", "페이", "포인트", "캐시백", "멤버십", "카드", "적립"],
    audience: "consumer"
  },
  {
    id: "all-user-first-come",
    label: "전원증정·선착순",
    envKeys: ["BENEFIT_REFRESH_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS"],
    categories: ["무료혜택", "카드/멤버십", "마트/편의점", "패션/뷰티"],
    keywords: ["전원", "선착순", "증정", "샘플", "쿠폰", "0원", "무료"],
    audience: "consumer"
  },
  {
    id: "attendance-mission",
    label: "출석체크·룰렛·미션",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS"],
    categories: ["카드/멤버십", "무료혜택", "외식/배달"],
    keywords: ["출석", "룰렛", "미션", "포인트", "캐시백", "적립", "앱"],
    audience: "consumer"
  },
  {
    id: "signup-welcome",
    label: "신규가입·웰컴 쿠폰",
    envKeys: ["SIGNUP_GIFT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS"],
    categories: ["무료혜택", "카드/멤버십", "외식/배달", "패션/뷰티"],
    keywords: ["신규", "가입", "웰컴", "welcome", "첫구매", "앱 설치", "쿠폰"],
    audience: "consumer"
  },
  {
    id: "culture-invite",
    label: "기프티콘·문화초대권",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS"],
    categories: ["영화/문화", "무료혜택", "외식/배달", "카드/멤버십"],
    keywords: ["문화초대", "초대", "기프티콘", "무료", "공연", "전시", "영화", "응모"],
    audience: "consumer",
    excludeCategories: ["정부/공공혜택"]
  },
  {
    id: "pet-experience",
    label: "반려동물·체험단",
    envKeys: ["PET_SAMPLE_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS"],
    categories: ["무료혜택", "식품/생필품", "패션/뷰티"],
    keywords: ["반려", "강아지", "고양이", "체험단", "샘플", "리뷰"],
    audience: "consumer"
  },
  {
    id: "optional-public-culture",
    label: "선택 운영: 공공·문화 무료",
    envKeys: ["OPTIONAL_PUBLIC_BENEFIT_FEED_URLS"],
    categories: ["정부/공공혜택", "영화/문화", "무료혜택"],
    keywords: ["문화", "정부", "복지", "무료", "전시", "강좌", "지원"],
    audience: "optional_public"
  },
  {
    id: "optional-education",
    label: "선택 운영: 교육 무료체험",
    envKeys: ["OPTIONAL_PUBLIC_BENEFIT_FEED_URLS"],
    categories: ["정부/공공혜택", "무료혜택"],
    keywords: ["K-MOOC", "고용24", "HRD", "교육", "강좌", "훈련"],
    audience: "optional_public"
  }
];

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function textFor(source) {
  return [
    source.id,
    source.label,
    source.provider,
    source.sourceType,
    Array.isArray(source.category) ? source.category.join(" ") : source.category,
    source.allowedUse,
    source.blockedUse,
    source.notes,
    source.officialUrl
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function liveById(liveReport) {
  return new Map((Array.isArray(liveReport.sources) ? liveReport.sources : []).map((source) => [source.id, source]));
}

function scoreCandidate(source, live, lane) {
  const categories = Array.isArray(source.category) ? source.category : [];
  const haystack = textFor(source);
  let score = 0;
  const reasons = [];

  const excludedCategoryMatches = categories.filter((category) => (lane.excludeCategories ?? []).includes(category)).length;
  if (excludedCategoryMatches) {
    score -= excludedCategoryMatches * 80;
    reasons.push(`excluded-category:${excludedCategoryMatches}`);
  }

  if (lane.audience === "consumer" && categories.includes("정부/공공혜택")) {
    score -= 70;
    reasons.push("consumer-feed-public-penalty");
  }

  const categoryMatches = categories.filter((category) => lane.categories.includes(category)).length;
  if (categoryMatches) {
    score += categoryMatches * 18;
    reasons.push(`category:${categoryMatches}`);
  }

  const keywordMatches = lane.keywords.filter((keyword) => haystack.includes(keyword.toLowerCase())).length;
  if (keywordMatches) {
    score += keywordMatches * 8;
    reasons.push(`keyword:${keywordMatches}`);
  }

  const preferredEnvMatches = (source.preferredEnvKeys ?? []).filter((envKey) => lane.envKeys.includes(envKey)).length;
  if (preferredEnvMatches) {
    score += preferredEnvMatches * 10;
    reasons.push(`env:${preferredEnvMatches}`);
  }

  if (source.priority === "high") {
    score += 14;
    reasons.push("priority:high");
  } else if (source.priority === "medium") {
    score += 8;
    reasons.push("priority:medium");
  }

  if (live?.status === "reachable") {
    score += 12;
    reasons.push("reachable");
  } else if (live?.status === "guarded") {
    score += 5;
    reasons.push("guarded");
  } else if (live?.status === "stale_or_removed") {
    score -= 100;
    reasons.push("stale");
  }

  const integration = String(source.integrationMethod ?? "");
  if (/json|rss|api|partner/i.test(integration)) {
    score += 8;
    reasons.push("feed-ready-method");
  }

  return { score, reasons };
}

function buildLanePack(catalog, liveMap, lane) {
  const seenCandidateKeys = new Set();
  const candidates = catalog
    .map((source) => {
      const live = liveMap.get(source.id);
      const { score, reasons } = scoreCandidate(source, live, lane);
      return {
        id: source.id,
        label: source.label,
        provider: source.provider,
        categories: source.category ?? [],
        officialUrl: source.officialUrl,
        preferredEnvKeys: source.preferredEnvKeys ?? [],
        integrationMethod: source.integrationMethod,
        liveStatus: live?.status ?? "not_checked",
        liveReason: live?.reason ?? "",
        httpStatus: live?.httpStatus ?? null,
        score,
        reasons,
        feedConnectionAction:
          live?.status === "guarded"
            ? "무단 수집하지 말고 브랜드/제휴 담당자 승인 JSON/RSS/API feed로 연결"
            : "공식 URL을 기준으로 담당자 승인 JSON/RSS/API feed를 만든 뒤 env에 연결",
        guardrail: "검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인, HTML 랜딩만 있는 URL은 운영 feed로 사용하지 않음"
      };
    })
    .filter((source) => source.score > 20 && source.liveStatus !== "stale_or_removed")
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "ko"))
    .filter((source) => {
      const key = `${source.officialUrl ?? ""}`.toLowerCase().replace(/^https?:\/\/(?:www\.)?/, "");
      if (!key) return true;
      if (seenCandidateKeys.has(key)) return false;
      seenCandidateKeys.add(key);
      return true;
    })
    .slice(0, 8);

  return {
    id: lane.id,
    label: lane.label,
    envKeys: lane.envKeys,
    categories: lane.categories,
    keywords: lane.keywords,
    audience: lane.audience ?? "consumer",
    optional: lane.audience === "optional_public",
    candidateCount: candidates.length,
    reachableCount: candidates.filter((candidate) => candidate.liveStatus === "reachable").length,
    guardedCount: candidates.filter((candidate) => candidate.liveStatus === "guarded").length,
    firstAction:
      candidates.some((candidate) => candidate.liveStatus === "reachable")
        ? `${lane.envKeys[0]}에 승인 JSON/RSS/API feed부터 연결`
        : "guarded 후보는 무단 크롤링하지 말고 제휴/담당자 승인 feed를 먼저 요청",
    candidates
  };
}

function buildEnvTemplate(packs) {
  const envKeys = [...new Set(packs.flatMap((pack) => pack.envKeys))].sort();
  const lines = [
    "# 할인도사 무료혜택 운영 feed starter pack",
    "# 공식 API, RSS, Atom, 승인 파트너 JSON feed endpoint만 입력합니다.",
    "# 공식 이벤트 HTML 페이지는 참고 URL일 뿐이며, 무단 스크래핑용 feed로 직접 넣지 않습니다.",
    "# 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인, 광고 랜딩 URL은 금지입니다.",
    `# 운영 self-feed smoke/starter: BENEFIT_REFRESH_FEED_URLS=${firstPartyVerifiedFeedUrl}`,
    ""
  ];

  for (const envKey of envKeys) {
    const relatedPacks = packs.filter((pack) => pack.envKeys.includes(envKey));
    const examples = relatedPacks
      .flatMap((pack) => pack.candidates.slice(0, 2).map((candidate) => `${pack.label}: ${candidate.label}`))
      .slice(0, 5);
    lines.push(`# ${envKey}`);
    lines.push(`# 연결 축: ${relatedPacks.map((pack) => pack.label).join(" / ")}`);
    lines.push(`# 대표 후보: ${examples.join(" / ")}`);
    lines.push(`${envKey}=`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildVercelEnvCommands(packs) {
  const envKeys = [...new Set(packs.flatMap((pack) => pack.envKeys))].sort();
  const requiredKeys = envKeys.filter((key) => key !== "OPTIONAL_PUBLIC_BENEFIT_FEED_URLS");
  const optionalKeys = envKeys.filter((key) => key === "OPTIONAL_PUBLIC_BENEFIT_FEED_URLS");
  const lines = [
    "# 할인도사 Vercel 무료혜택 Feed Env 연결 명령서",
    "",
    "이 파일은 `npm run source:starter:pack`이 자동 생성합니다. 값은 비워두고 명령만 제공합니다.",
    "Vercel CLI가 값을 물어보면 공식 API, RSS, Atom, 승인 파트너 JSON feed endpoint만 입력합니다.",
    `할인도사 first-party verified feed를 smoke/starter 값으로 쓸 때는 \`${firstPartyVerifiedFeedUrl}\`를 \`BENEFIT_REFRESH_FEED_URLS\`에 넣습니다.`,
    "",
    "## 먼저 확인",
    "",
    "```bash",
    "npx vercel env ls",
    "npm run source:feed-env:doctor",
    "```",
    "",
    "## Production 필수 feed 키",
    "",
    "아래 명령은 대화형입니다. secret이나 feed URL은 터미널 프롬프트에 직접 입력하고 파일에 저장하지 않습니다.",
    `첫 연결 smoke 값: \`BENEFIT_REFRESH_FEED_URLS=${firstPartyVerifiedFeedUrl}\``,
    "",
    "```bash",
    ...requiredKeys.flatMap((key) => [
      `npx vercel env add ${key} production`,
      `npx vercel env add ${key} preview`
    ]),
    "npx vercel env add CRON_SECRET production",
    "npx vercel env add HALINDOSA_CRON_SECRET production",
    "```",
    "",
    "## 선택 feed 키",
    "",
    "공공·교육 무료혜택은 기본 홈 상단에 섞지 않고 별도 필터가 필요할 때만 연결합니다.",
    "",
    "```bash",
    ...(optionalKeys.length
      ? optionalKeys.flatMap((key) => [
          `npx vercel env add ${key} production`,
          `npx vercel env add ${key} preview`
        ])
      : ["# 선택 feed 키 없음"]),
    "```",
    "",
    "## 연결 후 검증",
    "",
    "```bash",
    "npm run source:feed-env:doctor",
    "npm run news:feed:canary",
    "npm run refresh:news",
    "npm run verify:news",
    "npm run refresh:benefits",
    "npm run smoke:local",
    "npm run release:doctor",
    "```",
    "",
    "## 금지",
    "",
    "- 검색 결과 URL, 커뮤니티 글, 블로그, 쇼핑몰 메인, HTML 이벤트 랜딩만 있는 URL은 넣지 않습니다.",
    "- officialUrl은 사람이 확인하는 기준 URL입니다. 운영 env에는 machine-readable feed endpoint만 넣습니다.",
    "- 토큰, API key, 세션 값이 붙은 URL은 docs/reports에 남기지 않습니다.",
    "- 새 host가 카탈로그에 없으면 host만 `HALINDOSA_APPROVED_FEED_HOSTS` 또는 `BENEFIT_REFRESH_APPROVED_HOSTS`에 추가하고 승인 근거를 문서화합니다.",
    ""
  ];

  return `${lines.join("\n")}\n`;
}

function buildGithubActionsCommands() {
  const lines = [
    "# 할인도사 GitHub Actions 무료혜택 자동 갱신 연결 명령서",
    "",
    "이 파일은 `npm run source:starter:pack`이 자동 생성합니다. 값은 비워두고 명령만 제공합니다.",
    "`Benefit Refresh Scheduler`는 `CRON_SECRET` 또는 `HALINDOSA_CRON_SECRET`이 있어야 30분마다 운영 `/api/cron/benefits`를 호출합니다.",
    "",
    "## GitHub CLI로 secret/variable 연결",
    "",
    "```bash",
    "gh auth status",
    "gh secret set CRON_SECRET --repo titeks2-a11y/halindosa",
    "gh secret set HALINDOSA_CRON_SECRET --repo titeks2-a11y/halindosa",
    "gh variable set HALINDOSA_SITE_URL --repo titeks2-a11y/halindosa --body https://www.halindosa.com",
    "```",
    "",
    "## 수동 실행 및 운영 확인",
    "",
    "```bash",
    "gh workflow run \"Benefit Refresh Scheduler\" --repo titeks2-a11y/halindosa",
    "gh workflow run \"Benefit Refresh Scheduler\" --repo titeks2-a11y/halindosa -f force_live_feed=true -f minimum_visible_benefits=100",
    "gh run list --workflow \"Benefit Refresh Scheduler\" --repo titeks2-a11y/halindosa --limit 5",
    "curl -fsS https://www.halindosa.com/api/health",
    `curl -fsS "${firstPartyVerifiedFeedUrl}?limit=2"`,
    "curl -fsS \"https://www.halindosa.com/api/freebies?limit=5\"",
    "```",
    "",
    "## 운영 규칙",
    "",
    "- GitHub secret에는 cron token만 넣고 공식 feed URL은 Vercel env에 넣습니다.",
    "- workflow 로그에는 secret 값이 찍히지 않아야 합니다.",
    "- `HALINDOSA_SITE_URL`은 운영 도메인 `https://www.halindosa.com`을 유지합니다.",
    "- 공식 feed URL을 새로 연결한 직후에는 `force_live_feed=true`로 수동 실행해 정각을 기다리지 않고 live feed를 검증합니다.",
    "- `minimum_visible_benefits`는 운영 feed 전환 직후 안전 기준을 올리거나 낮춰 테스트할 때만 조정합니다.",
    "- 운영 `/api/health`에서 configured official feed URLs와 external feed items가 늘어나는지 확인합니다.",
    "- 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인을 feed로 넣어 자동 갱신하지 않습니다.",
    ""
  ];

  return `${lines.join("\n")}\n`;
}

function buildDocs(report) {
  const lines = [
    "# 무료혜택 운영 Feed Starter Pack",
    "",
    `- 생성 시각: ${report.generatedAt}`,
    `- 공식 소스 후보: ${report.catalogCount}개`,
    `- starter lane: ${report.packs.length}개`,
    `- 연결 후보: ${report.summary.totalCandidates}개`,
    `- 접근 가능 후보: ${report.summary.reachableCandidates}개`,
    `- 보호/승인 필요 후보: ${report.summary.guardedCandidates}개`,
    "",
    "## 사용 방법",
    "",
    "1. 아래 후보의 officialUrl은 사람이 확인하는 기준 URL입니다.",
    "2. 운영 env에는 officialUrl을 그대로 긁는 주소가 아니라 공식 API, RSS, Atom, 승인 파트너 JSON feed endpoint만 넣습니다.",
    `3. 첫 연결 smoke/starter 값으로 \`${firstPartyVerifiedFeedUrl}\`를 \`BENEFIT_REFRESH_FEED_URLS\`에 넣을 수 있습니다. 이 endpoint는 공식·검증·publishable 무료혜택만 내보냅니다.`,
    "4. `reports/free-benefit-feed-starter-pack.env`를 복사해 Vercel Environment Variables에 필요한 키만 채웁니다.",
    "5. `reports/free-benefit-feed-vercel-env-commands.md`의 대화형 Vercel CLI 명령으로 Production/Preview env를 연결합니다.",
    "6. `reports/free-benefit-feed-github-actions-commands.md`로 30분 주기 GitHub Actions 갱신 secret과 운영 URL variable을 연결합니다.",
    "7. 공식 feed URL을 새로 연결한 직후에는 GitHub Actions를 `force_live_feed=true`로 수동 실행해 정각을 기다리지 않고 운영 `/api/cron/refresh?mode=liveFeed`를 검증합니다.",
    "8. 연결 후 `npm run source:feed-env:doctor && npm run news:feed:canary && npm run refresh:news && npm run verify:news`를 실행합니다.",
    "9. 기본 운영 feed는 소비자 브랜드/쇼핑몰/프랜차이즈/멤버십 무료혜택을 우선합니다. 공공·교육 lane은 별도 탭 또는 명시 필터가 필요할 때만 선택 연결합니다.",
    "",
    "## Starter Lane",
    "",
    "| Lane | 운영 구분 | Env | 후보 | 접근 가능 | 보호/승인 필요 | 첫 작업 |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
    ...report.packs.map(
      (pack) =>
        `| ${pack.label} | ${pack.optional ? "선택" : "기본"} | ${pack.envKeys.join("<br>")} | ${pack.candidateCount} | ${pack.reachableCount} | ${pack.guardedCount} | ${pack.firstAction} |`
    ),
    "",
    "## 우선 후보",
    ""
  ];

  for (const pack of report.packs) {
    lines.push(`### ${pack.label}`);
    lines.push("");
    lines.push(`- env: ${pack.envKeys.join(", ")}`);
    lines.push(`- 첫 작업: ${pack.firstAction}`);
    lines.push("");
    lines.push("| 후보 | 상태 | 권장 작업 | 공식 확인 URL |");
    lines.push("| --- | --- | --- | --- |");
    for (const candidate of pack.candidates.slice(0, 6)) {
      lines.push(`| ${candidate.label} | ${candidate.liveStatus} | ${candidate.feedConnectionAction} | ${candidate.officialUrl} |`);
    }
    lines.push("");
  }

  lines.push("## 금지 원칙");
  lines.push("");
  lines.push("- 검색 결과, 커뮤니티 글, 블로그, 쇼핑몰 메인 URL은 운영 feed로 쓰지 않습니다.");
  lines.push("- 보호/로그인/WAF 페이지는 자동 수집하지 않고 공식 API, RSS, 제휴 feed, 담당자 승인 JSON으로 전환합니다.");
  lines.push("- finalUrl은 실제 쿠폰 받기, 이벤트 참여, 샘플 신청, 출석체크, 무료체험 페이지로만 연결합니다.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

const catalog = readJson(catalogPath, []);
const liveReport = readJson(liveReportPath, {});
const liveMap = liveById(liveReport);
const issues = [];

if (!Array.isArray(catalog)) {
  issues.push("data/officialSourceCatalog.json must be an array.");
}

const packs = lanes.map((lane) => buildLanePack(Array.isArray(catalog) ? catalog : [], liveMap, lane));
for (const pack of packs) {
  if (pack.candidateCount < 3) {
    issues.push(`${pack.label} starter pack needs at least 3 candidates, got ${pack.candidateCount}.`);
  }
  if (!pack.optional) {
    const publicCandidates = pack.candidates.filter((candidate) => (candidate.categories ?? []).includes("정부/공공혜택"));
    if (publicCandidates.length) {
      issues.push(`${pack.label} 기본 lane에 공공/정책 후보가 섞였습니다: ${publicCandidates.map((candidate) => candidate.label).join(", ")}`);
    }
  }
}

const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  catalogCount: Array.isArray(catalog) ? catalog.length : 0,
  packs,
  summary: {
    totalCandidates: packs.reduce((total, pack) => total + pack.candidateCount, 0),
    reachableCandidates: packs.reduce((total, pack) => total + pack.reachableCount, 0),
    guardedCandidates: packs.reduce((total, pack) => total + pack.guardedCount, 0),
    envKeys: [...new Set(packs.flatMap((pack) => pack.envKeys))].sort()
  },
  issues
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(envPath, buildEnvTemplate(packs), "utf8");
writeFileSync(vercelCommandsPath, buildVercelEnvCommands(packs), "utf8");
writeFileSync(githubActionsCommandsPath, buildGithubActionsCommands(), "utf8");
writeFileSync(docsPath, buildDocs(report), "utf8");

if (issues.length) {
  console.error("Free benefit feed starter pack failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Free benefit feed starter pack written.");
console.log(`- lanes: ${packs.length}`);
console.log(`- candidates: ${report.summary.totalCandidates}`);
console.log(`- env keys: ${report.summary.envKeys.length}`);
console.log("- reports/free-benefit-feed-starter-pack.json");
console.log("- reports/free-benefit-feed-starter-pack.env");
console.log("- reports/free-benefit-feed-vercel-env-commands.md");
console.log("- reports/free-benefit-feed-github-actions-commands.md");
console.log("- docs/FREE_BENEFIT_FEED_STARTER_PACK.md");

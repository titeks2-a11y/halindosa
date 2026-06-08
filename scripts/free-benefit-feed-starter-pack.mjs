import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const catalogPath = join(root, "data", "officialSourceCatalog.json");
const liveReportPath = join(root, "reports", "official-source-live-check.json");
const jsonPath = join(reportsDir, "free-benefit-feed-starter-pack.json");
const envPath = join(reportsDir, "free-benefit-feed-starter-pack.env");
const docsPath = join(docsDir, "FREE_BENEFIT_FEED_STARTER_PACK.md");

const lanes = [
  {
    id: "free-now",
    label: "오늘의 무료혜택",
    envKeys: ["BENEFIT_REFRESH_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"],
    categories: ["무료혜택", "정부/공공혜택", "카드/멤버십"],
    keywords: ["무료", "샘플", "체험", "0원", "포인트", "전원", "증정"]
  },
  {
    id: "convenience",
    label: "편의점 1+1·2+1",
    envKeys: ["OFFICIAL_EVENT_FEED_URLS", "DEAL_EVENT_FEED_URLS"],
    categories: ["마트/편의점"],
    keywords: ["GS25", "CU", "세븐일레븐", "이마트24", "1+1", "2+1"]
  },
  {
    id: "beauty-sample",
    label: "뷰티 샘플·체험",
    envKeys: ["OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS"],
    categories: ["패션/뷰티", "무료혜택"],
    keywords: ["올리브영", "이니스프리", "샘플", "체험", "쿠폰", "뷰티"]
  },
  {
    id: "food-cafe",
    label: "카페·외식 쿠폰",
    envKeys: ["OFFICIAL_EVENT_FEED_URLS", "PUBLIC_COUPON_FEED_URLS", "DEAL_EVENT_NEWS_FEED_URLS"],
    categories: ["외식/배달"],
    keywords: ["스타벅스", "이디야", "메가", "쿠폰", "배달", "외식", "무료배송"]
  },
  {
    id: "pay-point",
    label: "페이·포인트·캐시백",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "BENEFIT_REFRESH_FEED_URLS"],
    categories: ["카드/멤버십", "무료혜택"],
    keywords: ["페이", "포인트", "캐시백", "멤버십", "카드", "적립"]
  },
  {
    id: "public-culture",
    label: "공공·문화 무료",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "DEAL_NEWS_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS"],
    categories: ["정부/공공혜택", "영화/문화", "무료혜택"],
    keywords: ["문화", "정부", "복지", "무료", "전시", "강좌", "지원"]
  },
  {
    id: "education",
    label: "교육 무료체험",
    envKeys: ["PUBLIC_COUPON_FEED_URLS", "DEAL_NEWS_FEED_URLS"],
    categories: ["정부/공공혜택", "무료혜택"],
    keywords: ["K-MOOC", "고용24", "HRD", "교육", "강좌", "훈련"]
  },
  {
    id: "pet-experience",
    label: "반려동물·체험단",
    envKeys: ["BENEFIT_REFRESH_FEED_URLS", "OFFICIAL_EVENT_FEED_URLS"],
    categories: ["무료혜택", "패션/뷰티"],
    keywords: ["반려", "강아지", "고양이", "체험단", "샘플", "리뷰"]
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
    "3. `reports/free-benefit-feed-starter-pack.env`를 복사해 Vercel Environment Variables에 필요한 키만 채웁니다.",
    "4. 연결 후 `npm run source:feed-env:doctor && npm run news:feed:canary && npm run refresh:news && npm run verify:news`를 실행합니다.",
    "",
    "## Starter Lane",
    "",
    "| Lane | Env | 후보 | 접근 가능 | 보호/승인 필요 | 첫 작업 |",
    "| --- | --- | ---: | ---: | ---: | --- |",
    ...report.packs.map(
      (pack) =>
        `| ${pack.label} | ${pack.envKeys.join("<br>")} | ${pack.candidateCount} | ${pack.reachableCount} | ${pack.guardedCount} | ${pack.firstAction} |`
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
console.log("- docs/FREE_BENEFIT_FEED_STARTER_PACK.md");

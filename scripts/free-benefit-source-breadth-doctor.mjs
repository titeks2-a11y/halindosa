import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const docsDir = join(root, "docs");
const catalogPath = join(root, "data", "officialSourceCatalog.json");
const liveReportPath = join(root, "reports", "official-source-live-check.json");
const reportPath = join(root, "reports", "free-benefit-source-breadth.json");
const docsPath = join(root, "docs", "FREE_BENEFIT_SOURCE_BREADTH.md");

const requiredLanes = [
  {
    id: "telecom",
    label: "통신사 멤버십",
    minimum: 3,
    patterns: [/skt|t멤버십|tmembership|kt|uplus|u\+/i]
  },
  {
    id: "convenience",
    label: "편의점",
    minimum: 4,
    patterns: [/gs25|\bcu\b|cu-|세븐일레븐|7-eleven|emart24|이마트24/i]
  },
  {
    id: "beauty",
    label: "뷰티·헬스",
    minimum: 6,
    patterns: [/oliveyoung|올리브영|amore|아모레|innisfree|닥터지|drg|roundlab|라운드랩|powderroom|파우더룸|musinsa|무신사|kurly.*beauty|컬리.*뷰티|lotteon|롯데on/i]
  },
  {
    id: "cafe-franchise",
    label: "카페·프랜차이즈",
    minimum: 6,
    patterns: [/starbucks|스타벅스|twosome|투썸|ediya|이디야|megacoffee|mega.?mgc|메가커피|메가mgc|mcdonald|맥도날드|kfc|bhc|domino|도미노|pizza|피자|subway|써브웨이|baskin|배스킨|던킨|dunkin|paris|파리바게뜨|pascucci|파스쿠찌/i]
  },
  {
    id: "delivery",
    label: "배달·외식 쿠폰",
    minimum: 3,
    patterns: [/baemin|배민|요기요|yogiyo|coupang.?eats|쿠팡이츠|delivery|배달/i]
  },
  {
    id: "pay-point",
    label: "금융·페이·포인트",
    minimum: 8,
    patterns: [/naverpay|네이버페이|kakaopay|카카오페이|toss|토스|payco|페이코|okcashbag|ok캐쉬백|cjone|cj one|happy.?point|해피포인트|lpoint|l\.point|card|카드|멤버십/i]
  },
  {
    id: "mart",
    label: "대형마트·장보기",
    minimum: 5,
    patterns: [/emart|이마트|homeplus|홈플러스|lotte.?mart|롯데마트|ssg|컬리|kurly|cjthemarket|cj더마켓|ikea/i]
  },
  {
    id: "open-market",
    label: "오픈마켓·쇼핑몰",
    minimum: 5,
    patterns: [/11st|11번가|gmarket|g마켓|auction|옥션|lotteon|롯데온|daiso|다이소|danawa|다나와|tenbyten|10x10|hmall|hyundaihmall|현대hmall|musinsa|무신사|kurly|컬리/i]
  },
  {
    id: "public-culture",
    label: "문화·공공기관",
    minimum: 8,
    patterns: [/문화|culture|seoul|서울|gov24|정부24|bokjiro|복지로|mnuri|문화가.?있는.?날|visitkorea|cgv|megabox|메가박스|lotteworld|롯데월드|everland|에버랜드/i]
  },
  {
    id: "education",
    label: "교육 무료체험",
    minimum: 2,
    patterns: [/kmooc|k-mooc|kocw|work24|고용24|hrd|내일배움|ebs|교육|강좌|훈련/i]
  },
  {
    id: "pet",
    label: "반려동물 샘플",
    minimum: 3,
    patterns: [/royalcanin|로얄캐닌|purina|퓨리나|pet|반려|강아지|고양이/i]
  },
  {
    id: "experience-panel",
    label: "체험단·샘플",
    minimum: 3,
    patterns: [/체험단|샘플|sample|experience|review|리뷰|powderroom|파우더룸|sample.?market|샘플마켓/i]
  }
];

const requiredBrandSignals = [
  { id: "skt", label: "SKT T멤버십", patterns: [/skt|t멤버십|tmembership/i] },
  { id: "kt", label: "KT 멤버십", patterns: [/\bkt\b|kt멤버십|kt membership/i] },
  { id: "lguplus", label: "LG U+", patterns: [/lg u\+|lguplus|uplus|유플러스/i] },
  { id: "cu", label: "CU", patterns: [/\bcu\b|cu-|bgfretail/i] },
  { id: "gs25", label: "GS25", patterns: [/gs25|gsretail/i] },
  { id: "seven-eleven", label: "세븐일레븐", patterns: [/세븐일레븐|7-eleven|7eleven/i] },
  { id: "emart24", label: "이마트24", patterns: [/emart24|이마트24/i] },
  { id: "oliveyoung", label: "올리브영", patterns: [/oliveyoung|올리브영/i] },
  { id: "amore", label: "아모레몰", patterns: [/amore|아모레/i] },
  { id: "roundlab", label: "라운드랩", patterns: [/roundlab|라운드랩/i] },
  { id: "drg", label: "닥터지", patterns: [/dr-?g|닥터지|drg/i] },
  { id: "lghnh", label: "LG생활건강", patterns: [/lg생활건강|lghnh|thefaceshop|더페이스샵|naturecollection|네이처컬렉션/i] },
  { id: "starbucks", label: "스타벅스", patterns: [/starbucks|스타벅스/i] },
  { id: "twosome", label: "투썸플레이스", patterns: [/twosome|투썸/i] },
  { id: "ediya", label: "이디야", patterns: [/ediya|이디야/i] },
  { id: "mega-mgc", label: "메가MGC커피", patterns: [/mega.?mgc|megacoffee|메가mgc|메가커피/i] },
  { id: "baskinrobbins", label: "배스킨라빈스", patterns: [/baskin|배스킨|배라/i] },
  { id: "dunkin", label: "던킨", patterns: [/dunkin|던킨/i] },
  { id: "parisbaguette", label: "파리바게뜨", patterns: [/parisbaguette|paris.?baguette|파리바게뜨|파바/i] },
  { id: "pascucci", label: "파스쿠찌", patterns: [/pascucci|파스쿠찌/i] },
  { id: "baemin", label: "배민", patterns: [/baemin|배민/i] },
  { id: "yogiyo", label: "요기요", patterns: [/yogiyo|요기요/i] },
  { id: "coupang-eats", label: "쿠팡이츠", patterns: [/coupang.?eats|쿠팡이츠/i] },
  { id: "naverpay", label: "네이버페이", patterns: [/naverpay|네이버페이/i] },
  { id: "kakaopay", label: "카카오페이", patterns: [/kakaopay|카카오페이/i] },
  { id: "toss", label: "토스", patterns: [/toss|토스/i] },
  { id: "payco", label: "PAYCO", patterns: [/payco|페이코/i] },
  { id: "okcashbag", label: "OK캐쉬백", patterns: [/okcashbag|ok캐쉬백/i] },
  { id: "cjone", label: "CJ ONE", patterns: [/cjone|cj one/i] },
  { id: "happypoint", label: "해피포인트", patterns: [/happy.?point|해피포인트/i] },
  { id: "emart", label: "이마트", patterns: [/emart|이마트/i] },
  { id: "lottemart", label: "롯데마트", patterns: [/lotte.?mart|롯데마트/i] },
  { id: "homeplus", label: "홈플러스", patterns: [/homeplus|홈플러스/i] },
  { id: "ssg", label: "SSG", patterns: [/ssg/i] },
  { id: "lotteon", label: "롯데ON", patterns: [/lotteon|롯데on|롯데온/i] },
  { id: "elevenst", label: "11번가", patterns: [/11st|11번가/i] },
  { id: "gmarket", label: "G마켓", patterns: [/gmarket|g마켓|지마켓/i] },
  { id: "auction", label: "옥션", patterns: [/auction|옥션/i] },
  { id: "danawa", label: "다나와", patterns: [/danawa|다나와/i] },
  { id: "daiso", label: "다이소몰", patterns: [/daiso|다이소/i] },
  { id: "eventhouse", label: "이벤트하우스", patterns: [/eventhouse|이벤트하우스/i] },
  { id: "culture-day", label: "문화가 있는 날", patterns: [/문화가.?있는.?날|mnuri/i] },
  { id: "culture-portal-invite", label: "문화포털 문화초대이벤트", patterns: [/culture\.go\.kr|문화포털|문화초대/i] },
  { id: "seoul-culture", label: "서울시 문화행사", patterns: [/culture\.seoul|서울문화|서울시/i] },
  { id: "seoul-youth", label: "서울청년 무료지원", patterns: [/youth\.seoul|서울청년|취업날개|AI면접/i] },
  { id: "seoul-lifelong-learning", label: "서울런4050", patterns: [/sll\.seoul|서울런4050|평생학습포털/i] },
  { id: "hangang-seoul", label: "한강공원 무료행사", patterns: [/hangang\.seoul|한강공원|한강.*무료/i] },
  { id: "gov24", label: "정부24", patterns: [/gov24|정부24/i] },
  { id: "subsidy24", label: "보조금24", patterns: [/subsidy24|보조금24|mois/i] },
  { id: "bokjiro", label: "복지로", patterns: [/bokjiro|복지로/i] },
  { id: "hrd", label: "HRD-Net/고용24", patterns: [/hrd|work24|고용24|내일배움/i] },
  { id: "kmooc", label: "K-MOOC", patterns: [/kmooc|k-mooc/i] },
  { id: "ebs", label: "EBS 무료 학습", patterns: [/ebs|ebsi|평생학교/i] },
  { id: "kocw", label: "KOCW 대학공개강의", patterns: [/kocw|대학공개강의/i] },
  { id: "royalcanin", label: "반려동물 샘플", patterns: [/royalcanin|로얄캐닌|반려|pet/i] },
  { id: "purina-petcare", label: "퓨리나 반려동물 혜택", patterns: [/purina|퓨리나|purinapetcare/i] },
  { id: "experience-panel", label: "체험단/샘플 플랫폼", patterns: [/powderroom|파우더룸|체험단|샘플|review/i] }
];

const publicPolicyPatterns = [
  /gov|정부|보조금|복지|bokjiro|공공|공기관|지자체|정책/i,
  /서울|seoul|청년|한강|공원|평생학습|yeyak\.seoul|youth\.seoul|sll\.seoul/i,
  /culture\.go|문화가.?있는.?날|문화포털|mnuri|visitkorea/i,
  /hrd|work24|고용24|내일배움|kmooc|k-mooc|kocw|ebs|교육|훈련/i
];

const publicPolicySourceTypes = new Set([
  "approved_public",
  "approved_public_benefit_page",
  "public_benefit_page",
  "public_official_page"
]);

function isPublicPolicySource(source) {
  const text = sourceText(source);
  return publicPolicySourceTypes.has(String(source.sourceType ?? "")) || publicPolicyPatterns.some((pattern) => pattern.test(text));
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function sourceText(source) {
  return [
    source.id,
    source.label,
    source.provider,
    source.sourceType,
    source.officialUrl,
    Array.isArray(source.category) ? source.category.join(" ") : source.category,
    source.allowedUse,
    source.blockedUse,
    source.notes
  ]
    .filter(Boolean)
    .join(" ");
}

const catalog = readJson(catalogPath, []);
const liveReport = readJson(liveReportPath, {});
const liveRowsById = new Map((Array.isArray(liveReport.sources) ? liveReport.sources : []).map((source) => [source.id, source]));
const issues = [];

if (!Array.isArray(catalog)) {
  issues.push("data/officialSourceCatalog.json must be an array.");
}

const activeCatalog = (Array.isArray(catalog) ? catalog : []).filter((source) => liveRowsById.get(source.id)?.status !== "stale_or_removed");
const publicPolicySources = activeCatalog.filter(isPublicPolicySource);
const consumerBenefitSources = activeCatalog.filter((source) => !isPublicPolicySource(source));
const highPriorityConsumerSources = consumerBenefitSources.filter((source) => source.priority === "high");
const consumerSourceRate = activeCatalog.length ? Math.round((consumerBenefitSources.length / activeCatalog.length) * 100) : 0;
const publicPolicySourceRate = activeCatalog.length ? Math.round((publicPolicySources.length / activeCatalog.length) * 100) : 0;

const consumerFirstPolicy = {
  minimumConsumerSourceRate: 70,
  minimumHighPriorityConsumerSources: 30,
  maximumPublicPolicySourceRate: 35,
  activeSourceCount: activeCatalog.length,
  consumerBenefitSourceCount: consumerBenefitSources.length,
  consumerSourceRate,
  highPriorityConsumerSourceCount: highPriorityConsumerSources.length,
  publicPolicySourceCount: publicPolicySources.length,
  publicPolicySourceRate,
  defaultExposure: "consumer_first_public_policy_opt_in",
  publicPolicyDefaultHandling: "excluded_from_default_home_and_freebies_unless_explicitly_requested",
  ok:
    consumerSourceRate >= 70 &&
    highPriorityConsumerSources.length >= 30 &&
    publicPolicySourceRate <= 35
};

if (consumerSourceRate < consumerFirstPolicy.minimumConsumerSourceRate) {
  issues.push(`Consumer benefit source rate must be ${consumerFirstPolicy.minimumConsumerSourceRate}%+, got ${consumerSourceRate}%.`);
}

if (highPriorityConsumerSources.length < consumerFirstPolicy.minimumHighPriorityConsumerSources) {
  issues.push(`High-priority consumer benefit sources must be ${consumerFirstPolicy.minimumHighPriorityConsumerSources}+, got ${highPriorityConsumerSources.length}.`);
}

if (publicPolicySourceRate > consumerFirstPolicy.maximumPublicPolicySourceRate) {
  issues.push(`Public/policy source rate must stay <= ${consumerFirstPolicy.maximumPublicPolicySourceRate}% for the default catalog mix, got ${publicPolicySourceRate}%.`);
}

const lanes = requiredLanes.map((lane) => {
  const matches = (Array.isArray(catalog) ? catalog : [])
    .filter((source) => lane.patterns.some((pattern) => pattern.test(sourceText(source))))
    .map((source) => {
      const live = liveRowsById.get(source.id);
      return {
        id: source.id,
        label: source.label,
        provider: source.provider,
        categories: source.category,
        officialUrl: source.officialUrl,
        priority: source.priority,
        liveStatus: live?.status ?? "not_checked",
        liveReason: live?.reason ?? ""
      };
    });
  const activeMatches = matches.filter((source) => source.liveStatus !== "stale_or_removed");
  const ok = activeMatches.length >= lane.minimum;

  if (!ok) {
    issues.push(`${lane.label} lane needs ${lane.minimum}+ active official sources, got ${activeMatches.length}.`);
  }

  const staleMatches = matches.filter((source) => source.liveStatus === "stale_or_removed");
  if (staleMatches.length) {
    issues.push(`${lane.label} lane contains stale sources: ${staleMatches.map((source) => source.id).join(", ")}.`);
  }

  return {
    id: lane.id,
    label: lane.label,
    minimum: lane.minimum,
    matchedCount: matches.length,
    activeCount: activeMatches.length,
    staleCount: staleMatches.length,
    ok,
    sources: activeMatches.slice(0, 12)
  };
});

const brandSignals = requiredBrandSignals.map((brand) => {
  const matches = (Array.isArray(catalog) ? catalog : [])
    .filter((source) => brand.patterns.some((pattern) => pattern.test(sourceText(source))))
    .map((source) => {
      const live = liveRowsById.get(source.id);
      return {
        id: source.id,
        label: source.label,
        officialUrl: source.officialUrl,
        liveStatus: live?.status ?? "not_checked",
        liveReason: live?.reason ?? ""
      };
    });
  const activeMatches = matches.filter((source) => source.liveStatus !== "stale_or_removed");
  const ok = activeMatches.length > 0;
  if (!ok) issues.push(`${brand.label} 핵심 브랜드 후보가 공식 소스 카탈로그에 없습니다.`);

  return {
    id: brand.id,
    label: brand.label,
    matchedCount: matches.length,
    activeCount: activeMatches.length,
    ok,
    sources: activeMatches.slice(0, 6)
  };
});

const report = {
  ok: issues.length === 0,
  generatedAt: new Date().toISOString(),
  catalogCount: Array.isArray(catalog) ? catalog.length : 0,
  requiredLaneCount: requiredLanes.length,
  passedLaneCount: lanes.filter((lane) => lane.ok).length,
  requiredBrandSignalCount: requiredBrandSignals.length,
  passedBrandSignalCount: brandSignals.filter((brand) => brand.ok).length,
  minimumTotalActiveSources: requiredLanes.reduce((total, lane) => total + lane.minimum, 0),
  liveReportStatus: liveReport.ok === true ? "available" : "missing_or_not_ok",
  consumerFirstPolicy,
  lanes,
  brandSignals,
  issues,
  operatorNextActions: [
    "새 무료혜택 source를 추가할 때는 이 doctor가 요구하는 수집 축 중 어느 축을 보강하는지 확인합니다.",
    "stale_or_removed URL은 공식 상세 URL로 교체하거나 카탈로그에서 제외합니다.",
    "비공식 모음 사이트는 발견용으로만 쓰고 사용자 CTA에는 공식 이벤트·신청 URL만 연결합니다."
  ]
};

mkdirSync(reportsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const docs = [
  "# 무료혜택 소스 축 커버리지 리포트",
  "",
  `- 생성 시각: ${report.generatedAt}`,
  `- 공식 소스 후보: ${report.catalogCount}개`,
  `- 필수 수집 축: ${report.passedLaneCount}/${report.requiredLaneCount} 통과`,
  `- 핵심 브랜드 신호: ${report.passedBrandSignalCount}/${report.requiredBrandSignalCount} 통과`,
  `- live report: ${report.liveReportStatus}`,
  `- 소비자형 공식 혜택 소스: ${consumerFirstPolicy.consumerBenefitSourceCount}/${consumerFirstPolicy.activeSourceCount}개 (${consumerFirstPolicy.consumerSourceRate}%)`,
  `- 공공/정책성 소스 기본 처리: ${consumerFirstPolicy.publicPolicyDefaultHandling}`,
  "",
  "## 소비자형 우선 정책",
  "",
  "| 지표 | 기준 | 현재 | 상태 |",
  "| --- | ---: | ---: | --- |",
  `| 소비자형 공식 혜택 소스 비율 | ${consumerFirstPolicy.minimumConsumerSourceRate}% 이상 | ${consumerFirstPolicy.consumerSourceRate}% | ${consumerFirstPolicy.consumerSourceRate >= consumerFirstPolicy.minimumConsumerSourceRate ? "PASS" : "FAIL"} |`,
  `| high priority 소비자형 소스 | ${consumerFirstPolicy.minimumHighPriorityConsumerSources}개 이상 | ${consumerFirstPolicy.highPriorityConsumerSourceCount}개 | ${consumerFirstPolicy.highPriorityConsumerSourceCount >= consumerFirstPolicy.minimumHighPriorityConsumerSources ? "PASS" : "FAIL"} |`,
  `| 공공/정책성 소스 비율 | ${consumerFirstPolicy.maximumPublicPolicySourceRate}% 이하 | ${consumerFirstPolicy.publicPolicySourceRate}% | ${consumerFirstPolicy.publicPolicySourceRate <= consumerFirstPolicy.maximumPublicPolicySourceRate ? "PASS" : "FAIL"} |`,
  "",
  "기본 홈/무료혜택 feed는 쇼핑몰, 브랜드, 편의점, 뷰티, 카페, 배달, 페이/포인트, 체험단 같은 소비자형 혜택을 먼저 보여줍니다. 공공/정책성 혜택은 별도 요청 또는 전용 필터에서만 다루는 방향을 유지합니다.",
  "",
  "| 수집 축 | 기준 | 활성 소스 | 상태 | 대표 소스 |",
  "| --- | ---: | ---: | --- | --- |",
  ...lanes.map((lane) => {
    const examples = lane.sources.slice(0, 4).map((source) => source.label || source.id).join(", ");
    return `| ${lane.label} | ${lane.minimum} | ${lane.activeCount} | ${lane.ok ? "PASS" : "FAIL"} | ${examples || "-"} |`;
  }),
  "",
  "## 핵심 브랜드 신호",
  "",
  "| 브랜드/기관 | 활성 후보 | 상태 | 대표 소스 |",
  "| --- | ---: | --- | --- |",
  ...brandSignals.map((brand) => {
    const examples = brand.sources.slice(0, 3).map((source) => source.label || source.id).join(", ");
    return `| ${brand.label} | ${brand.activeCount} | ${brand.ok ? "PASS" : "FAIL"} | ${examples || "-"} |`;
  }),
  "",
  "## 운영 원칙",
  "",
  "- 사용자에게 보이는 CTA는 공식 이벤트, 쿠폰 받기, 샘플 신청, 무료체험, 출석체크, 공공 신청 페이지로만 연결합니다.",
  "- 검색 결과, 커뮤니티 글, 대표 홈페이지 메인, 광고성 중간 페이지는 무료혜택 카드의 finalUrl로 쓰지 않습니다.",
  "- 공식 URL이 404/410/5xx 또는 stale_or_removed로 잡히면 교체 전까지 소스 후보에서 제외합니다.",
  "",
  "## 다음 액션",
  "",
  ...report.operatorNextActions.map((action) => `- ${action}`),
  "",
  ...(issues.length ? ["## 이슈", "", ...issues.map((issue) => `- ${issue}`), ""] : ["## 이슈", "", "- 없음", ""])
].join("\n");

writeFileSync(docsPath, `${docs}\n`, "utf8");

if (issues.length) {
  console.error("Free benefit source breadth doctor failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Free benefit source breadth doctor passed.");
console.log(`- lanes: ${report.passedLaneCount}/${report.requiredLaneCount}`);
console.log(`- catalog sources: ${report.catalogCount}`);
console.log(`- reports/free-benefit-source-breadth.json`);
console.log(`- docs/FREE_BENEFIT_SOURCE_BREADTH.md`);

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import officialSourceCatalog from "@/data/officialSourceCatalog.json";

export type SourceBreadthLane = {
  id: string;
  label: string;
  minimum: number;
  matchedCount: number;
  activeCount: number;
  staleCount: number;
  ok: boolean;
  sources: Array<{
    id: string;
    label: string;
    provider?: string;
    categories?: string[];
    officialUrl?: string;
    priority?: string;
    liveStatus?: string;
    liveReason?: string;
  }>;
};

export type SourceBreadthBrandSignal = {
  id: string;
  label: string;
  matchedCount: number;
  activeCount: number;
  ok: boolean;
  sources: Array<{
    id: string;
    label: string;
    officialUrl?: string;
    liveStatus?: string;
    liveReason?: string;
  }>;
};

export type SourceBreadthReport = {
  ok: boolean;
  generatedAt: string;
  catalogCount: number;
  requiredLaneCount: number;
  passedLaneCount: number;
  requiredBrandSignalCount: number;
  passedBrandSignalCount: number;
  minimumTotalActiveSources: number;
  liveReportStatus: string;
  consumerFirstPolicy?: {
    consumerBenefitSourceCount?: number;
    activeSourceCount?: number;
    consumerSourceRate?: number;
    minimumConsumerSourceRate?: number;
    highPriorityConsumerSourceCount?: number;
    minimumHighPriorityConsumerSources?: number;
    publicPolicySourceRate?: number;
    maximumPublicPolicySourceRate?: number;
    publicPolicyDefaultHandling?: string;
  };
  lanes: SourceBreadthLane[];
  brandSignals: SourceBreadthBrandSignal[];
  issues: string[];
  operatorNextActions: string[];
};

const fallbackReport: SourceBreadthReport = {
  ok: false,
  generatedAt: "",
  catalogCount: 0,
  requiredLaneCount: 0,
  passedLaneCount: 0,
  requiredBrandSignalCount: 0,
  passedBrandSignalCount: 0,
  minimumTotalActiveSources: 0,
  liveReportStatus: "missing",
  lanes: [],
  brandSignals: [],
  issues: ["reports/free-benefit-source-breadth.json 파일이 없습니다."],
  operatorNextActions: ["npm run source:breadth:doctor 실행 후 공식 무료혜택 소스 축 커버리지를 다시 확인하세요."]
};

type OfficialSource = {
  id: string;
  label: string;
  provider?: string;
  category?: string[];
  officialUrl?: string;
  priority?: string;
};

type LaneConfig = {
  id: string;
  label: string;
  minimum: number;
  patterns: RegExp[];
};

type BrandSignalConfig = {
  id: string;
  label: string;
  patterns: RegExp[];
};

const requiredLanes: LaneConfig[] = [
  { id: "telecom", label: "통신사 멤버십", minimum: 3, patterns: [/skt|t멤버십|tmembership|kt|uplus|u\+/i] },
  { id: "convenience", label: "편의점", minimum: 4, patterns: [/gs25|\bcu\b|cu-|세븐일레븐|7-eleven|emart24|이마트24/i] },
  { id: "beauty", label: "뷰티·헬스", minimum: 6, patterns: [/oliveyoung|올리브영|amore|아모레|innisfree|닥터지|roundlab|라운드랩|powderroom|파우더룸|musinsa|무신사|kurly|컬리|lotteon|롯데on/i] },
  { id: "cafe-franchise", label: "카페·프랜차이즈", minimum: 6, patterns: [/starbucks|스타벅스|twosome|투썸|ediya|이디야|megacoffee|mega.?mgc|메가커피|mcdonald|맥도날드|kfc|bhc|domino|피자|subway|써브웨이|baskin|배스킨|dunkin|던킨|paris|파리바게뜨|pascucci|파스쿠찌/i] },
  { id: "delivery", label: "배달·외식 쿠폰", minimum: 3, patterns: [/baemin|배민|요기요|yogiyo|coupang.?eats|쿠팡이츠|delivery|배달/i] },
  { id: "pay-point", label: "금융·페이·포인트", minimum: 8, patterns: [/naverpay|네이버페이|kakaopay|카카오페이|toss|토스|payco|페이코|okcashbag|ok캐쉬백|cjone|cj one|happy.?point|해피포인트|lpoint|l\.point|card|카드|멤버십/i] },
  { id: "mart", label: "대형마트·장보기", minimum: 5, patterns: [/emart|이마트|homeplus|홈플러스|lotte.?mart|롯데마트|ssg|컬리|kurly|cjthemarket|cj더마켓|ikea/i] },
  { id: "open-market", label: "오픈마켓·쇼핑몰", minimum: 5, patterns: [/11st|11번가|gmarket|g마켓|auction|옥션|lotteon|롯데온|daiso|다이소|danawa|다나와|tenbyten|10x10|hmall|현대hmall|musinsa|무신사|kurly|컬리/i] },
  { id: "public-culture", label: "문화·공공기관", minimum: 8, patterns: [/문화|culture|seoul|서울|gov24|정부24|bokjiro|복지로|mnuri|문화가.?있는.?날|visitkorea|cgv|megabox|메가박스|lotteworld|롯데월드|everland|에버랜드/i] },
  { id: "education", label: "교육 무료체험", minimum: 2, patterns: [/kmooc|k-mooc|kocw|work24|고용24|hrd|내일배움|ebs|교육|강좌|훈련/i] },
  { id: "pet", label: "반려동물 샘플", minimum: 3, patterns: [/royalcanin|로얄캐닌|purina|퓨리나|pet|반려|강아지|고양이/i] },
  { id: "experience-panel", label: "체험단·샘플", minimum: 3, patterns: [/체험단|샘플|sample|experience|review|리뷰|powderroom|파우더룸|sample.?market|샘플마켓/i] }
];

const requiredBrandSignals: BrandSignalConfig[] = [
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
  { id: "culture-day", label: "문화가 있는 날", patterns: [/문화가.?있는.?날|mnuri/i] },
  { id: "culture-portal-invite", label: "문화포털 문화초대이벤트", patterns: [/culture\.go\.kr|문화포털|문화초대/i] },
  { id: "seoul-culture", label: "서울시 문화행사", patterns: [/culture\.seoul|서울문화|서울시/i] },
  { id: "gov24", label: "정부24", patterns: [/gov24|정부24/i] },
  { id: "bokjiro", label: "복지로", patterns: [/bokjiro|복지로/i] },
  { id: "hrd", label: "HRD-Net/고용24", patterns: [/hrd|work24|고용24|내일배움/i] },
  { id: "kmooc", label: "K-MOOC", patterns: [/kmooc|k-mooc/i] },
  { id: "ebs", label: "EBS 무료 학습", patterns: [/ebs|ebsi|평생학교/i] },
  { id: "kocw", label: "KOCW 대학공개강의", patterns: [/kocw|대학공개강의/i] },
  { id: "royalcanin", label: "반려동물 샘플", patterns: [/royalcanin|로얄캐닌|반려|pet/i] },
  { id: "purina-petcare", label: "퓨리나 반려동물 혜택", patterns: [/purina|퓨리나|purinapetcare/i] },
  { id: "experience-panel", label: "체험단/샘플 플랫폼", patterns: [/powderroom|파우더룸|체험단|샘플|review/i] }
];

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;

  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function getFreeBenefitSourceBreadthReport(): SourceBreadthReport {
  const fileReport = readJson<SourceBreadthReport | null>(join(process.cwd(), "reports", "free-benefit-source-breadth.json"), null);
  if (fileReport?.catalogCount) return fileReport;

  return buildCatalogFallbackReport();
}

function sourceText(source: OfficialSource) {
  return [source.id, source.label, source.provider, source.officialUrl, source.priority, ...(source.category ?? [])].filter(Boolean).join(" ");
}

function toSourceRow(source: OfficialSource) {
  return {
    id: source.id,
    label: source.label,
    provider: source.provider,
    categories: source.category,
    officialUrl: source.officialUrl,
    priority: source.priority,
    liveStatus: "catalog_snapshot",
    liveReason: "Vercel runtime catalog fallback"
  };
}

function buildCatalogFallbackReport(): SourceBreadthReport {
  const catalog = officialSourceCatalog as OfficialSource[];
  if (!Array.isArray(catalog) || !catalog.length) return fallbackReport;

  const lanes = requiredLanes.map((lane) => {
    const matches = catalog.filter((source) => lane.patterns.some((pattern) => pattern.test(sourceText(source)))).map(toSourceRow);
    return {
      id: lane.id,
      label: lane.label,
      minimum: lane.minimum,
      matchedCount: matches.length,
      activeCount: matches.length,
      staleCount: 0,
      ok: matches.length >= lane.minimum,
      sources: matches.slice(0, 12)
    };
  });

  const brandSignals = requiredBrandSignals.map((brand) => {
    const matches = catalog.filter((source) => brand.patterns.some((pattern) => pattern.test(sourceText(source)))).map(toSourceRow);
    return {
      id: brand.id,
      label: brand.label,
      matchedCount: matches.length,
      activeCount: matches.length,
      ok: matches.length > 0,
      sources: matches.slice(0, 6)
    };
  });

  const publicPolicySourceCount = catalog.filter((source) => (source.category ?? []).includes("정부/공공혜택")).length;
  const consumerBenefitSourceCount = Math.max(0, catalog.length - publicPolicySourceCount);
  const consumerSourceRate = catalog.length ? Math.round((consumerBenefitSourceCount / catalog.length) * 100) : 0;
  const publicPolicySourceRate = catalog.length ? Math.round((publicPolicySourceCount / catalog.length) * 100) : 0;
  const issues = [
    ...lanes.filter((lane) => !lane.ok).map((lane) => `${lane.label} lane needs ${lane.minimum}+ active official sources, got ${lane.activeCount}.`),
    ...brandSignals.filter((brand) => !brand.ok).map((brand) => `${brand.label} 핵심 브랜드 후보가 공식 소스 카탈로그에 없습니다.`)
  ];

  return {
    ok: issues.length === 0,
    generatedAt: new Date().toISOString(),
    catalogCount: catalog.length,
    requiredLaneCount: requiredLanes.length,
    passedLaneCount: lanes.filter((lane) => lane.ok).length,
    requiredBrandSignalCount: requiredBrandSignals.length,
    passedBrandSignalCount: brandSignals.filter((brand) => brand.ok).length,
    minimumTotalActiveSources: requiredLanes.reduce((total, lane) => total + lane.minimum, 0),
    liveReportStatus: "catalog_snapshot",
    consumerFirstPolicy: {
      consumerBenefitSourceCount,
      activeSourceCount: catalog.length,
      consumerSourceRate,
      minimumConsumerSourceRate: 65,
      highPriorityConsumerSourceCount: catalog.filter((source) => source.priority === "high" && !(source.category ?? []).includes("정부/공공혜택")).length,
      minimumHighPriorityConsumerSources: 20,
      publicPolicySourceRate,
      maximumPublicPolicySourceRate: 35,
      publicPolicyDefaultHandling: "excluded_from_default_home_and_freebies_unless_explicitly_requested"
    },
    lanes,
    brandSignals,
    issues,
    operatorNextActions: [
      "Vercel runtime에서는 reports 파일이 없어도 data/officialSourceCatalog.json으로 소스 축 커버리지를 계산합니다.",
      "더 정확한 live 접근성 상태는 npm run source:live:doctor와 npm run source:breadth:doctor를 로컬/CI에서 실행해 reports를 재생성하세요.",
      "비공식 모음 사이트는 발견용으로만 쓰고 사용자 CTA에는 공식 이벤트·신청 URL만 연결합니다."
    ]
  };
}

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.map(String).join(" | ") : String(value ?? "");
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

export function buildFreeBenefitSourceBreadthCsv(report: SourceBreadthReport) {
  const rows: string[][] = [["section", "id", "label", "status", "minimum", "activeCount", "matchedCount", "staleCount", "detail", "officialUrl"]];

  rows.push([
    "summary",
    "source_breadth",
    "무료혜택 소스 축 커버리지",
    report.ok ? "passed" : "review",
    String(report.requiredLaneCount),
    String(report.passedLaneCount),
    String(report.catalogCount),
    "0",
    `brandSignals=${report.passedBrandSignalCount}/${report.requiredBrandSignalCount}; live=${report.liveReportStatus}`,
    ""
  ]);

  for (const lane of report.lanes) {
    rows.push([
      "lane",
      lane.id,
      lane.label,
      lane.ok ? "passed" : "review",
      String(lane.minimum),
      String(lane.activeCount),
      String(lane.matchedCount),
      String(lane.staleCount),
      lane.sources.slice(0, 4).map((source) => source.label || source.id).join(" | "),
      ""
    ]);
  }

  for (const brand of report.brandSignals) {
    rows.push([
      "brand",
      brand.id,
      brand.label,
      brand.ok ? "covered" : "missing",
      "1",
      String(brand.activeCount),
      String(brand.matchedCount),
      "0",
      brand.sources.slice(0, 4).map((source) => source.label || source.id).join(" | "),
      brand.sources[0]?.officialUrl ?? ""
    ]);
  }

  for (const issue of report.issues) {
    rows.push(["issue", "source_breadth", "점검 필요", "review", "", "", "", "", issue, ""]);
  }

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

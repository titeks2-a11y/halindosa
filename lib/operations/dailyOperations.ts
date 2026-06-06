import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type JsonRecord = Record<string, unknown>;

export type DailyOperationTone = "good" | "watch" | "danger";

export interface DailyOperationGate {
  name: string;
  ok: boolean;
  detail: string;
  action: string;
}

export interface DailyOperationCard {
  id: string;
  title: string;
  tone: DailyOperationTone;
  value: string;
  description: string;
  command: string;
  href: string;
}

export interface DailyOperationQueueItem {
  priority: "high" | "medium" | "low";
  area: string;
  title: string;
  reason: string;
  action: string;
  evidence: string;
}

export interface DailyOperationsReport {
  ok: boolean;
  generatedAt: string;
  readinessLabel: string;
  summary: {
    productDealsCount: number;
    verifiedProductLinks: number;
    exposedSearchLinks: number;
    exposedSoldOutLinks: number;
    hiddenProductDeals: number;
    visibleOfficialBenefits: number;
    hiddenOfficialBenefits: number;
    expiredOfficialBenefits: number;
    failedOfficialBenefits: number;
    refreshAllOk: boolean;
    refreshAllFailedCount: number;
    officialSourceCandidates: number;
    officialSourceLaunchGateStatus: string;
    cronRefreshStatus: string;
    pushReadinessScore: number;
    releaseDoctorPassedChecks: number;
    releaseDoctorTotalChecks: number;
  };
  gates: DailyOperationGate[];
  cards: DailyOperationCard[];
  priorityQueue: DailyOperationQueueItem[];
  commands: string[];
}

const fallbackReport: DailyOperationsReport = {
  ok: false,
  generatedAt: "",
  readinessLabel: "일일 운영 리포트 생성 필요",
  summary: {
    productDealsCount: 0,
    verifiedProductLinks: 0,
    exposedSearchLinks: 0,
    exposedSoldOutLinks: 0,
    hiddenProductDeals: 0,
    visibleOfficialBenefits: 0,
    hiddenOfficialBenefits: 0,
    expiredOfficialBenefits: 0,
    failedOfficialBenefits: 0,
    refreshAllOk: false,
    refreshAllFailedCount: 0,
    officialSourceCandidates: 0,
    officialSourceLaunchGateStatus: "missing",
    cronRefreshStatus: "missing",
    pushReadinessScore: 0,
    releaseDoctorPassedChecks: 0,
    releaseDoctorTotalChecks: 0
  },
  gates: [
    {
      name: "daily operations report",
      ok: false,
      detail: "reports/daily-operations.json 파일이 없습니다.",
      action: "npm run daily:operations:report를 실행하세요."
    }
  ],
  cards: [],
  priorityQueue: [
    {
      priority: "high",
      area: "운영 리포트",
      title: "일일 운영 리포트 생성",
      reason: "운영자가 오늘 확인할 링크, 공식 혜택, refresh, cron 상태를 한 번에 볼 수 없습니다.",
      action: "npm run daily:operations:report 실행",
      evidence: "reports/daily-operations.json missing"
    }
  ],
  commands: ["npm run daily:operations:report"]
};

function readReport(fileName: string): JsonRecord {
  const reportPath = join(process.cwd(), "reports", fileName);
  if (!existsSync(reportPath)) return {};

  try {
    const value = JSON.parse(readFileSync(reportPath, "utf8")) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
  } catch {
    return {};
  }
}

function numberValue(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function booleanValue(value: unknown) {
  return value === true;
}

function nested(record: JsonRecord, key: string): JsonRecord {
  const value = record[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function buildGate(name: string, ok: boolean, detail: string, action: string): DailyOperationGate {
  return { name, ok, detail, action };
}

function buildCard(
  id: string,
  title: string,
  tone: DailyOperationTone,
  value: string,
  description: string,
  command: string,
  href: string
): DailyOperationCard {
  return { id, title, tone, value, description, command, href };
}

function buildPriorityQueue(summary: DailyOperationsReport["summary"], gates: DailyOperationGate[]): DailyOperationQueueItem[] {
  const queue: DailyOperationQueueItem[] = [];

  for (const gate of gates.filter((item) => !item.ok)) {
    queue.push({
      priority: "high",
      area: gate.name,
      title: `${gate.name} 재점검`,
      reason: gate.detail,
      action: gate.action,
      evidence: "daily operations gate failed"
    });
  }

  if (summary.officialSourceLaunchGateStatus === "passed") {
    queue.push({
      priority: "medium",
      area: "공식 소스",
      title: "공식 feed 연결 후보 검토",
      reason: "현재 seed/fallback 운영은 안전하지만, 장기 운영은 공식 API/RSS/승인 JSON feed 연결이 필요합니다.",
      action: "source:onboarding:plan의 env 템플릿에서 우선 공급처를 골라 제휴 또는 공식 feed 연결",
      evidence: `${summary.officialSourceCandidates} official source candidates`
    });
  }

  queue.push({
    priority: "medium",
    area: "콘텐츠",
    title: "오늘 노출 혜택 freshness 확인",
    reason: "공식 혜택은 종료일과 조건이 빠르게 변하므로 매일 갱신 증거가 필요합니다.",
    action: "npm run refresh:all 실행 후 news freshness와 source readiness 리포트 확인",
    evidence: `${summary.visibleOfficialBenefits} visible official benefits`
  });

  queue.push({
    priority: "low",
    area: "출시 QA",
    title: "Play Store 제출 전 최종 증적 갱신",
    reason: "최종 AAB 생성 직전 release evidence가 최신 커밋을 가리켜야 합니다.",
    action: "npm run release:evidence && npm run release:doctor",
    evidence: `${summary.releaseDoctorPassedChecks}/${summary.releaseDoctorTotalChecks} release checks`
  });

  return queue.slice(0, 10);
}

export function getDailyOperationsReport(): DailyOperationsReport {
  const reportPath = join(process.cwd(), "reports", "daily-operations.json");
  if (existsSync(reportPath)) {
    try {
      const report = JSON.parse(readFileSync(reportPath, "utf8")) as Partial<DailyOperationsReport>;

      return {
        ...fallbackReport,
        ...report,
        summary: {
          ...fallbackReport.summary,
          ...(report.summary ?? {})
        },
        gates: Array.isArray(report.gates) ? report.gates : fallbackReport.gates,
        cards: Array.isArray(report.cards) ? report.cards : fallbackReport.cards,
        priorityQueue: Array.isArray(report.priorityQueue) ? report.priorityQueue : fallbackReport.priorityQueue,
        commands: Array.isArray(report.commands) ? report.commands : fallbackReport.commands
      };
    } catch {
      return {
        ...fallbackReport,
        readinessLabel: "일일 운영 리포트 파싱 실패"
      };
    }
  }

  const linkValidation = readReport("link-validation.json");
  const productQuality = readReport("product-quality.json");
  const newsDeals = readReport("news-deals.json");
  const refreshAll = readReport("refresh-all.json");
  const sourceReadiness = readReport("source-readiness.json");
  const cronRefresh = readReport("cron-refresh-readiness.json");
  const pushReadiness = readReport("push-readiness.json");
  const releaseDoctor = readReport("release-doctor.json");
  const sourceSummary = nested(sourceReadiness, "summary");

  const summary: DailyOperationsReport["summary"] = {
    productDealsCount: numberValue(productQuality.totalProducts || linkValidation.totalDeals || refreshAll.productDealsCount),
    verifiedProductLinks: numberValue(productQuality.verifiedPurchaseLinks || linkValidation.passedDirectLinks),
    exposedSearchLinks: numberValue(productQuality.searchLinks || linkValidation.exposedSearchLinks),
    exposedSoldOutLinks: numberValue(productQuality.soldOutProducts || linkValidation.exposedSoldOutLinks),
    hiddenProductDeals: numberValue(productQuality.hiddenProducts || linkValidation.hiddenCount),
    visibleOfficialBenefits: numberValue(newsDeals.visibleCount || refreshAll.newsDealsCount || sourceSummary.visibleOfficialBenefits),
    hiddenOfficialBenefits: numberValue(newsDeals.hiddenCount || sourceSummary.hiddenOfficialBenefits),
    expiredOfficialBenefits: numberValue(newsDeals.expiredCount || sourceSummary.expiredOfficialBenefits),
    failedOfficialBenefits: numberValue(newsDeals.failedCount || sourceSummary.newsFailedCount),
    refreshAllOk: booleanValue(refreshAll.ok),
    refreshAllFailedCount: numberValue(refreshAll.failedCount),
    officialSourceCandidates: numberValue(sourceSummary.officialSourceCandidates),
    officialSourceLaunchGateStatus: stringValue(sourceReadiness.launchGateStatus, "missing"),
    cronRefreshStatus: stringValue(cronRefresh.status || cronRefresh.healthCronStatus, "missing"),
    pushReadinessScore: numberValue(pushReadiness.readinessScore),
    releaseDoctorPassedChecks: numberValue(releaseDoctor.passedChecks),
    releaseDoctorTotalChecks: numberValue(releaseDoctor.totalChecks)
  };

  const sourceGates = arrayValue(sourceReadiness.gates);
  const gates = [
    buildGate(
      "검증 구매 링크",
      summary.productDealsCount >= 140 && summary.verifiedProductLinks >= 120 && summary.exposedSearchLinks === 0 && summary.exposedSoldOutLinks === 0,
      `상품 ${summary.productDealsCount}개, 검증 노출 링크 ${summary.verifiedProductLinks}개, 숨김 리뷰 ${summary.hiddenProductDeals}개, 검색 링크 ${summary.exposedSearchLinks}개, 품절 노출 ${summary.exposedSoldOutLinks}개`,
      "npm run verify:links && npm run verify:products && npm run exposure:doctor"
    ),
    buildGate(
      "공식 혜택 노출",
      summary.visibleOfficialBenefits >= 50 && summary.hiddenOfficialBenefits === 0 && summary.expiredOfficialBenefits === 0 && summary.failedOfficialBenefits === 0,
      `공식 혜택 ${summary.visibleOfficialBenefits}개, 숨김 ${summary.hiddenOfficialBenefits}개, 종료 ${summary.expiredOfficialBenefits}개, 실패 ${summary.failedOfficialBenefits}개`,
      "npm run refresh:news && npm run verify:news"
    ),
    buildGate(
      "refresh:all",
      summary.refreshAllOk && summary.refreshAllFailedCount === 0,
      `refresh:all ok=${summary.refreshAllOk}, failed=${summary.refreshAllFailedCount}`,
      "npm run refresh:all"
    ),
    buildGate(
      "공식 소스 준비도",
      summary.officialSourceCandidates >= 30 && summary.officialSourceLaunchGateStatus === "passed" && sourceGates.every((gate) => Boolean((gate as JsonRecord).ok)),
      `공식 소스 ${summary.officialSourceCandidates}개, launch gate=${summary.officialSourceLaunchGateStatus}`,
      "npm run source:readiness:report"
    ),
    buildGate(
      "cron/push 운영 준비",
      ["ready", "manual_refresh_ready", "healthy"].includes(summary.cronRefreshStatus) && summary.pushReadinessScore >= 90,
      `cron=${summary.cronRefreshStatus}, push readiness=${summary.pushReadinessScore}`,
      "npm run cron:refresh:doctor && npm run push:readiness:report"
    ),
    buildGate(
      "release doctor",
      summary.releaseDoctorPassedChecks > 0 && summary.releaseDoctorPassedChecks === summary.releaseDoctorTotalChecks,
      `${summary.releaseDoctorPassedChecks}/${summary.releaseDoctorTotalChecks} checks`,
      "npm run release:doctor"
    )
  ];
  const ok = gates.every((gate) => gate.ok);

  return {
    ok,
    generatedAt: new Date().toISOString(),
    readinessLabel: ok ? "오늘 운영 가능" : "오늘 운영 전 점검 필요",
    summary,
    gates,
    cards: [
      buildCard("links", "구매 링크", gates[0].ok ? "good" : "danger", `${summary.verifiedProductLinks}/${summary.productDealsCount}`, "검색, 대표몰, 품절 링크를 노출하지 않는지 확인합니다.", "npm run verify:links", "/api/admin/exposure-policy"),
      buildCard("benefits", "공식 혜택", gates[1].ok ? "good" : "danger", `${summary.visibleOfficialBenefits}개`, "무료, 쿠폰, 카드, 문화, 공공 혜택의 공식 링크 노출 상태입니다.", "npm run verify:news", "/api/admin/news-operations"),
      buildCard("refresh", "수집 파이프라인", gates[2].ok ? "good" : "danger", summary.refreshAllOk ? "정상" : "점검", "상품과 혜택 refresh가 같은 증적 흐름으로 갱신되는지 봅니다.", "npm run refresh:all", "/api/admin/health-readiness"),
      buildCard("sources", "공식 소스", gates[3].ok ? "good" : "watch", `${summary.officialSourceCandidates}개`, "향후 API/RSS/제휴 feed 전환 후보와 정책 게이트입니다.", "npm run source:readiness:report", "/api/admin/source-readiness"),
      buildCard("cron", "자동 운영", gates[4].ok ? "good" : "watch", summary.cronRefreshStatus, "6시간 refresh와 푸시 준비 상태를 점검합니다.", "npm run cron:refresh:doctor", "/api/cron/refresh?dryRun=true"),
      buildCard("release", "출시 게이트", gates[5].ok ? "good" : "danger", `${summary.releaseDoctorPassedChecks}/${summary.releaseDoctorTotalChecks}`, "스토어 제출 전 회귀 게이트입니다.", "npm run release:doctor", "/admin")
    ],
    priorityQueue: buildPriorityQueue(summary, gates),
    commands: [
      "npm run daily:operations:report",
      "npm run refresh:all",
      "npm run verify:links",
      "npm run verify:products",
      "npm run verify:news",
      "npm run exposure:doctor",
      "npm run health:readiness",
      "npm run release:doctor"
    ]
  };
}

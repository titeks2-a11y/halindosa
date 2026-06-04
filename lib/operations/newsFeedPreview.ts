import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface NewsFeedPreviewSampleDeal {
  id: string;
  title: string;
  merchant?: string;
  finalUrl?: string;
  sourceUrl?: string;
  linkType?: string;
  priorityScore?: number;
  hiddenReason?: string;
}

export interface NewsFeedPreviewProvider {
  provider: string;
  label: string;
  sourceMode: string;
  configuredFeedUrls: number;
  fetchedCount: number;
  visibleCount: number;
  hiddenCount: number;
  errorCount: number;
  errors: string[];
  officialLinkPromotedCount: number;
  hiddenReasonTop5: Array<{ reason: string; count: number }>;
  sampleVisible: NewsFeedPreviewSampleDeal[];
  sampleHidden: NewsFeedPreviewSampleDeal[];
}

export interface NewsFeedPreviewReport {
  ok: boolean;
  generatedAt: string;
  mode: string;
  providerCount: number;
  totalFetchedCount: number;
  visibleCount: number;
  hiddenCount: number;
  officialLinkPromotedCount: number;
  providerResults: NewsFeedPreviewProvider[];
  summary: {
    exposedSearchLinkCount: number;
    exposedNonOfficialLinkCount: number;
    failedCount: number;
    failureReasonTop10: Array<{ reason: string; count: number }>;
    categoryCounts: Record<string, number>;
  };
  gates: Array<{
    name: string;
    ok: boolean;
    detail: string;
    action: string;
  }>;
  nextActions: string[];
}

const fallbackReport: NewsFeedPreviewReport = {
  ok: false,
  generatedAt: "",
  mode: "missing",
  providerCount: 0,
  totalFetchedCount: 0,
  visibleCount: 0,
  hiddenCount: 0,
  officialLinkPromotedCount: 0,
  providerResults: [],
  summary: {
    exposedSearchLinkCount: 0,
    exposedNonOfficialLinkCount: 0,
    failedCount: 0,
    failureReasonTop10: [],
    categoryCounts: {}
  },
  gates: [
    {
      name: "news feed preview report",
      ok: false,
      detail: "reports/news-feed-preview.json 파일이 없습니다.",
      action: "npm run news:preview"
    }
  ],
  nextActions: ["npm run news:preview 실행 후 공식 feed 후보를 다시 확인하세요."]
};

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function sampleDeal(value: unknown): NewsFeedPreviewSampleDeal {
  const record = asRecord(value);

  return {
    id: stringValue(record.id),
    title: stringValue(record.title),
    merchant: stringValue(record.merchant),
    finalUrl: stringValue(record.finalUrl),
    sourceUrl: stringValue(record.sourceUrl),
    linkType: stringValue(record.linkType),
    priorityScore: numberValue(record.priorityScore),
    hiddenReason: stringValue(record.hiddenReason)
  };
}

function providerResult(value: unknown): NewsFeedPreviewProvider {
  const record = asRecord(value);

  return {
    provider: stringValue(record.provider, "unknown"),
    label: stringValue(record.label, "미확인 provider"),
    sourceMode: stringValue(record.sourceMode, "unknown"),
    configuredFeedUrls: numberValue(record.configuredFeedUrls),
    fetchedCount: numberValue(record.fetchedCount),
    visibleCount: numberValue(record.visibleCount),
    hiddenCount: numberValue(record.hiddenCount),
    errorCount: numberValue(record.errorCount),
    errors: asArray(record.errors).map((error) => String(error)),
    officialLinkPromotedCount: numberValue(record.officialLinkPromotedCount),
    hiddenReasonTop5: asArray(record.hiddenReasonTop5).map((item) => {
      const reason = asRecord(item);
      return {
        reason: stringValue(reason.reason, "unknown"),
        count: numberValue(reason.count)
      };
    }),
    sampleVisible: asArray(record.sampleVisible).map(sampleDeal),
    sampleHidden: asArray(record.sampleHidden).map(sampleDeal)
  };
}

function buildGates(report: Omit<NewsFeedPreviewReport, "gates" | "nextActions">): NewsFeedPreviewReport["gates"] {
  return [
    {
      name: "공식 feed preview",
      ok: report.ok,
      detail: `${report.visibleCount}개 노출 가능, ${report.hiddenCount}개 숨김, provider 오류 ${report.providerResults.reduce((sum, provider) => sum + provider.errorCount, 0)}개`,
      action: "npm run news:preview"
    },
    {
      name: "검색/비공식 링크 차단",
      ok: report.summary.exposedSearchLinkCount === 0 && report.summary.exposedNonOfficialLinkCount === 0,
      detail: `검색 링크 ${report.summary.exposedSearchLinkCount}개, 비공식 링크 ${report.summary.exposedNonOfficialLinkCount}개`,
      action: "공식 API/RSS/제휴 JSON feed만 연결"
    },
    {
      name: "뉴스 본문 공식 링크 승격",
      ok: report.officialLinkPromotedCount >= 1,
      detail: `뉴스 기사 context에서 공식 혜택 링크로 승격된 항목 ${report.officialLinkPromotedCount}개`,
      action: "RSS 본문에 공식 이벤트 URL이 포함되는지 확인"
    }
  ];
}

function buildNextActions(report: NewsFeedPreviewReport): string[] {
  const actions = [
    "운영 feed 반영 전 npm run news:preview로 공식 링크 승격과 숨김 사유를 확인하세요.",
    "통과 후 npm run refresh:news && npm run verify:news && npm run refresh:all을 실행하세요.",
    "검색 결과, 커뮤니티 원문, 블로그, 뉴스 기사 단독 링크는 사용자 이동 URL로 쓰지 않습니다."
  ];

  if (report.providerResults.some((provider) => provider.errorCount > 0)) {
    actions.unshift("Provider 오류가 있는 feed URL은 배포 환경변수에서 제거하거나 공식 API/RSS 담당자 확인 후 다시 연결하세요.");
  }

  if (report.hiddenCount > 0) {
    actions.unshift("숨김 후보는 CSV로 내려받아 finalUrl, 공식 도메인, 종료일, 혜택 조건을 먼저 보강하세요.");
  }

  return actions;
}

export function getNewsFeedPreviewReport(): NewsFeedPreviewReport {
  const reportPath = join(process.cwd(), "reports", "news-feed-preview.json");
  if (!existsSync(reportPath)) return fallbackReport;

  try {
    const raw = JSON.parse(readFileSync(reportPath, "utf8")) as unknown;
    const record = asRecord(raw);
    const summary = asRecord(record.summary);
    const reportBase = {
      ok: booleanValue(record.ok),
      generatedAt: stringValue(record.generatedAt),
      mode: stringValue(record.mode, "unknown"),
      providerCount: numberValue(record.providerCount),
      totalFetchedCount: numberValue(record.totalFetchedCount),
      visibleCount: numberValue(record.visibleCount),
      hiddenCount: numberValue(record.hiddenCount),
      officialLinkPromotedCount: numberValue(record.officialLinkPromotedCount),
      providerResults: asArray(record.providerResults).map(providerResult),
      summary: {
        exposedSearchLinkCount: numberValue(summary.exposedSearchLinkCount),
        exposedNonOfficialLinkCount: numberValue(summary.exposedNonOfficialLinkCount),
        failedCount: numberValue(summary.failedCount),
        failureReasonTop10: asArray(summary.failureReasonTop10).map((item) => {
          const reason = asRecord(item);
          return {
            reason: stringValue(reason.reason, "unknown"),
            count: numberValue(reason.count)
          };
        }),
        categoryCounts: Object.fromEntries(
          Object.entries(asRecord(summary.categoryCounts)).map(([category, count]) => [category, numberValue(count)])
        )
      }
    };
    const gates = buildGates(reportBase);
    const report: NewsFeedPreviewReport = {
      ...reportBase,
      gates,
      nextActions: buildNextActions({ ...reportBase, gates, nextActions: [] })
    };

    return report;
  } catch {
    return {
      ...fallbackReport,
      gates: [
        {
          name: "news feed preview report",
          ok: false,
          detail: "reports/news-feed-preview.json 파싱에 실패했습니다.",
          action: "npm run news:preview"
        }
      ],
      nextActions: ["reports/news-feed-preview.json을 삭제하지 말고 npm run news:preview로 다시 생성하세요."]
    };
  }
}

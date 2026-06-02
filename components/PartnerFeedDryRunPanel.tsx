"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck, Download, Loader2, XCircle } from "lucide-react";

interface FeedIssue {
  index: number;
  field: string;
  message: string;
}

interface FeedPreviewDeal {
  id: string;
  title: string;
  mallName: string;
  discountRate: number;
  linkVerified?: boolean;
  linkStatus?: string;
  finalPurchaseUrl?: string;
}

interface FeedDryRunRow {
  index: number;
  externalId: string;
  mall: string;
  title: string;
  status: "ready" | "needs_fix";
  primaryUrlField: string;
  issueCount: number;
  issues: FeedIssue[];
}

interface FeedDryRunReadyItem {
  externalId?: string;
  mall?: string;
  title?: string;
  [key: string]: unknown;
}

interface FeedDryRunFixReport {
  source: string;
  generatedAt: string;
  nextAction: string;
  rows: Array<{
    row: FeedDryRunRow;
    item: FeedDryRunReadyItem;
  }>;
}

interface FeedDryRunResult {
  ok: boolean;
  source?: string;
  received: number;
  valid: number;
  invalid: number;
  issues: FeedIssue[];
  readyRate?: number;
  readyItems?: FeedDryRunReadyItem[];
  needsFixItems?: FeedDryRunFixReport["rows"];
  fixReport?: FeedDryRunFixReport;
  linkSummary?: {
    verified: number;
    needsReview: number;
  };
  benefitSummary?: {
    conditionReady: number;
    conditionNeedsReview: number;
    conditionReadyRate: number;
  };
  imageSummary?: {
    imageReady: number;
    imageNeedsReview: number;
    imageReadyRate: number;
  };
  rows?: FeedDryRunRow[];
  previewDeals?: FeedPreviewDeal[];
  message?: string;
}

interface PartnerFeedDryRunPanelProps {
  token?: string;
  initialJson: string;
}

function getReadyRate(result: FeedDryRunResult | null) {
  if (!result?.received) return 0;
  return result.readyRate ?? Math.round((result.valid / result.received) * 100);
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function PartnerFeedDryRunPanel({ token, initialJson }: PartnerFeedDryRunPanelProps) {
  const [jsonText, setJsonText] = useState(initialJson);
  const [result, setResult] = useState<FeedDryRunResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endpoint = useMemo(() => `/api/admin/import${token ? `?token=${encodeURIComponent(token)}` : ""}`, [token]);
  const readyRate = getReadyRate(result);
  const dryRunRows = result?.rows ?? [];
  const readyRows = dryRunRows.filter((row) => row.status === "ready");
  const needsFixRows = dryRunRows.filter((row) => row.status === "needs_fix");

  async function handleDryRun() {
    setError("");
    setIsSubmitting(true);

    try {
      const payload = JSON.parse(jsonText) as unknown;
      const items = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)
          ? (payload as { items: unknown[] }).items
          : payload && typeof payload === "object" && Array.isArray((payload as { deals?: unknown[] }).deals)
            ? (payload as { deals: unknown[] }).deals
            : null;

      if (!items) {
        throw new Error("배열, { items: [...] }, { deals: [...] } 형태의 JSON만 검증할 수 있습니다.");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "admin_paste_dry_run",
          items
        })
      });
      const data = (await response.json()) as FeedDryRunResult;

      if (!response.ok) {
        throw new Error(data.message ?? `피드 검증 요청 실패: HTTP ${response.status}`);
      }

      setResult(data);
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : "피드 검증 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="파트너 피드 붙여넣기 dry-run">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">운영 피드 붙여넣기 검증</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">JSON을 붙여넣고 노출 가능 여부를 바로 확인합니다</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            실제 반영 전 필수값, 가격, 상세 URL, 커뮤니티 링크, 검색 fallback을 dry-run으로 점검합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setJsonText(initialJson)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
        >
          <ClipboardCheck size={17} />
          샘플 복원
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <label htmlFor="partner-feed-json" className="text-sm font-black text-slate-950">
            피드 JSON
          </label>
          <textarea
            id="partner-feed-json"
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            spellCheck={false}
            className="mt-2 min-h-[320px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-50 outline-none ring-dossa-red/20 transition focus:border-dossa-red focus:ring-4"
          />
          <button
            type="button"
            onClick={handleDryRun}
            disabled={isSubmitting}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white transition hover:bg-dossa-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            dry-run 검증 실행
          </button>
        </div>

        <div className="space-y-3">
          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-dossa-red">
                <AlertCircle size={18} />
                검증 오류
              </div>
              <p className="mt-2 text-sm font-bold leading-6 text-red-900/75">{error}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "readyRate", value: `${readyRate}%`, description: "운영 반영 목표 100%" },
              { label: "ready", value: `${result?.valid ?? 0}행`, description: "즉시 반영 후보" },
              { label: "needs_fix", value: `${result?.invalid ?? 0}행`, description: "수정 필요" },
              { label: "검증 링크", value: `${result?.linkSummary?.verified ?? 0}개`, description: "상세 URL 통과" },
              { label: "혜택 조건", value: `${result?.benefitSummary?.conditionReadyRate ?? 0}%`, description: "출처·조건·수령 단계" },
              { label: "실상품 이미지", value: `${result?.imageSummary?.imageReadyRate ?? 0}%`, description: "imageUrl 준비율" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">검증 결과</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              {result?.message ?? "아직 실행 전입니다. 샘플 또는 운영 피드를 붙여넣고 dry-run을 실행하세요."}
            </p>
            {result?.issues?.length ? (
              <div className="mt-3 max-h-44 space-y-2 overflow-auto">
                {result.issues.slice(0, 8).map((issue, index) => (
                  <p key={`${issue.index}-${issue.field}-${index}`} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                    row {issue.index + 1} · {issue.field}: {issue.message}
                  </p>
                ))}
              </div>
            ) : result ? (
              <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                invalid=0 상태입니다. production 피드 연결 전 `feed:production:doctor`와 `release:doctor`를 이어서 실행하세요.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">행별 검수 결과</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  ready 행은 바로 반영 후보, needs_fix 행은 수정 필요 필드와 사유를 먼저 고칩니다.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                rows[].status
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  result
                    ? downloadJson("halindosa-ready-feed-items.json", {
                        source: result.source ?? "partner_feed",
                        generatedAt: new Date().toISOString(),
                        readyItems: result.readyItems ?? []
                      })
                    : undefined
                }
                disabled={!result?.readyItems?.length}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={15} />
                ready JSON 내보내기
              </button>
              <button
                type="button"
                onClick={() => (result ? downloadJson("halindosa-needs-fix-report.json", result.fixReport ?? { rows: [] }) : undefined)}
                disabled={!result?.needsFixItems?.length}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-dossa-red transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={15} />
                needs_fix 리포트 내보내기
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-emerald-50 p-3">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
                  <CheckCircle2 size={15} />
                  ready 행
                </div>
                <p className="mt-2 text-2xl font-black text-emerald-800">{readyRows.length}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-3">
                <div className="flex items-center gap-2 text-xs font-black text-dossa-red">
                  <XCircle size={15} />
                  needs_fix 행
                </div>
                <p className="mt-2 text-2xl font-black text-dossa-red">{needsFixRows.length}</p>
              </div>
            </div>

            {needsFixRows.length ? (
              <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                {needsFixRows.slice(0, 6).map((row) => (
                  <div key={`${row.index}-${row.externalId}`} className="rounded-2xl border border-red-100 bg-red-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-red-950">
                          row {row.index + 1} · {row.mall || "판매처 미입력"}
                        </p>
                        <p className="mt-1 truncate text-xs font-bold text-red-900/70">{row.title || row.externalId || "상품명 미입력"}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red">
                        {row.issueCount}개
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-black text-red-900">수정 필요 필드 · {row.primaryUrlField || "필수값"}</p>
                    <div className="mt-2 space-y-1.5">
                      {row.issues.slice(0, 3).map((issue, index) => (
                        <p key={`${row.index}-${issue.field}-${index}`} className="rounded-xl bg-white px-2.5 py-2 text-xs font-bold leading-5 text-red-900/75">
                          {issue.field}: {issue.message}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : dryRunRows.length ? (
              <div className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black leading-5 text-emerald-700">
                모든 행이 ready 상태입니다. 운영 반영 전에는 링크 샘플을 한 번 더 클릭해 최종 가격과 종료 여부를 확인하세요.
              </div>
            ) : (
              <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
                dry-run 실행 후 행별 상태가 표시됩니다.
              </div>
            )}
          </div>

          {result?.previewDeals?.length ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-black text-slate-950">미리보기</p>
              <div className="mt-3 space-y-2">
                {result.previewDeals.slice(0, 4).map((deal) => (
                  <div key={deal.id} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-black text-slate-950">{deal.title}</p>
                      <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-dossa-red">{deal.discountRate}%</span>
                    </div>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">
                      {deal.mallName} · {deal.linkVerified ? "상세 URL 확인" : "링크 보강 필요"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

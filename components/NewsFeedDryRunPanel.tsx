"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck, Download, Loader2 } from "lucide-react";

type ProviderName = "news" | "event_news" | "official_event" | "public_coupon";

interface DryRunRow {
  id: string;
  title: string;
  merchant: string;
  category: string;
  benefitType: string;
  finalUrl: string;
  sourceUrl: string;
  linkType: string;
  availability: string;
  validationStatus: "passed" | "failed" | "needs_review";
  hiddenReason: string;
  priorityScore: number;
  action: string;
}

interface DryRunResult {
  ok: boolean;
  source: string;
  provider: ProviderName;
  generatedAt: string;
  received: number;
  visible: number;
  hidden: number;
  duplicateRemovedCount?: number;
  officialLinkPromotedCount: number;
  exposedSearchLinkCount: number;
  exposedNonOfficialLinkCount: number;
  hiddenReasonTop5: Array<{ reason: string; count: number }>;
  rows: DryRunRow[];
  visibleRows: DryRunRow[];
  hiddenRows: DryRunRow[];
  nextActions: string[];
  message: string;
}

interface DryRunResponse {
  ok: boolean;
  message?: string;
  result?: DryRunResult;
}

interface NewsFeedDryRunPanelProps {
  token?: string;
  initialText: string;
}

const providers: Array<{ value: ProviderName; label: string }> = [
  { value: "official_event", label: "공식 이벤트" },
  { value: "public_coupon", label: "공공/쿠폰" },
  { value: "event_news", label: "이벤트 뉴스" },
  { value: "news", label: "뉴스/RSS" }
];

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

export function NewsFeedDryRunPanel({ token, initialText }: NewsFeedDryRunPanelProps) {
  const [feedText, setFeedText] = useState(initialText);
  const [provider, setProvider] = useState<ProviderName>("official_event");
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endpoint = useMemo(() => `/api/admin/news-feed-preview${token ? `?token=${encodeURIComponent(token)}` : ""}`, [token]);
  const readyRate = result?.received ? Math.round((result.visible / result.received) * 100) : 0;

  async function handleDryRun() {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "admin_news_feed_paste",
          provider,
          text: feedText
        })
      });
      const data = (await response.json()) as DryRunResponse;

      if (!response.ok || !data.result) {
        throw new Error(data.message ?? `공식 feed dry-run 실패: HTTP ${response.status}`);
      }

      setResult(data.result);
    } catch (caughtError) {
      setResult(null);
      setError(caughtError instanceof Error ? caughtError.message : "공식 feed dry-run 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm" aria-label="공식 뉴스 feed 붙여넣기 dry-run">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-emerald-700">공식 뉴스·혜택 feed 붙여넣기 검증</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">RSS/JSON/CSV/NDJSON을 붙여넣고 공식 링크 노출 여부를 즉시 확인합니다</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            검색 결과, 커뮤니티 원문, 뉴스 기사 단독 링크는 숨김 후보로 분류하고, 본문 안 공식 이벤트 링크만 사용자 이동 URL로 인정합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFeedText(initialText);
            setProvider("official_event");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
        >
          <ClipboardCheck size={17} />
          샘플 복원
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <label htmlFor="official-news-provider" className="text-sm font-black text-slate-950">
            Provider
          </label>
          <select
            id="official-news-provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value as ProviderName)}
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 outline-none ring-emerald-600/20 transition focus:border-emerald-600 focus:ring-4"
          >
            {providers.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <label htmlFor="official-news-feed-text" className="mt-4 block text-sm font-black text-slate-950">
            공식 RSS/JSON/CSV/NDJSON
          </label>
          <textarea
            id="official-news-feed-text"
            value={feedText}
            onChange={(event) => setFeedText(event.target.value)}
            spellCheck={false}
            className="mt-2 min-h-[340px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-50 outline-none ring-emerald-600/20 transition focus:border-emerald-600 focus:ring-4"
          />
          <button
            type="button"
            onClick={handleDryRun}
            disabled={isSubmitting}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            공식 feed dry-run 실행
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
              { label: "readyRate", value: `${readyRate}%`, description: "visible / received" },
              { label: "visible", value: `${result?.visible ?? 0}행`, description: "노출 가능 후보" },
              { label: "hidden", value: `${result?.hidden ?? 0}행`, description: "보강 필요" },
              { label: "공식 링크 승격", value: `${result?.officialLinkPromotedCount ?? 0}개`, description: "기사 본문 -> 공식 URL" },
              { label: "중복 병합 후보", value: `${result?.duplicateRemovedCount ?? 0}개`, description: "같은 혜택 반복 차단" },
              { label: "검색 링크 노출", value: `${result?.exposedSearchLinkCount ?? 0}개`, description: "목표 0" },
              { label: "비공식 링크 노출", value: `${result?.exposedNonOfficialLinkCount ?? 0}개`, description: "목표 0" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">dry-run 결과</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              {result?.message ?? "아직 실행 전입니다. 공식 RSS/JSON/CSV/NDJSON을 붙여넣고 dry-run을 실행하세요."}
            </p>
            {result?.hiddenReasonTop5?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {result.hiddenReasonTop5.map((item) => (
                  <span key={item.reason} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-dossa-red shadow-sm">
                    {item.reason} {item.count}
                  </span>
                ))}
              </div>
            ) : result ? (
              <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                hidden=0입니다. 운영 반영 전 refresh:news, verify:news, refresh:all 순서로 이어가세요.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">행별 판정</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  visible 행만 운영 후보로 쓰고, hidden 행은 공식 URL·종료일·제목을 보강합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => (result ? downloadJson("halindosa-official-news-feed-dry-run.json", result) : undefined)}
                disabled={!result}
                className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={14} />
                JSON
              </button>
            </div>

            <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
              {(result?.rows ?? []).slice(0, 10).map((row) => (
                <div key={`${row.id}-${row.finalUrl}`} className={`rounded-2xl p-3 ${row.validationStatus === "passed" ? "bg-emerald-50" : "bg-red-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-black text-slate-950">{row.title || row.id}</p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-500">{row.merchant} · {row.category} · {row.linkType}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${row.validationStatus === "passed" ? "bg-white text-emerald-700" : "bg-white text-dossa-red"}`}>
                      {row.validationStatus === "passed" ? "visible" : "hidden"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-600">{row.action}</p>
                  {row.hiddenReason ? <p className="mt-1 text-xs font-black text-dossa-red">{row.hiddenReason}</p> : null}
                  <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{row.finalUrl}</p>
                </div>
              ))}
              {result && !result.rows.length ? (
                <div className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-black text-dossa-red">
                  검증할 항목을 찾지 못했습니다. RSS item/entry 또는 JSON items/deals 배열 구조를 확인하세요.
                </div>
              ) : null}
              {!result ? (
                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-500">
                  dry-run 실행 후 행별 visible/hidden 판정이 표시됩니다.
                </div>
              ) : null}
            </div>

            {result?.nextActions?.length ? (
              <div className="mt-3 grid gap-2">
                {result.nextActions.slice(0, 3).map((action) => (
                  <p key={action} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
                    {action}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Eye, EyeOff, RefreshCw, RotateCcw } from "lucide-react";
import { getRelativeTime } from "@/lib/format";

type NewsOperationAction = "hide" | "restore" | "revalidate";

interface NewsOperationDeal {
  id?: string;
  title?: string;
  merchant?: string;
  category?: string;
  benefitType?: string;
  sourceName?: string;
  finalUrl?: string;
  validationStatus?: string;
  hiddenReason?: string;
  lastCheckedAt?: string;
}

interface NewsOperationAuditLog {
  action: string;
  id: string;
  reason: string;
  createdAt: string;
}

interface NewsOperationsReport {
  ok: boolean;
  visibleCount: number;
  hiddenCount: number;
  failedCount: number;
  categoryCoverage?: Array<{
    category: string;
    action: string;
    count: number;
    status: string;
    sampleTitle?: string;
  }>;
  operationalRisks?: string[];
  visibleDeals: NewsOperationDeal[];
  hiddenDeals: NewsOperationDeal[];
  refreshAll?: {
    ok: boolean;
    generatedAt: string;
    productDealsCount: number;
    newsDealsCount: number;
    hiddenCount: number;
    expiredCount: number;
    failedCount: number;
    steps: Array<{
      name: string;
      ok: boolean;
      status: number;
      startedAt: string;
      finishedAt: string;
      durationMs?: number;
    }>;
  };
  overrides: {
    hiddenCount: number;
    recentAudit: NewsOperationAuditLog[];
  };
}

interface AdminNewsOperationsPanelProps {
  apiHref: string;
  initialReport: NewsOperationsReport;
}

const actionLabels: Record<NewsOperationAction, string> = {
  hide: "숨김",
  restore: "복구",
  revalidate: "재검증"
};

function getDealId(deal: NewsOperationDeal) {
  return String(deal.id ?? "");
}

function getStatusCopy(action: NewsOperationAction, id: string) {
  if (action === "hide") return `${id} 혜택을 수동 숨김 처리했습니다.`;
  if (action === "restore") return `${id} 혜택을 복구 후보로 되돌렸습니다.`;
  return `${id} 혜택의 링크 재검증 요청을 기록했습니다.`;
}

function formatDuration(durationMs = 0) {
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}초`;
}

export function AdminNewsOperationsPanel({ apiHref, initialReport }: AdminNewsOperationsPanelProps) {
  const [report, setReport] = useState(initialReport);
  const [reason, setReason] = useState("manual_admin_review");
  const [pendingKey, setPendingKey] = useState("");
  const [message, setMessage] = useState("");
  const visibleDeals = useMemo(() => report.visibleDeals?.slice(0, 8) ?? [], [report.visibleDeals]);
  const hiddenDeals = useMemo(() => report.hiddenDeals?.slice(0, 8) ?? [], [report.hiddenDeals]);
  const categoryCoverage = useMemo(() => report.categoryCoverage ?? [], [report.categoryCoverage]);
  const refreshSteps = useMemo(() => report.refreshAll?.steps?.slice(0, 6) ?? [], [report.refreshAll?.steps]);
  const gapCount = categoryCoverage.filter((item) => item.status === "gap").length;

  const runAction = async (action: NewsOperationAction, deal: NewsOperationDeal) => {
    const id = getDealId(deal);
    if (!id) {
      setMessage("대상 혜택 ID가 없어 액션을 실행할 수 없습니다.");
      return;
    }

    const operationKey = `${action}:${id}`;
    setPendingKey(operationKey);
    setMessage("");

    try {
      const response = await fetch(apiHref, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          action,
          id,
          reason: reason.trim() || "manual_admin_review"
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; report?: NewsOperationsReport };

      if (!response.ok || !payload.ok || !payload.report) {
        throw new Error(payload.message || "운영 액션 처리에 실패했습니다.");
      }

      setReport(payload.report);
      setMessage(payload.message || getStatusCopy(action, id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "운영 액션 처리에 실패했습니다.");
    } finally {
      setPendingKey("");
    }
  };

  return (
    <section className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm" aria-label="공식 혜택 수동 운영 패널">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black text-brand-red">공식 혜택 수동 운영</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">숨김, 복구, 링크 재검증을 화면에서 바로 실행</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            검색 링크, 종료 이벤트, 공식 링크 누락이 발견되면 사용자 노출 전에 즉시 숨기고 audit log를 남깁니다.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-black">
          <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700">
            노출
            <b className="mt-0.5 block text-base">{report.visibleCount}</b>
          </span>
          <span className="rounded-2xl bg-red-50 px-3 py-2 text-brand-red">
            숨김
            <b className="mt-0.5 block text-base">{report.hiddenCount}</b>
          </span>
          <span className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-700">
            실패
            <b className="mt-0.5 block text-base">{report.failedCount}</b>
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">필수 혜택 카테고리 커버리지</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${gapCount ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              {gapCount ? `${gapCount}개 보강` : "전체 충족"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
            {categoryCoverage.map((item) => (
              <div key={item.category} className={`rounded-2xl p-3 ${item.status === "gap" ? "bg-amber-50" : "bg-white"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-black text-slate-800">{item.category}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.status === "gap" ? "bg-white text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {item.count}개
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] font-bold leading-4 text-slate-500">
                  {item.sampleTitle || item.action}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">refresh:all 운영 상태</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${report.refreshAll?.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brand-red"}`}>
              {report.refreshAll?.ok ? "정상" : "확인 필요"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-black">
            <span className="rounded-2xl bg-slate-50 px-2 py-2 text-slate-600">
              상품
              <b className="block text-sm text-slate-950">{report.refreshAll?.productDealsCount ?? 0}</b>
            </span>
            <span className="rounded-2xl bg-slate-50 px-2 py-2 text-slate-600">
              뉴스
              <b className="block text-sm text-slate-950">{report.refreshAll?.newsDealsCount ?? 0}</b>
            </span>
            <span className="rounded-2xl bg-slate-50 px-2 py-2 text-slate-600">
              실패
              <b className="block text-sm text-slate-950">{report.refreshAll?.failedCount ?? 0}</b>
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {refreshSteps.map((step) => (
              <div key={`${step.name}-${step.startedAt}`} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                <span className="truncate text-[11px] font-black text-slate-700">{step.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${step.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brand-red"}`}>
                  {step.ok ? "PASS" : `FAIL ${step.status}`} · {formatDuration(step.durationMs)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-brand-warm p-3">
        <p className="text-xs font-black text-slate-950">오늘 운영 리스크</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {(report.operationalRisks ?? []).map((risk) => (
            <p key={risk} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 shadow-sm">
              {risk}
            </p>
          ))}
        </div>
      </div>

      <label className="mt-4 block text-xs font-black text-slate-700" htmlFor="news-operation-reason">
        운영 사유
      </label>
      <input
        id="news-operation-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50"
        placeholder="manual_admin_review"
      />

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">노출 중 공식 혜택</p>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700">hide/revalidate</span>
          </div>
          <div className="mt-3 space-y-2">
            {visibleDeals.length ? visibleDeals.map((deal) => {
              const id = getDealId(deal);
              return (
                <article key={id} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-xs font-black text-slate-950">{deal.title}</p>
                      <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{deal.sourceName ?? deal.merchant} · {deal.category}</p>
                    </div>
                    {deal.finalUrl ? (
                      <a href={deal.finalUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-red-50 hover:text-brand-red" aria-label={`${deal.title} 공식 링크 새 탭 확인`}>
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => runAction("hide", deal)}
                      disabled={pendingKey === `hide:${id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-brand-red px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <EyeOff size={14} />
                      수동 숨김
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction("revalidate", deal)}
                      disabled={pendingKey === `revalidate:${id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <RefreshCw size={14} />
                      재검증 기록
                    </button>
                  </div>
                </article>
              );
            }) : (
              <p className="rounded-2xl bg-white p-3 text-xs font-black text-slate-500">노출 중인 공식 혜택이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-red-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">숨김/점검 공식 혜택</p>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-red">restore/revalidate</span>
          </div>
          <div className="mt-3 space-y-2">
            {hiddenDeals.length ? hiddenDeals.map((deal) => {
              const id = getDealId(deal);
              return (
                <article key={`${id}-${deal.hiddenReason ?? "hidden"}`} className="rounded-2xl bg-white p-3 shadow-sm">
                  <p className="line-clamp-1 text-xs font-black text-slate-950">{deal.title}</p>
                  <p className="mt-1 truncate text-[11px] font-bold text-brand-red">{deal.hiddenReason ?? "manual_hidden"}</p>
                  {deal.lastCheckedAt ? <p className="mt-1 text-[11px] font-bold text-slate-400">{getRelativeTime(deal.lastCheckedAt)}</p> : null}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => runAction("restore", deal)}
                      disabled={pendingKey === `restore:${id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-white px-3 text-xs font-black text-slate-700 ring-1 ring-slate-200 disabled:cursor-wait disabled:opacity-60"
                    >
                      <RotateCcw size={14} />
                      복구
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction("revalidate", deal)}
                      disabled={pendingKey === `revalidate:${id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <Eye size={14} />
                      재검증
                    </button>
                  </div>
                </article>
              );
            }) : (
              <p className="rounded-2xl bg-white p-3 text-xs font-black text-emerald-700">숨김 처리된 공식 혜택 없음</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-black text-slate-950">최근 운영 액션</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(report.overrides.recentAudit.length ? report.overrides.recentAudit : [{ action: "ready", id: "none", reason: "아직 수동 액션 없음", createdAt: "" }]).slice(0, 8).map((log) => (
            <span key={`${log.action}-${log.id}-${log.createdAt}`} className="min-w-[180px] rounded-2xl bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm">
              <b className="block text-xs text-slate-950">{actionLabels[log.action as NewsOperationAction] ?? log.action}</b>
              {log.id} · {log.reason}
            </span>
          ))}
        </div>
      </div>

      {message ? (
        <p role="status" aria-live="polite" className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          <CheckCircle2 size={17} />
          {message}
        </p>
      ) : null}
    </section>
  );
}

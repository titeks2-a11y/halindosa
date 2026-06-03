"use client";

import { useState } from "react";
import { RotateCw, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import type { RefreshDealsReport } from "@/lib/deals/refreshReport";

interface AdminDealQualityPanelProps {
  token?: string;
  initialReport: RefreshDealsReport;
}

export function AdminDealQualityPanel({ token, initialReport }: AdminDealQualityPanelProps) {
  const [report, setReport] = useState(initialReport);
  const [dealId, setDealId] = useState("");
  const [manualHiddenDealIds, setManualHiddenDealIds] = useState<string[]>([]);
  const [message, setMessage] = useState("최신 refresh 리포트 기준입니다.");
  const [isLoading, setIsLoading] = useState(false);

  async function runAction(action: "revalidate" | "hide" | "restore") {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/deal-quality${token ? `?token=${encodeURIComponent(token)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, dealId })
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setMessage(payload.message ?? "운영 액션 처리에 실패했습니다.");
        return;
      }

      setReport(payload.report);
      setManualHiddenDealIds(payload.manualHiddenDealIds ?? []);
      setMessage(action === "revalidate" ? "링크 검증 리포트를 다시 불러왔습니다." : "수동 운영 상태를 업데이트했습니다.");
    } catch {
      setMessage("네트워크 오류로 운영 액션을 처리하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  const failureReasons = Object.entries(report.failureReasons ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm" aria-label="자동 수집 품질 관리">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">자동 수집 품질 관리</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">검증된 구매 가능 상품만 노출</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            provider 수집, 중복 제거, 검색 링크 차단, 숨김 처리 결과를 운영자가 바로 확인합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => runAction("revalidate")}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        >
          <RotateCw size={17} />
          링크 재검증
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-6">
        {[
          ["전체 수집", report.fetchedCount],
          ["정규화", report.normalizedCount],
          ["신규 수집", report.insertedCount],
          ["기존 유지", report.updatedCount],
          ["숨김", report.hiddenCount],
          ["실패", report.failedCount]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-dossa-red" />
            <p className="text-sm font-black text-slate-950">Provider별 수집 현황</p>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {report.providerStats.map((item) => (
              <div key={item.provider} className="grid gap-2 py-3 text-xs font-bold text-slate-600 sm:grid-cols-[1fr_repeat(5,auto)] sm:items-center">
                <span className="font-black text-slate-950">{item.provider}</span>
                <span>configured {item.configured ? "Y" : "N"}</span>
                <span>feed {item.feedUrls}</span>
                <span>fetched {item.fetchedCount}</span>
                <span>hidden {item.hiddenCount ?? 0}</span>
                <span>failed {item.failedCount ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-black text-slate-950">수동 숨김/복구</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            로컬 운영 상태입니다. 배포 운영에서는 Supabase/Admin DB에 영구 저장하도록 확장합니다.
          </p>
          <input
            value={dealId}
            onChange={(event) => setDealId(event.target.value)}
            placeholder="deal id 입력"
            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-dossa-red"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => runAction("hide")}
              disabled={isLoading || !dealId.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-3 py-3 text-xs font-black text-dossa-red disabled:opacity-60"
            >
              <ToggleLeft size={16} />
              숨김
            </button>
            <button
              type="button"
              onClick={() => runAction("restore")}
              disabled={isLoading || !dealId.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 disabled:opacity-60"
            >
              <ToggleRight size={16} />
              복구
            </button>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-500">{message}</p>
          <p className="mt-2 text-xs font-bold text-slate-400">수동 숨김: {manualHiddenDealIds.length ? manualHiddenDealIds.join(", ") : "없음"}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-950">검증 실패 사유</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {failureReasons.length ? (
            failureReasons.map(([reason, count]) => (
              <span key={reason} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">
                {reason} {count}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm">실패 사유 없음</span>
          )}
        </div>
      </div>
    </section>
  );
}

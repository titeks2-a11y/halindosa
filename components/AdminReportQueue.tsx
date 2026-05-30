"use client";

import { useState } from "react";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { DealReport, getReportReasonLabel, getReportStatusLabel } from "@/lib/reports";

interface ReportSummary {
  total: number;
  open: number;
  reviewing: number;
  resolved: number;
  dismissed: number;
}

interface AdminReportQueueProps {
  initialReports: DealReport[];
  initialSummary: ReportSummary;
  token?: string;
}

interface ReportsResponse {
  ok: boolean;
  reports: DealReport[];
  summary: ReportSummary;
  message: string;
}

const statusActions = [
  { status: "reviewing", label: "검토중", icon: Eye },
  { status: "resolved", label: "해결", icon: CheckCircle2 },
  { status: "dismissed", label: "기각", icon: XCircle }
];

export function AdminReportQueue({ initialReports, initialSummary, token }: AdminReportQueueProps) {
  const [reports, setReports] = useState(initialReports);
  const [summary, setSummary] = useState(initialSummary);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const endpoint = `/api/admin/reports${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  const refreshReports = async () => {
    const response = await fetch(endpoint, { cache: "no-store" });
    const data = (await response.json()) as ReportsResponse;

    if (data.ok) {
      setReports(data.reports);
      setSummary(data.summary);
    }
  };

  const updateStatus = async (reportId: string, status: string) => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reportId, status })
      });
      const data = (await response.json()) as ReportsResponse;

      setMessage(data.message);
      if (data.ok) {
        setSummary(data.summary);
        await refreshReports();
      }
    } catch {
      setMessage("신고 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">가격 오류 신고 큐</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            전체 {summary.total}건 · 미처리 {summary.open}건 · 검토중 {summary.reviewing}건 · 해결 {summary.resolved}건
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            처리 기준: 가격/품절 신고는 판매처 확인 후 해결 또는 기각으로 닫고, 실제 결제 문의는 판매처로 안내합니다.
          </p>
        </div>
        <a
          href={endpoint}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
        >
          신고 API 보기
        </a>
      </div>

      {message ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-dossa-deep">{message}</p> : null}

      {reports.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {reports.map((report) => (
            <div key={report.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">{report.title}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    report.status === "resolved"
                      ? "bg-emerald-50 text-emerald-700"
                      : report.status === "dismissed"
                        ? "bg-slate-200 text-slate-600"
                        : "bg-red-50 text-dossa-red"
                  }`}
                >
                  {getReportStatusLabel(report.status)}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500">
                접수번호 {report.id.slice(0, 8)} · {report.mall} · {getReportReasonLabel(report.reason)} · {new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(report.receivedAt))}
              </p>
              {report.message ? <p className="mt-2 text-sm font-semibold text-slate-600">{report.message}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {statusActions.map((action) => {
                  const Icon = action.icon;
                  const active = report.status === action.status;

                  return (
                    <button
                      key={action.status}
                      type="button"
                      disabled={isLoading || active}
                      onClick={() => updateStatus(report.id, action.status)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black transition ${
                        active
                          ? "bg-slate-200 text-slate-400"
                          : "bg-white text-slate-700 hover:bg-dossa-red hover:text-white"
                      } disabled:cursor-not-allowed`}
                    >
                      <Icon size={14} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm font-black text-slate-700">접수된 신고가 없습니다.</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">상세 페이지의 오류 신고로 접수된 항목이 여기에 표시됩니다.</p>
        </div>
      )}
    </section>
  );
}

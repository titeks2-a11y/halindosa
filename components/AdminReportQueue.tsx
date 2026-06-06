"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Link2Off, PackageX, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import type { ReportSlaSummary } from "@/lib/reportSla";
import type { DealReport } from "@/lib/reports";
import { getReportPriorityLabel, getReportReasonLabel, getReportStatusLabel } from "@/lib/reportDisplay";

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
  initialSla: ReportSlaSummary;
  initialStorage?: ReportStorage;
  token?: string;
}

interface ReportsResponse {
  ok: boolean;
  reports: DealReport[];
  summary: ReportSummary;
  sla: ReportSlaSummary;
  storage?: ReportStorage;
  operation?: {
    action: "hide" | "restore" | "revalidate";
    dealId: string;
    reason: string;
  } | null;
  message: string;
}

interface ReportStorage {
  localFile: boolean;
  localPath: string;
  supabaseConfigured: boolean;
  supabaseTable: string;
  maxStoredReports: number;
  persistence: string;
}

const fallbackSlaSummary: ReportSlaSummary = {
  active: 0,
  urgent: 0,
  dueSoon: 0,
  overdue: 0,
  slaTargetMet: true,
  oldestAgeHours: 0,
  nextAction: "현재 신고 SLA는 정상입니다.",
  priorityReports: []
};

const statusActions = [
  { status: "reviewing", label: "검토중", icon: Eye },
  { status: "resolved", label: "해결", icon: CheckCircle2 },
  { status: "dismissed", label: "기각", icon: XCircle }
];

const operationActions = [
  {
    action: "hide",
    status: "reviewing",
    label: "노출 숨김",
    icon: EyeOff,
    reason: "admin_report_manual_hide"
  },
  {
    action: "revalidate",
    status: "reviewing",
    label: "재검증 기록",
    icon: RefreshCw,
    reason: "admin_report_revalidate"
  },
  {
    action: "restore",
    status: "resolved",
    label: "노출 복구",
    icon: RotateCcw,
    reason: "admin_report_restore"
  }
] as const;

const priorityClassNames = {
  high: "bg-red-50 text-dossa-red",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-600"
};

const slaSeverityClassNames = {
  overdue: "bg-red-100 text-red-800",
  due_soon: "bg-amber-100 text-amber-800",
  watch: "bg-blue-50 text-blue-800",
  clear: "bg-emerald-50 text-emerald-700"
};

const operationActionLabels = {
  hide: "노출 숨김 우선",
  revalidate: "링크/정보 재검증",
  review: "운영 메모 확인"
};

export function AdminReportQueue({ initialReports, initialSummary, initialSla, initialStorage, token }: AdminReportQueueProps) {
  const [reports, setReports] = useState(initialReports);
  const [summary, setSummary] = useState(initialSummary);
  const [sla, setSla] = useState<ReportSlaSummary>(initialSla ?? fallbackSlaSummary);
  const [storage, setStorage] = useState<ReportStorage | undefined>(initialStorage);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const endpoint = `/api/admin/reports${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  const storageLabel =
    storage?.persistence === "supabase_and_local_file"
      ? "Supabase + 로컬 운영 파일"
      : storage?.persistence === "local_file"
        ? "로컬 운영 파일"
        : "메모리";
  const urgentReports = reports.filter((report) => report.status !== "resolved" && report.status !== "dismissed" && report.priority === "high");
  const reasonSummary = [
    {
      label: "링크 오류",
      count: reports.filter((report) => report.reason === "link_error" && report.status !== "resolved" && report.status !== "dismissed").length,
      icon: Link2Off
    },
    {
      label: "품절",
      count: reports.filter((report) => report.reason === "sold_out" && report.status !== "resolved" && report.status !== "dismissed").length,
      icon: PackageX
    },
    {
      label: "종료",
      count: reports.filter((report) => report.reason === "expired" && report.status !== "resolved" && report.status !== "dismissed").length,
      icon: AlertTriangle
    }
  ];

  const refreshReports = async () => {
    const response = await fetch(endpoint, { cache: "no-store" });
    const data = (await response.json()) as ReportsResponse;

    if (data.ok) {
      setReports(data.reports);
      setSummary(data.summary);
      setSla(data.sla ?? fallbackSlaSummary);
      setStorage(data.storage);
    }
  };

  const updateStatus = async (
    reportId: string,
    status: string,
    operation?: {
      operationAction: "hide" | "restore" | "revalidate";
      operationReason: string;
    }
  ) => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reportId, status, ...operation })
      });
      const data = (await response.json()) as ReportsResponse;

      setMessage(data.message);
      if (data.ok) {
        setSummary(data.summary);
        setSla(data.sla ?? fallbackSlaSummary);
        setStorage(data.storage);
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
          <h2 className="text-xl font-black text-slate-950">특가 품질 신고 큐</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            전체 {summary.total}건 · 미처리 {summary.open}건 · 우선 검수 {urgentReports.length}건 · 검토중 {summary.reviewing}건 · 해결 {summary.resolved}건
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            처리 기준: 링크 오류, 품절, 종료 신고는 판매처 확인 후 먼저 처리하고 실제 결제 문의는 판매처로 안내합니다.
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            목표 처리 시간: 우선 검수 6시간 이내, 일반 검수 영업일 24시간 이내를 기준으로 운영합니다.
          </p>
          <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${sla.slaTargetMet ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-dossa-red"}`}>
            SLA {sla.slaTargetMet ? "정상" : "지연"} · 활성 {sla.active}건 · 임박 {sla.dueSoon}건 · 초과 {sla.overdue}건
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            저장 방식: {storageLabel} · 최대 {storage?.maxStoredReports ?? 200}건 보관 · 상품 숨김/복구 액션은 노출 정책에 즉시 반영됩니다.
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            Supabase 신고 저장: {storage?.supabaseConfigured ? `${storage.supabaseTable} 연결됨` : "미연결, 로컬 fallback 사용"}
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

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {[
          { label: "SLA 활성", value: sla.active, description: "미처리/검토중 신고" },
          { label: "우선 검수", value: sla.urgent, description: "링크·품절·종료 중심" },
          { label: "SLA 임박", value: sla.dueSoon, description: "처리 목표 75% 경과" },
          { label: "SLA 초과", value: sla.overdue, description: "즉시 숨김/재검증 후보" }
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border p-3 ${item.label === "SLA 초과" && item.value > 0 ? "border-red-100 bg-red-50" : "border-slate-100 bg-slate-50"}`}>
            <p className="text-xs font-black text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{item.value}건</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-red-100 bg-red-50/70 p-3">
        <p className="text-xs font-black text-dossa-red">다음 운영 액션</p>
        <p className="mt-1 text-sm font-bold leading-6 text-red-950/80">{sla.nextAction}</p>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs font-black text-slate-500">SLA 우선 처리 목록</p>
        {sla.priorityReports.length ? (
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {sla.priorityReports.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-black text-slate-950">{item.title}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${slaSeverityClassNames[item.severity]}`}>
                    {item.severity === "overdue" ? "SLA 초과" : item.severity === "due_soon" ? "SLA 임박" : item.severity === "watch" ? "감시" : "정상"}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {item.reasonLabel} · {item.ageLabel} · 목표 {item.slaHours}시간
                </p>
                <p className="mt-2 text-xs font-black text-dossa-red">{operationActionLabels[item.recommendedOperationAction]}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-500">
            현재 SLA 임박 또는 초과 신고가 없습니다. 새 링크 오류, 품절, 종료 신고가 접수되면 이 영역에 먼저 표시됩니다.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {reasonSummary.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
                  <Icon size={16} className="text-dossa-red" />
                  {item.label}
                </span>
                <span className="text-lg font-black text-slate-950">{item.count}건</span>
              </div>
              <p className="mt-1 text-xs font-bold text-slate-500">판매처 확인 후 노출 상태를 조정합니다.</p>
            </div>
          );
        })}
      </div>

      {reports.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {reports.map((report) => (
            <div key={report.id} className={`rounded-2xl p-4 ${report.priority === "high" ? "border border-red-100 bg-red-50/60" : "bg-slate-50"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">{report.title}</p>
                <span className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${priorityClassNames[report.priority]}`}>
                    {getReportPriorityLabel(report.priority)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      report.status === "resolved"
                        ? "bg-emerald-50 text-emerald-700"
                        : report.status === "dismissed"
                          ? "bg-slate-200 text-slate-600"
                          : "bg-white text-dossa-red"
                    }`}
                  >
                    {getReportStatusLabel(report.status)}
                  </span>
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500">
                접수번호 {report.id.slice(0, 8)} · {report.mall} · {getReportReasonLabel(report.reason)} · {new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(report.receivedAt))}
              </p>
              <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                권장 처리: {report.recommendedAction}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <p className="rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                  사용자 안내: {report.userExpectation}
                </p>
                <p className="rounded-2xl bg-white px-3 py-2 text-xs font-black leading-5 text-dossa-red">
                  처리 목표: {report.operatorSla} · {report.queueLabel}
                </p>
              </div>
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
              <div className="mt-2 flex flex-wrap gap-2 border-t border-white/70 pt-2">
                {operationActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.action}
                      type="button"
                      disabled={isLoading}
                      onClick={() =>
                        updateStatus(report.id, action.status, {
                          operationAction: action.action,
                          operationReason: `${action.reason}:${report.reason}`
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-dossa-deep transition hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`${report.title} ${action.label}`}
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

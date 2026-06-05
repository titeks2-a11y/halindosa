import { Download, ShieldCheck } from "lucide-react";
import { getRelativeTime } from "@/lib/format";
import type { ExposurePolicyReport } from "@/lib/operations/exposurePolicy";

interface AdminExposurePolicyPanelProps {
  apiHref: string;
  csvHref: string;
  report: ExposurePolicyReport;
}

export function AdminExposurePolicyPanel({ apiHref, csvHref, report }: AdminExposurePolicyPanelProps) {
  const liveProbeFailureReasons = Object.entries(report.liveProbeFailureReasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const liveProbeFailedHosts = Object.entries(report.liveProbeHostFailureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm" aria-label="노출 정책 감사">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-emerald-700">노출 정책 감사</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">사용자에게 보이는 링크만 한 번 더 검증</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            `reports/exposure-policy.json` 기준으로 검색 링크, 품절/종료 링크, 실패 링크가 노출 목록에 섞였는지 점검합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={apiHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
          >
            <ShieldCheck size={17} aria-hidden="true" />
            노출 감사 JSON
          </a>
          <a
            href={csvHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700"
          >
            <Download size={17} aria-hidden="true" />
            노출 감사 CSV
          </a>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["감사 상품", report.summary.auditedItems, "전체 노출 후보"],
          ["노출 가능", report.summary.exposedItems, "정책 통과"],
          ["문제 노출", report.summary.badExposedItems, "즉시 0 유지"],
          ["검색/품절 노출", report.summary.searchLinksExposed + report.summary.soldOutExposed, "차단 대상"]
        ].map(([label, value, description]) => (
          <div key={label} className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-black text-emerald-700">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
            <p className="mt-1 text-xs font-bold text-emerald-900/70">{description}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">출시 판정</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${report.ok ? "bg-white text-emerald-700" : "bg-white text-dossa-red"}`}>
              {report.ok ? "통과" : "점검 필요"}
            </span>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-900/75">
            평균 우선순위 {report.summary.averagePriorityScore}점 · 숨김 후보 {report.summary.hiddenItems}개 · 실패 노출 {report.summary.failedExposed}개
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-900/75">
            생성 시각 {report.generatedAt ? getRelativeTime(report.generatedAt) : "리포트 없음"}
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-900/75">
            라이브 HTTP 검증 {report.liveProbe.enabled ? `${report.liveProbe.checked}개 검사 · 실패 ${report.liveProbe.failed}개` : "미실행"} · timeout {report.liveProbe.timeoutMs}ms
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-emerald-900/75">
            노출 강한 실패 {report.liveProbeReviewSummary.exposedHardFailureCount ?? report.liveProbeReviewSummary.hardFailureCount}개 · 총 강한 실패 {report.liveProbeReviewSummary.hardFailureCount}개 · 노출 품절 본문 {report.liveProbeReviewSummary.exposedSellerUnavailableSignals ?? report.liveProbeReviewSummary.sellerUnavailableSignals}개
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">노출 차단 정책</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
              availability={report.exposurePolicy?.availability ?? "active"}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
              validation={report.exposurePolicy?.validationStatus ?? "passed"}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
              search/seller_search/unavailable 차단
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
              finalUrl 필수
            </span>
          </div>
          <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
            문제가 생기면 `npm run verify:links`, `npm run verify:links:live`, `npm run verify:products`, `npm run exposure:doctor` 순서로 원인을 먼저 확인합니다.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {[
          ["라이브 모드", report.liveProbe.enabled ? "실행" : "정적", report.liveProbe.enabled ? "실제 HTTP/redirect 확인" : "정책 기반 검증"],
          ["검사/통과", `${report.liveProbe.checked}/${report.liveProbe.passed}`, "live probe 결과"],
          ["노출 강한 실패", report.liveProbeReviewSummary.exposedHardFailureCount ?? report.liveProbeReviewSummary.hardFailureCount, "고객 노출 404/410/5xx/timeout/품절"],
          ["총 강한 실패", report.liveProbeReviewSummary.hardFailureCount, "숨김 리뷰 큐 포함"],
          ["접근 보호 신호", report.liveProbeReviewSummary.accessProtectedCount, "403/robots/access"],
          ["리다이렉트", report.liveProbe.redirected, `최종 URL 변경 ${report.liveProbe.finalUrlChanged}`],
          ["노출 품절 문구", report.liveProbeReviewSummary.exposedSellerUnavailableSignals ?? report.liveProbe.unavailableText, "고객 노출 본문 감지"]
        ].map(([label, value, description]) => (
          <div key={label} className="rounded-2xl border border-emerald-100 bg-white p-3">
            <p className="text-[11px] font-black text-emerald-700">{label}</p>
            <p className="mt-1 text-lg font-black text-slate-950">{typeof value === "number" ? value.toLocaleString("ko-KR") : value}</p>
            <p className="mt-1 text-[11px] font-bold text-slate-500">{description}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-black text-slate-950">라이브 실패 사유 분포</p>
          <p className="text-xs font-bold text-amber-800">{report.liveProbeReviewSummary.interpretation}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(liveProbeFailureReasons.length ? liveProbeFailureReasons : [["none", 0]]).map(([reason, count]) => (
            <span key={reason} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-amber-800 shadow-sm">
              {reason === "none" ? "실패 사유 없음" : reason} {Number(count).toLocaleString("ko-KR")}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-amber-100 pt-3">
          {(liveProbeFailedHosts.length ? liveProbeFailedHosts : [["none", 0]]).map(([host, count]) => (
            <span key={host} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-amber-800 shadow-sm">
              {host === "none" ? "실패 판매처 없음" : host} {Number(count).toLocaleString("ko-KR")}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">상품별 노출 감사 샘플</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              전체 행은 CSV로 내려받고, 화면에서는 대표 노출 후보의 최종 도메인과 검증 상태를 빠르게 확인합니다.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            {report.auditedItems.length.toLocaleString("ko-KR")}개 행
          </span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {(report.auditedItems.length ? report.auditedItems.slice(0, 6) : []).map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-black text-slate-950">{item.id}</p>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-emerald-700">
                  {item.validationStatus}
                </span>
              </div>
              <p className="mt-1 truncate text-xs font-bold text-slate-600">{item.host || item.finalUrl}</p>
              <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
                {item.linkType} · {item.availability} · 우선순위 {item.priorityScore} · {item.lastCheckedAt ? getRelativeTime(item.lastCheckedAt) : "확인 시각 없음"}
              </p>
            </div>
          ))}
          {!report.auditedItems.length ? (
            <p className="rounded-2xl bg-amber-50 p-3 text-xs font-black text-amber-700">상품별 감사 행 없음. `npm run exposure:doctor`를 실행하세요.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

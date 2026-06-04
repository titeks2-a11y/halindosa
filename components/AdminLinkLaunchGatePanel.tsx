import { Download, ShieldCheck } from "lucide-react";
import { getRelativeTime } from "@/lib/format";
import type { LinkLaunchGateReport } from "@/lib/operations/linkLaunchGate";

interface AdminLinkLaunchGatePanelProps {
  apiHref: string;
  csvHref: string;
  report: LinkLaunchGateReport;
}

export function AdminLinkLaunchGatePanel({ apiHref, csvHref, report }: AdminLinkLaunchGatePanelProps) {
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm" aria-label="최종 링크 출시 게이트">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black text-sky-700">최종 링크 출시 게이트</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">검색·품절·깨진 링크 0건을 제출 직전에 확인합니다</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            `reports/link-launch-gate.json` 기준으로 노출 상품, 검색 링크, 품절/종료 링크, invalid URL, live probe hard failure를 한 번에 판정합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={apiHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 py-3 text-sm font-black text-white"
          >
            <ShieldCheck size={17} aria-hidden="true" />
            출시 게이트 JSON
          </a>
          <a
            href={csvHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black text-sky-700"
          >
            <Download size={17} aria-hidden="true" />
            출시 게이트 CSV
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["감사 상품", report.actual.auditedItems, "전체 제출 후보"],
          ["노출 상품", report.actual.exposedItems, "사용자 공개"],
          ["검증 구매 링크", report.actual.verifiedPurchaseLinks, "구매/공식 혜택"],
          ["검색 링크 노출", report.actual.exposedSearchLinks, "항상 0"],
          ["품절/종료 노출", report.actual.exposedSoldOutLinks, "항상 0"],
          ["실패 노출", report.actual.failedExposureItems, "항상 0"]
        ].map(([label, value, description]) => (
          <div key={label} className="rounded-2xl bg-sky-50 p-4">
            <p className="text-xs font-black text-sky-700">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{Number(value).toLocaleString("ko-KR")}</p>
            <p className="mt-1 text-xs font-bold text-sky-900/70">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className={`rounded-2xl border p-4 ${report.ok ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">Play Store 제출 판정</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${report.ok ? "bg-white text-emerald-700" : "bg-white text-dossa-red"}`}>
              {report.ok ? "통과" : "차단"}
            </span>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            생성 시각 {report.generatedAt ? getRelativeTime(report.generatedAt) : "리포트 없음"} · release doctor 실패 {report.actual.releaseDoctorFailures}개
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            깨진 링크 {report.actual.exposedBrokenLinks}개 · invalid URL {report.actual.exposedInvalidUrls}개 · hidden {report.actual.hiddenProducts}개
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
            live hard failure {report.actual.liveHardFailures}개 · 품절 본문 신호 {report.actual.sellerUnavailableSignals}개
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">최종 제출 규칙</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
              availability={report.policy.exposurePolicy?.availability ?? "active"}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
              validation={report.policy.exposurePolicy?.validationStatus ?? "passed"}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
              검색·대표몰·품절 링크 0건
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
              HTTP(S) finalUrl 필수
            </span>
          </div>
          <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
            제출 직전에는 `npm run verify:links && npm run verify:products && npm run exposure:doctor && npm run link:launch:gate` 순서로 갱신한 뒤 CSV에서 실패 노출 행이 없는지 확인합니다.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-black text-slate-950">라이브 검증 해석</p>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700 shadow-sm">
            {report.liveProbeReviewSummary.status ?? "unknown"}
          </span>
        </div>
        <p className="mt-2 text-xs font-bold leading-5 text-sky-900/75">
          {report.liveProbeReviewSummary.interpretation ?? "라이브 검증 해석 없음"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(report.issues.length ? report.issues : ["이슈 없음"]).map((issue) => (
            <span key={issue} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-sky-800 shadow-sm">
              {issue}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

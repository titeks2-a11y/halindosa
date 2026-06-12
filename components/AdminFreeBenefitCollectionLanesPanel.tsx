import { DatabaseZap, Download, ShieldCheck } from "lucide-react";
import type { FreeBenefitCollectionLanesReport } from "@/lib/operations/freeBenefitCollectionLanes";

interface AdminFreeBenefitCollectionLanesPanelProps {
  report: FreeBenefitCollectionLanesReport;
  apiHref: string;
  csvHref: string;
}

function laneTone(status: string) {
  if (status === "healthy") return "bg-emerald-50 text-emerald-700";
  if (status === "thin") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-dossa-red";
}

export function AdminFreeBenefitCollectionLanesPanel({ report, apiHref, csvHref }: AdminFreeBenefitCollectionLanesPanelProps) {
  const topLanes = report.lanes.slice(0, 8);
  const nextActions = report.nextActions.slice(0, 4);

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm" aria-label="무료혜택 수집축 운영 리포트">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-emerald-700">무료혜택 수집축 운영 리포트</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">공식 이벤트·쿠폰·샘플 수집 공백을 매일 점검합니다</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            홈 상단에 노출할 소비자형 공식 무료혜택이 충분한지, 수집축별로 비어 있는 구간이 없는지 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={apiHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            <DatabaseZap size={17} />
            collection JSON
          </a>
          <a href={csvHref} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black text-emerald-700">
            <Download size={17} />
            collection CSV
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-black text-emerald-700">운영 판정</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{report.ok ? "정상" : "점검"}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-emerald-900/70">소비자형 공식 혜택 기준</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-xs font-black text-blue-700">소비자형 혜택</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{report.summary.consumerVisibleItems.toLocaleString("ko-KR")}개</p>
          <p className="mt-1 text-xs font-bold leading-5 text-blue-900/70">공공성 기본 노출 제외</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black text-slate-500">정상 수집축</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{report.summary.healthyLanes}/{report.lanes.length}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">공식 feed 연결 우선순위</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-xs font-black text-amber-700">얇은 축</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{report.summary.thinLanes}개</p>
          <p className="mt-1 text-xs font-bold leading-5 text-amber-900/70">feed 보강 후보</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-4">
          <p className="text-xs font-black text-dossa-red">빈 축</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{report.summary.emptyLanes}개</p>
          <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">출시 전 0 유지</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-950">수집축별 상태</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black ${report.ok ? "bg-white text-emerald-700" : "bg-red-100 text-dossa-red"}`}>
              <ShieldCheck size={14} />
              {report.ok ? "전체 운영 가능" : "보강 필요"}
            </span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {topLanes.map((lane) => (
              <div key={lane.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${laneTone(lane.status)}`}>{lane.status}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">기준 {lane.minimum}개</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">공식 {lane.officialCount}</span>
                </div>
                <p className="mt-2 text-sm font-black text-slate-950">{lane.label}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  노출 {lane.count}개 · 구매조건 없음 {lane.noPurchaseCount}개 · 검증 {lane.verifiedCount}개
                </p>
                <p className="mt-2 line-clamp-1 text-[11px] font-black text-emerald-700">{lane.envKey}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-slate-950">상위 수집 후보와 다음 액션</p>
          <p className="mt-1 text-xs font-bold leading-5 text-blue-900/70">
            빈 수집축이 생기면 아래 env key에 공식 이벤트 JSON/RSS/API feed를 먼저 연결합니다.
          </p>
          <div className="mt-3 space-y-2">
            {(nextActions.length ? nextActions : [{ id: "ready", title: "수집축 정상 유지", action: "현재 모든 무료혜택 수집축이 운영 기준을 충족합니다.", envKey: "npm run benefit:collection:report" }]).map((action) => (
              <div key={action.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-xs font-black text-slate-950">{action.title}</p>
                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">{action.action}</p>
                <p className="mt-2 rounded-xl bg-slate-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{action.envKey}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-slate-600 shadow-sm">
            <p><b className="text-slate-950">재생성:</b> npm run benefit:collection:report</p>
            <p className="mt-1">사용자 CTA는 공식 이벤트·쿠폰·샘플·신청 URL만 허용하고 검색/대표몰/커뮤니티 링크는 제외합니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

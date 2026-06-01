import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { ReportForm } from "@/components/ReportForm";
import { findDealById } from "@/lib/dealService";
import { formatPrice } from "@/lib/format";
import { getReportReasonLabel, getReportResolutionPlan, ReportReason } from "@/lib/reports";

interface ReportsPageProps {
  searchParams: Promise<{
    dealId?: string;
    reason?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { dealId, reason } = await searchParams;
  const deal = dealId ? findDealById(dealId) : null;
  const reportFlowCards: ReportReason[] = ["link_error", "expired", "sold_out", "price_changed"];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href={deal ? `/deals/${deal.id}` : "/"} className="inline-flex items-center gap-2 text-sm font-black text-dossa-red">
          <ArrowLeft size={17} />
          돌아가기
        </Link>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
              <AlertTriangle size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-950">특가 정보 신고</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">가격, 품절, 종료, 링크 오류를 할인도사에 알려주세요.</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-dossa-deep">
            신고는 할인도사의 혜택 정보 품질 개선을 위한 접수입니다. 주문 취소, 환불, 배송 문의는 구매한 판매처 고객센터에서 처리해야 합니다.
          </div>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4" aria-label="신고 처리 흐름">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-dossa-red">신고 처리 흐름</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">링크와 종료 정보는 우선 확인합니다</h2>
              </div>
              <p className="max-w-sm text-xs font-bold leading-5 text-slate-500">
                접수된 신고는 운영 검토 기준에 따라 링크 교체, 종료 정리, 가격 기준 재확인으로 분류됩니다.
              </p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {reportFlowCards.map((reportReason) => {
                const plan = getReportResolutionPlan(reportReason);

                return (
                  <div key={reportReason} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-black text-slate-950">{getReportReasonLabel(reportReason)}</p>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-black text-dossa-red shadow-sm">{plan.operatorSla}</span>
                    </div>
                    <p className="mt-1 text-xs font-black text-dossa-red">{plan.queueLabel}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{plan.userExpectation}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
              링크 오류, 종료, 품절 신고는 상단 노출 품질에 직접 반영됩니다. 최종 환불/배송 처리는 판매처 기준을 따릅니다.
            </p>
          </section>

          {deal ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-dossa-red">{deal.mall}</p>
              <p className="mt-1 text-base font-black text-slate-950">{deal.title}</p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                현재 표시가: {formatPrice(deal.salePrice)} · 할인율 {deal.discountRate}%
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
              신고할 특가를 찾을 수 없습니다. 상세 페이지에서 다시 시도해주세요.
            </div>
          )}

          <ReportForm dealId={deal?.id ?? ""} disabled={!deal} initialReason={reason} />
        </section>
      </div>
    </main>
  );
}

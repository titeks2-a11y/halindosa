import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { ReportForm } from "@/components/ReportForm";
import { findDealById } from "@/lib/dealService";
import { formatPrice } from "@/lib/format";

interface ReportsPageProps {
  searchParams: Promise<{
    dealId?: string;
    reason?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { dealId, reason } = await searchParams;
  const deal = dealId ? findDealById(dealId) : null;

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

import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { ReportForm } from "@/components/ReportForm";
import { findDealById } from "@/lib/dealService";
import { formatPrice } from "@/lib/format";

interface ReportsPageProps {
  searchParams: Promise<{
    dealId?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { dealId } = await searchParams;
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
              <h1 className="text-2xl font-black text-slate-950">가격 오류 신고</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">운영 검수용 신고 접수 화면입니다.</p>
            </div>
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

          <ReportForm dealId={deal?.id ?? ""} disabled={!deal} />
        </section>
      </div>
    </main>
  );
}

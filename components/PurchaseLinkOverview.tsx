import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { getRelativeTime } from "@/lib/format";

interface PurchaseLinkOverviewProps {
  total: number;
  verifiedLinkCount: number;
  reviewLinkCount: number;
  latestPriceCheckedAt: string;
  onShowVerified: () => void;
  onShowReview: () => void;
}

export function PurchaseLinkOverview({
  total,
  verifiedLinkCount,
  reviewLinkCount,
  latestPriceCheckedAt,
  onShowVerified,
  onShowReview
}: PurchaseLinkOverviewProps) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="구매 이동 안내">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-black text-dossa-red">
            <ShieldCheck size={15} />
            구매 이동 안내
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-950">구매처 바로 확인 상품을 먼저 보여드려요</h3>
          <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-500">
            상품 상세 URL이 확인된 특가는 바로 판매처 확인으로 이어지고, 확인 단계 상품은 이동 전 안내를 한 번 더 보여줍니다.
            최종 가격과 재고는 판매처에서 다시 확인하세요.
          </p>
        </div>
        <p className="shrink-0 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
          가격 기준 {latestPriceCheckedAt ? getRelativeTime(latestPriceCheckedAt) : "확인 중"}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onShowVerified}
          className="min-h-[86px] rounded-3xl border border-emerald-100 bg-emerald-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100"
          aria-label={`구매처 바로 확인 상품 ${verifiedLinkCount}개 보기`}
        >
          <CheckCircle2 size={19} className="text-emerald-700" />
          <span className="mt-2 block text-sm font-black text-emerald-950">구매처 바로 확인</span>
          <span className="mt-1 block text-xs font-bold text-emerald-700">{verifiedLinkCount}개 상품</span>
        </button>
        <button
          type="button"
          onClick={onShowReview}
          className="min-h-[86px] rounded-3xl border border-amber-100 bg-amber-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-100"
          aria-label={`판매처 확인 단계 상품 ${reviewLinkCount}개 보기`}
        >
          <AlertTriangle size={19} className="text-amber-700" />
          <span className="mt-2 block text-sm font-black text-amber-950">판매처 확인 단계</span>
          <span className="mt-1 block text-xs font-bold text-amber-700">{reviewLinkCount}개 상품</span>
        </button>
        <div className="min-h-[86px] rounded-3xl border border-slate-100 bg-slate-50 p-3">
          <span className="block text-sm font-black text-slate-950">전체 특가</span>
          <span className="mt-1 block text-2xl font-black text-slate-950">{total}</span>
          <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">가격, 배송, 쿠폰 조건은 판매처 기준을 따릅니다.</span>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { AlertTriangle, BadgeCheck, CreditCard, RotateCcw, Truck } from "lucide-react";
import { Deal } from "@/types/deal";
import { getDealLinkTrustLabel } from "@/lib/affiliate";
import { getRelativeTime } from "@/lib/format";

interface PurchaseSafetyChecklistProps {
  deal?: Deal;
  compact?: boolean;
}

export function PurchaseSafetyChecklist({ deal, compact = false }: PurchaseSafetyChecklistProps) {
  const items = [
    {
      icon: BadgeCheck,
      label: "상품 상세",
      body: deal
        ? `${deal.mallName} 상세 페이지에서 상품명과 옵션 구성이 일치하는지 확인하세요.`
        : "판매처 상세 페이지에서 상품명, 구성, 옵션이 안내와 일치하는지 확인하세요."
    },
    {
      icon: CreditCard,
      label: "최종 결제 금액",
      body: "쿠폰, 카드할인, 옵션가가 적용된 최종 금액을 결제 직전에 다시 확인하세요."
    },
    {
      icon: Truck,
      label: "배송 조건",
      body: deal ? `${deal.shipping} 기준입니다. 도서산간/묶음배송 조건은 판매처 기준을 따릅니다.` : "무료배송, 조건부 배송, 도서산간 추가비를 판매처에서 확인하세요."
    },
    {
      icon: RotateCcw,
      label: "취소·반품",
      body: "주문, 배송, 취소, 반품, 환불은 실제 판매처 정책에 따라 처리됩니다."
    }
  ];

  return (
    <section className={`rounded-[24px] border border-slate-200 bg-white shadow-sm ${compact ? "p-4" : "p-5"}`} aria-label="구매 전 10초 체크">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">구매 전 10초 체크</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">판매처에서 마지막으로 확인할 항목</h2>
        </div>
        {deal ? (
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            {getDealLinkTrustLabel(deal)} · {getRelativeTime(deal.checkedAt)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red">
                <Icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-black text-slate-950">{item.label}</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.body}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-amber-50 p-3 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 shrink-0" size={17} />
          <p className="text-xs font-bold leading-5">
            가격, 재고, 쿠폰, 배송 조건이 다르면 구매하지 말고 신고해주세요. 할인도사가 우선 확인합니다.
          </p>
        </div>
        {deal ? (
          <Link
            href={`/reports?dealId=${deal.id}&reason=wrong_info`}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-white px-3 text-xs font-black text-amber-900 shadow-sm"
          >
            정보 신고
          </Link>
        ) : null}
      </div>
    </section>
  );
}

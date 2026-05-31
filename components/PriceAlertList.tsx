"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, Trash2 } from "lucide-react";
import { formatPrice, getRelativeTime } from "@/lib/format";
import { readStoredPriceAlerts, removeStoredPriceAlert, StoredPriceAlert } from "@/lib/priceAlerts";
import { Deal } from "@/types/deal";

interface PriceAlertListProps {
  deals: Deal[];
}

export function PriceAlertList({ deals }: PriceAlertListProps) {
  const [alerts, setAlerts] = useState<StoredPriceAlert[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setAlerts(readStoredPriceAlerts());
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  const dealMap = useMemo(() => new Map(deals.map((deal) => [deal.id, deal])), [deals]);

  const removeAlert = (dealId: string) => {
    setAlerts(removeStoredPriceAlert(dealId));
    setMessage("가격 알림 조건을 해제했습니다.");
  };

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
          <BellRing size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-black text-slate-950">저장한 가격 알림</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            상세 페이지에서 저장한 희망 가격 조건입니다. 현재는 이 기기에 저장되며, 실제 푸시 발송은 FCM 연결 후 별도 동의로 활성화됩니다.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{alerts.length}개</span>
      </div>

      <div className="mt-4 space-y-2">
        {alerts.length ? (
          alerts.map((alert) => {
            const deal = dealMap.get(alert.dealId);
            const currentPrice = deal?.salePrice;
            const isReached = typeof currentPrice === "number" && currentPrice <= alert.targetPrice;

            return (
              <div key={alert.dealId} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <Link href={`/deals/${alert.dealId}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-950">{deal?.title ?? alert.title}</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">
                    희망가 {formatPrice(alert.targetPrice)}
                    {currentPrice ? ` · 현재가 ${formatPrice(currentPrice)}` : ""} · 저장 {getRelativeTime(alert.createdAt)}
                  </span>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${isReached ? "bg-red-50 text-dossa-red" : "bg-white text-slate-500"}`}>
                    {isReached ? "확인할 가격 도달" : "가격 추적 후보"}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeAlert(alert.dealId)}
                  aria-label={`${deal?.title ?? alert.title} 가격 알림 해제`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 transition hover:bg-red-50 hover:text-dossa-red"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center">
            <p className="text-sm font-black text-slate-900">아직 저장한 가격 알림이 없습니다.</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              관심 상품 상세 페이지에서 희망 가격을 저장하면 이곳에서 다시 확인할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {message ? (
        <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">
          {message}
        </p>
      ) : null}
    </section>
  );
}

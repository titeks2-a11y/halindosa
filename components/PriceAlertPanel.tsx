"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { readStoredPriceAlerts, removeStoredPriceAlert, writeStoredPriceAlerts } from "@/lib/priceAlerts";

interface PriceAlertPanelProps {
  dealId: string;
  title: string;
  salePrice: number;
  discountRate: number;
}

export function PriceAlertPanel({ dealId, title, salePrice, discountRate }: PriceAlertPanelProps) {
  const suggestedTargetPrice = useMemo(() => Math.max(100, Math.floor((salePrice * 0.95) / 100) * 100), [salePrice]);
  const [enabled, setEnabled] = useState(false);
  const [targetPrice, setTargetPrice] = useState(suggestedTargetPrice);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const existing = readStoredPriceAlerts().find((alert) => alert.dealId === dealId);
      if (existing) {
        setEnabled(true);
        setTargetPrice(existing.targetPrice);
      }
    }, 0);

    return () => window.clearTimeout(handle);
  }, [dealId]);

  const saveAlert = () => {
    const alerts = readStoredPriceAlerts().filter((alert) => alert.dealId !== dealId);
    const next = [
      {
        dealId,
        title,
        targetPrice,
        createdAt: new Date().toISOString()
      },
      ...alerts
    ];

    writeStoredPriceAlerts(next);
    setEnabled(true);
    setMessage("가격 알림 조건을 이 기기에 저장했습니다.");
  };

  const removeAlert = () => {
    removeStoredPriceAlert(dealId);
    setEnabled(false);
    setTargetPrice(suggestedTargetPrice);
    setMessage("가격 알림 조건을 해제했습니다.");
  };

  return (
    <section className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-slate-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-dossa-red text-white">
          <BellRing size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-dossa-red">가격 알림 신청</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">더 내려가면 다시 확인하기</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            현재가 {formatPrice(salePrice)} 기준으로 원하는 가격을 저장합니다. 실제 푸시 발송은 운영 서버와 FCM 연결 후 활성화됩니다.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="text-xs font-black text-slate-500">희망 알림 가격</span>
          <input
            type="number"
            min={100}
            step={100}
            value={targetPrice}
            onChange={(event) => setTargetPrice(Math.max(100, Number(event.target.value) || suggestedTargetPrice))}
            className="mt-1 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
            aria-label={`${title} 희망 알림 가격`}
          />
        </label>
        <div className="flex gap-2 sm:items-end">
          <button
            type="button"
            onClick={saveAlert}
            className="min-h-12 flex-1 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-dossa-red sm:flex-none"
          >
            {enabled ? "조건 수정" : "알림 저장"}
          </button>
          {enabled ? (
            <button
              type="button"
              onClick={removeAlert}
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:border-red-100 hover:text-dossa-red sm:flex-none"
            >
              해제
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-white/80 p-3 text-xs font-semibold leading-5 text-slate-600">
        <span className="inline-flex items-start gap-2">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-dossa-red" />
          {discountRate}% 할인 중인 상품입니다. 희망가가 현재가보다 낮으면 가격 추적 후보로 저장됩니다.
        </span>
        <span>
          로그인하면 찜, 최근 본 상품, 관심 카테고리와 함께 가격 알림 조건을 이어볼 수 있습니다.{" "}
          <Link href="/signup" className="font-black text-dossa-red">
            회원가입
          </Link>
        </span>
      </div>

      {message ? (
        <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black text-dossa-red">
          {message}
        </p>
      ) : null}
    </section>
  );
}

"use client";

import { useState } from "react";

interface ReportFormProps {
  dealId: string;
  disabled: boolean;
}

export function ReportForm({ dealId, disabled }: ReportFormProps) {
  const [reason, setReason] = useState("price_changed");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReport = async () => {
    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dealId,
          reason,
          message
        })
      });
      const data = (await response.json()) as { ok: boolean; message: string };

      setStatus(data.message);
      if (data.ok) {
        setMessage("");
      }
    } catch {
      setStatus("신고 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-5 space-y-4">
      <div>
        <label className="text-sm font-black text-slate-700" htmlFor="reason">
          신고 사유
        </label>
        <select
          id="reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={disabled || isSubmitting}
          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-dossa-red focus:ring-4 focus:ring-red-100 disabled:opacity-60"
        >
          <option value="price_changed">가격이 달라요</option>
          <option value="sold_out">품절이에요</option>
          <option value="expired">이미 종료됐어요</option>
          <option value="wrong_info">정보가 틀려요</option>
          <option value="other">기타</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-black text-slate-700" htmlFor="message">
          추가 내용
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={disabled || isSubmitting}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-dossa-red focus:ring-4 focus:ring-red-100 disabled:opacity-60"
          placeholder="판매처에서 확인한 가격, 품절 여부, 쿠폰 조건 등을 적어주세요."
        />
      </div>
      <button
        type="button"
        onClick={submitReport}
        disabled={disabled || isSubmitting}
        className="w-full rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white transition hover:bg-dossa-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "접수 중" : "신고 접수"}
      </button>
      {status ? <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">{status}</p> : null}
      <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-500">
        현재 화면은 상업화 전 운영 검수용입니다. 실제 운영에서는 신고 접수 후 DB 저장과 관리자 알림으로 연결됩니다.
      </p>
    </div>
  );
}

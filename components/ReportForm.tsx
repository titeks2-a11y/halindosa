"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { maxReportMessageLength } from "@/lib/reportConfig";

interface ReportFormProps {
  dealId: string;
  disabled: boolean;
  initialReason?: string;
}

const reportReasonValues = ["price_changed", "sold_out", "expired", "wrong_info", "other"] as const;
type ReportReasonValue = (typeof reportReasonValues)[number];

function normalizeInitialReason(reason?: string): ReportReasonValue {
  return reportReasonValues.includes(reason as ReportReasonValue) ? (reason as ReportReasonValue) : "price_changed";
}

export function ReportForm({ dealId, disabled, initialReason }: ReportFormProps) {
  const [reason, setReason] = useState(normalizeInitialReason(initialReason));
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [requestId, setRequestId] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonHelp: Record<string, string> = {
    price_changed: "판매처에서 확인한 최종 가격이 앱 표시가와 다를 때 선택하세요.",
    sold_out: "상품이 품절되었거나 옵션 선택이 불가능할 때 선택하세요.",
    expired: "쿠폰, 카드할인, 타임세일이 이미 종료되었을 때 선택하세요.",
    wrong_info: "배송비, 쇼핑몰명, 상품 이미지, 링크 정보가 다를 때 선택하세요.",
    other: "위 항목에 없는 내용을 운영팀에 전달할 때 선택하세요."
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");
    setRequestId("");
    setIsSuccess(false);

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
      const data = (await response.json()) as { ok: boolean; message: string; requestId?: string };

      setStatus(data.message);
      setRequestId(data.requestId ?? "");
      setIsSuccess(data.ok);
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
    <form className="mt-5 space-y-4" onSubmit={submitReport}>
      <div>
        <label className="text-sm font-black text-slate-700" htmlFor="reason">
          신고 사유
        </label>
        <select
          id="reason"
          value={reason}
          onChange={(event) => setReason(normalizeInitialReason(event.target.value))}
          disabled={disabled || isSubmitting}
          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-dossa-red focus:ring-4 focus:ring-red-100 disabled:opacity-60"
        >
          <option value="price_changed">가격이 달라요</option>
          <option value="sold_out">품절이에요</option>
          <option value="expired">이미 종료됐어요</option>
          <option value="wrong_info">정보가 틀려요</option>
          <option value="other">기타</option>
        </select>
        <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">{reasonHelp[reason]}</p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-black text-slate-700" htmlFor="message">
            추가 내용
          </label>
          <span className="text-xs font-bold text-slate-400">
            {message.length}/{maxReportMessageLength}
          </span>
        </div>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, maxReportMessageLength))}
          disabled={disabled || isSubmitting}
          rows={4}
          maxLength={maxReportMessageLength}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-dossa-red focus:ring-4 focus:ring-red-100 disabled:opacity-60"
          placeholder="판매처에서 확인한 가격, 품절 여부, 쿠폰 조건 등을 적어주세요."
        />
      </div>
      <button
        type="submit"
        disabled={disabled || isSubmitting}
        className="w-full rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white transition hover:bg-dossa-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "접수 중" : "신고 접수"}
      </button>
      {status ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl p-3 text-sm font-bold leading-6 ${isSuccess ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
        >
          <p>{status}</p>
          {requestId ? <p className="mt-1 text-xs opacity-80">접수번호 {requestId}</p> : null}
        </div>
      ) : null}
      <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-500">
        신고 내용은 운영 검수 큐에 반영됩니다. 실제 구매 취소, 환불, 배송 문의는 판매처 고객센터에서 처리해야 합니다.
      </p>
    </form>
  );
}

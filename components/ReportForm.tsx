"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { maxReportMessageLength } from "@/lib/reportConfig";
import { getReportReasonLabel, getReportResolutionPlan } from "@/lib/reports";
import { getSupportMailto, supportEmail } from "@/lib/support";

interface ReportFormProps {
  dealId: string;
  disabled: boolean;
  initialReason?: string;
}

const reportReasonValues = ["price_changed", "sold_out", "expired", "link_error", "wrong_info", "other"] as const;
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
    link_error: "버튼을 눌렀을 때 상품 상세가 열리지 않거나 다른 상품으로 이동할 때 선택하세요.",
    wrong_info: "배송비, 쇼핑몰명, 상품 이미지, 링크 정보가 다를 때 선택하세요.",
    other: "위 항목에 없는 내용을 운영팀에 전달할 때 선택하세요."
  };
  const selectedPlan = getReportResolutionPlan(reason);

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
          <option value="price_changed">{getReportReasonLabel("price_changed")}</option>
          <option value="sold_out">{getReportReasonLabel("sold_out")}</option>
          <option value="expired">{getReportReasonLabel("expired")}</option>
          <option value="link_error">{getReportReasonLabel("link_error")}</option>
          <option value="wrong_info">{getReportReasonLabel("wrong_info")}</option>
          <option value="other">{getReportReasonLabel("other")}</option>
        </select>
        <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">{reasonHelp[reason]}</p>
      </div>

      <div className="rounded-2xl border border-red-100 bg-red-50 p-4" aria-label="신고 처리 예상 안내">
        <p className="text-xs font-black text-dossa-red">신고 처리 예상 안내</p>
        <p className="mt-2 text-sm font-black text-slate-950">{selectedPlan.queueLabel}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{selectedPlan.userExpectation}</p>
        <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-dossa-red shadow-sm">
          목표 처리: {selectedPlan.operatorSla}
        </p>
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
          placeholder="판매처에서 확인한 가격, 품절 여부, 링크 이동 결과, 쿠폰 조건 등을 적어주세요."
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
          {isSuccess ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Link href={`/deals/${dealId}`} className="rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-emerald-800 shadow-sm">
                상세로 돌아가기
              </Link>
              <Link href="/guide" className="rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-emerald-800 shadow-sm">
                구매 기준 보기
              </Link>
              <a href={getSupportMailto(`신고 접수 문의 ${requestId || dealId}`)} className="rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-emerald-800 shadow-sm">
                문의하기
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
      <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-500">
        신고 내용은 할인 정보 품질 확인에 반영됩니다. 실제 구매 취소, 환불, 배송 문의는 판매처 고객센터에서 처리해야 합니다. 추가 문의가 필요하면 {supportEmail}로 접수번호를 함께 보내주세요.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-black text-slate-900">신고 접수 후 안내</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
          가격 기준과 외부 판매처 이동 원칙을 확인하거나, 접수번호를 포함해 운영팀에 문의할 수 있습니다.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link href={dealId ? `/deals/${dealId}` : "/"} className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700">
            상세로 돌아가기
          </Link>
          <Link href="/guide" className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700">
            구매 기준 보기
          </Link>
          <a href={getSupportMailto(`신고 접수 문의 ${dealId}`)} className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700">
            문의하기
          </a>
        </div>
      </div>
    </form>
  );
}

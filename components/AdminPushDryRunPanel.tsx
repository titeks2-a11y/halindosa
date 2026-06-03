"use client";

import { useMemo, useState } from "react";
import type { NotificationCampaign } from "@/lib/notificationCampaigns";
import type { PushSendResult } from "@/lib/pushNotifications";

interface AdminPushDryRunPanelProps {
  apiHref: string;
  push: {
    configured: boolean;
    enabled: boolean;
    hasServerKey: boolean;
    requiredEnv: string[];
  };
  campaigns: NotificationCampaign[];
}

interface PushApiResponse {
  ok: boolean;
  requestId?: string;
  message?: string;
  result?: PushSendResult;
}

function splitTokens(value: string) {
  return value
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function AdminPushDryRunPanel({ apiHref, push, campaigns }: AdminPushDryRunPanelProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.id ?? "");
  const [tokenText, setTokenText] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [confirmLiveSend, setConfirmLiveSend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PushApiResponse | null>(null);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0],
    [campaigns, selectedCampaignId]
  );
  const tokens = useMemo(() => splitTokens(tokenText), [tokenText]);
  const canSend = Boolean(selectedCampaign) && tokens.length > 0 && (dryRun || (push.configured && confirmLiveSend));

  async function submitPushTest() {
    if (!selectedCampaign) return;

    if (!canSend) {
      setResult({
        ok: false,
        message: dryRun
          ? "테스트 토큰을 1개 이상 입력하세요."
          : "실제 발송은 FCM 설정과 실제 발송 확인 체크가 필요합니다."
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(apiHref, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: selectedCampaign.title,
          body: selectedCampaign.body,
          tokens,
          dealId: selectedCampaign.dealIds[0] ?? "",
          benefitId: selectedCampaign.benefitIds[0] ?? "",
          campaignId: selectedCampaign.id,
          sourceKind: selectedCampaign.sourceKind,
          alertType: selectedCampaign.alertType,
          dryRun
        })
      });
      const payload = (await response.json().catch(() => ({
        ok: false,
        message: "알림 API 응답을 읽지 못했습니다."
      }))) as PushApiResponse;

      setResult(payload);
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : "알림 dry-run 요청 중 오류가 발생했습니다."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-3xl border border-brand-line bg-white p-4 shadow-sm" aria-label="FCM 테스트 발송 dry-run">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black text-brand-red">FCM 테스트 발송 dry-run</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">운영 토큰으로 발송 후보를 안전하게 점검</h3>
          <p className="mt-1 max-w-2xl text-xs font-bold leading-5 text-slate-500">
            테스트 토큰을 입력하면 선택한 캠페인 제목, 본문, payload, 대상 수를 서버 API로 검증합니다. 토큰은 저장하지 않으며
            기본값은 dry-run입니다.
          </p>
        </div>
        <div className="rounded-2xl bg-brand-warm px-4 py-3 text-xs font-black text-slate-600">
          <p>FCM: {push.configured ? "발송 가능" : "환경변수 미설정"}</p>
          <p className="mt-1 text-[11px] text-slate-500">{push.requiredEnv.join(" / ")}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <label className="block">
          <span className="text-xs font-black text-slate-600">캠페인 선택</span>
          <select
            value={selectedCampaignId}
            onChange={(event) => setSelectedCampaignId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-brand-red"
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.sourceKind === "official_benefit" ? "공식혜택" : "상품"} · {campaign.title}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-black text-slate-500">선택 캠페인 payload</p>
          <p className="mt-1 line-clamp-1 text-sm font-black text-slate-950">{selectedCampaign?.title ?? "캠페인 없음"}</p>
          <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{selectedCampaign?.body ?? ""}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-red shadow-sm">
              {selectedCampaign?.sourceKind === "official_benefit" ? "공식 혜택" : "검증 상품"}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
              대상 {(selectedCampaign?.dealIds.length || selectedCampaign?.benefitIds.length || 0).toLocaleString("ko-KR")}개
            </span>
          </div>
        </div>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-black text-slate-600">테스트 FCM 토큰</span>
        <textarea
          value={tokenText}
          onChange={(event) => setTokenText(event.target.value)}
          rows={3}
          placeholder="테스트 기기 토큰을 줄바꿈 또는 쉼표로 입력"
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-brand-red"
        />
      </label>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 text-xs font-bold text-slate-500 sm:flex-row sm:items-center">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
            dry-run으로만 검증
          </label>
          <label className={`inline-flex items-center gap-2 ${dryRun || !push.configured ? "text-slate-400" : "text-slate-600"}`}>
            <input
              type="checkbox"
              checked={confirmLiveSend}
              disabled={dryRun || !push.configured}
              onChange={(event) => setConfirmLiveSend(event.target.checked)}
            />
            실제 발송 확인
          </label>
        </div>
        <button
          type="button"
          onClick={submitPushTest}
          disabled={isSubmitting}
          className="rounded-2xl bg-brand-navy px-4 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {isSubmitting ? "검증 중" : dryRun ? "dry-run 실행" : "테스트 발송 실행"}
        </button>
      </div>

      {result ? (
        <div
          role="status"
          aria-live="polite"
          className={`mt-3 rounded-2xl px-4 py-3 text-xs font-bold leading-5 ${
            result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-brand-red"
          }`}
        >
          <p className="font-black">{result.result?.message ?? result.message ?? "알림 요청 결과를 확인했습니다."}</p>
          {result.result ? (
            <p className="mt-1">
              대상 {result.result.attempted.toLocaleString("ko-KR")}개 · 성공 {result.result.sent.toLocaleString("ko-KR")}개 · 실패{" "}
              {result.result.failed.toLocaleString("ko-KR")}개 · 요청 ID {result.requestId ?? "-"}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

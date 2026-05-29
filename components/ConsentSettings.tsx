"use client";

import { ConsentState, createConsentState, writeStoredConsent } from "@/lib/consent";

interface ConsentSettingsProps {
  consent: ConsentState | null;
  onChange: (consent: ConsentState) => void;
}

export function ConsentSettings({ consent, onChange }: ConsentSettingsProps) {
  const analytics = Boolean(consent?.analytics);
  const affiliate = Boolean(consent?.affiliate);

  const updateConsent = (nextAnalytics: boolean, nextAffiliate: boolean) => {
    const next = createConsentState(nextAnalytics, nextAffiliate);
    writeStoredConsent(next);
    onChange(next);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-lg font-black text-slate-950">개인정보/추적 설정</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
        필수 저장은 서비스 동작을 위해 유지되며, 분석과 제휴 성과 측정은 언제든 변경할 수 있습니다.
      </p>
      <div className="mt-4 space-y-3">
        <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <span>
            <span className="block text-sm font-black text-slate-950">클릭 분석</span>
            <span className="mt-1 block text-xs font-bold text-slate-500">특가 클릭, 찜 이벤트를 서비스 개선 지표로 사용</span>
          </span>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(event) => updateConsent(event.target.checked, affiliate)}
            className="h-5 w-5 accent-dossa-red"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
          <span>
            <span className="block text-sm font-black text-slate-950">제휴 성과 측정</span>
            <span className="mt-1 block text-xs font-bold text-slate-500">판매처 이동 시 제휴 성과 확인용 파라미터 사용</span>
          </span>
          <input
            type="checkbox"
            checked={affiliate}
            onChange={(event) => updateConsent(analytics, event.target.checked)}
            className="h-5 w-5 accent-dossa-red"
          />
        </label>
      </div>
      <p className="mt-3 text-xs font-bold text-slate-400">
        현재 상태: 분석 {analytics ? "허용" : "거부"} · 제휴 측정 {affiliate ? "허용" : "거부"}
      </p>
    </div>
  );
}

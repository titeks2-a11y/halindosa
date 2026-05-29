"use client";

import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { ConsentState, createConsentState, writeStoredConsent } from "@/lib/consent";

interface ConsentBannerProps {
  consent: ConsentState | null;
  onChange: (consent: ConsentState) => void;
}

export function ConsentBanner({ consent, onChange }: ConsentBannerProps) {
  if (consent) return null;

  const saveConsent = (analytics: boolean, affiliate: boolean) => {
    const next = createConsentState(analytics, affiliate);
    writeStoredConsent(next);
    onChange(next);
  };

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4 sm:bottom-5">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
            <ShieldCheck size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-950">분석 및 제휴 추적 동의</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              할인도사는 찜 같은 필수 저장은 브라우저에만 보관합니다. 특가 클릭 분석과 제휴 성과 측정은 동의한 경우에만 기록합니다.
            </p>
            <Link href="/privacy" className="mt-2 inline-block text-xs font-black text-dossa-red">
              개인정보 처리방침 보기
            </Link>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:min-w-36">
            <button
              type="button"
              onClick={() => saveConsent(true, true)}
              className="rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white hover:bg-dossa-deep"
            >
              모두 허용
            </button>
            <button
              type="button"
              onClick={() => saveConsent(false, false)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200"
            >
              <X size={16} />
              필수만
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

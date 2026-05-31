"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Share2, ShieldCheck, Trash2 } from "lucide-react";
import { consentStorageKey } from "@/lib/consent";
import { priceAlertStorageKey } from "@/lib/priceAlerts";
import { recentDealStorageKey } from "@/lib/recentDeals";
import { buildPublicAppShareUrl } from "@/lib/shareUrl";

const favoriteStorageKey = "halindosa:favorites";
const signalFavoriteStorageKey = "halindosa:signal-favorites";

function removeKeys(keys: string[]) {
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

export function LocalDataControls() {
  const [message, setMessage] = useState("");

  const clearShoppingData = () => {
    removeKeys([favoriteStorageKey, signalFavoriteStorageKey, recentDealStorageKey, priceAlertStorageKey]);
    setMessage("찜 목록, 최근 본 특가, 가격 알림 조건을 이 기기에서 삭제했습니다.");
  };

  const resetConsent = () => {
    removeKeys([consentStorageKey]);
    setMessage("분석/제휴 동의 설정을 초기화했습니다. 다음 실행 시 다시 선택할 수 있습니다.");
  };

  const shareApp = async () => {
    const appUrl = buildPublicAppShareUrl();
    const text = "할인도사 - 실시간 할인 특가 정보를 가장 빠르게 찾는 방법";

    try {
      const nav = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
        clipboard?: Clipboard;
      };

      if (nav.share) {
        await nav.share({ title: "할인도사", text, url: appUrl });
        return;
      }

      await nav.clipboard?.writeText(`${text}\n${appUrl}`);
      setMessage("앱 공유 링크를 복사했습니다.");
    } catch {
      setMessage("공유를 취소했습니다.");
    }
  };

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-slate-950">기기 데이터 관리</h2>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
        비회원은 이 기기에 찜과 최근 본 특가를 저장하고, 로그인 사용자는 계정으로 관심 특가를 이어볼 수 있습니다.
      </p>
      <div className="mt-3 grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
        <div className="flex gap-2">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-dossa-red" />
          <span>삭제 대상: 이 기기에 저장된 찜한 특가, 최근 본 특가, 가격 알림 조건, 관심 할인 신호, 분석/제휴 동의 설정</span>
        </div>
        <div className="flex gap-2">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-slate-500" />
          <span>가격 신고는 할인 정보 품질 확인 기록으로 별도 관리되며, 문의 시 접수번호로 확인합니다.</span>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm font-black text-slate-700">
        <button
          type="button"
          onClick={clearShoppingData}
          className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-red-50 hover:text-dossa-red"
        >
          <Trash2 size={17} className="text-dossa-red" />
          찜/최근 본 특가/가격 알림 삭제
        </button>
        <button
          type="button"
          onClick={resetConsent}
          className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-red-50 hover:text-dossa-red"
        >
          <RotateCcw size={17} className="text-dossa-red" />
          분석/제휴 동의 초기화
        </button>
        <button
          type="button"
          onClick={shareApp}
          className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-red-50 hover:text-dossa-red"
        >
          <Share2 size={17} className="text-dossa-red" />
          앱 공유하기
        </button>
      </div>
      {message ? (
        <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">
          {message}
        </p>
      ) : null}
    </section>
  );
}

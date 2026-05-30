"use client";

import { useState } from "react";
import { RotateCcw, Share2, Trash2 } from "lucide-react";
import { consentStorageKey } from "@/lib/consent";
import { recentDealStorageKey } from "@/lib/recentDeals";

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
    removeKeys([favoriteStorageKey, signalFavoriteStorageKey, recentDealStorageKey]);
    setMessage("찜 목록과 최근 본 특가를 이 기기에서 삭제했습니다.");
  };

  const resetConsent = () => {
    removeKeys([consentStorageKey]);
    setMessage("분석/제휴 동의 설정을 초기화했습니다. 다음 실행 시 다시 선택할 수 있습니다.");
  };

  const shareApp = async () => {
    const appUrl = window.location.origin;
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
        할인도사는 현재 회원가입 없이 동작하며, 찜과 최근 본 특가는 이 기기에만 저장됩니다.
      </p>
      <div className="mt-3 grid gap-2 text-sm font-black text-slate-700">
        <button
          type="button"
          onClick={clearShoppingData}
          className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-red-50 hover:text-dossa-red"
        >
          <Trash2 size={17} className="text-dossa-red" />
          찜/최근 본 특가 삭제
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

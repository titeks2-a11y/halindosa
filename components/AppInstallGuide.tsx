"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, Share2, Smartphone } from "lucide-react";
import { buildPublicAppShareUrl } from "@/lib/shareUrl";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function getInstalledState() {
  if (typeof window === "undefined") return false;

  const standaloneDisplay = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const navigatorStandalone = "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return Boolean(standaloneDisplay || navigatorStandalone);
}

export function AppInstallGuide() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [message, setMessage] = useState("자주 보는 특가를 홈 화면에서 바로 열 수 있습니다.");

  useEffect(() => {
    const installedStateHandle = window.setTimeout(() => {
      setIsInstalled(getInstalledState());
    }, 0);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMessage("이 기기에서 할인도사를 앱처럼 설치할 수 있습니다.");
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setMessage("할인도사가 홈 화면에 추가되었습니다.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(installedStateHandle);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setMessage("설치 버튼이 보이지 않으면 브라우저 메뉴에서 홈 화면에 추가를 선택해 주세요.");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      setMessage("할인도사가 홈 화면에 추가되었습니다.");
    } else {
      setMessage("필요할 때 다시 설치할 수 있습니다.");
    }

    setInstallPrompt(null);
  };

  const handleShare = async () => {
    const shareUrl = buildPublicAppShareUrl();
    const shareData = {
      title: "할인도사",
      text: "실시간 할인 특가 정보를 가장 빠르게 찾는 방법",
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setMessage("할인도사 공유 화면을 열었습니다.");
        return;
      }

      await navigator.clipboard?.writeText(shareUrl);
      setMessage("공유 링크를 복사했습니다.");
    } catch {
      setMessage("공유가 취소되었습니다. 필요하면 다시 시도해 주세요.");
    }
  };

  return (
    <section className="rounded-[22px] border border-red-100 bg-gradient-to-br from-white via-red-50/60 to-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-dossa-red text-white shadow-sm">
          <Smartphone size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-dossa-red">앱으로 더 빠르게 보기</p>
          <h2 className="mt-1 text-base font-black text-slate-950">홈 화면에 할인도사 고정</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            찜, 최근 본 특가, 가격 알림을 이어보고 자주 확인하는 할인 정보를 앱처럼 바로 열 수 있습니다.
          </p>
        </div>
        {isInstalled ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
            <CheckCircle2 size={13} />
            추가됨
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleInstall}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-dossa-red"
        >
          <Download size={17} />
          앱으로 설치하기
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-red-50"
        >
          <Share2 size={17} />
          공유 링크 복사
        </button>
      </div>

      <p role="status" aria-live="polite" className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-600 shadow-sm">
        {message}
      </p>
    </section>
  );
}

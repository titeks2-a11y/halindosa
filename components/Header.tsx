"use client";

import { Bell, RefreshCw, Sparkles } from "lucide-react";

interface HeaderProps {
  updatedAt: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export function Header({ updatedAt, isLoading, onRefresh }: HeaderProps) {
  const timeLabel = updatedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(new Date(updatedAt))
    : "대기 중";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-dossa-red text-white shadow-lg shadow-red-200">
            <Sparkles size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black tracking-normal text-slate-950">할인도사</h1>
            <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">국내 특가를 가장 빠르게 찾는 방법</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden text-right text-xs text-slate-500 sm:block">
            <p className="font-semibold text-slate-700">마지막 업데이트</p>
            <time>{timeLabel}</time>
          </div>
          <button
            type="button"
            aria-label="알림"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-red-200 hover:text-dossa-red"
          >
            <Bell size={19} />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-dossa-deep disabled:cursor-wait disabled:opacity-70"
          >
            <RefreshCw size={17} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>
      </div>
    </header>
  );
}

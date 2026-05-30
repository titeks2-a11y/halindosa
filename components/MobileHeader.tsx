"use client";

import Link from "next/link";
import { Bell, RefreshCw, Search } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto max-w-[480px] px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md shadow-red-100 ring-1 ring-red-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/halindosa-icon-192.png" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black leading-5 text-slate-950">할인도사</span>
              <span className="block truncate text-[11px] font-bold text-slate-500">실시간 할인 특가 정보를 가장 빠르게 찾는 방법</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/notifications"
              aria-label="알림"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200"
            >
              <Bell size={18} />
            </Link>
            <button
              type="button"
              aria-label="새로고침"
              onClick={() => window.location.reload()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>
        <form action="/" className="relative mt-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            name="q"
            placeholder="상품명, 쇼핑몰, 카테고리 검색"
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-[13px] font-bold outline-none focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50"
          />
        </form>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, RefreshCw, Search } from "lucide-react";

export function MobileHeader() {
  const pathname = usePathname();
  const showHeaderSearch = pathname !== "/";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto max-w-[480px] px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm shadow-red-100 ring-1 ring-red-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/halindosa-icon-192.png" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-black leading-5 text-slate-950">할인도사</span>
              <span className="block truncate text-[10px] font-bold text-slate-500">무료혜택 빠른 탐색</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/notifications"
              aria-label="알림"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200"
            >
              <Bell size={16} />
            </Link>
            <button
              type="button"
              aria-label="새로고침"
              onClick={() => window.location.reload()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
        {showHeaderSearch ? (
          <form action="/" className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              name="q"
              placeholder="혜택·브랜드 검색"
              className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] font-bold outline-none focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50"
            />
          </form>
        ) : null}
      </div>
    </header>
  );
}

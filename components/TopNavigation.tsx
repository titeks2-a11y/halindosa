"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Grid3X3, Heart, Home, LogIn, RefreshCw, Search, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/categories", label: "카테고리", icon: Grid3X3 },
  { href: "/notifications", label: "알림", icon: Bell },
  { href: "/favorites", label: "찜", icon: Heart },
  { href: "/mypage", label: "마이", icon: User }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function getNavAriaLabel(label: string, active: boolean) {
  return `${label} 탭 ${active ? "선택됨" : "이동"}`;
}

export function TopNavigation() {
  const pathname = usePathname();
  const { configured, user, nickname } = useAuth();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-slate-200/80 bg-white/95 backdrop-blur lg:block">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-red-100 ring-1 ring-red-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/halindosa-icon-192.png" alt="" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block text-xl font-black text-slate-950">할인도사</span>
            <span className="block text-xs font-bold text-slate-500">실시간 할인 특가 정보를 가장 빠르게 찾는 방법</span>
          </span>
        </Link>

        <form action="/" className="relative min-w-72 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            name="q"
            aria-label="상품명, 쇼핑몰, 카테고리 검색"
            placeholder="상품명, 쇼핑몰, 카테고리 검색"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50"
          />
        </form>

        <nav aria-label="주요 메뉴" className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={getNavAriaLabel(item.label, active)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-black transition ${
                  active ? "bg-dossa-red text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <Icon size={17} fill={active && item.href === "/favorites" ? "currentColor" : "none"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {configured ? (
          <Link
            href={user ? "/mypage" : "/login"}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-red-100 hover:text-dossa-red"
          >
            {user ? <User size={17} /> : <LogIn size={17} />}
            {user ? nickname || "내 계정" : "로그인"}
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => window.location.reload()}
          aria-label="특가 정보 새로고침"
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-dossa-deep"
        >
          <RefreshCw size={17} />
          새로고침
        </button>
      </div>
    </header>
  );
}

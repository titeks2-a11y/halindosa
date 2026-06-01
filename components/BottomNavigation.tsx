"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Grid3X3, Home, User } from "lucide-react";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/popular", label: "인기", icon: Flame },
  { href: "/categories", label: "카테고리", icon: Grid3X3 },
  { href: "/mypage", label: "마이", icon: User }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function getNavAriaLabel(label: string, active: boolean) {
  return `${label} 탭 ${active ? "선택됨" : "이동"}`;
}

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="주요 메뉴" className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid h-16 max-w-[520px] grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={getNavAriaLabel(item.label, active)}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition ${
                active ? "bg-red-50 text-dossa-red" : "text-slate-400 active:bg-slate-50 active:text-slate-700"
              }`}
            >
              <Icon size={21} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { Bell, Grid3X3, Heart, Home, UserRound } from "lucide-react";

export type AppView = "home" | "categories" | "alerts" | "favorites" | "my";

const items = [
  { id: "home", label: "홈", icon: Home },
  { id: "categories", label: "카테고리", icon: Grid3X3 },
  { id: "alerts", label: "알림", icon: Bell },
  { id: "favorites", label: "찜", icon: Heart },
  { id: "my", label: "마이", icon: UserRound }
] as const;

interface BottomNavProps {
  activeView: AppView;
  favoriteCount: number;
  alertCount: number;
  onChange: (view: AppView) => void;
}

function getBadgeCount(view: AppView, favoriteCount: number, alertCount: number) {
  if (view === "favorites") return favoriteCount;
  if (view === "alerts") return alertCount;
  return 0;
}

export function BottomNav({ activeView, favoriteCount, alertCount, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-2 pt-1 shadow-2xl shadow-slate-300 backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          const badgeCount = getBadgeCount(item.id, favoriteCount, alertCount);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl text-xs font-black transition ${
                active ? "text-dossa-red" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon size={21} fill={active && item.id === "favorites" ? "currentColor" : "none"} />
              {item.label}
              {badgeCount > 0 ? (
                <span className="absolute right-4 top-1 min-w-5 rounded-full bg-dossa-red px-1.5 py-0.5 text-[10px] leading-none text-white">
                  {badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function DesktopNav({ activeView, favoriteCount, alertCount, onChange }: BottomNavProps) {
  return (
    <div className="hidden gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:flex">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.id;
        const badgeCount = getBadgeCount(item.id, favoriteCount, alertCount);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition ${
              active ? "bg-dossa-red text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon size={17} fill={active && item.id === "favorites" ? "currentColor" : "none"} />
            {item.label}
            {badgeCount > 0 ? (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white text-dossa-red" : "bg-red-50 text-dossa-red"}`}>
                {badgeCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

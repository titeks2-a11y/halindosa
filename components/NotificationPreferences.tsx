"use client";

import { useEffect, useState } from "react";
import { BellRing, Clock, Flame, Sparkles, Truck } from "lucide-react";

const storageKey = "halindosa:notification-preferences";

const preferenceItems = [
  { id: "endingSoon", label: "마감 임박", description: "종료 시간이 가까운 특가", icon: Clock },
  { id: "hot", label: "인기 급상승", description: "반응이 빠른 특가", icon: Flame },
  { id: "new", label: "신규 등록", description: "새로 확인된 특가", icon: Sparkles },
  { id: "freeShipping", label: "무료배송", description: "배송비 부담이 낮은 특가", icon: Truck }
] as const;

type PreferenceId = (typeof preferenceItems)[number]["id"];
type NotificationPreferencesState = Record<PreferenceId, boolean>;

const defaultPreferences: NotificationPreferencesState = {
  endingSoon: true,
  hot: true,
  new: true,
  freeShipping: true
};

function readPreferences(): NotificationPreferencesState {
  if (typeof window === "undefined") return defaultPreferences;

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesState>(defaultPreferences);

  useEffect(() => {
    const restorePreferences = window.setTimeout(() => {
      setPreferences(readPreferences());
    }, 0);

    return () => window.clearTimeout(restorePreferences);
  }, []);

  const updatePreference = (id: PreferenceId) => {
    const next = { ...preferences, [id]: !preferences[id] };
    setPreferences(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const activeCount = Object.values(preferences).filter(Boolean).length;

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
          <BellRing size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-black text-slate-950">관심 알림 설정</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            현재는 앱 안에서 우선순위 알림을 모아 보여줍니다. 선택값은 이 기기에만 저장되며, 실제 푸시 알림은 출시 후 별도 동의가 있을 때만 연결됩니다.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{activeCount}개 선택</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {preferenceItems.map((item) => {
          const Icon = item.icon;
          const active = preferences[item.id];

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => updatePreference(item.id)}
              aria-pressed={active}
              className={`rounded-2xl border p-3 text-left transition ${
                active ? "border-red-100 bg-red-50 text-dossa-red" : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon size={16} />
                <span className="text-sm font-black">{item.label}</span>
              </span>
              <span className="mt-1 block text-xs font-bold opacity-75">{item.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

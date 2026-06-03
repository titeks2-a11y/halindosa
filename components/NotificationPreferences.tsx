"use client";

import { useEffect, useState } from "react";
import { BellRing, Clock, Flame, Sparkles, Truck } from "lucide-react";
import {
  defaultNotificationPreferences,
  notificationCategoryOptions,
  type InAppNotificationPreferences,
  type NotificationSignalId,
  readInAppNotificationPreferences,
  writeInAppNotificationPreferences
} from "@/lib/notificationPreferences";

const preferenceItems = [
  { id: "endingSoon", label: "마감 임박", description: "종료 시간이 가까운 특가", icon: Clock },
  { id: "hot", label: "인기 급상승", description: "반응이 빠른 특가", icon: Flame },
  { id: "new", label: "신규 등록", description: "새로 확인된 특가", icon: Sparkles },
  { id: "freeShipping", label: "무료배송", description: "배송비 부담이 낮은 특가", icon: Truck }
] as const;

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<InAppNotificationPreferences>(defaultNotificationPreferences);

  useEffect(() => {
    const restorePreferences = window.setTimeout(() => {
      setPreferences(readInAppNotificationPreferences());
    }, 0);

    return () => window.clearTimeout(restorePreferences);
  }, []);

  const updatePreference = (id: NotificationSignalId) => {
    const next = writeInAppNotificationPreferences({
      ...preferences,
      signals: {
        ...preferences.signals,
        [id]: !preferences.signals[id]
      }
    });
    setPreferences(next);
  };

  const toggleCategory = (category: string) => {
    const exists = preferences.categories.includes(category);
    const nextCategories = exists ? preferences.categories.filter((item) => item !== category) : [category, ...preferences.categories].slice(0, 8);
    const next = writeInAppNotificationPreferences({
      ...preferences,
      categories: nextCategories
    });
    setPreferences(next);
  };

  const activeCount = Object.values(preferences.signals).filter(Boolean).length;

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
          <BellRing size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-black text-slate-950">관심 알림 설정</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            현재는 앱 안에서 우선순위 알림을 모아 보여줍니다. 알림 받을 카테고리는 이 기기에 저장되며, 실제 푸시 알림은 출시 후 별도 동의가 있을 때만 연결됩니다.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {activeCount}개 신호 · {preferences.categories.length}개 카테고리
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {preferenceItems.map((item) => {
          const Icon = item.icon;
          const active = preferences.signals[item.id];

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

      <div className="mt-4 rounded-2xl bg-slate-50 p-3" aria-label="알림 받을 카테고리">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">알림 받을 카테고리</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              기기에 저장한 관심 알림 카테고리는 홈 추천과 알림 후보에 바로 반영됩니다.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
            최대 8개
          </span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {notificationCategoryOptions.map((category) => {
            const active = preferences.categories.includes(category);

            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                aria-pressed={active}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition ${
                  active ? "bg-dossa-red text-white shadow-sm" : "bg-white text-slate-500 shadow-sm"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

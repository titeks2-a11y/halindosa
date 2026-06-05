"use client";

import { Sparkles } from "lucide-react";
import type { NewsIntentGroup } from "@/types/newsDeal";

interface OfficialBenefitIntentGroupsProps {
  groups: NewsIntentGroup[];
  onSelectQuery?: (query: string) => void;
}

export function OfficialBenefitIntentGroups({ groups, onSelectQuery }: OfficialBenefitIntentGroupsProps) {
  const visibleGroups = groups.filter((item) => item.label && item.query && item.count > 0).slice(0, 6);

  if (!visibleGroups.length) return null;

  return (
    <div className="mt-3 rounded-2xl border border-red-100 bg-white p-2.5 shadow-sm" aria-label="오늘 먼저 볼 공식 혜택 그룹">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black text-brand-red">
          <Sparkles size={13} />
          오늘 먼저 볼 혜택
        </p>
        <span className="text-[10px] font-black text-slate-400">무료·쿠폰·마트·카드</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {visibleGroups.map((group, index) => (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelectQuery?.(group.query)}
            className={`min-h-[72px] rounded-2xl border px-3 py-2 text-left transition hover:-translate-y-0.5 ${
              index === 0
                ? "border-brand-red bg-gradient-to-br from-red-50 to-orange-50 shadow-sm"
                : "border-slate-100 bg-slate-50 hover:border-red-100 hover:bg-red-50"
            }`}
            aria-label={`${group.label} 공식 혜택 ${group.count}개 보기`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-black text-slate-950">{group.label}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-brand-red shadow-sm">{group.count}</span>
            </span>
            <span className="mt-1 block truncate text-[11px] font-bold text-slate-500">
              {group.urgentCount ? `마감임박 ${group.urgentCount}개` : group.topSources.slice(0, 2).join(" · ") || group.actionLabel}
            </span>
            <span className="mt-1 block truncate text-[10px] font-black text-slate-400">{group.actionLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

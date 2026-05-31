import { ShieldCheck } from "lucide-react";
import { getDealQualityNotice, getPurchaseTrustChecklist } from "@/lib/deals/quality";
import { getDealSourceProfile, getDealTrustLabel, getDealTrustScore } from "@/lib/deals/trust";
import { Deal } from "@/types/deal";

export function DealTrustBadge({ deal, compact = false }: { deal: Deal; compact?: boolean }) {
  const score = getDealTrustScore(deal);
  const source = getDealSourceProfile(deal.source);
  const label = getDealTrustLabel(score);
  const notice = getDealQualityNotice(deal);
  const trustChecklist = getPurchaseTrustChecklist(deal);
  const noticeToneClass = {
    verified: "bg-emerald-50 text-emerald-700",
    urgent: "bg-amber-50 text-amber-700",
    review: "bg-red-50 text-dossa-red",
    warning: "bg-amber-50 text-amber-800",
    neutral: "bg-slate-100 text-slate-700"
  }[notice.tone];
  const checklistToneClass = {
    good: "border-emerald-100 bg-white text-emerald-800",
    caution: "border-amber-100 bg-amber-50 text-amber-800",
    danger: "border-red-100 bg-red-50 text-dossa-red",
    neutral: "border-slate-100 bg-white text-slate-700"
  };

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${noticeToneClass}`}>
        <ShieldCheck size={12} />
        {notice.label}
      </span>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-800">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-black">
          <ShieldCheck size={16} />
          {label}
        </span>
        <span className="text-xs font-black">구매 전 확인</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-emerald-700">
        {source.label} · {source.disclosure}
      </p>
      <div className={`mt-2 rounded-xl px-3 py-2 ${noticeToneClass}`}>
        <p className="text-xs font-black">품질 안내: {notice.label}</p>
        <p className="mt-1 text-xs font-bold leading-5">{notice.description}</p>
      </div>
      <div className="mt-3" aria-label="구매 전 신뢰 체크">
        <p className="text-xs font-black text-emerald-900">구매 전 신뢰 체크</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {trustChecklist.map((item) => (
            <div key={item.label} className={`rounded-xl border px-3 py-2 ${checklistToneClass[item.tone]}`}>
              <p className="text-[11px] font-black opacity-70">{item.label}</p>
              <p className="mt-1 text-xs font-black">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

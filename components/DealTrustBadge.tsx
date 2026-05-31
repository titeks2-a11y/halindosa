import { ShieldCheck } from "lucide-react";
import { getDealQualityNotice } from "@/lib/deals/quality";
import { getDealSourceProfile, getDealTrustLabel, getDealTrustScore } from "@/lib/deals/trust";
import { Deal } from "@/types/deal";

export function DealTrustBadge({ deal, compact = false }: { deal: Deal; compact?: boolean }) {
  const score = getDealTrustScore(deal);
  const source = getDealSourceProfile(deal.source);
  const label = getDealTrustLabel(score);
  const notice = getDealQualityNotice(deal);
  const noticeToneClass = {
    verified: "bg-emerald-50 text-emerald-700",
    urgent: "bg-amber-50 text-amber-700",
    review: "bg-red-50 text-dossa-red",
    warning: "bg-amber-50 text-amber-800",
    neutral: "bg-slate-100 text-slate-700"
  }[notice.tone];

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
    </div>
  );
}

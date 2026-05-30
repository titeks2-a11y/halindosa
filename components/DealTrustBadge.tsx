import { ShieldCheck } from "lucide-react";
import { getDealSourceProfile, getDealTrustLabel, getDealTrustScore } from "@/lib/deals/trust";
import { Deal } from "@/types/deal";

export function DealTrustBadge({ deal, compact = false }: { deal: Deal; compact?: boolean }) {
  const score = getDealTrustScore(deal);
  const source = getDealSourceProfile(deal.source);
  const label = getDealTrustLabel(score);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
        <ShieldCheck size={12} />
        {label}
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
    </div>
  );
}

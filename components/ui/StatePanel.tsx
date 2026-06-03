import type { ReactNode } from "react";
import { AlertCircle, RotateCw, SearchX, ShoppingBag } from "lucide-react";

type StatePanelTone = "empty" | "error" | "retry" | "noDeal";

const toneMeta = {
  empty: { icon: SearchX, iconClassName: "bg-slate-100 text-slate-600" },
  error: { icon: AlertCircle, iconClassName: "bg-amber-50 text-amber-700" },
  retry: { icon: RotateCw, iconClassName: "bg-red-50 text-dossa-red" },
  noDeal: { icon: ShoppingBag, iconClassName: "bg-brand-warm text-brand-steel" }
} satisfies Record<StatePanelTone, { icon: typeof SearchX; iconClassName: string }>;

interface StatePanelProps {
  tone?: StatePanelTone;
  title: string;
  description: string;
  action?: ReactNode;
}

export function StatePanel({ tone = "empty", title, description, action }: StatePanelProps) {
  const Icon = toneMeta[tone].icon;

  return (
    <div className="commerce-surface rounded-[24px] px-5 py-10 text-center">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${toneMeta[tone].iconClassName}`}>
        <Icon size={24} />
      </div>
      <p className="mt-4 text-base font-black text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function DealGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 md:gap-4 xl:grid-cols-3 2xl:grid-cols-4" aria-label="특가 목록 로딩 중">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-[20px] border border-brand-line bg-white shadow-sm">
          <div className="aspect-[4/3] animate-pulse bg-brand-warm" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
            <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

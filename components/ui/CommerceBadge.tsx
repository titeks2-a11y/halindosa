import type { ReactNode } from "react";

type CommerceBadgeTone = "primary" | "gold" | "navy" | "success" | "neutral" | "warning";

const toneClassNames: Record<CommerceBadgeTone, string> = {
  primary: "bg-red-50 text-dossa-red",
  gold: "bg-yellow-50 text-yellow-700",
  navy: "bg-slate-950 text-white",
  success: "bg-emerald-50 text-emerald-700",
  neutral: "bg-slate-100 text-slate-600",
  warning: "bg-amber-50 text-amber-700"
};

interface CommerceBadgeProps {
  children: ReactNode;
  tone?: CommerceBadgeTone;
  className?: string;
}

export function CommerceBadge({ children, tone = "neutral", className = "" }: CommerceBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${toneClassNames[tone]} ${className}`}>
      {children}
    </span>
  );
}

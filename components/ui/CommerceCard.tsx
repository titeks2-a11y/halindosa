import type { HTMLAttributes, ReactNode } from "react";

type CommerceCardTone = "surface" | "subtle" | "highlight" | "trust" | "warning";

const toneClassNames: Record<CommerceCardTone, string> = {
  surface: "border-brand-line bg-brand-surface shadow-lift",
  subtle: "border-slate-100 bg-white shadow-sm",
  highlight: "border-orange-100 bg-orange-50 shadow-sm",
  trust: "border-emerald-100 bg-emerald-50 shadow-sm",
  warning: "border-amber-100 bg-amber-50 shadow-sm"
};

interface CommerceCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: CommerceCardTone;
}

export function CommerceCard({ children, tone = "surface", className = "", ...props }: CommerceCardProps) {
  return (
    <div className={`rounded-[24px] border ${toneClassNames[tone]} ${className}`} {...props}>
      {children}
    </div>
  );
}

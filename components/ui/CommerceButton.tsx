import type { ButtonHTMLAttributes, ReactNode } from "react";

type CommerceButtonTone = "primary" | "premium" | "navy" | "coral" | "gold" | "neutral" | "danger";
type CommerceButtonSize = "sm" | "md" | "lg";

const toneClassNames: Record<CommerceButtonTone, string> = {
  primary: "commerce-gradient text-white shadow-sm hover:brightness-95",
  premium: "premium-gradient text-white shadow-sm hover:brightness-105",
  navy: "bg-brand-navy text-white shadow-sm hover:bg-dossa-red",
  coral: "bg-brand-coral text-white shadow-sm hover:bg-brand-primary",
  gold: "bg-brand-gold text-brand-navy shadow-sm hover:bg-brand-amber",
  neutral: "border border-slate-200 bg-white text-slate-700 hover:bg-brand-warm",
  danger: "border border-amber-100 bg-amber-50 text-amber-900 hover:bg-amber-100"
};

const sizeClassNames: Record<CommerceButtonSize, string> = {
  sm: "min-h-10 rounded-2xl px-3 text-xs",
  md: "min-h-11 rounded-2xl px-4 text-sm",
  lg: "min-h-12 rounded-2xl px-5 text-sm"
};

export function commerceButtonClassName({
  tone = "navy",
  size = "md",
  className = ""
}: {
  tone?: CommerceButtonTone;
  size?: CommerceButtonSize;
  className?: string;
} = {}) {
  return `inline-flex items-center justify-center gap-2 font-black transition disabled:cursor-not-allowed disabled:opacity-55 ${toneClassNames[tone]} ${sizeClassNames[size]} ${className}`;
}

interface CommerceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: CommerceButtonTone;
  size?: CommerceButtonSize;
}

export function CommerceButton({ children, tone = "navy", size = "md", className = "", ...props }: CommerceButtonProps) {
  return (
    <button type="button" className={commerceButtonClassName({ tone, size, className })} {...props}>
      {children}
    </button>
  );
}

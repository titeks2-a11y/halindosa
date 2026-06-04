import type { ReactNode } from "react";

type CommerceSectionHeaderTone = "primary" | "trust" | "gold" | "neutral";

const eyebrowClassNames: Record<CommerceSectionHeaderTone, string> = {
  primary: "text-brand-red",
  trust: "text-brand-navy",
  gold: "text-amber-700",
  neutral: "text-slate-500"
};

interface CommerceSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  trailing?: ReactNode;
  tone?: CommerceSectionHeaderTone;
  compact?: boolean;
  className?: string;
}

export function CommerceSectionHeader({
  eyebrow,
  title,
  description,
  trailing,
  tone = "primary",
  compact = false,
  className = ""
}: CommerceSectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? <p className={`text-xs font-black ${eyebrowClassNames[tone]}`}>{eyebrow}</p> : null}
        <h2 className={`${compact ? "mt-0.5 text-base sm:text-lg" : "mt-1 text-lg sm:text-xl"} font-black leading-tight text-slate-950`}>
          {title}
        </h2>
        {description ? <p className="mt-1 max-w-2xl text-xs font-bold leading-5 text-slate-500 sm:text-sm sm:leading-6">{description}</p> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

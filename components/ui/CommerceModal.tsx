import type { ReactNode } from "react";
import { X } from "lucide-react";

interface CommerceModalProps {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  onClose: () => void;
}

export function CommerceModal({ children, title, eyebrow, description, onClose }: CommerceModalProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-brand-navy/45 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-8 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[480px] overflow-hidden rounded-[28px] border border-brand-line bg-brand-surface shadow-2xl ring-1 ring-slate-950/5 sm:max-w-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-brand-line p-4 sm:p-5">
          <div className="min-w-0">
            {eyebrow ? <p className="text-xs font-black text-dossa-red">{eyebrow}</p> : null}
            <h2 className="mt-1 line-clamp-2 text-lg font-black leading-snug text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-brand-warm hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

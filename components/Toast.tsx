import { X } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  return (
    <div className="fixed left-1/2 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-brand-navy/95 px-3 py-2.5 text-white shadow-xl sm:bottom-6 sm:top-auto">
      <div className="flex items-center justify-between gap-3">
        <p className="line-clamp-2 text-xs font-bold sm:text-sm">{message}</p>
        <button
          type="button"
          aria-label="토스트 닫기"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

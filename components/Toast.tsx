import { X } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-2xl sm:bottom-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{message}</p>
        <button
          type="button"
          aria-label="토스트 닫기"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Heart, LogIn, X } from "lucide-react";

interface LoginPromptSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginPromptSheet({ isOpen, onClose }: LoginPromptSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 px-3 pb-3 sm:items-center sm:pb-0" role="dialog" aria-modal="true" aria-labelledby="login-prompt-title">
      <section className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
            <Heart size={23} fill="currentColor" />
          </span>
          <button type="button" onClick={onClose} aria-label="로그인 안내 닫기" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <h2 id="login-prompt-title" className="mt-4 text-2xl font-black text-slate-950">찜하려면 로그인이 필요해요</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
          로그인하면 찜한 상품, 최근 본 상품, 관심 카테고리를 계정으로 이어볼 수 있습니다.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white">
            <LogIn size={17} />
            로그인
          </Link>
          <Link href="/signup" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">
            회원가입
          </Link>
        </div>
      </section>
    </div>
  );
}

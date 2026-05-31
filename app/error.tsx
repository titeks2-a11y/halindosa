"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-red-100 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-dossa-red">
          <AlertTriangle size={26} />
        </span>
        <p className="mt-5 text-2xl font-black text-slate-950">일시적으로 화면을 불러오지 못했습니다</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          네트워크가 불안정하거나 특가 데이터를 확인하는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <div className="mt-6 grid gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-dossa-red px-4 text-sm font-black text-white"
          >
            <RefreshCw size={18} />
            다시 시도
          </button>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm font-black text-slate-700">
            <Home size={18} />
            홈으로 이동
          </Link>
        </div>
      </section>
    </div>
  );
}

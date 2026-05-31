import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function CommercialFooter() {
  return (
    <footer className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 sm:pb-10 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
              <ShieldCheck size={21} />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">구매 전 확인 안내</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                할인도사는 특가 정보를 빠르게 정리해 보여줍니다. 최종 가격, 재고, 쿠폰, 배송 조건은 판매처 상세 페이지에서 한 번 더 확인하세요.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 text-sm font-black text-slate-600 md:justify-end">
            <Link className="rounded-full bg-slate-100 px-3 py-2 hover:bg-red-50 hover:text-dossa-red" href="/favorites">
              찜한 특가
            </Link>
            <Link className="rounded-full bg-slate-100 px-3 py-2 hover:bg-red-50 hover:text-dossa-red" href="/guide">
              서비스 안내
            </Link>
            <Link className="rounded-full bg-slate-100 px-3 py-2 hover:bg-red-50 hover:text-dossa-red" href="/support">
              고객센터
            </Link>
            <Link className="rounded-full bg-slate-100 px-3 py-2 hover:bg-red-50 hover:text-dossa-red" href="/terms">
              이용약관
            </Link>
            <Link className="rounded-full bg-slate-100 px-3 py-2 hover:bg-red-50 hover:text-dossa-red" href="/privacy">
              개인정보
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

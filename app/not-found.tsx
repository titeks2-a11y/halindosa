import Link from "next/link";
import { Home, Search, ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-red-50 text-dossa-red">
          <Search size={26} />
        </span>
        <p className="mt-5 text-2xl font-black text-slate-950">페이지를 찾을 수 없습니다</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          특가가 종료되었거나 주소가 바뀌었을 수 있습니다. 홈에서 최신 특가를 다시 확인해 주세요.
        </p>
        <div className="mt-6 grid gap-2">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">
            <Home size={18} />
            홈으로 돌아가기
          </Link>
          <Link href="/support" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 text-sm font-black text-slate-700">
            <ShieldCheck size={18} className="text-dossa-red" />
            고객센터에서 문의하기
          </Link>
        </div>
      </section>
    </div>
  );
}

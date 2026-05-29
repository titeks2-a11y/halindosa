import { ArrowRight, BadgePercent, Radio } from "lucide-react";

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-dossa-deep via-dossa-red to-rose-500 px-5 py-6 text-white shadow-2xl shadow-red-200 sm:px-8 sm:py-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold ring-1 ring-white/20">
              <Radio size={16} />
              실시간 업데이트 중
            </div>
            <h2 className="text-3xl font-black tracking-normal sm:text-5xl">오늘 놓치면 아쉬운 특가</h2>
            <p className="mt-3 text-lg font-semibold text-red-50 sm:text-2xl">최대 80% 할인 상품을 쇼핑몰별로 빠르게 모았습니다.</p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
            <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/20">
              <BadgePercent size={26} />
              <div>
                <p className="text-xs font-semibold text-red-50">오늘의 최대 할인</p>
                <p className="text-2xl font-black">80%</p>
              </div>
            </div>
            <a
              href="#deals"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-base font-black text-dossa-deep shadow-lg transition hover:translate-y-[-1px]"
            >
              특가 둘러보기
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

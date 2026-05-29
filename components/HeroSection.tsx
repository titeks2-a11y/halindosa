import { ArrowRight, BadgePercent, Radio, ScanSearch, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-2xl shadow-slate-200">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative px-5 py-6 sm:px-8 sm:py-9">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(225,29,46,0.38),transparent_28rem)]" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold ring-1 ring-white/15">
              <Radio size={16} />
                라이브 핫딜 레이더
              </div>
              <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-normal sm:text-5xl">
                사람들이 놓치기 쉬운 특가 신호를 먼저 잡아드립니다
              </h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-200 sm:text-xl">
                할인 뉴스, 쇼핑몰 가격, 커뮤니티 피드에서 핫딜 단서를 모아 읽기 쉬운 피드로 정리합니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["뉴스 RSS", "커뮤니티 피드", "가격 비교", "마감 임박"].map((label) => (
                  <span key={label} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white ring-1 ring-white/10">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.04] p-4 sm:p-6 lg:border-l lg:border-t-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-dossa-red text-white">
                    <BadgePercent size={24} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">오늘의 최대 할인</p>
                    <p className="text-2xl font-black">80%</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-dossa-red">
                    <ScanSearch size={23} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">수집 모드</p>
                    <p className="text-lg font-black">실시간 신호 분석</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <a
                href="#live-signals"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-base font-black text-slate-950 shadow-lg transition hover:translate-y-[-1px]"
              >
                실시간 신호 보기
                <ArrowRight size={18} />
              </a>
              <a
                href="#all-deals"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-dossa-red px-5 py-3 text-base font-black text-white transition hover:bg-red-700"
              >
                특가 목록 보기
                <Zap size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

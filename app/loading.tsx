export default function Loading() {
  const chips = ["전원증정", "선착순", "쿠폰", "샘플", "기프티콘", "포인트"];

  return (
    <main className="mx-auto max-w-[480px] space-y-3 px-2.5 py-2.5 lg:max-w-7xl lg:px-8 lg:py-8">
      <section className="rounded-[24px] bg-gradient-to-br from-[#ff2b2b] to-[#ff6a3d] p-3 text-white shadow-sm lg:p-5">
        <p className="sr-only">할인도사 화면을 불러오는 중</p>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-white/80">무료혜택 메인</p>
            <h1 className="mt-1 text-xl font-black leading-7 lg:text-3xl">오늘 받을 수 있는 무료 혜택</h1>
            <p className="mt-1 text-xs font-bold leading-5 text-white/85 lg:text-sm">공식 쿠폰, 샘플, 무료체험, 전원증정 혜택을 불러오는 중입니다.</p>
          </div>
          <span className="shrink-0 rounded-2xl bg-white px-3 py-2 text-[11px] font-black text-dossa-red">실시간 확인</span>
        </div>
        <div className="mt-3 flex min-h-11 items-center rounded-2xl bg-white px-3 text-sm font-bold text-slate-400">혜택·브랜드 검색</div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-emerald-700">실시간 검증됨</span>
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-blue-700">전체 무료혜택 확인 중</span>
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-purple-700">쉬운 참여 우선</span>
        </div>
      </section>
      <section className="grid grid-cols-3 gap-1.5 lg:grid-cols-6" aria-label="무료혜택 카테고리 로딩 중">
        {chips.map((chip) => (
          <div key={chip} className="rounded-2xl border border-white bg-white px-2.5 py-2 text-center text-[11px] font-black text-slate-950 shadow-sm">
            {chip}
          </div>
        ))}
      </section>
      <section className="grid animate-pulse grid-cols-2 gap-2 lg:grid-cols-6" aria-label="무료혜택 로딩 중">
        {Array.from({ length: 6 }).map((_, index) => (
          <article key={index} className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex gap-2.5">
              <div className="h-20 w-20 shrink-0 rounded-2xl bg-slate-100" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-16 rounded-full bg-slate-100" />
                <div className="h-4 w-full rounded-full bg-slate-100" />
                <div className="h-4 w-3/4 rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="mt-3 h-10 rounded-2xl bg-slate-100" />
          </article>
        ))}
      </section>
    </main>
  );
}

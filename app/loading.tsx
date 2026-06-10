const previewBenefits = [
  {
    brand: "공식 이벤트",
    title: "오늘 받을 수 있는 무료혜택을 확인하는 중",
    meta: "쿠폰 · 샘플 · 무료체험",
    tone: "bg-emerald-50 text-emerald-700"
  },
  {
    brand: "편의점/마트",
    title: "1+1, 증정, 무료배송 혜택을 불러오는 중",
    meta: "GS25 · CU · SSG · 롯데ON",
    tone: "bg-orange-50 text-orange-700"
  },
  {
    brand: "포인트/페이",
    title: "출석체크와 포인트 적립 혜택을 모으는 중",
    meta: "네이버페이 · PAYCO · OK캐쉬백",
    tone: "bg-blue-50 text-blue-700"
  },
  {
    brand: "뷰티/체험",
    title: "샘플, 체험단, 전원증정 이벤트를 검증하는 중",
    meta: "올리브영 · 브랜드 공식몰",
    tone: "bg-purple-50 text-purple-700"
  }
];

export default function Loading() {
  return (
    <div className="space-y-3 px-3 py-3 sm:px-4 lg:px-0 lg:py-6" aria-label="할인도사 홈을 준비하는 중">
      <section className="rounded-[22px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-dossa-red">무료혜택 메인</p>
            <h1 className="mt-1 text-lg font-black leading-6 text-slate-950">오늘 받을 수 있는 혜택을 빠르게 정리하고 있어요</h1>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">검색 링크와 종료 링크를 제외하고 공식 이벤트만 우선 보여드립니다.</p>
          </div>
          <span className="shrink-0 rounded-2xl bg-white px-3 py-2 text-[11px] font-black text-dossa-red shadow-sm">검증 중</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2" aria-label="무료혜택 프리뷰">
        {previewBenefits.map((benefit) => (
          <article key={benefit.title} className="rounded-[18px] border border-slate-200 bg-white p-2.5 shadow-sm">
            <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black ${benefit.tone}`}>{benefit.brand}</span>
            <h2 className="mt-2 line-clamp-2 text-sm font-black leading-5 text-slate-950">{benefit.title}</h2>
            <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-500">{benefit.meta}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-dossa-red" />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

import { formatPrice } from "@/lib/format";
import type { Deal } from "@/types/deal";

interface HomeEmptyRecoveryProps {
  keywords: string[];
  deals: Deal[];
  onResetFilters: () => void;
  onSelectKeyword: (keyword: string) => void;
  onOpenDeal: (deal: Deal) => void;
}

export function HomeEmptyRecovery({ keywords, deals, onResetFilters, onSelectKeyword, onOpenDeal }: HomeEmptyRecoveryProps) {
  return (
    <div className="w-full max-w-3xl space-y-4 text-left" aria-label="검색 결과 없음 복구">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onResetFilters}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-dossa-red"
        >
          조건 초기화하고 전체 특가 보기
        </button>
      </div>
      {keywords.length ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-3" aria-label="검색 결과 없음 추천 검색어">
          <p className="text-xs font-black text-dossa-red">바로 다시 찾아볼 검색어</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {keywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => onSelectKeyword(keyword)}
                className="inline-flex min-h-10 shrink-0 items-center rounded-2xl border border-red-100 bg-white px-3 text-xs font-black text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-white hover:text-dossa-red"
                aria-label={`${keyword} 검색어로 다시 검색`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {deals.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3" aria-label="검색 실패 시 먼저 볼 검증 특가">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black text-slate-700">먼저 볼 만한 검증 특가</p>
              <p className="text-[11px] font-bold text-slate-500">검색 결과 대신 실제 구매 링크가 확인된 상품을 보여드립니다.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-dossa-red">새 탭 이동</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {deals.map((deal) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => onOpenDeal(deal)}
                className="min-h-[112px] rounded-2xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                aria-label={`${deal.title} 검증 특가 판매처 확인`}
              >
                <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-black text-dossa-red">{deal.discountRate}%</span>
                <strong className="mt-2 line-clamp-2 block text-sm font-black text-slate-950">{deal.title}</strong>
                <span className="mt-2 block truncate text-[11px] font-bold text-slate-500">{deal.mallName} · {formatPrice(deal.salePrice)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { Clock3, Search, Sparkles, X } from "lucide-react";

interface SearchDiscoveryPanelProps {
  popularKeywords: string[];
  recentKeywords: string[];
  resultCount: number;
  onSelectKeyword: (keyword: string) => void;
  onClearRecentKeywords: () => void;
}

export function SearchDiscoveryPanel({
  popularKeywords,
  recentKeywords,
  resultCount,
  onSelectKeyword,
  onClearRecentKeywords
}: SearchDiscoveryPanelProps) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4" aria-label="검색 도우미">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
              <Search size={17} />
            </span>
            <p className="text-sm font-black text-slate-950">검색 도우미</p>
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            인기 검색어와 최근 검색어로 원하는 특가를 빠르게 찾을 수 있습니다.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
          현재 결과 <span className="text-dossa-red">{resultCount}</span>개
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-dossa-red">
            <Sparkles size={14} />
            인기 검색어
          </div>
          <div className="flex flex-wrap gap-2">
            {popularKeywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => onSelectKeyword(keyword)}
                className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-dossa-red"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-600">
              <Clock3 size={14} />
              최근 검색어
            </div>
            {recentKeywords.length ? (
              <button
                type="button"
                onClick={onClearRecentKeywords}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 shadow-sm hover:text-dossa-red"
                aria-label="최근 검색어 모두 지우기"
              >
                <X size={12} />
                지우기
              </button>
            ) : null}
          </div>
          {recentKeywords.length ? (
            <div className="flex flex-wrap gap-2">
              {recentKeywords.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => onSelectKeyword(keyword)}
                  className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-dossa-red"
                >
                  {keyword}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-500 shadow-sm">
              아직 최근 검색어가 없습니다. 관심 있는 상품명이나 쇼핑몰을 검색해보세요.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  resultCount?: number;
  onSelectSuggestion?: (value: string) => void;
}

export function SearchBar({ value, onChange, suggestions = [], resultCount, onSelectSuggestion }: SearchBarProps) {
  const uniqueSuggestions = suggestions.filter((keyword, index) => keyword && suggestions.indexOf(keyword) === index).slice(0, 8);

  return (
    <div className="flex-1">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="search"
          enterKeyHint="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && value) onChange("");
          }}
          aria-label="상품명, 쇼핑몰, 카테고리 검색"
          placeholder="상품명, 쇼핑몰, 카테고리를 검색해보세요"
          className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-12 text-base font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-dossa-red focus:ring-4 focus:ring-red-100"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="검색어 지우기"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-dossa-red"
          >
            <X size={17} />
          </button>
        ) : null}
      </label>
      <p className="sr-only">검색어 빠른 초기화 지원</p>

      {uniqueSuggestions.length || typeof resultCount === "number" ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" aria-label="추천 검색어">
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex min-h-8 shrink-0 items-center gap-1.5 self-start rounded-full bg-red-50 px-3 py-1 text-xs font-black text-dossa-red transition hover:bg-dossa-red hover:text-white"
              aria-label={`${value} 검색어 해제`}
            >
              <span className="max-w-[180px] truncate">검색어: {value}</span>
              <X size={13} aria-hidden="true" />
            </button>
          ) : null}
          {uniqueSuggestions.length ? (
            <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">
                추천 검색어
              </span>
              {uniqueSuggestions.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => (onSelectSuggestion ? onSelectSuggestion(keyword) : onChange(keyword))}
                  aria-label={`${keyword} 검색어 적용`}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-dossa-red"
                >
                  {keyword}
                </button>
              ))}
            </div>
          ) : null}
          {typeof resultCount === "number" ? (
            <p className="shrink-0 text-xs font-black text-slate-500" role="status" aria-live="polite">
              현재 결과 <span className="text-dossa-red">{resultCount}</span>개
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

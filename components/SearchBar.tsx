import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  resultCount?: number;
  onSelectSuggestion?: (value: string) => void;
}

export function SearchBar({ value, onChange, suggestions = [], resultCount, onSelectSuggestion }: SearchBarProps) {
  const uniqueSuggestions = suggestions.filter((keyword, index) => keyword && suggestions.indexOf(keyword) === index).slice(0, 24);

  return (
    <div className="flex-1">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-4" size={18} />
        <input
          type="search"
          enterKeyHint="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && value) onChange("");
          }}
          aria-label="무료혜택, 쿠폰, 브랜드, 쇼핑몰 검색"
          placeholder="혜택·브랜드 검색"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-dossa-red focus:ring-4 focus:ring-red-100 sm:h-13 sm:rounded-2xl sm:py-4 sm:pl-12 sm:pr-12 sm:text-base"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="검색어 지우기"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-dossa-red sm:right-3 sm:h-8 sm:w-8"
          >
            <X size={17} />
          </button>
        ) : null}
      </label>
      <p className="sr-only">검색어 빠른 초기화 지원</p>

      {uniqueSuggestions.length || typeof resultCount === "number" ? (
        <div className="mt-1.5 flex flex-col gap-1.5 sm:mt-2 sm:flex-row sm:items-center sm:justify-between" aria-label="추천 검색어">
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
            <div className="hidden gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">
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
            <p className="hidden shrink-0 text-xs font-black text-slate-500 sm:block" role="status" aria-live="polite">
              현재 결과 <span className="text-dossa-red">{resultCount}</span>개
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

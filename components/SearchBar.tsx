import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="relative block flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
  );
}

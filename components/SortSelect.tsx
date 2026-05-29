import { ArrowDownUp } from "lucide-react";
import { DealSort } from "@/types/deal";

interface SortSelectProps {
  value: DealSort;
  onChange: (sort: DealSort) => void;
}

const sortOptions: { value: DealSort; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "discount", label: "할인율 높은순" },
  { value: "price", label: "낮은 가격순" },
  { value: "hot", label: "핫딜순" },
  { value: "endingSoon", label: "마감임박순" }
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="relative block min-w-[168px]">
      <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as DealSort)}
        className="h-full min-h-[54px] w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-dossa-red focus:ring-4 focus:ring-red-100"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

import { categories } from "@/data/mockDeals";

interface CategoryTabsProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => {
        const active = selected === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
              active
                ? "border-dossa-red bg-dossa-red text-white shadow-md shadow-red-100"
                : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-dossa-red"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

import { dealChannels } from "@/data/dealChannels";

interface CategoryTabsProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  const groups = Array.from(new Set(dealChannels.map((channel) => channel.group)));

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group}>
          <p className="mb-2 px-1 text-[11px] font-black text-slate-400">{group}</p>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {dealChannels
              .filter((channel) => channel.group === group)
              .map((channel) => {
                const active = selected === channel.id;

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => onSelect(channel.id)}
                    title={channel.description}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
                      active
                        ? "border-dossa-red bg-dossa-red text-white shadow-md shadow-red-100"
                        : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-dossa-red"
                    }`}
                  >
                    {channel.label}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

import Link from "next/link";
import { Grid3X3, Tag } from "lucide-react";
import { dealChannels, dealMatchesChannel } from "@/data/dealChannels";
import { getDeals } from "@/lib/dealService";

export default async function CategoriesPage() {
  const { deals } = await getDeals();
  const categories = dealChannels.map((channel) => {
    const items = channel.id === "all" ? deals : deals.filter((deal) => dealMatchesChannel(deal, channel.id));
    const bestDiscount = items.reduce((best, deal) => Math.max(best, deal.discountRate), 0);

    return {
      ...channel,
      count: items.length,
      bestDiscount
    };
  });

  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="rounded-[24px] bg-slate-950 p-5 text-white shadow-sm lg:rounded-[28px] lg:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-red-200">
            <Grid3X3 size={23} />
          </span>
          <div>
            <p className="text-xs font-black text-red-200">카테고리</p>
            <h1 className="text-xl font-black lg:text-3xl">원하는 할인 정보만 빠르게 보기</h1>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/?category=${category.id}`}
            className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-red-100 hover:shadow-deal"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
              <Tag size={18} />
            </span>
            <p className="mt-4 text-base font-black text-slate-950">{category.label}</p>
            <p className="mt-1 line-clamp-2 min-h-10 text-xs font-bold leading-5 text-slate-500">{category.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs font-black">
              <span className="text-slate-500">{category.count}개 특가</span>
              <span className="text-dossa-red">최대 {category.bestDiscount}%</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

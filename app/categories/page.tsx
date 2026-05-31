import Link from "next/link";
import { CheckCircle2, Grid3X3, PackageCheck, Tag, Truck } from "lucide-react";
import { dealChannels, dealMatchesChannel } from "@/data/dealChannels";
import { getDeals } from "@/lib/dealService";
import { getLinkQualityScore, isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { formatPrice } from "@/lib/format";

export default async function CategoriesPage() {
  const { deals } = await getDeals();
  const categories = dealChannels.map((channel) => {
    const items = channel.id === "all" ? deals : deals.filter((deal) => dealMatchesChannel(deal, channel.id));
    const bestDiscount = items.reduce((best, deal) => Math.max(best, deal.discountRate), 0);
    const verifiedCount = items.filter(isVerifiedPurchaseLink).length;
    const freeShippingCount = items.filter((deal) => deal.isFreeShipping).length;
    const bestDeal = [...items].sort(
      (a, b) =>
        getLinkQualityScore(b) - getLinkQualityScore(a) ||
        Number(b.isHot) - Number(a.isHot) ||
        b.discountRate - a.discountRate ||
        b.popularityScore - a.popularityScore
    )[0];

    return {
      ...channel,
      count: items.length,
      bestDiscount,
      verifiedCount,
      freeShippingCount,
      bestDeal
    };
  });

  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="rounded-[24px] bg-slate-950 p-5 text-white shadow-sm lg:rounded-[28px] lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-red-200">
              <Grid3X3 size={23} />
            </span>
            <div>
              <p className="text-xs font-black text-red-200">카테고리</p>
              <h1 className="text-xl font-black lg:text-3xl">원하는 할인 정보만 빠르게 보기</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                카테고리별 대표 특가와 구매 링크 확인 현황을 함께 확인하세요.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="rounded-2xl bg-white/10 px-3 py-2">
              <p className="text-red-200">전체</p>
              <p className="mt-1 text-lg text-white">{deals.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2">
              <p className="text-red-200">구매 링크</p>
              <p className="mt-1 text-lg text-white">{deals.filter(isVerifiedPurchaseLink).length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2">
              <p className="text-red-200">무료배송</p>
              <p className="mt-1 text-lg text-white">{deals.filter((deal) => deal.isFreeShipping).length}</p>
            </div>
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
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                <Tag size={18} />
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                {category.count}개 특가
              </span>
            </div>
            <p className="mt-4 text-base font-black text-slate-950">{category.label}</p>
            <p className="mt-1 line-clamp-2 min-h-10 text-xs font-bold leading-5 text-slate-500">{category.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-black">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                <CheckCircle2 size={12} />
                구매 링크 확인 {category.verifiedCount}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-dossa-red">
                <Truck size={12} />
                무료배송 {category.freeShippingCount}
              </span>
            </div>
            {category.bestDeal ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-1 text-[11px] font-black text-dossa-red">
                  <PackageCheck size={13} />
                  대표 특가
                </div>
                <p className="mt-1 line-clamp-2 min-h-9 text-sm font-black leading-snug text-slate-950">{category.bestDeal.title}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  {category.bestDeal.mallName} · {formatPrice(category.bestDeal.salePrice)}
                </p>
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-between text-xs font-black">
              <span className="text-slate-500">바로 보기</span>
              <span className="text-dossa-red">최대 {category.bestDiscount}%</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

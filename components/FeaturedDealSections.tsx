import { Flame, Sparkles, Timer, Truck } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { Deal } from "@/types/deal";

interface FeaturedDealSectionsProps {
  deals: Deal[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  onShareDeal: (deal: Deal) => void;
}

const sections = [
  {
    id: "popular",
    title: "인기 특가",
    description: "반응이 빠르게 올라오는 핫딜",
    icon: Flame,
    getDeals: (deals: Deal[]) =>
      [...deals].sort((a, b) => Number(b.isHot) - Number(a.isHot) || b.popularityScore - a.popularityScore).slice(0, 4)
  },
  {
    id: "recommended",
    title: "오늘의 추천",
    description: "할인율과 인기도를 함께 본 추천",
    icon: Sparkles,
    getDeals: (deals: Deal[]) => [...deals].sort((a, b) => b.discountRate + b.popularityScore - (a.discountRate + a.popularityScore)).slice(0, 4)
  },
  {
    id: "ending",
    title: "마감 임박",
    description: "놓치기 전에 확인해야 하는 특가",
    icon: Timer,
    getDeals: (deals: Deal[]) =>
      [...deals]
        .filter((deal) => deal.isEndingSoon)
        .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
        .slice(0, 4)
  },
  {
    id: "free-shipping",
    title: "무료배송 특가",
    description: "배송비 부담 없이 보기 좋은 특가",
    icon: Truck,
    getDeals: (deals: Deal[]) =>
      [...deals]
        .filter((deal) => /무료배송|무배|네멤무료|로켓프레시/.test([deal.shippingInfo, ...deal.tags].join(" ")))
        .sort((a, b) => b.discountRate - a.discountRate)
        .slice(0, 4)
  }
] as const;

export function FeaturedDealSections({ deals, favorites, onToggleFavorite, onOpenDeal, onShareDeal }: FeaturedDealSectionsProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const Icon = section.icon;
        const items = section.getDeals(deals);

        if (!items.length) return null;

        return (
          <section key={section.id} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                    <Icon size={18} />
                  </span>
                  <h3 className="text-xl font-black text-slate-950">{section.title}</h3>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">{section.description}</p>
              </div>
              <a href="#all-deals" className="shrink-0 text-sm font-black text-dossa-red">
                전체보기
              </a>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {items.map((deal) => (
                <DealCard
                  key={`${section.id}-${deal.id}`}
                  deal={deal}
                  isFavorite={favorites.includes(deal.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDeal={onOpenDeal}
                  onShareDeal={onShareDeal}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

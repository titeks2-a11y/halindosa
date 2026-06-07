import Link from "next/link";
import { BadgePercent, Flame, Sparkles, Timer, Truck, Zap } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { getLinkQualityScore } from "@/lib/deals/quality";
import { Deal } from "@/types/deal";

interface FeaturedDealSectionsProps {
  deals: Deal[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  onShareDeal: (deal: Deal) => void;
  referenceNow?: number;
}

function sectionScore(deal: Deal) {
  return getLinkQualityScore(deal) + deal.popularityScore + deal.discountRate * 0.6 + Number(deal.isHot) * 10 + Number(deal.isFreeShipping) * 6;
}

const sections = [
  {
    id: "popular",
    title: "인기 급상승",
    description: "반응이 빠르게 올라오는 핫딜",
    icon: Flame,
    getDeals: (deals: Deal[]) =>
      [...deals].sort((a, b) => Number(b.isHot) - Number(a.isHot) || sectionScore(b) - sectionScore(a)).slice(0, 4)
  },
  {
    id: "free-zero",
    title: "무료/0원딜",
    description: "쿠폰과 무료배송 조건이 좋은 딜",
    icon: Zap,
    getDeals: (deals: Deal[]) =>
      [...deals]
        .filter((deal) => deal.isFreeShipping || /0원딜|무료|쿠폰/.test([deal.category, ...deal.tags].join(" ")))
        .sort((a, b) => sectionScore(b) - sectionScore(a))
        .slice(0, 4)
  },
  {
    id: "recommended",
    title: "오늘의 특가",
    description: "할인율과 인기도를 함께 본 추천",
    icon: Sparkles,
    getDeals: (deals: Deal[]) => [...deals].sort((a, b) => sectionScore(b) - sectionScore(a)).slice(0, 4)
  },
  {
    id: "lowest-suspect",
    title: "가격 주목 상품",
    description: "가격 하락 신호와 높은 할인율을 함께 본 상품",
    icon: BadgePercent,
    getDeals: (deals: Deal[]) =>
      [...deals]
        .filter((deal) => deal.discountRate >= 50 || deal.tags.some((tag) => /역대가|가격\s*하락|쿠폰/.test(tag)))
        .sort((a, b) => b.discountRate - a.discountRate || sectionScore(b) - sectionScore(a))
        .slice(0, 4)
  },
  {
    id: "ending",
    title: "마감 임박",
    description: "놓치기 전에 확인해야 하는 특가",
    icon: Timer,
    getDeals: (deals: Deal[]) =>
      [...deals]
        .filter((deal) => deal.isEndingSoon)
        .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime() || sectionScore(b) - sectionScore(a))
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
        .sort((a, b) => sectionScore(b) - sectionScore(a))
        .slice(0, 4)
  }
] as const;

export function FeaturedDealSections({ deals, favorites, onToggleFavorite, onOpenDeal, onShareDeal, referenceNow }: FeaturedDealSectionsProps) {
  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const Icon = section.icon;
        const items = section.getDeals(deals);

        if (!items.length) return null;

        return (
          <section key={section.id} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-dossa-red">
                    <Icon size={18} />
                  </span>
                  <h3 className="text-xl font-black text-slate-950">{section.title}</h3>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">{section.description}</p>
              </div>
              <Link href="/?verifiedOnly=true&sort=hot" className="shrink-0 text-sm font-black text-dossa-red">
                전체보기
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {items.map((deal) => (
                <DealCard
                  key={`${section.id}-${deal.id}`}
                  deal={deal}
                  isFavorite={favorites.includes(deal.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpenDeal={onOpenDeal}
                  onShareDeal={onShareDeal}
                  referenceNow={referenceNow}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

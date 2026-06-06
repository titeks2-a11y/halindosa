import type { ReactNode } from "react";
import { QuickDealCard } from "@/components/QuickDealCard";
import { StatePanel } from "@/components/ui/StatePanel";
import type { Deal } from "@/types/deal";

interface HomeDealGridProps {
  items: Deal[];
  visibleCount: number;
  loadStep: number;
  favoriteIds: string[];
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
  onLoadMore: (nextVisibleCount: number) => void;
  onToggleFavorite: (id: string) => void;
  onOpenDeal: (deal: Deal) => void;
  onShareDeal: (deal: Deal) => void;
}

export function HomeDealGrid({
  items,
  visibleCount,
  loadStep,
  favoriteIds,
  emptyTitle,
  emptyDescription,
  emptyAction = null,
  onLoadMore,
  onToggleFavorite,
  onOpenDeal,
  onShareDeal
}: HomeDealGridProps) {
  if (!items.length) {
    return (
      <StatePanel
        tone="noDeal"
        title={emptyTitle}
        description={`${emptyDescription} 가격과 재고는 판매처에서 변동될 수 있으므로 구매 전 최종 조건을 다시 확인하세요.`}
        action={emptyAction ? <div className="flex justify-center">{emptyAction}</div> : null}
      />
    );
  }

  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = Math.max(items.length - visibleItems.length, 0);

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-2 sm:gap-3 md:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {visibleItems.map((deal) => (
          <QuickDealCard
            key={deal.id}
            deal={deal}
            isFavorite={favoriteIds.includes(deal.id)}
            onToggleFavorite={onToggleFavorite}
            onOpenDeal={onOpenDeal}
            onShareDeal={onShareDeal}
          />
        ))}
      </div>
      {remainingCount ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-3 text-center shadow-sm" aria-label="상품 목록 더보기">
          <p className="text-xs font-bold text-slate-500">
            {items.length.toLocaleString("ko-KR")}개 중 {visibleItems.length.toLocaleString("ko-KR")}개를 먼저 보여드립니다.
          </p>
          <button
            type="button"
            onClick={() => onLoadMore(Math.min(visibleCount + loadStep, items.length))}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-dossa-red"
            aria-label={`상품 ${Math.min(loadStep, remainingCount)}개 더 보기`}
          >
            특가 더보기 {Math.min(loadStep, remainingCount).toLocaleString("ko-KR")}개
          </button>
        </div>
      ) : null}
    </div>
  );
}

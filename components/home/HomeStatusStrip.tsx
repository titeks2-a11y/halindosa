import { getRelativeTime } from "@/lib/format";
import { getProviderDisplayLabel } from "@/lib/homeDealFilters";

interface HomeStatusStripProps {
  dealCount: number;
  verifiedDealCount: number;
  newDealCount: number;
  hotDealCount: number;
  isOffline: boolean;
  providerSource: string;
  latestPriceCheckedAt?: string;
}

export function HomeStatusStrip({
  dealCount,
  verifiedDealCount,
  newDealCount,
  hotDealCount,
  isOffline,
  providerSource,
  latestPriceCheckedAt
}: HomeStatusStripProps) {
  const statusCards = [
    { label: "오늘의 특가", value: `${dealCount}개`, tone: "text-brand-navy bg-brand-navySoft" },
    { label: "실시간 검증", value: `${verifiedDealCount}개`, tone: "text-emerald-700 bg-emerald-50" },
    { label: "오늘 업데이트", value: `${newDealCount}개`, tone: "text-orange-700 bg-orange-50" },
    { label: "인기 반응", value: `${hotDealCount}개`, tone: "hidden sm:flex text-dossa-red bg-red-50" },
    { label: "상태", value: isOffline ? "오프라인" : "네트워크 정상", tone: "hidden sm:flex text-slate-700 bg-white" }
  ];

  return (
    <>
      <div className="rounded-2xl border border-brand-line bg-brand-surface px-2 py-2 shadow-lift sm:rounded-[22px] sm:px-3 sm:py-3" aria-label="오늘 특가 운영 상태">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
          {statusCards.map((item) => (
            <span key={item.label} className={`flex min-w-0 flex-col rounded-2xl px-2.5 py-2 ${item.tone}`}>
              <span className="truncate text-[10px] font-black opacity-70">{item.label}</span>
              <span className="mt-0.5 truncate text-[12px] font-black sm:text-sm">{item.value}</span>
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[11px] font-bold text-slate-500 sm:hidden">
          <span>{getProviderDisplayLabel(providerSource)}</span>
          <span>{isOffline ? "오프라인" : "네트워크 정상"}</span>
        </div>
        <p className="mt-1.5 px-1 text-[11px] font-bold text-slate-500">
          가격/재고 변동 가능 · 구매 전 판매처에서 최종 조건 확인
        </p>
      </div>

      <div className="hidden rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm sm:block">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-black text-slate-950">
            {isOffline ? "오프라인 상태입니다." : "네트워크 정상 · 최신 특가 확인 가능"}
          </p>
          <p className="text-xs font-bold text-slate-500">
            최근 가격 기준 {latestPriceCheckedAt ? getRelativeTime(latestPriceCheckedAt) : "대기 중"}
          </p>
        </div>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {isOffline
            ? "연결이 복구되면 새로고침으로 최신 특가를 다시 불러올 수 있습니다."
            : "판매처의 최종 가격, 옵션가, 쿠폰 조건은 구매 전 다시 확인하세요."}
        </p>
      </div>
    </>
  );
}

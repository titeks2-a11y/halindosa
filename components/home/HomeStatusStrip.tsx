import { getRelativeTime } from "@/lib/format";
import { getProviderDisplayLabel } from "@/lib/homeDealFilters";

interface HomeStatusStripProps {
  dealCount: number;
  verifiedDealCount: number;
  publishableDealCount?: number;
  officialBenefitCount?: number;
  averageQualityScore?: number;
  newDealCount: number;
  hotDealCount: number;
  isOffline: boolean;
  providerSource: string;
  latestPriceCheckedAt?: string;
  updatedAt?: string;
  freshnessLabel?: string;
  staleChannelCount?: number;
  oldestChannel?: string;
  isRefreshing?: boolean;
  refreshIntervalSeconds?: number;
  referenceNow?: number;
  onRefresh?: () => void;
}

export function HomeStatusStrip({
  dealCount,
  verifiedDealCount,
  publishableDealCount,
  officialBenefitCount = 0,
  averageQualityScore = 0,
  newDealCount,
  hotDealCount,
  isOffline,
  providerSource,
  latestPriceCheckedAt,
  updatedAt,
  freshnessLabel: freshnessLabelOverride,
  staleChannelCount = 0,
  oldestChannel,
  isRefreshing = false,
  refreshIntervalSeconds = 45,
  referenceNow,
  onRefresh
}: HomeStatusStripProps) {
  const channelLabel =
    oldestChannel === "deals"
      ? "특가"
      : oldestChannel === "newsDeals"
        ? "공식 혜택"
        : oldestChannel === "hotSignals"
          ? "인기 신호"
          : "";
  const freshnessLabel = updatedAt ? getRelativeTime(updatedAt, referenceNow) : "확인 대기";
  const realtimeLabel = freshnessLabelOverride ?? (updatedAt ? (freshnessLabel === "방금 전" ? "방금 업데이트" : `${freshnessLabel} 확인`) : "최신 확인 대기");
  const autoRefreshLabel = `${refreshIntervalSeconds}초 자동 확인`;
  const staleHint = staleChannelCount > 0 && channelLabel ? ` · ${channelLabel} 재확인 중` : "";
  const visiblePublishableCount = publishableDealCount ?? verifiedDealCount;
  const qualityLabel = averageQualityScore >= 85 ? " · 품질 양호" : averageQualityScore >= 70 ? " · 품질 확인" : "";
  const officialBenefitLabel = officialBenefitCount > 0 ? ` · 공식혜택 ${officialBenefitCount}개` : "";
  const statusCards = [
    { label: "오늘의 특가", value: `${dealCount}개`, tone: "text-brand-navy bg-brand-navySoft" },
    { label: "실시간 검증", value: `${visiblePublishableCount}개`, tone: "text-emerald-700 bg-emerald-50" },
    { label: "오늘 업데이트", value: `${newDealCount}개`, tone: "text-orange-700 bg-orange-50" },
    { label: "인기 반응", value: `${hotDealCount}개`, tone: "hidden sm:flex text-dossa-red bg-red-50" },
    { label: "상태", value: isOffline ? "오프라인" : "네트워크 정상", tone: "hidden sm:flex text-slate-700 bg-white" }
  ];

  return (
    <>
      <div className="rounded-2xl border border-brand-line bg-brand-surface px-2 py-1.5 shadow-lift sm:rounded-[22px] sm:px-3 sm:py-3" aria-label="오늘 특가 운영 상태">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
          {statusCards.map((item) => (
            <span key={item.label} className={`flex min-w-0 flex-col rounded-2xl px-2 py-1.5 sm:px-2.5 sm:py-2 ${item.tone}`}>
              <span className="truncate text-[10px] font-black opacity-70">{item.label}</span>
              <span className="mt-0.5 truncate text-[12px] font-black sm:text-sm">{item.value}</span>
            </span>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 px-1 text-[11px] font-bold text-slate-500 sm:hidden">
          <span className="min-w-0 truncate">{isOffline ? "오프라인" : `${realtimeLabel}${staleHint} · 노출가능 ${visiblePublishableCount}개 · ${autoRefreshLabel}`}</span>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-full bg-dossa-red px-3 text-[11px] font-black text-white disabled:cursor-wait disabled:opacity-65"
              aria-label="최신 특가 다시 확인"
            >
              {isRefreshing ? "확인 중" : "새로고침"}
            </button>
          ) : null}
        </div>
        <div className="mt-1.5 hidden items-center justify-between gap-2 px-1 sm:flex">
          <p className="min-w-0 truncate text-[11px] font-bold text-slate-500">
            실시간 검증됨 · 노출가능 {visiblePublishableCount}개{officialBenefitLabel}{qualityLabel} · {getProviderDisplayLabel(providerSource)} · {realtimeLabel}
            {staleHint} · {autoRefreshLabel} · 가격/재고는 구매 전 최종 확인
          </p>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-full bg-dossa-red px-3 text-[11px] font-black text-white disabled:cursor-wait disabled:opacity-65"
              aria-label="최신 특가 다시 확인"
            >
              {isRefreshing ? "확인 중" : "새로고침"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="hidden rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm sm:block">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-black text-slate-950">
            {isOffline ? "오프라인 상태입니다." : "네트워크 정상 · 최신 특가 확인 가능"}
          </p>
          <p className="text-xs font-bold text-slate-500">
            최근 가격 기준 {latestPriceCheckedAt ? getRelativeTime(latestPriceCheckedAt, referenceNow) : "대기 중"} · 공식혜택 {officialBenefitCount}개{qualityLabel} · {realtimeLabel}
            {staleHint} · {autoRefreshLabel}
          </p>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold leading-5 text-slate-500">
            {isOffline
              ? "연결이 복구되면 새로고침으로 최신 특가를 다시 불러올 수 있습니다."
              : "판매처의 최종 가격, 옵션가, 쿠폰 조건은 구매 전 다시 확인하세요."}
          </p>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-2xl bg-dossa-red px-3 text-xs font-black text-white transition hover:bg-slate-950 disabled:cursor-wait disabled:opacity-65"
            >
              {isRefreshing ? "다시 확인 중" : "최신 데이터 확인"}
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

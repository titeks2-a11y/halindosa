"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, ExternalLink, Gift, Search, Share2, Sparkles, Timer, Truck } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { formatPrice } from "@/lib/format";
import { buildDealRedirectUrl } from "@/lib/redirectUrl";
import { buildPublicDealShareUrl } from "@/lib/shareUrl";
import { Deal, DealBenefitType } from "@/types/deal";

interface FreeBenefitsClientProps {
  deals: Deal[];
}

const tabs: Array<{ id: "all" | DealBenefitType; label: string }> = [
  { id: "all", label: "전체" },
  { id: "freebie", label: "무료 샘플" },
  { id: "experience", label: "체험단" },
  { id: "coupon", label: "쿠폰" },
  { id: "freeShipping", label: "무료배송" },
  { id: "point", label: "포인트" },
  { id: "convenienceStore", label: "편의점" },
  { id: "mart", label: "마트" },
  { id: "foodDelivery", label: "배달/외식" }
];

type BenefitSort = "recommended" | "endingSoon" | "popular" | "savings";

function readFavorites() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem("halindosa:favorites") ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  window.localStorage.setItem("halindosa:favorites", JSON.stringify(ids));
}

function getMinimumOrderLabel(deal: Deal) {
  if (!deal.minimumOrderAmount) return "최소 주문 없음";
  return `${formatPrice(deal.minimumOrderAmount)} 이상`;
}

export function FreeBenefitsClient({ deals }: FreeBenefitsClientProps) {
  const [referenceNow] = useState(() => Date.now());
  const [activeType, setActiveType] = useState<"all" | DealBenefitType>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<BenefitSort>("recommended");
  const [endingSoonOnly, setEndingSoonOnly] = useState(false);
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [noSignupOnly, setNoSignupOnly] = useState(false);
  const [firstComeOnly, setFirstComeOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites());
  const [message, setMessage] = useState("");

  const filteredDeals = useMemo(() => {
    const searchQuery = query.trim().toLowerCase();
    let source = activeType === "all" ? deals : deals.filter((deal) => deal.dealType === activeType);

    if (searchQuery) {
      source = source.filter((deal) =>
        [
          deal.title,
          deal.mallName,
          deal.category,
          deal.subCategory ?? "",
          deal.benefitSummary,
          deal.couponCondition ?? "",
          ...deal.tags
        ].some((value) => value.toLowerCase().includes(searchQuery))
      );
    }

    if (endingSoonOnly) source = source.filter((deal) => deal.isEndingSoon || new Date(deal.expireAt).getTime() - referenceNow < 12 * 60 * 60 * 1000);
    if (freeShippingOnly) source = source.filter((deal) => deal.isFreeShipping || deal.shippingFee === "무료배송");
    if (noSignupOnly) source = source.filter((deal) => !deal.requiresSignup);
    if (firstComeOnly) source = source.filter((deal) => deal.isFirstComeFirstServed);

    return [...source].sort((a, b) => {
      const activeScore = Number(a.isExpired) - Number(b.isExpired);
      if (activeScore !== 0) return activeScore;
      if (sort === "endingSoon") return new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime();
      if (sort === "popular") return b.clickCount - a.clickCount || b.likeCount - a.likeCount;
      if (sort === "savings") return b.savingsAmount - a.savingsAmount || b.savingsRate - a.savingsRate;
      return b.reliabilityScore - a.reliabilityScore || b.clickCount - a.clickCount || new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime();
    });
  }, [activeType, deals, endingSoonOnly, firstComeOnly, freeShippingOnly, noSignupOnly, query, referenceNow, sort]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        tabs.map((tab) => [
          tab.id,
          tab.id === "all" ? deals.length : deals.filter((deal) => deal.dealType === tab.id).length
        ])
      ),
    [deals]
  );

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
      writeFavorites(next);
      setMessage(current.includes(id) ? "찜을 해제했습니다." : "혜택을 찜했습니다.");
      window.setTimeout(() => setMessage(""), 2500);
      return next;
    });
  };

  const openDeal = (deal: Deal) => {
    window.open(buildDealRedirectUrl(deal.id, "free-benefits"), "_blank", "noopener,noreferrer");
  };

  const shareDeal = async (deal: Deal) => {
    const url = buildPublicDealShareUrl(deal.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: deal.title, text: deal.benefitSummary, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("공유 링크를 복사했습니다.");
        window.setTimeout(() => setMessage(""), 2500);
      }
    } catch {
      setMessage("공유를 완료하지 못했습니다.");
      window.setTimeout(() => setMessage(""), 2500);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setActiveType("all");
    setSort("recommended");
    setEndingSoonOnly(false);
    setFreeShippingOnly(false);
    setNoSignupOnly(false);
    setFirstComeOnly(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 pb-24 pt-4 sm:px-5 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-7xl space-y-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-dossa-red">
          <ArrowLeft size={17} />
          홈으로 돌아가기
        </Link>

        <section className="overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-5 sm:p-7">
              <p className="text-xs font-black text-dossa-red">무료 혜택 전용 탭</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                오늘 받을 수 있는 무료·쿠폰 혜택
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-500">
                무료 샘플, 체험단, 무료배송, 편의점 행사, 포인트 적립을 한곳에 모았습니다. 비회원도 전부 볼 수 있고, 찜과 알림 저장만 로그인으로 이어집니다.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black sm:max-w-lg">
                <span className="rounded-2xl bg-red-50 px-3 py-3 text-dossa-red">전체 {deals.length}개</span>
                <span className="rounded-2xl bg-slate-50 px-3 py-3 text-slate-700">링크 확인 {deals.filter((deal) => deal.isVerified).length}개</span>
                <span className="rounded-2xl bg-slate-50 px-3 py-3 text-slate-700">마감임박 {deals.filter((deal) => deal.isEndingSoon).length}개</span>
              </div>
            </div>
            <div className="flex min-h-64 items-center justify-center bg-dossa-red p-8 text-white">
              <div className="text-center">
                <Gift className="mx-auto" size={58} />
                <p className="mt-4 text-2xl font-black">무료·쿠폰·포인트</p>
                <p className="mt-2 text-sm font-bold text-red-50">구매 전 최종 조건은 판매처에서 확인하세요.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveType(tab.id)}
                aria-pressed={activeType === tab.id}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black transition ${
                  activeType === tab.id ? "bg-dossa-red text-white" : "bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-dossa-red"
                }`}
              >
                {tab.label}
                <span className={activeType === tab.id ? "text-red-100" : "text-slate-400"}>{counts[tab.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm" aria-label="무료 혜택 검색과 조건 필터">
          <div className="grid gap-3 lg:grid-cols-[1fr_210px]">
            <label className="relative block">
              <span className="sr-only">무료 혜택 검색</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="무료 샘플, 쿠폰, 편의점, 포인트를 검색해보세요"
                className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-200 focus:bg-white focus:ring-4 focus:ring-red-50"
              />
            </label>
            <label>
              <span className="sr-only">무료 혜택 정렬</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as BenefitSort)}
                aria-label="무료 혜택 정렬"
                className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none focus:border-red-200 focus:ring-4 focus:ring-red-50"
              >
                <option value="recommended">추천순</option>
                <option value="endingSoon">마감임박순</option>
                <option value="popular">클릭 많은 순</option>
                <option value="savings">절약금액순</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {[
              ["ending", "마감 임박만", endingSoonOnly, () => setEndingSoonOnly((value) => !value), Timer],
              ["shipping", "배송비 무료", freeShippingOnly, () => setFreeShippingOnly((value) => !value), Truck],
              ["signup", "가입 없이 받기", noSignupOnly, () => setNoSignupOnly((value) => !value), Gift],
              ["first", "선착순 혜택", firstComeOnly, () => setFirstComeOnly((value) => !value), Sparkles]
            ].map(([id, label, active, onClick, Icon]) => {
              const FilterIcon = Icon as typeof Gift;
              return (
                <button
                  key={String(id)}
                  type="button"
                  onClick={onClick as () => void}
                  aria-pressed={Boolean(active)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition ${
                    active ? "border-red-200 bg-red-50 text-dossa-red" : "border-slate-200 bg-white text-slate-600 hover:border-red-100 hover:text-dossa-red"
                  }`}
                >
                  <FilterIcon size={16} />
                  {String(label)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-11 shrink-0 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-500 transition hover:border-red-100 hover:text-dossa-red"
            >
              초기화
            </button>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-500">
            현재 결과 {filteredDeals.length}개 · 조건은 판매처에서 최종 확인해야 하며 종료/품절 가능성이 있습니다.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            ["선착순 여부", "마감 시간이 가까운 혜택을 위로 정렬합니다."],
            ["회원가입 필요 여부", "각 판매처 조건은 이동 후 최종 확인하세요."],
            ["신고 가능", "품절, 종료, 링크 오류는 카드에서 바로 신고할 수 있습니다."]
          ].map(([title, copy]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <Sparkles size={20} className="text-dossa-red" />
              <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{copy}</p>
            </div>
          ))}
        </section>

        {filteredDeals.length ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className={deal.isExpired ? "opacity-55 grayscale-[0.25]" : ""}>
                <div className="mb-2 rounded-3xl border border-red-100 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-dossa-red">혜택 조건 요약</p>
                      <p className="mt-1 line-clamp-2 text-sm font-black text-slate-950">{deal.benefitSummary}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">{deal.claimCta}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-600">
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">선착순: {deal.isFirstComeFirstServed ? "가능성 있음" : "표시 없음"}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">회원가입: {deal.requiresSignup ? "필요 가능" : "불필요"}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">배송비: {deal.shippingFee}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">중복: {deal.isStackable ? "가능성 있음" : "확인 필요"}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">최소금액: {getMinimumOrderLabel(deal)}</span>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2">만료: {deal.isEndingSoon ? "마감 임박" : "진행 중"}</span>
                    {deal.couponCondition ? <span className="col-span-2 rounded-2xl bg-red-50 px-3 py-2 text-dossa-red">조건: {deal.couponCondition}</span> : null}
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => openDeal(deal)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dossa-red px-3 text-sm font-black text-white transition hover:bg-dossa-deep"
                      aria-label={`${deal.title} ${deal.claimCta}`}
                    >
                      {deal.claimCta}
                      <ExternalLink size={15} />
                    </button>
                    <Link
                      href={`/reports?dealId=${deal.id}&reason=expired`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-red-100 hover:text-dossa-red"
                      aria-label={`${deal.title} 종료 신고`}
                    >
                      종료
                    </Link>
                    <Link
                      href={`/reports?dealId=${deal.id}&reason=link_error`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-red-100 hover:text-dossa-red"
                      aria-label={`${deal.title} 링크 오류 신고`}
                    >
                      <AlertTriangle size={15} />
                    </Link>
                  </div>
                </div>
                <DealCard
                  deal={deal}
                  isFavorite={favorites.includes(deal.id)}
                  onToggleFavorite={toggleFavorite}
                  onOpenDeal={openDeal}
                  onShareDeal={shareDeal}
                />
              </div>
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Gift className="mx-auto text-dossa-red" size={42} />
            <h2 className="mt-4 text-xl font-black text-slate-950">{activeType === "all" ? "표시할 혜택이 없습니다." : `${getBenefitTypeLabel(activeType)} 혜택이 없습니다.`}</h2>
            <p className="mt-2 text-sm font-bold text-slate-500">다른 혜택 유형을 선택하거나 홈에서 전체 특가를 확인해보세요.</p>
          </section>
        )}

        {message ? (
          <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl">
            <Share2 className="mr-2 inline" size={16} />
            {message}
          </div>
        ) : null}
      </div>
    </main>
  );
}

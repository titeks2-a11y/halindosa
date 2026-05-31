"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift, Share2, Sparkles } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
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

export function FreeBenefitsClient({ deals }: FreeBenefitsClientProps) {
  const [activeType, setActiveType] = useState<"all" | DealBenefitType>("all");
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites());
  const [message, setMessage] = useState("");

  const filteredDeals = useMemo(() => {
    const source = activeType === "all" ? deals : deals.filter((deal) => deal.dealType === activeType);
    return [...source].sort(
      (a, b) =>
        Number(a.isExpired) - Number(b.isExpired) ||
        b.reliabilityScore - a.reliabilityScore ||
        b.clickCount - a.clickCount ||
        new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime()
    );
  }, [activeType, deals]);

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
              <DealCard
                key={deal.id}
                deal={deal}
                isFavorite={favorites.includes(deal.id)}
                onToggleFavorite={toggleFavorite}
                onOpenDeal={openDeal}
                onShareDeal={shareDeal}
              />
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

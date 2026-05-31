import Link from "next/link";
import { CheckCircle2, Gift, Grid3X3, PackageCheck, Sparkles, Tag, TicketPercent, Truck } from "lucide-react";
import { dealChannels, dealMatchesChannel } from "@/data/dealChannels";
import { getDeals } from "@/lib/dealService";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { getLinkQualityScore, isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { formatPrice } from "@/lib/format";
import type { DealBenefitType } from "@/types/deal";

const benefitQuickLinks: Array<{
  type: DealBenefitType;
  title: string;
  description: string;
  href: string;
  icon: typeof Gift;
}> = [
  {
    type: "freebie",
    title: "무료 샘플·0원 혜택",
    description: "비용 부담 없이 먼저 받을 혜택",
    href: "/?dealType=freebie&q=무료&sort=hot",
    icon: Gift
  },
  {
    type: "coupon",
    title: "쿠폰·첫 구매 혜택",
    description: "결제 전 챙길 쇼핑몰·브랜드 쿠폰",
    href: "/?dealType=coupon&q=쿠폰&sort=hot",
    icon: TicketPercent
  },
  {
    type: "point",
    title: "앱테크·포인트 적립",
    description: "출석체크, 페이, 친구 초대 포인트",
    href: "/?dealType=point&q=포인트&sort=latest",
    icon: Sparkles
  },
  {
    type: "freeShipping",
    title: "무료배송·무배",
    description: "배송비를 줄이는 생활비 혜택",
    href: "/?dealType=freeShipping&freeShippingOnly=true&sort=latest",
    icon: Truck
  },
  {
    type: "convenienceStore",
    title: "편의점 1+1 / 2+1",
    description: "커피, 음료, 도시락 행사",
    href: "/?dealType=convenienceStore&category=mart&q=편의점",
    icon: TicketPercent
  },
  {
    type: "foodDelivery",
    title: "배달·외식 쿠폰",
    description: "첫 주문, 커피, 외식 쿠폰",
    href: "/?dealType=foodDelivery&q=배달",
    icon: Gift
  }
];

export default async function CategoriesPage() {
  const { deals } = await getDeals();
  const activeDeals = deals.filter((deal) => !deal.isExpired && !deal.isSoldOut);
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
  const featuredCategories = categories
    .filter((category) => category.id !== "all" && category.count > 0)
    .sort((a, b) => b.verifiedCount - a.verifiedCount || b.count - a.count || b.bestDiscount - a.bestDiscount)
    .slice(0, 4);
  const categoryGroups = ["추천", "카테고리", "쇼핑몰"].map((group) => ({
    group,
    items: categories.filter((category) => category.group === group)
  }));
  const benefitHighlights = benefitQuickLinks.map((item) => {
    const items = deals.filter((deal) => deal.dealType === item.type || (item.type === "freeShipping" && deal.isFreeShipping));
    const bestDeal = [...items].sort(
      (a, b) =>
        getLinkQualityScore(b) - getLinkQualityScore(a) ||
        b.likeCount - a.likeCount ||
        b.clickCount - a.clickCount ||
        b.savingsAmount - a.savingsAmount
    )[0];

    return {
      ...item,
      count: items.length,
      verifiedCount: items.filter(isVerifiedPurchaseLink).length,
      bestDeal
    };
  });
  const purposeJourneys = [
    {
      title: "무료 먼저 받기",
      description: "무료 샘플, 체험단, 초대권을 먼저 확인",
      href: "/free-benefits?dealType=freebie&sort=recommended",
      metric: `${activeDeals.filter((deal) => ["freebie", "experience"].includes(deal.dealType)).length}개 진행 중`,
      icon: Gift
    },
    {
      title: "결제 전 쿠폰 찾기",
      description: "첫 구매, 카드, 브랜드 쿠폰 조건 확인",
      href: "/free-benefits?dealType=coupon&sort=popular",
      metric: `${activeDeals.filter((deal) => ["coupon", "foodDelivery"].includes(deal.dealType)).length}개 쿠폰`,
      icon: TicketPercent
    },
    {
      title: "장보기 전 행사 보기",
      description: "편의점 1+1, 마트 행사, 무료배송 확인",
      href: "/?category=mart&dealType=mart&sort=hot",
      metric: `${activeDeals.filter((deal) => ["convenienceStore", "mart", "freeShipping"].includes(deal.dealType) || deal.isFreeShipping).length}개 생활 혜택`,
      icon: Truck
    },
    {
      title: "마감 전 빠르게 확인",
      description: "오늘 끝날 수 있는 혜택과 특가 우선 확인",
      href: "/?endingSoonOnly=true&sort=endingSoon",
      metric: `${activeDeals.filter((deal) => deal.isEndingSoon).length}개 마감 임박`,
      icon: PackageCheck
    }
  ];
  const categoryBenefitMatrix = categories
    .filter((category) => category.id !== "all" && category.group === "카테고리" && category.count > 0)
    .map((category) => {
      const items = activeDeals.filter((deal) => dealMatchesChannel(deal, category.id));
      const freeCount = items.filter((deal) => ["freebie", "experience", "freeShipping"].includes(deal.dealType) || deal.isFreeShipping).length;
      const couponCount = items.filter((deal) => ["coupon", "point", "foodDelivery", "convenienceStore", "mart"].includes(deal.dealType)).length;
      const endingCount = items.filter((deal) => deal.isEndingSoon).length;
      const savingsTotal = items.reduce((total, deal) => total + Math.max(0, deal.savingsAmount), 0);

      return {
        ...category,
        freeCount,
        couponCount,
        endingCount,
        savingsTotal
      };
    })
    .sort((a, b) => b.freeCount + b.couponCount + b.endingCount - (a.freeCount + a.couponCount + a.endingCount) || b.savingsTotal - a.savingsTotal)
    .slice(0, 6);

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

      <section className="rounded-[24px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-slate-50 p-4 shadow-sm lg:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">추천 탐색</p>
            <h2 className="mt-1 text-base font-black text-slate-950">구매 링크 확인이 많은 영역부터 보기</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              검수된 판매처 링크와 저장할 만한 대표 특가가 있는 카테고리를 먼저 보여드립니다.
            </p>
          </div>
          <Link href="/?verifiedOnly=true" className="rounded-2xl bg-white px-4 py-3 text-center text-xs font-black text-dossa-red shadow-sm">
            구매 링크 확인 특가
          </Link>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          {featuredCategories.map((category) => (
            <Link key={category.id} href={`/?category=${category.id}&verifiedOnly=true`} className="rounded-2xl bg-white p-4 shadow-sm transition hover:bg-red-50">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                구매 링크 확인 {category.verifiedCount}
              </span>
              <p className="mt-3 text-sm font-black text-slate-950">{category.label}</p>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{category.bestDeal?.title ?? category.description}</p>
              <p className="mt-2 text-xs font-black text-dossa-red">최대 {category.bestDiscount}% · {category.count}개</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5" aria-label="생활 혜택 빠른 지도">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">생활 혜택 빠른 지도</p>
            <h2 className="mt-1 text-base font-black text-slate-950">무료, 쿠폰, 포인트를 유형별로 바로 보기</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              상품 카테고리보다 먼저 혜택 목적을 고르면 오늘 받을 무료 혜택과 결제 전 쿠폰을 빠르게 좁힐 수 있습니다.
            </p>
          </div>
          <Link href="/free-benefits" className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-xs font-black text-white shadow-sm">
            무료 혜택 전용 탭
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {benefitHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.type}
                href={item.href}
                className="rounded-[22px] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <Icon size={19} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                    {item.count}개
                  </span>
                </div>
                <p className="mt-3 text-sm font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-black">
                  <span className="rounded-full bg-white px-2 py-1 text-slate-600 shadow-sm">{getBenefitTypeLabel(item.type)}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">구매 링크 확인 {item.verifiedCount}</span>
                </div>
                {item.bestDeal ? (
                  <p className="mt-3 line-clamp-1 text-xs font-black text-slate-900">{item.bestDeal.title}</p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[24px] border border-red-100 bg-white p-4 shadow-sm lg:p-5" aria-label="오늘 목적별 탐색 루틴">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">오늘 목적별 탐색 루틴</p>
            <h2 className="mt-1 text-base font-black text-slate-950">무엇을 아끼고 싶은지부터 고르세요</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              상품 카테고리를 몰라도 무료, 쿠폰, 장보기, 마감 임박 목적별로 바로 시작할 수 있습니다.
            </p>
          </div>
          <Link href="/free-benefits" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white shadow-sm">
            무료·쿠폰 전체 보기
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {purposeJourneys.map((journey) => {
            const Icon = journey.icon;

            return (
              <Link
                key={journey.title}
                href={journey.href}
                className="min-h-[154px] rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <Icon size={20} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                    {journey.metric}
                  </span>
                </div>
                <p className="mt-4 text-sm font-black text-slate-950">{journey.title}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{journey.description}</p>
                <p className="mt-3 text-xs font-black text-dossa-red">바로 시작하기</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5" aria-label="카테고리별 오늘 혜택 요약">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">카테고리별 오늘 혜택 요약</p>
            <h2 className="mt-1 text-base font-black text-slate-950">무료·쿠폰·마감 신호가 많은 영역부터 보세요</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              카테고리마다 무료 혜택, 쿠폰/포인트, 마감 임박 신호를 비교해 오늘 먼저 볼 영역을 정리했습니다.
            </p>
          </div>
          <Link href="/?dealType=freebie&sort=hot" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-black text-dossa-red">
            무료·쿠폰 많은 영역 보기
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categoryBenefitMatrix.map((category) => (
            <Link
              key={category.id}
              href={`/?category=${category.id}&sort=hot`}
              className="rounded-[22px] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{category.label}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{category.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                  {category.count}개
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-black">
                <span className="rounded-2xl bg-white px-2 py-2 text-dossa-red shadow-sm">
                  무료·무배
                  <b className="mt-1 block text-sm">{category.freeCount}</b>
                </span>
                <span className="rounded-2xl bg-white px-2 py-2 text-slate-700 shadow-sm">
                  쿠폰·포인트
                  <b className="mt-1 block text-sm">{category.couponCount}</b>
                </span>
                <span className="rounded-2xl bg-white px-2 py-2 text-amber-700 shadow-sm">
                  마감
                  <b className="mt-1 block text-sm">{category.endingCount}</b>
                </span>
              </div>
              <p className="mt-3 text-xs font-black text-dossa-red">예상 절약 후보 {formatPrice(category.savingsTotal)}</p>
            </Link>
          ))}
        </div>
      </section>

      {categoryGroups.map((group) => (
        <section key={group.group} className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black text-dossa-red">카테고리 묶음</p>
              <h2 className="text-lg font-black text-slate-950">{group.group}</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">{group.items.length}개 채널</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {group.items.map((category) => (
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
          </div>
        </section>
      ))}
    </div>
  );
}

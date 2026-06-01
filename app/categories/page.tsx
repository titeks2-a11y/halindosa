import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gift, Grid3X3, PackageCheck, Sparkles, Tag, TicketPercent, Truck } from "lucide-react";
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

const benefitComparisonConfig: Array<{
  type: DealBenefitType;
  title: string;
  shortLabel: string;
  href: string;
}> = [
  {
    type: "freebie",
    title: "무료 샘플·체험",
    shortLabel: "무료",
    href: "/free-benefits?dealType=freebie&sort=recommended"
  },
  {
    type: "coupon",
    title: "쿠폰·첫 구매",
    shortLabel: "쿠폰",
    href: "/free-benefits?dealType=coupon&sort=savings"
  },
  {
    type: "point",
    title: "앱테크·포인트",
    shortLabel: "포인트",
    href: "/free-benefits?dealType=point&sort=popular"
  },
  {
    type: "freeShipping",
    title: "무료배송·무배",
    shortLabel: "무배",
    href: "/?dealType=freeShipping&freeShippingOnly=true&sort=hot"
  },
  {
    type: "convenienceStore",
    title: "편의점 1+1",
    shortLabel: "편의점",
    href: "/?dealType=convenienceStore&category=mart&sort=latest"
  },
  {
    type: "foodDelivery",
    title: "배달·외식 쿠폰",
    shortLabel: "외식",
    href: "/free-benefits?dealType=foodDelivery&sort=popular"
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
  const benefitComparisonRows = benefitComparisonConfig.map((item) => {
    const items = activeDeals.filter((deal) => deal.dealType === item.type || (item.type === "freeShipping" && deal.isFreeShipping));
    const bestDeal = [...items].sort(
      (a, b) =>
        getLinkQualityScore(b) - getLinkQualityScore(a) ||
        Number(b.isEndingSoon) - Number(a.isEndingSoon) ||
        b.savingsAmount - a.savingsAmount ||
        b.discountRate - a.discountRate
    )[0];

    return {
      ...item,
      count: items.length,
      verifiedCount: items.filter(isVerifiedPurchaseLink).length,
      endingCount: items.filter((deal) => deal.isEndingSoon).length,
      savingsTotal: items.reduce((total, deal) => total + Math.max(0, deal.savingsAmount), 0),
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
  const purposeRecommendationQueue = [
    {
      title: "지금 무료로 받을 것",
      copy: "샘플, 체험단, 0원 혜택처럼 지출 전에 먼저 확인할 목적입니다.",
      href: "/free-benefits?dealType=freebie&sort=recommended",
      items: activeDeals.filter((deal) => ["freebie", "experience"].includes(deal.dealType)),
      checklist: ["회원가입 필요", "배송비", "선착순"]
    },
    {
      title: "결제 전 적용할 것",
      copy: "쿠폰, 포인트, 배달/외식 혜택처럼 구매 직전에 확인할 목적입니다.",
      href: "/free-benefits?dealType=coupon&sort=savings",
      items: activeDeals.filter((deal) => ["coupon", "point", "foodDelivery"].includes(deal.dealType)),
      checklist: ["최소 주문", "중복 가능", "결제수단"]
    },
    {
      title: "생활비 줄일 것",
      copy: "편의점, 마트, 무료배송처럼 매일 체감되는 장보기 목적입니다.",
      href: "/?category=mart&sort=hot",
      items: activeDeals.filter((deal) => ["convenienceStore", "mart", "freeShipping"].includes(deal.dealType) || deal.isFreeShipping),
      checklist: ["행사 지점", "무료배송", "재고 변동"]
    },
    {
      title: "오늘 놓치면 아쉬운 것",
      copy: "마감 임박, 선착순, 인기 반응이 겹친 혜택을 먼저 확인합니다.",
      href: "/?endingSoon=true&sort=endingSoon",
      items: activeDeals.filter((deal) => deal.isEndingSoon || deal.isFirstComeFirstServed),
      checklist: ["마감 시간", "품절 가능", "가격 확인"]
    }
  ].map((item) => {
    const bestDeal = [...item.items].sort(
      (a, b) =>
        getLinkQualityScore(b) - getLinkQualityScore(a) ||
        Number(b.isEndingSoon) - Number(a.isEndingSoon) ||
        b.likeCount - a.likeCount ||
        b.savingsAmount - a.savingsAmount
    )[0];

    return {
      ...item,
      bestDeal,
      verifiedCount: item.items.filter(isVerifiedPurchaseLink).length,
      savingsTotal: item.items.reduce((total, deal) => total + Math.max(0, deal.savingsAmount), 0)
    };
  });
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
  const categoryRiskMap = categories
    .filter((category) => category.id !== "all" && category.group === "카테고리" && category.count > 0)
    .map((category) => {
      const items = activeDeals.filter((deal) => dealMatchesChannel(deal, category.id));
      const hiddenCostCount = items.filter((deal) => !deal.isFreeShipping && deal.shippingFee !== "무료배송" && deal.salePrice > 0).length;
      const signupCount = items.filter((deal) => deal.requiresSignup).length;
      const urgencyCount = items.filter((deal) => deal.isFirstComeFirstServed || deal.isEndingSoon).length;
      const reviewCount = items.filter((deal) => deal.reportCount > 0 || deal.linkStatus !== "verified" || deal.isSoldOut).length;
      const bestDeal = [...items].sort(
        (a, b) =>
          Number(b.isEndingSoon) - Number(a.isEndingSoon) ||
          b.reportCount - a.reportCount ||
          b.clickCount - a.clickCount ||
          b.savingsAmount - a.savingsAmount
      )[0];

      return {
        ...category,
        hiddenCostCount,
        signupCount,
        urgencyCount,
        reviewCount,
        totalRisk: hiddenCostCount + signupCount + urgencyCount + reviewCount,
        bestDeal
      };
    })
    .sort((a, b) => b.totalRisk - a.totalRisk || b.count - a.count)
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

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5" aria-label="혜택 유형별 비교표">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">혜택 유형별 비교표</p>
            <h2 className="mt-1 text-base font-black text-slate-950">무료·쿠폰·포인트를 비교해서 고르세요</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              활성 혜택, 구매 링크 확인, 마감 신호를 한 줄로 비교해 오늘 먼저 챙길 혜택을 빠르게 고를 수 있습니다.
            </p>
          </div>
          <Link href="/free-benefits?sort=recommended" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white shadow-sm">
            혜택 전체 비교
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-100">
          {benefitComparisonRows.map((row) => (
            <Link
              key={row.type}
              href={row.href}
              className="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 transition last:border-b-0 hover:bg-red-50 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_1.6fr]"
            >
              <div>
                <p className="text-sm font-black text-slate-950">{row.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{getBenefitTypeLabel(row.type)}</p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                활성 혜택
                <b className="mt-1 block text-base text-dossa-red">{row.count}</b>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                구매 링크 확인
                <b className="mt-1 block text-base text-emerald-700">{row.verifiedCount}</b>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                마감 신호
                <b className="mt-1 block text-base text-amber-700">{row.endingCount}</b>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                대표 혜택
                <p className="mt-1 line-clamp-1 text-sm font-black text-slate-950">
                  {row.bestDeal ? row.bestDeal.title : `${row.shortLabel} 혜택 준비 중`}
                </p>
                <p className="mt-1 text-[11px] font-black text-dossa-red">예상 절약 {formatPrice(row.savingsTotal)}</p>
              </div>
            </Link>
          ))}
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

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5" aria-label="혜택 목적별 추천 큐">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">혜택 목적별 추천 큐</p>
            <h2 className="mt-1 text-base font-black text-slate-950">오늘 아낄 목적에 맞춰 대표 혜택부터 봅니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              무료 수령, 결제 전 쿠폰, 생활비 절약, 마감 전 확인을 대표 혜택과 조건 체크리스트로 묶었습니다.
            </p>
          </div>
          <Link href="/free-benefits" className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-xs font-black text-white shadow-sm">
            목적별 혜택 시작
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {purposeRecommendationQueue.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="min-h-[220px] rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.items.length}개 혜택</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">링크 확인 {item.verifiedCount}</span>
              </span>
              <p className="mt-4 text-sm font-black text-slate-950">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{item.copy}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.checklist.map((label) => (
                  <span key={label} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-[11px] font-black text-dossa-red">대표 혜택</p>
                <p className="mt-1 line-clamp-2 min-h-9 text-sm font-black leading-snug text-slate-950">
                  {item.bestDeal ? item.bestDeal.title : "조건에 맞는 혜택 준비 중"}
                </p>
                <p className="mt-2 text-[11px] font-black text-slate-500">예상 절약 {formatPrice(item.savingsTotal)}</p>
              </div>
            </Link>
          ))}
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

      <section className="rounded-[24px] border border-amber-100 bg-white p-4 shadow-sm lg:p-5" aria-label="카테고리 조건 점검 지도">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">카테고리 조건 점검 지도</p>
            <h2 className="mt-1 text-base font-black text-slate-950">숨은 비용·가입·마감 신호를 카테고리별로 봅니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              무료·쿠폰 혜택도 카테고리마다 조건이 다릅니다. 이동 전에 배송비, 가입 조건, 선착순, 신고 상태를 먼저 확인하세요.
            </p>
          </div>
          <Link href="/free-benefits?activeOnly=true" className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-xs font-black text-amber-800">
            진행 중 혜택 점검
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categoryRiskMap.map((category) => (
            <Link
              key={category.id}
              href={`/?category=${category.id}&sort=hot`}
              className="rounded-[22px] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{category.label}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{category.description}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-amber-700 shadow-sm">
                  <AlertTriangle size={12} />
                  점검 {category.totalRisk}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-black">
                <span className="rounded-2xl bg-white px-2.5 py-2 text-slate-700 shadow-sm">
                  숨은 비용
                  <b className="mt-1 block text-sm text-amber-700">{category.hiddenCostCount}</b>
                </span>
                <span className="rounded-2xl bg-white px-2.5 py-2 text-slate-700 shadow-sm">
                  가입 조건
                  <b className="mt-1 block text-sm text-dossa-red">{category.signupCount}</b>
                </span>
                <span className="rounded-2xl bg-white px-2.5 py-2 text-slate-700 shadow-sm">
                  선착순·마감
                  <b className="mt-1 block text-sm text-orange-700">{category.urgencyCount}</b>
                </span>
                <span className="rounded-2xl bg-white px-2.5 py-2 text-slate-700 shadow-sm">
                  신고/확인
                  <b className="mt-1 block text-sm text-slate-900">{category.reviewCount}</b>
                </span>
              </div>
              <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-[11px] font-black text-dossa-red">먼저 확인할 대표 혜택</p>
                <p className="mt-1 line-clamp-2 min-h-9 text-sm font-black leading-snug text-slate-950">
                  {category.bestDeal ? category.bestDeal.title : "조건 점검할 혜택 준비 중"}
                </p>
              </div>
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

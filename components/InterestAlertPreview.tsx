"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BellPlus, Clock3, Gift, SlidersHorizontal, Sparkles, TicketPercent } from "lucide-react";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { buildPersonalizedBenefitQueue } from "@/lib/deals/personalizedBenefitQueue";
import { formatPrice, getTimeLeft } from "@/lib/format";
import { readLocalPreferences } from "@/lib/memberSync";
import { Deal } from "@/types/deal";

interface InterestAlertPreviewProps {
  deals: Deal[];
}

const fallbackInterests = ["무료/체험", "쿠폰/이벤트", "식품"];
const categoryOptions = ["식품", "생활용품", "디지털", "패션", "육아", "여행", "뷰티", "쿠폰/이벤트", "무료/체험"];

function dealMatchesInterest(deal: Deal, interest: string) {
  const searchable = [deal.title, deal.description, deal.category, deal.subCategory, deal.dealType, deal.mallName, ...deal.tags].join(" ");

  if (interest === "디지털") return /디지털|전자기기|가전|노트북|TV|스마트|충전|이어폰/.test(searchable);
  if (interest === "패션") return /패션|의류|잡화|신발|무신사|가방|스니커즈/.test(searchable);
  if (interest === "여행") return /여행|티켓|항공|숙박|호텔|공연|전시|영화/.test(searchable);
  if (interest === "무료/체험") return ["freebie", "experience", "coupon", "point"].includes(deal.dealType) || /무료|체험|샘플|쿠폰|포인트|0원/.test(searchable);

  return searchable.includes(interest);
}

function rankPersonalDeal(deal: Deal) {
  return (
    deal.likeCount * 3 +
    deal.clickCount * 2 +
    deal.popularityScore +
    deal.discountRate +
    Number(deal.isEndingSoon) * 35 +
    Number(deal.isFreeShipping) * 18 +
    Number(deal.purchaseLinkVerified) * 12
  );
}

export function InterestAlertPreview({ deals }: InterestAlertPreviewProps) {
  const [interests, setInterests] = useState<string[]>(fallbackInterests);
  const [hasSavedInterests, setHasSavedInterests] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const saved = readLocalPreferences().favoriteCategories;
      setHasSavedInterests(saved.length > 0);
      setInterests(saved.length ? saved : fallbackInterests);
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  const personalizedQueue = useMemo(
    () =>
      buildPersonalizedBenefitQueue(deals, {
        interests,
        limit: 5
      }),
    [deals, interests]
  );
  const personalizedApiHref = `/api/benefits/personalized?limit=5${interests
    .slice(0, 5)
    .map((interest) => `&interest=${encodeURIComponent(interest)}`)
    .join("")}`;

  const matchedDeals = useMemo(() => {
    const queueDeals = personalizedQueue.items
      .map((item) => deals.find((deal) => deal.id === item.id))
      .filter((deal): deal is Deal => Boolean(deal));

    if (queueDeals.length) return queueDeals;

    return [...deals]
      .filter((deal) => interests.some((interest) => dealMatchesInterest(deal, interest)) && !deal.isExpired && !deal.isSoldOut)
      .sort(
        (a, b) =>
          rankPersonalDeal(b) - rankPersonalDeal(a) ||
          new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime()
      )
      .slice(0, 5);
  }, [deals, interests, personalizedQueue.items]);
  const interestAlertPlan = useMemo(() => {
    const matchedActiveDeals = [...deals].filter(
      (deal) => interests.some((interest) => dealMatchesInterest(deal, interest)) && !deal.isExpired && !deal.isSoldOut
    );

    return [
      {
        title: "무료·체험 먼저",
        description: "관심사와 맞는 무료 샘플, 체험단, 0원 혜택을 먼저 확인합니다.",
        count: matchedActiveDeals.filter((deal) => deal.dealType === "freebie" || deal.dealType === "experience").length,
        href: "/free-benefits?dealType=freebie&sort=recommended",
        icon: Gift
      },
      {
        title: "쿠폰·포인트 챙기기",
        description: "결제 전 적용 가능한 쿠폰, 포인트, 배달·외식 혜택을 모아봅니다.",
        count: matchedActiveDeals.filter((deal) => deal.dealType === "coupon" || deal.dealType === "point" || deal.dealType === "foodDelivery").length,
        href: "/free-benefits?dealType=coupon&sort=popular",
        icon: TicketPercent
      },
      {
        title: "마감 전 확인",
        description: "관심 카테고리에서 오늘 놓치기 쉬운 마감 임박 혜택을 먼저 엽니다.",
        count: matchedActiveDeals.filter((deal) => deal.isEndingSoon).length,
        href: "/?endingSoon=true&sort=endingSoon",
        icon: Clock3
      }
    ];
  }, [deals, interests]);

  return (
    <section className="rounded-[22px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-slate-50 p-4 shadow-sm lg:p-5" aria-label="관심 카테고리 알림 미리보기">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
            <BellPlus size={21} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-dossa-red">관심 카테고리 알림</p>
            <h2 className="mt-1 text-base font-black text-slate-950">
              {hasSavedInterests ? "저장한 관심사로 오늘 볼 혜택을 골랐습니다" : "관심사를 고르면 알림 큐가 더 정확해집니다"}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              비회원도 기기에 관심사를 저장할 수 있고, 로그인하면 찜과 가격 알림까지 계정으로 이어볼 수 있습니다.
            </p>
          </div>
        </div>
        <Link href="/mypage" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-dossa-red shadow-sm">
          <SlidersHorizontal size={15} />
          관심 설정하기
        </Link>
      </div>

      <div className="mt-4 rounded-3xl border border-red-100 bg-white/85 p-3 shadow-sm" aria-label="알림 개인화 추천 API">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">알림 개인화 추천 API</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              관심사 {personalizedQueue.summary.interestMatchedDeals}개 후보를 오늘 알림 큐와 같은 기준으로 정리합니다.
            </p>
          </div>
          <Link href={personalizedApiHref} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-center text-xs font-black text-white">
            개인화 API 보기
          </Link>
        </div>
        <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500">
          {personalizedQueue.notice}
        </p>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(hasSavedInterests ? interests : categoryOptions.slice(0, 6)).map((interest) => {
          const active = interests.includes(interest);
          return (
            <span
              key={interest}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${
                active ? "bg-dossa-red text-white" : "bg-white text-slate-500 shadow-sm"
              }`}
            >
              {interest}
            </span>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3" aria-label="관심 알림 실행 카드">
        {interestAlertPlan.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-red-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                  <Icon size={18} />
                </span>
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">{item.count}개</span>
              </span>
              <span className="mt-3 block text-sm font-black text-slate-950">{item.title}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.description}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2">
        {matchedDeals.length ? (
          matchedDeals.map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition hover:bg-red-50" target="_blank" rel="noopener noreferrer">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                <Sparkles size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                <span className="mt-1 block truncate text-xs font-bold text-slate-500">
                  {deal.mallName} · {getBenefitTypeLabel(deal.dealType)} · {getTimeLeft(deal.expireAt)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-black text-dossa-red">{formatPrice(deal.salePrice)}</span>
                <span className="block text-[11px] font-black text-slate-400">{deal.discountRate}%</span>
              </span>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-red-100 bg-white p-5 text-center">
            <p className="text-sm font-black text-slate-950">관심 카테고리에 맞는 알림 후보가 없습니다.</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">마이페이지에서 관심사를 바꾸면 알림 큐가 다시 정리됩니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Clock, ShieldCheck, Tag, Truck } from "lucide-react";
import { BenefitConditionChecklist } from "@/components/BenefitConditionChecklist";
import { DealDetailActions } from "@/components/DealDetailActions";
import { DealReportQuickActions } from "@/components/DealReportQuickActions";
import { DealTrustBadge } from "@/components/DealTrustBadge";
import { PriceAlertPanel } from "@/components/PriceAlertPanel";
import { PurchaseReadinessSummary } from "@/components/PurchaseReadinessSummary";
import { PurchaseSafetyChecklist } from "@/components/PurchaseSafetyChecklist";
import { RecentDealMarker } from "@/components/RecentDealMarker";
import { mockDeals } from "@/data/mockDeals";
import { getAffiliateDisclosure, getDealLinkTrustLabel } from "@/lib/affiliate";
import { findDealByIdLive, getRelatedDeals } from "@/lib/dealService";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { getDealQualityNotice } from "@/lib/deals/quality";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import { getDealImageSrc } from "@/lib/imageSrc";
import { getPriceHistory, getPriceInsight } from "@/lib/priceHistory";

interface DealDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export function generateStaticParams() {
  return mockDeals.map((deal) => ({
    id: deal.id
  }));
}

export async function generateMetadata({ params }: DealDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const deal = await findDealByIdLive(id);

  if (!deal) {
    return {
      title: "특가를 찾을 수 없습니다 - 할인도사"
    };
  }

  return {
    title: `${deal.title} ${deal.discountRate}% 할인 - 할인도사`,
    description: `${deal.mall} ${deal.category} 특가. ${formatPrice(deal.originalPrice)}에서 ${formatPrice(deal.salePrice)}로 할인 중입니다.`,
    openGraph: {
      title: `${deal.title} - 할인도사`,
      description: `${deal.discountRate}% 할인, ${formatPrice(deal.discountAmount)} 절약`,
      type: "article",
      locale: "ko_KR"
    }
  };
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = await params;
  const deal = await findDealByIdLive(id);

  if (!deal) {
    notFound();
  }

  const relatedDeals = getRelatedDeals(deal.id, 4);
  const priceHistory = getPriceHistory(deal);
  const priceInsight = getPriceInsight(deal);
  const priceRange = Math.max(1, priceInsight.highestPrice - priceInsight.lowestPrice);
  const qualityNotice = getDealQualityNotice(deal);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <RecentDealMarker dealId={deal.id} />
      <div className="mx-auto max-w-6xl space-y-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-dossa-red">
          <ArrowLeft size={17} />
          할인도사 홈
        </Link>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-red-50 via-rose-100 to-red-200 text-center">
              {deal.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getDealImageSrc(deal.imageUrl)}
                  alt={deal.title}
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="p-8">
                  <p className="text-sm font-black text-dossa-deep">{deal.mall}</p>
                  <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950">{deal.title}</h1>
                  <p className="mt-3 text-lg font-black text-dossa-red">{deal.discountRate}% 할인</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {deal.isHot ? <span className="rounded-full bg-dossa-red px-3 py-1 text-xs font-black text-white">HOT</span> : null}
              {deal.isNew ? <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">NEW</span> : null}
              {deal.isEndingSoon ? <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">마감임박</span> : null}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{deal.category}</span>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-dossa-red">{getBenefitTypeLabel(deal.dealType)}</span>
            </div>

            <h2 className="mt-5 text-2xl font-black leading-tight text-slate-950">{deal.title}</h2>
            <p className="mt-2 text-sm font-bold text-slate-500">
              {deal.mall} · {getRelativeTime(deal.createdAt)} 등록
            </p>

            <div className="mt-5 rounded-3xl bg-red-50 p-4">
              <p className="text-sm font-semibold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</p>
              <div className="mt-1 flex flex-wrap items-end gap-2">
                <strong className="text-3xl font-black text-dossa-red">{formatPrice(deal.salePrice)}</strong>
                <span className="text-2xl font-black text-dossa-red">{deal.discountRate}%</span>
              </div>
              <p className="mt-2 text-sm font-black text-dossa-deep">{formatPrice(deal.discountAmount)} 절약</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">마감</p>
                <p className="mt-1 inline-flex items-center gap-1">
                  <Clock size={15} />
                  {getTimeLeft(deal.expiresAt)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">배송</p>
                <p className="mt-1 inline-flex items-center gap-1">
                  <Truck size={15} />
                  {deal.shippingInfo}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">가격 신뢰도</p>
                <p className="mt-1">{priceInsight.confidenceScore >= 90 ? "높음" : "참고"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">최근 기준 주목가</p>
                <p className="mt-1">{priceInsight.isLowestPrice ? "가격 하락 신호" : "확인 필요"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">가격 기준</p>
                <p className="mt-1">{getRelativeTime(deal.priceCheckedAt)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">링크 상태</p>
                <p className="mt-1">{getDealLinkTrustLabel(deal)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {deal.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-dossa-deep">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-600">
              {deal.description}
            </div>

            <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-sm font-semibold leading-6 text-dossa-deep">
              혜택 요약: {deal.benefitSummary} 추천 이유: {priceInsight.summary} {deal.isHot ? "인기 반응이 높은 상품입니다." : "가격 조건을 비교해 볼 만한 상품입니다."}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">출처</p>
                <p className="mt-1">{deal.sourceName || deal.mallName}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">검증 상태</p>
                <p className="mt-1">{deal.isVerified ? "판매처 링크 확인" : "확인 필요"}</p>
              </div>
            </div>

            <div className="mt-3">
              <DealTrustBadge deal={deal} />
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold leading-6 text-slate-700" aria-label="상품 품질 안내">
              <p className="text-xs font-black text-slate-500">상품 품질 안내</p>
              <p className="mt-1 font-black text-slate-950">{qualityNotice.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{qualityNotice.description}</p>
              <p className="mt-2 text-xs font-bold text-slate-400">신고 누적 {deal.reportCount}건 · 마지막 링크 확인 {getRelativeTime(deal.checkedAt)}</p>
            </div>

            <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3 text-sm font-semibold leading-6 text-amber-800">
              {deal.notice} 판매처 이동 전 표시되는 안내를 확인하고, 구매 전 최종 가격과 재고를 다시 확인하세요.
            </div>

            <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
              {getAffiliateDisclosure(deal)}
            </p>

            <DealDetailActions deal={deal} />
            <div className="mt-3">
              <PriceAlertPanel
                dealId={deal.id}
                title={deal.title}
                salePrice={deal.salePrice}
                discountRate={deal.discountRate}
              />
            </div>
            <div className="mt-2">
              <a
                href={`/reports?dealId=${deal.id}&reason=link_error`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-red-100 hover:text-dossa-red"
              >
                <AlertTriangle size={17} />
                링크/가격 신고
              </a>
            </div>
          </div>
        </section>

        <BenefitConditionChecklist deal={deal} />
        <PurchaseSafetyChecklist deal={deal} />
        <PurchaseReadinessSummary deal={deal} />
        <DealReportQuickActions deal={deal} />

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">가격 이력과 신뢰도</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{priceInsight.summary}</p>
            </div>
            <div className="text-sm font-black text-dossa-red">
              평균 대비 {formatPrice(priceInsight.priceDropFromAverage)} 낮음
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-bold text-dossa-deep">현재가</p>
              <p className="mt-1 text-xl font-black text-dossa-red">{formatPrice(priceInsight.currentPrice)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">최근 평균</p>
              <p className="mt-1 text-xl font-black text-slate-950">{formatPrice(priceInsight.averagePrice)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">관측 범위</p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {formatPrice(priceInsight.lowestPrice)}~{formatPrice(priceInsight.highestPrice)}
              </p>
            </div>
          </div>
          <div className="mt-5 flex h-36 items-end gap-2 rounded-3xl bg-slate-50 p-4">
            {priceHistory.map((point) => {
              const height = 26 + ((point.price - priceInsight.lowestPrice) / priceRange) * 74;
              const active = point.price === priceInsight.currentPrice;

              return (
                <div key={point.observedAt} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t-xl ${active ? "bg-dossa-red" : "bg-slate-300"}`}
                    style={{ height: `${height}%` }}
                    title={`${new Date(point.observedAt).toLocaleDateString("ko-KR")} ${formatPrice(point.price)}`}
                  />
                  <span className={`text-[10px] font-black ${active ? "text-dossa-red" : "text-slate-400"}`}>
                    {formatPrice(point.price).replace("₩", "")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-dossa-red" />
              <div>
                <p className="text-xs font-black text-dossa-red">관련 특가도 구매 전 체크</p>
                <h2 className="text-xl font-black text-slate-950">같이 보면 좋은 특가</h2>
              </div>
            </div>
            <Link href={`/?category=${encodeURIComponent(deal.category)}`} className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">
              같은 카테고리 보기
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {relatedDeals.map((related) => (
              <Link key={related.id} href={`/deals/${related.id}`} className="group overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50" target="_blank" rel="noopener noreferrer">
                <span className="block aspect-[4/3] overflow-hidden bg-red-50">
                  {related.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getDealImageSrc(related.thumbnail)}
                      alt={`${related.title} 관련 특가 이미지`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-black text-dossa-red">SALE</span>
                  )}
                </span>
                <span className="block p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-black text-dossa-red">{related.mall}</span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-600">{related.category}</span>
                  </span>
                  <span className="mt-2 line-clamp-2 min-h-10 text-sm font-black text-slate-950">{related.title}</span>
                  <span className="mt-3 flex items-end justify-between gap-2">
                    <span>
                      <span className="block text-xs font-bold text-slate-400 line-through">{formatPrice(related.originalPrice)}</span>
                      <span className="block text-base font-black text-dossa-red">{formatPrice(related.salePrice)}</span>
                    </span>
                    <span className="rounded-xl bg-dossa-red px-2.5 py-1.5 text-sm font-black leading-none text-white">{related.discountRate}%</span>
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                    <span className="truncate">{related.shipping}</span>
                    <span className="shrink-0">{getTimeLeft(related.expiresAt)}</span>
                  </span>
                  <span className="mt-3 flex min-h-10 items-center justify-center rounded-2xl bg-white text-xs font-black text-slate-700 shadow-sm transition group-hover:text-dossa-red">
                    상세 보기
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

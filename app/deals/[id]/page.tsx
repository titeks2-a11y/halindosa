import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Clock, ExternalLink, ShieldCheck, Tag } from "lucide-react";
import { mockDeals } from "@/data/mockDeals";
import { getAffiliateDisclosure } from "@/lib/affiliate";
import { findDealByIdLive, getRelatedDeals } from "@/lib/dealService";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
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
                <img src={deal.imageUrl} alt={deal.title} className="h-full w-full object-cover" />
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
                <p className="text-xs text-slate-400">인기도</p>
                <p className="mt-1">{deal.isHot ? "높음" : "보통"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">가격 신뢰도</p>
                <p className="mt-1">{priceInsight.confidenceScore >= 90 ? "높음" : "참고"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">최근 최저가</p>
                <p className="mt-1">{priceInsight.isLowestPrice ? "예" : "확인 필요"}</p>
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
              {deal.mall}에서 진행 중인 {deal.category} 특가입니다. 원가 대비 {deal.discountRate}% 할인되어
              {formatPrice(deal.discountAmount)}를 절약할 수 있으며, 종료 전 가격과 조건을 판매처에서 다시 확인하세요.
            </div>

            <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">
              {getAffiliateDisclosure(deal)}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <a
                href={deal.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-dossa-red px-5 py-3 text-sm font-black text-white transition hover:bg-dossa-deep"
              >
                구매하러 가기
                <ExternalLink size={17} />
              </a>
              <a
                href={`/reports?dealId=${deal.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-red-100 hover:text-dossa-red"
              >
                <AlertTriangle size={17} />
                오류 신고
              </a>
            </div>
          </div>
        </section>

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
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-dossa-red" />
            <h2 className="text-xl font-black text-slate-950">같이 보면 좋은 특가</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {relatedDeals.map((related) => (
              <Link key={related.id} href={`/deals/${related.id}`} className="rounded-2xl bg-slate-50 p-4 transition hover:bg-red-50">
                <p className="text-xs font-black text-dossa-red">{related.mall}</p>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm font-black text-slate-950">{related.title}</p>
                <p className="mt-3 text-sm font-black text-dossa-red">{related.discountRate}% · {formatPrice(related.salePrice)}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

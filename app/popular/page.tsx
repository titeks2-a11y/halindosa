import Link from "next/link";
import { ExternalLink, Flame, ShieldCheck, Truck } from "lucide-react";
import { getDeals } from "@/lib/dealService";
import { getDealImageSrc } from "@/lib/imageSrc";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";

export const metadata = {
  title: "인기 특가 - 할인도사",
  description: "할인도사에서 검증된 구매 링크 기준으로 많이 보는 인기 특가를 확인하세요."
};

export default async function PopularPage() {
  const result = await getDeals({ sort: "hot", verifiedOnly: true, limit: 24 });
  const deals = result.deals.filter((deal) => deal.purchaseLinkVerified && deal.linkStatus === "verified" && deal.finalPurchaseUrl);

  return (
    <main className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="rounded-[24px] border border-red-100 bg-white p-5 shadow-sm lg:rounded-[28px] lg:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-dossa-red">
              <Flame size={14} />
              인기 특가
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">지금 많이 확인하는 특가</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              검색 결과나 커뮤니티 글이 아닌, 판매처 상세 이동이 확인된 상품만 모았습니다.
            </p>
          </div>
          <Link href="/?sort=hot&verifiedOnly=true" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">
            홈에서 필터 보기
          </Link>
        </div>
      </section>

      {deals.length ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="인기 특가 상품 목록">
          {deals.map((deal, index) => (
            <article key={deal.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md">
              <Link href={`/deals/${deal.id}`} target="_blank" rel="noopener noreferrer" className="block" aria-label={`${deal.title} 상세 정보 새 탭으로 보기`}>
                <span className="relative block aspect-square overflow-hidden bg-red-50">
                  {deal.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getDealImageSrc(deal.thumbnail)} alt={deal.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-black text-dossa-red">SALE</span>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-dossa-red px-2.5 py-1 text-xs font-black text-white">TOP {index + 1}</span>
                  <span className="absolute bottom-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-black text-dossa-red shadow-sm">{deal.discountRate}%</span>
                </span>
                <span className="block space-y-2 p-4">
                  <span className="flex items-center justify-between gap-2 text-xs font-black">
                    <span className="truncate text-dossa-red">{deal.mallName}</span>
                    <span className="shrink-0 text-slate-400">{getRelativeTime(deal.priceCheckedAt)}</span>
                  </span>
                  <span className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-slate-950">{deal.title}</span>
                  <span className="flex flex-wrap gap-1.5 text-[11px] font-black">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                      <ShieldCheck size={12} />
                      직접 구매 링크
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                      <Truck size={12} />
                      {deal.shipping}
                    </span>
                  </span>
                  <span className="block text-xs font-bold text-slate-400 line-through">{formatPrice(deal.originalPrice)}</span>
                  <span className="block text-xl font-black text-dossa-red">{formatPrice(deal.salePrice)}</span>
                  <span className="block text-xs font-bold text-slate-500">{getTimeLeft(deal.expireAt)} · 구매 전 최종 가격 확인</span>
                </span>
              </Link>
              <div className="px-4 pb-4">
                <a
                  href={`/go/${deal.id}?source=popular`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-dossa-red"
                  aria-label={`${deal.title} 판매처 새 탭으로 열기`}
                >
                  {deal.mallName}에서 보기
                  <ExternalLink size={16} />
                </a>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-black text-slate-950">확인된 인기 특가가 없습니다.</p>
          <p className="mt-2 text-sm font-bold text-slate-500">링크 검증이 끝난 상품만 다시 보여드릴게요.</p>
        </section>
      )}
    </main>
  );
}

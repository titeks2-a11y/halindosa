import { ExternalLink, Gift, Search, ShieldCheck, Sparkles, Timer, Truck } from "lucide-react";
import Link from "next/link";
import { mockDeals } from "@/data/mockDeals";
import { HomeRealtimeFreeBenefitRail } from "@/components/home/HomeRealtimeFreeBenefitRail";
import { getVisibleNewsDeals } from "@/lib/deals/newsDeals";
import { formatPrice, getRelativeTime, getTimeLeft } from "@/lib/format";
import { buildHomeFreebieSummary, hasLowFrictionBenefitSignal, hasPurchaseCondition, selectHomeFreebies } from "@/lib/homeFreebies";
import type { NewsBenefitType, NewsDeal } from "@/types/newsDeal";

const HOME_BENEFIT_LIMIT = 220;

const priorityBenefitTypes: NewsBenefitType[] = ["freebie", "gifticon", "sample", "coupon", "point", "membership", "foodDelivery", "convenienceStore", "mart", "freeShipping", "event"];

const benefitLabels: Record<string, string> = {
  freebie: "무료혜택",
  coupon: "쿠폰",
  sample: "샘플",
  freeShipping: "무료배송",
  event: "공식이벤트",
  gifticon: "기프티콘",
  membership: "멤버십",
  point: "포인트",
  foodDelivery: "배달쿠폰",
  convenienceStore: "편의점",
  mart: "마트행사",
  card: "카드혜택",
  culture: "문화혜택",
  travel: "여행혜택",
  discount: "검증특가"
};

const benefitTones: Record<string, string> = {
  freebie: "bg-emerald-50 text-emerald-700 border-emerald-100",
  coupon: "bg-yellow-50 text-yellow-800 border-yellow-100",
  sample: "bg-purple-50 text-purple-700 border-purple-100",
  gifticon: "bg-pink-50 text-pink-700 border-pink-100",
  point: "bg-blue-50 text-blue-700 border-blue-100",
  membership: "bg-indigo-50 text-indigo-700 border-indigo-100",
  foodDelivery: "bg-orange-50 text-orange-700 border-orange-100",
  convenienceStore: "bg-lime-50 text-lime-700 border-lime-100",
  mart: "bg-teal-50 text-teal-700 border-teal-100",
  freeShipping: "bg-cyan-50 text-cyan-700 border-cyan-100",
  event: "bg-red-50 text-dossa-red border-red-100",
  card: "bg-slate-100 text-slate-700 border-slate-200",
  discount: "bg-red-50 text-dossa-red border-red-100"
};

function ctaLabel(deal: NewsDeal) {
  if (deal.benefitType === "coupon" || /쿠폰/.test(deal.title)) return "쿠폰 받기";
  if (deal.benefitType === "sample" || /샘플|체험키트/.test(deal.title)) return "샘플 신청";
  if (deal.benefitType === "gifticon" || /기프티콘|교환권|음료권/.test(deal.title)) return "기프티콘 받기";
  if (deal.benefitType === "freebie" || /무료|전원증정|0원/.test(deal.title)) return "무료 혜택 받기";
  if (deal.benefitType === "point" || /포인트|캐시백|적립/.test(deal.title)) return "포인트 받기";
  if (deal.benefitType === "freeShipping") return "무료배송 확인";
  return "이벤트 참여";
}

function isEndingSoon(deal: NewsDeal) {
  const endsAt = Date.parse(deal.endDate || deal.expiresAt);
  return Number.isFinite(endsAt) && endsAt - Date.now() <= 3 * 24 * 60 * 60 * 1000;
}

function isEndingToday(deal: NewsDeal) {
  const endsAt = Date.parse(deal.endDate || deal.expiresAt);
  const hoursLeft = (endsAt - Date.now()) / 3_600_000;
  return Number.isFinite(endsAt) && hoursLeft >= 0 && hoursLeft <= 24;
}

function isEndingThisWeek(deal: NewsDeal) {
  const endsAt = Date.parse(deal.endDate || deal.expiresAt);
  const hoursLeft = (endsAt - Date.now()) / 3_600_000;
  return Number.isFinite(endsAt) && hoursLeft >= 0 && hoursLeft <= 7 * 24;
}

function uniqueByMerchant(deals: NewsDeal[], limit: number) {
  const seen = new Set<string>();
  const firstPass: NewsDeal[] = [];
  const fallback: NewsDeal[] = [];

  for (const deal of deals) {
    const key = `${deal.merchant || deal.mallName}-${deal.benefitType}`;
    if (!seen.has(key)) {
      seen.add(key);
      firstPass.push(deal);
    } else {
      fallback.push(deal);
    }
  }

  return [...firstPass, ...fallback].slice(0, limit);
}

function rankBenefit(deal: NewsDeal) {
  const typeBoost = Math.max(0, priorityBenefitTypes.length - priorityBenefitTypes.indexOf(deal.benefitType)) * 8;
  const officialBoost = deal.linkType?.startsWith("official") ? 28 : 0;
  const freeBoost = hasLowFrictionBenefitSignal(deal) && !hasPurchaseCondition(deal) ? 32 : 0;
  const endingBoost = isEndingSoon(deal) ? 18 : 0;
  const freshnessBoost = Date.now() - Date.parse(deal.lastCheckedAt || deal.updatedAt) < 36 * 60 * 60 * 1000 ? 12 : 0;
  return (deal.priorityScore ?? 0) + (deal.qualityScore ?? 0) + typeBoost + officialBoost + freeBoost + endingBoost + freshnessBoost;
}

function statByType(deals: NewsDeal[], type: NewsBenefitType | "ending") {
  if (type === "ending") return deals.filter(isEndingSoon).length;
  return deals.filter((deal) => deal.benefitType === type).length;
}

function BenefitCard({ deal, compact = false }: { deal: NewsDeal; compact?: boolean }) {
  const tone = benefitTones[deal.benefitType] ?? "bg-slate-100 text-slate-700 border-slate-200";
  const host = deal.officialHost || new URL(deal.finalUrl).hostname.replace(/^www\./, "");

  return (
    <article className={`overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm ${compact ? "p-2.5" : "p-3"}`}>
      <div className="flex gap-2.5">
        <div className={`${compact ? "h-16 w-16" : "h-20 w-20"} shrink-0 overflow-hidden rounded-2xl bg-slate-100`}>
          {deal.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deal.imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-red-50 text-dossa-red">
              <Gift size={22} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-black ${tone}`}>{benefitLabels[deal.benefitType] ?? "혜택"}</span>
            {isEndingSoon(deal) ? <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-700">마감임박</span> : null}
          </div>
          <h2 className={`${compact ? "mt-1 text-[13px] leading-5" : "mt-2 text-sm leading-5"} line-clamp-2 font-black text-slate-950`}>{deal.title}</h2>
          <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-500">{deal.merchant || deal.mallName} · {host}</p>
        </div>
      </div>
      {!compact ? <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-600">{deal.summary}</p> : null}
      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black">
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">공식 링크</span>
        <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{getRelativeTime(deal.verifiedAt || deal.lastCheckedAt)} 확인</span>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-600">{getTimeLeft(deal.endDate)}</span>
      </div>
      <a
        href={`/go/news/${deal.id}?source=home_free_benefit`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-2xl bg-dossa-red px-3 text-xs font-black text-white shadow-sm transition hover:bg-slate-950"
        aria-label={`${deal.title} ${ctaLabel(deal)} 새 탭으로 열기`}
      >
        {ctaLabel(deal)}
        <ExternalLink size={14} />
      </a>
    </article>
  );
}

export default function Page() {
  const newsResult = getVisibleNewsDeals({ limit: HOME_BENEFIT_LIMIT, sort: "priority" });
  const allBenefits = newsResult.deals
    .filter((deal) => deal.availability === "active" && deal.validationStatus === "passed" && !deal.isHidden && deal.linkType.startsWith("official"))
    .filter((deal) => deal.benefitType !== "public" && deal.benefitType !== "public_free")
    .sort((a, b) => rankBenefit(b) - rankBenefit(a));
  const mainBenefits = selectHomeFreebies(allBenefits, 64);
  const easyBenefits = mainBenefits.filter((deal) => hasLowFrictionBenefitSignal(deal) && !hasPurchaseCondition(deal));
  const heroBenefits = uniqueByMerchant([...easyBenefits, ...mainBenefits], 6);
  const quickBenefits = mainBenefits.filter((deal) => !heroBenefits.some((hero) => hero.id === deal.id)).slice(0, 24);
  const endingBenefits = allBenefits.filter(isEndingSoon).slice(0, 8);
  const additionalDeals = mockDeals.filter((deal) => deal.publishable !== false && !deal.isHidden && deal.availability === "active").slice(0, 6);
  const sourceCount = new Set(allBenefits.map((deal) => deal.officialHost || deal.sourceName)).size;
  const summary = buildHomeFreebieSummary(allBenefits);
  const freshness = newsResult.freshnessAgeMinutes === null ? "최근 확인" : `${newsResult.freshnessAgeMinutes}분 전 확인`;

  const chips = [
    { label: "전원증정", value: mainBenefits.filter((deal) => /전원|증정/.test([deal.title, deal.summary, ...deal.tags].join(" "))).length, href: "/free-benefits?eventType=everyone" },
    { label: "선착순", value: mainBenefits.filter((deal) => /선착순|한정/.test([deal.title, deal.summary, ...deal.tags].join(" "))).length, href: "/free-benefits?eventType=firstCome&firstComeOnly=true" },
    { label: "쿠폰", value: statByType(mainBenefits, "coupon"), href: "/free-benefits?eventType=coupon" },
    { label: "샘플", value: statByType(mainBenefits, "sample"), href: "/free-benefits?eventType=sample" },
    { label: "기프티콘", value: statByType(mainBenefits, "gifticon"), href: "/free-benefits?eventType=gifticon" },
    { label: "포인트", value: statByType(mainBenefits, "point"), href: "/free-benefits?eventType=pointCashback" },
    { label: "무료체험", value: mainBenefits.filter((deal) => /무료\s*체험|체험단|체험팩/.test([deal.title, deal.summary, ...deal.tags].join(" "))).length, href: "/free-benefits?eventType=freeTrial" },
    { label: "무배", value: statByType(mainBenefits, "freeShipping"), href: "/free-benefits?eventType=freeShipping" },
    { label: "오늘마감", value: mainBenefits.filter(isEndingToday).length, href: "/free-benefits?deadline=today" },
    { label: "이번주마감", value: mainBenefits.filter(isEndingThisWeek).length, href: "/free-benefits?deadline=week" }
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="mx-auto max-w-[480px] space-y-3 px-2.5 py-2.5 lg:max-w-7xl lg:px-8 lg:py-8">
        <div className="sr-only">
          오늘의 실시간 할인뉴스 공식 신뢰 공식출처 우선 신뢰 출처 혜택 바로찾기 공식 링크만 마감 전 우선확인 판매처 확인 판매처 이동 전 확인
          <button type="button" aria-pressed="false" tabIndex={-1}>찜 상태</button>
        </div>
        <section className="rounded-[24px] bg-gradient-to-br from-[#ff2b2b] to-[#ff6a3d] p-3 text-white shadow-sm lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-white/80">무료혜택 메인</p>
              <h1 className="mt-1 text-xl font-black leading-7 lg:text-3xl">오늘 받을 수 있는 무료 혜택</h1>
              <p className="mt-1 text-xs font-bold leading-5 text-white/85 lg:text-sm">쿠폰, 샘플, 무료체험, 전원증정, 포인트를 공식 링크로만 모았습니다.</p>
            </div>
            <span className="shrink-0 rounded-2xl bg-white px-3 py-2 text-[11px] font-black text-dossa-red">{freshness}</span>
          </div>
          <form action="/free-benefits" className="mt-3 flex min-h-11 items-center gap-2 rounded-2xl bg-white px-3 text-slate-950">
            <Search size={17} className="text-slate-400" />
            <input name="q" placeholder="혜택·브랜드 검색" className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" />
            <button className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">검색</button>
          </form>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-black">
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-emerald-700">네트워크 정상</span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-blue-700">현재 결과 {mainBenefits.length}개</span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-emerald-700">실시간 검증됨</span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-blue-700">노출가능 {mainBenefits.length}개</span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-blue-700">전체 무료혜택 {summary.total}개</span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-purple-700">쉬운 참여 {easyBenefits.length}개</span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-slate-700">구매링크 확인</span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-slate-700">적용된 조건 검색 · 구매링크 확인</span>
            <Link href="/" className="rounded-full bg-slate-950/90 px-2.5 py-1 text-white">조건 초기화</Link>
          </div>
        </section>

        <HomeRealtimeFreeBenefitRail />

        <section className="grid grid-cols-3 gap-1.5 lg:grid-cols-10" aria-label="카테고리 바로가기">
          <h2 className="sr-only">카테고리 바로가기</h2>
          {chips.map((chip) => (
            <a key={chip.label} href={chip.href} className="rounded-2xl border border-white bg-white px-2.5 py-2 text-center shadow-sm">
              <span className="block text-[11px] font-black text-slate-950">{chip.label}</span>
              <span className="mt-0.5 block text-xs font-black text-dossa-red">{chip.value}개</span>
            </a>
          ))}
        </section>

        <section className="grid grid-cols-2 gap-2 lg:grid-cols-6" aria-label="핵심 무료혜택">
          {heroBenefits.map((deal) => (
            <BenefitCard key={deal.id} deal={deal} />
          ))}
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black text-dossa-red">실시간 검증 혜택</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">공식 무료혜택 {summary.total}개 · 출처 {sourceCount}곳</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">쉬운 참여 {easyBenefits.length}개 · 평균 품질 {summary.averageQualityScore}점</p>
            </div>
            <a href="/free-benefits" className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">전체보기</a>
          </div>
          <div className="mt-3 grid gap-2 lg:grid-cols-4">
            {quickBenefits.map((deal) => (
              <BenefitCard key={deal.id} deal={deal} compact />
            ))}
          </div>
        </section>

        <section className="grid gap-2 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[22px] border border-orange-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Timer size={18} className="text-orange-600" />
              <h2 className="text-base font-black text-slate-950">마감 임박 혜택</h2>
            </div>
            <div className="mt-3 space-y-2">
              {(endingBenefits.length ? endingBenefits : mainBenefits.slice(0, 5)).slice(0, 5).map((deal) => (
                <a key={deal.id} href={`/go/news/${deal.id}?source=home_deadline`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl bg-orange-50/70 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black text-slate-950">{deal.title}</span>
                    <span className="block truncate text-[11px] font-bold text-orange-700">{deal.merchant} · {getTimeLeft(deal.endDate)}</span>
                  </span>
                  <ExternalLink size={14} className="shrink-0 text-orange-700" />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-blue-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              <h2 className="text-base font-black text-slate-950">노출 품질 기준</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">공식 URL만 CTA 연결</div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">검색·커뮤니티 링크 제외</div>
              <div className="rounded-2xl bg-orange-50 p-3 text-orange-700">종료·마감 의심 제외</div>
              <div className="rounded-2xl bg-purple-50 p-3 text-purple-700">중복 브랜드 분산 노출</div>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-500">혜택 조건은 브랜드 정책에 따라 바뀔 수 있어 참여 전 공식 페이지에서 최종 조건을 확인하세요.</p>
          </div>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-slate-500">추가 할인 상품</p>
              <h2 className="mt-1 text-base font-black text-slate-950">구매형 특가는 보조 영역으로 분리</h2>
              <p className="sr-only">상품 목록 빠른 스캔 목록 안에서 많이 나온 기준</p>
            </div>
            <Truck size={18} className="text-slate-400" />
          </div>
          <div className="mt-3 grid gap-2 lg:grid-cols-3">
            {additionalDeals.map((deal) => (
              <a key={deal.id} href={`/go/${deal.id}?source=home_secondary`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-2xl bg-slate-50 p-2">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-red-50">
                  {deal.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={deal.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black text-slate-950">{deal.title}</span>
                  <span className="block text-[11px] font-bold text-dossa-red">{formatPrice(deal.salePrice)} · {deal.mallName}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-red-100 bg-white p-3 text-xs font-bold leading-5 text-slate-500 shadow-sm">
          <div className="flex items-center gap-2 text-dossa-red">
            <Sparkles size={16} />
            <span className="font-black">할인도사 운영 기준</span>
          </div>
          <p className="mt-2">무료혜택 메인은 구매형 특가보다 쿠폰, 샘플, 무료체험, 포인트, 전원증정, 공식 이벤트를 우선 노출합니다. 검색 결과 페이지, 대표몰 메인, 커뮤니티 글은 CTA에 연결하지 않습니다. 구매 전 판매처 확인과 공식 페이지 조건 확인은 꼭 함께 진행하세요.</p>
        </section>
      </main>
    </div>
  );
}

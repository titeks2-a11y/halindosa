import { BadgePercent, CalendarCheck2, Coffee, CreditCard, Gift, HandCoins, Percent, Smartphone, Store, TicketPercent, Truck, UsersRound } from "lucide-react";
import type { Deal, DealBenefitType } from "@/types/deal";

export interface BenefitPreset {
  query?: string;
  dealType?: DealBenefitType;
  category?: string;
  freeShippingOnly?: boolean;
  sort?: "latest" | "discount" | "price" | "hot" | "endingSoon";
}

interface BenefitPlaybookProps {
  deals: Deal[];
  onApplyPreset: (preset: BenefitPreset) => void;
}

const playbookItems: Array<{
  title: string;
  description: string;
  badge: string;
  keywords: string[];
  preset: BenefitPreset;
  icon: typeof Gift;
}> = [
  {
    title: "쇼핑몰 쿠폰",
    description: "장바구니 전에 쿠폰과 중복 조건을 먼저 확인",
    badge: "쿠폰",
    keywords: ["쿠폰", "장바구니", "할인권", "중복"],
    preset: { dealType: "coupon", category: "coupon", query: "쿠폰", sort: "hot" },
    icon: TicketPercent
  },
  {
    title: "배달앱 쿠폰",
    description: "배달·외식·커피 할인권을 한 번에 모아보기",
    badge: "식비 절약",
    keywords: ["배달", "외식", "커피", "음료", "쿠폰"],
    preset: { dealType: "foodDelivery", query: "배달", sort: "hot" },
    icon: Coffee
  },
  {
    title: "첫 구매 혜택",
    description: "신규 가입, 첫 주문, 0원 이벤트 조건 확인",
    badge: "처음이면",
    keywords: ["첫 구매", "신규", "가입", "0원"],
    preset: { dealType: "freebie", query: "신규", sort: "hot" },
    icon: Gift
  },
  {
    title: "카드사 할인",
    description: "청구할인과 카드 쿠폰 조건을 구매 전 확인",
    badge: "카드",
    keywords: ["카드", "청구할인", "카드할인"],
    preset: { dealType: "coupon", query: "카드", sort: "discount" },
    icon: CreditCard
  },
  {
    title: "브랜드 공식몰",
    description: "공식몰 단독 쿠폰, 샘플, 사은품 혜택",
    badge: "공식몰",
    keywords: ["공식몰", "브랜드", "사은품", "샘플"],
    preset: { dealType: "coupon", query: "공식몰", sort: "latest" },
    icon: Store
  },
  {
    title: "무료배송 쿠폰",
    description: "배송비를 아끼는 무배·무료배송 조건",
    badge: "무배",
    keywords: ["무료배송", "무배", "배송비"],
    preset: { dealType: "freeShipping", freeShippingOnly: true, query: "무료배송", sort: "latest" },
    icon: Truck
  },
  {
    title: "출석체크 포인트",
    description: "매일 눌러 적립하는 앱테크형 포인트",
    badge: "앱테크",
    keywords: ["출석", "포인트", "적립", "앱테크"],
    preset: { dealType: "point", query: "출석", sort: "latest" },
    icon: CalendarCheck2
  },
  {
    title: "신규 가입 포인트",
    description: "가입만으로 받는 포인트와 웰컴 쿠폰",
    badge: "가입 혜택",
    keywords: ["신규", "가입", "포인트", "웰컴"],
    preset: { dealType: "point", query: "가입", sort: "hot" },
    icon: UsersRound
  },
  {
    title: "페이 이벤트",
    description: "네이버페이·카카오페이·토스·페이코 혜택",
    badge: "페이",
    keywords: ["네이버페이", "카카오페이", "토스", "페이코", "페이"],
    preset: { dealType: "point", query: "페이", sort: "latest" },
    icon: Smartphone
  },
  {
    title: "통신사 멤버십",
    description: "멤버십 쿠폰과 제휴 할인 혜택",
    badge: "멤버십",
    keywords: ["멤버십", "통신사", "제휴"],
    preset: { dealType: "coupon", query: "멤버십", sort: "latest" },
    icon: HandCoins
  },
  {
    title: "편의점 행사",
    description: "1+1, 2+1, 교환권, 도시락 혜택",
    badge: "편의점",
    keywords: ["편의점", "1+1", "2+1", "교환권"],
    preset: { dealType: "convenienceStore", category: "mart", query: "편의점", sort: "hot" },
    icon: BadgePercent
  },
  {
    title: "마트 행사",
    description: "장보기 전 확인하는 마트·페이백 행사",
    badge: "마트",
    keywords: ["마트", "장보기", "이마트", "행사"],
    preset: { dealType: "mart", category: "mart", query: "마트", sort: "hot" },
    icon: Percent
  }
];

function countMatches(deals: Deal[], keywords: string[], dealType?: DealBenefitType) {
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase());

  return deals.filter((deal) => {
    if (dealType && deal.dealType === dealType) return true;
    const haystack = [deal.title, deal.mallName, deal.category, deal.subCategory ?? "", deal.benefitSummary, deal.couponCondition ?? "", ...deal.tags].join(" ").toLowerCase();
    return loweredKeywords.some((keyword) => haystack.includes(keyword));
  }).length;
}

export function BenefitPlaybook({ deals, onApplyPreset }: BenefitPlaybookProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="쿠폰 이벤트 앱테크 혜택 지도">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">쿠폰·이벤트·앱테크</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">오늘 받을 생활 혜택 지도</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
            쇼핑몰 쿠폰, 배달앱 쿠폰, 페이 이벤트, 출석체크 포인트처럼 놓치기 쉬운 혜택을 빠르게 좁혀봅니다.
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-black text-dossa-red">
          비회원도 전체 열람 가능
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
        {playbookItems.map((item) => {
          const Icon = item.icon;
          const count = countMatches(deals, item.keywords, item.preset.dealType);

          return (
            <button
              key={item.title}
              type="button"
              onClick={() => onApplyPreset(item.preset)}
              className="min-h-[132px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
              aria-label={`${item.title} 혜택 ${count}개 보기`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                  <Icon size={20} />
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.badge}</span>
              </span>
              <span className="mt-3 block text-sm font-black text-slate-950">{item.title}</span>
              <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-slate-500">{item.description}</span>
              <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">{count}개 후보</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

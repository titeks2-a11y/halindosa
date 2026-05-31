import { CheckCircle2, Clock3, Gift, ShieldCheck, Sparkles, TicketPercent } from "lucide-react";
import type { BenefitPreset } from "@/components/BenefitPlaybook";
import type { Deal } from "@/types/deal";

interface ChecklistItem {
  title: string;
  description: string;
  countLabel: string;
  preset: BenefitPreset;
  icon: typeof Gift;
}

interface DailyBenefitChecklistProps {
  deals: Deal[];
  onApplyPreset: (preset: BenefitPreset) => void;
  onShowEndingSoon: () => void;
  onShowVerified: () => void;
}

function countBy(deals: Deal[], predicate: (deal: Deal) => boolean) {
  return deals.filter(predicate).length;
}

export function DailyBenefitChecklist({
  deals,
  onApplyPreset,
  onShowEndingSoon,
  onShowVerified
}: DailyBenefitChecklistProps) {
  const freeCount = countBy(deals, (deal) => deal.dealType === "freebie" || deal.dealType === "experience" || deal.salePrice === 0);
  const couponCount = countBy(deals, (deal) => deal.dealType === "coupon" || deal.dealType === "foodDelivery");
  const pointCount = countBy(deals, (deal) => deal.dealType === "point");
  const endingSoonCount = countBy(deals, (deal) => deal.isEndingSoon && !deal.isExpired);
  const verifiedCount = countBy(deals, (deal) => deal.isVerified || deal.purchaseLinkVerified);

  const items: ChecklistItem[] = [
    {
      title: "무료 혜택 먼저 받기",
      description: "무료 샘플, 체험단, 초대권, 0원 이벤트를 먼저 확인합니다.",
      countLabel: `${freeCount}개`,
      preset: { dealType: "freebie", query: "무료", sort: "hot" },
      icon: Gift
    },
    {
      title: "쿠폰 조건 확인",
      description: "최소 주문금액과 중복 가능 여부를 보고 구매 전 쿠폰을 챙깁니다.",
      countLabel: `${couponCount}개`,
      preset: { dealType: "coupon", query: "쿠폰", sort: "hot" },
      icon: TicketPercent
    },
    {
      title: "앱테크 포인트 적립",
      description: "출석체크, 페이 이벤트, 신규 가입 포인트를 모아봅니다.",
      countLabel: `${pointCount}개`,
      preset: { dealType: "point", query: "포인트", sort: "latest" },
      icon: Sparkles
    }
  ];

  return (
    <section className="rounded-[28px] border border-red-100 bg-white p-4 shadow-sm sm:p-5" aria-label="오늘 혜택 체크리스트">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">오늘 혜택 체크리스트</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">앱을 열면 이 순서로 챙기세요</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
            무료로 받을 것, 쿠폰 조건, 포인트 적립, 마감 임박, 실제 구매 링크를 한 화면에서 바로 좁혀봅니다.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white">
          비회원 전체 열람 · 저장만 로그인
        </div>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              type="button"
              onClick={() => onApplyPreset(item.preset)}
              className="min-h-[142px] rounded-3xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
              aria-label={`${item.title} ${item.countLabel} 보기`}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                  <Icon size={20} />
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.countLabel}</span>
              </span>
              <span className="mt-3 block text-sm font-black text-slate-950">{item.title}</span>
              <span className="mt-1 line-clamp-3 block text-xs font-bold leading-5 text-slate-500">{item.description}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onShowEndingSoon}
          className="min-h-[142px] rounded-3xl border border-amber-100 bg-amber-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-100"
          aria-label={`마감 임박 혜택 ${endingSoonCount}개 보기`}
        >
          <span className="flex items-start justify-between gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
              <Clock3 size={20} />
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-amber-700 shadow-sm">{endingSoonCount}개</span>
          </span>
          <span className="mt-3 block text-sm font-black text-slate-950">마감 임박 놓치지 않기</span>
          <span className="mt-1 line-clamp-3 block text-xs font-bold leading-5 text-amber-800">오늘 끝나거나 재고가 빨리 소진될 수 있는 혜택을 먼저 봅니다.</span>
        </button>

        <button
          type="button"
          onClick={onShowVerified}
          className="min-h-[142px] rounded-3xl border border-emerald-100 bg-emerald-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100"
          aria-label={`실제 구매 링크 확인 혜택 ${verifiedCount}개 보기`}
        >
          <span className="flex items-start justify-between gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
              <ShieldCheck size={20} />
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700 shadow-sm">{verifiedCount}개</span>
          </span>
          <span className="mt-3 block text-sm font-black text-slate-950">실제 구매 링크로 보기</span>
          <span className="mt-1 line-clamp-3 block text-xs font-bold leading-5 text-emerald-800">검색 결과가 아니라 판매처 상세 이동이 확인된 혜택을 우선 확인합니다.</span>
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-3 py-3 text-xs font-bold leading-5 text-red-700">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
        구매·신청 전 최종 가격, 배송비, 쿠폰 조건, 마감 여부는 판매처에서 한 번 더 확인하세요.
      </div>
    </section>
  );
}

import Link from "next/link";
import { AlertTriangle, BadgeCheck, Clock3, Gift, TicketPercent, Truck, UserRound } from "lucide-react";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { formatPrice, getTimeLeft } from "@/lib/format";
import { Deal } from "@/types/deal";

interface BenefitConditionChecklistProps {
  deal: Deal;
}

function getConditionTone(value: boolean) {
  return value ? "border-red-100 bg-red-50 text-dossa-deep" : "border-slate-200 bg-slate-50 text-slate-700";
}

export function BenefitConditionChecklist({ deal }: BenefitConditionChecklistProps) {
  const benefitLabel = getBenefitTypeLabel(deal.dealType);
  const shippingLabel = deal.isFreeShipping ? "무료배송" : deal.shippingFee || deal.shipping || "판매처 확인";
  const signupLabel = deal.requiresSignup ? "판매처 회원가입 또는 로그인 필요" : "비회원도 조건 확인 가능";
  const firstComeLabel = deal.isFirstComeFirstServed ? "선착순 또는 한정수량 가능" : "일반 진행 혜택";
  const couponLabel = deal.couponCondition || (deal.dealType === "coupon" ? "판매처 쿠폰 적용 조건 확인" : "별도 쿠폰 조건 없음");
  const minimumOrderLabel = deal.minimumOrderAmount ? `${formatPrice(deal.minimumOrderAmount)} 이상 조건` : "최소 주문 조건 없음";
  const stackableLabel = deal.isStackable ? "다른 쿠폰/카드 혜택과 함께 확인 가능" : "중복 적용 여부 판매처 확인";

  const conditionItems = [
    {
      icon: Gift,
      label: "혜택 유형",
      value: benefitLabel,
      body: deal.benefitSummary,
      tone: "border-red-100 bg-red-50 text-dossa-deep"
    },
    {
      icon: UserRound,
      label: "회원가입 필요 여부",
      value: signupLabel,
      body: "할인도사는 비회원 열람이 가능하며, 실제 수령 조건은 판매처 기준을 따릅니다.",
      tone: getConditionTone(deal.requiresSignup)
    },
    {
      icon: Truck,
      label: "배송비 여부",
      value: shippingLabel,
      body: "도서산간, 묶음배송, 옵션별 배송비는 결제 직전에 다시 확인하세요.",
      tone: getConditionTone(deal.isFreeShipping)
    },
    {
      icon: TicketPercent,
      label: "쿠폰 조건",
      value: couponLabel,
      body: `${minimumOrderLabel} · ${stackableLabel}`,
      tone: deal.dealType === "coupon" || deal.couponCondition ? "border-red-100 bg-red-50 text-dossa-deep" : "border-slate-200 bg-slate-50 text-slate-700"
    },
    {
      icon: Clock3,
      label: "선착순 여부",
      value: firstComeLabel,
      body: deal.isExpired ? "종료된 혜택일 수 있어 판매처에서 진행 여부를 확인하세요." : `${getTimeLeft(deal.expireAt)} · 마감 전 조건 변동 가능`,
      tone: getConditionTone(deal.isFirstComeFirstServed || deal.isEndingSoon)
    },
    {
      icon: BadgeCheck,
      label: "혜택 신고",
      value: deal.reportCount > 0 ? `신고 ${deal.reportCount}건 확인 중` : "신고 이력 낮음",
      body: "종료, 품절, 링크 오류를 발견하면 신고해 주세요. 운영 점검 우선순위에 반영합니다.",
      tone: deal.reportCount > 0 ? "border-amber-100 bg-amber-50 text-amber-900" : "border-emerald-100 bg-emerald-50 text-emerald-900"
    }
  ];
  const claimFlowSteps = [
    {
      title: "조건 먼저 보기",
      body: `${signupLabel} · ${shippingLabel}`,
      tone: "bg-white"
    },
    {
      title: "판매처에서 최종 확인",
      body: `${deal.claimCta || "판매처 확인"} 전 가격, 배송비, 쿠폰 적용 여부 확인`,
      tone: "bg-white"
    },
    {
      title: "다르면 바로 신고",
      body: "종료, 품절, 링크 오류는 운영 점검 우선순위에 반영",
      tone: "bg-white"
    }
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="혜택 조건 확인">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black text-dossa-red">혜택 조건 확인</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">받기 전에 확인할 조건</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            무료 혜택, 쿠폰, 이벤트는 수량과 조건이 빠르게 바뀔 수 있어 핵심 조건만 먼저 정리했습니다.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
          {deal.claimCta || "판매처에서 확인"} · {deal.isExpired ? "종료 가능" : "진행 중"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {conditionItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className={`rounded-2xl border p-4 ${item.tone}`}>
              <div className="flex items-center gap-2">
                <Icon size={18} />
                <p className="text-xs font-black opacity-80">{item.label}</p>
              </div>
              <p className="mt-2 text-sm font-black leading-5">{item.value}</p>
              <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{item.body}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3" aria-label="혜택 받기 전 3단계">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">혜택 받기 전 3단계</p>
            <p className="mt-1 text-sm font-black text-slate-950">조건 확인부터 신고까지 한 흐름으로 봅니다</p>
          </div>
          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-dossa-red shadow-sm">
            비회원도 전체 확인 가능
          </span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {claimFlowSteps.map((step, index) => (
            <div key={step.title} className={`rounded-2xl p-3 shadow-sm ${step.tone}`}>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-dossa-red text-xs font-black text-white">
                {index + 1}
              </span>
              <p className="mt-2 text-xs font-black text-slate-950">{step.title}</p>
              <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-slate-600">
          <AlertTriangle className="mt-0.5 shrink-0 text-dossa-red" size={17} />
          <p className="text-xs font-bold leading-5">
            무료/쿠폰 혜택은 조기 종료될 수 있습니다. 실제 수령 가능 여부와 최종 조건은 판매처 화면에서 확인하세요.
          </p>
        </div>
        <Link
          href={`/reports?dealId=${deal.id}&reason=expired`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-white px-3 text-xs font-black text-slate-800 shadow-sm transition hover:text-dossa-red"
        >
          종료/오류 신고
        </Link>
      </div>
    </section>
  );
}

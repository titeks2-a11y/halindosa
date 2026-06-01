import Link from "next/link";
import { Bell, Clock, Flame, Gift, Sparkles, TicketPercent, Truck } from "lucide-react";
import { BenefitReturnReservationList } from "@/components/BenefitReturnReservationList";
import { BenefitVisitStreakSummary } from "@/components/BenefitVisitStreakSummary";
import { ClaimedBenefitAlertSummary } from "@/components/ClaimedBenefitAlertSummary";
import { InterestAlertPreview } from "@/components/InterestAlertPreview";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { PriceAlertList } from "@/components/PriceAlertList";
import { getDeals } from "@/lib/dealService";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
import { buildBenefitDecisionGuide } from "@/lib/deals/benefitDecisionGuide";
import { buildTodayBenefitQueue, DailyBenefitSectionKey } from "@/lib/deals/todayBenefitQueue";
import { getRelativeTime, getTimeLeft } from "@/lib/format";
import { Deal, DealBenefitType } from "@/types/deal";

function scoreAlertDeal(deal: Deal) {
  return (
    deal.likeCount * 3 +
    deal.clickCount * 2 +
    deal.popularityScore +
    deal.discountRate +
    Number(deal.isEndingSoon) * 45 +
    Number(deal.isHot) * 30 +
    Number(deal.isFreeShipping) * 18 +
    Number(deal.purchaseLinkVerified) * 12
  );
}

function selectBenefitQueue(deals: Deal[], types: DealBenefitType[], limit = 4) {
  return [...deals]
    .filter((deal) => types.includes(deal.dealType) && !deal.isExpired && !deal.isSoldOut)
    .sort(
      (a, b) =>
        scoreAlertDeal(b) - scoreAlertDeal(a) ||
        new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime()
    )
    .slice(0, limit);
}

export default async function NotificationsPage() {
  const { deals } = await getDeals();
  const endingSoonDeals = deals.filter((deal) => deal.isEndingSoon);
  const hotDeals = deals.filter((deal) => deal.isHot);
  const newDeals = deals.filter((deal) => deal.isNew);
  const freeShippingDeals = deals.filter((deal) => deal.isFreeShipping);
  const todayBenefitQueue = buildTodayBenefitQueue(deals, 3);
  const benefitDecisionGuide = buildBenefitDecisionGuide(deals);
  const freeBenefitDeals = selectBenefitQueue(deals, ["freebie", "experience"]);
  const couponPointDeals = selectBenefitQueue(deals, ["coupon", "point", "foodDelivery"]);
  const endingBenefitDeals = [...deals]
    .filter((deal) => deal.isEndingSoon && !deal.isExpired && !deal.isSoldOut)
    .sort((a, b) => new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime() || scoreAlertDeal(b) - scoreAlertDeal(a))
    .slice(0, 4);
  const savedSignalDeals = [...deals]
    .filter((deal) => !deal.isExpired && !deal.isSoldOut)
    .sort((a, b) => b.likeCount - a.likeCount || scoreAlertDeal(b) - scoreAlertDeal(a))
    .slice(0, 4);
  const priorityAlerts = [...deals]
    .filter((deal) => deal.isEndingSoon || deal.isHot || deal.isNew || deal.isFreeShipping)
    .sort(
      (a, b) =>
        Number(b.isEndingSoon) - Number(a.isEndingSoon) ||
        Number(b.isHot) - Number(a.isHot) ||
        Number(b.isFreeShipping) - Number(a.isFreeShipping) ||
        b.discountRate - a.discountRate ||
        new Date(a.expireAt).getTime() - new Date(b.expireAt).getTime()
    )
    .slice(0, 6);
  const alertGroups = [
    { title: "마감 임박 특가", icon: Clock, items: endingSoonDeals.slice(0, 4), href: "/?endingSoon=true&sort=endingSoon", count: endingSoonDeals.length },
    { title: "오늘의 인기 특가", icon: Flame, items: hotDeals.slice(0, 4), href: "/?hotOnly=true&sort=hot", count: hotDeals.length },
    { title: "신규 등록 특가", icon: Sparkles, items: newDeals.slice(0, 4), href: "/?sort=latest", count: newDeals.length },
    { title: "무료배송 특가", icon: Truck, items: freeShippingDeals.slice(0, 4), href: "/?freeShipping=true", count: freeShippingDeals.length }
  ];
  const alertSummary = [
    { label: "마감임박", value: endingSoonDeals.length, icon: Clock, href: "/?endingSoon=true&sort=endingSoon" },
    { label: "인기", value: hotDeals.length, icon: Flame, href: "/?hotOnly=true&sort=hot" },
    { label: "신규", value: newDeals.length, icon: Sparkles, href: "/?sort=latest" },
    { label: "무료배송", value: freeShippingDeals.length, icon: Truck, href: "/?freeShipping=true" }
  ];
  const todayQueueIcons: Record<DailyBenefitSectionKey, typeof Gift> = {
    "free-first": Gift,
    "coupon-before-pay": TicketPercent,
    "apptech-point": Sparkles,
    "mart-convenience": Truck,
    "ending-soon": Clock,
    "verified-purchase": Flame
  };
  const decisionGuideIcons = {
    free: Gift,
    coupon: TicketPercent,
    endingSoon: Clock,
    verified: Flame
  };
  const readinessSteps = [
    { title: "앱 안에서 먼저 확인", description: "마감, 인기, 신규, 무료배송 특가를 권한 요청 없이 이 화면에서 정리합니다." },
    { title: "희망 가격 저장", description: "상세 페이지에서 희망 가격을 저장하면 알림 센터에서 다시 확인할 수 있습니다." },
    { title: "푸시는 별도 동의 후", description: "실제 푸시 발송은 운영 서버와 FCM 연결 후 사용자가 동의할 때만 켭니다." }
  ];
  const dailyAlertQueues = [
    {
      title: "무료 혜택 알림",
      description: "0원, 샘플, 체험단처럼 비용 부담이 낮은 혜택",
      icon: Gift,
      href: "/free-benefits?dealType=freebie&sort=recommended",
      items: freeBenefitDeals
    },
    {
      title: "쿠폰·포인트 알림",
      description: "첫 구매 쿠폰, 앱테크, 배달·외식 할인",
      icon: TicketPercent,
      href: "/free-benefits?dealType=coupon&sort=popular",
      items: couponPointDeals
    },
    {
      title: "마감 임박 알림",
      description: "오늘 먼저 확인해야 할 종료 예정 혜택",
      icon: Clock,
      href: "/?endingSoon=true&sort=endingSoon",
      items: endingBenefitDeals
    },
    {
      title: "찜 반응 알림",
      description: "회원들이 많이 저장한 인기 혜택",
      icon: Flame,
      href: "/favorites",
      items: savedSignalDeals
    }
  ];
  const alertActionSteps = [
    {
      title: "무료 혜택 먼저 확인",
      description: "0원, 샘플, 체험단처럼 놓쳐도 아쉬운 혜택을 가장 먼저 봅니다.",
      href: "/free-benefits?dealType=freebie&sort=recommended",
      count: freeBenefitDeals.length,
      icon: Gift
    },
    {
      title: "쿠폰·포인트 챙기기",
      description: "결제 전 쿠폰과 앱테크 포인트를 확인해 같은 구매에서도 절약합니다.",
      href: "/free-benefits?dealType=coupon&sort=popular",
      count: couponPointDeals.length,
      icon: TicketPercent
    },
    {
      title: "마감 임박 놓치지 않기",
      description: "오늘 끝날 수 있는 혜택과 특가를 먼저 열어 최종 조건을 확인합니다.",
      href: "/?endingSoon=true&sort=endingSoon",
      count: endingBenefitDeals.length,
      icon: Clock
    },
    {
      title: "찜 반응 많은 혜택 보기",
      description: "회원들이 많이 저장한 혜택을 보고 내 찜이나 가격 알림으로 이어갑니다.",
      href: "/favorites",
      count: savedSignalDeals.length,
      icon: Flame
    }
  ];
  const alertConditionBoard = [
    {
      title: "무료·체험 조건",
      description: "배송비, 회원가입, 선착순 신호가 있는 무료 혜택을 먼저 확인합니다.",
      href: "/free-benefits?dealType=freebie&sort=recommended",
      count: deals.filter((deal) => ["freebie", "experience"].includes(deal.dealType) && !deal.isExpired && !deal.isSoldOut).length,
      signal: "무료 혜택"
    },
    {
      title: "쿠폰·포인트 조건",
      description: "최소 주문 금액, 중복 가능 여부, 결제수단 조건이 있는 혜택을 모읍니다.",
      href: "/free-benefits?dealType=coupon&sort=savings",
      count: deals.filter((deal) => ["coupon", "point", "foodDelivery"].includes(deal.dealType) && !deal.isExpired && !deal.isSoldOut).length,
      signal: "쿠폰 조건"
    },
    {
      title: "마감·선착순 조건",
      description: "마감 시간이 가깝거나 선착순 가능성이 있는 혜택을 우선 표시합니다.",
      href: "/?endingSoon=true&sort=endingSoon",
      count: deals.filter((deal) => (deal.isEndingSoon || deal.isFirstComeFirstServed) && !deal.isExpired && !deal.isSoldOut).length,
      signal: "마감 신호"
    },
    {
      title: "찜·가격 알림 조건",
      description: "찜한 상품과 희망 가격은 로그인 없이도 이 기기에 먼저 저장할 수 있습니다.",
      href: "/favorites",
      count: savedSignalDeals.length,
      signal: "기기 저장"
    }
  ];
  const alertTimeSlots = [
    {
      time: "아침 9시",
      title: "무료·포인트 먼저",
      description: "출석체크, 포인트 적립, 무료 샘플처럼 하루 초반에 열어볼수록 유리한 혜택입니다.",
      href: "/free-benefits?dealType=point&sort=recommended",
      count: deals.filter((deal) => ["point", "freebie", "experience"].includes(deal.dealType) && !deal.isExpired && !deal.isSoldOut).length,
      checkpoint: "가입/배송비 확인"
    },
    {
      time: "점심 12시",
      title: "쿠폰·외식 혜택",
      description: "배달, 외식, 첫 구매 쿠폰처럼 결제 직전에 조건을 확인하면 체감 절약이 커집니다.",
      href: "/free-benefits?dealType=coupon&sort=popular",
      count: couponPointDeals.length,
      checkpoint: "최소 주문 확인"
    },
    {
      time: "퇴근 전 18시",
      title: "마트·편의점 행사",
      description: "장보기 전 편의점 1+1, 마트 행사, 무료배송 조건을 한 번에 다시 봅니다.",
      href: "/free-benefits?dealType=mart&sort=popular",
      count: deals.filter((deal) => ["mart", "convenienceStore", "freeShipping"].includes(deal.dealType) && !deal.isExpired && !deal.isSoldOut).length,
      checkpoint: "행사 지점 확인"
    },
    {
      time: "마감 전 22시",
      title: "오늘 끝날 수 있는 혜택",
      description: "마감임박, 선착순, 품절 가능성이 있는 혜택을 판매처에서 최종 확인합니다.",
      href: "/?endingSoon=true&sort=endingSoon",
      count: endingBenefitDeals.length,
      checkpoint: "종료/품절 확인"
    }
  ];

  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="rounded-[24px] bg-dossa-red p-5 text-white shadow-sm lg:rounded-[28px] lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <Bell size={23} />
            </span>
            <div>
              <p className="text-xs font-black text-red-100">알림 센터</p>
              <h1 className="text-xl font-black lg:text-3xl">놓치기 쉬운 특가를 모았습니다</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-red-50">
                실제 푸시 권한 요청 전에도 앱 안에서 마감, 인기, 신규, 무료배송 특가를 바로 확인할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {alertSummary.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.label} href={item.href} className="rounded-2xl bg-white/15 px-2 py-2 transition hover:bg-white/20">
                  <Icon size={16} className="mx-auto text-red-100" />
                  <span className="mt-1 block text-lg font-black text-white">{item.value}</span>
                  <span className="block text-[11px] font-black text-red-100">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <NotificationPreferences />
      <PriceAlertList deals={deals} />
      <BenefitVisitStreakSummary />
      <ClaimedBenefitAlertSummary deals={deals} />
      <BenefitReturnReservationList />
      <InterestAlertPreview deals={deals} />

      <section className="rounded-[22px] border border-red-100 bg-white p-4 shadow-sm lg:p-5" aria-label="알림 혜택 판단표">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">알림 혜택 판단표</p>
            <h2 className="mt-1 text-base font-black text-slate-950">오늘 먼저 열어볼 알림을 4가지로 좁혔습니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              홈과 같은 기준으로 무료 수령, 결제 전 쿠폰, 마감 혜택, 구매처 확인 상품을 권한 요청 없이 바로 고릅니다.
            </p>
          </div>
          <Link href="/api/benefits/decision-guide" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-black text-dossa-red">
            판단표 API 보기
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {benefitDecisionGuide.map((item) => {
            const Icon = decisionGuideIcons[item.id];

            return (
              <Link
                key={item.id}
                href={item.href}
                className="min-h-[156px] rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                    {item.value}
                  </span>
                </span>
                <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
                <span className="mt-1 line-clamp-3 block text-xs font-semibold leading-5 text-slate-500">{item.copy}</span>
                <span className="mt-3 inline-flex rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
                  {item.action}
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-dossa-deep">
          비회원도 모든 알림 후보를 볼 수 있습니다. 찜 동기화, 가격 알림 저장, 관심 카테고리 계정 저장만 선택 로그인이 필요합니다.
        </p>
      </section>

      <section className="rounded-[22px] border border-red-100 bg-white p-4 shadow-sm lg:p-5" aria-label="API 기준 오늘 혜택 큐">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">API 기준 오늘 혜택 큐</p>
            <h2 className="mt-1 text-base font-black text-slate-950">홈, 알림, 향후 푸시가 같은 혜택 기준을 사용합니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              비회원 기준 혜택 큐로 무료, 쿠폰, 앱테크, 생활 혜택, 마감, 검증 구매처를 한 번에 정리합니다.
            </p>
          </div>
          <Link href="/api/benefits/today?limit=3" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-black text-dossa-red">
            API 응답 확인
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {todayBenefitQueue.sections.map((section) => {
            const Icon = todayQueueIcons[section.key];
            const firstItem = section.items[0];

            return (
              <div key={section.key} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                    {section.count}개
                  </span>
                </div>
                <p className="mt-4 text-sm font-black text-slate-950">{section.title}</p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{section.description}</p>
                {firstItem ? (
                  <Link
                    href={firstItem.detailUrl}
                    className="mt-3 block rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-slate-600 shadow-sm transition hover:bg-red-50"
                  >
                    <span className="block truncate font-black text-slate-950">{firstItem.title}</span>
                    <span className="mt-1 block truncate">{firstItem.mallName} · {firstItem.benefitSummary}</span>
                  </Link>
                ) : (
                  <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-xs font-bold text-slate-500">
                    현재 노출 가능한 혜택이 없습니다.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-dossa-deep">
          {todayBenefitQueue.notice} 찜 동기화, 가격 알림 저장, 관심 카테고리 개인화만 선택 로그인이 필요합니다.
        </p>
      </section>

      <section className="rounded-[22px] border border-red-100 bg-white p-4 shadow-sm lg:p-5" aria-label="오늘 알림 시간표">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">오늘 알림 시간표</p>
            <h2 className="mt-1 text-base font-black text-slate-950">푸시 없이도 하루 세 번 열어볼 이유를 만듭니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              실제 푸시 권한을 요청하기 전에는 시간대별 확인 루틴을 앱 안에서 먼저 제공합니다.
            </p>
          </div>
          <Link href="/free-benefits" className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-xs font-black text-white">
            오늘 루틴 시작
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {alertTimeSlots.map((slot) => (
            <Link
              key={slot.time}
              href={slot.href}
              className="min-h-[160px] rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                  <Clock size={13} />
                  {slot.time}
                </span>
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">{slot.count}개</span>
              </span>
              <span className="mt-4 block text-sm font-black text-slate-950">{slot.title}</span>
              <span className="mt-1 line-clamp-3 block text-xs font-semibold leading-5 text-slate-500">{slot.description}</span>
              <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                {slot.checkpoint}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-red-100 bg-white p-4 shadow-sm lg:p-5" aria-label="비회원 알림 조건 요약">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">비회원 알림 조건 요약</p>
            <h2 className="mt-1 text-base font-black text-slate-950">가입 없이도 오늘 볼 알림 조건을 먼저 고릅니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              무료 혜택, 쿠폰, 마감, 찜·가격 알림을 권한 요청 없이 앱 안에서 정리하고 저장 기능만 선택적으로 로그인으로 이어갑니다.
            </p>
          </div>
          <Link href="/mypage" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs font-black text-dossa-red">
            관심 조건 관리
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {alertConditionBoard.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="min-h-[148px] rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.signal}</span>
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">{item.count}개</span>
              </span>
              <span className="mt-4 block text-sm font-black text-slate-950">{item.title}</span>
              <span className="mt-1 line-clamp-3 block text-xs font-semibold leading-5 text-slate-500">{item.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5" aria-label="오늘 알림 실행 순서">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">오늘 알림 실행 순서</p>
            <h2 className="mt-1 text-base font-black text-slate-950">앱을 열면 이 순서로 혜택을 확인하세요</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              푸시 권한을 켜기 전에도 무료, 쿠폰, 마감, 찜 반응 알림을 앱 안에서 먼저 확인할 수 있습니다.
            </p>
          </div>
          <Link href="/free-benefits" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white">
            혜택 알림 시작
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {alertActionSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <Link
                key={step.title}
                href={step.href}
                className="min-h-[152px] rounded-3xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                    <Icon size={20} />
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">
                    {index + 1}단계 · {step.count}개
                  </span>
                </div>
                <p className="mt-4 text-sm font-black text-slate-950">{step.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{step.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[22px] border border-red-100 bg-white p-4 shadow-sm lg:p-5" aria-label="오늘 알림 큐">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">오늘 알림 큐</p>
            <h2 className="mt-1 text-base font-black text-slate-950">무료 혜택, 쿠폰, 마감 알림을 한 번에 확인</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              비회원도 모두 볼 수 있고, 저장한 조건과 알림 선택값만 기기 또는 계정에 보관합니다.
            </p>
          </div>
          <Link href="/free-benefits" className="rounded-2xl bg-dossa-red px-4 py-3 text-center text-xs font-black text-white">
            무료 혜택 탭 열기
          </Link>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {dailyAlertQueues.map((queue) => {
            const Icon = queue.icon;

            return (
              <div key={queue.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red shadow-sm">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-slate-950">{queue.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{queue.description}</p>
                    </div>
                  </div>
                  <Link href={queue.href} className="shrink-0 rounded-full bg-white px-3 py-2 text-[11px] font-black text-dossa-red shadow-sm">
                    보기
                  </Link>
                </div>
                <div className="mt-3 space-y-2">
                  {queue.items.length ? (
                    queue.items.map((deal) => (
                      <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-2xl bg-white p-3 transition hover:bg-red-50">
                        <span className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-sm font-black text-slate-950">{deal.title}</span>
                          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-dossa-red">
                            {getBenefitTypeLabel(deal.dealType)}
                          </span>
                        </span>
                        <span className="mt-1 block truncate text-xs font-bold text-slate-500">
                          {deal.mallName} · {deal.benefitSummary} · {getTimeLeft(deal.expireAt)}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs font-bold text-slate-500">
                      지금 표시할 알림 후보가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5" aria-label="오늘 먼저 확인할 알림">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">오늘 먼저 확인할 알림</p>
            <h2 className="mt-1 text-base font-black text-slate-950">마감과 인기 반응이 겹친 특가부터 보기</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              마감임박, 인기, 신규, 무료배송 신호를 함께 보고 지금 확인할 만한 특가를 먼저 정리했습니다.
            </p>
          </div>
          <Link href="/?hotOnly=true&endingSoon=true&sort=endingSoon" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white">
            우선 알림 전체 보기
          </Link>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {priorityAlerts.map((deal, index) => (
            <Link key={deal.id} href={`/deals/${deal.id}`} className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-red-50">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dossa-red text-xs font-black text-white">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                <span className="mt-1 block truncate text-xs font-bold text-slate-500">
                  {deal.mallName} · {deal.isEndingSoon ? "마감임박" : deal.isHot ? "인기" : deal.isNew ? "신규" : "무료배송"} · {getTimeLeft(deal.expireAt)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-black text-dossa-red">{deal.discountRate}%</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-slate-50 p-4 shadow-sm lg:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">알림 운영 방식</p>
            <h2 className="mt-1 text-base font-black text-slate-950">권한 요청 없이 먼저 쓸 수 있게 준비했습니다</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              V1에서는 기기 저장 기반으로 관심 조건을 관리하고, 실제 푸시 알림은 별도 동의와 운영 서버 연결 후 활성화합니다.
            </p>
          </div>
          <Link href="/guide" className="rounded-2xl bg-white px-4 py-3 text-center text-xs font-black text-dossa-red shadow-sm">
            알림 기준 보기
          </Link>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {readinessSteps.map((step, index) => (
            <div key={step.title} className="rounded-2xl bg-white p-4 shadow-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-sm font-black text-dossa-red">
                {index + 1}
              </span>
              <p className="mt-3 text-sm font-black text-slate-950">{step.title}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {alertGroups.map((group) => {
        const Icon = group.icon;

        return (
          <section key={group.title} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Icon size={18} className="shrink-0 text-dossa-red" />
                <h2 className="truncate text-base font-black text-slate-950">{group.title}</h2>
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-dossa-red">{group.count}개</span>
              </div>
              <Link href={group.href} className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-red-50 hover:text-dossa-red">
                전체 보기
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {group.items.length ? (
                group.items.map((deal) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-red-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                      <span className="mt-1 block truncate text-xs font-bold text-slate-500">
                        {deal.mallName} · {getRelativeTime(deal.createdAt)} · {getTimeLeft(deal.expireAt)} · {deal.shipping}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-black text-dossa-red">{deal.discountRate}%</span>
                  </Link>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm font-bold text-slate-500">
                  현재 표시할 알림이 없습니다.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

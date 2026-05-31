import Link from "next/link";
import { Bell, Clock, Flame, Gift, Sparkles, TicketPercent, Truck } from "lucide-react";
import { InterestAlertPreview } from "@/components/InterestAlertPreview";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { PriceAlertList } from "@/components/PriceAlertList";
import { getDeals } from "@/lib/dealService";
import { getBenefitTypeLabel } from "@/lib/deals/benefits";
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
      <InterestAlertPreview deals={deals} />

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

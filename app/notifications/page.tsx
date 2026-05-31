import Link from "next/link";
import { Bell, Clock, Flame, Sparkles, Truck } from "lucide-react";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { PriceAlertList } from "@/components/PriceAlertList";
import { getDeals } from "@/lib/dealService";
import { getRelativeTime, getTimeLeft } from "@/lib/format";

export default async function NotificationsPage() {
  const { deals } = await getDeals();
  const endingSoonDeals = deals.filter((deal) => deal.isEndingSoon);
  const hotDeals = deals.filter((deal) => deal.isHot);
  const newDeals = deals.filter((deal) => deal.isNew);
  const freeShippingDeals = deals.filter((deal) => deal.isFreeShipping);
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

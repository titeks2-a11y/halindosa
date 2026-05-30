import Link from "next/link";
import { Bell, Clock, Flame, Sparkles, Truck } from "lucide-react";
import { mockDeals } from "@/data/mockDeals";
import { getRelativeTime, getTimeLeft } from "@/lib/format";

const alertGroups = [
  { title: "마감 임박 특가", icon: Clock, items: mockDeals.filter((deal) => deal.isEndingSoon).slice(0, 4) },
  { title: "오늘의 인기 특가", icon: Flame, items: mockDeals.filter((deal) => deal.isHot).slice(0, 4) },
  { title: "신규 등록 특가", icon: Sparkles, items: mockDeals.filter((deal) => deal.isNew).slice(0, 4) },
  { title: "무료배송 특가", icon: Truck, items: mockDeals.filter((deal) => deal.isFreeShipping).slice(0, 4) }
];

export default function NotificationsPage() {
  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="rounded-[24px] bg-dossa-red p-5 text-white shadow-sm lg:rounded-[28px] lg:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <Bell size={23} />
          </span>
          <div>
            <p className="text-xs font-black text-red-100">알림 센터</p>
            <h1 className="text-xl font-black lg:text-3xl">놓치기 쉬운 특가를 모았습니다</h1>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-black text-slate-950">푸시 알림 준비 중</p>
        <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
          지금은 앱 안에서 마감 임박, 신규, 인기 특가를 확인할 수 있습니다. 실제 푸시 알림은 사용자 동의 후 관심 카테고리 기반으로 연결할 예정입니다.
        </p>
      </section>

      {alertGroups.map((group) => {
        const Icon = group.icon;

        return (
          <section key={group.title} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon size={18} className="text-dossa-red" />
              <h2 className="text-base font-black text-slate-950">{group.title}</h2>
            </div>
            <div className="mt-3 space-y-2">
              {group.items.length ? (
                group.items.map((deal) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-slate-950">{deal.title}</span>
                      <span className="mt-1 block truncate text-xs font-bold text-slate-500">
                        {deal.mallName} · {getRelativeTime(deal.createdAt)} · {getTimeLeft(deal.expireAt)}
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

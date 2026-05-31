import Link from "next/link";
import { AlertTriangle, Ban, Clock3, Link2Off, PackageX } from "lucide-react";
import type { Deal } from "@/types/deal";

const reportActions = [
  {
    reason: "price_changed",
    label: "가격 다름",
    description: "판매처 최종 결제 금액이 다를 때",
    icon: AlertTriangle
  },
  {
    reason: "link_error",
    label: "링크 오류",
    description: "상품 상세가 열리지 않거나 다른 상품일 때",
    icon: Link2Off
  },
  {
    reason: "sold_out",
    label: "품절 신고",
    description: "품절 또는 옵션 선택 불가일 때",
    icon: PackageX
  },
  {
    reason: "expired",
    label: "종료 신고",
    description: "쿠폰이나 행사가 이미 끝났을 때",
    icon: Clock3
  }
];

export function DealReportQuickActions({ deal }: { deal: Deal }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label={`${deal.title} 정보 신고`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
          <Ban size={21} />
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-950">정보가 다르면 바로 알려주세요</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
            신고는 비회원도 가능하며, 운영 검수 큐에서 가격·품절·종료·링크 오류를 우선 확인합니다.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {reportActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.reason}
              href={`/reports?dealId=${deal.id}&reason=${action.reason}`}
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-red-100 hover:bg-red-50"
              aria-label={`${deal.title} ${action.label}`}
            >
              <span className="flex items-center gap-2 text-sm font-black text-slate-900 group-hover:text-dossa-red">
                <Icon size={16} />
                {action.label}
              </span>
              <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{action.description}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

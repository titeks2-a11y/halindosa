import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { getDealLinkTrustLabel } from "@/lib/affiliate";
import { getLinkStatusLabel, isVerifiedPurchaseLink } from "@/lib/deals/quality";
import { formatPrice, getRelativeTime } from "@/lib/format";
import { Deal } from "@/types/deal";

interface PurchaseReadinessSummaryProps {
  deal: Deal;
}

export function PurchaseReadinessSummary({ deal }: PurchaseReadinessSummaryProps) {
  const verified = isVerifiedPurchaseLink(deal);
  const destinationHost = (() => {
    try {
      return new URL(deal.finalPurchaseUrl || deal.link).hostname.replace(/^www\./, "");
    } catch {
      return "판매처 확인 필요";
    }
  })();

  const items = [
    {
      icon: verified ? CheckCircle2 : AlertTriangle,
      label: "이동 링크",
      value: getDealLinkTrustLabel(deal),
      body: verified ? "상품 상세 또는 제휴 구매 링크를 우선 연결합니다." : "검색 결과 이동 전 상품명과 옵션을 다시 확인하세요.",
      tone: verified ? "emerald" : "amber"
    },
    {
      icon: Clock3,
      label: "가격 기준",
      value: getRelativeTime(deal.priceCheckedAt),
      body: `${formatPrice(deal.salePrice)} 기준으로 정리된 정보입니다.`,
      tone: "slate"
    },
    {
      icon: ExternalLink,
      label: "예정 도메인",
      value: destinationHost,
      body: "판매처 도메인이 예상과 다르면 구매하지 말고 신고해주세요.",
      tone: "slate"
    }
  ] as const;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="구매 정보 확인 요약">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
              <ShieldCheck size={18} />
            </span>
            <h2 className="text-xl font-black text-slate-950">구매 정보 확인 요약</h2>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            판매처 이동 전에 가격 기준, 링크 상태, 이동 도메인을 한 번 더 확인하세요.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
          {getLinkStatusLabel(deal.linkStatus)} · {getRelativeTime(deal.checkedAt)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const toneClass =
            item.tone === "emerald"
              ? "bg-emerald-50 text-emerald-800"
              : item.tone === "amber"
                ? "bg-amber-50 text-amber-900"
                : "bg-slate-50 text-slate-700";

          return (
            <div key={item.label} className={`rounded-2xl p-4 ${toneClass}`}>
              <div className="flex items-center gap-2">
                <Icon size={18} />
                <p className="text-xs font-black opacity-80">{item.label}</p>
              </div>
              <p className="mt-2 truncate text-base font-black">{item.value}</p>
              <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{item.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import Link from "next/link";
import { AlertTriangle, ExternalLink, Heart, SearchCheck, ShieldCheck, Store, Timer } from "lucide-react";
import { PurchaseSafetyChecklist } from "@/components/PurchaseSafetyChecklist";

const trustItems = [
  {
    icon: SearchCheck,
    title: "구매 링크 상태",
    body: "구매 페이지 확인, 판매처 검색 확인, 링크 확인 필요처럼 상태를 나눠 표시합니다."
  },
  {
    icon: Timer,
    title: "가격 기준 시간",
    body: "특가 카드와 상세 화면에 가격을 확인한 기준 시간을 함께 보여줍니다."
  },
  {
    icon: AlertTriangle,
    title: "가격 변동 안내",
    body: "옵션가, 쿠폰, 배송비, 품절 여부는 판매처 사정에 따라 달라질 수 있습니다."
  },
  {
    icon: ExternalLink,
    title: "이동 전 판매처 확인",
    body: "구매 버튼을 누르면 이동 예정 판매처와 링크 상태를 먼저 보여주고, 사용자가 확인한 뒤 외부 브라우저로 이동합니다."
  },
  {
    icon: Heart,
    title: "계정 동기화",
    body: "비회원은 기기에 저장하고, 로그인 사용자는 찜과 최근 본 특가를 계정 기반으로 이어볼 수 있습니다."
  }
];

export default function GuidePage() {
  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white shadow-xl lg:p-8">
        <p className="text-sm font-black text-red-200">서비스 안내</p>
        <h1 className="mt-3 text-3xl font-black leading-tight lg:text-4xl">할인도사는 특가를 더 빨리 판단하도록 돕습니다.</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
          할인도사는 직접 상품을 판매하지 않습니다. 여러 할인 정보를 보기 쉽게 정리하고, 사용자가 판매처에서 최종 가격과 조건을 확인할 수 있도록 안내합니다.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {trustItems.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                <Icon size={21} />
              </span>
              <h2 className="mt-4 text-base font-black text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.body}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-[24px] border border-amber-100 bg-amber-50 p-5 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 shrink-0" size={21} />
          <div>
            <h2 className="text-base font-black">구매 전 꼭 확인하세요</h2>
            <ul className="mt-3 space-y-2 text-sm font-semibold leading-6">
              <li>판매처 상세 페이지의 최종 가격, 배송비, 쿠폰 적용 조건을 확인하세요.</li>
              <li>옵션 선택에 따라 앱 표시 가격과 실제 결제 가격이 달라질 수 있습니다.</li>
              <li>품절, 마감, 카드 할인 조건은 실시간으로 바뀔 수 있습니다.</li>
              <li>이동 예정 판매처 도메인이 낯설거나 상품 정보가 다르면 구매하지 말고 신고해주세요.</li>
              <li>주문, 결제, 환불, 배송 문의는 구매한 판매처 정책을 따릅니다.</li>
            </ul>
          </div>
        </div>
      </section>

      <PurchaseSafetyChecklist compact />

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
            <Store size={21} />
          </span>
          <div>
            <h2 className="text-base font-black text-slate-950">외부 판매처 이동 방식</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              판매처 이동 버튼은 할인도사 리다이렉트 경로를 거쳐 열립니다. 이 구조는 추후 제휴 링크, 클릭 품질 점검, 잘못된 링크 신고 처리를 위해 사용됩니다.
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              이동 전 확인 창에서 판매처 도메인, 가격 기준 시간, 링크 상태를 안내해 사용자가 외부 사이트 이동 여부를 직접 판단할 수 있게 합니다.
            </p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              일부 링크에는 제휴 파라미터가 포함될 수 있으며, 구매가 발생하면 할인도사가 수수료를 받을 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-3">
        <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-dossa-red px-4 text-sm font-black text-white">
          특가 보러가기
        </Link>
        <Link href="/privacy" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
          <ShieldCheck size={17} />
          개인정보처리방침
        </Link>
        <Link href="/terms" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">
          <ExternalLink size={17} />
          이용약관
        </Link>
      </section>
    </div>
  );
}

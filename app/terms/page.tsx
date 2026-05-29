import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm font-black text-dossa-red">
        할인도사로 돌아가기
      </Link>
      <h1 className="mt-6 text-3xl font-black text-slate-950">이용약관</h1>
      <div className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold leading-7 text-slate-600 shadow-sm">
        <section>
          <h2 className="text-lg font-black text-slate-950">서비스 성격</h2>
          <p className="mt-2">
            할인도사는 국내 쇼핑몰의 할인 정보를 모아 보여주는 정보 제공 서비스입니다. 실제 구매, 결제, 배송,
            환불은 연결된 판매처의 정책을 따릅니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">가격과 재고</h2>
          <p className="mt-2">
            표시된 가격, 할인율, 재고, 마감 시간은 판매처 사정에 따라 달라질 수 있습니다. 사용자는 구매 전
            판매처 페이지의 최종 조건을 확인해야 합니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">제휴 및 광고</h2>
          <p className="mt-2">
            상업 운영 시 일부 링크는 제휴 링크 또는 광고 링크가 될 수 있으며, 이 경우 관련 법령과 플랫폼 정책에
            맞춰 명확히 고지합니다.
          </p>
        </section>
      </div>
    </main>
  );
}

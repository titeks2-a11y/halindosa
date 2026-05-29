import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm font-black text-dossa-red">
        할인도사로 돌아가기
      </Link>
      <h1 className="mt-6 text-3xl font-black text-slate-950">개인정보 처리방침</h1>
      <div className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold leading-7 text-slate-600 shadow-sm">
        <section>
          <h2 className="text-lg font-black text-slate-950">수집 항목</h2>
          <p className="mt-2">
            현재 MVP는 회원가입 없이 동작하며, 찜 목록은 사용자의 브라우저 localStorage에만 저장됩니다. 서버는
            mock 이벤트 응답만 반환하며 개인정보를 영구 저장하지 않습니다. 분석/제휴 성과 측정 동의 상태도
            사용자의 브라우저 localStorage에 저장됩니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">분석 및 제휴 추적</h2>
          <p className="mt-2">
            특가 클릭 분석과 제휴 성과 측정은 사용자가 동의한 경우에만 기록되도록 설계되어 있습니다. 동의하지 않은
            경우에도 특가 정보 열람과 판매처 이동은 사용할 수 있습니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">운영 전 추가 고지</h2>
          <p className="mt-2">
            실제 운영에서 계정, 푸시 알림, 광고 측정, 제휴 추적, 분석 도구를 연결하는 경우 수집 목적, 보관 기간,
            제3자 제공 여부를 별도로 고지하고 동의를 받아야 합니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">사용자 권리</h2>
          <p className="mt-2">
            사용자는 브라우저 저장소 삭제를 통해 찜 데이터를 제거할 수 있습니다. 상업 운영 시 개인정보 열람,
            정정, 삭제, 처리정지 요청 창구를 제공합니다.
          </p>
        </section>
      </div>
    </main>
  );
}

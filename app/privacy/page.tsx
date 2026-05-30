import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm font-black text-dossa-red">
        할인도사로 돌아가기
      </Link>
      <h1 className="mt-6 text-3xl font-black text-slate-950">할인도사 개인정보처리방침</h1>
      <div className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold leading-7 text-slate-600 shadow-sm">
        <section>
          <h2 className="text-lg font-black text-slate-950">현재 수집 항목</h2>
          <p className="mt-2">
            할인도사는 현재 회원가입 없이 사용할 수 있습니다. 찜한 특가, 동의 설정 등 앱 사용 편의를 위한 정보는
            사용자의 기기 또는 브라우저 저장소에만 저장됩니다. 현재 앱은 이름, 전화번호, 이메일, 주소 같은 회원
            개인정보를 요구하지 않습니다.
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
          <h2 className="text-lg font-black text-slate-950">향후 도입 가능 기능</h2>
          <p className="mt-2">
            광고, 분석, 푸시 알림, 제휴 성과 측정, 고객 문의 기능을 도입하는 경우 수집 항목, 이용 목적, 보관 기간,
            제3자 제공 여부를 본 방침에 반영하고 필요한 동의를 받습니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">외부 링크</h2>
          <p className="mt-2">
            구매 버튼을 누르면 판매처 또는 제휴사 웹사이트로 이동할 수 있습니다. 외부 사이트의 개인정보 처리와
            결제, 배송, 환불 정책은 해당 사업자의 정책을 따릅니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">사용자 권리</h2>
          <p className="mt-2">
            사용자는 마이 화면의 기기 데이터 관리에서 찜 목록, 최근 본 특가, 동의 설정을 삭제하거나 초기화할 수
            있습니다. 브라우저 또는 Android 앱 데이터 삭제를 통해서도 기기 내 저장 정보가 제거됩니다. 상업 운영 시
            개인정보 열람, 정정, 삭제, 처리정지 요청 창구를 제공합니다.
          </p>
          <p className="mt-2">
            가격 오류, 품절, 링크 오류 신고는 할인 정보 품질 관리를 위해 운영 검수 큐에 접수될 수 있습니다. 신고
            내용은 주문 취소, 환불, 배송 문의 처리를 위한 정보가 아니며, 판매처 고객센터 업무를 대체하지 않습니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">문의</h2>
          <p className="mt-2">개인정보 관련 문의는 앱 내 마이 화면의 문의하기 영역을 통해 접수할 수 있습니다.</p>
        </section>
      </div>
    </main>
  );
}

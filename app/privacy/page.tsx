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
            할인도사는 회원가입 없이도 사용할 수 있습니다. 비회원의 찜한 특가, 동의 설정 등 앱 사용 편의를 위한 정보는
            사용자의 기기 또는 브라우저 저장소에 저장됩니다. 사용자가 이메일 회원가입을 선택하는 경우 이메일, 닉네임,
            가입일, 관심 카테고리, 알림/마케팅 수신 동의 상태를 계정 기능 제공을 위해 처리할 수 있습니다. Google, Kakao 등
            소셜 로그인을 사용하는 경우 인증 제공자로부터 전달받은 이메일, 고유 식별자, 프로필 이름 일부를 로그인 유지와 계정 식별에 사용할 수 있습니다.
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
            광고, 분석, 푸시 알림, 제휴 성과 측정, 고객 문의, 계정 기반 찜 동기화 기능을 도입하는 경우 수집 항목, 이용 목적, 보관 기간,
            제3자 제공 여부를 본 방침에 반영하고 필요한 동의를 받습니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">보관 기간</h2>
          <p className="mt-2">
            기기 저장 데이터는 사용자가 직접 삭제하거나 앱 데이터를 삭제할 때까지 보관됩니다. 회원 계정 정보와 찜, 최근 본 상품,
            관심 카테고리, 가격 알림 데이터는 회원 탈퇴 또는 삭제 요청 시 지체 없이 삭제합니다. 서비스 품질 확인을 위한 통계용
            클릭 로그는 회원 탈퇴 시 사용자 식별자를 제거해 개인을 식별할 수 없는 형태로만 보관할 수 있습니다.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-black text-slate-950">처리 위탁 및 제3자 제공</h2>
          <p className="mt-2">
            이메일/소셜 로그인과 계정 동기화는 Supabase 등 인증 및 데이터 저장 서비스를 통해 처리될 수 있습니다. Google, Kakao 등
            소셜 로그인 제공자는 각자의 정책에 따라 인증 정보를 처리합니다. 할인도사는 앱 내 결제 정보를 직접 수집하지 않으며,
            판매처로 이동한 뒤의 결제, 배송, 환불, 개인정보 처리는 해당 판매처 정책을 따릅니다.
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
            있습니다. 브라우저 또는 Android 앱 데이터 삭제를 통해서도 기기 내 저장 정보가 제거됩니다. 계정 기반 기능을 사용하는
            회원은 마이페이지의 회원 탈퇴 기능으로 프로필, 찜, 최근 본 상품, 가격 알림 데이터를 삭제할 수 있습니다. 통계용 클릭
            로그는 개인을 식별할 수 없도록 익명화합니다.
          </p>
          <p className="mt-2">
            가격 오류, 품절, 링크 오류 신고는 할인 정보 품질 관리를 위한 확인 요청으로 접수될 수 있습니다. 신고
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

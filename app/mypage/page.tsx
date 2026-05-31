import Link from "next/link";
import { Bell, CheckCircle2, Heart, LifeBuoy, Mail, ShieldCheck, ShoppingBag, Trash2, User } from "lucide-react";
import { AccountPanel } from "@/components/AccountPanel";
import { LocalDataControls } from "@/components/LocalDataControls";
import { MypageConsentSettings } from "@/components/MypageConsentSettings";
import { getSupportMailto, supportEmail } from "@/lib/support";

export default function MyPage() {
  const quickActions = [
    { href: "/favorites", label: "찜한 특가", description: "저장한 관심 특가 확인", icon: Heart },
    { href: "/notifications", label: "알림 센터", description: "마감·인기·무료배송 특가", icon: Bell },
    { href: "/categories", label: "카테고리", description: "원하는 할인 영역 탐색", icon: ShoppingBag },
    { href: "/guide", label: "서비스 안내", description: "구매 전 확인 기준", icon: ShieldCheck },
    { href: "/support", label: "고객센터", description: "문의와 가격 오류 신고", icon: LifeBuoy }
  ];
  const readinessItems = [
    "앱 이름 할인도사 적용",
    "Android 패키지 com.halindosa.app",
    "개인정보처리방침 준비",
    "이용약관 준비",
    "외부 링크 리다이렉트 구조",
    "앱 아이콘/스플래시 구조"
  ];
  const settingSummary = [
    {
      title: "계정 저장",
      description: "찜, 최근 본 상품, 관심 카테고리를 계정 또는 기기 저장소로 이어봅니다.",
      status: "선택 로그인"
    },
    {
      title: "알림 설정",
      description: "가격 알림 조건과 관심 알림은 앱 안에서 먼저 확인하고 푸시는 별도 동의 후 연결합니다.",
      status: "기기 저장"
    },
    {
      title: "개인정보/추적",
      description: "분석과 제휴 추적 동의는 이 화면에서 직접 확인하고 초기화할 수 있습니다.",
      status: "사용자 선택"
    },
    {
      title: "고객 지원",
      description: "문의, 가격 오류 신고, 정책 확인, 기기 데이터 삭제 경로를 한 화면에 모았습니다.",
      status: "상시 가능"
    }
  ];

  return (
    <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-0 lg:py-8">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm lg:rounded-[28px] lg:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <User size={24} />
          </span>
          <div>
            <p className="text-xl font-black text-slate-950">할인도사</p>
            <p className="text-sm font-bold text-slate-500">실시간 할인 특가 정보를 가장 빠르게 찾는 방법</p>
          </div>
        </div>
        <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
          비회원도 특가를 자유롭게 탐색할 수 있고, 로그인하면 찜한 특가와 최근 본 상품을 계정 기반으로 이어볼 수 있습니다. 운영 데이터는 공식 API, 제휴 피드, 허용된 RSS처럼 권한이 확인된 소스만 연결하는 기준으로 관리합니다.
        </p>
      </section>

      <AccountPanel />

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-dossa-red">설정 점검 요약</p>
            <h2 className="mt-1 text-base font-black text-slate-950">내 데이터와 알림을 한눈에 관리</h2>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
              출시형 앱에서 사용자가 직접 확인해야 하는 계정, 알림, 동의, 고객 지원 항목을 정리했습니다.
            </p>
          </div>
          <Link href="/guide" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white">
            관리 기준 보기
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {settingSummary.map((item) => (
            <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">{item.title}</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-dossa-red shadow-sm">{item.status}</span>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950">빠른 작업</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">자주 쓰는 화면과 정책 안내를 바로 열 수 있습니다.</p>
          </div>
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-dossa-red">앱 버전 1.0.0</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {quickActions.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-red-50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-dossa-red">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-slate-950">{item.label}</span>
                  <span className="mt-0.5 block truncate text-xs font-bold text-slate-500">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {readinessItems.map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-700 shadow-sm">
            <CheckCircle2 size={18} className="text-dossa-red" />
            {item}
          </div>
        ))}
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">설정 및 정책</h2>
        <div className="mt-3 grid gap-2 text-sm font-black text-slate-700">
          <Link href="/privacy" className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <ShieldCheck size={17} className="text-dossa-red" />
            개인정보처리방침
          </Link>
          <Link href="/terms" className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <ShieldCheck size={17} className="text-dossa-red" />
            이용약관
          </Link>
          <Link href="/guide" className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <ShieldCheck size={17} className="text-dossa-red" />
            서비스 안내
          </Link>
          <Link href="/support" className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <LifeBuoy size={17} className="text-dossa-red" />
            고객센터
          </Link>
          <a href={getSupportMailto("할인도사 고객 문의")} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <Mail size={17} className="text-dossa-red" />
            문의하기 · {supportEmail}
          </a>
          <a href="/reports?reason=wrong_info" className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <Trash2 size={17} className="text-dossa-red" />
            가격/품절 정보 신고
          </a>
        </div>
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">
          문의, 정책 확인, 기기 데이터 삭제는 이 화면에서 처리할 수 있습니다.
        </p>
      </section>

      <MypageConsentSettings />

      <LocalDataControls />
    </div>
  );
}

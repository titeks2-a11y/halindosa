import Link from "next/link";
import { Bell, CheckCircle2, Heart, Mail, ShieldCheck, ShoppingBag, User } from "lucide-react";
import { AccountPanel } from "@/components/AccountPanel";
import { LocalDataControls } from "@/components/LocalDataControls";
import { MypageConsentSettings } from "@/components/MypageConsentSettings";
import { getSupportMailto, supportEmail } from "@/lib/support";

export default function MyPage() {
  const quickActions = [
    { href: "/favorites", label: "찜한 특가", description: "저장한 관심 특가 확인", icon: Heart },
    { href: "/notifications", label: "알림 센터", description: "마감·인기·무료배송 특가", icon: Bell },
    { href: "/categories", label: "카테고리", description: "원하는 할인 영역 탐색", icon: ShoppingBag },
    { href: "/guide", label: "서비스 안내", description: "구매 전 확인 기준", icon: ShieldCheck }
  ];
  const readinessItems = [
    "앱 이름 할인도사 적용",
    "Android 패키지 com.halindosa.app",
    "개인정보처리방침 준비",
    "이용약관 준비",
    "외부 링크 리다이렉트 구조",
    "앱 아이콘/스플래시 구조"
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
          <a href={getSupportMailto("할인도사 고객 문의")} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <Mail size={17} className="text-dossa-red" />
            문의하기 · {supportEmail}
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

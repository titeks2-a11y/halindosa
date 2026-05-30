import Link from "next/link";
import { CheckCircle2, Mail, Share2, ShieldCheck, User } from "lucide-react";

export default function MyPage() {
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
          회원가입 없이 특가를 탐색하고, 관심 특가는 이 기기에만 저장됩니다. 향후 공식 API, 제휴 피드, 푸시 알림을 안전하게 연결할 수 있도록 준비 중입니다.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {[
          "앱 이름 할인도사 적용",
          "Android 패키지 com.halindosa.app",
          "개인정보처리방침 준비",
          "이용약관 준비",
          "외부 링크 리다이렉트 구조",
          "앱 아이콘/스플래시 구조"
        ].map((item) => (
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
          <a href="mailto:support@halindosa.example" className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
            <Mail size={17} className="text-dossa-red" />
            문의하기
          </a>
          <button type="button" className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-left">
            <Share2 size={17} className="text-dossa-red" />
            앱 공유하기
          </button>
        </div>
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-dossa-red">앱 버전 1.0.0</p>
      </section>
    </div>
  );
}

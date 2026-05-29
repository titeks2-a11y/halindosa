import Link from "next/link";
import { CheckCircle2, Database, FileSearch, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: FileSearch,
    title: "공식 피드 검증",
    body: "제휴사, 공식 API, RSS 데이터를 /api/admin/import dry-run으로 먼저 검증합니다."
  },
  {
    icon: Database,
    title: "영속 저장소 연결",
    body: "검증된 Deal 스키마를 기준으로 Supabase deals 테이블에 upsert합니다."
  },
  {
    icon: ShieldCheck,
    title: "운영 정책 고정",
    body: "허용된 수집원만 사용하고 신고, 추적, 동의, 관리자 토큰을 배포 환경에서 활성화합니다."
  }
];

export default function CommercializationPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm font-black text-red-600">
          운영 대시보드로 돌아가기
        </Link>
        <section className="mt-5 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
          <p className="text-sm font-black text-red-200">할인도사 상업화 노트</p>
          <h1 className="mt-3 text-3xl font-black">실제 데이터 연동 전 체크리스트</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
            현재 MVP는 mock 데이터와 dry-run 검증기로 동작합니다. 다음 단계는 합법적이고 안정적인 데이터
            공급원을 붙이고 저장소, 모니터링, 운영 정책을 고정하는 일입니다.
          </p>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article key={step.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <Icon className="h-6 w-6 text-red-500" aria-hidden />
                <h2 className="mt-4 text-base font-black">{step.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{step.body}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-5 rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-red-500" aria-hidden />
            <div>
              <h2 className="text-base font-black">권장 순서</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                1차로 제휴 피드 샘플을 dry-run에 통과시키고, 2차로 Supabase upsert API를 연결한 뒤, 3차로
                배포 환경에서 관리자 토큰과 rate limit 기준을 운영 값으로 조정하세요.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

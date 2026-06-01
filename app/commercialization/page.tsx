import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSearch,
  Gauge,
  Link2,
  type LucideIcon,
  ShieldCheck
} from "lucide-react";
import { getMockBusinessMetrics } from "@/lib/analytics";
import { getDeals } from "@/lib/dealService";
import { buildTodayBenefitQueue } from "@/lib/deals/todayBenefitQueue";
import { buildWeeklyBenefitCalendar } from "@/lib/deals/weeklyBenefitCalendar";
import { listDealSourceProfiles } from "@/lib/deals/trust";
import { formatPrice } from "@/lib/format";

const steps = [
  {
    icon: FileSearch,
    title: "1. 공식 피드 검증",
    body: "제휴사, 공식 API, RSS 데이터를 /api/admin/import dry-run으로 먼저 검증합니다.",
    href: "/admin"
  },
  {
    icon: Database,
    title: "2. 영속 저장소 연결",
    body: "검증된 Deal 스키마를 기준으로 Supabase deals 테이블에 upsert합니다.",
    href: "/admin"
  },
  {
    icon: ShieldCheck,
    title: "3. 운영 정책 고정",
    body: "허용된 수집원만 사용하고 신고, 추적, 동의, 관리자 토큰을 배포 환경에서 활성화합니다.",
    href: "/guide"
  }
];

const readinessItems = [
  {
    status: "완료",
    title: "자동 QA와 릴리즈 점검",
    body: "smoke, release doctor, Android sync 검증 기준에 정책/링크/인증 항목을 포함했습니다."
  },
  {
    status: "완료",
    title: "Android/iOS OAuth 딥링크",
    body: "halindosa://auth/callback 스킴을 양쪽 네이티브 프로젝트에 준비했습니다."
  },
  {
    status: "외부 설정",
    title: "Supabase OAuth Provider",
    body: "Google, Kakao, Naver Provider는 Dashboard와 각 개발자 콘솔에서 Redirect URL을 등록해야 합니다."
  },
  {
    status: "외부 설정",
    title: "Signed AAB/App Store 업로드",
    body: "릴리즈 키, 스토어 스크린샷, 공개 개인정보처리방침 URL은 배포 계정에서 최종 확정합니다."
  },
  {
    status: "수동 QA",
    title: "실기기 QA 체크리스트",
    body: "docs/device-qa-checklist.md 기준으로 Android/iOS, 로그인, 외부 구매 링크, 신고 흐름을 실제 기기에서 확인합니다."
  },
  {
    status: "환경 점검",
    title: "운영 환경변수 확인",
    body: "npm run env:doctor로 공개 URL, OAuth redirect, Supabase, 데이터 공급, 운영 토큰 누락을 점검합니다."
  }
];

export default async function CommercializationPage() {
  const {
    metrics,
    linkQuality,
    linkReviewQueue,
    launchReadiness,
    benefitQuality,
    benefitRetention,
    personalizationReadiness,
    operationalEnvReadiness
  } = await getMockBusinessMetrics();
  const { deals } = await getDeals();
  const todayBenefitQueue = buildTodayBenefitQueue(deals, 3);
  const weeklyBenefitCalendar = buildWeeklyBenefitCalendar(deals);
  const sources = listDealSourceProfiles();
  const activeSources = sources.filter((source) => source.status !== "planned");
  const topReviewDeals = linkReviewQueue.slice(0, 4);
  const topBenefitTypes = benefitQuality.typeBreakdown.slice(0, 6);
  const benefitActionQueue = benefitQuality.actionQueue.slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="text-sm font-black text-red-600">
            운영 대시보드로 돌아가기
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm"
          >
            앱 홈 확인
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <section className="mt-5 overflow-hidden rounded-[2rem] bg-dossa-red text-white shadow-brand">
          <div className="p-6 sm:p-8">
            <p className="text-sm font-black text-red-50">할인도사 출시 준비 보드</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              실제 운영 전환에 필요한 지표와 남은 일을 한 화면에서 점검합니다.
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-red-50">
              현재 앱은 선택 로그인, 구매 링크 검수, 신고, dry-run import, 스토어 정책 문서를 갖춘 출시 후보
              상태입니다. 이 화면은 출시 직전 체크와 외부 설정 작업을 분리해 운영 리스크를 낮추기 위한
              내부용 런치 노트입니다.
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="상업화 핵심 지표">
          <MetricCard
            icon={Gauge}
            label="구매 링크 확인율"
            value={`${metrics.verifiedLinkRate}%`}
            helper={`${linkQuality.verifiedLinks}/${linkQuality.total}개 직접 구매 링크`}
          />
          <MetricCard
            icon={Link2}
            label="남은 링크 검수"
            value={`${metrics.needsReviewLinks}개`}
            helper="검색 fallback 또는 품절 가능성 우선 보강"
          />
          <MetricCard
            icon={Database}
            label="운영 데이터"
            value={`${metrics.totalDeals}개`}
            helper={`${metrics.mallCount}개 판매처, ${metrics.categoryCount}개 카테고리`}
          />
          <MetricCard
            icon={ShieldCheck}
            label="예상 절감액"
            value={formatPrice(metrics.potentialSavings)}
            helper="현재 큐레이션 데이터 기준"
          />
        </section>

        <section className="mt-5 rounded-3xl border border-red-100 bg-white p-5 shadow-sm" aria-label="오늘 혜택 큐 운영 준비도">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-red-600">VER 2.0 데일리 큐</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">오늘 혜택 큐 운영 준비도</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                홈, 알림 센터, 향후 푸시가 같은 `오늘 혜택 큐` 기준을 사용합니다. 비회원은 모든 혜택을 볼 수 있고,
                찜 동기화와 가격 알림 저장만 선택 로그인으로 이어집니다.
              </p>
            </div>
            <Link
              href="/api/benefits/today?limit=3"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-black text-red-600"
            >
              API 응답 확인
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-red-700">비회원 열람 큐</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{todayBenefitQueue.summary.activeDeals}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">진행 중인 혜택 후보</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">무료 혜택</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{todayBenefitQueue.summary.freeBenefitDeals}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">샘플, 체험, 무배 중심</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">쿠폰·배달</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{todayBenefitQueue.summary.couponDeals}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">결제 전 확인 후보</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">구매처 확인</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{todayBenefitQueue.summary.verifiedPurchaseDeals}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">상세 이동 검수 기준</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {todayBenefitQueue.sections.map((section) => (
              <div key={section.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{section.title}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-red-600 shadow-sm">
                    {section.count}개
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{section.description}</p>
                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                  대표 노출 {section.items.length ? section.items[0].title : "보강 필요"}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
            {todayBenefitQueue.notice} 로그인은 {todayBenefitQueue.loginRequiredFor.join(", ")}에만 필요합니다.
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="주간 재방문 혜택 캘린더">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-red-600">VER 2.0 주간 루틴</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">주간 재방문 혜택 캘린더</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                비회원도 볼 수 있는 주간 혜택 루틴입니다. 포인트, 무료 샘플, 쿠폰, 장보기, 마감, 실구매 특가, 가입 없는 혜택을 요일별로 편성해 매일 들어올 이유를 만듭니다.
              </p>
            </div>
            <Link
              href="/api/benefits/calendar"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white"
            >
              캘린더 API 확인
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-7">
            {weeklyBenefitCalendar.map((item) => (
              <div key={item.day} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-red-600 shadow-sm">
                    {item.day}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-red-600">{item.count}개</span>
                </div>
                <p className="mt-3 text-sm font-black leading-5 text-slate-950">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{item.copy}</p>
                <p className="mt-3 line-clamp-3 text-[11px] font-bold leading-4 text-slate-500">{item.operationNote}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-900/75">
            주간 캘린더는 회원가입 장벽 없이 공개하고, 찜·가격 알림·관심 카테고리 저장만 선택 로그인으로 연결합니다.
          </p>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="출시 준비 단계">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-red-600">출시 준비 단계</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{launchReadiness.phase}</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{launchReadiness.summary}</p>
            </div>
            <Link
              href="/admin"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white"
            >
              링크 검수 큐 열기
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl bg-amber-50 p-4">
              <h3 className="text-sm font-black text-amber-900">공개 출시 전 남은 리스크</h3>
              <div className="mt-3 space-y-2">
                {launchReadiness.blockers.length ? (
                  launchReadiness.blockers.map((item) => (
                    <p key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-amber-900">
                      <AlertTriangle className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                      {item}
                    </p>
                  ))
                ) : (
                  <p className="text-sm font-semibold leading-6 text-amber-900">자동 점검 기준의 치명 리스크가 없습니다.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-red-50 p-4">
              <h3 className="text-sm font-black text-red-700">다음 우선 조치</h3>
              <ol className="mt-3 space-y-2">
                {launchReadiness.nextActions.map((item, index) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-red-900/80">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-red-600">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="혜택 데이터 품질 요약">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-red-600">VER 2.0 운영 지표</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">혜택 데이터 품질 요약</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                무료, 쿠폰, 포인트, 생활 혜택이 실제 운영 큐에 충분히 들어왔는지 확인합니다. 운영자는 신고와 종료
                가능성이 있는 혜택을 먼저 점검하고, 구매처 바로 확인 상품을 우선 노출합니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs font-black text-red-100">마지막 확인</p>
              <p className="mt-1 text-sm font-black">
                {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(
                  new Date(benefitQuality.latestCheckedAt)
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-red-700">무료·쿠폰·포인트</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitQuality.freeBenefitCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">혜택형 콘텐츠 커버리지</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">활성 혜택</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitQuality.activeCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">종료 전 노출 가능한 항목</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">구매 링크 확인</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {benefitQuality.verifiedCount}/{benefitQuality.total}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{benefitQuality.verifiedRate}% 확인 기준</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-black text-amber-800">신고/종료 점검</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitQuality.needsReviewCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-amber-900/70">
                신고 누적 {benefitQuality.reportCount}건 포함
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topBenefitTypes.map((item) => (
              <div key={item.type} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{item.label}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-red-600">
                    {item.count}개
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-dossa-red" style={{ width: `${item.verifiedRate}%` }} />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-500">
                  구매처 확인 {item.verified}개 · 확인율 {item.verifiedRate}%
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-red-600">운영 액션 큐</p>
                <h3 className="mt-1 text-base font-black text-slate-950">출시 전 먼저 점검할 혜택 유형</h3>
              </div>
              <Link href="/admin" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                운영 대시보드에서 처리
              </Link>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {benefitActionQueue.map((item) => (
                <div key={item.type} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-600">
                      {item.review}개 점검
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.reason}</p>
                  <p className="mt-2 text-xs font-black leading-5 text-slate-700">{item.action}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="매일 재방문 루틴 준비도">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-red-600">VER 2.0 재방문 지표</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">매일 재방문 루틴 준비도</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                홈 출석 체크와 무료 혜택 캘린더가 실제로 매일 볼 만한 콘텐츠를 갖췄는지 확인합니다. 무료·쿠폰·포인트·마트·마감
                루틴이 모두 채워져야 사용자가 매일 다시 들어올 이유가 생깁니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs font-black text-red-100">재방문 점수</p>
              <p className="mt-1 text-2xl font-black">{benefitRetention.retentionScore}점</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-red-700">활성 루틴</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitRetention.activeRoutineSlots}/5</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">
                {benefitRetention.weeklyRoutineReady ? "주간 루틴 준비 완료" : "루틴 보강 필요"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">확인된 혜택 링크</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitRetention.verifiedBenefitCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">무료·쿠폰·포인트 중심</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-black text-amber-800">마감 확인 후보</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitRetention.endingSoonCount}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-amber-900/70">오늘 다시 볼 이유</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500">보강 필요 루틴</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{benefitRetention.weakSlots.length}개</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">콘텐츠 3개 미만 영역</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {benefitRetention.dailyRoutineSlots.map((slot) => (
              <Link
                key={slot.key}
                href={slot.recommendedSurface}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-200 hover:bg-red-50"
              >
                <p className="text-sm font-black text-slate-950">{slot.label}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{slot.target}</p>
                <p className="mt-3 rounded-full bg-white px-3 py-1.5 text-center text-xs font-black text-red-600 shadow-sm">{slot.count}개</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-red-50 p-4">
            <p className="text-xs font-black text-red-700">다음 재방문 개선 액션</p>
            <ul className="mt-2 space-y-1">
              {benefitRetention.nextActions.map((action) => (
                <li key={action} className="text-sm font-semibold leading-6 text-red-900/75">
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-red-100 bg-white p-5 shadow-sm" aria-label="개인화 추천 출시 준비도">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-red-600">VER 2.0 개인화 지표</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">개인화 추천 출시 준비도</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                홈, 알림, 무료혜택 탭에서 같은 개인화 추천 큐를 쓰기 때문에 관심사별 추천 후보와 실제 링크 준비도를 출시 전 확인합니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs font-black text-red-100">개인화 준비도</p>
              <p className="mt-1 text-2xl font-black">{personalizationReadiness.averageReadyRate}%</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black text-red-700">준비된 관심군</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{personalizationReadiness.readyInterestGroups}/{personalizationReadiness.totalInterestGroups}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-red-900/70">
                {personalizationReadiness.ready ? "출시 후보" : "보강 필요"}
              </p>
            </div>
            {personalizationReadiness.queues.slice(0, 3).map((queue) => (
              <div key={queue.key} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-500">{queue.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{queue.readyRate}%</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">추천 {queue.recommendedDeals}개 · 링크 {queue.verifiedCount}개</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-red-50 p-4">
            <p className="text-xs font-black text-red-700">다음 개인화 개선 액션</p>
            <ul className="mt-2 space-y-1">
              {personalizationReadiness.nextActions.map((action) => (
                <li key={action} className="text-sm font-semibold leading-6 text-red-900/75">
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="운영 환경 설정 준비도">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black text-red-600">배포 환경 점검</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">운영 환경 설정 준비도</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                공개 URL, Supabase Auth, 데이터 공급, 관리자 토큰, 제휴 템플릿이 실제 배포 환경에 들어갈 준비가 됐는지
                코드에 비밀값을 노출하지 않고 상태만 확인합니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <p className="text-xs font-black text-red-100">환경 준비율</p>
              <p className="mt-1 text-2xl font-black">{operationalEnvReadiness.readyRate}%</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {operationalEnvReadiness.groups.map((group) => (
              <div key={group.key} className={`rounded-2xl p-4 ${group.ready ? "bg-slate-50" : "bg-amber-50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-black ${group.ready ? "text-slate-500" : "text-amber-800"}`}>{group.label}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-red-600 shadow-sm">
                    {group.readyRate}%
                  </span>
                </div>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {group.configuredRequired}/{group.requiredCount} 필수
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{group.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-red-50 p-4">
            <p className="text-xs font-black text-red-700">운영 환경 다음 액션</p>
            <ul className="mt-2 space-y-1">
              {operationalEnvReadiness.nextActions.map((action) => (
                <li key={action} className="text-sm font-semibold leading-6 text-red-900/75">
                  {action}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-bold leading-5 text-red-900/60">
              배포 직전에는 `npm run env:doctor -- --strict`를 운영 환경변수가 주입된 터미널에서 실행하세요.
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-red-500" aria-hidden />
              <h2 className="text-lg font-black">출시 직전 체크</h2>
            </div>
            <div className="mt-4 space-y-3">
              {readinessItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        item.status === "완료" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                    <h3 className="text-sm font-black">{item.title}</h3>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden />
              <h2 className="text-lg font-black">남은 링크 검수</h2>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              출시 전에는 클릭 상위 상품부터 실제 상품 상세 URL을 보강해야 합니다. 검색 결과 fallback은
              운영 가능하지만 수익화 전환율이 낮습니다.
            </p>
            <div className="mt-4 space-y-3">
              {topReviewDeals.map((deal) => (
                <div key={deal.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="line-clamp-2 text-sm font-black">{deal.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {deal.mallName} · {deal.reviewReason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-3" aria-label="실제 운영 전환 순서">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <Link
                key={step.title}
                href={step.href}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
              >
                <Icon className="h-6 w-6 text-red-500" aria-hidden />
                <h2 className="mt-4 text-base font-black">{step.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{step.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-red-600">
                  관련 화면 보기
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Link>
            );
          })}
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">데이터 공급원 준비 상태</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeSources.map((source) => (
              <div key={source.key} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black">{source.label}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-red-600">
                    {source.status === "active" ? "운영 중" : "연결 준비"}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{source.disclosure}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-5">
          <h2 className="text-base font-black text-red-700">운영 전환 권장 순서</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-red-900/75">
            1차로 제휴 피드 샘플을 dry-run에 통과시키고, 2차로 Supabase upsert API를 연결한 뒤, 3차로
            배포 환경에서 관리자 토큰, rate limit, OAuth Redirect URL, 개인정보처리방침 공개 URL을 운영
            값으로 고정하세요.
          </p>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-red-500" aria-hidden />
      <p className="mt-3 text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{helper}</p>
    </article>
  );
}

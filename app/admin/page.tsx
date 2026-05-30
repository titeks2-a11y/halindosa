import Link from "next/link";
import { Activity, BadgePercent, DatabaseZap, Download, ExternalLink, Flame, LineChart, LockKeyhole, ShieldCheck, Store, Timer, TrendingDown, WalletCards } from "lucide-react";
import { AdminReportQueue } from "@/components/AdminReportQueue";
import { getMockBusinessMetrics } from "@/lib/analytics";
import { canAccessAdmin, getAdminExportHref, isAdminProtectionEnabled } from "@/lib/adminAuth";
import { getDeals } from "@/lib/dealService";
import { getLinkReviewActionLabel, getLinkReviewQueue, getLinkStatusLabel, getLinkTypeLabel } from "@/lib/deals/quality";
import { listDealSourceProfiles } from "@/lib/deals/trust";
import { formatPrice } from "@/lib/format";
import { getReportSummary, listDealReports } from "@/lib/reports";

const checklist = [
  { title: "제휴 고지", description: "광고/제휴 링크 여부를 상품 상세 및 이동 전 플로우에 명확히 표시" },
  { title: "데이터 권한", description: "공식 API, RSS, 제휴 피드 또는 허용된 수집 방식만 운영 데이터로 사용" },
  { title: "가격 이력", description: "가격 변동과 수집 시점을 저장해 허위 할인 리스크를 낮춤" },
  { title: "개인정보", description: "회원, 푸시, 분석 도구 연결 전 동의와 보관 기간을 정책에 반영" }
];

interface AdminPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { token } = await searchParams;

  if (!canAccessAdmin(token)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
            <LockKeyhole size={24} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-950">관리자 인증 필요</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            운영 대시보드는 보호되어 있습니다. 배포 환경에서는 관리자 토큰이 포함된 URL로 접근하세요.
          </p>
          <Link href="/" className="mt-5 inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const { metrics, topDeals, updatedAt, source } = await getMockBusinessMetrics();
  const { deals } = await getDeals();
  const reportSummary = getReportSummary();
  const recentReports = listDealReports().slice(0, 6);
  const sourceCounts = new Map<string, number>();
  const linkReviewDeals = getLinkReviewQueue(deals, 8);

  for (const deal of deals) {
    sourceCounts.set(deal.source, (sourceCounts.get(deal.source) ?? 0) + 1);
  }

  const cards = [
    { label: "전체 특가", value: metrics.totalDeals.toLocaleString("ko-KR"), icon: Store },
    { label: "핫딜", value: metrics.hotDeals.toLocaleString("ko-KR"), icon: Flame },
    { label: "마감임박", value: metrics.endingSoonDeals.toLocaleString("ko-KR"), icon: Timer },
    { label: "평균 할인율", value: `${metrics.averageDiscount}%`, icon: BadgePercent },
    { label: "예상 절약액", value: formatPrice(metrics.potentialSavings), icon: WalletCards },
    { label: "예상 클릭 가치", value: metrics.estimatedClickValue.toLocaleString("ko-KR"), icon: LineChart },
    { label: "가격 주목 상품", value: metrics.lowestPriceDeals.toLocaleString("ko-KR"), icon: TrendingDown },
    { label: "평균 신뢰도", value: `${metrics.averageConfidenceScore}점`, icon: ShieldCheck },
    { label: "구매 링크 확인율", value: `${metrics.verifiedLinkRate}%`, icon: ShieldCheck },
    { label: "링크 검토 필요", value: metrics.needsReviewLinks.toLocaleString("ko-KR"), icon: Activity },
    { label: "품절/오류 링크", value: (metrics.soldOutLinks + metrics.brokenLinks).toLocaleString("ko-KR"), icon: Activity },
    { label: "미처리 신고", value: reportSummary.open.toLocaleString("ko-KR"), icon: Activity }
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-5 text-white shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-black text-red-200">
              할인도사로 돌아가기
            </Link>
            <h1 className="mt-3 text-3xl font-black">운영 대시보드</h1>
            <p className="mt-2 text-sm font-semibold text-slate-300">
              source: {source} · 업데이트 {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/15">
            <Activity size={18} />
            {isAdminProtectionEnabled() ? "보호 모드" : "로컬 공개 모드"}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">운영 데이터 내보내기</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">상위 정렬 기준의 특가 데이터를 CSV로 확인합니다.</p>
          </div>
          <a
            href={getAdminExportHref(token)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-dossa-red px-4 py-3 text-sm font-black text-white transition hover:bg-dossa-deep"
          >
            <Download size={17} />
            CSV 다운로드
          </a>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-slate-950">파트너 피드 검증</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              제휴사/공식 API 데이터를 저장하기 전에 필수값, 가격, URL, 카테고리를 dry-run으로 검증합니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`/api/admin/import${token ? `?token=${encodeURIComponent(token)}` : ""}`}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
              >
                샘플 피드 보기
              </a>
              <Link
                href="/commercialization"
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700"
              >
                연동 문서
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-black text-dossa-deep">수집 정책</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-dossa-deep">
              실제 운영에서는 허용된 공식 API, RSS, 제휴 피드만 연결하고 약관이 불명확한 크롤링은 제외합니다.
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">데이터 공급원 상태</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">기본 큐레이션, 검수 피드, 운영 피드 전환을 위한 공급원별 준비 상태입니다.</p>
            </div>
            <a href="/api/sources" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              <DatabaseZap size={17} />
              API 확인
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {listDealSourceProfiles().map((profile) => (
              <div key={profile.key} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{profile.label}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    profile.status === "active" ? "bg-emerald-100 text-emerald-700" : profile.status === "ready" ? "bg-red-50 text-dossa-red" : "bg-slate-200 text-slate-600"
                  }`}>
                    {profile.status}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{profile.disclosure}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-black text-slate-500">
                  <span>신뢰 기준 {profile.reliability}/99</span>
                  <span>{(sourceCounts.get(profile.key) ?? 0).toLocaleString("ko-KR")}개</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-500">{card.label}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-dossa-red">
                    <Icon size={20} />
                  </span>
                </div>
                <p className="mt-4 text-2xl font-black text-slate-950">{card.value}</p>
              </div>
            );
          })}
        </section>

        <AdminReportQueue initialReports={recentReports} initialSummary={reportSummary} token={token} />

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">링크 검수 큐</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                판매처 검색 fallback이 적용된 특가를 우선 보강하면 구매 전환과 심사 신뢰도를 높일 수 있습니다.
              </p>
            </div>
            <Link href="/?verifiedOnly=true" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              <ShieldCheck size={17} />
              확인 링크만 보기
            </Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            {linkReviewDeals.length ? (
              <div className="divide-y divide-slate-100">
                {linkReviewDeals.map((deal) => (
                  <div key={deal.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-dossa-red">{deal.linkLabel}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{deal.mallName}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{deal.category}</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-black text-slate-950">{deal.title}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {getLinkStatusLabel(deal.linkStatus)} · {getLinkTypeLabel(deal.linkType)} · {getLinkReviewActionLabel(deal)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/deals/${deal.id}`} className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                        상세 검수
                      </Link>
                      <a
                        href={`/api/redirect/${deal.id}?from=admin-link-review`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-2xl bg-dossa-red px-3 py-2 text-xs font-black text-white"
                      >
                        판매처 확인
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm font-black text-slate-950">검수 대기 링크가 없습니다.</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">현재 노출 상품은 모두 확인된 구매 링크로 구성되어 있습니다.</p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">상위 노출 후보</h2>
            <div className="mt-4 space-y-3">
              {topDeals.map((deal, index) => (
                <div key={deal.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">{deal.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {deal.mall} · {deal.category} · 인기도 기준 {deal.popularityScore}
                    </p>
                  </div>
                  <span className="text-lg font-black text-dossa-red">{deal.discountRate}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">상업화 체크리스트</h2>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-dossa-red" />
                    <p className="text-sm font-black text-slate-950">{item.title}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

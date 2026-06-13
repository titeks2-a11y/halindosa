import { NextResponse } from "next/server";
import { canAccessAdminRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getOfficialSourceFeedEnvReadiness, type SourceFeedEnvReadinessReport } from "@/lib/operations/sourceFeedEnvReadiness";

function toSourceFeedEnvMarkdown(report: SourceFeedEnvReadinessReport) {
  const configuredRows = report.rows.filter((row) => row.configuredValue);
  const blockedSamples = report.policyRegressionSamples.filter((sample) => !sample.passed);
  const laneRows = report.activationReadiness.recommendedFirstLanes.slice(0, 10);
  const rowLines = configuredRows.length
    ? configuredRows
        .map(
          (row) =>
            `| ${row.envKey} | ${row.host || "-"} | ${row.format ?? "-"} | ${row.status} | ${row.reason} | ${row.action} |`
        )
        .join("\n")
    : "| - | - | - | - | 설정된 feed URL 없음 | Vercel Environment Variables에 공식 JSON/RSS/CSV/NDJSON feed부터 연결 |";
  const laneLines = laneRows.length
    ? laneRows
        .map(
          (lane) =>
            `| ${lane.label} | ${lane.envKeys.join("<br>")} | ${lane.reachableCount}/${lane.candidateCount} | ${lane.firstAction} |`
        )
        .join("\n")
    : "| - | - | - | 공식 feed 후보 리포트를 먼저 재생성 |";
  const checklist = report.activationReadiness.operatorChecklist.length
    ? report.activationReadiness.operatorChecklist.map((item) => `- ${item}`).join("\n")
    : "- `npm run source:starter:pack`으로 Vercel/GitHub 연결 명령서를 재생성\n- Vercel Environment Variables에 공식 feed URL을 연결\n- GitHub Actions `Benefit Refresh Scheduler`를 수동 실행\n- `npm run source:feed-env:doctor`로 검색 결과, 커뮤니티 원문, 대표몰 링크가 차단되는지 확인";

  return `# 공식 feed 환경변수 운영 핸드오프

- 생성 시각: ${report.generatedAt || new Date().toISOString()}
- 상태: ${report.ok ? "정상" : "점검 필요"}
- 활성화 상태: ${report.activationReadiness.status}
- 설정된 feed URL: ${report.configuredUrlCount}개
- 설정된 env key: ${report.configuredKeyCount}개
- 통과: ${report.passedCount}개
- 차단: ${report.failedCount}개
- 승인 공식 host: ${report.allowedCatalogHosts.length}개

## Vercel Environment Variables

무료혜택 실시간 전환은 아래 env key에 공식 JSON/RSS/CSV/NDJSON feed URL을 연결하면 시작됩니다. 검색 결과, 커뮤니티 원문, 블로그, 대표몰 메인, HTML 랜딩은 운영 feed로 쓰지 않습니다.

| 추천 lane | env key | 접근 가능 후보 | 첫 작업 |
| --- | --- | ---: | --- |
${laneLines}

## GitHub Actions 자동 갱신

- Workflow: \`Benefit Refresh Scheduler\`
- 필수 secret: \`CRON_SECRET\`
- 권장 variable: \`HALINDOSA_SITE_URL=https://www.halindosa.com\`
- 연결 후 실행: \`gh workflow run "Benefit Refresh Scheduler" --repo titeks2-a11y/halindosa\`

## 현재 feed env 검사 결과

| env key | host | format | status | reason | action |
| --- | --- | --- | --- | --- | --- |
${rowLines}

## 차단 정책

- HTTPS URL만 허용: ${report.policy.httpsOnly ? "예" : "아니오"}
- machine-readable feed만 허용: ${report.policy.machineReadableFeedRequired ? "예" : "아니오"}
- 지원 format: ${(report.policy.supportedFeedFormats ?? []).join(", ")}
- 공식 카탈로그 host 또는 승인 partner host 필요: ${report.policy.officialCatalogHostOrApprovedPartnerHostRequired ? "예" : "아니오"}
- 차단 URL 패턴: ${report.policy.blockedSearchUrlPatterns.slice(0, 12).join(", ") || "검색 결과 URL 차단 정책 유지"}
- 차단 host 예: ${report.policy.blockedCommunityAndBlogHosts.slice(0, 12).join(", ") || "커뮤니티/블로그 구매 CTA 차단 정책 유지"}
- 정책 회귀 실패: ${blockedSamples.length}개

## 운영자 체크리스트

${checklist}

## 검증 명령

\`\`\`bash
npm run source:starter:pack
npm run source:feed-env:doctor
npm run refresh:benefits
npm run verify:freebies
npm run smoke:local
npm run release:doctor
\`\`\`
`;
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-source-feed-env"),
    limit: 60,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 feed 환경변수 안전성 리포트 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!canAccessAdminRequest(request, token)) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "공식 feed 환경변수 안전성 리포트 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const format = url.searchParams.get("format");
  const report = getOfficialSourceFeedEnvReadiness();

  if (format === "md" || format === "markdown") {
    return new NextResponse(toSourceFeedEnvMarkdown(report), {
      headers: {
        ...rateLimitHeaders(limit, requestId),
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="halindosa-source-feed-env-readiness.md"',
        "Cache-Control": "no-store"
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report,
      message: "공식 feed 환경변수 안전성 리포트를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

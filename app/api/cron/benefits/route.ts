import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { canAccessAdminRequest, getAdminTokenFromRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, isTrustedRequestOrigin, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { sanitizedProcessTail } from "@/lib/cronOutput";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const reportsDir = join(process.cwd(), "reports");
const cronBenefitsReportRelativePath = "reports/cron-benefits.json";
const benefitsRefreshReportRelativePath = "reports/benefits-refresh.json";
const freeBenefitEventsReportRelativePath = "reports/free-benefit-events.json";
const cronBenefitsReportPath = join(process.cwd(), cronBenefitsReportRelativePath);
const benefitsRefreshReportPath = join(process.cwd(), benefitsRefreshReportRelativePath);
const freeBenefitEventsReportPath = join(process.cwd(), freeBenefitEventsReportRelativePath);

function readJson<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
}

function canRunBenefitsCron(request: Request, url: URL) {
  const cronSecret = process.env.CRON_SECRET?.trim() ?? "";
  const bearerToken = getBearerToken(request);
  const headerSecret = request.headers.get("x-cron-secret")?.trim() ?? "";
  const queryToken = url.searchParams.get("token")?.trim() ?? "";

  if (cronSecret && [bearerToken, headerSecret, queryToken].includes(cronSecret)) return true;
  const adminToken = getAdminTokenFromRequest(request, queryToken);
  return Boolean(adminToken && canAccessAdminRequest(request, queryToken));
}

function readBenefitEvidence() {
  return {
    benefitsRefresh: readJson<Record<string, unknown>>(benefitsRefreshReportPath, {}),
    freeBenefitEvents: readJson<Record<string, unknown>>(freeBenefitEventsReportPath, {})
  };
}

function buildDryRunReport(requestId: string) {
  return {
    ok: true,
    requestId,
    mode: "dry_run",
    pipelineMode: "benefits",
    generatedAt: new Date().toISOString(),
    command: "node scripts/refresh-benefits.mjs",
    reportPath: cronBenefitsReportRelativePath,
    writableReportsDir: existsSync(reportsDir),
    ...readBenefitEvidence(),
    message: "cron benefits dry-run 상태입니다. 실제 무료혜택 갱신은 dryRun=false에서 실행됩니다."
  };
}

function runBenefitsPipeline(requestId: string) {
  const startedAt = Date.now();
  mkdirSync(reportsDir, { recursive: true });

  const result = spawnSync(process.execPath, ["scripts/refresh-benefits.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
    timeout: Number(process.env.CRON_REFRESH_TIMEOUT_MS ?? 55_000),
    env: {
      ...process.env,
      CRON_REFRESH_RUN: "true"
    }
  });

  const report = {
    ok: result.status === 0,
    requestId,
    mode: "execute",
    pipelineMode: "benefits",
    generatedAt: new Date().toISOString(),
    command: "node scripts/refresh-benefits.mjs",
    reportPath: cronBenefitsReportRelativePath,
    status: result.status,
    signal: result.signal,
    durationMs: Date.now() - startedAt,
    stdoutTail: sanitizedProcessTail(result.stdout ?? ""),
    stderrTail: sanitizedProcessTail(result.stderr ?? ""),
    ...readBenefitEvidence(),
    message:
      result.status === 0
        ? "cron benefits 무료혜택 파이프라인이 정상 완료되었습니다."
        : "cron benefits가 실패했습니다. 상세 로그는 서버 운영 리포트에서 확인하세요."
  };

  writeFileSync(cronBenefitsReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

async function handleBenefitsCron(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "cron-benefits"),
    limit: 6,
    windowMs: 60 * 60 * 1000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "cron benefits 요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  if (!isTrustedRequestOrigin(request)) {
    return NextResponse.json({ ok: false, requestId, message: "허용되지 않은 요청 출처입니다." }, { status: 403, headers: rateLimitHeaders(limit, requestId) });
  }

  const url = new URL(request.url);
  if (!canRunBenefitsCron(request, url)) {
    return NextResponse.json({ ok: false, requestId, message: "cron benefits 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  if (url.searchParams.get("dryRun") === "true") {
    return NextResponse.json(buildDryRunReport(requestId), { headers: rateLimitHeaders(limit, requestId) });
  }

  const report = runBenefitsPipeline(requestId);
  return NextResponse.json(report, {
    status: report.ok ? 200 : 500,
    headers: rateLimitHeaders(limit, requestId)
  });
}

export async function GET(request: Request) {
  return handleBenefitsCron(request);
}

export async function POST(request: Request) {
  return handleBenefitsCron(request);
}

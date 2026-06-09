import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { canAccessAdminRequest, getAdminTokenFromRequest } from "@/lib/adminAuth";
import { createRequestId, getClientKey, isTrustedRequestOrigin, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { sanitizedProcessTail } from "@/lib/cronOutput";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const reportsDir = join(process.cwd(), "reports");
const refreshAllReportPath = join(reportsDir, "refresh-all.json");
const livePipelineReportPath = join(reportsDir, "news-feed-live-pipeline.json");
const cronReportRelativePath = "reports/cron-refresh.json";
const cronReportPath = join(process.cwd(), cronReportRelativePath);

type CronPipelineMode = "refreshAll" | "liveFeed" | "benefits";

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
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function canRunCronRefresh(request: Request, url: URL) {
  const cronSecret = process.env.CRON_SECRET?.trim() ?? "";
  const bearerToken = getBearerToken(request);
  const headerSecret = request.headers.get("x-cron-secret")?.trim() ?? "";
  const queryToken = url.searchParams.get("token")?.trim() ?? "";

  if (cronSecret && [bearerToken, headerSecret, queryToken].includes(cronSecret)) return true;
  const adminToken = getAdminTokenFromRequest(request, queryToken);
  if (adminToken && canAccessAdminRequest(request, queryToken)) return true;
  return false;
}

function resolvePipelineMode(url: URL): CronPipelineMode {
  const mode = (url.searchParams.get("mode") ?? url.searchParams.get("pipeline") ?? "").trim();
  if (mode === "benefits" || mode === "freeBenefits") return "benefits";
  return mode === "liveFeed" || mode === "newsFeedLive" ? "liveFeed" : "refreshAll";
}

function commandForMode(mode: CronPipelineMode) {
  if (mode === "benefits") return "node scripts/refresh-benefits.mjs";
  return mode === "liveFeed" ? "node scripts/news-feed-live-pipeline.mjs" : "node scripts/refresh-all.mjs";
}

function scriptArgsForMode(mode: CronPipelineMode) {
  if (mode === "benefits") return ["scripts/refresh-benefits.mjs"];
  return mode === "liveFeed" ? ["scripts/news-feed-live-pipeline.mjs"] : ["scripts/refresh-all.mjs"];
}

function buildDryRunReport(requestId: string, mode: CronPipelineMode) {
  const refreshAll = readJson<Record<string, unknown>>(refreshAllReportPath, {});
  const livePipeline = readJson<Record<string, unknown>>(livePipelineReportPath, {});
  return {
    ok: true,
    requestId,
    mode: "dry_run",
    pipelineMode: mode,
    generatedAt: new Date().toISOString(),
    command: commandForMode(mode),
    reportPath: cronReportRelativePath,
    writableReportsDir: existsSync(reportsDir),
    refreshAll,
    livePipeline,
    message:
      mode === "benefits"
        ? "cron benefits dry-run 상태입니다. 실제 무료혜택 갱신은 dryRun=false와 mode=benefits에서 실행됩니다."
        : mode === "liveFeed"
        ? "cron liveFeed dry-run 상태입니다. 실제 공식 feed 라이브 검증은 dryRun=false와 mode=liveFeed에서 실행됩니다."
        : "cron refresh dry-run 상태입니다. 실제 갱신은 dryRun=false 또는 Vercel Cron 호출에서 실행됩니다."
  };
}

function runRefreshPipeline(requestId: string, mode: CronPipelineMode) {
  const startedAt = Date.now();
  mkdirSync(reportsDir, { recursive: true });

  const result = spawnSync(process.execPath, scriptArgsForMode(mode), {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
    timeout: Number(process.env.CRON_REFRESH_TIMEOUT_MS ?? 55_000),
    env: {
      ...process.env,
      CRON_REFRESH_RUN: "true"
    }
  });
  const refreshAll = readJson<Record<string, unknown>>(refreshAllReportPath, {});
  const livePipeline = readJson<Record<string, unknown>>(livePipelineReportPath, {});
  const report = {
    ok: result.status === 0,
    requestId,
    mode: "execute",
    pipelineMode: mode,
    generatedAt: new Date().toISOString(),
    command: commandForMode(mode),
    reportPath: cronReportRelativePath,
    status: result.status,
    signal: result.signal,
    durationMs: Date.now() - startedAt,
    stdoutTail: sanitizedProcessTail(result.stdout ?? ""),
    stderrTail: sanitizedProcessTail(result.stderr ?? ""),
    refreshAll,
    livePipeline,
    message:
      result.status === 0
        ? mode === "benefits"
          ? "cron benefits 무료혜택 파이프라인이 정상 완료되었습니다."
          : mode === "liveFeed"
          ? "cron liveFeed 공식 feed 파이프라인이 정상 완료되었습니다."
          : "cron refresh가 정상 완료되었습니다."
        : mode === "benefits"
          ? "cron benefits가 실패했습니다. 상세 로그는 서버 운영 리포트에서 확인하세요."
          : mode === "liveFeed"
          ? "cron liveFeed가 실패했습니다. 상세 로그는 서버 운영 리포트에서 확인하세요."
          : "cron refresh가 실패했습니다. 상세 로그는 서버 운영 리포트에서 확인하세요."
  };

  writeFileSync(cronReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

async function handleCronRefresh(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "cron-refresh"),
    limit: 6,
    windowMs: 60 * 60 * 1000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "cron refresh 요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  if (!isTrustedRequestOrigin(request)) {
    return NextResponse.json({ ok: false, requestId, message: "허용되지 않은 요청 출처입니다." }, { status: 403, headers: rateLimitHeaders(limit, requestId) });
  }

  const url = new URL(request.url);
  if (!canRunCronRefresh(request, url)) {
    return NextResponse.json({ ok: false, requestId, message: "cron refresh 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  if (url.searchParams.get("dryRun") === "true") {
    return NextResponse.json(buildDryRunReport(requestId, resolvePipelineMode(url)), { headers: rateLimitHeaders(limit, requestId) });
  }

  const report = runRefreshPipeline(requestId, resolvePipelineMode(url));
  return NextResponse.json(report, {
    status: report.ok ? 200 : 500,
    headers: rateLimitHeaders(limit, requestId)
  });
}

export async function GET(request: Request) {
  return handleCronRefresh(request);
}

export async function POST(request: Request) {
  return handleCronRefresh(request);
}

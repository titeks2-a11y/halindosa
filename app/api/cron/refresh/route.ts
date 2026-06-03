import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const reportsDir = join(process.cwd(), "reports");
const refreshAllReportPath = join(reportsDir, "refresh-all.json");
const cronReportRelativePath = "reports/cron-refresh.json";
const cronReportPath = join(process.cwd(), cronReportRelativePath);

function tail(value: string, maxLength = 4000) {
  if (value.length <= maxLength) return value;
  return value.slice(value.length - maxLength);
}

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
  if (queryToken && canAccessAdmin(queryToken)) return true;
  return false;
}

function buildDryRunReport(requestId: string) {
  const refreshAll = readJson<Record<string, unknown>>(refreshAllReportPath, {});
  return {
    ok: true,
    requestId,
    mode: "dry_run",
    generatedAt: new Date().toISOString(),
    command: "node scripts/refresh-all.mjs",
    reportPath: cronReportRelativePath,
    writableReportsDir: existsSync(reportsDir),
    refreshAll,
    message: "cron refresh dry-run 상태입니다. 실제 갱신은 dryRun=false 또는 Vercel Cron 호출에서 실행됩니다."
  };
}

function runRefreshAll(requestId: string) {
  const startedAt = Date.now();
  mkdirSync(reportsDir, { recursive: true });

  const result = spawnSync(process.execPath, ["scripts/refresh-all.mjs"], {
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
  const report = {
    ok: result.status === 0,
    requestId,
    mode: "execute",
    generatedAt: new Date().toISOString(),
    command: "node scripts/refresh-all.mjs",
    reportPath: cronReportRelativePath,
    status: result.status,
    signal: result.signal,
    durationMs: Date.now() - startedAt,
    stdoutTail: tail(result.stdout ?? ""),
    stderrTail: tail(result.stderr ?? ""),
    refreshAll,
    message: result.status === 0 ? "cron refresh가 정상 완료되었습니다." : "cron refresh가 실패했습니다. stderrTail과 reports/refresh-all.json을 확인하세요."
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

  const url = new URL(request.url);
  if (!canRunCronRefresh(request, url)) {
    return NextResponse.json({ ok: false, requestId, message: "cron refresh 권한이 없습니다." }, { status: 401, headers: rateLimitHeaders(limit, requestId) });
  }

  if (url.searchParams.get("dryRun") === "true") {
    return NextResponse.json(buildDryRunReport(requestId), { headers: rateLimitHeaders(limit, requestId) });
  }

  const report = runRefreshAll(requestId);
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

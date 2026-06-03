import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { getNewsOperationsReport } from "@/lib/deals/newsOperations";
import { recordNewsOverrideAction, type NewsOverrideAction } from "@/lib/deals/newsOverrides";

export const runtime = "nodejs";

const allowedActions = new Set<NewsOverrideAction>(["hide", "restore", "revalidate"]);

function assertAdmin(request: Request, requestId: string) {
  const url = new URL(request.url);
  if (!canAccessAdmin(url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, requestId, message: "관리자 권한이 없습니다." }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-news-operations"),
    limit: 80,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  const auth = assertAdmin(request, requestId);
  if (auth) return auth;

  return NextResponse.json(
    {
      ok: true,
      requestId,
      report: getNewsOperationsReport(),
      message: "공식 할인뉴스 운영 리포트를 성공적으로 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-news-operations-write"),
    limit: 30,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json({ ok: false, requestId, message: "요청이 너무 많습니다." }, { status: 429, headers: rateLimitHeaders(limit, requestId) });
  }

  const auth = assertAdmin(request, requestId);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const action = body.action as NewsOverrideAction;
  const id = String(body.id ?? "").trim();
  const reason = String(body.reason ?? "admin_operation").trim().slice(0, 120);

  if (!allowedActions.has(action) || !id) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "action은 hide, restore, revalidate 중 하나여야 하고 id가 필요합니다."
      },
      { status: 400, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const overrides = recordNewsOverrideAction(action, id, reason || "admin_operation");

  return NextResponse.json(
    {
      ok: true,
      requestId,
      action,
      id,
      overrides: {
        hiddenCount: Object.keys(overrides.hidden).length,
        recentAudit: overrides.auditLog.slice(0, 10)
      },
      report: getNewsOperationsReport(),
      message: action === "revalidate" ? "재검증 요청이 기록되었습니다. refresh:all 실행으로 전체 링크 상태를 갱신하세요." : "공식 할인뉴스 운영 액션이 기록되었습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

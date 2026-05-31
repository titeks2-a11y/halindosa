import { NextResponse } from "next/server";
import { createRequestId, getClientKey, jsonHeaders, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { maxReportMessageLength } from "@/lib/reportConfig";
import { createDealReport, DealReportInput, saveDealReport, validateDealReport } from "@/lib/reports";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get("dealId");

  return NextResponse.json({
    ok: true,
    requestId,
    dealId,
    maxMessageLength: maxReportMessageLength,
    reasons: [
      { value: "price_changed", label: "가격이 달라요" },
      { value: "sold_out", label: "품절이에요" },
      { value: "expired", label: "이미 종료됐어요" },
      { value: "link_error", label: "링크가 이상해요" },
      { value: "wrong_info", label: "정보가 틀려요" },
      { value: "other", label: "기타" }
    ],
    message: "특가 정보 신고 사유를 불러왔습니다."
  }, { headers: jsonHeaders(requestId) });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "reports"),
    limit: 20,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "신고 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  try {
    const body = (await request.json()) as DealReportInput;
    const validation = validateDealReport(body);

    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          message: validation.message
        },
        { status: validation.status, headers: rateLimitHeaders(limit, requestId) }
      );
    }

    const report = saveDealReport(createDealReport({
      dealId: body.dealId!,
      reason: body.reason!,
      message: body.message
    }));

    // Commercial extension point:
    // Persist to Supabase, attach price/link snapshot evidence, notify the operator queue,
    // and auto-prioritize link_error/expired/sold_out reports for daily deal quality review.
    return NextResponse.json({
      ok: true,
      requestId,
      report,
      message: "신고가 접수되었습니다. 운영자가 가격과 재고를 확인할 예정입니다."
    }, { headers: rateLimitHeaders(limit, requestId) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "신고 처리 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200, headers: rateLimitHeaders(limit, requestId) }
    );
  }
}

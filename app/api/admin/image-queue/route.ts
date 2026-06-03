import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/adminAuth";
import { createRequestId, getClientKey, rateLimit, rateLimitHeaders } from "@/lib/apiGuards";
import { buildImageQualityReadiness } from "@/lib/analytics";
import { getDeals } from "@/lib/dealService";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const limit = rateLimit({
    key: getClientKey(request, "admin-image-queue"),
    limit: 30,
    windowMs: 60_000
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "이미지 보강 큐 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
      },
      { status: 429, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!canAccessAdmin(token)) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "이미지 보강 큐 접근 권한이 없습니다."
      },
      { status: 401, headers: rateLimitHeaders(limit, requestId) }
    );
  }

  const format = url.searchParams.get("format") ?? "json";
  const { deals, updatedAt, source } = await getDeals({ sort: "hot" });
  const imageQuality = buildImageQualityReadiness(deals);

  if (format === "csv") {
    const csv = toCsv(
      imageQuality.priorityDeals.map((deal, index) => ({
        rank: index + 1,
        id: deal.id,
        title: deal.title,
        mallName: deal.mallName,
        category: deal.category,
        popularityScore: deal.popularityScore,
        currentImageUrl: deal.currentImageUrl,
        imageField: deal.imageField,
        imageSourceHint: deal.imageSourceHint,
        imageSearchUrl: deal.imageSearchUrl,
        sourceName: deal.sourceName,
        sourceUrl: deal.sourceUrl,
        sourcingPriority: deal.sourcingPriority,
        priorityReason: deal.priorityReason,
        action: deal.action,
        launchTargetRate: imageQuality.sourcingPlan.launchTargetRate,
        gapToLaunchTarget: imageQuality.sourcingPlan.gapToLaunchTarget,
        weeklySourcingTarget: imageQuality.sourcingPlan.weeklySourcingTarget,
        operationCadence: imageQuality.sourcingPlan.operationCadence,
        finalPurchaseUrl: deal.finalPurchaseUrl,
        source,
        exportedAt: updatedAt
      }))
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="halindosa-image-queue-${new Date().toISOString().slice(0, 10)}.csv"`,
        ...rateLimitHeaders(limit, requestId)
      }
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      source,
      updatedAt,
      imageQuality,
      message: "할인도사 상품 이미지 보강 큐를 불러왔습니다."
    },
    { headers: rateLimitHeaders(limit, requestId) }
  );
}

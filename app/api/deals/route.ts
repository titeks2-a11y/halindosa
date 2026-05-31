import { NextResponse } from "next/server";
import { mockDeals } from "@/data/mockDeals";
import { getDeals, normalizeSort } from "@/lib/dealService";
import { normalizeDeals } from "@/lib/deals/normalizer";
import { summarizeDealQuality } from "@/lib/deals/quality";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 0);
    const minPrice = Number(searchParams.get("minPrice") ?? Number.NaN);
    const maxPrice = Number(searchParams.get("maxPrice") ?? Number.NaN);
    const result = await getDeals({
      category: searchParams.get("category")?.trim(),
      q: searchParams.get("q")?.trim(),
      sort: normalizeSort(searchParams.get("sort")),
      limit,
      priceBand: searchParams.get("priceBand")?.trim(),
      minPrice,
      maxPrice,
      freeShippingOnly: searchParams.get("freeShippingOnly") === "true",
      hotOnly: searchParams.get("hotOnly") === "true",
      endingSoonOnly: searchParams.get("endingSoonOnly") === "true",
      verifiedOnly: searchParams.get("verifiedOnly") === "true",
      mall: searchParams.get("mall")?.trim()
    });

    return NextResponse.json({
      ok: true,
      deals: result.deals,
      count: result.deals.length,
      quality: summarizeDealQuality(result.deals),
      updatedAt: result.updatedAt,
      source: result.source,
      message: "할인도사 특가 데이터를 성공적으로 불러왔습니다."
    });
  } catch (error) {
    const fallbackDeals = normalizeDeals(mockDeals, "mock");

    return NextResponse.json(
      {
        ok: false,
        deals: fallbackDeals,
        count: fallbackDeals.length,
        quality: summarizeDealQuality(fallbackDeals),
        updatedAt: new Date().toISOString(),
        source: "mock",
        message: "특가 데이터를 불러오는 중 문제가 발생해 기본 큐레이션 데이터로 대체했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

import { NextResponse } from "next/server";
import { mockDeals } from "@/data/mockDeals";
import { getDeals, normalizeSort } from "@/lib/dealService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 0);
    const result = await getDeals({
      category: searchParams.get("category")?.trim(),
      q: searchParams.get("q")?.trim(),
      sort: normalizeSort(searchParams.get("sort")),
      limit,
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
      updatedAt: result.updatedAt,
      source: result.source,
      message: "할인도사 특가 데이터를 성공적으로 불러왔습니다."
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        deals: mockDeals,
        count: mockDeals.length,
        updatedAt: new Date().toISOString(),
        source: "mock",
        message: "특가 데이터를 불러오는 중 문제가 발생해 mock 데이터로 대체했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

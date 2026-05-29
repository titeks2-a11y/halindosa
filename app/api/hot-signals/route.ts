import { NextResponse } from "next/server";
import { fetchHotSignals } from "@/lib/hotSignalProvider";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const signals = await fetchHotSignals({
      category: searchParams.get("category")?.trim(),
      q: searchParams.get("q")?.trim(),
      source: searchParams.get("source")?.trim() || "all",
      limit: Number(searchParams.get("limit") ?? 12)
    });

    return NextResponse.json({
      ok: true,
      signals,
      count: signals.length,
      updatedAt: new Date().toISOString(),
      source: "rss",
      message: "할인도사 핫딜 신호를 성공적으로 불러왔습니다."
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        signals: [],
        count: 0,
        updatedAt: new Date().toISOString(),
        source: "fallback",
        message: "핫딜 신호를 불러오지 못했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

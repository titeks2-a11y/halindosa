import { NextResponse } from "next/server";
import { getMockBusinessMetrics } from "@/lib/analytics";

export async function GET() {
  try {
    const result = await getMockBusinessMetrics();

    return NextResponse.json({
      ok: true,
      ...result,
      message: "운영 지표를 성공적으로 불러왔습니다."
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        metrics: null,
        topDeals: [],
        message: "운영 지표를 불러오는 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 200 }
    );
  }
}

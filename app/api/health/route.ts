import { NextResponse } from "next/server";
import { getDeals } from "@/lib/dealService";

export async function GET() {
  const startedAt = Date.now();

  try {
    const result = await getDeals({ limit: 1 });

    return NextResponse.json({
      ok: true,
      status: "healthy",
      service: "halindosa",
      checks: {
        dealsProvider: result.deals.length >= 1 ? "ok" : "empty",
        source: result.source
      },
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        service: "halindosa",
        checks: {
          dealsProvider: "error"
        },
        error: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString()
      },
      { status: 200 }
    );
  }
}

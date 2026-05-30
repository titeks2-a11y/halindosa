import { NextResponse } from "next/server";
import { getAffiliateConnectionStatus } from "@/lib/affiliate";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: getAffiliateConnectionStatus(),
    message: "할인도사 제휴링크 연결 상태를 불러왔습니다."
  });
}

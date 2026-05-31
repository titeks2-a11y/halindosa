import { NextResponse } from "next/server";
import { createRequestId, jsonHeaders } from "@/lib/apiGuards";
import { getSupabaseAnonServerClient, getSupabaseServiceClient } from "@/lib/auth/supabaseServer";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  let payload: { confirmText?: string } = {};
  try {
    payload = (await request.json()) as { confirmText?: string };
  } catch {
    payload = {};
  }

  if (payload.confirmText !== "탈퇴") {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "회원 탈퇴 확인 문구가 올바르지 않습니다."
      },
      { status: 400, headers: jsonHeaders(requestId) }
    );
  }

  const token = getBearerToken(request);
  const anonClient = getSupabaseAnonServerClient();
  const serviceClient = getSupabaseServiceClient();

  if (!token || !anonClient || !serviceClient) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "회원 탈퇴를 처리하려면 Supabase 서버 환경변수와 로그인 세션이 필요합니다."
      },
      { status: 503, headers: jsonHeaders(requestId) }
    );
  }

  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  const user = userData.user;

  if (userError || !user) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "로그인 세션을 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요."
      },
      { status: 401, headers: jsonHeaders(requestId) }
    );
  }

  const userId = user.id;

  await serviceClient.from("user_favorite_deals").delete().eq("user_id", userId);
  await serviceClient.from("user_recent_deals").delete().eq("user_id", userId);
  await serviceClient.from("price_drop_alerts").delete().eq("user_id", userId);
  await serviceClient.from("user_profiles").delete().eq("user_id", userId);
  await serviceClient.from("deal_click_logs").update({ user_id: null }).eq("user_id", userId);

  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        message: "인증 계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요."
      },
      { status: 500, headers: jsonHeaders(requestId) }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      requestId,
      message: "회원 탈퇴가 완료되었습니다."
    },
    { headers: jsonHeaders(requestId) }
  );
}

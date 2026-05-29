import { NextResponse } from "next/server";

const allowedHosts = new Set(["cdn.ppomppu.co.kr", "cdn2.ppomppu.co.kr", "cdn3.ppomppu.co.kr"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return NextResponse.json({ ok: false, message: "이미지 URL이 없습니다." }, { status: 400 });
    }

    const target = new URL(rawUrl);

    if (!["https:", "http:"].includes(target.protocol) || !allowedHosts.has(target.hostname)) {
      return NextResponse.json({ ok: false, message: "허용되지 않은 이미지 도메인입니다." }, { status: 400 });
    }

    const response = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Halindosa/1.0)",
        Referer: "https://www.ppomppu.co.kr/"
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok || !response.body) {
      return NextResponse.json({ ok: false, message: "이미지를 불러오지 못했습니다." }, { status: 502 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "이미지 프록시 처리 중 문제가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
